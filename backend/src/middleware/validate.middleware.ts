// =============================================================================
// Zod Validation Middleware Factory
// =============================================================================
// Generic middleware that validates req.body against a Zod schema.
//
// Usage:
//   router.post('/register', validate(registerSchema), controller.register);
//
// On validation failure, returns 400 with structured error response:
//   {
//     "success": false,
//     "message": "Validation failed",
//     "errors": [
//       { "field": "email", "message": "Invalid email format" },
//       { "field": "password", "message": "Must be at least 8 characters" }
//     ]
//   }
//
// Design decision: We validate at the middleware layer (before the controller)
// so that controllers can assume req.body is already typed and valid. This
// follows the "fail fast" principle — reject bad input at the edge.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Factory function that returns Express middleware for Zod validation.
 * @param schema - Any Zod schema to validate req.body against
 * @returns Express middleware function
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate — throws ZodError on failure
      // .parse() also transforms/coerces types if the schema defines them
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod's error format into a flat, API-friendly structure
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),    // e.g., "address.zipCode" for nested
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
}
