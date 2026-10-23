import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabaseService.js';
import { scrapePostMetrics } from '../services/apifyService.js';

type SupportedPlatform = 'tiktok' | 'instagram';

const submitSchema = z.object({
  campaignId: z.string().uuid(),
  socialAccountId: z.string().uuid({
    message: 'A verified social account is required before submitting a clip.',
  }),
  postUrl: z.string().trim().url().max(500),
});

function detectPlatform(rawUrl: string): SupportedPlatform | null {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
    return null;
  } catch {
    return null;
  }
}

function normalizePostUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    url.hash = '';
    url.search = '';
    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}

export async function submitClip(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues.map((issue) => issue.message).join(' '),
      });
    }

    const { campaignId, socialAccountId, postUrl } = parsed.data;
    const platform = detectPlatform(postUrl);
    if (!platform) {
      return res
        .status(400)
        .json({ error: 'Unsupported URL. Only TikTok or Instagram Reels are accepted.' });
    }

    const normalizedUrl = normalizePostUrl(postUrl);

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError) return res.status(500).json({ error: campaignError.message });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    if (campaign.status !== 'active') {
      return res.status(400).json({ error: 'This campaign is no longer accepting submissions.' });
    }

    if (campaign.end_date && new Date(campaign.end_date) < new Date()) {
      return res.status(400).json({ error: 'This campaign has ended.' });
    }

    if (Number(campaign.remaining_pool) <= 0) {
      return res.status(400).json({ error: 'This campaign reward pool has been fully paid out.' });
    }

    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('id, user_id, platform, handle, is_verified')
      .eq('id', socialAccountId)
      .maybeSingle();

    if (accountError) return res.status(500).json({ error: accountError.message });
    if (!account || account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this social account.' });
    }
    if (!account.is_verified) {
      return res.status(403).json({
        error: 'Your social account is not verified yet. Please complete the Bio Code Challenge first.',
      });
    }
    if (account.platform !== platform) {
      return res.status(400).json({
        error: `This link is a ${platform} link but the selected account is ${account.platform}.`,
      });
    }

    const { data: existingSub, error: duplicateError } = await supabase
      .from('submissions')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('post_url', normalizedUrl)
      .maybeSingle();

    if (duplicateError) return res.status(500).json({ error: duplicateError.message });
    if (existingSub) {
      return res
        .status(409)
        .json({ error: 'This video clip URL has already been submitted for this campaign.' });
    }

    const metrics = await scrapePostMetrics(platform, normalizedUrl);

    const captionLower = (metrics.caption || '').toLowerCase();
    const missingHashtags = (campaign.hashtag_requirements || []).filter(
      (tag: string) => !captionLower.includes(tag.toLowerCase())
    );
    const isHashtagValid = missingHashtags.length === 0;

    // Earnings are intentionally left at 0 here. The database trigger computes
    // them from scraped views, enforces the per-clip cap, and caps the payout at
    // the remaining campaign pool. This prevents client-side payout manipulation.
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        campaign_id: campaignId,
        clipper_id: req.user.id,
        social_account_id: socialAccountId,
        post_url: normalizedUrl,
        platform,
        post_id: metrics.postId,
        caption: metrics.caption,
        thumbnail_url: metrics.thumbnailUrl,
        current_views: metrics.views,
        current_likes: metrics.likes,
        current_comments: metrics.comments,
        current_shares: metrics.shares,
        earnings: 0,
        status: isHashtagValid ? 'approved' : 'pending',
        rejection_reason: isHashtagValid ? null : `Missing hashtags: ${missingHashtags.join(', ')}`,
        last_scraped_at: new Date().toISOString(),
      })
      .select(
        `
          *,
          campaign:campaigns(id, title, channel_name, episode_guest, rate_per_1k_views, max_payout_per_clip, thumbnail_url)
        `
      )
      .single();

    if (subError) {
      if (subError.code === '23505') {
        return res
          .status(409)
          .json({ error: 'This video clip URL has already been submitted for this campaign.' });
      }
      return res.status(500).json({ error: subError.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Clip submitted successfully! Metrics tracked.',
      submission,
      missingHashtags: isHashtagValid ? [] : missingHashtags,
    });
  } catch (err: any) {
    return res.status(503).json({
      error: err.message || 'Could not verify the clip right now. Please try again later.',
    });
  }
}

export async function getClipperSubmissions(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const { clipperId } = req.params;
    if (clipperId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only view your own submissions.' });
    }

    const { data, error } = await supabase
      .from('submissions')
      .select(
        `
          *,
          campaign:campaigns(id, title, channel_name, episode_guest, rate_per_1k_views)
        `
      )
      .eq('clipper_id', clipperId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ submissions: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
