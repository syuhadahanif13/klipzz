-- ============================================================================
-- KLIPZZ.VID - PILOT SEED DATA
-- Channel: @DipanggilKeRuangan (DiPanggil ke Ruangan)
-- Host: Arif Brata, Dara Sarasvati
-- ============================================================================

-- 0. SEED AUTH USERS (Prevents foreign key violation on profiles.id -> auth.users.id)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'brand@dipanggilkeruangan.com', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"DiPanggil ke Ruangan Official"}', now(), now()),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fajar@klipzz.vid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fajar Ramadhan"}', now(), now()),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'siti@klipzz.vid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Siti Nurhaliza"}', now(), now()),
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'budi@klipzz.vid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Budi Santoso"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 1. PILOT PROFILES (Brand Owner & Top Clippers)
INSERT INTO public.profiles (id, username, full_name, avatar_url, role, balance, total_earned)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'dipanggilkeruangan_official', 'DiPanggil ke Ruangan Media', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&auto=format&fit=crop&q=80', 'brand', 150000000.00, 0.00),
    ('22222222-2222-2222-2222-222222222222', 'fajar_clipper', 'Fajar Ramadhan', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80', 'clipper', 4250000.00, 4250000.00),
    ('33333333-3333-3333-3333-333333333333', 'siti_potongklip', 'Siti Nurhaliza', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', 'clipper', 2850000.00, 2850000.00),
    ('44444444-4444-4444-4444-444444444444', 'budi_punchline', 'Budi Santoso', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80', 'clipper', 1420000.00, 1420000.00)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    balance = EXCLUDED.balance,
    total_earned = EXCLUDED.total_earned;

-- 2. VERIFIED SOCIAL ACCOUNTS (TikTok & Instagram Reels)
INSERT INTO public.social_accounts (id, user_id, platform, handle, profile_url, verification_code, verification_expires_at, is_verified, verified_at, follower_count)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'tiktok', '@fajar.ngelipzz', 'https://tiktok.com/@fajar.ngelipzz', 'KLIPZZ-89A2', now() - interval '2 days', true, now() - interval '2 days', 145000),
    ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'instagram', '@fajar_reelsfunny', 'https://instagram.com/fajar_reelsfunny', 'KLIPZZ-90B1', now() - interval '3 days', true, now() - interval '3 days', 89000),
    ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'tiktok', '@sitiklips', 'https://tiktok.com/@sitiklips', 'KLIPZZ-44F7', now() - interval '5 days', true, now() - interval '5 days', 210000),
    ('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'tiktok', '@budicomedy.id', 'https://tiktok.com/@budicomedy.id', 'KLIPZZ-12X9', now() - interval '1 day', true, now() - interval '1 day', 64000)
ON CONFLICT (platform, handle) DO NOTHING;

-- 3. CAMPAIGNS (@DipanggilKeRuangan Episodes)
INSERT INTO public.campaigns (
    id,
    brand_id,
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
    'Abdur Arsyad & Mamat Alkatiri - Debat Panas Politik & Sketsa Timur',
    'Potong momen adu argumen kocak antara Abdur dan Mamat Alkatiri saat diinterogasi Arif Brata & Dara Sarasvati. Fokus pada ekspresi panik Mamat dan logika satire Abdur!',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop&q=80',
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
    'Coki Pardede & Onad - Dark Comedy, Pengalaman Rehabilitasi & Industri',
    'Momen roasting tanpa batas dari Coki dan Onad! Ambil punchline gelap nan lucu, reaksi kaget Dara Sarasvati, dan tawa pecah Arif Brata.',
    'https://www.youtube.com/watch?v=kXYiU_JCYtU',
    'kXYiU_JCYtU',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
    '@DipanggilKeRuangan',
    'Coki Pardede & Onadio Leonardo',
    20000000.00,
    13400000.00,
    15000.00,
    1500000.00,
    1000,
    ARRAY['#DipanggilKeRuangan', '#KlipzzViral', '#CokiPardede', '#Onad'],
    'active'
),
(
    'c3333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Praz Teguh & Tretan Muslim - Madura Pride vs Padang Sambalado',
    'Pertarungan dua budaya paling keras di tongkrongan! Momen Tretan Muslim roasting kuliner Padang dan balasan savage dari Praz Teguh.',
    'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    '3JZ_D3ELwOQ',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    '@DipanggilKeRuangan',
    'Praz Teguh & Tretan Muslim',
    15000000.00,
    10250000.00,
    15000.00,
    1500000.00,
    1000,
    ARRAY['#DipanggilKeRuangan', '#KlipzzViral', '#TretanMuslim', '#PrazTeguh'],
    'active'
),
(
    'c4444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Dodit Mulyanto - Biola Maut & Trik PDKT Gadis Desa',
    'Kekocakan Dodit menceritakan kehidupan di rumah hutannya sambil main biola dengan wajah datar khasnya. Sangat cocok untuk clip santai tapi relate di TikTok.',
    'https://www.youtube.com/watch?v=L_LUpnjgPso',
    'L_LUpnjgPso',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    '@DipanggilKeRuangan',
    'Dodit Mulyanto',
    10000000.00,
    8900000.00,
    12000.00,
    1000000.00,
    1000,
    ARRAY['#DipanggilKeRuangan', '#KlipzzViral', '#DoditMulyanto'],
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- 4. PILOT SUBMISSIONS (Active Clips with Valid Hex UUIDs)
INSERT INTO public.submissions (
    id,
    campaign_id,
    clipper_id,
    social_account_id,
    post_url,
    platform,
    post_id,
    caption,
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
    '33333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'https://www.tiktok.com/@sitiklips/video/7329012345678901234',
    'tiktok',
    '7329012345678901234',
    'Coki Pardede pas ditanya menu sarapan di panti rehab, jawabannya bikin Dara bengong 💀 #DipanggilKeRuangan #KlipzzViral #CokiPardede',
    190000,
    31200,
    2400,
    7100,
    1500000.00,
    'approved',
    now() - interval '45 minutes'
),
(
    'e3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    'a4444444-4444-4444-4444-444444444444',
    'https://www.tiktok.com/@budicomedy.id/video/7329123456789012345',
    'tiktok',
    '7329123456789012345',
    'Tretan Muslim vs Praz Teguh debat Bebek Sinjay vs Nasi Kapau! Gak ada yang mau ngalah 🤣 #DipanggilKeRuangan #KlipzzViral',
    82000,
    11500,
    890,
    1850,
    1230000.00,
    'approved',
    now() - interval '2 hours'
)
ON CONFLICT (campaign_id, post_url) DO NOTHING;
