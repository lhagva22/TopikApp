import type { LessonRepository } from './repositories';

export const createLessonUseCases = (lessonRepository: LessonRepository) => ({
  getLessonCategories: () => lessonRepository.getLessonCategories(),
  getLessons: () => lessonRepository.getLessons(),
  getLessonsByCategory: (slug: string) => lessonRepository.getLessonsByCategory(slug),
  getKoreanGrammarLessons: () => lessonRepository.getKoreanGrammarLessons(),
  refreshKoreanGrammarCache: () => lessonRepository.refreshKoreanGrammarCache(),
  getVideoCategories: () => lessonRepository.getVideoCategories(),
  getVideoLessons: () => lessonRepository.getVideoLessons(),
});
