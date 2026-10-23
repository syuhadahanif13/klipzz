import { ApifyClient } from 'apify-client';

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

let apifyClient: ApifyClient | null | undefined;
let cachedToken: string | undefined;

function getApifyClient(): ApifyClient | null {
  const token = process.env.APIFY_API_TOKEN;
  if (apifyClient !== undefined && cachedToken === token) return apifyClient;

  cachedToken = token;
  apifyClient = token ? new ApifyClient({ token }) : null;
  return apifyClient;
}

export function isApifyConfigured(): boolean {
  return Boolean(getApifyClient());
}

export function isSimulationAllowed(): boolean {
  return process.env.ALLOW_SIMULATION === 'true';
}

function apifyTimeoutMs(): number {
  return Number(process.env.APIFY_TIMEOUT_MS || 120_000);
}

function assertScraperAvailable() {
  if (getApifyClient() || isSimulationAllowed()) return;

  throw new Error(
    'APIFY_API_TOKEN is not configured. Metric scraping is required for payouts. ' +
      'Set APIFY_API_TOKEN, or set ALLOW_SIMULATION=true for local demo data only.'
  );
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${apifyTimeoutMs()}ms`)),
      apifyTimeoutMs()
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function callActor(actorId: string, input: Record<string, unknown>): Promise<any[]> {
  const client = getApifyClient();
  if (!client) throw new Error('Apify client is not configured.');

  const run = await withTimeout(client.actor(actorId).call(input), `Apify actor ${actorId}`);
  const { items } = await withTimeout(
    client.dataset(run.defaultDatasetId).listItems(),
    `Apify dataset ${run.defaultDatasetId}`
  );
  return items as any[];
}

/**
 * Scrapes a public profile and checks whether the verification code appears in
 * the bio. Uses Apify unless ALLOW_SIMULATION=true for local demos.
 */
export async function scrapeProfileBio(
  platform: 'tiktok' | 'instagram',
  handle: string,
  expectedCode: string
): Promise<ProfileBioResult> {
  assertScraperAvailable();

  const cleanHandle = handle.replace('@', '').trim();

  if (!getApifyClient()) {
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
 * Scrapes metrics for a submitted clip.
 */
export async function scrapePostMetrics(
  platform: 'tiktok' | 'instagram',
  postUrl: string
): Promise<PostMetricsResult> {
  assertScraperAvailable();

  if (!getApifyClient()) {
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
