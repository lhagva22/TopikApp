// src/store/sharedStore.tsx

import { create } from 'zustand/react';
import { User } from './types';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from '../features/auth/services/authService';

export type UserStatus = 'guest' | 'registered' | 'premium';

interface SharedState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  error: string | null;
  
  // Actions
  initAuth: () => Promise<void>;
  // login: (email: string, password: string) => Promise<boolean>;
  // register: (email: string, password: string, name: string) => Promise<boolean>;
  // logout: () => Promise<void>;
  // upgradeToPaid: (months: number) => Promise<boolean>;
  updateUser: (user: User) => void;
  updateToken: (token: string | null) => void;
  
  // Getters - 3 төрлийн хэрэглэгч
  getUserStatus: () => UserStatus;
  isGuestUser: () => boolean;
  isRegisteredUser: () => boolean;
  isPaidUser: () => boolean;
  
  // Permission checkers - Ямар үйлдэл хийх эрхтэй вэ?
  canViewContent: () => boolean;
  canStudyLesson: () => boolean;
  canTakeLevelTest: () => boolean;
  canTakeMockExam: () => boolean;
  canViewProgress: () => boolean;
  canGetRecommendations: () => boolean;
  
  clearError: () => void;
}

const createGuestUser = (): User => ({
  id: 'guest_' + Date.now(),
  email: null,
  name: 'Зочин',
  status: 'guest',
});

export const useSharedStore = create<SharedState>((set, get) => ({  
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isGuest: false,
  error: null,

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await authService.getProfile(token);
        if (response.success && response.user) {
          // Supabase user-г таны User интерфейс рүү хөрвүүлэх
          const supabaseUser = response.user as any;
          const user: User = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
            status: 'registered',
          };
          
          set({
            user: user,
            token: token,
            isAuthenticated: true,
            isGuest: false,
            isLoading: false,
          });
          return;
        } else {
          await AsyncStorage.removeItem('token');
        }
      }
      
      // Token байхгүй эсвэл хүчингүй бол guest
      let guestUser: User;
      const guestStr = await AsyncStorage.getItem('guestUser');
      
      if (guestStr) {
        guestUser = JSON.parse(guestStr);
      } else {
        guestUser = createGuestUser();
        await AsyncStorage.setItem('guestUser', JSON.stringify(guestUser));
      }
      
      set({
        user: guestUser,
        token: null,
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Init auth error:', error);
      set({ 
        error: 'Серверт холбогдоход алдаа гарлаа', 
        isLoading: false 
      });
    }
  },

  // upgradeToPaid: async (months: number) => {
  //   set({ isLoading: true, error: null });
  //   try {
  //     const token = get().token;
  //     if (!token) {
  //       set({ error: 'Not authenticated', isLoading: false });
  //       return false;
  //     }
  //     const response = await authService.upgradeToPaid(months, token);
  //     if (response.success && response.user) {
  //       set({
  //         user: response.user,
  //         isLoading: false,
  //       });
  //       return true;
  //     } else {
  //       set({ error: response.error || 'Upgrade failed', isLoading: false });
  //       return false;
  //     }
  //   } catch (error) {
  //     set({ error: 'Network error', isLoading: false });
  //     return false;
  //   }
  // },

  updateUser: (user: User) => {
    set({ user, isAuthenticated: user.status !== 'guest', isGuest: user.status === 'guest' });
  },

  updateToken: (token: string | null) => {
    set({ token });
  },

  getUserStatus: () => {
    const { user, isGuest } = get();
    if (isGuest) return 'guest';
    return user?.status || 'guest';
  },

  isGuestUser: () => get().isGuest,
  isRegisteredUser: () => !get().isGuest && get().user?.status === 'registered',
  isPaidUser: () => !get().isGuest && get().user?.status === 'premium',

  // Permissions
  canViewContent: () => true,
  canStudyLesson: () => !get().isGuest,
  canTakeLevelTest: () => get().isPaidUser(),
  canTakeMockExam: () => get().isPaidUser(),
  canViewProgress: () => !get().isGuest,
  canGetRecommendations: () => get().isPaidUser(),

  clearError: () => set({ error: null }),
}));