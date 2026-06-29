import express from 'express';
import {
  getRewardStats,
  updateActivity
} from '../controllers/rewardController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All reward routes require authentication
router.use(auth);

/**
 * @route   GET /api/rewards/stats
 * @desc    Get reward stats and badges for authenticated user
 * @access  Private
 */
router.get('/stats', getRewardStats);

/**
 * @route   POST /api/rewards/activity
 * @desc    Update user activity and check for badge unlocks
 * @access  Private
 */
router.post('/activity', updateActivity);

export default router;
