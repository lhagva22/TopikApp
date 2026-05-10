import { Router } from 'express';

import {
  getLessonCategories,
  getLessons,
  getLessonsByCategory,
  getVideoCategories,
  getVideoLessons,
} from '../controllers/lessonController';

const router = Router();

router.get('/lesson-categories', getLessonCategories);
router.get('/lessons', getLessons);
router.get('/lessons/category/:slug', getLessonsByCategory);
router.get('/video-categories', getVideoCategories);
router.get('/video-lessons', getVideoLessons);

export default router;
