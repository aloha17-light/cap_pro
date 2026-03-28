import prisma from '../../lib/prisma';
import { AppError } from '../../lib/errors';

// Computes the leaderboard of all users on the platform, sorted by highest rating.
// If rating is tied, the person with the longest streak wins.
export async function getGlobalLeaderboard(limit: number = 50) {
  const topUsers = await prisma.user.findMany({
    take: limit,
    orderBy: [
      { rating: 'desc' },
      { streak: 'desc' }
    ],
    select: {
      username: true,
      rating: true,
      streak: true,
      createdAt: true
    }
  });

  return topUsers;
}

// =============================================================================
// Background Engine for Ranking Gamification
// =============================================================================

/**
 * Calculates and awards points to a user for an ACCEPTED code submission.
 * Validates they have NOT solved this exact problem previously to prevent farming.
 * Checks calendar bounds to bump their daily Streak.
 */
export async function awardPointsForSolve(userId: string, problemId: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
  
  // 1. Did they already solve this problem?
  // We want to reward them +10/30/60 points ONLY ONCE per problem
  const previousSuccesses = await prisma.submission.count({
    where: {
      userId,
      problemId,
      verdict: 'ACCEPTED'
    }
  });

  // Remember: By the time this runs, the NEW submission isn't technically "in the count block"
  // but if we are intercepting right after creation, the count will be `1`. If it's > 1, they farmed.
  // Wait, if we call this right after creating the 'ACCEPTED' submission, `previousSuccesses` will be 1 for a first time win.
  // If it's 2, they already got it accepted before.
  if (previousSuccesses > 1) {
    return { status: 'ALREADY_SOLVED', pointsAwarded: 0 };
  }

  // 2. Define exactly how many points they get.
  const pointScale = {
    EASY: 10,
    MEDIUM: 30,
    HARD: 60
  };
  const pointsAwarded = pointScale[difficulty];

  // 3. Increment their Daily Streak
  const user = await prisma.user.findUnique({ where: { id: userId }});
  if (!user) throw new AppError("Invalid User for Gamification", 404);

  let updatedStreak = user.streak;
  const now = new Date();
  const lastActive = user.lastActiveAt;

  if (!lastActive) {
    // Brand new day 1
    updatedStreak = 1;
  } else {
    // Check if the difference is more than 1 day (reset streak)
    // Or exactly 1 day (increase streak)
    // Or same day (do nothing to streak)
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysDifference = Math.floor((now.getTime() - lastActive.getTime()) / msPerDay);
    
    if (daysDifference === 1) { // It's the very next day
      updatedStreak += 1;
    } else if (daysDifference > 1) { // They missed a day
      updatedStreak = 1; 
    }
    // If daysDifference === 0, they already bumped streak today
  }

  // 4. Update the user atomically!
  await prisma.user.update({
    where: { id: userId },
    data: {
      rating: { increment: pointsAwarded },
      streak: updatedStreak,
      lastActiveAt: now
    }
  });

  return { status: 'FIRST_BLOOD', pointsAwarded, newStreak: updatedStreak };
}
