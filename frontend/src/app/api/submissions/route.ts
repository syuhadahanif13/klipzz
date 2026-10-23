import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, getSupabaseAdmin } from '@/server/supabaseAdmin';
import { enforceRateLimit } from '@/server/rateLimit';
import { scrapePostMetrics } from '@/server/apify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type SupportedPlatform = 'tiktok' | 'instagram';

// Postgres accepts any canonical UUID, but Zod's .uuid() also enforces RFC
// version/variant bits. Legacy seed campaigns use IDs that are valid UUIDs for
// Postgres but fail that stricter check, so validate the canonical shape only.
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const submitSchema = z.object({
  campaignId: z.string().regex(uuidPattern, 'Invalid UUID'),
  socialAccountId: z
    .string()
    .regex(uuidPattern, 'A verified social account is required before submitting a clip.'),
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

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'submissions:create', 20);
  if (limited) return limited;

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(' ') },
        { status: 400 }
      );
    }

    const { campaignId, socialAccountId, postUrl } = parsed.data;
    const platform = detectPlatform(postUrl);
    if (!platform) {
      return NextResponse.json(
        { error: 'Unsupported URL. Only TikTok or Instagram Reels are accepted.' },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizePostUrl(postUrl);
    const supabase = getSupabaseAdmin();

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 500 });
    }
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }

    if (campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'This campaign is no longer accepting submissions.' },
        { status: 400 }
      );
    }

    if (campaign.end_date && new Date(campaign.end_date) < new Date()) {
      return NextResponse.json({ error: 'This campaign has ended.' }, { status: 400 });
    }

    if (Number(campaign.remaining_pool) <= 0) {
      return NextResponse.json(
        { error: 'This campaign reward pool has been fully paid out.' },
        { status: 400 }
      );
    }

    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('id, user_id, platform, handle, is_verified')
      .eq('id', socialAccountId)
      .maybeSingle();

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 500 });
    }
    if (!account || account.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this social account.' },
        { status: 403 }
      );
    }
    if (!account.is_verified) {
      return NextResponse.json(
        {
          error:
            'Your social account is not verified yet. Please complete the Bio Code Challenge first.',
        },
        { status: 403 }
      );
    }
    if (account.platform !== platform) {
      return NextResponse.json(
        {
          error: `This link is a ${platform} link but the selected account is ${account.platform}.`,
        },
        { status: 400 }
      );
    }

    const { data: existingSub, error: duplicateError } = await supabase
      .from('submissions')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('post_url', normalizedUrl)
      .maybeSingle();

    if (duplicateError) {
      return NextResponse.json({ error: duplicateError.message }, { status: 500 });
    }
    if (existingSub) {
      return NextResponse.json(
        { error: 'This video clip URL has already been submitted for this campaign.' },
        { status: 409 }
      );
    }

    const metrics = await scrapePostMetrics(platform, normalizedUrl);

    const captionLower = (metrics.caption || '').toLowerCase();
    const missingHashtags = (campaign.hashtag_requirements || []).filter(
      (tag: string) => !captionLower.includes(tag.toLowerCase())
    );
    const isHashtagValid = missingHashtags.length === 0;

    // Earnings stay at 0 here. The database trigger computes them from scraped
    // views, enforces the per-clip cap, and caps payout at the remaining pool.
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        campaign_id: campaignId,
        clipper_id: user.id,
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
        return NextResponse.json(
          { error: 'This video clip URL has already been submitted for this campaign.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Clip submitted successfully! Metrics tracked.',
        submission,
        missingHashtags: isHashtagValid ? [] : missingHashtags,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || 'Could not verify the clip right now. Please try again later.',
      },
      { status: 503 }
    );
  }
}
