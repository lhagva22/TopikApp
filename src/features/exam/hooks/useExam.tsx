// src/features/exam/hooks/useExam.ts
import { useExamStore } from '../store/examStore';
import { useAppStore } from '../../../app/store';
import { ExamBank } from '../types';

export const useExam = () => {
  const { user } = useAppStore();
  const store = useExamStore();

  const startExam = async (examId: string) => {
    if (user?.status !== 'premium') {
      return { success: false, error: 'Premium шаардлагатай', requiresPayment: true };
    }
    return await store.startExam(examId);
  };

  const canStartExam = (exam: ExamBank) => {
    if (user?.status !== 'premium') {
      return { 
        allowed: false, 
        error: 'Premium шаардлагатай', 
        requiresPayment: true 
      };
    }
    return { allowed: true };
  };

  const getGroupedExams = () => ({
    TOPIK_I: store.exams.filter(e => e.exam_type === 'TOPIK_I'),
    TOPIK_II: store.exams.filter(e => e.exam_type === 'TOPIK_II'),
  });

  return {
    // Store state
    exams: store.exams,
    isLoading: store.isLoading,
    isStarting: store.isStarting,
    isSubmitting: store.isSubmitting,
    error: store.error,
    totalExams: store.totalExams,
    currentSession: store.currentSession,
    currentQuestions: store.currentQuestions,
    currentTest: store.currentTest,
    
    // Store actions
    getExams: store.getExams,
    startExam,
    submitExam: store.submitExam,
    resetSession: store.resetSession,
    clearError: store.clearError,
    reset: store.reset,
    
    // Custom actions
    loadExams: store.getExams,  // ✅ alias
    canStartExam,
    getGroupedExams,
    
    // Status
    canTakeExam: user?.status === 'premium',
  };
};
