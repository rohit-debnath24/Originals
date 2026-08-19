import { db } from '../db/index.js';
import { generateId } from '../utils/helpers.js';

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
  status: string;
  provably_fair_seed_id: string;
  created_at: string;
}

export const betRepository = {
  createBet(input: {
    userId: string;
    gameType: string;
    betAmount: number;
    targetNumber: number;
    condition: string;
    multiplier: number;
    provablyFairSeedId: string;
  }): BetRow {
    const now = new Date().toISOString();
    const id = generateId();

    db.prepare(`
      INSERT INTO bets (id, user_id, game_type, bet_amount, target_number, condition, roll_result, multiplier, payout, status, provably_fair_seed_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0, 'RESERVED', ?, ?)
    `).run(
      id,
      input.userId,
      input.gameType,
      input.betAmount,
      input.targetNumber,
      input.condition,
      input.multiplier,
      input.provablyFairSeedId,
      now
    );

    return db.prepare('SELECT * FROM bets WHERE id = ?').get(id) as BetRow;
  },

  settleBet(betId: string, rollResult: number, payout: number, status: 'WON' | 'LOST' | 'REFUNDED'): BetRow {
    db.prepare(`
      UPDATE bets SET roll_result = ?, payout = ?, status = ? WHERE id = ?
    `).run(rollResult, payout, status, betId);

    return db.prepare('SELECT * FROM bets WHERE id = ?').get(betId) as BetRow;
  },

  findById(id: string): BetRow | null {
    const row = db.prepare('SELECT * FROM bets WHERE id = ?').get(id) as BetRow | undefined;
    return row || null;
  },

  getRecentBets(limit: number = 20): BetRow[] {
    return db.prepare("SELECT * FROM bets WHERE status IN ('WON', 'LOST') ORDER BY created_at DESC LIMIT ?").all(limit) as BetRow[];
  },

  getUserBets(userId: string, limit: number = 20): BetRow[] {
    return db.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as BetRow[];
  }
};
