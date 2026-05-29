import SQLite, { type SQLiteDatabase } from 'react-native-sqlite-storage';

import type { DictionaryMeta, DictionaryWord } from '../api/dictionaryApi';

SQLite.enablePromise(true);

type DictionaryCacheStatus = {
  meta: DictionaryMeta;
  cachedAt: number;
  wordCount: number;
};

type DictionarySearchResult = {
  words: DictionaryWord[];
  total: number;
};

const DB_NAME = 'topik_dictionary.db';
const META_TABLE = 'dictionary_cache_meta';
const WORDS_TABLE = 'dictionary_words';

let dbPromise: Promise<SQLiteDatabase> | null = null;
let isInitialized = false;

const getDatabase = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabase({ name: DB_NAME, location: 'default' });
  }

  return dbPromise;
};

const execute = async (sql: string, params: any[] = []) => {
  const db = await getDatabase();
  const [result] = await db.executeSql(sql, params);
  return result;
};

const ensureDictionaryDatabase = async () => {
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
    CREATE TABLE IF NOT EXISTS ${WORDS_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      korean_word TEXT NOT NULL,
      mongolian_meaning TEXT NOT NULL,
      example_sentence TEXT,
      level INTEGER,
      created_at TEXT
    )
  `);

  await execute(`CREATE INDEX IF NOT EXISTS idx_dictionary_words_korean ON ${WORDS_TABLE}(korean_word)`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_dictionary_words_level ON ${WORDS_TABLE}(level)`);

  isInitialized = true;
};

const rowToWord = (row: any): DictionaryWord => ({
  id: String(row.id),
  koreanWord: row.korean_word || '',
  mongolianMeaning: row.mongolian_meaning || '',
  exampleSentence: row.example_sentence || '',
  level: row.level ?? null,
  createdAt: row.created_at || null,
});

const readMetaValue = async (key: string): Promise<string | null> => {
  const result = await execute(`SELECT value FROM ${META_TABLE} WHERE key = ? LIMIT 1`, [key]);
  if (result.rows.length === 0) {
    return null;
  }

  return String(result.rows.item(0).value);
};

export const clearDictionaryCache = async () => {
  await ensureDictionaryDatabase();
  await execute(`DELETE FROM ${WORDS_TABLE}`);
  await execute(`DELETE FROM ${META_TABLE}`);
};

export const getDictionaryCacheStatus = async (): Promise<DictionaryCacheStatus | null> => {
  await ensureDictionaryDatabase();

  const [metaRaw, cachedAtRaw, countResult] = await Promise.all([
    readMetaValue('meta'),
    readMetaValue('cachedAt'),
    execute(`SELECT COUNT(*) as count FROM ${WORDS_TABLE}`),
  ]);

  if (!metaRaw || !cachedAtRaw) {
    return null;
  }

  const meta = JSON.parse(metaRaw) as DictionaryMeta;
  const cachedAt = Number(cachedAtRaw);
  const wordCount = Number(countResult.rows.item(0).count || 0);

  if (!Number.isFinite(meta.version)) {
    await clearDictionaryCache();
    return null;
  }

  if (!Number.isFinite(cachedAt) || wordCount === 0) {
    return null;
  }

  if (meta.total > 0 && wordCount < meta.total) {
    await clearDictionaryCache();
    return null;
  }

  return { meta, cachedAt, wordCount };
};

export const saveDictionaryCache = async (words: DictionaryWord[], meta: DictionaryMeta) => {
  await ensureDictionaryDatabase();
  const db = await getDatabase();

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`DELETE FROM ${WORDS_TABLE}`);
        tx.executeSql(`DELETE FROM ${META_TABLE}`);
        tx.executeSql(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, [
          'meta',
          JSON.stringify(meta),
        ]);
        tx.executeSql(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, [
          'cachedAt',
          String(Date.now()),
        ]);

        words.forEach((word) => {
          tx.executeSql(
            `
              INSERT OR REPLACE INTO ${WORDS_TABLE}
                (id, korean_word, mongolian_meaning, example_sentence, level, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
              word.id,
              word.koreanWord,
              word.mongolianMeaning,
              word.exampleSentence || null,
              word.level ?? null,
              word.createdAt || null,
            ],
          );
        });
      },
      (error) => reject(error),
      () => resolve(),
    );
  });
};

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (match) => `\\${match}`);

export const searchDictionaryCache = async (
  query: string,
  options: { limit: number; offset: number },
): Promise<DictionarySearchResult> => {
  await ensureDictionaryDatabase();

  const trimmedQuery = query.trim();
  const where = trimmedQuery
    ? 'WHERE korean_word LIKE ? ESCAPE \'\\\' OR mongolian_meaning LIKE ? ESCAPE \'\\\' OR example_sentence LIKE ? ESCAPE \'\\\''
    : '';
  const like = `%${escapeLike(trimmedQuery)}%`;
  const searchParams = trimmedQuery ? [like, like, like] : [];

  const [countResult, wordsResult] = await Promise.all([
    execute(`SELECT COUNT(*) as count FROM ${WORDS_TABLE} ${where}`, searchParams),
    execute(
      `
        SELECT id, korean_word, mongolian_meaning, example_sentence, level, created_at
        FROM ${WORDS_TABLE}
        ${where}
        ORDER BY korean_word COLLATE NOCASE ASC
        LIMIT ? OFFSET ?
      `,
      [...searchParams, options.limit, options.offset],
    ),
  ]);

  return {
    total: Number(countResult.rows.item(0).count || 0),
    words: wordsResult.rows.raw().map(rowToWord),
  };
};
