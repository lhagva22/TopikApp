import { Router } from 'express';

import {
  checkQPayPayment,
  createQPayPayment,
  getPaymentDetail,
  getPaymentHistory,
  handleQPayCallback,
  simulateQPayPaymentSuccess,
} from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = Router();
const devPaymentSimulationEnabled =
  process.env.NODE_ENV !== 'production' &&
  process.env.ENABLE_DEV_PAYMENT_SIMULATION !== 'false';

router.get('/payments/webhook', handleQPayCallback);
router.post('/payments/qpay/create', protect, createQPayPayment);
router.get('/payments', protect, getPaymentHistory);
router.get('/payments/:paymentId', protect, getPaymentDetail);
router.post('/payments/:paymentId/check', protect, checkQPayPayment);

if (devPaymentSimulationEnabled) {
  router.post('/payments/:paymentId/dev-complete', protect, simulateQPayPaymentSuccess);
}

export default router;
