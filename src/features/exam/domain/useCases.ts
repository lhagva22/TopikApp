import type { ExamRepository } from './repositories';
import type { ExamAnswerPayload } from './types';

export const createExamUseCases = (examRepository: ExamRepository) => ({
  getExams: () => examRepository.getExams(),
  getResults: () => examRepository.getResults(),
  startExam: (examId: string) => examRepository.startExam(examId),
  startLevelTest: (examType?: 'TOPIK_I' | 'TOPIK_II') => examRepository.startLevelTest(examType),
  submitExam: (sessionId: string, answers: ExamAnswerPayload[], timeSpent: number) =>
    examRepository.submitExam(sessionId, answers, timeSpent),
  submitLevelTest: (sessionId: string, answers: ExamAnswerPayload[], timeSpent: number) =>
    examRepository.submitLevelTest(sessionId, answers, timeSpent),
});
