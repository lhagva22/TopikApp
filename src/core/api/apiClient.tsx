import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { logError } from '../../shared/lib/errors';

export const getBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

export const API_URL = getBaseUrl();
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

export const resolveApiAssetUrl = (assetUrl?: string | null): string | null => {
  if (!assetUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl;
  }

  return `${API_ORIGIN}${assetUrl.startsWith('/') ? assetUrl : `/${assetUrl}`}`;
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    logError('Error getting token', error);
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    logError('Error setting token', error);
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (error) {
    logError('Error removing token', error);
  }
};

export const isTokenExpired = async (): Promise<boolean> => {
  const token = await getToken();
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch (error) {
    logError('Error checking token expiry', error);
    return true;
  }
};

export const isTokenValid = async (): Promise<boolean> => !(await isTokenExpired());

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    const token = await getToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      await removeToken();
    }

    return data;
  } catch (error) {
    logError('API request error', error);
    throw error;
  }
};

export const get = async <T = any>(endpoint: string): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'GET' });

export const post = async <T = any>(endpoint: string, body?: any): Promise<T> =>
  apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export const put = async <T = any>(endpoint: string, body?: any): Promise<T> =>
  apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });

export const patch = async <T = any>(endpoint: string, body?: any): Promise<T> =>
  apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });

export const del = async <T = any>(endpoint: string): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'DELETE' });

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  EXAMS: {
    LIST: '/exams',
    DETAIL: (id: string) => `/exams/${id}`,
    START: (id: string) => `/exam/${id}/start`,
    SUBMIT: '/exam/submit',
    RESULTS: '/exam-results',
    RESULT_DETAIL: (id: string) => `/exam-results/${id}`,
  },
  LEVEL_TEST: {
    START: '/level-test/start',
    SUBMIT: '/level-test/submit',
    HISTORY: '/level-test/history',
    RESULT: (id: string) => `/level-test/results/${id}`,
  },
  PROFILE: {
    GET: (id: string) => `/profiles/${id}`,
    UPDATE: (id: string) => `/profiles/${id}`,
    LEVEL: (id: string) => `/profiles/${id}/level`,
    UPGRADE: '/upgrade',
  },
  PAYMENT: {
    CREATE: '/payments',
    HISTORY: '/payments',
    DETAIL: (id: string) => `/payments/${id}`,
    WEBHOOK: '/payments/webhook',
  },
  PROGRESS: {
    SUMMARY: '/progress',
  },
  LESSONS: {
    CATEGORIES: '/lesson-categories',
    LIST: '/lessons',
    BY_CATEGORY: (slug: string) => `/lessons/category/${slug}`,
    DETAIL: (id: string) => `/lessons/${id}`,
    PROGRESS: '/lessons/progress',
  },
  VIDEO_LESSONS: {
    CATEGORIES: '/video-categories',
    LIST: '/video-lessons',
  },
  DICTIONARY: {
    SEARCH: '/dictionary/search',
    WORD: (id: string) => `/dictionary/${id}`,
    BOOKMARKS: '/dictionary/bookmarks',
  },
};

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
