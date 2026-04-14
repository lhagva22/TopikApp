// src/features/auth/store/authStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { useSharedStore } from '../../../store/sharedStore';
import { User } from '../../../store/types';

interface AuthState {
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.user && response.session) {
        await AsyncStorage.setItem('token', response.session.access_token);
        
        // @ts-ignore
        const supabaseUser = response.user as any;
        
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
          status: 'registered',  // Нэвтэрсэн үед registered
        };
        
        useSharedStore.setState({
          user: user,
          token: response.session.access_token,
          isAuthenticated: true,
          isGuest: false,
        });
        
        set({ isLoading: false });
        return true;
      } else {
        set({ error: response.error || 'Нэвтрэхэд алдаа гарлаа', isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      set({ error: 'Серверт холбогдоход алдаа гарлаа', isLoading: false });
      return false;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({ email, password, name });
      
      if (response.success) {
        set({ isLoading: false });
        return true;
      } else {
        set({ error: response.error || 'Бүртгүүлэхэд алдаа гарлаа', isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Register error:', error);
      set({ error: 'Серверт холбогдоход алдаа гарлаа', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    
    const guestUser: User = {
      id: 'guest_' + Date.now(),
      email: null,
      name: 'Зочин',
      status: 'guest',
    };
    
    useSharedStore.setState({
      user: guestUser,
      token: null,
      isAuthenticated: false,
      isGuest: true,
    });
    
    set({ isLoading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));