import { apiRequest, ENDPOINTS } from '../../../core/api/apiClient';

export type DictionaryWord = {
  id: string;
  koreanWord: string;
  mongolianMeaning: string;
  exampleSentence?: string;
  level?: number | null;
  createdAt?: string | null;
};

type DictionarySearchResponse = {
  success: boolean;
  words: DictionaryWord[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
  error?: string;
};

export const dictionaryApi = {
  searchWords: (query: string, options: { limit?: number; offset?: number } = {}) =>
    apiRequest<DictionarySearchResponse>(
      `${ENDPOINTS.DICTIONARY.SEARCH}?q=${encodeURIComponent(query)}&limit=${options.limit || 200}&offset=${options.offset || 0}`,
      { method: 'GET' },
    ),
};
