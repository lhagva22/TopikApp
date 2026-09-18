import SQLite, { type SQLiteDatabase } from 'react-native-sqlite-storage';

import type { DictionaryMeta, DictionaryWord } from '../../domain/types';

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

type SQLiteValue = string | number | null;
const SQLITE_INSERT_BATCH_SIZE = 50;
type DictionaryRow = {
  id: string;
  korean_word?: string | null;
  parent_word?: string | null;
  entry_kind?: string | null;
  homonym_no?: number | null;
  part_of_speech?: string | null;
  pronunciation?: string | null;
  vocabulary_level?: string | null;
  korean_definition?: string | null;
  mongolian_meaning?: string | null;
  mongolian_definition?: string | null;
  examples?: string | null;
  source?: string | null;
  license?: string | null;
  created_at?: string | null;
};

const DB_NAME = 'topik_dictionary.db';
const LEGACY_META_TABLE = 'dictionary_cache_meta';
const LEGACY_WORDS_TABLE = 'dictionary_words';
const META_TABLE = 'dictionary_cache_meta_v2';
const WORDS_TABLE = 'dictionary_words_v2';

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

const ensureDictionaryDatabase = async () => {
  if (isInitialized) {
    return;
  }

  // The old cache contains test dictionary data with an incompatible schema.
  await execute(`DROP TABLE IF EXISTS ${LEGACY_WORDS_TABLE}`);
  await execute(`DROP TABLE IF EXISTS ${LEGACY_META_TABLE}`);

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
      parent_word TEXT,
      entry_kind TEXT,
      homonym_no INTEGER,
      part_of_speech TEXT,
      pronunciation TEXT,
      vocabulary_level TEXT,
      korean_definition TEXT,
      mongolian_meaning TEXT,
      mongolian_definition TEXT,
      examples TEXT NOT NULL DEFAULT '[]',
      source TEXT,
      license TEXT,
      created_at TEXT
    )
  `);

  await execute(`CREATE INDEX IF NOT EXISTS idx_dictionary_words_v2_korean ON ${WORDS_TABLE}(korean_word)`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_dictionary_words_v2_level ON ${WORDS_TABLE}(vocabulary_level)`);

  isInitialized = true;
};

const rowToWord = (row: DictionaryRow): DictionaryWord => ({
  id: String(row.id),
  koreanWord: row.korean_word || '',
  parentWord: row.parent_word || '',
  entryKind: row.entry_kind || '',
  homonymNo: row.homonym_no ?? null,
  partOfSpeech: row.part_of_speech || '',
  pronunciation: row.pronunciation || '',
  vocabularyLevel: row.vocabulary_level || '',
  koreanDefinition: row.korean_definition || '',
  mongolianMeaning: row.mongolian_meaning || '',
  mongolianDefinition: row.mongolian_definition || '',
  examples: (() => {
    try {
      const parsed = JSON.parse(row.examples || '[]');
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  })(),
  source: row.source || '',
  license: row.license || '',
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

export const saveDictionaryCache = async (
  words: DictionaryWord[],
  meta: DictionaryMeta,
  options: { reset?: boolean; finalize?: boolean } = {},
) => {
  await ensureDictionaryDatabase();
  const db = await getDatabase();
  const { reset = true, finalize = true } = options;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        if (reset) {
          tx.executeSql(`DELETE FROM ${WORDS_TABLE}`);
          tx.executeSql(`DELETE FROM ${META_TABLE}`);
        }

        for (let start = 0; start < words.length; start += SQLITE_INSERT_BATCH_SIZE) {
          const batch = words.slice(start, start + SQLITE_INSERT_BATCH_SIZE);
          const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
          const values: SQLiteValue[] = [];

          batch.forEach((word) => {
            values.push(
              word.id,
              word.koreanWord,
              word.parentWord || null,
              word.entryKind || null,
              word.homonymNo ?? null,
              word.partOfSpeech || null,
              word.pronunciation || null,
              word.vocabularyLevel || null,
              word.koreanDefinition || null,
              word.mongolianMeaning,
              word.mongolianDefinition || null,
              JSON.stringify(word.examples || []),
              word.source || null,
              word.license || null,
              word.createdAt || null,
            );
          });

          tx.executeSql(
            `
              INSERT OR REPLACE INTO ${WORDS_TABLE}
                (id, korean_word, parent_word, entry_kind, homonym_no, part_of_speech,
                 pronunciation, vocabulary_level, korean_definition, mongolian_meaning,
                 mongolian_definition, examples, source, license, created_at)
              VALUES ${placeholders}
            `,
            values,
          );
        }

        if (finalize) {
          tx.executeSql(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, [
            'meta',
            JSON.stringify(meta),
          ]);
          tx.executeSql(`INSERT OR REPLACE INTO ${META_TABLE} (key, value) VALUES (?, ?)`, [
            'cachedAt',
            String(Date.now()),
          ]);
        }
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
    ? 'WHERE korean_word LIKE ? ESCAPE \'\\\' OR mongolian_meaning LIKE ? ESCAPE \'\\\''
    : '';
  const like = `%${escapeLike(trimmedQuery)}%`;
  const searchParams: SQLiteValue[] = trimmedQuery ? [like, like] : [];

  const [countResult, wordsResult] = await Promise.all([
    execute(`SELECT COUNT(*) as count FROM ${WORDS_TABLE} ${where}`, searchParams),
    execute(
      `
        SELECT id, korean_word, parent_word, entry_kind, homonym_no, part_of_speech,
               pronunciation, vocabulary_level, korean_definition, mongolian_meaning,
               mongolian_definition, examples, source, license, created_at
        FROM ${WORDS_TABLE}
        ${where}
        ORDER BY
          CASE
            WHEN korean_word = ? THEN 0
            WHEN mongolian_meaning = ? THEN 1
            WHEN korean_word LIKE ? ESCAPE '\\' THEN 2
            WHEN mongolian_meaning LIKE ? ESCAPE '\\' THEN 3
            ELSE 4
          END,
          korean_word COLLATE NOCASE ASC
        LIMIT ? OFFSET ?
      `,
      [
        ...searchParams,
        trimmedQuery,
        trimmedQuery,
        `${escapeLike(trimmedQuery)}%`,
        `${escapeLike(trimmedQuery)}%`,
        options.limit,
        options.offset,
      ],
    ),
  ]);

  return {
    total: Number(countResult.rows.item(0).count || 0),
    words: wordsResult.rows.raw().map(rowToWord),
  };
};

export const getRandomDictionaryWords = async (limit: number): Promise<DictionaryWord[]> => {
  await ensureDictionaryDatabase();

  const result = await execute(
    `
      SELECT id, korean_word, parent_word, entry_kind, homonym_no, part_of_speech,
             pronunciation, vocabulary_level, korean_definition, mongolian_meaning,
             mongolian_definition, examples, source, license, created_at
      FROM ${WORDS_TABLE}
      WHERE length(korean_word) BETWEEN 1 AND 6
        AND korean_word NOT LIKE '%-%'
        AND korean_word NOT LIKE '% %'
        AND mongolian_meaning IS NOT NULL
        AND trim(mongolian_meaning) <> ''
        AND mongolian_meaning <> '(Тохирох үг хэллэг байхгүй байна)'
      ORDER BY RANDOM()
      LIMIT ?
    `,
    [Math.max(20, Math.min(limit * 5, 100))],
  );

  return result.rows
    .raw()
    .map(rowToWord)
    .filter((word) => /^[가-힣]+$/.test(word.koreanWord))
    .slice(0, limit);
};

export const getRandomDictionaryWordsWithExamples = async (limit: number): Promise<DictionaryWord[]> => {
  await ensureDictionaryDatabase();

  const result = await execute(
    `
      SELECT id, korean_word, parent_word, entry_kind, homonym_no, part_of_speech,
             pronunciation, vocabulary_level, korean_definition, mongolian_meaning,
             mongolian_definition, examples, source, license, created_at
      FROM ${WORDS_TABLE}
      WHERE examples IS NOT NULL
        AND examples <> '[]'
      ORDER BY RANDOM()
      LIMIT ?
    `,
    [Math.max(20, Math.min(limit, 200))],
  );

  return result.rows.raw().map(rowToWord);
};
