import { Request, Response } from 'express';
import { supabase } from '../services/supabaseService.js';

export async function getLeaderboard(req: Request, res: Response) {
  try {
    // 1. Ambil top kreator/clipper dengan total pendapatan tertinggi
    const { data: topClippers, error: clippersError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, total_earned, balance')
      .eq('role', 'clipper')
      .order('total_earned', { ascending: false })
      .limit(10);

    // 2. Ambil klip dengan views terbanyak (video viral)
    const { data: topClips, error: clipsError } = await supabase
      .from('submissions')
      .select(`
        id,
        post_url,
        platform,
        current_views,
        current_likes,
        earnings,
        created_at,
        clipper:profiles!submissions_clipper_id_fkey(username, avatar_url),
        campaign:campaigns!submissions_campaign_id_fkey(title, episode_guest)
      `)
      .order('current_views', { ascending: false })
      .limit(10);

    // 3. Hitung total reward pool dan komisi yang sudah cair
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('reward_pool, remaining_pool');

    const totalRewardPool = campaigns?.reduce((sum, c) => sum + Number(c.reward_pool || 0), 0) || 0;
    const totalRemainingPool = campaigns?.reduce((sum, c) => sum + Number(c.remaining_pool || 0), 0) || 0;
    const totalPaidOut = totalRewardPool - totalRemainingPool;

    return res.status(200).json({
      topClippers: topClippers || [],
      topClips: topClips || [],
      stats: {
        totalRewardPool,
        totalPaidOut,
        totalClippers: topClippers?.length || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
