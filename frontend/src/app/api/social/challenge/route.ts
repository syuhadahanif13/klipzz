import { randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, getSupabaseAdmin } from '@/server/supabaseAdmin';
import { enforceRateLimit } from '@/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const challengeSchema = z.object({
  platform: z.enum(['tiktok', 'instagram']),
  handle: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .transform((value) => value.replace(/^@+/, '').toLowerCase())
    .refine((value) => /^[a-z0-9._-]+$/.test(value), {
      message: 'Handle may only contain letters, numbers, dots, underscores, and hyphens.',
    }),
});

function generateRandomCode(): string {
  let result = 'KLIPZZ-';
  for (let i = 0; i < 4; i++) {
    result += CODE_ALPHABET.charAt(randomInt(0, CODE_ALPHABET.length));
  }
  return result;
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'social:challenge', 20);
  if (limited) return limited;

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = challengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(' ') },
        { status: 400 }
      );
    }

    const { platform, handle } = parsed.data;
    const cleanHandle = `@${handle}`;
    const verificationCode = generateRandomCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const supabase = getSupabaseAdmin();

    const { data: existing, error: lookupError } = await supabase
      .from('social_accounts')
      .select('id, user_id, is_verified')
      .eq('platform', platform)
      .eq('handle', cleanHandle)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    // Never allow one account to be claimed by a different user.
    if (existing && existing.user_id !== user.id) {
      return NextResponse.json(
        {
          error: 'This social account is already linked to another user.',
          code: 'ACCOUNT_TAKEN',
        },
        { status: 409 }
      );
    }

    if (existing?.is_verified) {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', existing.id)
        .single();

      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'This social account is already verified.',
        challenge: {
          id: account?.id,
          platform: account?.platform,
          handle: account?.handle,
          verificationCode: null,
          expiresAt: null,
        },
        account,
      });
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .upsert(
        {
          user_id: user.id,
          platform,
          handle: cleanHandle,
          profile_url:
            platform === 'tiktok'
              ? `https://www.tiktok.com/@${handle}`
              : `https://www.instagram.com/${handle}`,
          verification_code: verificationCode,
          verification_expires_at: expiresAt,
        },
        { onConflict: 'platform,handle' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge code generated. Please put this code in your Bio.',
      challenge: {
        id: data.id,
        platform: data.platform,
        handle: data.handle,
        verificationCode: data.verification_code,
        expiresAt: data.verification_expires_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Challenge failed.' }, { status: 500 });
  }
}
