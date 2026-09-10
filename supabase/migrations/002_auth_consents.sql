ALTER TYPE public.consent_type ADD VALUE IF NOT EXISTS 'partner_info_responsibility';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS required_consents_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_agreed_at timestamptz;
