import { z } from 'zod';
import { Difficulty } from '@prisma/client';

export const generateProblemSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(100, 'Topic is too long'),
  difficulty: z.nativeEnum(Difficulty, {
    errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, or HARD' }),
  }),
});

export type GenerateProblemInput = z.infer<typeof generateProblemSchema>;
