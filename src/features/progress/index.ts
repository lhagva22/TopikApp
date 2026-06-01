export {
  buildWeakAreas,
  getScorePercentage,
  getSectionAccuracy,
} from './domain/progressMetrics';
export { ExamReviewScreen } from './presentation/screens/ExamReviewScreen';
export { Progress } from './presentation/screens/Progress';
export { ProgressProvider, useProgress } from './presentation/providers/progressContext';
export type {
  ExamResultDetail,
  ExamWeakSection,
  ExamResult,
  LessonProgress,
  ProgressContextType,
  ProgressSection,
  ReviewOption,
  ReviewQuestion,
  WeakArea,
} from './domain/types';
