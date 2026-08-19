import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('ErrorHandler');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error({ 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    method: req.method 
  }, 'Request error');

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.toApiError(),
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env['NODE_ENV'] === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  });
};
