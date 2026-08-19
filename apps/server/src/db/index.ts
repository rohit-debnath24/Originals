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

  // Auctions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS auctions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- DUTCH, PENNY, SEALED_HIGHEST, REVERSE_LOWEST
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, LOCKED, SETTLED, CANCELLED
      title TEXT NOT NULL,
      start_price REAL,
      floor_price REAL,
      tick_ms INTEGER DEFAULT 500,
      tick_amount REAL DEFAULT 1.0,
      current_price REAL,
      current_leader_wallet TEXT,
      pot_usdc REAL DEFAULT 0.0,
      bid_count INTEGER DEFAULT 0,
      start_time INTEGER NOT NULL,
      timer_end_ts INTEGER,
      winner_wallet TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Auction Bids
  db.exec(`
    CREATE TABLE IF NOT EXISTS auction_bids (
      id TEXT PRIMARY KEY,
      auction_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      quoted_price REAL,
      settled_price REAL,
      idempotency_key TEXT UNIQUE,
      status TEXT NOT NULL, -- INTENT, LOCKED, SETTLED, REVERTED, REFUNDED
      server_ts INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (auction_id) REFERENCES auctions(id)
    )
  `);

  // Auction Commitments (For Commit-Reveal Sealed Bids)
  db.exec(`
    CREATE TABLE IF NOT EXISTS auction_commitments (
      id TEXT PRIMARY KEY,
      auction_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      commitment_hash TEXT NOT NULL,
      revealed_bid REAL,
      revealed_salt TEXT,
      revealed_at INTEGER,
      entry_fee_paid REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'COMMITTED', -- COMMITTED, REVEALED, FORFEITED, WINNER
      created_at TEXT NOT NULL,
      FOREIGN KEY (auction_id) REFERENCES auctions(id)
    )
  `);

  // Auction Audit Logs (Append-Only)
  db.exec(`
    CREATE TABLE IF NOT EXISTS auction_audit_logs (
      id TEXT PRIMARY KEY,
      auction_id TEXT NOT NULL,
      event_type TEXT NOT NULL, -- TICK, INTENT_LOCK, LOCK_REVERT, BID_ACCEPTED, COMMIT, REVEAL, SETTLED
      payload TEXT NOT NULL,
      server_ns INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (auction_id) REFERENCES auctions(id)
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
    CREATE INDEX IF NOT EXISTS idx_auctions_type_status ON auctions(type, status);
    CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);
    CREATE INDEX IF NOT EXISTS idx_commitments_auction ON auction_commitments(auction_id);
    CREATE INDEX IF NOT EXISTS idx_auction_audit_auction ON auction_audit_logs(auction_id);
  `);

  logger.info('Gaming & Auction database schema initialized successfully');
}

export function closeDatabase(): void {
  db.close();
  logger.info('Database connection closed');
}
