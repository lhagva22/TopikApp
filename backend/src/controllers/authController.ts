import crypto from 'crypto';
import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';

const PASSWORD_RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const passwordResetTokens = new Map<string, { userId: string; email: string; expiresAt: number }>();

export const logout = async (_req: Request, res: Response) => {
  return res.json({ success: true });
};

const getAuthInfo = (user: any) => {
  const providers = Array.isArray(user?.app_metadata?.providers)
    ? user.app_metadata.providers
    : user?.app_metadata?.provider
      ? [user.app_metadata.provider]
      : [];

  return {
    emailVerified: Boolean(user?.email_confirmed_at),
    emailConfirmedAt: user?.email_confirmed_at || null,
    provider: user?.app_metadata?.provider || providers[0] || 'email',
    providers,
  };
};

const upsertProfileFromAuthUser = async (user: any, fallbackName?: string) => {
  const name =
    fallbackName ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({
        email: user.email,
        name: existingProfile.name || name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return profile;
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      name,
      status: 'registered',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return profile;
};

const downgradeExpiredSubscription = async (profile: any) => {
  if (
    profile?.status !== 'premium' ||
    !profile.subscription_end_date ||
    new Date(profile.subscription_end_date).getTime() > Date.now()
  ) {
    return profile;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      status: 'registered',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data || { ...profile, status: 'registered' };
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Бүх талбарыг бөглөнө үү' });
  }

  // 1. Supabase auth бүртгэл
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // 2. Profile-д өгөгдөл хадгалах (status = 'registered')
  if (data.user) {
    // Profile аль хэдийн байгаа эсэхийг шалгах
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          name: name,
          status: 'registered',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile insert error:', profileError);
        // Optional: Auth user-ийг устгах эсвэл өөр арга хэмжээ авах
        return res.status(500).json({ error: 'Профайл үүсгэхэд алдаа гарлаа' });
      }
    } else {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: email,
          name: name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
      }
    }
  }

  res.status(201).json({
    success: true,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      name: name,
      status: 'registered',
      current_level: 0,
      ...getAuthInfo(data.user),
    },
    session: data.session,
  });
};

export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Google idToken шаардлагатай.' });
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error || !data.user || !data.session) {
    return res.status(401).json({ error: error?.message || 'Google нэвтрэлт амжилтгүй.' });
  }

  try {
    const profile = await downgradeExpiredSubscription(await upsertProfileFromAuthUser(data.user));

    res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile.name || data.user.user_metadata?.name,
        status: profile.status || 'registered',
        current_level: profile.current_level || 0,
        subscription_start_date: profile.subscription_start_date,
        subscription_end_date: profile.subscription_end_date,
        subscription_months: profile.subscription_months,
        ...getAuthInfo(data.user),
      },
      session: data.session,
    });
  } catch (profileError: any) {
    console.error('Google profile upsert error:', profileError);
    res.status(500).json({ error: 'Google profile үүсгэхэд алдаа гарлаа.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'И-мэйлээ оруулна уу.' });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({
    success: true,
    message: 'Нууц үг сэргээх холбоосыг имэйл рүү илгээлээ.',
  });
};

export const verifyResetOtp = async (req: Request, res: Response) => {
  const { email, token } = req.body;

  if (!email || !token) {
    return res.status(400).json({ error: 'И-мэйл болон OTP кодоо оруулна уу.' });
  }

  for (const [resetToken, payload] of passwordResetTokens.entries()) {
    if (payload.expiresAt <= Date.now()) {
      passwordResetTokens.delete(resetToken);
    }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });

  if (error || !data.user) {
    return res.status(400).json({ error: error?.message || 'OTP код буруу эсвэл хугацаа дууссан байна.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  passwordResetTokens.set(resetToken, {
    userId: data.user.id,
    email,
    expiresAt: Date.now() + PASSWORD_RESET_TOKEN_TTL_MS,
  });

  res.json({
    success: true,
    message: 'OTP баталгаажлаа. Шинэ нууц үгээ оруулна уу.',
    resetToken,
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { resetToken, password } = req.body;

  if (!resetToken || !password) {
    return res.status(400).json({ error: 'Баталгаажуулалт болон шинэ нууц үгээ оруулна уу.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.' });
  }

  const payload = passwordResetTokens.get(resetToken);

  if (!payload || payload.expiresAt <= Date.now()) {
    passwordResetTokens.delete(resetToken);
    return res.status(400).json({ error: 'Баталгаажуулалтын хугацаа дууссан байна. OTP дахин авна уу.' });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(payload.userId, {
    password,
  });

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  passwordResetTokens.delete(resetToken);

  res.json({
    success: true,
    message: 'Нууц үг амжилттай шинэчлэгдлээ.',
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Имэйл, нууц үгээ оруулна уу' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу' });
  }

  // Profile-с мэдээлэл авах
  let profile = null;
  if (data.user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    profile = profileData;

    // Хэрэв profile байхгүй бол үүсгэх
    if (!profileData) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || email?.split('@')[0],
          status: 'registered',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!createError && newProfile) {
        profile = newProfile;
      }
    }

    if (profile) {
      profile = await downgradeExpiredSubscription(profile);
    }
  }

  res.json({
    success: true,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      name: profile?.name || data.user?.user_metadata?.name,
      status: profile?.status || 'registered',
      current_level: profile?.current_level || 0,
      subscription_start_date: profile?.subscription_start_date,
      subscription_end_date: profile?.subscription_end_date,
      subscription_months: profile?.subscription_months,
      ...getAuthInfo(data.user),
    },
    session: data.session,
  });
};

// backend/src/controllers/authController.ts
// backend/src/controllers/authController.ts (supabaseAdmin ашиглах)
export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!userId) {
    return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });
  }

  // Admin client - RLS-ийг тойрно
  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Profile байхгүй бол үүсгэх
  if (profileError && profileError.code === 'PGRST116') {
    console.log('⚠️ Profile not found, creating new profile for user:', userId);

    const { data: { user: authUser } } = await supabase.auth.getUser(token || '');

    const { data: newProfile, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: authUser?.email,
        name: authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User',
        status: 'registered',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create profile:', createError);
      return res.status(500).json({ error: 'Профайл үүсгэхэд алдаа гарлаа' });
    }

    profile = newProfile;
  } else if (profileError) {
    console.error('❌ Profile fetch error:', profileError);
    return res.status(500).json({ error: 'Профайл авахад алдаа гарлаа' });
  }

  try {
    profile = await downgradeExpiredSubscription(profile);
  } catch (downgradeError) {
    console.error('Failed to downgrade expired subscription:', downgradeError);
    return res.status(500).json({ error: 'Багцын хугацаа шалгахад алдаа гарлаа' });
  }

  const { data: { user: authUser } } = await supabase.auth.getUser(token || '');

  res.json({
    success: true,
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      status: profile.status,
      current_level: profile.current_level || 0,
      subscription_start_date: profile.subscription_start_date,
      subscription_end_date: profile.subscription_end_date,
      subscription_months: profile.subscription_months,
      ...getAuthInfo(authUser),
    },
  });
};
export const upgradeToPaid = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { months } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });
  }

  if (!months || months <= 0) {
    return res.status(400).json({ error: 'Багцын хугацаа буруу байна' });
  }

  // Эхлээд profile байгаа эсэхийг шалгах
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, subscription_start_date, subscription_end_date, subscription_months')
    .eq('id', userId)
    .single();

  if (!existingProfile) {
    return res.status(404).json({ error: 'Хэрэглэгчийн профайл олдсонгүй' });
  }

  const now = new Date();
  const currentEndDate =
    existingProfile.subscription_end_date && new Date(existingProfile.subscription_end_date).getTime() > now.getTime()
      ? new Date(existingProfile.subscription_end_date)
      : null;
  const existingStartDate =
    existingProfile.subscription_start_date && !Number.isNaN(new Date(existingProfile.subscription_start_date).getTime())
      ? new Date(existingProfile.subscription_start_date)
      : null;
  const startDate = currentEndDate && existingStartDate ? existingStartDate : now;
  const endDate = new Date(currentEndDate ?? now);
  endDate.setMonth(endDate.getMonth() + months);
  const hasActiveSubscription = currentEndDate !== null;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      status: 'premium',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      subscription_months: hasActiveSubscription ? (existingProfile.subscription_months ?? 0) + months : months,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, name, status, subscription_start_date, subscription_end_date, subscription_months')
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Auth-аас email авах
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user: authUser } } = await supabase.auth.getUser(token || '');

  res.json({
    success: true,
    message: `${months} сарын багц идэвхжлээ`,
    user: {
      id: data.id,
      email: authUser?.email,  // email-ийг auth-аас авсан
      name: data.name,
      status: data.status,
      current_level: 0,
      subscription_start_date: data.subscription_start_date,
      subscription_end_date: data.subscription_end_date,
      subscription_months: data.subscription_months,
    },
  });
};
