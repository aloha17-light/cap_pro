import { Request, Response, NextFunction } from 'express';
import { getGlobalLeaderboard } from './user.service';

export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const leaderboard = await getGlobalLeaderboard(limit);
    
    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
}
