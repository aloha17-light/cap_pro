import { Router } from 'express';
import { submitCode, evaluate } from './submission.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { submitCodeSchema } from './submission.schema';

const router = Router();

// POST /api/submissions/:problemId
// Runs the provided code against Judge0
router.post('/:problemId', authMiddleware, validate(submitCodeSchema), submitCode);

// POST /api/submissions/:submissionId/evaluate
// Calls LangChain to AI-review a specific past submission
router.post('/:submissionId/evaluate', authMiddleware, evaluate);

export default router;
