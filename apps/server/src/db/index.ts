import Database, { Database as DatabaseType } from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('Database');

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbDir = process.env['DATABASE_PATH'] 
  ? dirname(process.env['DATABASE_PATH'])
  : join(__dirname, '../../data');

const dbPath = process.env['DATABASE_PATH'] || join(dbDir, 'x402-casino.db');

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  logger.info({ dbDir }, 'Created database directory');
}

logger.info({ dbPath }, 'Connecting to database');

export const db: DatabaseType = new Database(dbPath);

db.pragma('journal_mode = WAL');

/**
 * Initialize database tables for Provably Fair Gaming & x402 Payments
 */
export function initializeDatabase(): void {
  logger.info('Initializing gaming & x402 database...');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      wallet_address TEXT UNIQUE,
      balance_usdc REAL NOT NULL DEFAULT 100.0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Provably Fair Seeds
  db.exec(`
    CREATE TABLE IF NOT EXISTS provably_fair_seeds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      server_seed TEXT NOT NULL,
      server_seed_hash TEXT NOT NULL,
      client_seed TEXT NOT NULL,
      nonce INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Bets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_type TEXT NOT NULL DEFAULT 'DICE',
      bet_amount REAL NOT NULL,
      target_number REAL NOT NULL,
      condition TEXT NOT NULL,
      roll_result REAL,
      multiplier REAL NOT NULL,
      payout REAL NOT NULL,
      status TEXT NOT NULL,
      provably_fair_seed_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (provably_fair_seed_id) REFERENCES provably_fair_seeds(id)
    )
  `);

  // Provably Fair Audit Logs (Append-Only)
  db.exec(`
    CREATE TABLE IF NOT EXISTS provably_fair_logs (
      id TEXT PRIMARY KEY,
      bet_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      server_seed_hash TEXT NOT NULL,
      client_seed TEXT NOT NULL,
      nonce INTEGER NOT NULL,
      outcome REAL NOT NULL,
      revealed_seed TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (bet_id) REFERENCES bets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Ledger entries (Financial State Machine)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USDC',
      type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      balance_after REAL NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // x402 Transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS x402_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      payment_header TEXT,
      amount_usdc REAL NOT NULL,
      tx_hash TEXT,
      network TEXT NOT NULL DEFAULT 'base-sepolia',
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_pf_seeds_user ON provably_fair_seeds(user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
    CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
    CREATE INDEX IF NOT EXISTS idx_pf_logs_bet ON provably_fair_logs(bet_id);
    CREATE INDEX IF NOT EXISTS idx_pf_logs_hash ON provably_fair_logs(server_seed_hash);
    CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_x402_user ON x402_transactions(user_id);
  `);

  logger.info('Gaming database schema initialized successfully');
}

export function closeDatabase(): void {
  db.close();
  logger.info('Database connection closed');
}
