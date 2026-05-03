import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { useAppStore } from '../../../app/store';
import { getErrorMessage, logError } from '../../../shared/lib/errors';
import { authApi } from '../api/authApi';
import type { User } from '../types';
import type { AuthSession, AuthState } from './types';

const createGuestUser = (): User => ({
  id: `guest_${Date.now()}`,
  email: null,
  name: 'Зочин',
  status: 'guest',
  current_level: 0,
});

const syncSharedAuthState = (user: User, token: string | null) => {
  useAppStore.setState({
    user,
    token,
    isAuthenticated: user.status !== 'guest',
    isGuest: user.status === 'guest',
  });
};

const buildAuthState = (user: User, token: string | null) => ({
  user,
  token,
  isAuthenticated: user.status !== 'guest',
  isGuest: user.status === 'guest',
  isLoading: false,
  error: null,
});

const persistAuthenticatedUser = async (user: User, session: AuthSession) => {
  await AsyncStorage.setItem('token', session.access_token);
  syncSharedAuthState(user, session.access_token);

  return buildAuthState(user, session.access_token);
};

const createGuestState = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('guestUser');

  const guestUser = createGuestUser();
  syncSharedAuthState(guestUser, null);

  return buildAuthState(guestUser, null);
};

const failAuth = (message: string) => ({
  error: message,
  isLoading: false,
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isGuest: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.user && response.session) {
        set(await persistAuthenticatedUser(response.user, response.session));
        return true;
      }

      set(failAuth(getErrorMessage(response.error, 'Нэвтрэхэд алдаа гарлаа.')));
      return false;
    } catch (error) {
      logError('Login error', error);
      set(failAuth(getErrorMessage(error, 'Серверт холбогдоход алдаа гарлаа.')));
      return false;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.register({ email, password, name });

      if (response.success && response.user && response.session) {
        set(await persistAuthenticatedUser(response.user, response.session));
        return true;
      }

      set(failAuth(getErrorMessage(response.error, 'Бүртгүүлэхэд алдаа гарлаа.')));
      return false;
    } catch (error) {
      logError('Register error', error);
      set(failAuth(getErrorMessage(error, 'Серверт холбогдоход алдаа гарлаа.')));
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await authApi.logout();
      set(await createGuestState());
    } catch (error) {
      logError('Logout error', error);
      set({ isLoading: false });
    }
  },

  loadProfile: async () => {
    set({ isLoading: true });

    try {
      const response = await authApi.getProfile();

      if (response.success && response.user) {
        syncSharedAuthState(response.user, useAppStore.getState().token);
        set({
          ...buildAuthState(response.user, useAppStore.getState().token),
        });
        return;
      }

      set({ isLoading: false });
    } catch (error) {
      logError('Load profile error', error);
      set({ isLoading: false });
    }
  },

  setGuestUser: () => {
    const guestUser = createGuestUser();
    syncSharedAuthState(guestUser, null);
    set({
      ...buildAuthState(guestUser, null),
    });
  },

  clearError: () => set({ error: null }),
}));
