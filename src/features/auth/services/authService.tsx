// src/features/auth/services/authService.ts
import { Platform } from 'react-native';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from '../types';

// API URL - хатуу бичих
const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/auth';  // Android emulator
  }
  return 'http://localhost:5000/api/auth';   // iOS simulator
};

const API_URL = getApiUrl();

console.log('API_URL:', API_URL);  // Шалгах

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      console.log('Register request:', data);  // Debug
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      console.log('Register response:', result);  // Debug
      return result;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      console.log('Login request:', data);  // Debug
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify(data),
      });
      const result = await response.json();
      console.log('Login response:', result);  // Debug
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  getProfile: async (token: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },
};