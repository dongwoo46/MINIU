CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.onboarding_step AS ENUM ('email_verification', 'couple_link', 'pre_questions', 'home');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.couple_status AS ENUM ('connected', 'unlink_pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_category AS ENUM ('likes', 'dislikes', 'values', 'habits', 'tendencies');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_source_type AS ENUM ('pre_question', 'record', 'letter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.analysis_status AS ENUM ('pending', 'complete', 'failed_temporary', 'failed_permanent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.chat_role AS ENUM ('user', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('couple_connected', 'letter_received', 'affection_received', 'profile_merge_candidate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.affection_type AS ENUM ('hug', 'kiss', 'pat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.item_suggestion_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.consent_type AS ENUM (
    'terms',
    'privacy_required',
    'processor_transfer_notice',
    'ai_analysis_transfer',
    'partner_info_responsibility',
    'age_14_or_over',
    'sensitive_info',
    'marketing'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_inventory_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    SELECT count(*)
    FROM public.inventory_items
    WHERE user_id = NEW.user_id
      AND deleted_at IS NULL
      AND id <> NEW.id
  ) >= 10 THEN
    RAISE EXCEPTION 'inventory item limit exceeded';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_invitation_code(invitation_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT upper(regexp_replace(trim(invitation_code), '[^A-Za-z0-9]', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.invitation_code_check_digit(payload text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  normalized_payload text := public.normalize_invitation_code(payload);
  checksum integer := 0;
  position integer;
  value integer;
BEGIN
  IF normalized_payload !~ '^[A-HJ-NP-Z2-9]{9}$' THEN
    RETURN NULL;
  END IF;

  FOR position IN 1..9 LOOP
    value := strpos(alphabet, substr(normalized_payload, position, 1)) - 1;
    checksum := checksum + (value * (position + 2));
  END LOOP;

  RETURN substr(alphabet, (checksum % length(alphabet)) + 1, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_invitation_code(invitation_code text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.normalize_invitation_code(invitation_code) ~ '^[A-HJ-NP-Z2-9]{10}$'
    AND right(public.normalize_invitation_code(invitation_code), 1) =
      public.invitation_code_check_digit(left(public.normalize_invitation_code(invitation_code), 9));
$$;

CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  payload text := '';
  index integer;
  bytes bytea := gen_random_bytes(9);
BEGIN
  FOR index IN 0..8 LOOP
    payload := payload || substr(alphabet, (get_byte(bytes, index) % length(alphabet)) + 1, 1);
  END LOOP;
  RETURN payload || public.invitation_code_check_digit(payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_pre_question_answer_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.pre_question_sets pqs
    WHERE pqs.id = NEW.set_id
      AND pqs.user_id = NEW.user_id
      AND pqs.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'pre question answer must belong to the same user as its set';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_profile_card_source_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profile_cards pc
    WHERE pc.id = NEW.card_id
      AND pc.user_id = NEW.user_id
      AND pc.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'profile card source must belong to the same user as its card';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_profile_merge_candidate_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profile_cards source_card
    JOIN public.profile_cards target_card ON target_card.id = NEW.target_card_id
    WHERE source_card.id = NEW.source_card_id
      AND source_card.user_id = NEW.user_id
      AND target_card.user_id = NEW.user_id
      AND source_card.category = target_card.category
      AND source_card.deleted_at IS NULL
      AND target_card.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'profile merge candidate cards must belong to the same user and category';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_letter_attachment_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.letters l
    WHERE l.id = NEW.letter_id
      AND l.sender_id = NEW.uploaded_by
      AND l.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'letter attachment uploader must be the letter sender';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_inventory_suggestion_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.suggestion_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.item_suggestions suggestion
    WHERE suggestion.id = NEW.suggestion_id
      AND suggestion.user_id = NEW.user_id
      AND suggestion.status = 'accepted'
      AND suggestion.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'inventory item suggestion must be accepted by the same user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  birth_date date NOT NULL,
  email_verified_at timestamptz,
  terms_agreed_at timestamptz NOT NULL DEFAULT now(),
  required_consents_agreed_at timestamptz,
  marketing_agreed_at timestamptz,
  onboarding_step public.onboarding_step NOT NULL DEFAULT 'email_verification',
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type public.consent_type NOT NULL,
  agreed boolean NOT NULL,
  document_version text NOT NULL,
  agreed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS user_consents_user_type_idx ON public.user_consents(user_id, consent_type, agreed_at DESC);

CREATE TABLE IF NOT EXISTS public.app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS app_sessions_token_hash_idx ON public.app_sessions(token_hash)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS app_sessions_user_created_idx ON public.app_sessions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verification_codes_user_active_idx
  ON public.email_verification_codes(user_id, created_at DESC)
  WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE CHECK (public.is_valid_invitation_code(code)),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitations_created_by_status_idx ON public.invitations(created_by, status);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_invitation_per_user_idx
  ON public.invitations(created_by)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.couple_status NOT NULL DEFAULT 'connected',
  connected_at timestamptz NOT NULL DEFAULT now(),
  unlink_requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  unlink_requested_at timestamptz,
  purge_after timestamptz
);

CREATE TABLE IF NOT EXISTS public.couple_members (
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (couple_id, user_id),
  CHECK (user_id <> partner_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_couple_per_user_idx ON public.couple_members(user_id) WHERE active;
CREATE INDEX IF NOT EXISTS couple_members_partner_idx ON public.couple_members(partner_user_id) WHERE active;

CREATE TABLE IF NOT EXISTS public.pre_question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_started_on date NOT NULL,
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_pre_question_set_per_user_idx
  ON public.pre_question_sets(user_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.pre_question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES public.pre_question_sets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.profile_category NOT NULL,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pre_question_answers_user_category_idx ON public.pre_question_answers(user_id, category);

CREATE TABLE IF NOT EXISTS public.minius (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  preset text NOT NULL DEFAULT 'basic',
  hair_style text NOT NULL DEFAULT 'short',
  hair_color text NOT NULL DEFAULT 'brown',
  skin_tone text NOT NULL DEFAULT 'warm',
  face_shape text NOT NULL DEFAULT 'round',
  expression text NOT NULL DEFAULT 'smile',
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_miniu_per_user_idx
  ON public.minius(user_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 150),
  happened_on date NOT NULL,
  analysis_status public.analysis_status NOT NULL DEFAULT 'pending',
  analysis_error text,
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS records_user_created_idx ON public.records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS records_user_analysis_idx ON public.records(user_id, analysis_status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.profile_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.profile_category NOT NULL,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  user_edited boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_cards_user_category_idx ON public.profile_cards(user_id, category, updated_at DESC);
CREATE INDEX IF NOT EXISTS profile_cards_active_user_category_idx ON public.profile_cards(user_id, category, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.profile_card_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.profile_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type public.profile_source_type NOT NULL,
  source_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_card_sources_card_idx ON public.profile_card_sources(card_id);
CREATE INDEX IF NOT EXISTS profile_card_sources_record_idx ON public.profile_card_sources(source_type, source_id);
CREATE UNIQUE INDEX IF NOT EXISTS profile_card_sources_unique_source_idx
  ON public.profile_card_sources(card_id, source_type, source_id);

CREATE TABLE IF NOT EXISTS public.profile_merge_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_card_id uuid NOT NULL REFERENCES public.profile_cards(id) ON DELETE CASCADE,
  target_card_id uuid NOT NULL REFERENCES public.profile_cards(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  CHECK (source_card_id <> target_card_id)
);

CREATE INDEX IF NOT EXISTS profile_merge_candidates_user_status_idx ON public.profile_merge_candidates(user_id, status);

CREATE TABLE IF NOT EXISTS public.tone_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood text,
  endings text,
  frequent_expressions text,
  emoji_style text,
  reply_length text,
  reaction_style text,
  status public.analysis_status NOT NULL DEFAULT 'complete',
  deleted_at timestamptz,
  purge_after timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_created_idx ON public.chat_messages(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_daily_usage (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kst_date date NOT NULL,
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count BETWEEN 0 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kst_date)
);

CREATE TABLE IF NOT EXISTS public.letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  read_at timestamptz,
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS letters_recipient_unread_idx ON public.letters(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS letters_couple_created_idx ON public.letters(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS letters_active_couple_created_idx ON public.letters(couple_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.letter_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id uuid NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS letter_attachments_letter_idx ON public.letter_attachments(letter_id);
CREATE UNIQUE INDEX IF NOT EXISTS letter_attachments_storage_path_idx ON public.letter_attachments(storage_path);

CREATE TABLE IF NOT EXISTS public.affection_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  affection_type public.affection_type NOT NULL,
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS affection_recipient_created_idx ON public.affection_activities(recipient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type public.notification_type NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_type)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id uuid REFERENCES public.couples(id) ON DELETE CASCADE,
  notification_type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_active_user_created_idx ON public.notifications(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.item_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  item_name text NOT NULL,
  status public.item_suggestion_status NOT NULL DEFAULT 'pending',
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggestion_id uuid REFERENCES public.item_suggestions(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  asset_key text NOT NULL,
  equipped boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_items_user_idx ON public.inventory_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_items_active_user_idx ON public.inventory_items(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  couple_id uuid REFERENCES public.couples(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_logs_name_created_idx ON public.event_logs(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS event_logs_user_created_idx ON public.event_logs(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.has_connected_couple(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.couples c
    JOIN public.couple_members cm ON cm.couple_id = c.id
    WHERE cm.user_id = target_user_id
      AND cm.active
      AND c.status = 'connected'
      AND c.purge_after IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_connected_couple_pair(target_couple_id uuid, first_user_id uuid, second_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.couples c
    JOIN public.couple_members cm ON cm.couple_id = c.id
    WHERE c.id = target_couple_id
      AND c.status = 'connected'
      AND c.purge_after IS NULL
      AND cm.user_id = first_user_id
      AND cm.partner_user_id = second_user_id
      AND cm.active
  );
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_code text)
RETURNS TABLE(status text, couple_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_id uuid := auth.uid();
  target_invitation public.invitations%ROWTYPE;
  normalized_code text := public.normalize_invitation_code(invitation_code);
  new_couple_id uuid;
BEGIN
  IF requester_id IS NULL THEN
    RETURN QUERY SELECT 'unauthorized'::text, NULL::uuid;
    RETURN;
  END IF;

  IF public.has_connected_couple(requester_id) THEN
    RETURN QUERY SELECT 'already_connected'::text, NULL::uuid;
    RETURN;
  END IF;

  IF NOT public.is_valid_invitation_code(normalized_code) THEN
    RETURN QUERY SELECT 'invalid_code'::text, NULL::uuid;
    RETURN;
  END IF;

  SELECT *
  INTO target_invitation
  FROM public.invitations
  WHERE code = normalized_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::uuid;
    RETURN;
  END IF;

  IF target_invitation.created_by = requester_id THEN
    RETURN QUERY SELECT 'own_code'::text, NULL::uuid;
    RETURN;
  END IF;

  IF target_invitation.status <> 'pending' OR target_invitation.expires_at <= now() THEN
    UPDATE public.invitations
    SET status = 'expired'
    WHERE id = target_invitation.id
      AND status = 'pending';

    RETURN QUERY SELECT 'expired'::text, NULL::uuid;
    RETURN;
  END IF;

  IF public.has_connected_couple(target_invitation.created_by) THEN
    UPDATE public.invitations
    SET status = 'expired'
    WHERE id = target_invitation.id
      AND status = 'pending';

    RETURN QUERY SELECT 'creator_connected'::text, NULL::uuid;
    RETURN;
  END IF;

  INSERT INTO public.couples DEFAULT VALUES
  RETURNING id INTO new_couple_id;

  INSERT INTO public.couple_members (couple_id, user_id, partner_user_id)
  VALUES
    (new_couple_id, target_invitation.created_by, requester_id),
    (new_couple_id, requester_id, target_invitation.created_by);

  UPDATE public.invitations
  SET
    status = 'accepted',
    accepted_by = requester_id,
    accepted_at = now()
  WHERE id = target_invitation.id;

  INSERT INTO public.event_logs (user_id, couple_id, event_name, metadata)
  VALUES
    (requester_id, new_couple_id, 'couple_connected', '{"role":"acceptor"}'::jsonb),
    (target_invitation.created_by, new_couple_id, 'couple_connected', '{"role":"creator"}'::jsonb);

  RETURN QUERY SELECT 'accepted'::text, new_couple_id;
EXCEPTION WHEN unique_violation THEN
  RETURN QUERY SELECT 'already_connected'::text, NULL::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_invitation(invitation_ttl interval DEFAULT interval '7 days')
RETURNS TABLE(invitation_id uuid, code text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_id uuid := auth.uid();
  new_invitation public.invitations%ROWTYPE;
  generated_code text;
  attempts integer := 0;
BEGIN
  IF requester_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF public.has_connected_couple(requester_id) THEN
    RAISE EXCEPTION 'user already has a couple connection';
  END IF;

  IF invitation_ttl <= interval '0 seconds' THEN
    RAISE EXCEPTION 'invitation ttl must be positive';
  END IF;

  UPDATE public.invitations
  SET status = 'expired'
  WHERE created_by = requester_id
    AND status = 'pending';

  LOOP
    attempts := attempts + 1;
    generated_code := public.generate_invitation_code();

    BEGIN
      INSERT INTO public.invitations (created_by, code, expires_at)
      VALUES (requester_id, generated_code, now() + invitation_ttl)
      RETURNING * INTO new_invitation;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF attempts >= 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT new_invitation.id, new_invitation.code, new_invitation.expires_at;
END;
$$;

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER minius_touch_updated_at
  BEFORE UPDATE ON public.minius
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER profile_cards_touch_updated_at
  BEFORE UPDATE ON public.profile_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER tone_profiles_touch_updated_at
  BEFORE UPDATE ON public.tone_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER chat_daily_usage_touch_updated_at
  BEFORE UPDATE ON public.chat_daily_usage
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER notification_settings_touch_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER inventory_items_enforce_limit
  BEFORE INSERT ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_inventory_limit();

CREATE TRIGGER pre_question_answers_ensure_owner
  BEFORE INSERT OR UPDATE ON public.pre_question_answers
  FOR EACH ROW EXECUTE FUNCTION public.ensure_pre_question_answer_owner();

CREATE TRIGGER profile_card_sources_ensure_owner
  BEFORE INSERT OR UPDATE ON public.profile_card_sources
  FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_card_source_owner();

CREATE TRIGGER profile_merge_candidates_ensure_owner
  BEFORE INSERT OR UPDATE ON public.profile_merge_candidates
  FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_merge_candidate_owner();

CREATE TRIGGER letter_attachments_ensure_owner
  BEFORE INSERT OR UPDATE ON public.letter_attachments
  FOR EACH ROW EXECUTE FUNCTION public.ensure_letter_attachment_owner();

CREATE TRIGGER inventory_items_ensure_suggestion_owner
  BEFORE INSERT OR UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.ensure_inventory_suggestion_owner();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minius ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_card_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_merge_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tone_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affection_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles own row" ON public.profiles
  FOR ALL USING (id = auth.uid() AND deleted_at IS NULL) WITH CHECK (id = auth.uid());

CREATE POLICY "user_consents own rows" ON public.user_consents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_consents owner insert" ON public.user_consents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "invitations creator read" ON public.invitations
  FOR SELECT USING (created_by = auth.uid() OR accepted_by = auth.uid());

CREATE POLICY "couple members read own couple" ON public.couples
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.couple_members cm
    WHERE cm.couple_id = couples.id AND cm.user_id = auth.uid()
  ));

CREATE POLICY "couple_members own rows" ON public.couple_members
  FOR SELECT USING (user_id = auth.uid() OR partner_user_id = auth.uid());

CREATE POLICY "pre_question_sets own rows" ON public.pre_question_sets
  FOR ALL USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());

CREATE POLICY "pre_question_answers own rows" ON public.pre_question_answers
  FOR ALL USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());

CREATE POLICY "minius own rows" ON public.minius
  FOR ALL USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid() AND public.has_connected_couple(auth.uid()));

CREATE POLICY "records own rows" ON public.records
  FOR ALL USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());

CREATE POLICY "profile_cards own rows" ON public.profile_cards
  FOR ALL USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());

CREATE POLICY "profile_card_sources own rows" ON public.profile_card_sources
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "profile_merge_candidates own rows" ON public.profile_merge_candidates
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "tone_profiles own rows" ON public.tone_profiles
  FOR ALL USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_messages own rows" ON public.chat_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_daily_usage own rows" ON public.chat_daily_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "letters couple participants read" ON public.letters
  FOR SELECT USING (deleted_at IS NULL AND (sender_id = auth.uid() OR recipient_id = auth.uid()));

CREATE POLICY "letters sender insert" ON public.letters
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND public.is_connected_couple_pair(couple_id, sender_id, recipient_id)
  );

CREATE POLICY "letters recipient mark read" ON public.letters
  FOR UPDATE USING (recipient_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "letter_attachments letter participants read" ON public.letter_attachments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.letters l
    WHERE l.id = letter_attachments.letter_id
      AND l.deleted_at IS NULL
      AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
  ));

CREATE POLICY "letter_attachments sender insert" ON public.letter_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.letters l
      WHERE l.id = letter_attachments.letter_id
        AND l.sender_id = auth.uid()
        AND l.deleted_at IS NULL
    )
  );

CREATE POLICY "affection participants read" ON public.affection_activities
  FOR SELECT USING (deleted_at IS NULL AND (sender_id = auth.uid() OR recipient_id = auth.uid()));

CREATE POLICY "affection sender insert" ON public.affection_activities
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND public.is_connected_couple_pair(couple_id, sender_id, recipient_id)
  );

CREATE POLICY "notification_settings own rows" ON public.notification_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications own rows" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "notifications owner mark read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());

CREATE POLICY "item_suggestions own rows" ON public.item_suggestions
  FOR ALL USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());

CREATE POLICY "inventory_items own rows" ON public.inventory_items
  FOR ALL USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_logs own rows" ON public.event_logs
  FOR SELECT USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('miniu-letter-attachments', 'miniu-letter-attachments', false),
  ('miniu-tone-captures', 'miniu-tone-captures', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "letter attachment sender upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'miniu-letter-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "letter attachment participants read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'miniu-letter-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.letter_attachments la
      JOIN public.letters l ON l.id = la.letter_id
      WHERE la.storage_path = storage.objects.name
        AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
    )
  );

CREATE POLICY "tone capture owner upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'miniu-tone-captures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "tone capture owner read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'miniu-tone-captures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "tone capture owner delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'miniu-tone-captures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
