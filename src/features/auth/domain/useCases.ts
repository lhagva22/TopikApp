import type {
  AuthRepository,
  GoogleAuthProvider,
} from './repositories';
import type {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyResetOtpRequest,
} from './types';

export const createAuthUseCases = (authRepository: AuthRepository) => ({
  login: (data: LoginRequest) => authRepository.login(data),
  googleLogin: (data: GoogleLoginRequest) => authRepository.googleLogin(data),
  register: (data: RegisterRequest) => authRepository.register(data),
  getProfile: () => authRepository.getProfile(),
  logout: () => authRepository.logout(),
  forgotPassword: (data: ForgotPasswordRequest) => authRepository.forgotPassword(data),
  verifyResetOtp: (data: VerifyResetOtpRequest) => authRepository.verifyResetOtp(data),
  resetPassword: (data: ResetPasswordRequest) => authRepository.resetPassword(data),
});

export const createGoogleAuthUseCases = (googleAuthProvider: GoogleAuthProvider) => ({
  getIdToken: () => googleAuthProvider.getIdToken(),
  getErrorMessage: (error: unknown) => googleAuthProvider.getErrorMessage(error),
});
