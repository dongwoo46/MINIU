DO $$ BEGIN
  CREATE TYPE public.onboarding_step AS ENUM ('email_verification', 'couple_link', 'pre_questions', 'home');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS required_consents_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_step public.onboarding_step NOT NULL DEFAULT 'email_verification',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS purge_after timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

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

ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.app_sessions TO authenticated, service_role;
GRANT ALL ON public.email_verification_codes TO authenticated, service_role;
