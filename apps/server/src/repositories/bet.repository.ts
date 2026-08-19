import { db } from '../db/index.js';
import { generateId } from '../utils/helpers.js';

export type BetStatus = 'RESERVED' | 'WON' | 'LOST' | 'REFUNDED';

export interface BetRow {
  id: string;
  user_id: string;
  game_type: string;
  bet_amount: number;
  target_number: number;
  condition: string;
  roll_result: number | null;
  multiplier: number;
  payout: number;
  status: BetStatus;
  provably_fair_seed_id: string;
  created_at: string;
}

export interface CreateBetInput {
  userId: string;
  gameType: string;
  betAmount: number;
  targetNumber: number;
  condition: string;
  multiplier: number;
  provablyFairSeedId: string;
}

export const betRepository = {
  /**
   * Create a new bet record with status 'RESERVED' in a single atomic database operation.
   */
  createBet(input: CreateBetInput): BetRow {
    const now = new Date().toISOString();
    const id = generateId();

    const row = db.prepare(`
      INSERT INTO bets (
        id, user_id, game_type, bet_amount, target_number, condition, roll_result, multiplier, payout, status, provably_fair_seed_id, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0, 'RESERVED', ?, ?)
      RETURNING *
    `).get(
      id,
      input.userId,
      input.gameType,
      input.betAmount,
      input.targetNumber,
      input.condition,
      input.multiplier,
      input.provablyFairSeedId,
      now
    ) as BetRow;

    return row;
  },

  /**
   * Settle a bet idempotently with protection against double-settlement.
   */
  settleBet(betId: string, rollResult: number, payout: number, status: BetStatus): BetRow {
    // Only update if current status is RESERVED to prevent duplicate settlement race conditions
    const updatedRow = db.prepare(`
      UPDATE bets
      SET roll_result = ?, payout = ?, status = ?
      WHERE id = ? AND status = 'RESERVED'
      RETURNING *
    `).get(rollResult, payout, status, betId) as BetRow | undefined;

    if (updatedRow) {
      return updatedRow;
    }

    // Fallback: If bet was already settled or status wasn't RESERVED, fetch and return current state
    const existingBet = this.findById(betId);
    if (!existingBet) {
      throw new Error(`Bet with ID "${betId}" not found`);
    }

    return existingBet;
  },

  /**
   * Find bet by ID.
   */
  findById(id: string): BetRow | null {
    const row = db.prepare('SELECT * FROM bets WHERE id = ?').get(id) as BetRow | undefined;
    return row || null;
  },

  /**
   * Retrieve recent settled bets with pagination.
   */
  getRecentBets(limit: number = 20, offset: number = 0): BetRow[] {
    return db.prepare(`
      SELECT * FROM bets
      WHERE status IN ('WON', 'LOST')
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as BetRow[];
  },

  /**
   * Retrieve bets for a specific user with pagination.
   */
  getUserBets(userId: string, limit: number = 20, offset: number = 0): BetRow[] {
    return db.prepare(`
      SELECT * FROM bets
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset) as BetRow[];
  }
};

