import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, getSupabaseAdmin } from '@/server/supabaseAdmin';
import { enforceRateLimit } from '@/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createCampaignSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4_000).optional(),
  sourceYoutubeUrl: z.string().trim().url(),
  episodeGuest: z.string().trim().max(120).optional(),
  rewardPool: z.coerce.number().positive().max(1_000_000_000_000),
  ratePer1kViews: z.coerce.number().positive().max(1_000_000_000).optional(),
  maxPayoutPerClip: z.coerce.number().positive().max(1_000_000_000_000).optional(),
  hashtagRequirements: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  guidelines: z.array(z.string().trim().min(1).max(500)).max(30).optional(),
});

function extractYoutubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;

      const match = url.pathname.match(/^\/(?:embed|shorts|v)\/([\w-]{11})/);
      return match ? match[1] : null;
    }
  } catch {
    return null;
  }

  return null;
}

function baseSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function uniqueSlug(title: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const base = baseSlug(title) || 'campaign';
  let candidate = base;

  for (let i = 0; i < 5; i += 1) {
    const { data } = await supabase
      .from('campaigns')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!data) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return `${base}-${Date.now().toString(36)}`;
}

// GET /api/campaigns — public campaign explorer.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const guest = searchParams.get('guest');
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('campaigns')
      .select(
        `
          *,
          brand:profiles!campaigns_brand_id_fkey(username, full_name, avatar_url),
          submissions_count:submissions(count)
        `
      )
      .order('created_at', { ascending: false });

    if (status) {
      const parsedStatus = z.enum(['draft', 'active', 'paused', 'completed']).safeParse(status);
      if (!parsedStatus.success) {
        return NextResponse.json({ error: 'Invalid campaign status.' }, { status: 400 });
      }
      query = query.eq('status', parsedStatus.data);
    } else {
      query = query.neq('status', 'draft');
    }

    if (guest) {
      query = query.ilike('episode_guest', `%${guest.slice(0, 120)}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load campaigns.' }, { status: 500 });
  }
}

// POST /api/campaigns — brand/admin only.
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'campaigns:create', 20);
  if (limited) return limited;

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    if (user.role !== 'brand' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only brand or admin accounts can create campaigns.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(' ') },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const videoId = extractYoutubeVideoId(input.sourceYoutubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Please provide a valid YouTube video URL.' },
        { status: 400 }
      );
    }

    const rate = input.ratePer1kViews ?? 15_000;
    const maxPayout = input.maxPayoutPerClip ?? Math.min(input.rewardPool, 1_500_000);

    if (maxPayout > input.rewardPool) {
      return NextResponse.json(
        { error: 'Max payout per clip cannot exceed the reward pool.' },
        { status: 400 }
      );
    }

    const slug = await uniqueSlug(input.title);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        brand_id: user.id,
        slug,
        title: input.title,
        description:
          input.description || 'Clip momen terbaik dari video podcast DiPanggil ke Ruangan.',
        source_youtube_url: input.sourceYoutubeUrl,
        youtube_video_id: videoId,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        channel_name: '@DipanggilKeRuangan',
        episode_guest: input.episodeGuest || 'Spesial Bintang Tamu',
        reward_pool: input.rewardPool,
        remaining_pool: input.rewardPool,
        rate_per_1k_views: rate,
        max_payout_per_clip: maxPayout,
        hashtag_requirements: input.hashtagRequirements || [
          '#DipanggilKeRuangan',
          '#KlipzzViral',
        ],
        guidelines: input.guidelines || [
          'Ambil punchline/momen terlucu atau terheboh',
          'Gunakan subtitle/caption yang menarik & dinamis',
          'Wajib sertakan hashtag kampanye di caption video',
        ],
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaign: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create campaign.' }, { status: 500 });
  }
}
