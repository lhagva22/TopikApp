import type {
  GetExamBankResponse,
  GetExamResultsResponse,
  ExamAnswerPayload,
  StartExamResponse,
  StartLevelTestResponse,
  SubmitExamResponse,
  SubmitLevelTestResponse,
} from './types';

export interface ExamRepository {
  getExams(): Promise<GetExamBankResponse>;
  getResults(): Promise<GetExamResultsResponse>;
  startExam(examId: string): Promise<StartExamResponse>;
  startLevelTest(examType?: 'TOPIK_I' | 'TOPIK_II'): Promise<StartLevelTestResponse>;
  submitExam(sessionId: string, answers: ExamAnswerPayload[], timeSpent: number): Promise<SubmitExamResponse>;
  submitLevelTest(sessionId: string, answers: ExamAnswerPayload[], timeSpent: number): Promise<SubmitLevelTestResponse>;
}
