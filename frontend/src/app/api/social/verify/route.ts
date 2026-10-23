import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, getSupabaseAdmin } from '@/server/supabaseAdmin';
import { enforceRateLimit } from '@/server/rateLimit';
import { scrapeProfileBio } from '@/server/apify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const verifySchema = z.object({
  accountId: z.string().uuid(),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'social:verify', 10);
  if (limited) return limited;

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(' ') },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: account, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', parsed.data.accountId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!account) {
      return NextResponse.json({ error: 'Social account record not found.' }, { status: 404 });
    }

    if (account.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this social account.' },
        { status: 403 }
      );
    }

    if (account.is_verified) {
      return NextResponse.json({
        success: true,
        message: 'Account is already verified.',
        account,
      });
    }

    if (!account.verification_expires_at || new Date() > new Date(account.verification_expires_at)) {
      return NextResponse.json(
        {
          error: 'Verification code has expired. Please request a new code.',
          expired: true,
        },
        { status: 400 }
      );
    }

    if (account.platform !== 'tiktok' && account.platform !== 'instagram') {
      return NextResponse.json(
        { error: 'Unsupported social platform for this account.' },
        { status: 400 }
      );
    }

    const scrapeResult = await scrapeProfileBio(
      account.platform,
      account.handle,
      account.verification_code
    );

    if (!scrapeResult.verified) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: `Verification code "${account.verification_code}" was not found in ${account.handle}'s public bio.`,
          currentBio: scrapeResult.actualBio,
        },
        { status: 422 }
      );
    }

    const { data: updatedAccount, error: updateError } = await supabase
      .from('social_accounts')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        follower_count: scrapeResult.followerCount || account.follower_count,
        avatar_url: scrapeResult.avatarUrl || account.avatar_url,
      })
      .eq('id', account.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: `Account ${account.handle} successfully verified!`,
      account: updatedAccount,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || 'Verification service is unavailable. Please try again later.',
      },
      { status: 503 }
    );
  }
}
