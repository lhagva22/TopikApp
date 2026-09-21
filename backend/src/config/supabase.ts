import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

if (process.env.CLOUDFLARE_WORKER !== 'true') {
  dotenv.config({ override: true });
}

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!

);
// backend/src/config/supabase.ts
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
