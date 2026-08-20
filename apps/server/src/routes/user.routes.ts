import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { LedgerService } from '../services/ledger.service.js';
import { generateId } from '../utils/helpers.js';

const router = Router();

// GET /api/users/me -> Get current user by wallet (query or default)
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = (req.query.wallet as string) || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
    const user = await userService.getOrCreateByWallet(wallet);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/faucet -> Claim topup for wallet passed in body
router.post('/faucet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletOrId = req.body.wallet || req.body.userId || req.body.id || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
    const user = await userService.getOrCreateByWallet(walletOrId);
    const result = LedgerService.processDeposit(user.id, 100.0, `faucet_${generateId()}`);
    res.json({
      success: true,
      data: {
        message: 'Top-up of 100 USDC successful!',
        balance_usdc: result.balanceAfter,
        balanceUSDC: result.balanceAfter
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id!;
    let user = await userService.getUserByWallet(id);
    if (!user) {
      try {
        user = await userService.getUserById(id);
      } catch {
        user = await userService.getOrCreateByWallet(id);
      }
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/faucet
router.post('/:id/faucet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.id!;
    const targetId = (rawId === 'faucet' && req.body && req.body.wallet) ? req.body.wallet : rawId;
    const user = await userService.getOrCreateByWallet(targetId);
    const result = LedgerService.processDeposit(user.id, 100.0, `faucet_${generateId()}`);
    res.json({
      success: true,
      data: {
        message: 'Top-up of 100 USDC successful!',
        balance_usdc: result.balanceAfter,
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
    const user = await userService.getOrCreateByWallet(userId);
    const result = LedgerService.preDebitBet(user.id, Number(amount), referenceId || `bet_${generateId()}`);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({
      success: true,
      data: { balance_usdc: result.balanceAfter, balanceUSDC: result.balanceAfter }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/credit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id!;
    const { amount, referenceId } = req.body;
    const user = await userService.getOrCreateByWallet(userId);
    const result = LedgerService.settleWin(user.id, Number(amount), referenceId || `win_${generateId()}`);
    res.json({
      success: true,
      data: { balance_usdc: result.balanceAfter, balanceUSDC: result.balanceAfter }
    });
  } catch (error) {
    next(error);
  }
});

export const userRoutes = router;
