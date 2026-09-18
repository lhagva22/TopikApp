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
  sourceWordNo: string;
  senseNo: number;
  grammarPattern: string;
  partOfSpeech?: string | null;
  koreanDefinition: string;
  mongolianTranslation?: string | null;
  mongolianDefinition?: string | null;
  formRule?: string | null;
  examples: Array<{ type?: string | null; text: string }>;
  relatedWords: Array<{
    rel_word?: string;
    id?: number;
    rel_code_name?: string;
    rel_sup_no?: string;
  }>;
  source?: string | null;
  license?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
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
