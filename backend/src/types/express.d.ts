// =============================================================================
// Express Custom Type Extensions
// =============================================================================
// Extends the Express Request interface to include the authenticated user
// payload after JWT verification. This allows all downstream handlers to
// access `req.user.userId` with full TypeScript type safety.
// =============================================================================

import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      /** Populated by auth.middleware.ts after successful JWT verification */
      user?: {
        userId: string;
      };
    }
  }
}

export {};
