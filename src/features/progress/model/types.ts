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
  explanation?: string | null;
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
  explanation?: string | null;
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

export interface RecommendationContentCategory {
  id: string;
  slug: string;
  title: string;
}

export interface RecommendationContent {
  id: string;
  title: string;
  description: string;
  contentType: string;
  contentUrl?: string | null;
  thumbnailUrl?: string | null;
  level?: string | null;
  isPremium: boolean;
  category?: RecommendationContentCategory | null;
}

export interface ProgressRecommendation {
  id: string;
  resultId?: string | null;
  reason?: string | null;
  createdAt?: Date;
  content?: RecommendationContent | null;
}

export interface WeakArea {
  category: string;
  accuracy: number;
}

export interface ProgressContextType {
  examResults: ExamResult[];
  lessonProgress: LessonProgress[];
  recommendations: ProgressRecommendation[];
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
