// =============================================================================
// Auth Validation Schemas (Zod)
// =============================================================================
// Defines the shape of request bodies for authentication endpoints.
// Used by the validate middleware to reject malformed requests at the edge.
//
// Design decision: Zod schemas serve double duty —
//   1. Runtime validation (middleware)
//   2. TypeScript type inference (z.infer<typeof schema>)
// This ensures the controller's type annotations stay in sync with validation.
// =============================================================================

import { z } from 'zod';

/**
 * Schema for POST /api/auth/register
 *
 * Password requirements:
 *   - Minimum 8 characters (NIST SP 800-63B recommendation)
 *   - No maximum (bcrypt truncates at 72 bytes, but we let the hash handle it)
 *
 * Username constraints:
 *   - 3–30 characters
 *   - Alphanumeric + underscores only (URL-safe for future profile URLs)
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be 255 characters or fewer')
    .transform((val) => val.toLowerCase().trim()),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or fewer')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    )
    .transform((val) => val.trim()),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
});

/**
 * Schema for POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),

  password: z.string().min(1, 'Password is required'),
});

// =============================================================================
// Inferred TypeScript Types
// =============================================================================
// These types are derived directly from the Zod schemas, ensuring that the
// controller and service layer always match the validated request shape.
// No manual interface maintenance required.
// =============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
