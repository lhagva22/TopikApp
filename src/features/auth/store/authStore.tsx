// src/features/auth/store/authStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/authApi';
import { User } from '../types';
import { useSharedStore } from '../../../store/sharedStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setGuestUser: () => void;
  clearError: () => void;
}

// Guest user үүсгэх helper
const createGuestUser = (): User => ({
  id: `guest_${Date.now()}`,
  email: null,
  name: 'Зочин',
  status: 'guest',
  current_level: 0,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isGuest: true,
  error: null,

  // Login
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.login({ email, password });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 LOGIN RESPONSE');
      console.log('Success:', response.success);
      
      if (response.success && response.user && response.session) {
        const token = response.session.access_token;
        
        // Token хадгалах
        await AsyncStorage.setItem('token', token);
        
        // SharedStore-г шинэчлэх
        useSharedStore.setState({
          user: response.user,
          token: token,
          isAuthenticated: true,
          isGuest: false,
        });
        
        console.log('✅ Login successful:', response.user.email);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        set({ 
          user: response.user, 
          token: token,
          isAuthenticated: true, 
          isGuest: false, 
          isLoading: false 
        });
        return true;
      }
      
      set({ error: response.error || 'Нэвтрэхэд алдаа гарлаа', isLoading: false });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      set({ error: 'Серверт холбогдоход алдаа гарлаа', isLoading: false });
      return false;
    }
  },

  // Register
  // src/features/auth/store/authStore.ts

register: async (email: string, password: string, name: string) => {
  set({ isLoading: true, error: null });
  
  try {
    const response = await authApi.register({ email, password, name });
    console.log('Register response:', response);
    
    if (response.success && response.user && response.session) {
      const token = response.session.access_token;
      
      // ✅ Token хадгалах (устгах биш!)
      await AsyncStorage.setItem('token', token);
      
      // ✅ Хэрэглэгчийн мэдээллийг хадгалах
      useSharedStore.setState({
        user: response.user,
        token: token,
        isAuthenticated: true,
        isGuest: false,
      });
      
      set({ 
        user: response.user,
        token: token,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false 
      });
      return true;
    }
    
    set({ error: response.error || 'Бүртгүүлэхэд алдаа гарлаа', isLoading: false });
    return false;
  } catch (error) {
    console.error('Register error:', error);
    set({ error: 'Серверт холбогдоход алдаа гарлаа', isLoading: false });
    return false;
  }
},

  // Logout
  logout: async () => {
    set({ isLoading: true });
    
    try {
      await authApi.logout();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('guestUser');
      
      const guestUser = createGuestUser();
      
      useSharedStore.setState({
        user: guestUser,
        token: null,
        isAuthenticated: false,
        isGuest: true,
      });
      
      set({
        user: guestUser,
        token: null,
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        error: null,
      });
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  // Load profile
  loadProfile: async () => {
    set({ isLoading: true });
    
    try {
      const response = await authApi.getProfile();
      
      if (response.success && response.user) {
        useSharedStore.setState({
          user: response.user,
          isAuthenticated: true,
          isGuest: false,
        });
        
        set({
          user: response.user,
          isAuthenticated: true,
          isGuest: false,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Load profile error:', error);
      set({ isLoading: false });
    }
  },

  // Set guest user
  setGuestUser: () => {
    const guestUser = createGuestUser();
    
    useSharedStore.setState({
      user: guestUser,
      token: null,
      isAuthenticated: false,
      isGuest: true,
    });
    
    set({
      user: guestUser,
      token: null,
      isAuthenticated: false,
      isGuest: true,
      error: null,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));