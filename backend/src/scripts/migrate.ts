import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Supabase PostgreSQL pooler connection for ap-south-1
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.dnytjjvkmtvbagitwlax:06p3FyODWzf28mtN@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

console.log('Connecting to Supabase PostgreSQL at aws-0-ap-south-1.pooler.supabase.com:6543...');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Connected to Supabase PostgreSQL successfully!');

    // Resolve schema and seed paths relative to cwd
    const schemaPath = path.resolve(process.cwd(), '../supabase/migrations/20261021_init_schema.sql');
    const seedPath = path.resolve(process.cwd(), '../supabase/seed.sql');

    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema migration (tables, enums, triggers, RLS)...');
    await client.query(schemaSql);
    console.log('Schema migration applied successfully!');

    console.log(`Reading seed data from ${seedPath}...`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Applying pilot seed data (@DipanggilKeRuangan)...');
    await client.query(seedSql);
    console.log('Seed data applied successfully!');

    // Verification check
    const campaignsCount = await client.query('SELECT count(*) FROM public.campaigns');
    const clippersCount = await client.query('SELECT count(*) FROM public.profiles WHERE role = \'clipper\'');
    const submissionsCount = await client.query('SELECT count(*) FROM public.submissions');

    console.log('\n======================================================');
    console.log(' 🎉 VERIFIKASI SUKSES: SUPABASE DATABASE LIVE!');
    console.log(` - Campaigns @DipanggilKeRuangan : ${campaignsCount.rows[0].count} data`);
    console.log(` - Clippers Aktif Terdaftar      : ${clippersCount.rows[0].count} kreator`);
    console.log(` - Submissions Klip Disetor      : ${submissionsCount.rows[0].count} klip`);
    console.log('======================================================\n');

  } catch (err: any) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
