import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/server/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const isUuid = UUID_RE.test(id);
    const supabase = getSupabaseAdmin();

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
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load campaign.' }, { status: 500 });
  }
}
