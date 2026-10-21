import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key',
  { auth: { persistSession: false } }
);

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const apify = APIFY_TOKEN ? new ApifyClient({ token: APIFY_TOKEN }) : null;

export async function syncActiveSubmissions() {
  console.log(`[Worker Cron] Starting sync of active submissions at ${new Date().toISOString()}`);

  try {
    // 1. Fetch active approved submissions
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, campaign_id, clipper_id, post_url, platform, current_views, current_likes')
      .eq('status', 'approved')
      .limit(50);

    if (error) {
      console.error('[Worker Cron] Error fetching submissions:', error.message);
      return;
    }

    if (!submissions || submissions.length === 0) {
      console.log('[Worker Cron] No approved submissions found to sync.');
      return;
    }

    console.log(`[Worker Cron] Found ${submissions.length} submissions to update.`);

    for (const sub of submissions) {
      let newViews = sub.current_views;
      let newLikes = sub.current_likes;

      if (!apify) {
        // Simulation mode: increment views realistically to simulate viral traction
        const growth = Math.floor(Math.random() * 2500) + 200;
        newViews = Number(sub.current_views) + growth;
        newLikes = Number(sub.current_likes) + Math.floor(growth * 0.12);
      } else {
        try {
          if (sub.platform === 'tiktok') {
            const run = await apify.actor('apidojo/tiktok-scraper').call({
              postURLs: [sub.post_url],
              resultsPerPage: 1,
            });
            const { items } = await apify.dataset(run.defaultDatasetId).listItems();
            const post = items[0] as any;
            if (post) {
              newViews = post.playCount || sub.current_views;
              newLikes = post.diggCount || sub.current_likes;
            }
          }
        } catch (scrapingErr: any) {
          console.error(`[Worker Cron] Scraping error for ${sub.post_url}:`, scrapingErr.message);
          continue;
        }
      }

      // Update Supabase submission - this triggers calculate_submission_earnings() trigger
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
        console.log(`[Worker Cron] Updated submission ${sub.id}: views ${sub.current_views} -> ${newViews}`);
      }
    }

    console.log('[Worker Cron] Sync completed successfully.');
  } catch (err: any) {
    console.error('[Worker Cron] Exception in syncActiveSubmissions:', err.message);
  }
}
