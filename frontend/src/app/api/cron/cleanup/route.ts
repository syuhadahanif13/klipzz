import { NextResponse } from 'next/server';
import { cleanupExpiredChallenges } from '@/server/cleanup';
import { cronConfigured, isCronAuthorized } from '@/server/cron';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  if (!cronConfigured()) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on the server.' },
      { status: 500 }
    );
  }

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const result = await cleanupExpiredChallenges();

  return NextResponse.json(
    { success: !result.error, ...result },
    { status: result.error ? 500 : 200 }
  );
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
