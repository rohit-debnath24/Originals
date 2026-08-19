export type GameType = 'DICE' | 'CRASH' | 'PLINKO';
export type DiceCondition = 'OVER' | 'UNDER';
export type BetStatus = 'RESERVED' | 'WON' | 'LOST' | 'REFUNDED';

export interface DiceBetRequest {
  userId: string;
  betAmount: number;
  targetNumber: number;
  condition: DiceCondition;
  clientSeed?: string;
}

export interface DiceBetResult {
  id: string;
  userId: string;
  gameType: GameType;
  betAmount: number;
  targetNumber: number;
  condition: DiceCondition;
  rollResult: number;
  multiplier: number;
  payout: number;
  status: BetStatus;
  userBalanceAfter: number;
  provablyFair: {
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  };
  createdAt: string;
}
