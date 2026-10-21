export type UserRole = 'brand' | 'clipper' | 'admin';
export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube_shorts';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  balance: number;
  total_earned: number;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  handle: string;
  profile_url?: string;
  avatar_url?: string;
  verification_code: string;
  verification_expires_at: string;
  is_verified: boolean;
  verified_at?: string;
  follower_count: number;
}

export interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  source_youtube_url: string;
  youtube_video_id: string;
  thumbnail_url: string;
  channel_name: string;
  episode_guest: string;
  reward_pool: number;
  remaining_pool: number;
  rate_per_1k_views: number;
  max_payout_per_clip: number;
  min_views_threshold: number;
  hashtag_requirements: string[];
  guidelines: string[];
  status: CampaignStatus;
  start_date: string;
  end_date: string;
  brand?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface Submission {
  id: string;
  campaign_id: string;
  clipper_id: string;
  social_account_id?: string;
  post_url: string;
  platform: SocialPlatform;
  post_id?: string;
  caption?: string;
  thumbnail_url?: string;
  current_views: number;
  current_likes: number;
  current_comments: number;
  current_shares: number;
  earnings: number;
  status: SubmissionStatus;
  rejection_reason?: string;
  created_at: string;
  campaign?: {
    id: string;
    title: string;
    channel_name: string;
    episode_guest: string;
    rate_per_1k_views: number;
  };
  clipper?: {
    username: string;
    avatar_url: string;
  };
}
