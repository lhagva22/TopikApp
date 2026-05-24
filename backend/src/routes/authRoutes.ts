// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import {
  register,
  login,
  logout,
  googleLogin,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
  upgradeToPaid,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);
router.post('/upgrade', protect, upgradeToPaid);

export default router;
