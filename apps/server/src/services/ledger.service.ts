import { userRepository, ledgerRepository } from '../repositories/index.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('LedgerService');

export class LedgerService {
  public static preDebitBet(userId: string, betAmount: number, betId: string): { success: boolean; balanceAfter?: number; error?: string } {
    const user = userRepository.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.balance_usdc < betAmount) {
      return { success: false, error: `Insufficient balance. Available: ${user.balance_usdc} USDC, Requested: ${betAmount} USDC` };
    }

    const updatedUser = userRepository.updateBalance(userId, -betAmount);

    ledgerRepository.createEntry({
      userId,
      amount: -betAmount,
      currency: 'USDC',
      type: 'BET_DEBIT',
      referenceId: betId,
      balanceAfter: updatedUser.balance_usdc,
      description: `Stake pre-debit for bet ${betId}`
    });

    logger.info({ userId, betId, betAmount, newBalance: updatedUser.balance_usdc }, 'Stake pre-debited successfully');

    return {
      success: true,
      balanceAfter: updatedUser.balance_usdc
    };
  }

  public static settleWin(userId: string, payout: number, betId: string): { balanceAfter: number } {
    const updatedUser = userRepository.updateBalance(userId, payout);

    ledgerRepository.createEntry({
      userId,
      amount: payout,
      currency: 'USDC',
      type: 'BET_CREDIT',
      referenceId: betId,
      balanceAfter: updatedUser.balance_usdc,
      description: `Payout credit for winning bet ${betId}`
    });

    logger.info({ userId, betId, payout, newBalance: updatedUser.balance_usdc }, 'Winning payout credited');

    return { balanceAfter: updatedUser.balance_usdc };
  }

  public static refundBet(userId: string, betAmount: number, betId: string): { balanceAfter: number } {
    const updatedUser = userRepository.updateBalance(userId, betAmount);

    ledgerRepository.createEntry({
      userId,
      amount: betAmount,
      currency: 'USDC',
      type: 'BET_REFUND',
      referenceId: betId,
      balanceAfter: updatedUser.balance_usdc,
      description: `Emergency refund for bet ${betId}`
    });

    logger.warn({ userId, betId, betAmount, newBalance: updatedUser.balance_usdc }, 'Bet refunded');

    return { balanceAfter: updatedUser.balance_usdc };
  }

  public static processDeposit(userId: string, amount: number, referenceId: string): { balanceAfter: number } {
    const updatedUser = userRepository.updateBalance(userId, amount);

    ledgerRepository.createEntry({
      userId,
      amount,
      currency: 'USDC',
      type: 'DEPOSIT',
      referenceId,
      balanceAfter: updatedUser.balance_usdc,
      description: `x402 USDC Deposit`
    });

    logger.info({ userId, amount, newBalance: updatedUser.balance_usdc }, 'x402 deposit credited');

    return { balanceAfter: updatedUser.balance_usdc };
  }
}
