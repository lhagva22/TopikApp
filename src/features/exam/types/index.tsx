// src/features/exam/types/index.ts
export interface ExamBank {
  id: string;
  title: string;
  exam_type: 'TOPIK_I' | 'TOPIK_II';
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

export interface ExamQuestion {
  id: string;
  section: string;
  question_number: number;
  question_text: string;
  question_image_url?: string;
  options: string[];
  option_image_urls?: Array<string | null> | null;
  audio_url?: string;
}

export interface LevelTestData {
  session: ExamSession;
  test: {
    id: string;
    title: string;
    exam_type: 'TOPIK_I' | 'TOPIK_II';
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
  exam_type: 'TOPIK_I' | 'TOPIK_II';
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
  | { success: true; exams: ExamBank[]; total: number }
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
