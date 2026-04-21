// backend/src/routes/examRoutes.ts
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getExams,
  getExamById,
  startExam,
  submitExam,
  getUserExamResults,
  getExamResultById
} from '../controllers/examController';

const router = Router();

// ✅ Public routes (хүн бүр харна - authentication шаардлагагүй)
router.get('/exams', getExams);
router.get('/exams/:examId', getExamById);

// ✅ Protected routes (зөвхөн authenticated хэрэглэгч)
// Бүх доорх routes-д protect middleware хэрэглэгдэнэ
router.post('/exam/:examId/start', protect, startExam);
router.post('/exam/submit', protect, submitExam);
router.get('/exam-results', protect, getUserExamResults);
router.get('/exam-results/:resultId', protect, getExamResultById);

export default router;