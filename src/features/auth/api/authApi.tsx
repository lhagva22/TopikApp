// src/features/auth/api/authApi.ts
import { post, get, ENDPOINTS } from '../../../core/api/apiClient';
import { LoginRequest, RegisterRequest, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest } from '../types';

export const authApi = {
  login: (data: LoginRequest) => 
    post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, data),
  
  register: (data: RegisterRequest) => 
    post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, data),
  
  getProfile: () => 
    get<AuthResponse>(ENDPOINTS.AUTH.PROFILE),
  
  logout: () => 
    post<AuthResponse>(ENDPOINTS.AUTH.LOGOUT),
  
  forgotPassword: (data: ForgotPasswordRequest) => 
    post<AuthResponse>(ENDPOINTS.AUTH.FORGOT_PASSWORD, data),
  
  resetPassword: (data: ResetPasswordRequest) => 
    post<AuthResponse>(ENDPOINTS.AUTH.RESET_PASSWORD, data),
};