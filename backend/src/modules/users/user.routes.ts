import { Router } from 'express';
import { getLeaderboard } from './user.controller';

const router = Router();

// GET /api/users/leaderboard
// Publicly accessible leaderboard of EL0 ratings and streaks
// (Notice we don't apply authMiddleware so anyone visiting the homepage can see how popular the site is).
router.get('/leaderboard', getLeaderboard);

export default router;
