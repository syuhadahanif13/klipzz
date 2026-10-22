-- ============================================================================
-- KLIPZZ.VID - SUPABASE CORE SCHEMA
-- Platform Clipping Campaign & Metrics Tracking System
-- Pilot: Channel YouTube "DiPanggil ke Ruangan" (@DipanggilKeRuangan)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('brand', 'clipper', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE social_platform AS ENUM ('tiktok', 'instagram', 'youtube_shorts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'clipper',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_earned NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SOCIAL ACCOUNTS TABLE (Bio Code Challenge Proof-of-Ownership)
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    handle TEXT NOT NULL,
    profile_url TEXT,
    avatar_url TEXT,
    verification_code TEXT NOT NULL,
    verification_expires_at TIMESTAMPTZ NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    follower_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_platform_handle UNIQUE (platform, handle)
);

-- 5. CAMPAIGNS TABLE (Brand Video Clipping Pool)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source_youtube_url TEXT NOT NULL,
    youtube_video_id TEXT NOT NULL,
    thumbnail_url TEXT,
    channel_name TEXT NOT NULL DEFAULT '@DipanggilKeRuangan',
    episode_guest TEXT,
    reward_pool NUMERIC(15, 2) NOT NULL,
    remaining_pool NUMERIC(15, 2) NOT NULL,
    rate_per_1k_views NUMERIC(15, 2) NOT NULL DEFAULT 15000.00,
    max_payout_per_clip NUMERIC(15, 2) NOT NULL DEFAULT 1500000.00,
    min_views_threshold INT NOT NULL DEFAULT 1000,
    hashtag_requirements TEXT[] NOT NULL DEFAULT ARRAY['#DipanggilKeRuangan', '#KlipzzViral'],
    guidelines TEXT[] DEFAULT ARRAY[
        'Ambil punchline/momen terlucu atau terheboh',
        'Gunakan subtitle/caption yang menarik & dinamis',
        'Wajib sertakan hashtag kampanye di caption video',
        'Dilarang reupload utuh atau memotong konteks yang menyesatkan'
    ],
    status campaign_status NOT NULL DEFAULT 'active',
    start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SUBMISSIONS TABLE (Clipped Content Posts Tracking)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    clipper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
    post_url TEXT NOT NULL,
    platform social_platform NOT NULL,
    post_id TEXT,
    caption TEXT,
    thumbnail_url TEXT,
    current_views BIGINT NOT NULL DEFAULT 0,
    current_likes BIGINT NOT NULL DEFAULT 0,
    current_comments BIGINT NOT NULL DEFAULT 0,
    current_shares BIGINT NOT NULL DEFAULT 0,
    earnings NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status submission_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_campaign_post UNIQUE (campaign_id, post_url)
);

-- 7. EARNINGS LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.earnings_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    clipper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    views_snapshot BIGINT NOT NULL,
    incremental_earnings NUMERIC(15, 2) NOT NULL,
    total_submission_earnings NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON public.social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_verify ON public.social_accounts(platform, handle, is_verified);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_submissions_campaign ON public.submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_submissions_clipper ON public.submissions(clipper_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_last_scraped ON public.submissions(last_scraped_at);

-- 9. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.calculate_submission_earnings()
RETURNS TRIGGER AS $$
DECLARE
    v_rate NUMERIC(15, 2);
    v_max_payout NUMERIC(15, 2);
    v_min_views INT;
    v_new_earnings NUMERIC(15, 2);
    v_earning_diff NUMERIC(15, 2);
BEGIN
    SELECT rate_per_1k_views, max_payout_per_clip, min_views_threshold
    INTO v_rate, v_max_payout, v_min_views
    FROM public.campaigns
    WHERE id = NEW.campaign_id;

    IF NEW.current_views >= v_min_views THEN
        v_new_earnings := (NEW.current_views / 1000.0) * v_rate;
        IF v_new_earnings > v_max_payout THEN
            v_new_earnings := v_max_payout;
        END IF;
    ELSE
        v_new_earnings := 0.00;
    END IF;

    v_earning_diff := v_new_earnings - OLD.earnings;
    NEW.earnings := v_new_earnings;
    NEW.updated_at := timezone('utc'::text, now());

    IF v_earning_diff > 0 THEN
        UPDATE public.campaigns
        SET remaining_pool = GREATEST(0.00, remaining_pool - v_earning_diff)
        WHERE id = NEW.campaign_id;

        UPDATE public.profiles
        SET balance = balance + v_earning_diff,
            total_earned = total_earned + v_earning_diff
        WHERE id = NEW.clipper_id;

        INSERT INTO public.earnings_ledger (
            submission_id,
            clipper_id,
            campaign_id,
            views_snapshot,
            incremental_earnings,
            total_submission_earnings
        ) VALUES (
            NEW.id,
            NEW.clipper_id,
            NEW.campaign_id,
            NEW.current_views,
            v_earning_diff,
            v_new_earnings
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_submission_earnings ON public.submissions;
CREATE TRIGGER trigger_calculate_submission_earnings
BEFORE UPDATE OF current_views ON public.submissions
FOR EACH ROW
WHEN (NEW.status = 'approved' AND NEW.current_views > OLD.current_views)
EXECUTE FUNCTION public.calculate_submission_earnings();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_ledger DISABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Social Accounts Policies
DROP POLICY IF EXISTS "Users can view own social accounts" ON public.social_accounts;
CREATE POLICY "Users can view own social accounts" ON public.social_accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own social accounts" ON public.social_accounts;
CREATE POLICY "Users can insert own social accounts" ON public.social_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own social accounts" ON public.social_accounts;
CREATE POLICY "Users can update own social accounts" ON public.social_accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- Campaigns Policies
DROP POLICY IF EXISTS "Active campaigns viewable by everyone" ON public.campaigns;
CREATE POLICY "Active campaigns viewable by everyone" ON public.campaigns
    FOR SELECT USING (status != 'draft' OR auth.uid() = brand_id);

DROP POLICY IF EXISTS "Brands can create campaigns" ON public.campaigns;
CREATE POLICY "Brands can create campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (auth.uid() = brand_id);

DROP POLICY IF EXISTS "Brands can update own campaigns" ON public.campaigns;
CREATE POLICY "Brands can update own campaigns" ON public.campaigns
    FOR UPDATE USING (auth.uid() = brand_id);

-- Submissions Policies
DROP POLICY IF EXISTS "Clippers view own submissions" ON public.submissions;
CREATE POLICY "Clippers view own submissions" ON public.submissions
    FOR SELECT USING (auth.uid() = clipper_id);

DROP POLICY IF EXISTS "Brands view campaign submissions" ON public.submissions;
CREATE POLICY "Brands view campaign submissions" ON public.submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaigns
            WHERE campaigns.id = submissions.campaign_id AND campaigns.brand_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clippers can insert submissions" ON public.submissions;
CREATE POLICY "Clippers can insert submissions" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = clipper_id);

-- Earnings Ledger Policies
DROP POLICY IF EXISTS "Clippers view own ledger" ON public.earnings_ledger;
CREATE POLICY "Clippers view own ledger" ON public.earnings_ledger
    FOR SELECT USING (auth.uid() = clipper_id);
