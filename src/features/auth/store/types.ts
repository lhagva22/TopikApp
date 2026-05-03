import type { User } from '../types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setGuestUser: () => void;
  clearError: () => void;
}

export type AuthSession = {
  access_token: string;
};
