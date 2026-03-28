// =============================================================================
// JWT Authentication Middleware
// =============================================================================
// Protects routes that require a valid JWT token.
//
// Flow:
//   1. Extract token from `Authorization: Bearer <token>` header
//   2. Verify token signature against JWT_SECRET
//   3. Attach decoded payload { userId } to req.user
//   4. Call next() — downstream handlers can access req.user.userId
//
// Security notes:
//   - Tokens are stateless (no server-side session storage required)
//   - Token expiry is set during signing (see auth.service.ts)
//   - If Redis-based token blacklisting is needed later, check here
//
// Time complexity: O(1) — JWT verification is a constant-time HMAC check
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../lib/errors';

interface JwtPayloadCustom {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Express middleware that enforces JWT authentication.
 * Attaches `req.user = { userId }` on success, throws 401 on failure.
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Step 1: Extract the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw UnauthorizedError('Missing or malformed Authorization header');
    }

    // Step 2: Extract the token (everything after "Bearer ")
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw UnauthorizedError('Token not provided');
    }

    // Step 3: Verify the token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // This is a server configuration error, not a client error
      throw UnauthorizedError('JWT secret not configured');
    }

    const decoded = jwt.verify(token, secret) as JwtPayloadCustom;

    // Step 4: Attach the user payload to the request object
    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    // Handle specific JWT errors with user-friendly messages
    if (error instanceof jwt.JsonWebTokenError) {
      next(UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(UnauthorizedError('Token has expired'));
    } else {
      next(error);
    }
  }
}
