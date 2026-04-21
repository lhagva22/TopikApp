import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';

// backend/src/middleware/authMiddleware.ts
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Token олдсонгүй' });
  }

  console.log('🔑 Received token (first 50 chars):', token.substring(0, 50) + '...');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('❌ Token validation error:', error?.message);
    return res.status(401).json({ error: 'Token хүчингүй' });
  }

  console.log('✅ Token belongs to user:', user.id);
  console.log('✅ User email:', user.email);
  
  req.user = user;
  req.userId = user.id;
  next();
};