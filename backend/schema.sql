CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'guest' CHECK (status IN ('guest', 'registered', 'premium')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  subscription_months INTEGER,
  current_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_test_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('TOPIK_I', 'TOPIK_II')),
  test_number INTEGER,
  description TEXT,
  total_questions INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  listening_questions INTEGER NOT NULL DEFAULT 0,
  reading_questions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id UUID NOT NULL REFERENCES mock_test_bank(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('listening', 'reading')),
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  audio_url TEXT,
  option_image_urls JSONB,
  options JSONB NOT NULL,
  question_score INTEGER NOT NULL DEFAULT 1,
  correct_answer_text TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mock_test_id, section, question_number)
);

CREATE TABLE IF NOT EXISTS level_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES mock_test_bank(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_step INTEGER NOT NULL DEFAULT 0,
  exam_sequence JSONB,
  final_level INTEGER,
  final_level_name TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS level_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES level_test_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mock_test_id UUID NOT NULL REFERENCES mock_test_bank(id) ON DELETE CASCADE,
  exam_type TEXT CHECK (exam_type IN ('TOPIK_I', 'TOPIK_II')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  listening_score INTEGER NOT NULL DEFAULT 0,
  reading_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  adjusted_score INTEGER,
  listening_answers JSONB,
  reading_answers JSONB,
  time_spent_listening INTEGER,
  time_spent_reading INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  months INTEGER NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('card', 'mobile', 'bank')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  qpay_invoice_id TEXT,
  sender_invoice_no TEXT,
  invoice_code TEXT,
  invoice_description TEXT,
  callback_received_at TIMESTAMPTZ,
  raw_response JSONB,
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS level_test_rules (
  id SERIAL PRIMARY KEY,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('TOPIK_I', 'TOPIK_II')),
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  determined_level INTEGER NOT NULL,
  determined_level_name TEXT NOT NULL,
  next_exam_type TEXT CHECK (next_exam_type IN ('TOPIK_I', 'TOPIK_II', 'none')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO level_test_rules (
  exam_type,
  min_score,
  max_score,
  determined_level,
  determined_level_name,
  next_exam_type,
  description
)
VALUES
  ('TOPIK_I', 0, 79, 0, 'Анхан шатны өмнөх', 'none', 'TOPIK I суурь түвшинд хүрээгүй'),
  ('TOPIK_I', 80, 139, 1, 'TOPIK I - 1-р түвшин', 'none', 'TOPIK I эхний түвшин'),
  ('TOPIK_I', 140, 200, 2, 'TOPIK I - 2-р түвшин', 'TOPIK_II', 'TOPIK II руу шилжих боломжтой'),
  ('TOPIK_II', 0, 119, 2, 'TOPIK I - 2-р түвшин', 'none', 'TOPIK II шалгалтад хангалтгүй'),
  ('TOPIK_II', 120, 149, 3, 'TOPIK II - 3-р түвшин', 'none', 'TOPIK II 3-р түвшин'),
  ('TOPIK_II', 150, 189, 4, 'TOPIK II - 4-р түвшин', 'none', 'TOPIK II 4-р түвшин'),
  ('TOPIK_II', 190, 229, 5, 'TOPIK II - 5-р түвшин', 'none', 'TOPIK II 5-р түвшин'),
  ('TOPIK_II', 230, 300, 6, 'TOPIK II - 6-р түвшин', 'none', 'TOPIK II 6-р түвшин')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_current_level ON profiles(current_level);
CREATE INDEX IF NOT EXISTS idx_mock_test_bank_type ON mock_test_bank(exam_type);
CREATE INDEX IF NOT EXISTS idx_mock_test_bank_active ON mock_test_bank(is_active);
CREATE INDEX IF NOT EXISTS idx_mock_test_questions_mock_test_id ON mock_test_questions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_level_test_sessions_user_id ON level_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_level_test_sessions_exam_id ON level_test_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_level_test_sessions_status ON level_test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_level_test_results_session_id ON level_test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_level_test_results_user_id ON level_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_level_test_results_mock_test_id ON level_test_results(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_qpay_invoice_id ON payments(qpay_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_sender_invoice_no ON payments(sender_invoice_no);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mock_test_bank_updated_at ON mock_test_bank;
CREATE TRIGGER update_mock_test_bank_updated_at
BEFORE UPDATE ON mock_test_bank
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view mock tests" ON mock_test_bank;
CREATE POLICY "Anyone can view mock tests"
ON mock_test_bank
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view mock test questions" ON mock_test_questions;
CREATE POLICY "Anyone can view mock test questions"
ON mock_test_questions
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view own sessions" ON level_test_sessions;
CREATE POLICY "Users can view own sessions"
ON level_test_sessions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON level_test_sessions;
CREATE POLICY "Users can insert own sessions"
ON level_test_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON level_test_sessions;
CREATE POLICY "Users can update own sessions"
ON level_test_sessions
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own results" ON level_test_results;
CREATE POLICY "Users can view own results"
ON level_test_results
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own results" ON level_test_results;
CREATE POLICY "Users can insert own results"
ON level_test_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
ON payments
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments"
ON payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);
