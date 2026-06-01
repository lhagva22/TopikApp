import type { TopikExamType, TopikQuestion } from '../../../../shared/types/topik';

export interface ExamBank {
  id: string;
  title: string;
  exam_type: TopikExamType;
  test_number: number;
  total_questions: number;
  duration: number;
  listening_questions: number;
  reading_questions: number;
  is_active: boolean;
}

export interface ExamSession {
  id: string;
  started_at: string;
}

export type ExamQuestion = TopikQuestion;

export interface ExamAnswerPayload {
  questionId: string;
  selectedAnswer: string;
}

export interface LevelTestData {
  session: ExamSession;
  test: {
    id: string;
    title: string;
    exam_type: TopikExamType;
    duration: number;
    total_questions: number;
    listening_questions: number;
    reading_questions: number;
  };
  questions: ExamQuestion[];
}

export interface ExamResult {
  id: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctAnswers?: number;
  percentage: number;
  listeningScore: number;
  listeningMaxScore?: number;
  listeningCorrectAnswers?: number;
  readingScore: number;
  readingMaxScore?: number;
  readingCorrectAnswers?: number;
  level?: number;
  levelName?: string;
  nextExamType?: 'TOPIK_II' | 'none';
}

export interface ExamResultSummary {
  id: string;
  exam_id: string;
  exam_title: string;
  exam_type: TopikExamType;
  total_score: number;
  max_score: number;
  listening_score: number;
  reading_score: number;
  percentage: number;
  completed_at: string;
}

// API Response types
export type GetExamResultsResponse =
  | { success: true; results: ExamResultSummary[]; total: number }
  | { success: false; error: string };

export type GetExamBankResponse =
  | {
      success: true;
      exams: ExamBank[];
      total: number;
      meta?: {
        total: number;
        latestUpdatedAt: string | null;
        questionTotal: number;
      };
    }
  | { success: false; error: string };

export type StartExamResponse =
  | { success: true; session: ExamSession; test: ExamBank; questions: ExamQuestion[] }
  | { success: false; error: string };

export type SubmitExamResponse =
  | { success: true; result: ExamResult }
  | { success: false; error: string };

export type StartLevelTestResponse =
  | ({ success: true } & LevelTestData)
  | { success: false; error: string };

export type SubmitLevelTestResponse =
  | { success: true; result: ExamResult; nextLevelTest?: LevelTestData | null }
  | { success: false; error: string };
