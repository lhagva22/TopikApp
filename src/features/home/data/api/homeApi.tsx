import { apiRequest, ENDPOINTS } from '../../../../core/api/apiClient';
import type { LevelTestExamType, LevelTestStartResponse } from '../../domain/types';

export const homeApi = {
  getUserLevel: (userId: string) =>
    apiRequest<{ success: boolean; level: number; error?: string }>(ENDPOINTS.PROFILE.LEVEL(userId)),

  // Түвшин тогтоох шалгалт - EXAM-ийн шалгалтуудаас RANDOM сонгогдоно
  startLevelTest: (examType: LevelTestExamType = 'TOPIK_I') =>
    apiRequest<LevelTestStartResponse>(ENDPOINTS.LEVEL_TEST.START, {
      method: 'POST',
      body: JSON.stringify({ examType }),
    }),
};
