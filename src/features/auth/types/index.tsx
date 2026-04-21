// src/features/auth/types/index.ts
export interface User {
  id: string;
  email: string | null;
  name: string;
  status: 'guest' | 'registered' | 'premium';
  current_level?: number;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  subscription_months?: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  error?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  token: string;
}