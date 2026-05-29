import { get, ENDPOINTS } from '../../../core/api/apiClient';
import {
  getCachedGrammarLessons,
  getGrammarCacheStatus,
  saveGrammarCache,
} from '../storage/grammarSqlite';

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

export type KoreanGrammarLesson = {
  id: string;
  sortOrder: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  topikLevel: 'TOPIK 1' | 'TOPIK 2';
  category?: string | null;
  grammarPattern: string;
  meaningMn: string;
  formRule?: string | null;
  exampleKr?: string | null;
  exampleMn?: string | null;
  noteMn?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type KoreanGrammarLessonFilters = {
  level?: KoreanGrammarLesson['level'];
  topikLevel?: KoreanGrammarLesson['topikLevel'];
  category?: string;
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

type KoreanGrammarLessonsResponse = {
  success: boolean;
  lessons: KoreanGrammarLesson[];
  error?: string;
};

export type KoreanGrammarMeta = {
  total: number;
  version: number;
  updatedAt: string | null;
};

type KoreanGrammarMetaResponse = {
  success: boolean;
  meta?: KoreanGrammarMeta;
  error?: string;
};

type KoreanGrammarSyncResponse = KoreanGrammarLessonsResponse & {
  meta?: KoreanGrammarMeta;
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

let hasVerifiedGrammarCacheThisSession = false;

const getFallbackGrammarMeta = (lessons: KoreanGrammarLesson[]): KoreanGrammarMeta => ({
  total: lessons.length,
  version: 0,
  updatedAt: null,
});

const hasSameGrammarMeta = (
  cached: { meta: KoreanGrammarMeta },
  meta?: KoreanGrammarMeta,
): boolean =>
  Boolean(meta && cached.meta.total === meta.total && cached.meta.version === meta.version);

const fetchGrammarMeta = async (): Promise<KoreanGrammarMeta | undefined> => {
  const response = await get<KoreanGrammarMetaResponse>(ENDPOINTS.LESSONS.GRAMMAR_SYNC_META);
  if (!response.success) {
    throw new Error(response.error || 'Grammar metadata could not be loaded.');
  }

  return response.meta;
};

const syncGrammarLessons = async () => {
  console.log('[GrammarCache] syncing grammar lessons from backend');
  const response = await get<KoreanGrammarSyncResponse>(ENDPOINTS.LESSONS.GRAMMAR_SYNC);
  if (!response.success) {
    throw new Error(response.error || 'Grammar lessons could not be synced.');
  }

  const lessons = response.lessons || [];
  await saveGrammarCache(lessons, response.meta || getFallbackGrammarMeta(lessons));
  hasVerifiedGrammarCacheThisSession = true;
};

const ensureGrammarCache = async () => {
  const cached = await getGrammarCacheStatus();
  if (cached && hasVerifiedGrammarCacheThisSession) {
    return;
  }

  try {
    const remoteMeta = await fetchGrammarMeta();
    if (cached && hasSameGrammarMeta(cached, remoteMeta)) {
      console.log('[GrammarCache] using SQLite cache', {
        version: cached.meta.version,
        lessons: cached.lessonCount,
      });
      hasVerifiedGrammarCacheThisSession = true;
      return;
    }

    await syncGrammarLessons();
  } catch (error) {
    if (cached) {
      console.log('[GrammarCache] offline/fallback using SQLite cache', {
        version: cached.meta.version,
        lessons: cached.lessonCount,
      });
      hasVerifiedGrammarCacheThisSession = true;
      return;
    }

    throw error;
  }
};

const getRemoteKoreanGrammarLessons = (filters: KoreanGrammarLessonFilters = {}) => {
  const params = new URLSearchParams();

  if (filters.level) {params.append('level', filters.level);}
  if (filters.topikLevel) {params.append('topikLevel', filters.topikLevel);}
  if (filters.category) {params.append('category', filters.category);}

  const query = params.toString();
  return get<KoreanGrammarLessonsResponse>(`${ENDPOINTS.LESSONS.GRAMMAR}${query ? `?${query}` : ''}`);
};

export const lessonApi = {
  getLessonCategories: () => get<LessonCategoriesResponse>(ENDPOINTS.LESSONS.CATEGORIES),
  getLessons: () => get<LessonContentsResponse>(ENDPOINTS.LESSONS.LIST),
  getLessonsByCategory: (slug: string) => get<LessonContentsResponse>(ENDPOINTS.LESSONS.BY_CATEGORY(slug)),
  getKoreanGrammarLessons: async (filters: KoreanGrammarLessonFilters = {}): Promise<KoreanGrammarLessonsResponse> => {
    try {
      await ensureGrammarCache();
      let lessons = await getCachedGrammarLessons();

      if (filters.level) {
        lessons = lessons.filter((lesson) => lesson.level === filters.level);
      }
      if (filters.topikLevel) {
        lessons = lessons.filter((lesson) => lesson.topikLevel === filters.topikLevel);
      }
      if (filters.category) {
        lessons = lessons.filter((lesson) => lesson.category === filters.category);
      }

      return { success: true, lessons };
    } catch (error) {
      console.log('[GrammarCache] SQLite unavailable, using backend grammar lessons');
      return getRemoteKoreanGrammarLessons(filters);
    }
  },
  refreshKoreanGrammarCache: syncGrammarLessons,
  getVideoCategories: () => get<VideoCategoriesResponse>(ENDPOINTS.VIDEO_LESSONS.CATEGORIES),
  getVideoLessons: () => get<VideoLessonsResponse>(ENDPOINTS.VIDEO_LESSONS.LIST),
};
