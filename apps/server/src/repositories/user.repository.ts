import { db } from '../db/index.js';
import { generateId } from '../utils/helpers.js';

export interface UserRow {
  id: string;
  name: string;
  wallet_address: string | null;
  balance_usdc: number;
  created_at: string;
  updated_at: string;
}

export const userRepository = {
  create(name: string, walletAddress?: string, customId?: string): UserRow {
    const now = new Date().toISOString();
    const id = customId || generateId();

    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, wallet_address, balance_usdc, created_at, updated_at)
      VALUES (?, ?, ?, 100.0, ?, ?)
    `).run(id, name, walletAddress || null, now, now);

    return this.findById(id)!;
  },

  findById(id: string): UserRow | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row || null;
  },

  findByWalletAddress(walletAddress: string): UserRow | null {
    const row = db.prepare('SELECT * FROM users WHERE LOWER(wallet_address) = LOWER(?)').get(walletAddress) as UserRow | undefined;
    return row || null;
  },

  updateBalance(userId: string, delta: number): UserRow {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users SET balance_usdc = balance_usdc + ?, updated_at = ? WHERE id = ?
    `).run(delta, now, userId);

    return this.findById(userId)!;
  },

  getOrCreateByWallet(walletAddress: string): UserRow {
    let user = this.findByWalletAddress(walletAddress);
    if (!user) {
      user = this.create(`Player_${walletAddress.substring(0, 6)}`, walletAddress);
    }
    return user;
  },

  ensureUserExists(userId: string): UserRow {
    let user = this.findById(userId);
    if (!user) {
      user = this.create(`Player_${userId.substring(0, 8)}`, undefined, userId);
    }
    return user;
  }
};
