import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import { z } from 'zod';
import { supabase } from '../services/supabaseService.js';
import { scrapeProfileBio } from '../services/apifyService.js';

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

const verifySchema = z.object({
  accountId: z.string().uuid(),
});

function generateRandomCode(): string {
  let result = 'KLIPZZ-';
  for (let i = 0; i < 4; i++) {
    result += CODE_ALPHABET.charAt(randomInt(0, CODE_ALPHABET.length));
  }
  return result;
}

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): { data?: T; error?: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: result.error.issues.map((issue) => issue.message).join(' ') };
  }
  return { data: result.data };
}

export async function requestChallenge(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const parsed = parseBody(challengeSchema, req.body);
    if (!parsed.data) return res.status(400).json({ error: parsed.error });

    const { platform, handle } = parsed.data;
    const cleanHandle = `@${handle}`;
    const verificationCode = generateRandomCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: existing, error: lookupError } = await supabase
      .from('social_accounts')
      .select('id, user_id, is_verified')
      .eq('platform', platform)
      .eq('handle', cleanHandle)
      .maybeSingle();

    if (lookupError) {
      return res.status(500).json({ error: lookupError.message });
    }

    // Never allow one account to be claimed by a different user.
    if (existing && existing.user_id !== req.user.id) {
      return res.status(409).json({
        error: 'This social account is already linked to another user.',
        code: 'ACCOUNT_TAKEN',
      });
    }

    if (existing?.is_verified) {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', existing.id)
        .single();

      return res.status(200).json({
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
          user_id: req.user.id,
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
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
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
    return res.status(500).json({ error: err.message });
  }
}

export async function verifyBioCode(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const parsed = parseBody(verifySchema, req.body);
    if (!parsed.data) return res.status(400).json({ error: parsed.error });

    const { data: account, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', parsed.data.accountId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!account) return res.status(404).json({ error: 'Social account record not found.' });

    if (account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this social account.' });
    }

    if (account.is_verified) {
      return res.status(200).json({ success: true, message: 'Account is already verified.', account });
    }

    if (!account.verification_expires_at || new Date() > new Date(account.verification_expires_at)) {
      return res.status(400).json({
        error: 'Verification code has expired. Please request a new code.',
        expired: true,
      });
    }

    const scrapeResult = await scrapeProfileBio(
      account.platform,
      account.handle,
      account.verification_code
    );

    if (!scrapeResult.verified) {
      return res.status(422).json({
        success: false,
        verified: false,
        message: `Verification code "${account.verification_code}" was not found in ${account.handle}'s public bio.`,
        currentBio: scrapeResult.actualBio,
      });
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
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: `Account ${account.handle} successfully verified!`,
      account: updatedAccount,
    });
  } catch (err: any) {
    return res.status(503).json({
      error: err.message || 'Verification service is unavailable. Please try again later.',
    });
  }
}

export async function getSocialAccounts(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ accounts: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
