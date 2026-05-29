import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { logError } from '../../shared/lib/errors';

// true = бодит утас, false = emulator
const USE_REAL_DEVICE = false;

export const getBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return USE_REAL_DEVICE
      ? 'http://10.39.170.75:5000/api'
      : 'http://10.0.2.2:5000/api';
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

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('refreshToken');
  } catch (error) {
    logError('Error getting refresh token', error);
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

export const setRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('refreshToken', refreshToken);
  } catch (error) {
    logError('Error setting refresh token', error);
  }
};

export const setSessionTokens = async (accessToken: string, refreshToken?: string | null): Promise<void> => {
  await setToken(accessToken);

  if (refreshToken) {
    await setRefreshToken(refreshToken);
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (error) {
    logError('Error removing token', error);
  }
};

export const removeAuthTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['token', 'refreshToken']);
  } catch (error) {
    logError('Error removing auth tokens', error);
  }
};

export const isTokenExpired = async (): Promise<boolean> => {
  const token = await getToken();
  if (!token) {
    return true;
  }

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

const parseApiResponse = async <T,>(response: Response, endpoint: string): Promise<T> => {
  const body = await response.text();

  if (!body.trim()) {
    throw new Error(`API returned an empty response (${response.status}) for ${endpoint}.`);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`API returned invalid JSON (${response.status}) for ${endpoint}.`);
  }
};

type RefreshResponse = {
  success: boolean;
  session?: {
    access_token: string;
    refresh_token?: string;
  };
  error?: string;
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_URL}${ENDPOINTS.AUTH.REFRESH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseApiResponse<RefreshResponse>(response, ENDPOINTS.AUTH.REFRESH);

  if (!response.ok || !data.success || !data.session?.access_token) {
    await removeAuthTokens();
    return null;
  }

  await setSessionTokens(data.session.access_token, data.session.refresh_token);
  return data.session.access_token;
};

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    const token = await getToken();

    const request = (authToken: string | null) =>
      fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...options.headers,
        },
      });

    let response = await request(token);

    if (response.status === 401 && endpoint !== ENDPOINTS.AUTH.REFRESH) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        response = await request(refreshedToken);
      }
    }

    const data = await parseApiResponse<T>(response, endpoint);

    if (response.status === 401) {
      await removeAuthTokens();
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
    GOOGLE: '/auth/google',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_OTP: '/auth/verify-reset-otp',
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
    QPAY_CREATE: '/payments/qpay/create',
    HISTORY: '/payments',
    DETAIL: (id: string) => `/payments/${id}`,
    CHECK: (id: string) => `/payments/${id}/check`,
    DEV_COMPLETE: (id: string) => `/payments/${id}/dev-complete`,
    WEBHOOK: '/payments/webhook',
  },
  PROGRESS: {
    SUMMARY: '/progress',
    DETAIL: (id: string) => `/progress/results/${id}`,
  },
  LESSONS: {
    CATEGORIES: '/lesson-categories',
    LIST: '/lessons',
    GRAMMAR: '/korean-grammar-lessons',
    GRAMMAR_SYNC: '/korean-grammar-lessons/sync',
    GRAMMAR_SYNC_META: '/korean-grammar-lessons/sync/meta',
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
    SYNC: '/dictionary/sync',
    SYNC_META: '/dictionary/sync/meta',
    WORD: (id: string) => `/dictionary/${id}`,
    BOOKMARKS: '/dictionary/bookmarks',
  },
};

export default {
  API_URL,
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  setSessionTokens,
  removeToken,
  removeAuthTokens,
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
