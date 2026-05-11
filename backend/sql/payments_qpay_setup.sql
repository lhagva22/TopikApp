ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS qpay_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS sender_invoice_no TEXT,
  ADD COLUMN IF NOT EXISTS invoice_code TEXT,
  ADD COLUMN IF NOT EXISTS invoice_description TEXT,
  ADD COLUMN IF NOT EXISTS callback_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS raw_response JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_payments_qpay_invoice_id ON payments(qpay_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_sender_invoice_no ON payments(sender_invoice_no);
