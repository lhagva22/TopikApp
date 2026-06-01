import { create } from 'zustand';

import { getErrorMessage } from '../../../../shared/lib/errors';
import { examUseCases } from '../dependencies';
import type { ExamState } from './types';

const CHECK_INTERNET_MESSAGE = 'Интернет холболтоо шалгана уу.';

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

    try {
      const response = await examUseCases.getExams();

      if (response.success) {
        set({ exams: response.exams, totalExams: response.total, isLoading: false });
        return;
      }

      set({
        error: getErrorMessage(response.error, 'Шалгалтуудыг ачаалахад алдаа гарлаа.'),
        isLoading: false,
      });
    } catch {
      set({
        error: CHECK_INTERNET_MESSAGE,
        isLoading: false,
      });
    }
  },

  startExam: async (examId: string) => {
    set({ isStarting: true, error: null });

    try {
      const response = await examUseCases.startExam(examId);

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
    } catch {
      set({
        error: CHECK_INTERNET_MESSAGE,
        isStarting: false,
      });
      return { success: false, error: CHECK_INTERNET_MESSAGE };
    }
  },

  submitExam: async (sessionId, answers, timeSpent) => {
    set({ isSubmitting: true, error: null });
    const response = await examUseCases.submitExam(sessionId, answers, timeSpent);

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
