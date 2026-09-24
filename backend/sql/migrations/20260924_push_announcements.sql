BEGIN;

ALTER TABLE public.push_notification_tokens
  ADD COLUMN IF NOT EXISTS installation_id TEXT;

UPDATE public.push_notification_tokens
SET installation_id = id::TEXT
WHERE installation_id IS NULL;

ALTER TABLE public.push_notification_tokens
  ALTER COLUMN installation_id SET NOT NULL,
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.push_notification_tokens
  DROP CONSTRAINT IF EXISTS push_notification_tokens_user_id_fkey;

ALTER TABLE public.push_notification_tokens
  ADD CONSTRAINT push_notification_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS push_notification_tokens_installation_id_key
  ON public.push_notification_tokens (installation_id);

CREATE TABLE IF NOT EXISTS public.push_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 500),
  audience TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'authenticated', 'premium')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_announcements ENABLE ROW LEVEL SECURITY;

COMMIT;
