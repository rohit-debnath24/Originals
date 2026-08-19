import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { createChildLogger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();
const logger = createChildLogger('AuthRoutes');

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      throw new ValidationError('walletAddress is required');
    }

    const user = await userService.getOrCreateByWallet(walletAddress);
    logger.info({ userId: user.id, walletAddress }, 'User logged in');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export const authRoutes = router;
