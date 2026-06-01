import type {
  KoreanGrammarLesson,
  KoreanGrammarLessonFilters,
  LessonCategorySummary,
  LessonContent,
  VideoCategorySummary,
  VideoLesson,
} from './types';

export type LessonCategoriesResponse = {
  success: boolean;
  categories: LessonCategorySummary[];
  error?: string;
};

export type LessonContentsResponse = {
  success: boolean;
  lessons: LessonContent[];
  error?: string;
};

export type KoreanGrammarLessonsResponse = {
  success: boolean;
  lessons: KoreanGrammarLesson[];
  error?: string;
};

export type VideoCategoriesResponse = {
  success: boolean;
  categories: VideoCategorySummary[];
  error?: string;
};

export type VideoLessonsResponse = {
  success: boolean;
  lessons: VideoLesson[];
  error?: string;
};

export interface LessonRepository {
  getLessonCategories(): Promise<LessonCategoriesResponse>;
  getLessons(): Promise<LessonContentsResponse>;
  getLessonsByCategory(slug: string): Promise<LessonContentsResponse>;
  getKoreanGrammarLessons(filters?: KoreanGrammarLessonFilters): Promise<KoreanGrammarLessonsResponse>;
  refreshKoreanGrammarCache(): Promise<void>;
  getVideoCategories(): Promise<VideoCategoriesResponse>;
  getVideoLessons(): Promise<VideoLessonsResponse>;
}
