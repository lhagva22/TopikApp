import SQLite, { type SQLiteDatabase } from 'react-native-sqlite-storage';

import type { KoreanGrammarLesson, KoreanGrammarMeta } from '../../domain/types';

SQLite.enablePromise(true);

type GrammarCacheStatus = { meta: KoreanGrammarMeta; cachedAt: number; lessonCount: number };
type SQLiteValue = string | number | null;
type GrammarRow = {
  id: string; source_word_no?: string | null; sense_no?: number | null;
  grammar_pattern?: string | null; part_of_speech?: string | null;
  korean_definition?: string | null; mongolian_translation?: string | null;
  mongolian_definition?: string | null; form_rule?: string | null;
  examples?: string | null; related_words?: string | null; source?: string | null;
  license?: string | null; is_active?: number | null; created_at?: string | null;
  updated_at?: string | null;
};

const DB_NAME = 'topik_grammar.db';
const LEGACY_META_TABLE = 'grammar_cache_meta';
const LEGACY_LESSONS_TABLE = 'korean_grammar_lessons';
const META_TABLE = 'grammar_cache_meta_v2';
const LESSONS_TABLE = 'korean_grammar_lessons_v2';

let dbPromise: Promise<SQLiteDatabase> | null = null;
let isInitialized = false;

const getDatabase = async () => {
  if (!dbPromise) {dbPromise = SQLite.openDatabase({ name: DB_NAME, location: 'default' });}
  return dbPromise;
};
const execute = async (sql: string, params: SQLiteValue[] = []) => {
  const db = await getDatabase();
  const [result] = await db.executeSql(sql, params);
  return result;
};
const parseArray = <T,>(value?: string | null): T[] => {
  try {const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : [];} catch {return [];}
};

const ensureGrammarDatabase = async () => {
  if (isInitialized) {return;}
  await execute(`DROP TABLE IF EXISTS ${LEGACY_LESSONS_TABLE}`);
  await execute(`DROP TABLE IF EXISTS ${LEGACY_META_TABLE}`);
  await execute(`CREATE TABLE IF NOT EXISTS ${META_TABLE} (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`);
  await execute(`CREATE TABLE IF NOT EXISTS ${LESSONS_TABLE} (
    id TEXT PRIMARY KEY NOT NULL, source_word_no TEXT NOT NULL, sense_no INTEGER NOT NULL,
    grammar_pattern TEXT NOT NULL, part_of_speech TEXT, korean_definition TEXT NOT NULL,
    mongolian_translation TEXT, mongolian_definition TEXT, form_rule TEXT,
    examples TEXT NOT NULL DEFAULT '[]', related_words TEXT NOT NULL DEFAULT '[]',
    source TEXT, license TEXT, is_active INTEGER NOT NULL, created_at TEXT, updated_at TEXT
  )`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_grammar_v2_pattern ON ${LESSONS_TABLE}(grammar_pattern)`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_grammar_v2_source ON ${LESSONS_TABLE}(source_word_no, sense_no)`);
  isInitialized = true;
};

const rowToGrammarLesson = (row: GrammarRow): KoreanGrammarLesson => ({
  id: String(row.id), sourceWordNo: row.source_word_no || '', senseNo: Number(row.sense_no || 1),
  grammarPattern: row.grammar_pattern || '', partOfSpeech: row.part_of_speech || '',
  koreanDefinition: row.korean_definition || '', mongolianTranslation: row.mongolian_translation || '',
  mongolianDefinition: row.mongolian_definition || '', formRule: row.form_rule || '',
  examples: parseArray(row.examples), relatedWords: parseArray(row.related_words),
  source: row.source || '', license: row.license || '', isActive: Boolean(row.is_active),
  createdAt: row.created_at || null, updatedAt: row.updated_at || null,
});
const readMetaValue = async (key: string): Promise<string | null> => {
  const result = await execute(`SELECT value FROM ${META_TABLE} WHERE key = ? LIMIT 1`, [key]);
  return result.rows.length === 0 ? null : String(result.rows.item(0).value);
};

export const clearGrammarCache = async () => {
  await ensureGrammarDatabase();
  await execute(`DELETE FROM ${LESSONS_TABLE}`);
  await execute(`DELETE FROM ${META_TABLE}`);
};
export const getGrammarCacheStatus = async (): Promise<GrammarCacheStatus | null> => {
  await ensureGrammarDatabase();
  const [metaRaw, cachedAtRaw, countResult] = await Promise.all([
    readMetaValue('meta'), readMetaValue('cachedAt'), execute(`SELECT COUNT(*) as count FROM ${LESSONS_TABLE}`),
  ]);
  if (!metaRaw || !cachedAtRaw) {return null;}
  const meta = JSON.parse(metaRaw) as KoreanGrammarMeta;
  const cachedAt = Number(cachedAtRaw);
  const lessonCount = Number(countResult.rows.item(0).count || 0);
  if (!Number.isFinite(meta.version) || !Number.isFinite(cachedAt) || lessonCount === 0) {return null;}
  if (meta.total > 0 && lessonCount < meta.total) {await clearGrammarCache(); return null;}
  return { meta, cachedAt, lessonCount };
};

export const saveGrammarCache = async (lessons: KoreanGrammarLesson[], meta: KoreanGrammarMeta) => {
  await ensureGrammarDatabase();
  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => db.transaction((tx) => {
    tx.executeSql(`DELETE FROM ${LESSONS_TABLE}`);
    tx.executeSql(`DELETE FROM ${META_TABLE}`);
    for (const lesson of lessons) {
      tx.executeSql(`INSERT OR REPLACE INTO ${LESSONS_TABLE}
        (id, source_word_no, sense_no, grammar_pattern, part_of_speech, korean_definition,
         mongolian_translation, mongolian_definition, form_rule, examples, related_words,
         source, license, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lesson.id, lesson.sourceWordNo, lesson.senseNo, lesson.grammarPattern, lesson.partOfSpeech || null,
       lesson.koreanDefinition, lesson.mongolianTranslation || null, lesson.mongolianDefinition || null,
       lesson.formRule || null, JSON.stringify(lesson.examples || []), JSON.stringify(lesson.relatedWords || []),
       lesson.source || null, lesson.license || null, lesson.isActive ? 1 : 0,
       lesson.createdAt || null, lesson.updatedAt || null]);
    }
    tx.executeSql(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, ['meta', JSON.stringify(meta)]);
    tx.executeSql(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, ['cachedAt', String(Date.now())]);
  }, reject, () => resolve()));
};

export const getCachedGrammarLessons = async (): Promise<KoreanGrammarLesson[]> => {
  await ensureGrammarDatabase();
  const result = await execute(`SELECT id, source_word_no, sense_no, grammar_pattern, part_of_speech,
    korean_definition, mongolian_translation, mongolian_definition, form_rule, examples,
    related_words, source, license, is_active, created_at, updated_at
    FROM ${LESSONS_TABLE} ORDER BY grammar_pattern COLLATE NOCASE ASC, sense_no ASC`);
  return result.rows.raw().map(rowToGrammarLesson);
};
