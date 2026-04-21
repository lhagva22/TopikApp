// src/features/exam/api/examApi.ts
import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';
import { GetExamBankResponse, StartExamResponse, SubmitExamResponse } from '../types';

export const examApi = {
  getExams: () => apiRequest<GetExamBankResponse>(ENDPOINTS.EXAMS.LIST),
  
  startExam: (examId: string) => 
    apiRequest<StartExamResponse>(ENDPOINTS.EXAMS.START(examId), { method: 'POST' }),
  
  submitExam: (sessionId: string, answers: any[], timeSpent: number) =>
    apiRequest<SubmitExamResponse>(ENDPOINTS.EXAMS.SUBMIT, {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers, timeSpent }),
    }),
};