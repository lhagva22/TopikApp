import SQLite, { type SQLiteDatabase } from 'react-native-sqlite-storage';

import type { KoreanGrammarLesson, KoreanGrammarMeta } from '../../domain/types';

SQLite.enablePromise(true);

type GrammarCacheStatus = {
  meta: KoreanGrammarMeta;
  cachedAt: number;
  lessonCount: number;
};

type SQLiteValue = string | number | null;
type GrammarRow = {
  id: string;
  sort_order?: number | null;
  level?: KoreanGrammarLesson['level'] | null;
  topik_level?: KoreanGrammarLesson['topikLevel'] | null;
  category?: string | null;
  grammar_pattern?: string | null;
  meaning_mn?: string | null;
  form_rule?: string | null;
  example_kr?: string | null;
  example_mn?: string | null;
  note_mn?: string | null;
  is_active?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const DB_NAME = 'topik_grammar.db';
const META_TABLE = 'grammar_cache_meta';
const LESSONS_TABLE = 'korean_grammar_lessons';

let dbPromise: Promise<SQLiteDatabase> | null = null;
let isInitialized = false;

const getDatabase = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabase({ name: DB_NAME, location: 'default' });
  }

  return dbPromise;
};

const execute = async (sql: string, params: SQLiteValue[] = []) => {
  const db = await getDatabase();
  const [result] = await db.executeSql(sql, params);
  return result;
};

const ensureGrammarDatabase = async () => {
  if (isInitialized) {
    return;
  }

  await execute(`
    CREATE TABLE IF NOT EXISTS ${META_TABLE} (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS ${LESSONS_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      sort_order INTEGER NOT NULL,
      level TEXT NOT NULL,
      topik_level TEXT NOT NULL,
      category TEXT,
      grammar_pattern TEXT NOT NULL,
      meaning_mn TEXT NOT NULL,
      form_rule TEXT,
      example_kr TEXT,
      example_mn TEXT,
      note_mn TEXT,
      is_active INTEGER NOT NULL,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  await execute(`CREATE INDEX IF NOT EXISTS idx_grammar_sort_order ON ${LESSONS_TABLE}(sort_order)`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_grammar_level ON ${LESSONS_TABLE}(level)`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_grammar_topik_level ON ${LESSONS_TABLE}(topik_level)`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_grammar_category ON ${LESSONS_TABLE}(category)`);

  isInitialized = true;
};

const rowToGrammarLesson = (row: GrammarRow): KoreanGrammarLesson => ({
  id: String(row.id),
  sortOrder: Number(row.sort_order || 0),
  level: row.level || 'Beginner',
  topikLevel: row.topik_level || 'TOPIK 1',
  category: row.category || '',
  grammarPattern: row.grammar_pattern || '',
  meaningMn: row.meaning_mn || '',
  formRule: row.form_rule || '',
  exampleKr: row.example_kr || '',
  exampleMn: row.example_mn || '',
  noteMn: row.note_mn || '',
  isActive: Boolean(row.is_active),
  createdAt: row.created_at || null,
  updatedAt: row.updated_at || null,
});

const readMetaValue = async (key: string): Promise<string | null> => {
  const result = await execute(`SELECT value FROM ${META_TABLE} WHERE key = ? LIMIT 1`, [key]);
  if (result.rows.length === 0) {
    return null;
  }

  return String(result.rows.item(0).value);
};

export const clearGrammarCache = async () => {
  await ensureGrammarDatabase();
  await execute(`DELETE FROM ${LESSONS_TABLE}`);
  await execute(`DELETE FROM ${META_TABLE}`);
};

export const getGrammarCacheStatus = async (): Promise<GrammarCacheStatus | null> => {
  await ensureGrammarDatabase();

  const [metaRaw, cachedAtRaw, countResult] = await Promise.all([
    readMetaValue('meta'),
    readMetaValue('cachedAt'),
    execute(`SELECT COUNT(*) as count FROM ${LESSONS_TABLE}`),
  ]);

  if (!metaRaw || !cachedAtRaw) {
    return null;
  }

  const meta = JSON.parse(metaRaw) as KoreanGrammarMeta;
  const cachedAt = Number(cachedAtRaw);
  const lessonCount = Number(countResult.rows.item(0).count || 0);

  if (!Number.isFinite(meta.version)) {
    await clearGrammarCache();
    return null;
  }

  if (!Number.isFinite(cachedAt) || lessonCount === 0) {
    return null;
  }

  if (meta.total > 0 && lessonCount < meta.total) {
    await clearGrammarCache();
    return null;
  }

  return { meta, cachedAt, lessonCount };
};

export const saveGrammarCache = async (lessons: KoreanGrammarLesson[], meta: KoreanGrammarMeta) => {
  await ensureGrammarDatabase();
  const db = await getDatabase();

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`DELETE FROM ${LESSONS_TABLE}`);
        tx.executeSql(`DELETE FROM ${META_TABLE}`);
        tx.executeSql(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, [
          'meta',
          JSON.stringify(meta),
        ]);
        tx.executeSql(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, [
          'cachedAt',
          String(Date.now()),
        ]);

        lessons.forEach((lesson) => {
          tx.executeSql(
            `
              INSERT OR REPLACE INTO ${LESSONS_TABLE}
                (
                  id, sort_order, level, topik_level, category, grammar_pattern,
                  meaning_mn, form_rule, example_kr, example_mn, note_mn,
                  is_active, created_at, updated_at
                )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              lesson.id,
              lesson.sortOrder,
              lesson.level,
              lesson.topikLevel,
              lesson.category || null,
              lesson.grammarPattern,
              lesson.meaningMn,
              lesson.formRule || null,
              lesson.exampleKr || null,
              lesson.exampleMn || null,
              lesson.noteMn || null,
              lesson.isActive ? 1 : 0,
              lesson.createdAt || null,
              lesson.updatedAt || null,
            ],
          );
        });
      },
      (error) => reject(error),
      () => resolve(),
    );
  });
};

export const getCachedGrammarLessons = async (): Promise<KoreanGrammarLesson[]> => {
  await ensureGrammarDatabase();
  const result = await execute(`
    SELECT
      id, sort_order, level, topik_level, category, grammar_pattern,
      meaning_mn, form_rule, example_kr, example_mn, note_mn,
      is_active, created_at, updated_at
    FROM ${LESSONS_TABLE}
    ORDER BY sort_order ASC, created_at ASC
  `);

  return result.rows.raw().map(rowToGrammarLesson);
};
