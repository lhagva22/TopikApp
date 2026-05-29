import { Request, Response } from 'express';

import { supabaseAdmin } from '../config/supabase';

const GRAMMAR_VERSION_KEY = 'korean_grammar_lessons';
const GRAMMAR_COLUMNS = `
  id,
  sort_order,
  level,
  topik_level,
  category,
  grammar_pattern,
  meaning_mn,
  form_rule,
  example_kr,
  example_mn,
  note_mn,
  is_active,
  created_at,
  updated_at
`;
const GRAMMAR_SYNC_PAGE_SIZE = 1000;

const mapCategory = (item: any) => ({
  id: String(item.id),
  slug: item.slug || '',
  title: item.title || '',
  description: item.description || '',
  level: item.level || '',
  imageUrl: item.image_url || null,
  sortOrder: item.sort_order || 0,
  isActive: Boolean(item.is_active),
  createdAt: item.created_at || null,
});

const mapLesson = (item: any) => ({
  id: String(item.id),
  title: item.title || 'Хичээл',
  description: item.description || '',
  contentType: item.content_type || 'article',
  contentUrl: item.content_url || '',
  thumbnailUrl: item.thumbnail_url || null,
  level: item.level || '',
  isPremium: Boolean(item.is_premium),
  sortOrder: item.sort_order || 0,
  createdAt: item.created_at || null,
  category: item.lesson_categories
    ? {
        id: String(item.lesson_categories.id),
        slug: item.lesson_categories.slug || '',
        title: item.lesson_categories.title || '',
      }
    : null,
});

const mapGrammarLesson = (item: any) => ({
  id: String(item.id),
  sortOrder: item.sort_order || 0,
  level: item.level || 'Beginner',
  topikLevel: item.topik_level || 'TOPIK 1',
  category: item.category || '',
  grammarPattern: item.grammar_pattern || '',
  meaningMn: item.meaning_mn || '',
  formRule: item.form_rule || '',
  exampleKr: item.example_kr || '',
  exampleMn: item.example_mn || '',
  noteMn: item.note_mn || '',
  isActive: Boolean(item.is_active),
  createdAt: item.created_at || null,
  updatedAt: item.updated_at || null,
});

const getAppDataVersion = async (key: string) => {
  const { data, error } = await supabaseAdmin
    .from('app_data_versions')
    .select('version, updated_at')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('app_data_versions')
    .insert({ key, version: 1 })
    .select('version, updated_at')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
};

const getGrammarMeta = async () => {
  const [countResult, version] = await Promise.all([
    supabaseAdmin
      .from('korean_grammar_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    getAppDataVersion(GRAMMAR_VERSION_KEY),
  ]);

  if (countResult.error) {
    throw countResult.error;
  }

  return {
    total: countResult.count || 0,
    version: version.version,
    updatedAt: version.updated_at || null,
  };
};

const fetchAllGrammarLessons = async () => {
  const lessons: any[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('korean_grammar_lessons')
      .select(GRAMMAR_COLUMNS)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + GRAMMAR_SYNC_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = data || [];
    lessons.push(...page);

    if (page.length < GRAMMAR_SYNC_PAGE_SIZE) {
      return lessons;
    }

    offset += GRAMMAR_SYNC_PAGE_SIZE;
  }
};

export const getLessonCategories = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lesson_categories')
      .select('id, slug, title, description, level, image_url, sort_order, is_active, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      categories: (data || []).map(mapCategory),
    });
  } catch (error) {
    console.error('Get lesson categories error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getLessons = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('learning_contents')
      .select(
        `
          id,
          title,
          content_type,
          description,
          content_url,
          thumbnail_url,
          level,
          is_premium,
          sort_order,
          created_at,
          lesson_categories:category_id (
            id,
            slug,
            title
          )
        `,
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      lessons: (data || []).map(mapLesson),
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getLessonsByCategory = async (req: Request, res: Response) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({ success: false, error: 'Category slug олдсонгүй' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('learning_contents')
      .select(
        `
          id,
          title,
          content_type,
          description,
          content_url,
          thumbnail_url,
          level,
          is_premium,
          sort_order,
          created_at,
          lesson_categories!inner (
            id,
            slug,
            title
          )
        `,
      )
      .eq('lesson_categories.slug', slug)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      lessons: (data || []).map(mapLesson),
    });
  } catch (error) {
    console.error('Get lessons by category error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getKoreanGrammarLessons = async (req: Request, res: Response) => {
  const { level, topikLevel, category } = req.query;

  try {
    let query = supabaseAdmin
      .from('korean_grammar_lessons')
      .select(GRAMMAR_COLUMNS)
      .eq('is_active', true);

    if (typeof level === 'string' && level.trim()) {
      query = query.eq('level', level.trim());
    }

    if (typeof topikLevel === 'string' && topikLevel.trim()) {
      query = query.eq('topik_level', topikLevel.trim());
    }

    if (typeof category === 'string' && category.trim()) {
      query = query.eq('category', category.trim());
    }

    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      lessons: (data || []).map(mapGrammarLesson),
    });
  } catch (error) {
    console.error('Get Korean grammar lessons error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getKoreanGrammarSyncMeta = async (_req: Request, res: Response) => {
  try {
    const meta = await getGrammarMeta();
    return res.json({ success: true, meta });
  } catch (error: any) {
    console.error('Get Korean grammar sync meta error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

export const syncKoreanGrammarLessons = async (_req: Request, res: Response) => {
  try {
    const lessons = (await fetchAllGrammarLessons()).map(mapGrammarLesson);
    const meta = await getGrammarMeta();

    return res.json({
      success: true,
      lessons,
      meta,
    });
  } catch (error: any) {
    console.error('Sync Korean grammar lessons error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

export const getVideoCategories = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('video_categories')
      .select('id, slug, title, description, sort_order, is_active, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const categories = (data || []).map((item: any) => ({
      id: String(item.id),
      slug: item.slug || '',
      title: item.title || '',
      description: item.description || '',
      sortOrder: item.sort_order || 0,
      isActive: Boolean(item.is_active),
      createdAt: item.created_at || null,
    }));

    return res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Get video categories error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};

export const getVideoLessons = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('video_lessons')
      .select(
        `
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          level,
          is_premium,
          sort_order,
          created_at,
          video_categories:category_id (
            id,
            slug,
            title
          )
        `,
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const lessons = (data || []).map((item: any) => ({
      id: String(item.id),
      title: item.title || 'Видео хичээл',
      description: item.description || '',
      contentUrl: item.video_url || '',
      thumbnailUrl: item.thumbnail_url || null,
      level: item.level || '',
      isPremium: Boolean(item.is_premium),
      sortOrder: item.sort_order || 0,
      createdAt: item.created_at || null,
      category: item.video_categories
        ? {
            id: String(item.video_categories.id),
            slug: item.video_categories.slug || '',
            title: item.video_categories.title || '',
          }
        : null,
    }));

    return res.json({
      success: true,
      lessons,
    });
  } catch (error) {
    console.error('Get video lessons error:', error);
    return res.status(500).json({ success: false, error: 'Серверийн алдаа гарлаа' });
  }
};
