import { Router } from 'express';
import {
  requestChallenge,
  verifyBioCode,
  getSocialAccounts,
} from '../controllers/socialController.js';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
} from '../controllers/campaignController.js';
import { submitClip, getClipperSubmissions } from '../controllers/submissionController.js';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

const writeLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const verifyLimiter = rateLimit({ windowMs: 60_000, max: 10 });

// Cek status server API
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Verifikasi kepemilikan akun sosmed (Bio Code Challenge)
router.post('/social/challenge', requireAuth, writeLimiter, requestChallenge);
router.post('/social/verify', requireAuth, verifyLimiter, verifyBioCode);
router.get('/social/accounts', requireAuth, getSocialAccounts);

// Manajemen dan eksplorasi campaign
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaignById);
router.post('/campaigns', requireAuth, requireRole('brand', 'admin'), writeLimiter, createCampaign);

// Setor klip video dan riwayat submission kreator
router.post('/submissions', requireAuth, writeLimiter, submitClip);
router.get('/submissions/clipper/:clipperId', requireAuth, getClipperSubmissions);

// Papan peringkat (leaderboard) & metrik agregat platform
router.get('/leaderboard', getLeaderboard);

export default router;
