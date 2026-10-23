import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the worker.');
}

if (
  serviceRoleKey.startsWith('sb_publishable_') ||
  serviceRoleKey === process.env.SUPABASE_ANON_KEY
) {
  console.warn(
    '[Worker] WARNING: SUPABASE_SERVICE_ROLE_KEY looks like an anon/publishable key. ' +
      'Metric updates will fail after the security hardening migration is applied.'
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const apify = APIFY_TOKEN ? new ApifyClient({ token: APIFY_TOKEN }) : null;
const ALLOW_SIMULATION = process.env.ALLOW_SIMULATION === 'true';
const APIFY_TIMEOUT_MS = Number(process.env.APIFY_TIMEOUT_MS || 120_000);

const PAGE_SIZE = 100;
const MAX_PAGES = 100;
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

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${APIFY_TIMEOUT_MS}ms`)),
      APIFY_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function scrapePost(sub: SubmissionRow): Promise<{ views: number; likes: number } | null> {
  if (!apify) return null;

  if (sub.platform === 'tiktok') {
    const run = await withTimeout(
      apify.actor('apidojo/tiktok-scraper').call({
        postURLs: [sub.post_url],
        resultsPerPage: 1,
      }),
      'TikTok scrape'
    );
    const { items } = await withTimeout(
      apify.dataset(run.defaultDatasetId).listItems(),
      'TikTok dataset'
    );
    const post = items[0] as any;
    if (!post) return null;

    return {
      views: Number(post.playCount ?? post.views ?? sub.current_views),
      likes: Number(post.diggCount ?? post.likes ?? sub.current_likes),
    };
  }

  if (sub.platform === 'instagram') {
    const run = await withTimeout(
      apify.actor('sones/instagram-posts-scraper-lowcost').call({
        directUrls: [sub.post_url],
        resultsLimit: 1,
      }),
      'Instagram scrape'
    );
    const { items } = await withTimeout(
      apify.dataset(run.defaultDatasetId).listItems(),
      'Instagram dataset'
    );
    const post = items[0] as any;
    if (!post) return null;

    return {
      // Do not estimate views from likes. Missing view counts stay unchanged.
      views: Number(
        post.videoViewCount ?? post.viewsCount ?? post.playCount ?? sub.current_views
      ),
      likes: Number(post.likesCount ?? sub.current_likes),
    };
  }

  return null;
}

export async function syncActiveSubmissions() {
  if (isSyncing) {
    console.log('[Worker Cron] Previous sync is still running; skipping this tick.');
    return;
  }

  if (!apify && !ALLOW_SIMULATION) {
    console.error(
      '[Worker Cron] APIFY_API_TOKEN is not configured; refusing to fabricate metrics. ' +
        'Set APIFY_API_TOKEN (or ALLOW_SIMULATION=true for local demos only).'
    );
    return;
  }

  isSyncing = true;
  console.log(`[Worker Cron] Starting sync of active submissions at ${new Date().toISOString()}`);

  try {
    let page = 0;
    let totalUpdated = 0;

    while (page < MAX_PAGES) {
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
        console.error('[Worker Cron] Error fetching submissions:', error.message);
        break;
      }

      if (!submissions || submissions.length === 0) break;

      const rows = submissions as SubmissionRow[];

      for (const sub of rows) {
        let newViews = Number(sub.current_views);
        let newLikes = Number(sub.current_likes);

        if (apify) {
          try {
            const metrics = await scrapePost(sub);
            if (!metrics) {
              console.warn(`[Worker Cron] No metrics returned for ${sub.post_url}; skipping.`);
              continue;
            }
            newViews = metrics.views;
            newLikes = metrics.likes;
          } catch (scrapingErr: any) {
            console.error(
              `[Worker Cron] Scraping error for ${sub.post_url}:`,
              scrapingErr.message
            );
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
          console.error(`[Worker Cron] Failed to update submission ${sub.id}:`, updateError.message);
        } else {
          totalUpdated += 1;
          console.log(
            `[Worker Cron] Updated submission ${sub.id}: views ${sub.current_views} -> ${newViews}`
          );
        }
      }

      if (rows.length < PAGE_SIZE) break;
      page += 1;
    }

    console.log(`[Worker Cron] Sync completed. Updated ${totalUpdated} submissions.`);
  } catch (err: any) {
    console.error('[Worker Cron] Exception in syncActiveSubmissions:', err.message);
  } finally {
    isSyncing = false;
  }
}
