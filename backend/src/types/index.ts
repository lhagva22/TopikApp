import { Request } from 'express';

export interface Profile {
  id: string;
  email: string;
  name: string;
  status: 'guest' | 'registered' | 'premium';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  subscription_months: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}