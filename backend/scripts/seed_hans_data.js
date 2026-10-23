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

  const hansId = '55555555-5555-5555-5555-555555555555';

  // 1. Cek social accounts untuk clipper_hans
  const soc = await client.query('SELECT * FROM public.social_accounts WHERE user_id = $1;', [hansId]);
  console.log('Social accounts for clipper_hans count:', soc.rows.length);

  if (soc.rows.length === 0) {
    await client.query(`
      INSERT INTO public.social_accounts (
        id, user_id, platform, handle, profile_url, verification_code,
        verification_expires_at, is_verified, verified_at, follower_count
      )
      VALUES 
        (gen_random_uuid(), $1, 'tiktok', '@hans.cutter', 'https://tiktok.com/@hans.cutter', 'KLIPZZ-HANS', now() + interval '30 days', true, now(), 85400),
        (gen_random_uuid(), $1, 'instagram', '@hans_klipzz', 'https://instagram.com/hans_klipzz', 'KLIPZZ-HANS', now() + interval '30 days', true, now(), 42100);
    `, [hansId]);
    console.log('Created verified social accounts for clipper_hans!');
  }

  // 2. Cek submissions untuk clipper_hans
  const subs = await client.query('SELECT * FROM public.submissions WHERE clipper_id = $1;', [hansId]);
  console.log('Submissions for clipper_hans count:', subs.rows.length);

  if (subs.rows.length === 0) {
    const acc = await client.query('SELECT id FROM public.social_accounts WHERE user_id = $1 LIMIT 1;', [hansId]);
    const accId = acc.rows[0]?.id;

    await client.query(`
      INSERT INTO public.submissions (
        id, campaign_id, clipper_id, social_account_id, post_url,
        platform, post_id, caption, thumbnail_url,
        current_views, current_likes, current_comments, current_shares,
        earnings, status, last_scraped_at
      )
      VALUES 
        (
          gen_random_uuid(),
          'c1111111-1111-1111-1111-111111111111',
          $1,
          $2,
          'https://www.tiktok.com/@hans.cutter/video/7328901234567890123',
          'tiktok',
          '7328901234567890123',
          'Mamat Alkatiri kena semprot Abdur Arsyad 😂🔥 #DipanggilKeRuangan #KlipzzViral',
          'https://img.youtube.com/vi/DHiELGxnAS4/hqdefault.jpg',
          98500,
          16200,
          1250,
          3100,
          1773000.00,
          'approved',
          now()
        ),
        (
          gen_random_uuid(),
          'c2222222-2222-2222-2222-222222222222',
          $1,
          $2,
          'https://www.instagram.com/reel/C8901234567/',
          'instagram',
          'C8901234567',
          'Dodit Mulyanto bikin Laura Moane bingung sendiri wkwk #DipanggilKeRuangan #KlipzzViral',
          'https://img.youtube.com/vi/zsgmqtmmNU8/hqdefault.jpg',
          45200,
          8300,
          490,
          1150,
          677000.00,
          'approved',
          now()
        );
    `, [hansId, accId]);
    console.log('Created sample active submissions for clipper_hans!');
  }

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
