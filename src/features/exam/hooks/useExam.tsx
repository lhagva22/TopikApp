// src/features/exam/hooks/useExam.ts
import { useExamStore } from '../store/examStore';
import { useSharedStore } from '../../../store/sharedStore';
import { ExamBank } from '../types';

export const useExam = () => {
  const { user } = useSharedStore();
  const store = useExamStore();

  const startExam = async (examId: string) => {
    if (user?.status !== 'premium') {
      return { success: false, error: 'Premium шаардлагатай', requiresPayment: true };
    }
    return await store.startExam(examId);
  };

  const getGroupedExams = () => ({
    TOPIK_I: store.exams.filter(e => e.exam_type === 'TOPIK_I'),
    TOPIK_II: store.exams.filter(e => e.exam_type === 'TOPIK_II'),
  });

  return {
    ...store,
    startExam,
    getGroupedExams,
    canTakeExam: user?.status === 'premium',
  };
};