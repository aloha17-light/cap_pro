import { z } from 'zod';
import { ReviewInterval } from '@prisma/client';

export const scheduleReviewSchema = z.object({
  problemId: z.string().uuid('Invalid problem ID format'),
  interval: z.nativeEnum(ReviewInterval, {
    errorMap: () => ({ message: 'Invalid interval. Must be TWO_WEEKS or ONE_MONTH' }),
  }),
});

export type ScheduleReviewInput = z.infer<typeof scheduleReviewSchema>;
