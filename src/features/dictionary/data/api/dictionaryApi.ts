import { apiRequest, ENDPOINTS } from '../../../../core/api/apiClient';
import {
  getDictionaryCacheStatus,
  getRandomDictionaryWords,
  getRandomDictionaryWordsWithExamples,
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
  hasMore?: boolean;
  error?: string;
};

let hasVerifiedCacheThisSession = false;
let dictionarySyncPromise: Promise<void> | null = null;
const SYNC_PAGE_SIZE = 1000;

export type DictionarySyncProgress = {
  downloaded: number;
  total: number;
  percent: number;
  status: 'syncing' | 'complete' | 'error';
};

const progressListeners = new Set<(progress: DictionarySyncProgress) => void>();
const emitSyncProgress = (progress: DictionarySyncProgress) => {
  progressListeners.forEach((listener) => listener(progress));
};

export const subscribeDictionarySyncProgress = (
  listener: (progress: DictionarySyncProgress) => void,
) => {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
};

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
  const meta = await fetchRemoteMeta();
  if (!meta) {throw new Error('Dictionary metadata could not be loaded.');}

  let downloaded = 0;
  emitSyncProgress({ downloaded, total: meta.total, percent: 0, status: 'syncing' });

  try {
    while (downloaded < meta.total) {
      const response = await apiRequest<DictionarySyncResponse>(
        `${ENDPOINTS.DICTIONARY.SYNC}?limit=${SYNC_PAGE_SIZE}&offset=${downloaded}`,
        { method: 'GET' },
      );
      if (!response.success) {
        throw new Error(response.error || 'Dictionary could not be synced.');
      }

      const words = response.words || [];
      if (words.length === 0) {break;}
      const nextDownloaded = downloaded + words.length;
      await saveDictionaryCache(words, meta, {
        reset: downloaded === 0,
        finalize: nextDownloaded >= meta.total || !response.hasMore,
      });
      downloaded = nextDownloaded;
      emitSyncProgress({
        downloaded,
        total: meta.total,
        percent: Math.min(100, Math.round((downloaded / meta.total) * 100)),
        status: 'syncing',
      });
    }

    if (downloaded < meta.total) {throw new Error('Dictionary sync ended before all words were received.');}

    const completedCache = await getDictionaryCacheStatus();
    if (!completedCache || completedCache.wordCount !== meta.total) {
      throw new Error(
        `Dictionary cache count mismatch: expected ${meta.total}, saved ${completedCache?.wordCount || 0}.`,
      );
    }

    hasVerifiedCacheThisSession = true;
    emitSyncProgress({ downloaded, total: meta.total, percent: 100, status: 'complete' });
  } catch (error) {
    emitSyncProgress({
      downloaded,
      total: meta.total,
      percent: meta.total > 0 ? Math.round((downloaded / meta.total) * 100) : 0,
      status: 'error',
    });
    throw error;
  }
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
  getPracticeWords: async (limit = 10): Promise<DictionaryWord[]> => {
    const cacheReady = await ensureDictionaryCache();
    if (cacheReady) {
      return getRandomDictionaryWords(limit);
    }

    const response = await searchRemoteWords('', { limit: Math.max(limit * 5, 50), offset: 0 });
    return [...(response.words || [])]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  },
  getSentencePracticeWords: async (limit = 100): Promise<DictionaryWord[]> => {
    const cacheReady = await ensureDictionaryCache();
    if (cacheReady) {
      return getRandomDictionaryWordsWithExamples(limit);
    }

    const response = await searchRemoteWords('', { limit: Math.max(limit, 100), offset: 0 });
    return (response.words || []).filter((word) => word.examples.length > 0);
  },
  refreshCache: fetchRemoteDictionary,
};
