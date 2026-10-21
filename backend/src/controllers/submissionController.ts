import { Request, Response } from 'express';
import { supabase } from '../services/supabaseService.js';
import { scrapePostMetrics } from '../services/apifyService.js';

function detectPlatform(url: string): 'tiktok' | 'instagram' | null {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  return null;
}

export async function submitClip(req: Request, res: Response) {
  try {
    const { campaignId, clipperId, socialAccountId, postUrl } = req.body;

    if (!campaignId || !clipperId || !postUrl) {
      return res.status(400).json({ error: 'Missing campaignId, clipperId, or postUrl' });
    }

    const platform = detectPlatform(postUrl);
    if (!platform) {
      return res.status(400).json({ error: 'Unsupported URL. Only TikTok or Instagram Reels are accepted.' });
    }

    // Verify campaign exists & is active
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ error: 'This campaign is no longer accepting submissions.' });
    }

    // Check if account is verified
    if (socialAccountId) {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', socialAccountId)
        .eq('user_id', clipperId)
        .single();

      if (!account || !account.is_verified) {
        return res.status(403).json({
          error: 'Your social account is not verified yet. Please complete the Bio Code Challenge first.',
        });
      }
    }

    // Check duplicate
    const { data: existingSub } = await supabase
      .from('submissions')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('post_url', postUrl)
      .maybeSingle();

    if (existingSub) {
      return res.status(409).json({ error: 'This video clip URL has already been submitted for this campaign.' });
    }

    // Scrape initial metrics via Apify
    const metrics = await scrapePostMetrics(platform, postUrl);

    // Initial check for required hashtags
    const captionLower = (metrics.caption || '').toLowerCase();
    const missingHashtags = (campaign.hashtag_requirements || []).filter(
      (tag: string) => !captionLower.includes(tag.toLowerCase())
    );

    const isHashtagValid = missingHashtags.length === 0;

    // Calculate initial earnings if views exceed threshold
    let initialEarnings = 0;
    if (metrics.views >= campaign.min_views_threshold) {
      initialEarnings = (metrics.views / 1000.0) * campaign.rate_per_1k_views;
      if (initialEarnings > campaign.max_payout_per_clip) {
        initialEarnings = campaign.max_payout_per_clip;
      }
    }

    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        campaign_id: campaignId,
        clipper_id: clipperId,
        social_account_id: socialAccountId || null,
        post_url: postUrl,
        platform,
        post_id: metrics.postId,
        caption: metrics.caption,
        thumbnail_url: metrics.thumbnailUrl,
        current_views: metrics.views,
        current_likes: metrics.likes,
        current_comments: metrics.comments,
        current_shares: metrics.shares,
        earnings: initialEarnings,
        status: isHashtagValid ? 'approved' : 'pending',
        rejection_reason: isHashtagValid ? null : `Missing hashtags: ${missingHashtags.join(', ')}`,
        last_scraped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      return res.status(500).json({ error: subError.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Clip submitted successfully! Metrics tracked.',
      submission,
      missingHashtags: isHashtagValid ? [] : missingHashtags,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getClipperSubmissions(req: Request, res: Response) {
  try {
    const { clipperId } = req.params;

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        campaign:campaigns(id, title, channel_name, episode_guest, rate_per_1k_views)
      `)
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
