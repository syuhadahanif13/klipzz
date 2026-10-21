import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key',
  { auth: { persistSession: false } }
);

export async function cleanupExpiredChallenges() {
  try {
    const { data, error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('is_verified', false)
      .lt('verification_expires_at', new Date().toISOString());

    if (error) {
      console.error('[Worker Cron] Cleanup challenges error:', error.message);
    } else {
      console.log('[Worker Cron] Cleaned up expired unverified challenge records.');
    }
  } catch (err: any) {
    console.error('[Worker Cron] Exception in cleanupExpiredChallenges:', err.message);
  }
}
