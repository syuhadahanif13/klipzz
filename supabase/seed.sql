-- ============================================================================
-- KLIPZZ.VID - SEED DATA (REAL @DipanggilKeRuangan EPISODES)
-- Roles: admin & clipper
-- ============================================================================

-- 0. SEED AUTH USERS
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@dipanggilkeruangan.com', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin DiPanggil ke Ruangan"}', now(), now()),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fajar@klipzz.vid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fajar Ramadhan"}', now(), now()),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'siti@klipzz.vid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Siti Nurhaliza"}', now(), now()),
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'budi@klipzz.vid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Budi Santoso"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 1. PILOT PROFILES (Admin & Top Clippers)
INSERT INTO public.profiles (id, username, full_name, avatar_url, role, balance, total_earned)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin_dipanggilkeruangan', 'Admin DiPanggil ke Ruangan', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&auto=format&fit=crop&q=80', 'admin', 150000000.00, 0.00),
    ('22222222-2222-2222-2222-222222222222', 'fajar_clipper', 'Fajar Ramadhan', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80', 'clipper', 4250000.00, 4250000.00),
    ('33333333-3333-3333-3333-333333333333', 'siti_potongklip', 'Siti Nurhaliza', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', 'clipper', 2850000.00, 2850000.00),
    ('44444444-4444-4444-4444-444444444444', 'budi_punchline', 'Budi Santoso', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80', 'clipper', 1420000.00, 1420000.00)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    balance = EXCLUDED.balance,
    total_earned = EXCLUDED.total_earned;

-- 2. VERIFIED SOCIAL ACCOUNTS
INSERT INTO public.social_accounts (id, user_id, platform, handle, profile_url, verification_code, verification_expires_at, is_verified, verified_at, follower_count)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'tiktok', '@fajar.ngelipzz', 'https://tiktok.com/@fajar.ngelipzz', 'KLIPZZ-89A2', now() - interval '2 days', true, now() - interval '2 days', 145000),
    ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'instagram', '@fajar_reelsfunny', 'https://instagram.com/fajar_reelsfunny', 'KLIPZZ-90B1', now() - interval '3 days', true, now() - interval '3 days', 89000)
ON CONFLICT (platform, handle) DO NOTHING;

-- 3. CAMPAIGNS (Real Video IDs from @DipanggilKeRuangan)
INSERT INTO public.campaigns (
    id,
    brand_id,
    slug,
    title,
    description,
    source_youtube_url,
    youtube_video_id,
    thumbnail_url,
    channel_name,
    episode_guest,
    reward_pool,
    remaining_pool,
    rate_per_1k_views,
    max_payout_per_clip,
    min_views_threshold,
    hashtag_requirements,
    status
) VALUES 
(
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'gara-gara-abdur-mamat-alkatiri-udah-gamau-main-film-lagi',
    'GARA GARA ABDUR, MAMAT ALKATIRI UDAH GAMAU MAIN FILM LAGI!',
    'Potong momen adu argumen kocak antara Abdur Arsyad dan Mamat Alkatiri saat diinterogasi Arif Brata & Dara Sarasvati. Fokus pada ekspresi panik Mamat dan satir pedas Abdur!',
    'https://www.youtube.com/watch?v=DHiELGxnAS4',
    'DHiELGxnAS4',
    'https://img.youtube.com/vi/DHiELGxnAS4/maxresdefault.jpg',
    '@DipanggilKeRuangan',
    'Abdur Arsyad & Mamat Alkatiri',
    25000000.00,
    16800000.00,
    18000.00,
    2000000.00,
    1000,
    ARRAY['#DipanggilKeRuangan', '#KlipzzViral', '#MamatAlkatiri', '#AbdurArsyad'],
    'active'
),
(
    'c2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'perubahan-dodit-mulyanto-bikin-laura-moane-bertanya-tanya',
    'PERUBAHAN DODIT MULYANTO BIKIN LAURA MOANE BERTANYA-TANYA',
    'Kekocakan Dodit Mulyanto menceritakan kehidupan rumah hutan dan kisah asmara bersama Laura Moane. Respon polos Laura dan reaksi Arif Brata sangat renyah untuk dipotong!',
    'https://www.youtube.com/watch?v=zsgmqtmmNU8',
    'zsgmqtmmNU8',
    'https://img.youtube.com/vi/zsgmqtmmNU8/maxresdefault.jpg',
    '@DipanggilKeRuangan',
    'Dodit Mulyanto & Laura Moane',
    20000000.00,
    14200000.00,
    15000.00,
    1500000.00,
    1000,
    ARRAY['#DipanggilKeRuangan', '#KlipzzViral', '#DoditMulyanto', '#LauraMoane'],
    'active'
),
(
    'c3333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'duo-bahlul-ternyata-seorang-duo-yang-jarang-nongkrong-bareng',
    'DUO BAHLUL TERNYATA SEORANG DUO YANG JARANG NONGKRONG BARENG',
    'Sahil & Kamal (Duo Bahlul) membongkar rahasia dapur persahabatan mereka di hadapan Arif Brata & Dara Sarasvati. Chemistry kocak saat siaran ternyata beda 180 derajat di tongkrongan!',
    'https://www.youtube.com/watch?v=seoLT0fYtOg',
    'seoLT0fYtOg',
    'https://img.youtube.com/vi/seoLT0fYtOg/maxresdefault.jpg',
    '@DipanggilKeRuangan',
    'Duo Bahlul (Sahil & Kamal)',
    15000000.00,
    9850000.00,
    15000.00,
    1500000.00,
    1000,
    ARRAY['#DipanggilKeRuangan', '#KlipzzViral', '#DuoBahlul', '#SahilKamal'],
    'active'
),
(
    'c4444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'aldi-taher-cerita-master-saiful-datang-di-waktu-yang-tepat',
    'ALDI TAHER CERITA MASTER SAIFUL DATANG DI WAKTU YANG TEPAT!',
    'Kisah absurd nan inspiratif dari Aldi Taher yang bikin Arif Brata & Dara Sarasvati tepuk jidat berkali-kali. Komedi spontanitas tiada tanding!',
    'https://www.youtube.com/watch?v=MW_1Cxlrq90',
    'MW_1Cxlrq90',
    'https://img.youtube.com/vi/MW_1Cxlrq90/maxresdefault.jpg',
    '@DipanggilKeRuangan',
    'Aldi Taher',
    15000000.00,
    11400000.00,
    15000.00,
    1500000.00,
    1000,
    ARRAY['#DipanggilKeRuangan', '#KlipzzViral', '#AldiTaher'],
    'active'
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    source_youtube_url = EXCLUDED.source_youtube_url,
    youtube_video_id = EXCLUDED.youtube_video_id,
    thumbnail_url = EXCLUDED.thumbnail_url,
    episode_guest = EXCLUDED.episode_guest,
    reward_pool = EXCLUDED.reward_pool,
    remaining_pool = EXCLUDED.remaining_pool;

-- 4. SUBMISSIONS
-- Seed rows already include their final earnings and profile balances. Disable
-- user triggers so the earnings trigger does not credit the seed twice.
ALTER TABLE public.submissions DISABLE TRIGGER USER;

INSERT INTO public.submissions (
    id,
    campaign_id,
    clipper_id,
    social_account_id,
    post_url,
    platform,
    post_id,
    caption,
    thumbnail_url,
    current_views,
    current_likes,
    current_comments,
    current_shares,
    earnings,
    status,
    last_scraped_at
) VALUES 
(
    'e1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'https://www.tiktok.com/@fajar.ngelipzz/video/7328901234567890123',
    'tiktok',
    '7328901234567890123',
    'Mamat Alkatiri panik pas disodorin amplop misterius sama Arif Brata 😂🔥 #DipanggilKeRuangan #KlipzzViral #MamatAlkatiri',
    'https://img.youtube.com/vi/DHiELGxnAS4/hqdefault.jpg',
    145000,
    23400,
    1820,
    4900,
    2000000.00,
    'approved',
    now() - interval '1 hour'
),
(
    'e2222222-2222-2222-2222-222222222222',
    'c2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'https://www.instagram.com/reel/C8901234567/',
    'instagram',
    'C8901234567',
    'Dodit Mulyanto gombalin Laura Moane pake rumus biola hutan, Dara langsung ngakak 💀 #DipanggilKeRuangan #KlipzzViral',
    'https://img.youtube.com/vi/zsgmqtmmNU8/hqdefault.jpg',
    150000,
    28400,
    1950,
    5200,
    2250000.00,
    'approved',
    now() - interval '45 minutes'
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.submissions ENABLE TRIGGER USER;
