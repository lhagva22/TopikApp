// src/features/home/api/homeApi.ts
import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';

export interface LevelTestStartResponse {
  success: boolean;
  session?: { id: string; started_at: string };
  test?: {
    id: string;
    title: string;
    exam_type: 'TOPIK_I' | 'TOPIK_II';
    duration: number;
    total_questions: number;
    listening_questions: number;
    reading_questions: number;
  };
  questions?: any[];
  error?: string;
}

export const homeApi = {
  getUserLevel: (userId: string) => 
    apiRequest<{ success: boolean; level: number; error?: string }>(ENDPOINTS.PROFILE.LEVEL(userId)),
  
  // Түвшин тогтоох шалгалт - EXAM-ийн шалгалтуудаас RANDOM сонгогдоно
  startLevelTest: () => 
    apiRequest<LevelTestStartResponse>(ENDPOINTS.LEVEL_TEST.START, { method: 'POST' }),
};