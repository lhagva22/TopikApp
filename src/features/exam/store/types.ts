import type {
  ExamBank,
  ExamQuestion,
  ExamSession,
  StartExamResponse,
  SubmitExamResponse,
} from '../types';

export interface ExamAnswerPayload {
  questionId: string;
  selectedAnswer: string;
}

export interface ExamState {
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
  submitExam: (
    sessionId: string,
    answers: ExamAnswerPayload[],
    timeSpent: number
  ) => Promise<SubmitExamResponse | null>;
  resetSession: () => void;
  clearError: () => void;
  reset: () => void;
}
