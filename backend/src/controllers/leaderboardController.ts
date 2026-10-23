import { Request, Response } from 'express';
import { supabase } from '../services/supabaseService.js';

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const { data: topClippers, error: clippersError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, total_earned')
      .eq('role', 'clipper')
      .order('total_earned', { ascending: false })
      .limit(10);

    if (clippersError) {
      return res.status(500).json({ error: clippersError.message });
    }

    const { data: topClips, error: clipsError } = await supabase
      .from('submissions')
      .select(
        `
          id,
          post_url,
          platform,
          current_views,
          current_likes,
          earnings,
          created_at,
          clipper:profiles!submissions_clipper_id_fkey(username, avatar_url),
          campaign:campaigns!submissions_campaign_id_fkey(title, episode_guest)
        `
      )
      .eq('status', 'approved')
      .order('current_views', { ascending: false })
      .limit(10);

    if (clipsError) {
      return res.status(500).json({ error: clipsError.message });
    }

    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('reward_pool, remaining_pool');

    if (campaignsError) {
      return res.status(500).json({ error: campaignsError.message });
    }

    const { count: totalClippers, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'clipper');

    if (countError) {
      return res.status(500).json({ error: countError.message });
    }

    const totalRewardPool =
      campaigns?.reduce((sum, c) => sum + Number(c.reward_pool || 0), 0) || 0;
    const totalRemainingPool =
      campaigns?.reduce((sum, c) => sum + Number(c.remaining_pool || 0), 0) || 0;
    const totalPaidOut = Math.max(0, totalRewardPool - totalRemainingPool);

    return res.status(200).json({
      topClippers: topClippers || [],
      topClips: topClips || [],
      stats: {
        totalRewardPool,
        totalPaidOut,
        totalClippers: totalClippers || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
