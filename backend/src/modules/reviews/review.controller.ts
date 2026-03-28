import { Request, Response, NextFunction } from 'express';
import { scheduleReview, getDueReviews } from './review.service';

export async function schedule(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const review = await scheduleReview(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: review,
      message: 'Problem successfully scheduled for future review.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getDue(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const dueReviews = await getDueReviews(userId);
    
    res.status(200).json({
      success: true,
      data: dueReviews,
    });
  } catch (error) {
    next(error);
  }
}
