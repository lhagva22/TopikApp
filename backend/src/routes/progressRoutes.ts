import { Router } from 'express';

import { getProgress, getProgressResultDetail } from '../controllers/progressController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/progress', protect, getProgress);
router.get('/progress/results/:resultId', protect, getProgressResultDetail);

export default router;
