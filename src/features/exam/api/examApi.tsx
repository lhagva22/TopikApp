// src/features/exam/api/examApi.ts
import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';
import {
  GetExamBankResponse,
  GetExamResultsResponse,
  StartExamResponse,
  StartLevelTestResponse,
  SubmitExamResponse,
  SubmitLevelTestResponse,
} from '../types';

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

  submitExam: (sessionId: string, answers: any[], timeSpent: number) =>
    apiRequest<SubmitExamResponse>(ENDPOINTS.EXAMS.SUBMIT, {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers, timeSpent }),
    }),

  submitLevelTest: (sessionId: string, answers: any[], timeSpent: number) =>
    apiRequest<SubmitLevelTestResponse>(ENDPOINTS.LEVEL_TEST.SUBMIT, {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers, timeSpent }),
    }),
};
