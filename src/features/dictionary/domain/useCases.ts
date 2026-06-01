import type { DictionaryRepository } from './repositories';

export const createDictionaryUseCases = (dictionaryRepository: DictionaryRepository) => ({
  searchWords: (query: string, options?: { limit?: number; offset?: number }) =>
    dictionaryRepository.searchCachedWords(query, options),
  refreshCache: () => dictionaryRepository.refreshCache(),
});
