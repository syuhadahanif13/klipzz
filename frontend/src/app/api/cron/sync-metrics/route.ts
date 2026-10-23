import { NextResponse } from 'next/server';
import { syncActiveSubmissions } from '@/server/syncMetrics';
import { cronConfigured, isCronAuthorized } from '@/server/cron';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 600;

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

  const result = await syncActiveSubmissions();

  if (result.alreadyRunning) {
    return NextResponse.json(
      { success: false, message: 'A sync run is already in progress.', ...result },
      { status: 202 }
    );
  }

  const failed = result.updated === 0 && result.errors.length > 0;
  return NextResponse.json(
    { success: !failed, ...result },
    { status: failed ? 503 : 200 }
  );
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
