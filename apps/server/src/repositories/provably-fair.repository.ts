import { db } from '../db/index.js';
import { generateId } from '../utils/helpers.js';

export interface ProvablyFairSeedRow {
  id: string;
  user_id: string;
  server_seed: string;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  is_active: number;
  created_at: string;
}

export interface ProvablyFairLogRow {
  id: string;
  bet_id: string;
  user_id: string;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  outcome: number;
  revealed_seed?: string;
  created_at: string;
}

export const provablyFairRepository = {
  createSeedPair(userId: string, serverSeed: string, serverSeedHash: string, clientSeed: string): ProvablyFairSeedRow {
    const now = new Date().toISOString();
    const id = generateId();

    // Deactivate previous seeds for user
    db.prepare('UPDATE provably_fair_seeds SET is_active = 0 WHERE user_id = ?').run(userId);

    db.prepare(`
      INSERT INTO provably_fair_seeds (id, user_id, server_seed, server_seed_hash, client_seed, nonce, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 1, ?)
    `).run(id, userId, serverSeed, serverSeedHash, clientSeed, now);

    return this.getActiveSeedPair(userId)!;
  },

  getActiveSeedPair(userId: string): ProvablyFairSeedRow | null {
    const stmt = db.prepare('SELECT * FROM provably_fair_seeds WHERE user_id = ? AND is_active = 1 LIMIT 1');
    const row = stmt.get(userId) as ProvablyFairSeedRow | undefined;
    return row || null;
  },

  incrementNonce(seedId: string): void {
    db.prepare('UPDATE provably_fair_seeds SET nonce = nonce + 1 WHERE id = ?').run(seedId);
  },

  createAuditLog(input: {
    betId: string;
    userId: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    outcome: number;
    revealedSeed?: string;
  }): ProvablyFairLogRow {
    const now = new Date().toISOString();
    const id = generateId();

    db.prepare(`
      INSERT INTO provably_fair_logs (id, bet_id, user_id, server_seed_hash, client_seed, nonce, outcome, revealed_seed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.betId,
      input.userId,
      input.serverSeedHash,
      input.clientSeed,
      input.nonce,
      input.outcome,
      input.revealedSeed || null,
      now
    );

    return db.prepare('SELECT * FROM provably_fair_logs WHERE id = ?').get(id) as ProvablyFairLogRow;
  },

  getAuditLogByBet(betId: string): ProvablyFairLogRow | null {
    const row = db.prepare('SELECT * FROM provably_fair_logs WHERE bet_id = ?').get(betId) as ProvablyFairLogRow | undefined;
    return row || null;
  },

  getRecentAuditLogs(limit: number = 20): ProvablyFairLogRow[] {
    return db.prepare('SELECT * FROM provably_fair_logs ORDER BY created_at DESC LIMIT ?').all(limit) as ProvablyFairLogRow[];
  }
};
