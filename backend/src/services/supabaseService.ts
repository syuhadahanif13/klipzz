import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. ' +
      'See .env.example for the expected configuration.'
  );
}

// The service role key must never be the anon/publishable key. Without elevated
// privileges the API cannot write once Row Level Security is enabled.
const looksLikePublicKey =
  serviceRoleKey.startsWith('sb_publishable_') ||
  serviceRoleKey === process.env.SUPABASE_ANON_KEY;

if (looksLikePublicKey) {
  console.warn(
    '[klipzz] WARNING: SUPABASE_SERVICE_ROLE_KEY looks like an anon/publishable key. ' +
      'Server-side writes will fail after the security hardening migration is applied. ' +
      'Use the real service_role key from Supabase → Project Settings → API.'
  );
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
