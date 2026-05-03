import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand/react';

import { getToken } from '../../core/api/apiClient';
import { authApi } from '../../features/auth/api/authApi';
import type { User } from '../../features/auth/types';
import { getErrorMessage, logError } from '../../shared/lib/errors';
import type { AppState } from './types';

const GUEST_USER = {
  create: () => ({
    id: `guest_${Date.now()}`,
    email: null,
    name: 'Зочин',
    status: 'guest' as const,
    current_level: 0,
    subscription_start_date: null,
    subscription_end_date: null,
    subscription_months: null,
  }),
};

const calculateDaysRemaining = (endDate?: string | null): number => {
  if (!endDate) return 0;
  const diffTime = new Date(endDate).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const calculateTotalDays = (startDate?: string | null, endDate?: string | null): number => {
  if (!startDate || !endDate) return 0;
  const diffTime = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateDaysUsed = (startDate?: string | null, endDate?: string | null): number => {
  if (!startDate) return 0;
  const diffTime = new Date().getTime() - new Date(startDate).getTime();
  const daysUsed = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const totalDays = calculateTotalDays(startDate, endDate);
  return Math.min(daysUsed, totalDays);
};

const createUserFromProfile = (profile: any, authUser: any): User => ({
  id: authUser.id,
  email: authUser.email,
  name: profile?.name || authUser.user_metadata?.name || '',
  status: profile?.status || 'guest',
  current_level: profile?.current_level || 0,
  subscription_start_date: profile?.subscription_start_date || null,
  subscription_end_date: profile?.subscription_end_date || null,
  subscription_months: profile?.subscription_months || null,
});

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isGuest: false,
  error: null,
  isInitialized: false,

  initAuth: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });

    try {
      const token = await getToken();

      if (token) {
        const response = await authApi.getProfile();

        if (response.success && response.user) {
          set({
            user: createUserFromProfile(response.user, response.user),
            token,
            isAuthenticated: true,
            isGuest: false,
            isLoading: false,
            isInitialized: true,
          });
          return;
        }

        await AsyncStorage.removeItem('token');
      }

      const guestStr = await AsyncStorage.getItem('guestUser');
      const guestUser = guestStr ? JSON.parse(guestStr) : GUEST_USER.create();

      if (!guestStr) {
        await AsyncStorage.setItem('guestUser', JSON.stringify(guestUser));
      }

      set({
        user: guestUser,
        token: null,
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      logError('Init auth error', error);
      set({
        error: getErrorMessage(error, 'Серверт холбогдоход алдаа гарлаа.'),
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  resetAuth: async () => {
    set({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      isGuest: false,
      error: null,
      isInitialized: false,
    });
  },

  updateUser: (user: User) => {
    set({
      user,
      isAuthenticated: user.status !== 'guest',
      isGuest: user.status === 'guest',
    });
  },

  updateToken: (token: string | null) => {
    set({ token });
  },

  getDaysRemaining: () => {
    const { user, isGuest } = get();
    if (isGuest || user?.status !== 'premium') return 0;
    return calculateDaysRemaining(user.subscription_end_date);
  },

  getTotalDays: () => {
    const { user, isGuest } = get();
    if (isGuest || user?.status !== 'premium') return 0;
    return calculateTotalDays(user.subscription_start_date, user.subscription_end_date);
  },

  getDaysUsed: () => {
    const { user, isGuest } = get();
    if (isGuest || user?.status !== 'premium') return 0;
    return calculateDaysUsed(user.subscription_start_date, user.subscription_end_date);
  },

  getSubscriptionProgress: () => {
    const totalDays = get().getTotalDays();
    const daysUsed = get().getDaysUsed();
    if (totalDays === 0) return 0;
    return Math.round((daysUsed / totalDays) * 100);
  },

  getSubscriptionStatus: () => {
    const daysRemaining = get().getDaysRemaining();
    const totalDays = get().getTotalDays();
    const daysUsed = get().getDaysUsed();
    const progress = get().getSubscriptionProgress();

    return {
      daysRemaining,
      totalDays,
      daysUsed,
      progress,
      isExpired: daysRemaining <= 0,
      isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
    };
  },

  getUserStatus: () => {
    const { user, isGuest } = get();
    if (isGuest) return 'guest';
    return user?.status || 'guest';
  },

  isGuestUser: () => get().isGuest,
  isRegisteredUser: () => !get().isGuest && get().user?.status === 'registered',
  isPaidUser: () => !get().isGuest && get().user?.status === 'premium',
  canViewContent: () => true,
  canStudyLesson: () => !get().isGuest,
  canTakeLevelTest: () => get().isPaidUser(),
  canTakeMockExam: () => get().isPaidUser(),
  canViewProgress: () => !get().isGuest,
  canGetRecommendations: () => get().isPaidUser(),
  clearError: () => set({ error: null }),
}));
