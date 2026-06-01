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

export type KoreanGrammarMeta = {
  total: number;
  version: number;
  updatedAt: string | null;
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
