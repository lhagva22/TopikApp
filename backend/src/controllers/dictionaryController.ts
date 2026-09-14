import { Response } from 'express';

import { supabaseAdmin } from '../config/supabase';
import type { AuthRequest } from '../types';

const DICTIONARY_TABLE = 'dictionary_words_v2';
const DICTIONARY_COLUMNS = 'id, korean_word, parent_word, entry_kind, homonym_no, part_of_speech, pronunciation, vocabulary_level, korean_definition, mongolian_meaning, mongolian_definition, examples, source, license, created_at';
const DICTIONARY_SYNC_PAGE_SIZE = 1000;
const DICTIONARY_VERSION_KEY = 'dictionary_words_v2';

const mapDictionaryWord = (item: any) => ({
  id: String(item.id),
  koreanWord: item.korean_word || '',
  parentWord: item.parent_word || '',
  entryKind: item.entry_kind || '',
  homonymNo: item.homonym_no ?? null,
  partOfSpeech: item.part_of_speech || '',
  pronunciation: item.pronunciation || '',
  vocabularyLevel: item.vocabulary_level || '',
  koreanDefinition: item.korean_definition || '',
  mongolianMeaning: item.mongolian_meaning || '',
  mongolianDefinition: item.mongolian_definition || '',
  examples: Array.isArray(item.examples) ? item.examples : [],
  source: item.source || '',
  license: item.license || '',
  createdAt: item.created_at || null,
});

const getDictionaryMeta = async () => {
  const [countResult, versionResult] = await Promise.all([
    supabaseAdmin
      .from(DICTIONARY_TABLE)
      .select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('app_data_versions')
      .select('version, updated_at')
      .eq('key', DICTIONARY_VERSION_KEY)
      .maybeSingle(),
  ]);

  if (countResult.error) {
    throw countResult.error;
  }

  if (versionResult.error) {
    throw versionResult.error;
  }

  let version = versionResult.data;

  if (!version) {
    const { data, error } = await supabaseAdmin
      .from('app_data_versions')
      .insert({ key: DICTIONARY_VERSION_KEY, version: 1 })
      .select('version, updated_at')
      .single();

    if (error) {
      throw error;
    }

    version = data;
  }

  return {
    total: countResult.count || 0,
    version: version.version,
    updatedAt: version.updated_at || null,
  };
};

const fetchAllDictionaryWords = async () => {
  const words: any[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(DICTIONARY_TABLE)
      .select(DICTIONARY_COLUMNS)
      .order('korean_word', { ascending: true })
      .range(offset, offset + DICTIONARY_SYNC_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = data || [];
    words.push(...page);

    if (page.length < DICTIONARY_SYNC_PAGE_SIZE) {
      return words;
    }

    offset += DICTIONARY_SYNC_PAGE_SIZE;
  }
};

export const searchDictionary = async (req: AuthRequest, res: Response) => {
  const query = String(req.query.q || '').trim();
  const limitParam = Number(req.query.limit);
  const offsetParam = Number(req.query.offset);
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(Math.floor(limitParam), 500)
    : 200;
  const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? Math.floor(offsetParam) : 0;

  try {
    let request = supabaseAdmin
      .from(DICTIONARY_TABLE)
      .select(DICTIONARY_COLUMNS, { count: 'exact' })
      .order('korean_word', { ascending: true })
      .range(offset, offset + limit - 1);

    if (query) {
      request = request.or(
        `korean_word.ilike.%${query}%,mongolian_meaning.ilike.%${query}%,mongolian_definition.ilike.%${query}%,korean_definition.ilike.%${query}%`,
      );
    }

    const { data, error, count } = await request;

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const words = (data || []).map(mapDictionaryWord);

    return res.json({
      success: true,
      words,
      total: count || 0,
      limit,
      offset,
      hasMore: offset + words.length < (count || 0),
    });
  } catch (error) {
    console.error('Search dictionary error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getDictionarySyncMeta = async (_req: AuthRequest, res: Response) => {
  try {
    const meta = await getDictionaryMeta();
    return res.json({ success: true, meta });
  } catch (error: any) {
    console.error('Get dictionary sync meta error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

export const syncDictionary = async (_req: AuthRequest, res: Response) => {
  try {
    const words = (await fetchAllDictionaryWords()).map(mapDictionaryWord);
    const meta = await getDictionaryMeta();

    return res.json({
      success: true,
      words,
      meta,
    });
  } catch (error: any) {
    console.error('Sync dictionary error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

export const getDictionaryWord = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Word id олдсонгүй' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from(DICTIONARY_TABLE)
      .select(DICTIONARY_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Үг олдсонгүй' });
    }

    return res.json({
      success: true,
      word: mapDictionaryWord(data),
    });
  } catch (error) {
    console.error('Get dictionary word error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getBookmarks = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('dictionary_bookmarks')
      .select(
        `
          id,
          created_at,
          dictionary_words_v2:word_id (${DICTIONARY_COLUMNS})
        `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const bookmarks = (data || []).map((item: any) => ({
      id: String(item.id),
      createdAt: item.created_at || null,
      word: item.dictionary_words_v2
          ? mapDictionaryWord(item.dictionary_words_v2)
        : null,
    }));

    return res.json({
      success: true,
      bookmarks,
    });
  } catch (error) {
    console.error('Get dictionary bookmarks error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const addBookmark = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { wordId } = req.body as { wordId?: string };

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!wordId) {
    return res.status(400).json({ success: false, error: 'Word id олдсонгүй' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('dictionary_bookmarks')
      .insert({
        user_id: userId,
        word_id: wordId,
      })
      .select('id, created_at')
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      bookmark: {
        id: String(data.id),
        createdAt: data.created_at || null,
      },
    });
  } catch (error) {
    console.error('Add dictionary bookmark error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const removeBookmark = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { wordId } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!wordId) {
    return res.status(400).json({ success: false, error: 'Word id олдсонгүй' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('dictionary_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('word_id', wordId);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Remove dictionary bookmark error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};
