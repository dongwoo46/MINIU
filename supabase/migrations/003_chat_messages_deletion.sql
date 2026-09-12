ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS purge_after timestamptz;

CREATE INDEX IF NOT EXISTS chat_messages_active_user_created_idx
  ON public.chat_messages(user_id, created_at DESC)
  WHERE deleted_at IS NULL;
