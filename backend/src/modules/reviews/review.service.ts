import prisma from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { ScheduleReviewInput } from './review.schema';
import { ReviewInterval } from '@prisma/client';

export async function scheduleReview(userId: string, data: ScheduleReviewInput) {
  // 1. Verify the problem exists and user owns it
  const problem = await prisma.problemHistory.findUnique({
    where: { id: data.problemId },
  });

  if (!problem) {
    throw new AppError('Problem not found', 404);
  }

  if (problem.userId !== userId) {
    throw new AppError('Unauthorized access to this problem', 403);
  }

  // 2. Compute the exact date the review will be due based on interval
  const reviewAt = new Date();
  if (data.interval === 'TWO_WEEKS') {
    reviewAt.setDate(reviewAt.getDate() + 14);
  } else if (data.interval === 'ONE_MONTH') {
    reviewAt.setMonth(reviewAt.getMonth() + 1);
  }

  // 3. Upsert effectively: If the user already scheduled this exact problem, update the due date.
  // Otherwise, create a new row.
  const existingReview = await prisma.reviewSchedule.findFirst({
    where: {
      userId,
      problemId: data.problemId,
      completed: false,
    }
  });

  if (existingReview) {
    return prisma.reviewSchedule.update({
      where: { id: existingReview.id },
      data: { reviewAt, interval: data.interval }
    });
  }

  // Create new schedule
  return prisma.reviewSchedule.create({
    data: {
      userId,
      problemId: data.problemId,
      interval: data.interval,
      reviewAt,
    }
  });
}

export async function getDueReviews(userId: string) {
  const now = new Date();
  
  // Find all incomplete reviews where the review date has already passed
  const dueReviews = await prisma.reviewSchedule.findMany({
    where: {
      userId,
      completed: false,
      reviewAt: {
        lte: now, // Less than or equal to current timestamp
      }
    },
    include: {
      problem: {
        select: {
          title: true,
          difficulty: true,
          topic: true,
        }
      }
    },
    orderBy: {
      reviewAt: 'asc' // Show oldest overdue ones first
    }
  });

  return dueReviews;
}
