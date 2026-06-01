import type { ExamResult, ExamResultDetail, LessonProgress, ProgressRecommendation } from './types';

export interface ProgressResponse {
  success: boolean;
  examResults: Array<Omit<ExamResult, 'date'> & { date: string }>;
  levelTestResults?: Array<Omit<ExamResult, 'date'> & { date: string }>;
  lessonProgress: LessonProgress[];
  recommendations: Array<Omit<ProgressRecommendation, 'createdAt'> & { createdAt?: string }>;
  error?: string;
}

export interface ProgressDetailResponse {
  success: boolean;
  detail?: Omit<ExamResultDetail, 'result'> & {
    result: Omit<ExamResult, 'date'> & { date: string };
  };
  error?: string;
}

export interface ProgressRepository {
  getProgress(): Promise<ProgressResponse>;
  getResultDetail(id: string, force?: boolean): Promise<ProgressDetailResponse>;
}
