import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

dotenv.config();

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const apifyClient = APIFY_TOKEN ? new ApifyClient({ token: APIFY_TOKEN }) : null;

// Simulation is opt-in only. Fabricated metrics must never be credited in
// production (or by accident in development) just because a token is missing.
const ALLOW_SIMULATION = process.env.ALLOW_SIMULATION === 'true';
const APIFY_TIMEOUT_MS = Number(process.env.APIFY_TIMEOUT_MS || 120_000);

export interface ProfileBioResult {
  verified: boolean;
  actualBio: string;
  followerCount?: number;
  avatarUrl?: string;
  source: 'apify' | 'simulation';
}

export interface PostMetricsResult {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  caption: string;
  thumbnailUrl?: string;
  postId?: string;
  source: 'apify' | 'simulation';
}

function assertScraperAvailable() {
  if (apifyClient) return;
  if (ALLOW_SIMULATION) return;

  throw new Error(
    'APIFY_API_TOKEN is not configured. Metric scraping is required for payouts. ' +
      'Set APIFY_API_TOKEN, or set ALLOW_SIMULATION=true for local demo data only.'
  );
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

async function callActor(actorId: string, input: Record<string, unknown>): Promise<any[]> {
  if (!apifyClient) throw new Error('Apify client is not configured.');

  const run = await withTimeout(apifyClient.actor(actorId).call(input), `Apify actor ${actorId}`);
  const { items } = await withTimeout(
    apifyClient.dataset(run.defaultDatasetId).listItems(),
    `Apify dataset ${run.defaultDatasetId}`
  );
  return items as any[];
}

/**
 * Scraper verifikasi kode di bio profil sosmed.
 * Cek apakah kode verifikasi (contoh: KLIPZZ-89A2) beneran sudah dipasang di bio publik user.
 */
export async function scrapeProfileBio(
  platform: 'tiktok' | 'instagram',
  handle: string,
  expectedCode: string
): Promise<ProfileBioResult> {
  assertScraperAvailable();

  const cleanHandle = handle.replace('@', '').trim();

  if (!apifyClient) {
    console.log(`[Bio Check] SIMULATION for ${platform} user: @${cleanHandle}`);
    const simulatedBio = `Content Creator | DiPanggil ke Ruangan Fan | Verification: ${expectedCode}`;

    return {
      verified: simulatedBio.includes(expectedCode),
      actualBio: simulatedBio,
      followerCount: 25_400,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      source: 'simulation',
    };
  }

  try {
    if (platform === 'tiktok') {
      const items = await callActor('apidojo/tiktok-scraper', {
        profiles: [cleanHandle],
        resultsPerPage: 1,
        shouldDownloadVideos: false,
      });
      const profile = items[0];
      if (!profile) throw new Error(`TikTok profile @${cleanHandle} not found`);

      const bio = profile.authorMeta?.signature || profile.signature || profile.bio || '';
      const verified = bio.toUpperCase().includes(expectedCode.toUpperCase());

      return {
        verified,
        actualBio: bio,
        followerCount: profile.authorMeta?.fans || 0,
        avatarUrl: profile.authorMeta?.avatar,
        source: 'apify',
      };
    }

    const items = await callActor('sones/instagram-posts-scraper-lowcost', {
      usernames: [cleanHandle],
      resultsLimit: 1,
    });
    const profile = items[0];
    if (!profile) throw new Error(`Instagram profile @${cleanHandle} not found`);

    const bio = profile?.biography || profile?.bio || '';
    const verified = bio.toUpperCase().includes(expectedCode.toUpperCase());

    return {
      verified,
      actualBio: bio,
      followerCount: profile?.followersCount || 0,
      avatarUrl: profile?.profilePicUrl,
      source: 'apify',
    };
  } catch (error: any) {
    console.error(`[Apify Error] Scrape profile failed for @${cleanHandle}:`, error.message);
    throw error;
  }
}

/**
 * Scraper metrik video klip yang disetor.
 * Tracking jumlah views, likes, komentar, dan share video.
 */
export async function scrapePostMetrics(
  platform: 'tiktok' | 'instagram',
  postUrl: string
): Promise<PostMetricsResult> {
  assertScraperAvailable();

  if (!apifyClient) {
    console.log(`[Scraper] SIMULATION for post: ${postUrl}`);
    const views = Math.floor(Math.random() * 45_000) + 12_000;

    return {
      views,
      likes: Math.floor(views * 0.14),
      comments: Math.floor(views * 0.012),
      shares: Math.floor(views * 0.035),
      caption: 'Momen terlucu di episode DiPanggil ke Ruangan! #DipanggilKeRuangan #KlipzzViral',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600',
      postId: 'simulated_post_id',
      source: 'simulation',
    };
  }

  try {
    if (platform === 'tiktok') {
      const items = await callActor('apidojo/tiktok-scraper', {
        postURLs: [postUrl],
        resultsPerPage: 1,
        shouldDownloadVideos: false,
      });
      const post = items[0];
      if (!post) throw new Error('TikTok post data not found');

      return {
        views: post.playCount || post.views || 0,
        likes: post.diggCount || post.likes || 0,
        comments: post.commentCount || 0,
        shares: post.shareCount || 0,
        caption: post.text || post.desc || '',
        thumbnailUrl: post.videoMeta?.coverUrl,
        postId: post.id,
        source: 'apify',
      };
    }

    const items = await callActor('sones/instagram-posts-scraper-lowcost', {
      directUrls: [postUrl],
      resultsLimit: 1,
    });
    const post = items[0];
    if (!post) throw new Error('Instagram post data not found');

    // Never estimate views from likes: that would inflate real payouts.
    return {
      views: post.videoViewCount ?? post.viewsCount ?? post.playCount ?? 0,
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      shares: post.sharesCount || 0,
      caption: post.caption || '',
      thumbnailUrl: post.displayUrl,
      postId: post.id || post.shortCode,
      source: 'apify',
    };
  } catch (error: any) {
    console.error(`[Apify Error] Scrape post metrics failed for ${postUrl}:`, error.message);
    throw error;
  }
}
