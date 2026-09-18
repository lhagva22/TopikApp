import type { DictionaryRepository } from './repositories';

export const createDictionaryUseCases = (dictionaryRepository: DictionaryRepository) => ({
  searchWords: (query: string, options?: { limit?: number; offset?: number }) =>
    dictionaryRepository.searchCachedWords(query, options),
  getPracticeWords: (limit = 10) => dictionaryRepository.getPracticeWords(limit),
  getSentencePracticeWords: (limit = 100) => dictionaryRepository.getSentencePracticeWords(limit),
  refreshCache: () => dictionaryRepository.refreshCache(),
});
