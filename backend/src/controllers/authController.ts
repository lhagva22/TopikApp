
import { Request, Response } from 'express';  
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Бүх талбарыг бөглөнө үү' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ success: true, user: data.user });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Имэйл, нууц үгээ оруулна уу' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу' });
  res.json({ success: true, user: data.user, session: data.session });
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'Token олдсонгүй' });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Token хүчингүй' });
  res.json({ success: true, user });
};
