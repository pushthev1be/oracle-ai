import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env;
const supabaseUrl = env?.VITE_SUPABASE_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('⚠️ [Oracle Cache] Supabase credentials missing. Global caching is DISABLED.');
    console.info('Tip: Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Render/Deployment dashboard BEFORE building.');
}

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
