// src/core/api/apiClient.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// 1. API BASE URL ТОХИРУУЛАХ
// ============================================

/**
 * API-ийн base URL-г тодорхойлно
 * Android эмулятор: 10.0.2.2
 * iOS simulator: localhost
 */
export const getBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_URL = getBaseUrl();

// ============================================
// 2. TOKEN УДИРДЛАГА
// ============================================

/**
 * Local storage-с token авах
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Local storage-д token хадгалах
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

/**
 * Local storage-с token устгах
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// ============================================
// 3. TOKEN ХҮЧИНТЭЙ ЭСЭХИЙГ ШАЛГАХ
// ============================================

/**
 * Token-ийн хугацаа дууссан эсэхийг шалгах
 */
export const isTokenExpired = async (): Promise<boolean> => {
  const token = await getToken();
  if (!token) return true;
  
  try {
    // JWT token-ий decode хийх
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // миллисекунд болгох
    return Date.now() >= exp;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

/**
 * Token хүчинтэй эсэхийг шалгах
 */
export const isTokenValid = async (): Promise<boolean> => {
  return !(await isTokenExpired());
};

// ============================================
// 4. API REQUEST HELPER
// ============================================

/**
 * API request хийх үндсэн функц
 * @param endpoint - API endpoint (жишээ: '/exams')
 * @param options - fetch options (method, body, headers)
 * @returns Promise<T> - response data
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    // Хэрэв token хүчингүй бол (401) localStorage-с устгах
    if (response.status === 401) {
      await removeToken();
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// ============================================
// 5. HTTP METHOD HELPER FUNCTIONS
// ============================================

/**
 * GET request
 */
export const get = async <T = any>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'GET' });
};

/**
 * POST request
 */
export const post = async <T = any>(endpoint: string, body?: any): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * PUT request
 */
export const put = async <T = any>(endpoint: string, body?: any): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * PATCH request
 */
export const patch = async <T = any>(endpoint: string, body?: any): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * DELETE request
 */
export const del = async <T = any>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
};

// ============================================
// 6. API ENDPOINTS CONSTANTS
// ============================================

export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Exam endpoints
  EXAMS: {
    LIST: '/exams',
    DETAIL: (id: string) => `/exams/${id}`,
    START: (id: string) => `/exam/${id}/start`,
    SUBMIT: '/exam/submit',
    RESULTS: '/exam-results',
    RESULT_DETAIL: (id: string) => `/exam-results/${id}`,
  },
  
  // Level test endpoints
  LEVEL_TEST: {
    START: '/level-test/start',
    SUBMIT: '/level-test/submit',
    HISTORY: '/level-test/history',
    RESULT: (id: string) => `/level-test/results/${id}`,
  },
  
  // Profile endpoints
  PROFILE: {
    GET: (id: string) => `/profiles/${id}`,
    UPDATE: (id: string) => `/profiles/${id}`,
    LEVEL: (id: string) => `/profiles/${id}/level`,
    UPGRADE: '/upgrade',
  },
  
  // Payment endpoints
  PAYMENT: {
    CREATE: '/payments',
    HISTORY: '/payments',
    DETAIL: (id: string) => `/payments/${id}`,
    WEBHOOK: '/payments/webhook',
  },
  
  // Lesson endpoints
  LESSONS: {
    LIST: '/lessons',
    DETAIL: (id: string) => `/lessons/${id}`,
    PROGRESS: '/lessons/progress',
  },
  
  // Dictionary endpoints
  DICTIONARY: {
    SEARCH: '/dictionary/search',
    WORD: (id: string) => `/dictionary/${id}`,
    BOOKMARKS: '/dictionary/bookmarks',
  },
};

// ============================================
// 7. DEFAULT EXPORT
// ============================================

export default {
  API_URL,
  getToken,
  setToken,
  removeToken,
  isTokenExpired,
  isTokenValid,
  apiRequest,
  get,
  post,
  put,
  patch,
  del,
  ENDPOINTS,
};