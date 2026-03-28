import { Request, Response, NextFunction } from 'express';
import { generateProblem, getProblemById } from './problem.service';

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId; // Guaranteed by authMiddleware
    const problem = await generateProblem(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const problem = await getProblemById(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    next(error);
  }
}
