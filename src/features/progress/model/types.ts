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

export interface ReviewOption {
  text: string;
  imageUrl?: string | null;
  isCorrect: boolean;
  isSelected: boolean;
}

export interface ReviewQuestion {
  id: string;
  section: 'listening' | 'reading';
  sectionLabel: string;
  questionNumber: number;
  questionText: string;
  questionImageUrl?: string | null;
  audioUrl?: string | null;
  score: number;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  options: ReviewOption[];
}

export interface ExamWeakSection extends ProgressSection {
  incorrectAnswers: number;
  accuracy: number;
}

export interface ExamResultDetail {
  result: ExamResult;
  weakSections: ExamWeakSection[];
  reviewQuestions: ReviewQuestion[];
  incorrectQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
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
