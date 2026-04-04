// store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'guest' | 'registered' | 'premium';

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  package?: {
    id: number;
    title: string;
    expiresAt: Date;
  };
}

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;  
  
  // Actions
  setUser: (user: User | null) => void;
  updateUserRole: (role: UserRole) => void;
  login: (user: User) => void;
  logout: () => void;
  upgradeToPremium: (packageInfo: User['package']) => void;
  setHydrated: (hydrated: boolean) => void;
  
  // Getters
  isPremium: () => boolean;
  isRegistered: () => boolean;
  canAccessContent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // === INITIAL STATE ===
      user: null,
      isLoading: false,
      isHydrated: false,

      // === ACTIONS ===
      setUser: (user) => set({ user }),
      
      updateUserRole: (role) => 
        set((state) => ({ 
          user: state.user ? { ...state.user, role } : null 
        })),
      
      login: (user) => {
        set({ 
          user, 
          isLoading: false 
        });
      },
      
      logout: () => {
        set({ 
          user: null 
        });
      },
      
      upgradeToPremium: (packageInfo) => {
        set((state) => ({
          user: state.user 
            ? { 
                ...state.user, 
                role: 'premium',
                package: packageInfo 
              } 
            : null
        }));
      },
      
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      
      // === GETTERS ===
      isPremium: () => {
        const { user } = get();
        return user?.role === 'premium';
      },
      
      isRegistered: () => {
        const { user } = get();
        return user !== null && user.role !== 'guest';
      },
      
      canAccessContent: () => {
        const { user } = get();
        return user?.role === 'premium';
      },
    }),
    {
      name: 'topik-auth-storage',           // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Зөвхөн эдгээр төлөвийг хадгална
        user: state.user,
        // isLoading болон isHydrated нь хадгалагдахгүй
      }),
      onRehydrateStorage: (state) => {
        console.log('🔄 Auth store hydration started');
        return (state, error) => {
          if (error) {
            console.error('❌ Hydration error:', error);
          } else {
            console.log('✅ Auth store hydrated successfully');
            // Hydration дууссаны дараа isHydrated-г true болгох
            state?.setHydrated(true);
          }
        };
      },
    }
  )
);

export default useAuthStore;