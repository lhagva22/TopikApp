import { Router } from 'express';

import {
  getLessonCategories,
  getKoreanGrammarLessons,
  getKoreanGrammarSyncMeta,
  getLessons,
  getLessonsByCategory,
  getVideoCategories,
  getVideoLessons,
  syncKoreanGrammarLessons,
} from '../controllers/lessonController';

const router = Router();

router.get('/lesson-categories', getLessonCategories);
router.get('/korean-grammar-lessons/sync/meta', getKoreanGrammarSyncMeta);
router.get('/korean-grammar-lessons/sync', syncKoreanGrammarLessons);
router.get('/korean-grammar-lessons', getKoreanGrammarLessons);
router.get('/lessons', getLessons);
router.get('/lessons/category/:slug', getLessonsByCategory);
router.get('/video-categories', getVideoCategories);
router.get('/video-lessons', getVideoLessons);

export default router;
