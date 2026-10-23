const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Export it before running this script.');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();

  const brandId = '11111111-1111-1111-1111-111111111111'; // Admin DiPanggil ke Ruangan

  const campaigns = [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      slug: 'mamat-alkatiri-abdur-arsyad',
      brand_id: brandId,
      title: 'GARA GARA ABDUR, MAMAT ALKATIRI UDAH GAMAU MAIN FILM LAGI!',
      description: 'Potong momen adu argumen kocak antara Abdur Arsyad dan Mamat Alkatiri saat diinterogasi Arif Brata & Dara Sarasvati. Fokus pada ekspresi panik Mamat dan satir pedas Abdur!',
      source_youtube_url: 'https://www.youtube.com/watch?v=DHiELGxnAS4',
      youtube_video_id: 'DHiELGxnAS4',
      thumbnail_url: 'https://img.youtube.com/vi/DHiELGxnAS4/maxresdefault.jpg',
      channel_name: '@DipanggilKeRuangan',
      episode_guest: 'Abdur Arsyad & Mamat Alkatiri',
      reward_pool: 25000000,
      remaining_pool: 16800000,
      rate_per_1k_views: 18000,
      max_payout_per_clip: 2000000,
      min_views_threshold: 1000,
      hashtag_requirements: ['#DipanggilKeRuangan', '#KlipzzViral', '#MamatAlkatiri', '#AbdurArsyad'],
      guidelines: [
        'Ambil punchline/momen terlucu saat Mamat diroasting',
        'Wajib gunakan subtitle font dinamis',
        'Sertakan hashtag #DipanggilKeRuangan di caption'
      ],
      status: 'active'
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      slug: 'dodit-mulyanto-laura-moane',
      brand_id: brandId,
      title: 'PERUBAHAN DODIT MULYANTO BIKIN LAURA MOANE BERTANYA-TANYA',
      description: 'Kekocakan Dodit Mulyanto menceritakan kehidupan rumah hutan dan kisah asmara bersama Laura Moane. Respon polos Laura dan reaksi Arif Brata sangat renyah untuk dipotong!',
      source_youtube_url: 'https://www.youtube.com/watch?v=zsgmqtmmNU8',
      youtube_video_id: 'zsgmqtmmNU8',
      thumbnail_url: 'https://img.youtube.com/vi/zsgmqtmmNU8/maxresdefault.jpg',
      channel_name: '@DipanggilKeRuangan',
      episode_guest: 'Dodit Mulyanto & Laura Moane',
      reward_pool: 20000000,
      remaining_pool: 14200000,
      rate_per_1k_views: 15000,
      max_payout_per_clip: 1500000,
      min_views_threshold: 1000,
      hashtag_requirements: ['#DipanggilKeRuangan', '#KlipzzViral', '#DoditMulyanto', '#LauraMoane'],
      guidelines: [
        'Fokus pada respon polos Laura dan gombalan Dodit',
        'Subtitle terbaca jelas di layar HP',
        'Gunakan hook 3 detik pertama yang menarik'
      ],
      status: 'active'
    },
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      slug: 'duo-bahlul-sahil-kamal',
      brand_id: brandId,
      title: 'DUO BAHLUL TERNYATA SEORANG DUO YANG JARANG NONGKRONG BARENG',
      description: 'Sahil & Kamal (Duo Bahlul) membongkar rahasia dapur persahabatan mereka di hadapan Arif Brata & Dara Sarasvati. Chemistry kocak saat siaran ternyata beda 180 derajat di tongkrongan!',
      source_youtube_url: 'https://www.youtube.com/watch?v=seoLT0fYtOg',
      youtube_video_id: 'seoLT0fYtOg',
      thumbnail_url: 'https://img.youtube.com/vi/seoLT0fYtOg/maxresdefault.jpg',
      channel_name: '@DipanggilKeRuangan',
      episode_guest: 'Duo Bahlul (Sahil & Kamal)',
      reward_pool: 15000000,
      remaining_pool: 9850000,
      rate_per_1k_views: 15000,
      max_payout_per_clip: 1500000,
      min_views_threshold: 1000,
      hashtag_requirements: ['#DipanggilKeRuangan', '#KlipzzViral', '#DuoBahlul', '#SahilKamal'],
      guidelines: [
        'Potong momen adu argumen saat bongkar rahasia',
        'Sertakan hashtag wajib di caption'
      ],
      status: 'active'
    },
    {
      id: 'c4444444-4444-4444-4444-444444444444',
      slug: 'aldi-taher-master-saiful',
      brand_id: brandId,
      title: 'ALDI TAHER CERITA MASTER SAIFUL DATANG DI WAKTU YANG TEPAT!',
      description: 'Kisah absurd nan inspiratif dari Aldi Taher yang bikin Arif Brata & Dara Sarasvati tepuk jidat berkali-kali. Komedi spontanitas tiada tanding!',
      source_youtube_url: 'https://www.youtube.com/watch?v=MW_1Cxlrq90',
      youtube_video_id: 'MW_1Cxlrq90',
      thumbnail_url: 'https://img.youtube.com/vi/MW_1Cxlrq90/maxresdefault.jpg',
      channel_name: '@DipanggilKeRuangan',
      episode_guest: 'Aldi Taher',
      reward_pool: 15000000,
      remaining_pool: 11400000,
      rate_per_1k_views: 15000,
      max_payout_per_clip: 1500000,
      min_views_threshold: 1000,
      hashtag_requirements: ['#DipanggilKeRuangan', '#KlipzzViral', '#AldiTaher'],
      guidelines: [
        'Momen nyanyi spontan atau punchline absurd Aldi Taher',
        'Durasi klip 30 - 60 detik'
      ],
      status: 'active'
    }
  ];

  for (const c of campaigns) {
    const query = `
      INSERT INTO public.campaigns (
        id, slug, brand_id, title, description, source_youtube_url, youtube_video_id,
        thumbnail_url, channel_name, episode_guest, reward_pool, remaining_pool,
        rate_per_1k_views, max_payout_per_clip, min_views_threshold,
        hashtag_requirements, guidelines, status, start_date, end_date
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now(), now() + interval '30 days'
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
        remaining_pool = EXCLUDED.remaining_pool,
        status = EXCLUDED.status;
    `;

    await client.query(query, [
      c.id, c.slug, c.brand_id, c.title, c.description, c.source_youtube_url, c.youtube_video_id,
      c.thumbnail_url, c.channel_name, c.episode_guest, c.reward_pool, c.remaining_pool,
      c.rate_per_1k_views, c.max_payout_per_clip, c.min_views_threshold,
      c.hashtag_requirements, c.guidelines, c.status
    ]);
  }

  console.log('SUCCESS: All 4 campaigns inserted to Supabase!');
  const res = await client.query('SELECT id, slug, title, status FROM public.campaigns;');
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error seeding campaigns:', err);
  process.exit(1);
});
