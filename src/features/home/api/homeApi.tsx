// src/features/home/api/homeApi.ts
import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';
import type { LevelTestStartResponse } from '../types';

export const homeApi = {
  getUserLevel: (userId: string) => 
    apiRequest<{ success: boolean; level: number; error?: string }>(ENDPOINTS.PROFILE.LEVEL(userId)),
  
  // Түвшин тогтоох шалгалт - EXAM-ийн шалгалтуудаас RANDOM сонгогдоно
  startLevelTest: () => 
    apiRequest<LevelTestStartResponse>(ENDPOINTS.LEVEL_TEST.START, { method: 'POST' }),
};
