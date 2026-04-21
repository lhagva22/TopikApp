// // src/features/auth/services/authService.ts
// import { Platform } from 'react-native';
// import { 
//   LoginRequest, 
//   RegisterRequest, 
//   AuthResponse,
//   ForgotPasswordRequest,
//   ResetPasswordRequest 
// } from '../types';

// // API URL - хатуу бичих
// const getApiUrl = () => {
//   if (Platform.OS === 'android') {
//     return 'http://10.0.2.2:5000/api/auth';  // Android emulator
//   }
//   return 'http://localhost:5000/api/auth';   // iOS simulator
// };

// const API_URL = getApiUrl();

// // console.log('API_URL:', API_URL);  // Шалгах

// export const authService = {
//   register: async (data: RegisterRequest): Promise<AuthResponse> => {
//     try {
//       const response = await fetch(`${API_URL}/register`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//       });
//       const result = await response.json();
//       // console.log('Register response:', result);  // Debug
//       return result;
//     } catch (error) {
//       // console.error('Register error:', error);
//       return { success: false, error: 'Network error' };
//     }
//   },

// // features/auth/services/authService.ts
// login: async (data: LoginRequest): Promise<AuthResponse> => {
//   try {
//     const response = await fetch(`${API_URL}/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     const result = await response.json();
//     return result;
//   } catch (error) {
//     return { success: false, error: 'Network error' };
//   }
// },

// // src/features/auth/services/authService.ts
// getProfile: async (token: string): Promise<AuthResponse> => {
//   try {
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//     console.log('🔑 GET PROFILE REQUEST');
//     console.log('📌 Token (first 50 chars):', token?.substring(0, 50) + '...');
    
//     // Token-ий decode хийж үзэх (JWT decode)
//     const parts = token.split('.');
//     if (parts.length === 3) {
//       const payload = JSON.parse(atob(parts[1]));
//       console.log('📦 Token payload:', {
//         sub: payload.sub,
//         email: payload.email,
//         exp: new Date(payload.exp * 1000).toISOString()
//       });
//     }
    
//     const response = await fetch(`${API_URL}/profile`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     });
    
//     console.log('📡 Response status:', response.status);
    
//     const data = await response.json();
//     console.log('📦 Profile response:', data);
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
//     return data;
//   } catch (error) {
//     console.error('❌ Get profile error:', error);
//     return { success: false, error: 'Network error' };
//   }
// },
//   forgotPassword: async (data: ForgotPasswordRequest): Promise<AuthResponse> => {
//     try {
//       const response = await fetch(`${API_URL}/forgot-password`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//       });
//       return await response.json();
//     } catch (error) {
//       return { success: false, error: 'Network error' };
//     }
//   },

//   resetPassword: async (data: ResetPasswordRequest): Promise<AuthResponse> => {
//     try {
//       const response = await fetch(`${API_URL}/reset-password`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//       });
//       return await response.json();
//     } catch (error) {
//       return { success: false, error: 'Network error' };
//     }
//   },
// };