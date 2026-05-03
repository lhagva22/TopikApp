import { create } from 'zustand';

import { getErrorMessage } from '../../../shared/lib/errors';
import { examApi } from '../api/examApi';
import type { ExamState } from './types';

export const useExamStore = create<ExamState>((set) => ({
  exams: [],
  isLoading: false,
  isStarting: false,
  isSubmitting: false,
  error: null,
  totalExams: 0,
  currentSession: null,
  currentQuestions: [],
  currentTest: null,

  getExams: async () => {
    set({ isLoading: true, error: null });
    const response = await examApi.getExams();

    if (response.success) {
      set({ exams: response.exams, totalExams: response.total, isLoading: false });
      return;
    }

    set({
      error: getErrorMessage(response.error, 'Шалгалтуудыг ачаалахад алдаа гарлаа.'),
      isLoading: false,
    });
  },

  startExam: async (examId: string) => {
    set({ isStarting: true, error: null });
    const response = await examApi.startExam(examId);

    if (response.success) {
      set({
        currentSession: response.session,
        currentQuestions: response.questions,
        currentTest: response.test,
        isStarting: false,
      });
      return response;
    }

    set({
      error: getErrorMessage(response.error, 'Шалгалт эхлүүлэхэд алдаа гарлаа.'),
      isStarting: false,
    });
    return null;
  },

  submitExam: async (sessionId: string, answers: any[], timeSpent: number) => {
    set({ isSubmitting: true, error: null });
    const response = await examApi.submitExam(sessionId, answers, timeSpent);

    if (response.success) {
      set({ isSubmitting: false });
      return response;
    }

    set({
      error: getErrorMessage(response.error, 'Шалгалт дуусгахад алдаа гарлаа.'),
      isSubmitting: false,
    });
    return null;
  },

  resetSession: () =>
    set({
      currentSession: null,
      currentQuestions: [],
      currentTest: null,
      isStarting: false,
      isSubmitting: false,
    }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      exams: [],
      isLoading: false,
      error: null,
      totalExams: 0,
      currentSession: null,
      currentQuestions: [],
      currentTest: null,
      isStarting: false,
      isSubmitting: false,
    }),
}));
