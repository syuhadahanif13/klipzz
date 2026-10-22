import { Request, Response } from 'express';
import { supabase } from '../services/supabaseService.js';

function extractYoutubeVideoId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : 'dQw4w9WgXcQ';
}

export async function getCampaigns(req: Request, res: Response) {
  try {
    const { status, guest } = req.query;

    let query = supabase
      .from('campaigns')
      .select(`
        *,
        brand:profiles!campaigns_brand_id_fkey(username, full_name, avatar_url),
        submissions_count:submissions(count)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    } else {
      query = query.neq('status', 'draft');
    }

    if (guest) {
      query = query.ilike('episode_guest', `%${guest}%`);
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

export async function getCampaignById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase
      .from('campaigns')
      .select(`
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
      `);

    query = isUuid ? query.eq('id', id) : query.eq('slug', id);
    const { data: campaign, error } = await query.maybeSingle();

    if (error || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.status(200).json({ campaign });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createCampaign(req: Request, res: Response) {
  try {
    const {
      brandId,
      title,
      description,
      sourceYoutubeUrl,
      episodeGuest,
      rewardPool,
      ratePer1kViews,
      maxPayoutPerClip,
      hashtagRequirements,
      guidelines,
    } = req.body;

    if (!brandId || !title || !sourceYoutubeUrl || !rewardPool) {
      return res.status(400).json({ error: 'Missing required campaign fields' });
    }

    const videoId = extractYoutubeVideoId(sourceYoutubeUrl);
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        brand_id: brandId,
        title,
        description: description || 'Clip momen terbaik dari video podcast DiPanggil ke Ruangan.',
        source_youtube_url: sourceYoutubeUrl,
        youtube_video_id: videoId,
        thumbnail_url: thumbnailUrl,
        channel_name: '@DipanggilKeRuangan',
        episode_guest: episodeGuest || 'Spesial Bintang Tamu',
        reward_pool: rewardPool,
        remaining_pool: rewardPool,
        rate_per_1k_views: ratePer1kViews || 15000,
        max_payout_per_clip: maxPayoutPerClip || 1500000,
        hashtag_requirements: hashtagRequirements || ['#DipanggilKeRuangan', '#KlipzzViral'],
        guidelines: guidelines || [
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
