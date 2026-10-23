import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const adminPass = process.env.ADMIN_SEED_PASSWORD;
const hansPass = process.env.CLIPPER_SEED_PASSWORD;

if (!connectionString) {
  console.error('DATABASE_URL is required. Export it before running this script.');
  process.exit(1);
}

if (!adminPass || !hansPass) {
  console.error(
    'ADMIN_SEED_PASSWORD and CLIPPER_SEED_PASSWORD are required. Export them before running this script.'
  );
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

  // 1. Account: admin (password from ADMIN_SEED_PASSWORD)
  const adminId = '11111111-1111-1111-1111-111111111111';
  const adminEmail = 'admin@klipzz.vid';

  console.log('Configuring account: admin...');
  await pool.query(
    `INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      $2, crypt($3, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Administrator DiPanggil ke Ruangan","username":"admin"}',
      now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = crypt($3, gen_salt('bf')),
      updated_at = now();`,
    [adminId, adminEmail, adminPass]
  );

  await pool.query(
    `INSERT INTO public.profiles (
      id, username, full_name, avatar_url, role, balance, total_earned
    ) VALUES (
      $1, 'admin', 'Administrator DiPanggil ke Ruangan',
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200',
      'admin', 150000000.00, 0.00
    )
    ON CONFLICT (id) DO UPDATE SET
      username = 'admin',
      role = 'admin',
      updated_at = now();`,
    [adminId]
  );

  // 2. Account: clipper_hans (password from CLIPPER_SEED_PASSWORD)
  const hansId = '55555555-5555-5555-5555-555555555555';
  const hansEmail = 'clipper_hans@klipzz.vid';

  console.log('Configuring account: clipper_hans...');
  await pool.query(
    `INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      $2, crypt($3, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Hans Clipper","username":"clipper_hans"}',
      now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = crypt($3, gen_salt('bf')),
      updated_at = now();`,
    [hansId, hansEmail, hansPass]
  );

  await pool.query(
    `INSERT INTO public.profiles (
      id, username, full_name, avatar_url, role, balance, total_earned
    ) VALUES (
      $1, 'clipper_hans', 'Hans Clipper',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      'clipper', 5400000.00, 5400000.00
    )
    ON CONFLICT (id) DO UPDATE SET
      username = 'clipper_hans',
      role = 'clipper',
      updated_at = now();`,
    [hansId]
  );

  await pool.query(
    `INSERT INTO public.social_accounts (
      user_id, platform, handle, profile_url, verification_code, verification_expires_at, is_verified, verified_at, follower_count
    ) VALUES (
      $1, 'tiktok', '@hans_klipzz', 'https://tiktok.com/@hans_klipzz', 'KLIPZZ-HANS', now() + interval '30 days', true, now(), 85000
    )
    ON CONFLICT (platform, handle) DO NOTHING;`,
    [hansId]
  );

  console.log('✅ Accounts successfully created and verified in Supabase:');
  console.log('   1. admin (email: admin@klipzz.vid) | role: admin');
  console.log('   2. clipper_hans (email: clipper_hans@klipzz.vid) | role: clipper');

  const users = await pool.query('SELECT id, email FROM auth.users WHERE email IN ($1, $2)', [adminEmail, hansEmail]);
  console.log('Auth users in DB:', users.rows);

  const profiles = await pool.query('SELECT id, username, role FROM public.profiles WHERE username IN ($1, $2)', ['admin', 'clipper_hans']);
  console.log('Profiles in DB:', profiles.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
