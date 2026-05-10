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
  error?: string;
};

export const dictionaryApi = {
  searchWords: (query: string) =>
    apiRequest<DictionarySearchResponse>(
      `${ENDPOINTS.DICTIONARY.SEARCH}?q=${encodeURIComponent(query)}`,
      { method: 'GET' },
    ),
};
