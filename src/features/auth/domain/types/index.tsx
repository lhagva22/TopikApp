export interface User {
  id: string;
  email: string | null;
  name: string;
  status: 'guest' | 'registered' | 'premium';
  current_level?: number;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  subscription_months?: number | null;
  emailVerified?: boolean;
  emailConfirmedAt?: string | null;
  provider?: string;
  providers?: string[];
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

export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  message?: string;
  resetToken?: string;
  error?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetOtpRequest {
  email: string;
  token: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  password: string;
}
