import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';
import type { ExamResult, ExamResultDetail, LessonProgress, ProgressRecommendation } from '../model/types';

interface ProgressResponse {
  success: boolean;
  examResults: Array<
    Omit<ExamResult, 'date'> & {
      date: string;
    }
  >;
  levelTestResults?: Array<
    Omit<ExamResult, 'date'> & {
      date: string;
    }
  >;
  lessonProgress: LessonProgress[];
  recommendations: Array<
    Omit<ProgressRecommendation, 'createdAt'> & {
      createdAt?: string;
    }
  >;
  error?: string;
}

interface ProgressDetailResponse {
  success: boolean;
  detail?: Omit<ExamResultDetail, 'result'> & {
    result: Omit<ExamResult, 'date'> & { date: string };
  };
  error?: string;
}

const resultDetailCache = new Map<string, ProgressDetailResponse>();

export const progressApi = {
  getProgress: () => apiRequest<ProgressResponse>(ENDPOINTS.PROGRESS.SUMMARY),
  getResultDetail: async (id: string, force = false) => {
    if (!force) {
      const cached = resultDetailCache.get(id);
      if (cached) {
        return cached;
      }
    }

    const response = await apiRequest<ProgressDetailResponse>(ENDPOINTS.PROGRESS.DETAIL(id));

    if (response.success && response.detail) {
      resultDetailCache.set(id, response);
    }

    return response;
  },
};
