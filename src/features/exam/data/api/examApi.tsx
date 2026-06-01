import { apiRequest, ENDPOINTS } from '../../../../core/api/apiClient';
import type {
  GetExamBankResponse,
  GetExamResultsResponse,
  ExamAnswerPayload,
  StartExamResponse,
  StartLevelTestResponse,
  SubmitExamResponse,
  SubmitLevelTestResponse,
} from '../../domain/types';

export const examApi = {
  getExams: () => apiRequest<GetExamBankResponse>(ENDPOINTS.EXAMS.LIST),

  getResults: () => apiRequest<GetExamResultsResponse>(ENDPOINTS.EXAMS.RESULTS),

  startExam: (examId: string) =>
    apiRequest<StartExamResponse>(ENDPOINTS.EXAMS.START(examId), { method: 'POST' }),

  startLevelTest: (examType: 'TOPIK_I' | 'TOPIK_II' = 'TOPIK_I') =>
    apiRequest<StartLevelTestResponse>(ENDPOINTS.LEVEL_TEST.START, {
      method: 'POST',
      body: JSON.stringify({ examType }),
    }),

  submitExam: (sessionId: string, answers: ExamAnswerPayload[], timeSpent: number) =>
    apiRequest<SubmitExamResponse>(ENDPOINTS.EXAMS.SUBMIT, {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers, timeSpent }),
    }),

  submitLevelTest: (sessionId: string, answers: ExamAnswerPayload[], timeSpent: number) =>
    apiRequest<SubmitLevelTestResponse>(ENDPOINTS.LEVEL_TEST.SUBMIT, {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers, timeSpent }),
    }),
};
