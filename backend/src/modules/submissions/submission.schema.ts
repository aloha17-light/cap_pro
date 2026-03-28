// =============================================================================
// Submission Module — Validation Schema
// =============================================================================

import { z } from 'zod';
import { Language } from '@prisma/client';

export const submitCodeSchema = z.object({
  sourceCode: z.string().min(1, 'Source code cannot be empty'),
  language: z.nativeEnum(Language, {
    errorMap: () => ({ message: 'Unsupported language' }),
  }),
});

export type SubmitCodeInput = z.infer<typeof submitCodeSchema>;
