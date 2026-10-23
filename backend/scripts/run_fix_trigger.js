const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Export it before running this script.');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.on('error', (err) => {
  // Catch background disconnects
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');
    
    const sql = fs.readFileSync(path.join(__dirname, 'fix_trigger.sql'), 'utf-8');
    await client.query(sql);
    console.log('SUCCESS: Trigger function handle_new_user() updated successfully!');

    // Test verifying function definition
    const res = await client.query(`
      SELECT proname, prosrc
      FROM pg_proc
      WHERE proname = 'handle_new_user';
    `);
    console.log('Verified updated function in pg_proc:', res.rows[0]?.proname);

    await client.end();
  } catch (err) {
    console.error('FAILED to update trigger:', err);
    process.exit(1);
  }
}

run();
