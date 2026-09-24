import { Router } from 'express';

import {
  handleContentCreatedWebhook,
  registerPushToken,
  unregisterPushToken,
} from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/notifications/content-created', handleContentCreatedWebhook);
router.post('/notifications/token', registerPushToken);
router.delete('/notifications/token', protect, unregisterPushToken);

export default router;
