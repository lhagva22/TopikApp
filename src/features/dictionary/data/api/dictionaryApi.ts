import { apiRequest, ENDPOINTS } from '../../../../core/api/apiClient';
import {
  getDictionaryCacheStatus,
  saveDictionaryCache,
  searchDictionaryCache,
} from '../storage/dictionarySqlite';
import type { DictionarySearchResponse } from '../../domain/repositories';
import type { DictionaryMeta, DictionaryWord } from '../../domain/types';

export type { DictionaryMeta, DictionaryWord } from '../../domain/types';

type DictionaryMetaResponse = {
  success: boolean;
  meta?: DictionaryMeta;
  error?: string;
};

type DictionarySyncResponse = {
  success: boolean;
  words: DictionaryWord[];
  meta?: DictionaryMeta;
  error?: string;
};

let hasVerifiedCacheThisSession = false;
let dictionarySyncPromise: Promise<void> | null = null;

const getFallbackMeta = (words: DictionaryWord[]): DictionaryMeta => ({
  total: words.length,
  version: 0,
  updatedAt: null,
});

const hasSameMeta = (cached: { meta: DictionaryMeta }, meta?: DictionaryMeta): boolean =>
  Boolean(
    meta
      && cached.meta.total === meta.total
      && cached.meta.version === meta.version,
  );

const fetchRemoteMeta = async (): Promise<DictionaryMeta | undefined> => {
  const response = await apiRequest<DictionaryMetaResponse>(ENDPOINTS.DICTIONARY.SYNC_META, { method: 'GET' });
  if (!response.success) {
    throw new Error(response.error || 'Dictionary metadata could not be loaded.');
  }

  return response.meta;
};

const performRemoteDictionarySync = async () => {
  console.log('[DictionaryCache] syncing dictionary from backend');
  const response = await apiRequest<DictionarySyncResponse>(ENDPOINTS.DICTIONARY.SYNC, { method: 'GET' });
  if (!response.success) {
    throw new Error(response.error || 'Dictionary could not be synced.');
  }

  const words = response.words || [];
  await saveDictionaryCache(words, response.meta || getFallbackMeta(words));
  hasVerifiedCacheThisSession = true;
};

const fetchRemoteDictionary = (): Promise<void> => {
  if (!dictionarySyncPromise) {
    dictionarySyncPromise = performRemoteDictionarySync().finally(() => {
      dictionarySyncPromise = null;
    });
  }

  return dictionarySyncPromise;
};

const ensureDictionaryCache = async (): Promise<boolean> => {
  const cached = await getDictionaryCacheStatus();
  if (cached && hasVerifiedCacheThisSession) {
    return true;
  }

  try {
    const remoteMeta = await fetchRemoteMeta();
    if (cached && hasSameMeta(cached, remoteMeta)) {
      console.log('[DictionaryCache] using SQLite cache', {
        version: cached.meta.version,
        words: cached.wordCount,
      });
      hasVerifiedCacheThisSession = true;
      return true;
    }

    // Keep search responsive while the large first-time cache is built once
    // in the background. Until then, callers use the paginated backend search.
    fetchRemoteDictionary().catch((error) => {
      console.log('[DictionaryCache] background sync failed', error);
    });
    return Boolean(cached);
  } catch (error) {
    if (cached) {
      console.log('[DictionaryCache] offline/fallback using SQLite cache', {
        version: cached.meta.version,
        words: cached.wordCount,
      });
      hasVerifiedCacheThisSession = true;
      return true;
    }

    return false;
  }
};

const searchRemoteWords = (query: string, options: { limit?: number; offset?: number } = {}) =>
  apiRequest<DictionarySearchResponse>(
    `${ENDPOINTS.DICTIONARY.SEARCH}?q=${encodeURIComponent(query)}&limit=${options.limit || 200}&offset=${options.offset || 0}`,
    { method: 'GET' },
  );

export const dictionaryApi = {
  searchWords: searchRemoteWords,
  searchCachedWords: async (
    query: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<DictionarySearchResponse> => {
    const limit = options.limit || 200;
    const offset = options.offset || 0;

    try {
      const cacheReady = await ensureDictionaryCache();
      if (!cacheReady) {
        return searchRemoteWords(query, { limit, offset });
      }

      const result = await searchDictionaryCache(query, { limit, offset });

      return {
        success: true,
        words: result.words,
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.words.length < result.total,
      };
    } catch (error) {
      console.log('[DictionaryCache] SQLite unavailable, using backend search');
      return searchRemoteWords(query, { limit, offset });
    }
  },
  refreshCache: fetchRemoteDictionary,
};
