BEGIN;

DO $$
DECLARE
  constraint_name text;
BEGIN
  IF to_regclass('public.dictionary_bookmarks') IS NULL THEN
    RAISE NOTICE 'dictionary_bookmarks does not exist; skipping bookmark migration';
    RETURN;
  END IF;

  TRUNCATE TABLE public.dictionary_bookmarks;

  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.dictionary_bookmarks'::regclass
      AND contype = 'f'
      AND confrelid = to_regclass('public.dictionary_words')
  LOOP
    EXECUTE format(
      'ALTER TABLE public.dictionary_bookmarks DROP CONSTRAINT %I',
      constraint_name
    );
  END LOOP;

  ALTER TABLE public.dictionary_bookmarks
    ADD CONSTRAINT dictionary_bookmarks_word_id_fkey
    FOREIGN KEY (word_id)
    REFERENCES public.dictionary_words_v2(id)
    ON DELETE CASCADE;
END $$;

DROP TABLE IF EXISTS public.dictionary_words;

INSERT INTO public.app_data_versions (key, version)
VALUES ('dictionary_words_v2', 1)
ON CONFLICT (key) DO UPDATE SET
  version = public.app_data_versions.version + 1,
  updated_at = NOW();

DELETE FROM public.app_data_versions
WHERE key = 'dictionary_words';

COMMIT;
