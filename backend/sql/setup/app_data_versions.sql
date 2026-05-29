CREATE TABLE IF NOT EXISTS app_data_versions (
  key TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_data_versions (key, version)
VALUES ('dictionary_words', 1)
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_data_versions (key, version)
VALUES ('korean_grammar_lessons', 1)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION bump_dictionary_words_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO app_data_versions (key, version, updated_at)
  VALUES ('dictionary_words', 1, NOW())
  ON CONFLICT (key)
  DO UPDATE SET
    version = app_data_versions.version + 1,
    updated_at = NOW();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF to_regclass('public.dictionary_words') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS bump_dictionary_words_version_trigger ON dictionary_words;
    CREATE TRIGGER bump_dictionary_words_version_trigger
    AFTER INSERT OR UPDATE OR DELETE ON dictionary_words
    FOR EACH STATEMENT
    EXECUTE FUNCTION bump_dictionary_words_version();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION bump_korean_grammar_lessons_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO app_data_versions (key, version, updated_at)
  VALUES ('korean_grammar_lessons', 1, NOW())
  ON CONFLICT (key)
  DO UPDATE SET
    version = app_data_versions.version + 1,
    updated_at = NOW();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF to_regclass('public.korean_grammar_lessons') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS bump_korean_grammar_lessons_version_trigger ON korean_grammar_lessons;
    CREATE TRIGGER bump_korean_grammar_lessons_version_trigger
    AFTER INSERT OR UPDATE OR DELETE ON korean_grammar_lessons
    FOR EACH STATEMENT
    EXECUTE FUNCTION bump_korean_grammar_lessons_version();
  END IF;
END $$;
