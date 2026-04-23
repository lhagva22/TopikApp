// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, getProfile, upgradeToPaid } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/upgrade', protect, upgradeToPaid);

export default router;