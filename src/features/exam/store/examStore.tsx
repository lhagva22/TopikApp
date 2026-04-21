// src/features/exam/store/examStore.ts
import { create } from 'zustand';
import { examApi } from '../api/examApi';
import { ExamBank, ExamSession, ExamQuestion, StartExamResponse, SubmitExamResponse } from '../types';

interface ExamState {
  exams: ExamBank[];
  isLoading: boolean;
  isStarting: boolean;
  isSubmitting: boolean;
  error: string | null;
  totalExams: number;
  currentSession: ExamSession | null;
  currentQuestions: ExamQuestion[];
  currentTest: ExamBank | null;
  
  getExams: () => Promise<void>;
  startExam: (examId: string) => Promise<StartExamResponse | null>;
  submitExam: (sessionId: string, answers: any[], timeSpent: number) => Promise<SubmitExamResponse | null>;
  resetSession: () => void;
  clearError: () => void;
  reset: () => void;
}

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
    } else {
      set({ error: response.error, isLoading: false });
    }
  },

  startExam: async (examId: string) => {
    set({ isStarting: true, error: null });
    const response = await examApi.startExam(examId);
    
    if (response.success) {
      set({
        currentSession: response.session,
        currentQuestions: response.questions,
        currentTest: response.test,
        isStarting: false
      });
      return response;
    }
    set({ error: response.error, isStarting: false });
    return null;
  },

  submitExam: async (sessionId: string, answers: any[], timeSpent: number) => {
    set({ isSubmitting: true, error: null });
    const response = await examApi.submitExam(sessionId, answers, timeSpent);
    
    if (response.success) {
      set({ isSubmitting: false });
      return response;
    }
    set({ error: response.error, isSubmitting: false });
    return null;
  },

  resetSession: () => set({ 
    currentSession: null, 
    currentQuestions: [], 
    currentTest: null, 
    isStarting: false, 
    isSubmitting: false 
  }),
  clearError: () => set({ error: null }),
  reset: () => set({ 
    exams: [], 
    isLoading: false, 
    error: null, 
    totalExams: 0,
    currentSession: null,
    currentQuestions: [],
    currentTest: null,
    isStarting: false,
    isSubmitting: false 
  }),
}));