import { Router } from 'express';

import {
  getLessonCategories,
  getKoreanGrammarLessons,
  getLessons,
  getLessonsByCategory,
  getVideoCategories,
  getVideoLessons,
} from '../controllers/lessonController';

const router = Router();

router.get('/lesson-categories', getLessonCategories);
router.get('/korean-grammar-lessons', getKoreanGrammarLessons);
router.get('/lessons', getLessons);
router.get('/lessons/category/:slug', getLessonsByCategory);
router.get('/video-categories', getVideoCategories);
router.get('/video-lessons', getVideoLessons);

export default router;
