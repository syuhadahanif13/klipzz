import { getSupabaseAdmin } from './supabaseAdmin';

export interface CleanupResult {
  deleted: number;
  error?: string;
}

/**
 * Deletes unverified social-account challenge records whose verification code
 * has expired. Invoked by the protected /api/cron/cleanup route.
 */
export async function cleanupExpiredChallenges(): Promise<CleanupResult> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('is_verified', false)
      .lt('verification_expires_at', new Date().toISOString())
      .select('id');

    if (error) return { deleted: 0, error: error.message };

    return { deleted: data?.length || 0 };
  } catch (err: any) {
    return { deleted: 0, error: err?.message || 'Cleanup failed.' };
  }
}
