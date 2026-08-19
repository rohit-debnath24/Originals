import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('RequestLogger');

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    }, 'Request completed');
  });

  next();
};
