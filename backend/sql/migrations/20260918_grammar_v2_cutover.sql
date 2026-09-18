BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.korean_grammar_lessons_v2) <> 1375 THEN
    RAISE EXCEPTION 'Expected 1375 grammar rows before cutover';
  END IF;
END $$;

DROP TABLE IF EXISTS public.korean_grammar_lessons;

INSERT INTO public.app_data_versions (key, version)
VALUES ('korean_grammar_lessons_v2', 1)
ON CONFLICT (key) DO UPDATE SET
  version = public.app_data_versions.version + 1,
  updated_at = NOW();

DELETE FROM public.app_data_versions
WHERE key = 'korean_grammar_lessons';

COMMIT;
