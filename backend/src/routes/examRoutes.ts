// backend/src/routes/examRoutes.ts
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getExams,
  getExamById,
  startExam,
  startLevelTestMockTest,
  submitExam,
  submitLevelTest
} from '../controllers/examController';

const router = Router();

// Public routes
router.get('/exams', getExams);
router.get('/exams/:examId', getExamById);

// Protected routes
router.post('/exam/:examId/start', protect, startExam);
router.post('/exam/submit', protect, submitExam);
router.post('/level-test/start', protect, startLevelTestMockTest);
router.post('/level-test/submit', protect, submitLevelTest);

export default router;
