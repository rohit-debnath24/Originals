import { db } from '../db/index.js';
import { generateId } from '../utils/helpers.js';

export interface AuctionRow {
  id: string;
  type: 'DUTCH' | 'PENNY' | 'SEALED_HIGHEST' | 'REVERSE_LOWEST';
  status: 'PENDING' | 'ACTIVE' | 'LOCKED' | 'SETTLED' | 'CANCELLED';
  title: string;
  start_price?: number;
  floor_price?: number;
  tick_ms?: number;
  tick_amount?: number;
  current_price?: number;
  current_leader_wallet?: string;
  pot_usdc: number;
  bid_count: number;
  start_time: number;
  timer_end_ts?: number;
  winner_wallet?: string;
  created_at: string;
  updated_at: string;
}

export class AuctionRepository {
  public createAuction(auction: Partial<AuctionRow>): AuctionRow {
    const id = auction.id || generateId();
    const nowStr = new Date().toISOString();
    const nowMs = Date.now();

    const stmt = db.prepare(`
      INSERT INTO auctions (
        id, type, status, title, start_price, floor_price, tick_ms, tick_amount,
        current_price, current_leader_wallet, pot_usdc, bid_count, start_time, timer_end_ts, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      auction.type || 'DUTCH',
      auction.status || 'ACTIVE',
      auction.title || 'x402 Speed Auction',
      auction.start_price ?? 100.0,
      auction.floor_price ?? 10.0,
      auction.tick_ms ?? 500,
      auction.tick_amount ?? 1.0,
      auction.current_price ?? (auction.start_price ?? 100.0),
      auction.current_leader_wallet || null,
      auction.pot_usdc ?? 0.0,
      auction.bid_count ?? 0,
      auction.start_time ?? nowMs,
      auction.timer_end_ts || null,
      nowStr,
      nowStr
    );

    return this.getAuctionById(id)!;
  }

  public getAuctionById(id: string): AuctionRow | undefined {
    const stmt = db.prepare('SELECT * FROM auctions WHERE id = ?');
    return stmt.get(id) as AuctionRow | undefined;
  }

  public getActiveAuctions(): AuctionRow[] {
    const stmt = db.prepare("SELECT * FROM auctions WHERE status IN ('ACTIVE', 'LOCKED') ORDER BY created_at DESC");
    return stmt.all() as AuctionRow[];
  }

  public updateAuctionStatus(id: string, status: string, winnerWallet?: string): void {
    const nowStr = new Date().toISOString();
    const stmt = db.prepare('UPDATE auctions SET status = ?, winner_wallet = ?, updated_at = ? WHERE id = ?');
    stmt.run(status, winnerWallet || null, nowStr, id);
  }

  // Check idempotency key to prevent double charges / duplicate bids
  public hasIdempotencyKey(key: string): boolean {
    const stmt = db.prepare('SELECT id FROM auction_bids WHERE idempotency_key = ?');
    return !!stmt.get(key);
  }

  public recordBid(
    auctionId: string,
    wallet: string,
    quotedPrice: number | null,
    status: 'INTENT' | 'LOCKED' | 'SETTLED' | 'REVERTED' | 'REFUNDED',
    idempotencyKey?: string
  ): string {
    const id = generateId();
    const nowStr = new Date().toISOString();
    const nowMs = Date.now();

    const stmt = db.prepare(`
      INSERT INTO auction_bids (id, auction_id, wallet_address, quoted_price, idempotency_key, status, server_ts, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, auctionId, wallet, quotedPrice, idempotencyKey || null, status, nowMs, nowStr);
    return id;
  }

  public updateBidStatus(bidId: string, status: string, settledPrice?: number): void {
    const stmt = db.prepare('UPDATE auction_bids SET status = ?, settled_price = ? WHERE id = ?');
    stmt.run(status, settledPrice ?? null, bidId);
  }

  // Atomic Penny Auction update
  public processPennyBidAtomic(
    auctionId: string,
    newPot: number,
    leaderWallet: string,
    newTimerEndTs: number
  ): void {
    const nowStr = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE auctions 
      SET pot_usdc = ?, current_leader_wallet = ?, timer_end_ts = ?, bid_count = bid_count + 1, updated_at = ?
      WHERE id = ? AND status = 'ACTIVE'
    `);
    stmt.run(newPot, leaderWallet, newTimerEndTs, nowStr, auctionId);
  }

  // Record Audit Log (Append-Only)
  public recordAuditLog(auctionId: string, eventType: string, payload: object): void {
    const id = generateId();
    const nowStr = new Date().toISOString();
    const nowMs = Date.now();

    const stmt = db.prepare(`
      INSERT INTO auction_audit_logs (id, auction_id, event_type, payload, server_ns, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, auctionId, eventType, JSON.stringify(payload), nowMs * 1000, nowStr);
  }

  // Commit-Reveal Database Methods
  public saveCommitment(auctionId: string, wallet: string, commitmentHash: string, entryFee: number): void {
    const id = generateId();
    const nowStr = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO auction_commitments (id, auction_id, wallet_address, commitment_hash, entry_fee_paid, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, auctionId, wallet, commitmentHash, entryFee, nowStr);
  }

  public getCommitmentsByAuction(auctionId: string): any[] {
    const stmt = db.prepare('SELECT * FROM auction_commitments WHERE auction_id = ?');
    return stmt.all(auctionId);
  }

  public updateRevealStatus(
    auctionId: string,
    wallet: string,
    revealedBid: number,
    revealedSalt: string,
    status: 'REVEALED' | 'FORFEITED'
  ): void {
    const nowMs = Date.now();
    const stmt = db.prepare(`
      UPDATE auction_commitments 
      SET revealed_bid = ?, revealed_salt = ?, revealed_at = ?, status = ?
      WHERE auction_id = ? AND wallet_address = ?
    `);
    stmt.run(revealedBid, revealedSalt, nowMs, status, auctionId, wallet);
  }

  public getRecentAuditLogs(limit: number = 30): any[] {
    const stmt = db.prepare('SELECT *, created_at as timestamp FROM auction_audit_logs ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit);
  }
}

export const auctionRepository = new AuctionRepository();
