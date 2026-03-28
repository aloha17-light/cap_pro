import { Router } from 'express';
import { generate, getById } from './problem.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { generateProblemSchema } from './problem.schema';

const router = Router();

// POST /api/problems/generate
router.post('/generate', authMiddleware, validate(generateProblemSchema), generate);

// GET /api/problems/:id
router.get('/:id', authMiddleware, getById);

export default router;
