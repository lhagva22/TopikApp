export type DictionaryWord = {
  id: string;
  koreanWord: string;
  mongolianMeaning: string;
  exampleSentence?: string;
  level?: number | null;
  createdAt?: string | null;
};

export type DictionaryMeta = {
  total: number;
  version: number;
  updatedAt: string | null;
};
