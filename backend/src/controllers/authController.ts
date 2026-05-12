import { Request, Response } from 'express';  
import { supabase, supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Бүх талбарыг бөглөнө үү' });
  }

  // 1. Supabase auth бүртгэл
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
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
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile insert error:', profileError);
        // Optional: Auth user-ийг устгах эсвэл өөр арга хэмжээ авах
        return res.status(500).json({ error: 'Профайл үүсгэхэд алдаа гарлаа' });
      }
    } else {
      console.log('Profile already exists for user:', data.user.id);
      // Байгаа profile-г update хийх
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: email,
          name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user.id);
      
      if (updateError) {
        console.error('Profile update error:', updateError);
      }
    }
  }

  console.log('Register success:', email);

  res.status(201).json({ 
    success: true, 
    user: {
      id: data.user?.id,
      email: data.user?.email,
      name: name,
      status: 'registered',
      current_level: 0,
    }
  });
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
      console.log('Profile not found, creating one for user:', data.user.id);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || email?.split('@')[0],
          status: 'registered',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (!createError && newProfile) {
        profile = newProfile;
      }
    }
  }

  console.log('Login success:', email);
  console.log('Profile:', profile);

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
    },
    session: data.session 
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
        updated_at: new Date().toISOString()
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
    }
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
    .select('id')
    .eq('id', userId)
    .single();

  if (!existingProfile) {
    return res.status(404).json({ error: 'Хэрэглэгчийн профайл олдсонгүй' });
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      status: 'premium',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      subscription_months: months,
      updated_at: new Date().toISOString()
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
    }
  });
};
