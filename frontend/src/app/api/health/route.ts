import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/server/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('campaigns').select('id', { head: true, count: 'exact' });

    return NextResponse.json(
      {
        status: error ? 'degraded' : 'ok',
        service: 'klipzz-next-api',
        database: error ? 'unreachable' : 'ok',
        timestamp: new Date().toISOString(),
      },
      { status: error ? 503 : 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'klipzz-next-api',
        error: err?.message || 'Health check failed.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
