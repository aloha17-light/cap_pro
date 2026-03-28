// =============================================================================
// Global Error Handler Middleware
// =============================================================================
// Must be registered LAST in the Express middleware chain (after all routes).
// Catches all errors thrown/passed via next(error) and returns a consistent
// JSON response format.
//
// Error classification:
//   1. AppError (operational)           → Return error's statusCode + message
//   2. Prisma P2002 (unique violation)  → Return 409 Conflict
//   3. Unknown / non-operational        → Return 500 + generic message
//
// Security: Non-operational error details are logged but never sent to client.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

// Prisma error type (avoiding direct import for loose coupling)
interface PrismaClientKnownError {
  code: string;
  meta?: { target?: string[] };
}

/**
 * Checks if an error is a Prisma unique constraint violation (P2002).
 * Prisma throws this when inserting a row that violates a UNIQUE index.
 */
function isPrismaUniqueError(error: unknown): error is PrismaClientKnownError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as PrismaClientKnownError).code === 'P2002'
  );
}

/**
 * Express global error handler.
 * Must have exactly 4 parameters for Express to recognize it as an error handler.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // -------------------------------------------------------------------------
  // Case 1: Known operational errors (AppError)
  // -------------------------------------------------------------------------
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // -------------------------------------------------------------------------
  // Case 2: Prisma unique constraint violation → 409 Conflict
  // -------------------------------------------------------------------------
  if (isPrismaUniqueError(err)) {
    const field = err.meta?.target?.[0] || 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
    return;
  }

  // -------------------------------------------------------------------------
  // Case 3: Unexpected / non-operational errors → 500
  // -------------------------------------------------------------------------
  // Log the full error for debugging but send a generic message to the client
  console.error('🔥 Unhandled error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    // Include stack trace only in development for debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
