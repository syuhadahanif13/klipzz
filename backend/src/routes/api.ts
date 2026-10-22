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
import {
  submitClip,
  getClipperSubmissions,
} from '../controllers/submissionController.js';
import { getLeaderboard } from '../controllers/leaderboardController.js';

const router = Router();

// Cek status server API
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Verifikasi kepemilikan akun sosmed (Bio Code Challenge)
router.post('/social/challenge', requestChallenge);
router.post('/social/verify', verifyBioCode);
router.get('/social/accounts', getSocialAccounts);

// Manajemen dan eksplorasi campaign
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaignById);
router.post('/campaigns', createCampaign);

// Setor klip video dan riwayat submission kreator
router.post('/submissions', submitClip);
router.get('/submissions/clipper/:clipperId', getClipperSubmissions);

// Papan peringkat (leaderboard) & metrik agregat platform
router.get('/leaderboard', getLeaderboard);

export default router;
