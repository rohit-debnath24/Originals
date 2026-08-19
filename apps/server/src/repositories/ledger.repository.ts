import { db } from '../db/index.js';
import { generateId } from '../utils/helpers.js';

export interface LedgerEntryRow {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  type: string;
  reference_id: string;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export const ledgerRepository = {
  createEntry(input: {
    userId: string;
    amount: number;
    currency?: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET_DEBIT' | 'BET_CREDIT' | 'BET_REFUND';
    referenceId: string;
    balanceAfter: number;
    description?: string;
  }): LedgerEntryRow {
    const now = new Date().toISOString();
    const id = generateId();

    db.prepare(`
      INSERT INTO ledger_entries (id, user_id, amount, currency, type, reference_id, balance_after, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.userId,
      input.amount,
      input.currency || 'USDC',
      input.type,
      input.referenceId,
      input.balanceAfter,
      input.description || null,
      now
    );

    return db.prepare('SELECT * FROM ledger_entries WHERE id = ?').get(id) as LedgerEntryRow;
  },

  getUserLedger(userId: string, limit: number = 20): LedgerEntryRow[] {
    return db.prepare('SELECT * FROM ledger_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as LedgerEntryRow[];
  }
};
