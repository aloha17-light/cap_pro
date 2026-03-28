import { Router } from 'express';
import { schedule, getDue } from './review.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { scheduleReviewSchema } from './review.schema';

const router = Router();

// GET /api/reviews/due
// Fetches problems the user must practice again today
router.get('/due', authMiddleware, getDue);

// POST /api/reviews
// Schedules an algorithmic problem for a later repetition
router.post('/', authMiddleware, validate(scheduleReviewSchema), schedule);

export default router;
