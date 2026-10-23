import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/server/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { clipperId: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { clipperId } = params;
    if (clipperId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only view your own submissions.' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submissions: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to load submissions.' },
      { status: 500 }
    );
  }
}
