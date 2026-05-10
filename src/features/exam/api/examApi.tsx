// src/features/exam/api/examApi.ts
import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';
import { GetExamBankResponse, GetExamResultsResponse, StartExamResponse, SubmitExamResponse } from '../types';

export const examApi = {
  getExams: () => apiRequest<GetExamBankResponse>(ENDPOINTS.EXAMS.LIST),

  getResults: () => apiRequest<GetExamResultsResponse>(ENDPOINTS.EXAMS.RESULTS),

  startExam: (examId: string) =>
    apiRequest<StartExamResponse>(ENDPOINTS.EXAMS.START(examId), { method: 'POST' }),

  submitExam: (sessionId: string, answers: any[], timeSpent: number) =>
    apiRequest<SubmitExamResponse>(ENDPOINTS.EXAMS.SUBMIT, {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers, timeSpent }),
    }),
};