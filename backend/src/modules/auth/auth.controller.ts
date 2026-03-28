// =============================================================================
// Auth Controller — HTTP Request Handlers
// =============================================================================
// Thin controller layer that:
//   1. Extracts validated data from req.body (already validated by middleware)
//   2. Calls the corresponding service function
//   3. Sends the HTTP response
//
// No business logic lives here. Controllers are pure "glue" between
// Express's req/res and the service layer.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

/**
 * POST /api/auth/register
 * Creates a new user account and returns a JWT.
 *
 * Request body (validated by Zod middleware):
 *   { email: string, username: string, password: string }
 *
 * Response: 201 Created
 *   { success: true, data: { user: UserResponse, token: string } }
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 *
 * Request body (validated by Zod middleware):
 *   { email: string, password: string }
 *
 * Response: 200 OK
 *   { success: true, data: { user: UserResponse, token: string } }
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile.
 * Requires: authMiddleware (sets req.user.userId)
 *
 * Response: 200 OK
 *   { success: true, data: { user: UserResponse } }
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getUserProfile(userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
