-- ============================================================================
-- KLIPZZ.VID - SECURITY HARDENING MIGRATION
-- Apply AFTER 20261021_init_schema.sql.
--
-- What this fixes:
--   1. RLS was explicitly disabled, so the public anon key could read balances
--      and write submissions/campaigns directly. RLS is now enabled with
--      read-only policies; all writes go through the API (service role).
--   2. Profiles expose balance/email to everyone. Those columns are revoked at
--      the column-privilege level; owners read their full row via get_my_profile().
--   3. The earnings trigger only ran on UPDATE and never credited the initial
--      snapshot. It now runs on INSERT and UPDATE, and never pays more than the
--      remaining campaign pool.
--   4. Schema drift: live DB had profiles.email and campaigns.slug but the
--      migration did not.
--   5. Signup could self-assign the 'admin' role through user metadata. New
--      users are now restricted to clipper/brand.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SCHEMA DRIFT
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Give legacy campaigns a unique slug (id suffix guarantees uniqueness).
UPDATE public.campaigns c
SET slug = COALESCE(
    NULLIF(trim(both '-' from regexp_replace(lower(c.title), '[^a-z0-9]+', '-', 'g')), ''),
    'campaign'
  ) || '-' || substr(c.id::text, 1, 6)
WHERE c.slug IS NULL OR btrim(c.slug) = '';

-- De-duplicate any pre-existing duplicate slugs before adding the index.
WITH duplicates AS (
  SELECT id,
         row_number() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
  FROM public.campaigns
  WHERE slug IS NOT NULL
)
UPDATE public.campaigns c
SET slug = c.slug || '-' || substr(c.id::text, 1, 6)
FROM duplicates d
WHERE c.id = d.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_slug_unique
  ON public.campaigns (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role_total_earned
  ON public.profiles (role, total_earned DESC);

-- Auto-generate a slug when a campaign is inserted without one.
CREATE OR REPLACE FUNCTION public.set_campaign_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := COALESCE(
      NULLIF(trim(both '-' from regexp_replace(lower(NEW.title), '[^a-z0-9]+', '-', 'g')), ''),
      'campaign'
    );

    IF EXISTS (SELECT 1 FROM public.campaigns WHERE slug = NEW.slug AND id <> NEW.id) THEN
      NEW.slug := NEW.slug || '-' || substr(NEW.id::text, 1, 6);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_campaign_slug ON public.campaigns;
CREATE TRIGGER trigger_set_campaign_slug
BEFORE INSERT OR UPDATE OF title, slug ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_campaign_slug();

-- ---------------------------------------------------------------------------
-- 2. AUTH SIGNUP TRIGGER (never trust role=admin from client metadata)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_username TEXT;
  final_username TEXT;
  desired_full_name TEXT;
  desired_role user_role;
  counter INT := 0;
BEGIN
  desired_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  IF desired_username IS NULL OR desired_username = '' THEN
    desired_username := 'user_' || substr(NEW.id::text, 1, 6);
  END IF;

  desired_username := lower(regexp_replace(desired_username, '[^a-zA-Z0-9_]', '', 'g'));
  IF desired_username = '' THEN
    desired_username := 'user_' || substr(NEW.id::text, 1, 6);
  END IF;

  final_username := desired_username;

  WHILE EXISTS (
    SELECT 1 FROM public.profiles WHERE username = final_username AND id <> NEW.id
  ) LOOP
    counter := counter + 1;
    final_username := desired_username || counter::text;
    IF counter > 50 THEN
      final_username := desired_username || '_' || substr(NEW.id::text, 1, 4);
      EXIT;
    END IF;
  END LOOP;

  desired_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', final_username);

  BEGIN
    desired_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    desired_role := 'clipper'::user_role;
  END;

  -- Privilege escalation guard: self-signup may only create brand/clipper.
  IF desired_role IS NULL OR desired_role NOT IN ('clipper'::user_role, 'brand'::user_role) THEN
    desired_role := 'clipper'::user_role;
  END IF;

  INSERT INTO public.profiles (
    id, username, email, full_name, avatar_url, role, balance, total_earned
  )
  VALUES (
    NEW.id,
    final_username,
    NEW.email,
    desired_full_name,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
    ),
    desired_role,
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never break auth.users signup because profile creation failed.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. EARNINGS TRIGGER (insert + update, capped by remaining pool)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_submission_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC(15, 2);
  v_max_payout NUMERIC(15, 2);
  v_min_views INT;
  v_remaining NUMERIC(15, 2);
  v_calculated NUMERIC(15, 2);
  v_old_earnings NUMERIC(15, 2) := 0;
  v_diff NUMERIC(15, 2);
  v_total NUMERIC(15, 2);
BEGIN
  -- Only approved submissions earn.
  IF NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT rate_per_1k_views, max_payout_per_clip, min_views_threshold, remaining_pool
  INTO v_rate, v_max_payout, v_min_views, v_remaining
  FROM public.campaigns
  WHERE id = NEW.campaign_id;

  IF v_rate IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.current_views >= COALESCE(v_min_views, 0) THEN
    v_calculated := (NEW.current_views::numeric / 1000.0) * v_rate;
    IF v_calculated > v_max_payout THEN
      v_calculated := v_max_payout;
    END IF;
  ELSE
    v_calculated := 0;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_old_earnings := COALESCE(OLD.earnings, 0);
  END IF;

  -- Earnings never decrease.
  IF v_calculated <= v_old_earnings THEN
    NEW.earnings := v_old_earnings;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  v_diff := v_calculated - v_old_earnings;

  -- Payout can never exceed what is left in the campaign pool.
  IF v_diff > GREATEST(COALESCE(v_remaining, 0), 0) THEN
    v_diff := GREATEST(COALESCE(v_remaining, 0), 0);
  END IF;

  IF v_diff <= 0 THEN
    NEW.earnings := v_old_earnings;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  v_total := v_old_earnings + v_diff;
  NEW.earnings := v_total;
  NEW.updated_at := now();

  UPDATE public.campaigns
  SET remaining_pool = GREATEST(0, remaining_pool - v_diff),
      updated_at = now()
  WHERE id = NEW.campaign_id;

  UPDATE public.profiles
  SET balance = balance + v_diff,
      total_earned = total_earned + v_diff,
      updated_at = now()
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
    v_diff,
    v_total
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_submission_earnings ON public.submissions;
DROP TRIGGER IF EXISTS trigger_calculate_submission_earnings_insert ON public.submissions;
DROP TRIGGER IF EXISTS trigger_calculate_submission_earnings_update ON public.submissions;
CREATE TRIGGER trigger_calculate_submission_earnings_insert
BEFORE INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_submission_earnings();

CREATE TRIGGER trigger_calculate_submission_earnings_update
BEFORE UPDATE OF current_views, status, earnings ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_submission_earnings();

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_ledger ENABLE ROW LEVEL SECURITY;

-- Remove every previous policy on these tables so the rules below are the
-- single source of truth (the original migration had write policies).
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'social_accounts', 'campaigns', 'submissions', 'earnings_ledger')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      policy_row.policyname,
      policy_row.tablename
    );
  END LOOP;
END;
$$;

-- Reads ---------------------------------------------------------------------
CREATE POLICY profiles_select_public
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY social_accounts_select_own
  ON public.social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY campaigns_select_visible
  ON public.campaigns FOR SELECT
  USING (status <> 'draft' OR auth.uid() = brand_id);

CREATE POLICY submissions_select_visible
  ON public.submissions FOR SELECT
  USING (
    auth.uid() = clipper_id
    OR status = 'approved'
    OR EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = submissions.campaign_id
        AND c.brand_id = auth.uid()
    )
  );

CREATE POLICY earnings_ledger_select_own
  ON public.earnings_ledger FOR SELECT
  USING (auth.uid() = clipper_id);

-- There are intentionally NO INSERT/UPDATE/DELETE policies. All writes go
-- through the Express API using the service_role key.

-- Even if a write policy is added later by mistake, remove table-level write
-- privileges from client roles.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.social_accounts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.campaigns FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.submissions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.earnings_ledger FROM anon, authenticated;

-- Hide sensitive profile columns from client roles. The public leaderboard and
-- campaign pages only need the columns below.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, username, full_name, avatar_url, role, total_earned, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- Full profile for the signed-in user only (includes balance/email).
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- The service role bypasses RLS, but make the grants explicit for new tables.
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.social_accounts TO service_role;
GRANT ALL ON public.campaigns TO service_role;
GRANT ALL ON public.submissions TO service_role;
GRANT ALL ON public.earnings_ledger TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE ALL ON FUNCTION public.calculate_submission_earnings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_submission_earnings() TO service_role;

-- ---------------------------------------------------------------------------
-- 5. VERIFICATION QUERIES (run manually after applying)
-- ---------------------------------------------------------------------------
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND tablename IN
--   ('profiles','social_accounts','campaigns','submissions','earnings_ledger');
-- SELECT column_name FROM information_schema.column_privileges
--   WHERE table_name = 'profiles' AND grantee = 'authenticated';
