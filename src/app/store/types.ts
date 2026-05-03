import type { User } from '../../features/auth/types';

export type UserStatus = 'guest' | 'registered' | 'premium';

export interface SubscriptionStatusInfo {
  daysRemaining: number;
  totalDays: number;
  daysUsed: number;
  progress: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface AppState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  error: string | null;
  isInitialized: boolean;
  initAuth: () => Promise<void>;
  updateUser: (user: User) => void;
  updateToken: (token: string | null) => void;
  resetAuth: () => Promise<void>;
  getDaysRemaining: () => number;
  getTotalDays: () => number;
  getDaysUsed: () => number;
  getSubscriptionProgress: () => number;
  getSubscriptionStatus: () => SubscriptionStatusInfo;
  getUserStatus: () => UserStatus;
  isGuestUser: () => boolean;
  isRegisteredUser: () => boolean;
  isPaidUser: () => boolean;
  canViewContent: () => boolean;
  canStudyLesson: () => boolean;
  canTakeLevelTest: () => boolean;
  canTakeMockExam: () => boolean;
  canViewProgress: () => boolean;
  canGetRecommendations: () => boolean;
  clearError: () => void;
}
