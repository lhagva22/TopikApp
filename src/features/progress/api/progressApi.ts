import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';
import type { ExamResult, LessonProgress } from '../model/types';

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

export const progressApi = {
  getProgress: () => apiRequest<ProgressResponse>(ENDPOINTS.PROGRESS.SUMMARY),
};
