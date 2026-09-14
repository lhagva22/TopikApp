export type DictionaryWord = {
  id: string;
  koreanWord: string;
  mongolianMeaning: string;
  parentWord?: string;
  entryKind?: string;
  homonymNo?: number | null;
  partOfSpeech?: string;
  pronunciation?: string;
  vocabularyLevel?: string;
  koreanDefinition?: string;
  mongolianDefinition?: string;
  examples: string[];
  source?: string;
  license?: string;
  createdAt?: string | null;
};

export type DictionaryMeta = {
  total: number;
  version: number;
  updatedAt: string | null;
};
