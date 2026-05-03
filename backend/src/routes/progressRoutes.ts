import { Router } from 'express';

import { getProgress } from '../controllers/progressController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/progress', protect, getProgress);

export default router;
