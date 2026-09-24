BEGIN;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS receipt_email_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS receipt_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_email_resend_id TEXT,
  ADD COLUMN IF NOT EXISTS receipt_email_error TEXT;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_receipt_email_status_check;

-- Өмнө нь completed болсон төлбөрүүдэд хуучин мэдэгдлийг бөөнөөр илгээхгүй.
UPDATE public.payments
SET receipt_email_status = 'skipped'
WHERE status = 'completed'
  AND receipt_email_status = 'pending'
  AND receipt_email_sent_at IS NULL;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_receipt_email_status_check
  CHECK (receipt_email_status IN ('pending', 'sending', 'sent', 'failed', 'skipped'));

COMMIT;
