import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';
import type { ExamResult, ExamResultDetail, LessonProgress } from '../model/types';

interface ProgressResponse {
  success: boolean;
  examResults: Array<
    Omit<ExamResult, 'date'> & {
      date: string;
    }
  >;
  lessonProgress: LessonProgress[];
  error?: string;
}

interface ProgressDetailResponse {
  success: boolean;
  detail?: Omit<ExamResultDetail, 'result'> & {
    result: Omit<ExamResult, 'date'> & { date: string };
  };
  error?: string;
}

export const progressApi = {
  getProgress: () => apiRequest<ProgressResponse>(ENDPOINTS.PROGRESS.SUMMARY),
  getResultDetail: (id: string) =>
    apiRequest<ProgressDetailResponse>(ENDPOINTS.PROGRESS.DETAIL(id)),
};
