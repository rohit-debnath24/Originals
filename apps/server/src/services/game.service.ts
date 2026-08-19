import { DiceCondition } from '@crypto-inr/shared';
import { ProvablyFairEngine } from '../engine/provably-fair.js';
import { DiceGameEngine } from '../engine/games/dice.engine.js';
import { userRepository, provablyFairRepository, betRepository } from '../repositories/index.js';
import { LedgerService } from './ledger.service.js';
import { createChildLogger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const logger = createChildLogger('GameService');
const diceEngine = new DiceGameEngine({ houseEdge: 0.01 });

export class GameService {
  public static getOrCreateActiveSeed(userId: string, customClientSeed?: string) {
    userRepository.ensureUserExists(userId);
    let seedPair = provablyFairRepository.getActiveSeedPair(userId);
    if (!seedPair) {
      const serverSeed = ProvablyFairEngine.generateServerSeed();
      const serverSeedHash = ProvablyFairEngine.hashServerSeed(serverSeed);
      const clientSeed = customClientSeed || ProvablyFairEngine.generateClientSeed();

      seedPair = provablyFairRepository.createSeedPair(userId, serverSeed, serverSeedHash, clientSeed);
    }
    return seedPair;
  }

  public static rotateSeedPair(userId: string, newClientSeed?: string) {
    const activeSeed = provablyFairRepository.getActiveSeedPair(userId);
    const revealedSeed = activeSeed ? activeSeed.server_seed : undefined;

    const newServerSeed = ProvablyFairEngine.generateServerSeed();
    const newServerSeedHash = ProvablyFairEngine.hashServerSeed(newServerSeed);
    const clientSeed = newClientSeed || ProvablyFairEngine.generateClientSeed();

    const newSeedPair = provablyFairRepository.createSeedPair(userId, newServerSeed, newServerSeedHash, clientSeed);

    return {
      revealedPreviousServerSeed: revealedSeed,
      activeSeedPair: {
        id: newSeedPair.id,
        serverSeedHash: newSeedPair.server_seed_hash,
        clientSeed: newSeedPair.client_seed,
        nonce: newSeedPair.nonce
      }
    };
  }

  public static playDice(input: {
    userId: string;
    betAmount: number;
    targetNumber: number;
    condition: DiceCondition;
    clientSeed?: string;
  }) {
    const user = userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User', input.userId);
    }

    if (input.betAmount <= 0) {
      throw new ValidationError('Bet amount must be greater than 0');
    }

    const seedPair = this.getOrCreateActiveSeed(input.userId, input.clientSeed);
    const { multiplier } = diceEngine.calculateMultiplier(input.targetNumber, input.condition);

    const bet = betRepository.createBet({
      userId: input.userId,
      gameType: 'DICE',
      betAmount: input.betAmount,
      targetNumber: input.targetNumber,
      condition: input.condition,
      multiplier,
      provablyFairSeedId: seedPair.id
    });

    const debitResult = LedgerService.preDebitBet(input.userId, input.betAmount, bet.id);
    if (!debitResult.success) {
      betRepository.settleBet(bet.id, 0, 0, 'REFUNDED');
      throw new ValidationError(debitResult.error || 'Failed to reserve bet stake');
    }

    try {
      const { outcome } = ProvablyFairEngine.calculateRollOutcome(
        seedPair.server_seed,
        seedPair.client_seed,
        seedPair.nonce
      );

      provablyFairRepository.incrementNonce(seedPair.id);
      const result = diceEngine.resolveBet(input.betAmount, input.targetNumber, input.condition, outcome);

      let finalBalance = debitResult.balanceAfter!;
      let status: 'WON' | 'LOST' = result.isWin ? 'WON' : 'LOST';

      if (result.isWin) {
        const settleResult = LedgerService.settleWin(input.userId, result.payout, bet.id);
        finalBalance = settleResult.balanceAfter;
      }

      const settledBet = betRepository.settleBet(bet.id, outcome, result.payout, status);

      provablyFairRepository.createAuditLog({
        betId: bet.id,
        userId: input.userId,
        serverSeedHash: seedPair.server_seed_hash,
        clientSeed: seedPair.client_seed,
        nonce: seedPair.nonce,
        outcome
      });

      logger.info(
        { betId: bet.id, outcome, isWin: result.isWin, multiplier, payout: result.payout, status },
        'Dice round completed'
      );

      return {
        id: settledBet.id,
        userId: input.userId,
        gameType: 'DICE',
        betAmount: input.betAmount,
        targetNumber: input.targetNumber,
        condition: input.condition,
        rollResult: outcome,
        multiplier,
        payout: result.payout,
        status,
        userBalanceAfter: finalBalance,
        provablyFair: {
          serverSeedHash: seedPair.server_seed_hash,
          clientSeed: seedPair.client_seed,
          nonce: seedPair.nonce
        },
        createdAt: settledBet.created_at
      };
    } catch (error) {
      LedgerService.refundBet(input.userId, input.betAmount, bet.id);
      betRepository.settleBet(bet.id, 0, 0, 'REFUNDED');
      throw error;
    }
  }

  public static verifyRoll(serverSeed: string, clientSeed: string, nonce: number) {
    const serverSeedHash = ProvablyFairEngine.hashServerSeed(serverSeed);
    const { computedHash, computedOutcome } = ProvablyFairEngine.verifyRoll(serverSeed, clientSeed, nonce);

    return {
      isValid: true,
      serverSeedHash,
      computedHash,
      computedOutcome
    };
  }
}
