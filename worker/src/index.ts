import cron from 'node-cron';
import dotenv from 'dotenv';
import { syncActiveSubmissions } from './tasks/syncMetrics.js';
import { cleanupExpiredChallenges } from './tasks/cleanupChallenges.js';

dotenv.config();

console.log('====================================================');
console.log(' 🚀 klipzz.vid Background Sync & Cron Worker Running');
console.log('====================================================');

// Schedule 1: Sync active clip submissions metrics every 15 minutes (or '*/15 * * * *')
// For demo/development mode, also allow testing via immediate execution
cron.schedule('*/15 * * * *', async () => {
  await syncActiveSubmissions();
});

// Schedule 2: Cleanup expired challenge codes every hour
cron.schedule('0 * * * *', async () => {
  await cleanupExpiredChallenges();
});

// Initial run on worker boot
syncActiveSubmissions();
