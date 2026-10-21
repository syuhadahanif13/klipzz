import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnytjjvkmtvbagitwlax.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_CM5nTsKgQ9BBwBqPYHD3rw_7jAgh6m9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
