import { Response } from 'express';

import { supabaseAdmin } from '../config/supabase';
import type { AuthRequest } from '../types';

export const searchDictionary = async (req: AuthRequest, res: Response) => {
  const query = String(req.query.q || '').trim();

  try {
    let request = supabaseAdmin
      .from('dictionary_words')
      .select('id, korean_word, mongolian_meaning, example_sentence, level, created_at')
      .order('korean_word', { ascending: true })
      .limit(100);

    if (query) {
      request = request.or(
        `korean_word.ilike.%${query}%,mongolian_meaning.ilike.%${query}%,example_sentence.ilike.%${query}%`,
      );
    }

    const { data, error } = await request;

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const words = (data || []).map((item: any) => ({
      id: String(item.id),
      koreanWord: item.korean_word || '',
      mongolianMeaning: item.mongolian_meaning || '',
      exampleSentence: item.example_sentence || '',
      level: item.level || null,
      createdAt: item.created_at || null,
    }));

    return res.json({
      success: true,
      words,
    });
  } catch (error) {
    console.error('Search dictionary error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getDictionaryWord = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Word id олдсонгүй' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('dictionary_words')
      .select('id, korean_word, mongolian_meaning, example_sentence, level, created_at')
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
      word: {
        id: String(data.id),
        koreanWord: data.korean_word || '',
        mongolianMeaning: data.mongolian_meaning || '',
        exampleSentence: data.example_sentence || '',
        level: data.level || null,
        createdAt: data.created_at || null,
      },
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
          dictionary_words:word_id (
            id,
            korean_word,
            mongolian_meaning,
            example_sentence,
            level,
            created_at
          )
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
      word: item.dictionary_words
        ? {
            id: String(item.dictionary_words.id),
            koreanWord: item.dictionary_words.korean_word || '',
            mongolianMeaning: item.dictionary_words.mongolian_meaning || '',
            exampleSentence: item.dictionary_words.example_sentence || '',
            level: item.dictionary_words.level || null,
            createdAt: item.dictionary_words.created_at || null,
          }
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
