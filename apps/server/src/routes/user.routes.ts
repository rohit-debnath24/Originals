import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { LedgerService } from '../services/ledger.service.js';
import { generateId } from '../utils/helpers.js';

const router = Router();

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id!);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/faucet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id!;
    userService.getOrCreateByWallet(userId);
    const result = LedgerService.processDeposit(userId, 100.0, `faucet_${generateId()}`);
    res.json({
      success: true,
      data: {
        message: 'Top-up of 100 USDC successful!',
        balanceUSDC: result.balanceAfter
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/debit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id!;
    const { amount, referenceId } = req.body;
    userService.getOrCreateByWallet(userId);
    const result = LedgerService.preDebitBet(userId, Number(amount), referenceId || `bet_${generateId()}`);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({
      success: true,
      data: { balanceUSDC: result.balanceAfter }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/credit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id!;
    const { amount, referenceId } = req.body;
    userService.getOrCreateByWallet(userId);
    const result = LedgerService.settleWin(userId, Number(amount), referenceId || `win_${generateId()}`);
    res.json({
      success: true,
      data: { balanceUSDC: result.balanceAfter }
    });
  } catch (error) {
    next(error);
  }
});

export const userRoutes = router;
