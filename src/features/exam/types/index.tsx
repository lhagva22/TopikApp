// src/features/exam/types/index.ts
export interface ExamBank {
  id: string;
  title: string;
  exam_type: 'TOPIK_I' | 'TOPIK_II';
  year: number;
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
  options: string[];
  audio_url?: string;
}

export interface ExamResult {
  id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  listeningScore: number;
  readingScore: number;
}

// API Response types
export type GetExamBankResponse = 
  | { success: true; exams: ExamBank[]; total: number }
  | { success: false; error: string };

export type StartExamResponse = 
  | { success: true; session: ExamSession; test: ExamBank; questions: ExamQuestion[] }
  | { success: false; error: string };

export type SubmitExamResponse = 
  | { success: true; result: ExamResult }
  | { success: false; error: string };