// backend/src/types/index.tsx

import { Request } from 'express';

export interface Profile {
  id: string;
  email: string | null;
  name: string;
  status: 'guest' | 'registered' | 'premium';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  subscription_months: number | null;
  created_at: string;
  updated_at: string;
  current_level: number;
}

export interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}

export interface LevelTestResult {
  session_id: string;
  user_id: string;
  mock_test_id: string;
  exam_type: 'TOPIK_I' | 'TOPIK_II';
  listening_score: number;
  reading_score: number;
  total_score: number;
}

