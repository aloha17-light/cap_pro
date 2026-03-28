// =============================================================================
// Custom Application Error Class
// =============================================================================
// Provides structured error handling across the application.
//
// `isOperational`:
//   - true  → Expected errors (validation, auth, not found) — safe to expose
//             the error message to the client.
//   - false → Unexpected errors (DB crash, unhandled) — the global error
//             handler returns a generic "Internal Server Error" message.
//
// This distinction is critical for security: operational errors are user-facing,
// while non-operational errors may leak implementation details.
// =============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace in V8 (Node.js)
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly (required when extending built-ins in TS)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// =============================================================================
// Common Error Factory Functions
// =============================================================================
// Convenience wrappers for frequently thrown HTTP error types.
// Using factory functions instead of subclasses keeps the error hierarchy flat
// while maintaining readable call sites.
// =============================================================================

/** 400 Bad Request — invalid input, missing fields */
export const BadRequestError = (message: string = 'Bad request') =>
  new AppError(message, 400);

/** 401 Unauthorized — missing or invalid JWT */
export const UnauthorizedError = (message: string = 'Unauthorized') =>
  new AppError(message, 401);

/** 403 Forbidden — valid JWT but insufficient permissions */
export const ForbiddenError = (message: string = 'Forbidden') =>
  new AppError(message, 403);

/** 404 Not Found — resource does not exist */
export const NotFoundError = (message: string = 'Resource not found') =>
  new AppError(message, 404);

/** 409 Conflict — duplicate resource (e.g., email already registered) */
export const ConflictError = (message: string = 'Resource already exists') =>
  new AppError(message, 409);

/** 429 Too Many Requests — rate limit exceeded */
export const TooManyRequestsError = (message: string = 'Too many requests') =>
  new AppError(message, 429);
