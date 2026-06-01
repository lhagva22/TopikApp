import type {
  AuthResponse,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyResetOtpRequest,
} from './types';

export interface AuthRepository {
  login(data: LoginRequest): Promise<AuthResponse>;
  googleLogin(data: GoogleLoginRequest): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<AuthResponse>;
  getProfile(): Promise<AuthResponse>;
  logout(): Promise<AuthResponse>;
  forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse>;
  verifyResetOtp(data: VerifyResetOtpRequest): Promise<AuthResponse>;
  resetPassword(data: ResetPasswordRequest): Promise<AuthResponse>;
}

export interface GoogleAuthProvider {
  getIdToken(): Promise<string | null>;
  getErrorMessage(error: unknown): string | null;
}
