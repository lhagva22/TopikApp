import { get, ENDPOINTS } from '../../../core/api/apiClient';

export type LessonCategorySummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string | null;
};

export type LessonContent = {
  id: string;
  title: string;
  description: string;
  contentType: string;
  contentUrl: string;
  thumbnailUrl?: string | null;
  level?: string;
  isPremium: boolean;
  sortOrder: number;
  createdAt?: string | null;
  category?: {
    id: string;
    slug: string;
    title: string;
  } | null;
};

export type VideoCategorySummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string | null;
};

export type VideoLesson = {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
  thumbnailUrl?: string | null;
  level?: string;
  isPremium: boolean;
  sortOrder: number;
  createdAt?: string | null;
  category?: {
    id: string;
    slug: string;
    title: string;
  } | null;
};

type LessonCategoriesResponse = {
  success: boolean;
  categories: LessonCategorySummary[];
  error?: string;
};

type LessonContentsResponse = {
  success: boolean;
  lessons: LessonContent[];
  error?: string;
};

type VideoCategoriesResponse = {
  success: boolean;
  categories: VideoCategorySummary[];
  error?: string;
};

type VideoLessonsResponse = {
  success: boolean;
  lessons: VideoLesson[];
  error?: string;
};

export const lessonApi = {
  getLessonCategories: () => get<LessonCategoriesResponse>(ENDPOINTS.LESSONS.CATEGORIES),
  getLessons: () => get<LessonContentsResponse>(ENDPOINTS.LESSONS.LIST),
  getLessonsByCategory: (slug: string) => get<LessonContentsResponse>(ENDPOINTS.LESSONS.BY_CATEGORY(slug)),
  getVideoCategories: () => get<VideoCategoriesResponse>(ENDPOINTS.VIDEO_LESSONS.CATEGORIES),
  getVideoLessons: () => get<VideoLessonsResponse>(ENDPOINTS.VIDEO_LESSONS.LIST),
};
