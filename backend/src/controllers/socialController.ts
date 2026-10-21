import { Request, Response } from 'express';
import { supabase } from '../services/supabaseService.js';
import { scrapeProfileBio } from '../services/apifyService.js';

function generateRandomCode(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'KLIPZZ-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function requestChallenge(req: Request, res: Response) {
  try {
    const { userId, platform, handle } = req.body;

    if (!userId || !platform || !handle) {
      return res.status(400).json({ error: 'Missing required parameters: userId, platform, handle' });
    }

    const cleanHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
    const verificationCode = generateRandomCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    // Upsert into social_accounts
    const { data, error } = await supabase
      .from('social_accounts')
      .upsert(
        {
          user_id: userId,
          platform,
          handle: cleanHandle,
          verification_code: verificationCode,
          verification_expires_at: expiresAt,
          is_verified: false,
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
    const { accountId, userId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'Missing accountId' });
    }

    // Fetch existing challenge
    const { data: account, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error || !account) {
      return res.status(404).json({ error: 'Social account record not found' });
    }

    if (account.is_verified) {
      return res.status(200).json({ success: true, message: 'Account is already verified', account });
    }

    // Check expiration
    if (new Date() > new Date(account.verification_expires_at)) {
      return res.status(400).json({
        error: 'Verification code has expired. Please request a new code.',
        expired: true,
      });
    }

    // Execute bio check via Apify scraper
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

    // Verified! Update in Supabase
    const { data: updatedAccount, error: updateError } = await supabase
      .from('social_accounts')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        follower_count: scrapeResult.followerCount || account.follower_count,
        avatar_url: scrapeResult.avatarUrl || account.avatar_url,
      })
      .eq('id', accountId)
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
    return res.status(500).json({ error: err.message });
  }
}

export async function getSocialAccounts(req: Request, res: Response) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId query parameter' });
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId as string)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ accounts: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
