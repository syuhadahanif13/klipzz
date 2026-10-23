import { getSupabaseAdmin } from './supabaseAdmin';
import { isApifyConfigured, isSimulationAllowed, scrapePostMetrics } from './apify';

const PAGE_SIZE = 100;
const MAX_PAGES = 100;
const MAX_SYNC_MS = 10 * 60 * 1000;

let isSyncing = false;

interface SubmissionRow {
  id: string;
  campaign_id: string;
  clipper_id: string;
  post_url: string;
  platform: 'tiktok' | 'instagram' | 'youtube_shorts';
  current_views: number | string;
  current_likes: number | string;
}

export interface SyncResult {
  updated: number;
  scanned: number;
  skipped: number;
  errors: string[];
  alreadyRunning?: boolean;
}

/**
 * Refreshes metrics for approved submissions. Invoked by the protected
 * /api/cron/sync-metrics route instead of a permanently-running worker.
 */
export async function syncActiveSubmissions(): Promise<SyncResult> {
  if (isSyncing) {
    return { updated: 0, scanned: 0, skipped: 0, errors: [], alreadyRunning: true };
  }

  if (!isApifyConfigured() && !isSimulationAllowed()) {
    return {
      updated: 0,
      scanned: 0,
      skipped: 0,
      errors: [
        'APIFY_API_TOKEN is not configured; refusing to fabricate metrics. ' +
          'Set APIFY_API_TOKEN (or ALLOW_SIMULATION=true for local demos only).',
      ],
    };
  }

  isSyncing = true;
  const startedAt = Date.now();
  const result: SyncResult = { updated: 0, scanned: 0, skipped: 0, errors: [] };

  try {
    const supabase = getSupabaseAdmin();
    let page = 0;

    while (page < MAX_PAGES) {
      if (Date.now() - startedAt > MAX_SYNC_MS) {
        result.errors.push('Sync time budget reached; remaining submissions will be handled next run.');
        break;
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: submissions, error } = await supabase
        .from('submissions')
        .select(
          'id, campaign_id, clipper_id, post_url, platform, current_views, current_likes'
        )
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) {
        result.errors.push(error.message);
        break;
      }

      if (!submissions || submissions.length === 0) break;

      const rows = submissions as SubmissionRow[];

      for (const sub of rows) {
        if (Date.now() - startedAt > MAX_SYNC_MS) break;

        result.scanned += 1;
        let newViews = Number(sub.current_views);
        let newLikes = Number(sub.current_likes);

        if (isApifyConfigured()) {
          if (sub.platform !== 'tiktok' && sub.platform !== 'instagram') {
            result.skipped += 1;
            continue;
          }

          try {
            const metrics = await scrapePostMetrics(sub.platform, sub.post_url);
            newViews = metrics.views;
            newLikes = metrics.likes;
          } catch (scrapingErr: any) {
            result.skipped += 1;
            result.errors.push(`${sub.post_url}: ${scrapingErr?.message || 'scrape failed'}`);
            continue;
          }
        } else {
          // Explicit local simulation only.
          const growth = Math.floor(Math.random() * 2_500) + 200;
          newViews += growth;
          newLikes += Math.floor(growth * 0.12);
        }

        // This update fires calculate_submission_earnings() in Postgres, which
        // enforces the per-clip cap and never pays more than the remaining pool.
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            current_views: newViews,
            current_likes: newLikes,
            last_scraped_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        if (updateError) {
          result.skipped += 1;
          result.errors.push(`${sub.id}: ${updateError.message}`);
        } else {
          result.updated += 1;
        }
      }

      if (rows.length < PAGE_SIZE) break;
      page += 1;
    }
  } catch (err: any) {
    result.errors.push(err?.message || 'Sync failed.');
  } finally {
    isSyncing = false;
  }

  return result;
}
