import { DiceCondition } from '@crypto-inr/shared';

export interface DiceEngineConfig {
  houseEdge?: number; // e.g. 0.01 for 1%
}

export interface DiceCalculation {
  winChance: number;
  multiplier: number;
  isWin: boolean;
  payout: number;
}

export class DiceGameEngine {
  private houseEdge: number;

  constructor(config: DiceEngineConfig = {}) {
    this.houseEdge = config.houseEdge ?? 0.01;
  }

  public calculateMultiplier(targetNumber: number, condition: DiceCondition): { winChance: number; multiplier: number } {
    if (targetNumber < 1 || targetNumber > 98) {
      throw new Error('Target number must be between 1 and 98');
    }

    let winChance: number;
    if (condition === 'OVER') {
      winChance = 100 - targetNumber;
    } else {
      winChance = targetNumber;
    }

    if (winChance <= 0 || winChance >= 100) {
      throw new Error('Invalid win chance calculation');
    }

    const rawMultiplier = (99 / winChance) * (1 - this.houseEdge);
    const multiplier = Math.round(rawMultiplier * 10000) / 10000;

    return {
      winChance: Math.round(winChance * 100) / 100,
      multiplier,
    };
  }

  public resolveBet(
    betAmount: number,
    targetNumber: number,
    condition: DiceCondition,
    rollResult: number
  ): DiceCalculation {
    const { winChance, multiplier } = this.calculateMultiplier(targetNumber, condition);

    let isWin = false;
    if (condition === 'OVER') {
      isWin = rollResult > targetNumber;
    } else {
      isWin = rollResult < targetNumber;
    }

    const payout = isWin ? Math.round(betAmount * multiplier * 100) / 100 : 0;

    return {
      winChance,
      multiplier,
      isWin,
      payout,
    };
  }
}
