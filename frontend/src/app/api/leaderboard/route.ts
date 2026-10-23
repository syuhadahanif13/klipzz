import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/server/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: topClippers, error: clippersError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, total_earned')
      .eq('role', 'clipper')
      .order('total_earned', { ascending: false })
      .limit(10);

    if (clippersError) {
      return NextResponse.json({ error: clippersError.message }, { status: 500 });
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
      return NextResponse.json({ error: clipsError.message }, { status: 500 });
    }

    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('reward_pool, remaining_pool');

    if (campaignsError) {
      return NextResponse.json({ error: campaignsError.message }, { status: 500 });
    }

    const { count: totalClippers, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'clipper');

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const totalRewardPool =
      campaigns?.reduce((sum, c) => sum + Number(c.reward_pool || 0), 0) || 0;
    const totalRemainingPool =
      campaigns?.reduce((sum, c) => sum + Number(c.remaining_pool || 0), 0) || 0;
    const totalPaidOut = Math.max(0, totalRewardPool - totalRemainingPool);

    return NextResponse.json({
      topClippers: topClippers || [],
      topClips: topClips || [],
      stats: {
        totalRewardPool,
        totalPaidOut,
        totalClippers: totalClippers || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to load leaderboard.' },
      { status: 500 }
    );
  }
}
