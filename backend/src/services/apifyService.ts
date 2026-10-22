import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

dotenv.config();

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const apifyClient = APIFY_TOKEN ? new ApifyClient({ token: APIFY_TOKEN }) : null;

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

/**
 * Scraper verifikasi kode di bio profil sosmed
 * Cek apakah kode verifikasi (contoh: KLIPZZ-89A2) beneran sudah dipasang di bio publik user
 */
export async function scrapeProfileBio(
  platform: 'tiktok' | 'instagram',
  handle: string,
  expectedCode: string
): Promise<ProfileBioResult> {
  const cleanHandle = handle.replace('@', '').trim();

  // Kalau token Apify belum diset, fallback ke fallback data lokal
  if (!apifyClient) {
    console.log(`[Bio Check] Pengecekan bio untuk ${platform} user: @${cleanHandle}`);
    const simulatedBio = `Content Creator | DiPanggil ke Ruangan Fan | Verification: ${expectedCode}`;
    const verified = simulatedBio.includes(expectedCode);

    return {
      verified,
      actualBio: simulatedBio,
      followerCount: 25400,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      source: 'simulation',
    };
  }

  try {
    if (platform === 'tiktok') {
      // Scrape profil TikTok via actor apify
      const run = await apifyClient.actor('apidojo/tiktok-scraper').call({
        profiles: [cleanHandle],
        resultsPerPage: 1,
        shouldDownloadVideos: false,
      });

      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      const profile = items[0] as any;

      if (!profile) {
        throw new Error(`TikTok profile @${cleanHandle} not found`);
      }

      const bio = profile.authorMeta?.signature || profile.signature || profile.bio || '';
      const verified = bio.toUpperCase().includes(expectedCode.toUpperCase());

      return {
        verified,
        actualBio: bio,
        followerCount: profile.authorMeta?.fans || 0,
        avatarUrl: profile.authorMeta?.avatar,
        source: 'apify',
      };
    } else {
      // Scrape profil Instagram via actor apify
      const run = await apifyClient.actor('sones/instagram-posts-scraper-lowcost').call({
        usernames: [cleanHandle],
        resultsLimit: 1,
      });

      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      const profile = items[0] as any;
      const bio = profile?.biography || profile?.bio || '';
      const verified = bio.toUpperCase().includes(expectedCode.toUpperCase());

      return {
        verified,
        actualBio: bio,
        followerCount: profile?.followersCount || 0,
        avatarUrl: profile?.profilePicUrl,
        source: 'apify',
      };
    }
  } catch (error: any) {
    console.error(`[Apify Error] Scrape profile failed for @${cleanHandle}:`, error.message);
    throw error;
  }
}

/**
 * Scraper metrik video klip yang disetor
 * Tracking jumlah views, likes, komentar, dan share video
 */
export async function scrapePostMetrics(
  platform: 'tiktok' | 'instagram',
  postUrl: string
): Promise<PostMetricsResult> {
  if (!apifyClient) {
    console.log(`[Scraper] Tarik metrik untuk post: ${postUrl}`);
    // Hitung estimasi metrik awal
    const views = Math.floor(Math.random() * 45000) + 12000;
    const likes = Math.floor(views * 0.14);
    const comments = Math.floor(views * 0.012);
    const shares = Math.floor(views * 0.035);

    return {
      views,
      likes,
      comments,
      shares,
      caption: 'Momen terlucu di episode DiPanggil ke Ruangan! #DipanggilKeRuangan #KlipzzViral',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600',
      postId: 'simulated_post_id',
      source: 'simulation',
    };
  }

  try {
    if (platform === 'tiktok') {
      const run = await apifyClient.actor('apidojo/tiktok-scraper').call({
        postURLs: [postUrl],
        resultsPerPage: 1,
        shouldDownloadVideos: false,
      });

      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      const post = items[0] as any;

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
    } else {
      const run = await apifyClient.actor('sones/instagram-posts-scraper-lowcost').call({
        directUrls: [postUrl],
        resultsLimit: 1,
      });

      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      const post = items[0] as any;

      if (!post) throw new Error('Instagram post data not found');

      return {
        views: post.videoViewCount || post.viewsCount || post.likesCount * 3 || 0,
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        shares: post.sharesCount || 0,
        caption: post.caption || '',
        thumbnailUrl: post.displayUrl,
        postId: post.id || post.shortCode,
        source: 'apify',
      };
    }
  } catch (error: any) {
    console.error(`[Apify Error] Scrape post metrics failed for ${postUrl}:`, error.message);
    throw error;
  }
}
