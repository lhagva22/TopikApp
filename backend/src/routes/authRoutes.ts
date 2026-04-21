import { Router } from 'express';
import { register, login, getProfile, upgradeToPaid } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { startLevelTest, submitLevelTest, getLevelTestHistory } from '../controllers/levelTestController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/upgrade', protect, upgradeToPaid);
router.post('/level-test/start', startLevelTest);
router.post('/level-test/submit', submitLevelTest);
router.get('/level-test/history', getLevelTestHistory);

export default router;