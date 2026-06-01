import type { DictionaryWord } from './types';

export type DictionarySearchResponse = {
  success: boolean;
  words: DictionaryWord[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
  error?: string;
};

export interface DictionaryRepository {
  searchCachedWords(
    query: string,
    options?: { limit?: number; offset?: number },
  ): Promise<DictionarySearchResponse>;
  refreshCache(): Promise<void>;
}
