import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabaseService.js';

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// Ambil daftar semua campaign aktif
export async function getCampaigns(req: Request, res: Response) {
  try {
    const { status, guest } = req.query;

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
        return res.status(400).json({ error: 'Invalid campaign status.' });
      }
      query = query.eq('status', parsedStatus.data);
    } else {
      query = query.neq('status', 'draft');
    }

    if (guest) {
      query = query.ilike('episode_guest', `%${String(guest).slice(0, 120)}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ campaigns: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// Ambil detail campaign (support query via slug maupun UUID)
export async function getCampaignById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const isUuid = UUID_RE.test(id);

    let query = supabase
      .from('campaigns')
      .select(
        `
          *,
          brand:profiles!campaigns_brand_id_fkey(username, full_name, avatar_url),
          submissions(
            id,
            post_url,
            platform,
            current_views,
            current_likes,
            earnings,
            status,
            clipper:profiles!submissions_clipper_id_fkey(username, avatar_url)
          )
        `
      );

    query = isUuid ? query.eq('id', id) : query.eq('slug', id);
    const { data: campaign, error } = await query.maybeSingle();

    if (error || !campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    return res.status(200).json({ campaign });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createCampaign(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues.map((issue) => issue.message).join(' '),
      });
    }

    const input = parsed.data;
    const videoId = extractYoutubeVideoId(input.sourceYoutubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Please provide a valid YouTube video URL.' });
    }

    const rate = input.ratePer1kViews ?? 15_000;
    const maxPayout = input.maxPayoutPerClip ?? Math.min(input.rewardPool, 1_500_000);

    if (maxPayout > input.rewardPool) {
      return res.status(400).json({ error: 'Max payout per clip cannot exceed the reward pool.' });
    }

    const slug = await uniqueSlug(input.title);

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        brand_id: req.user.id,
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
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ success: true, campaign: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
