-- Destructive: this removes every object in the public schema.
-- Use only after confirming the connected Supabase project is a development project.

DROP POLICY IF EXISTS "letter attachment sender upload" ON storage.objects;
DROP POLICY IF EXISTS "letter attachment participants read" ON storage.objects;
DROP POLICY IF EXISTS "letter attachment owner read" ON storage.objects;
DROP POLICY IF EXISTS "tone capture owner upload" ON storage.objects;
DROP POLICY IF EXISTS "tone capture owner read" ON storage.objects;
DROP POLICY IF EXISTS "tone capture owner delete" ON storage.objects;

DELETE FROM storage.objects
WHERE bucket_id IN ('miniu-letter-attachments', 'miniu-tone-captures');

DELETE FROM storage.buckets
WHERE id IN ('miniu-letter-attachments', 'miniu-tone-captures');

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
