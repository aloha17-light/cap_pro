// =============================================================================
// Auth Routes
// =============================================================================
// Defines the REST endpoints for authentication.
// Each route applies middleware in order: validate → [auth] → controller.
//
// Route table:
//   POST /api/auth/register  → [validate(registerSchema)] → register
//   POST /api/auth/login     → [validate(loginSchema)]    → login
//   GET  /api/auth/profile   → [authMiddleware]            → getProfile
// =============================================================================

import { Router } from 'express';
import { register, login, getProfile } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Public routes — no JWT required
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes — JWT required
router.get('/profile', authMiddleware, getProfile);

export default router;
