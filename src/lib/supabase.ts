// ============================================
// LINE Sticker Generator — Supabase Client
// Note: NEXT_PUBLIC_ variables are inlined at build time.
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Export a dummy client if keys are missing during build to prevent crashes
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      }
    })
  : new Proxy({} as any, {
      get: (target, prop) => {
        const missing = [];
        if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
        if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
        
        throw new Error(`Supabase client accessed but keys are missing: ${missing.join(', ')}`);
      }
    });
