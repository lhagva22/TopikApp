import type { LessonRepository } from './repositories';
import type { KoreanGrammarLessonFilters } from './types';

export const createLessonUseCases = (lessonRepository: LessonRepository) => ({
  getLessonCategories: () => lessonRepository.getLessonCategories(),
  getLessons: () => lessonRepository.getLessons(),
  getLessonsByCategory: (slug: string) => lessonRepository.getLessonsByCategory(slug),
  getKoreanGrammarLessons: (filters?: KoreanGrammarLessonFilters) =>
    lessonRepository.getKoreanGrammarLessons(filters),
  refreshKoreanGrammarCache: () => lessonRepository.refreshKoreanGrammarCache(),
  getVideoCategories: () => lessonRepository.getVideoCategories(),
  getVideoLessons: () => lessonRepository.getVideoLessons(),
});
