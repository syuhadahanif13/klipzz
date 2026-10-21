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

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Social Verification (Bio Code Challenge)
router.post('/social/challenge', requestChallenge);
router.post('/social/verify', verifyBioCode);
router.get('/social/accounts', getSocialAccounts);

// Campaigns
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaignById);
router.post('/campaigns', createCampaign);

// Submissions
router.post('/submissions', submitClip);
router.get('/submissions/clipper/:clipperId', getClipperSubmissions);

// Leaderboard & Global Stats
router.get('/leaderboard', getLeaderboard);

export default router;
