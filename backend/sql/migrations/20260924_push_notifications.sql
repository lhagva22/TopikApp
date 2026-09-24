BEGIN;

CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_notification_tokens_active_user_idx
  ON public.push_notification_tokens (user_id)
  WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.push_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_events ENABLE ROW LEVEL SECURITY;

COMMIT;
