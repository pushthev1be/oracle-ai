import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('Supabase credentials missing. Global caching will be disabled.');
}

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
