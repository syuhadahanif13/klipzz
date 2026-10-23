import { timingSafeEqual } from 'crypto';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Cron routes are called by Plesk Scheduled Tasks (or any external scheduler)
 * with `Authorization: Bearer <CRON_SECRET>` or `X-Cron-Secret: <secret>`.
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;
  const provided = bearer || request.headers.get('x-cron-secret') || '';

  return safeEqual(provided, secret);
}

export function cronConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET);
}
