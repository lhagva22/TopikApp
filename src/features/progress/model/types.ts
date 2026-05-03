export interface ProgressSection {
  name: string;
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
}

export interface ExamResult {
  id: string;
  examTitle: string;
  examType: 'TOPIK I' | 'TOPIK II';
  date: Date;
  totalScore: number;
  maxScore: number;
  sections: ProgressSection[];
  duration: number;
  level?: string;
}

export interface LessonProgress {
  categoryId: string;
  lessonId: string;
  completed: boolean;
  score?: number;
  completedDate?: Date;
}

export interface WeakArea {
  category: string;
  accuracy: number;
}

export interface ProgressContextType {
  examResults: ExamResult[];
  lessonProgress: LessonProgress[];
  isLoading: boolean;
  error: string | null;
  addExamResult: (result: ExamResult) => void;
  updateLessonProgress: (progress: LessonProgress) => void;
  getAverageScore: () => number;
  getTotalExamsTaken: () => number;
  getRecentResults: (limit?: number) => ExamResult[];
  getWeakAreas: () => WeakArea[];
  reloadData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}
