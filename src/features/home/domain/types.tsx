import type { TopikExamType, TopikQuestion } from '../../../shared/types/topik';

export interface Level {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  textColor: string;
  levelValue: number;
}

export type LevelTestExamType = TopikExamType;
export type LevelTestQuestion = TopikQuestion;

export interface LevelTestStartResponse {
  success: boolean;
  session?: { id: string; started_at: string };
  test?: {
    id: string;
    title: string;
    exam_type: LevelTestExamType;
    duration: number;
    total_questions: number;
    listening_questions: number;
    reading_questions: number;
  };
  questions?: LevelTestQuestion[];
  error?: string;
}

export interface LevelTestData {
  session: { id: string; started_at: string };
  test: {
    id: string;
    title: string;
    exam_type: LevelTestExamType;
    duration: number;
    total_questions: number;
    listening_questions: number;
    reading_questions: number;
  };
  questions: LevelTestQuestion[];
}

// ✅ error property-г тодорхой төрөлд нэмсэн
export interface StartLevelTestSuccess {
  success: true;
  data: LevelTestData;
}

export interface StartLevelTestError {
  success: false;
  error: string;
}

export type StartLevelTestResult = StartLevelTestSuccess | StartLevelTestError;

// Type guard функц
export const isStartLevelTestSuccess = (
  result: StartLevelTestResult
): result is StartLevelTestSuccess => {
  return result.success === true;
};

export const isStartLevelTestError = (
  result: StartLevelTestResult
): result is StartLevelTestError => {
  return result.success === false;
};
