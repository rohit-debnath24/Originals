import { auctionRepository, userRepository } from '../repositories/index.js';
import { DutchAuctionEngine } from '../engine/games/dutch-auction.engine.js';
import { PennyAuctionEngine } from '../engine/games/penny-auction.engine.js';
import { SealedAuctionEngine } from '../engine/games/sealed-auction.engine.js';
import { LedgerService } from './ledger.service.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('AuctionService');

// In-memory mutex for Dutch Auction locks to prevent concurrency race conditions
const activeAuctionLocks = new Set<string>();

let wsGatewayInstance: any = null;

export class AuctionService {
  public static setWebSocketGateway(gateway: any) {
    wsGatewayInstance = gateway;
  }

  public static broadcastUpdate(type: string, data: any) {
    if (wsGatewayInstance) {
      wsGatewayInstance.broadcast({ type, data, timestamp: Date.now() });
    }
  }

  /**
   * Initialize default seed auctions if none exist
   */
  public static initDefaultAuctions(): void {
    const active = auctionRepository.getActiveAuctions();
    const activeTypes = new Set(active.map(a => a.type));

    if (active.length === 0) {
      logger.info('Initializing x402 Auction Game instances...');
    }

    // 1. Dutch Auction Royale
    if (!activeTypes.has('DUTCH')) {
      auctionRepository.createAuction({
        type: 'DUTCH',
        title: '⚡ Dutch Auction Royale ($100 Pool)',
        start_price: 150.0,
        floor_price: 10.0,
        tick_ms: 1000,
        tick_amount: 1.0,
        start_time: Date.now(),
        status: 'ACTIVE',
      });
    }

    // 2. 1-Cent Bid Bomb
    if (!activeTypes.has('PENNY')) {
      auctionRepository.createAuction({
        type: 'PENNY',
        title: '💣 1-Cent Bid Bomb Jackpot',
        pot_usdc: 10.0,
        timer_end_ts: Date.now() + 60000,
        status: 'ACTIVE',
      });
    }

    // 3. Sealed-Bid Highest Unique
    if (!activeTypes.has('SEALED_HIGHEST')) {
      auctionRepository.createAuction({
        type: 'SEALED_HIGHEST',
        title: '🙈 Sealed-Bid Highest Unique Auction',
        pot_usdc: 50.0,
        timer_end_ts: Date.now() + 120000,
        status: 'ACTIVE',
      });
    }

    // 4. Reverse Auction Lowest Unmatched
    if (!activeTypes.has('REVERSE_LOWEST')) {
      auctionRepository.createAuction({
        type: 'REVERSE_LOWEST',
        title: '🎯 Reverse Auction: Lowest Unmatched Bidder',
        pot_usdc: 25.0,
        timer_end_ts: Date.now() + 120000,
        status: 'ACTIVE',
      });
    }
  }

  // ==========================================
  // GAME 1: DUTCH AUCTION ROYALE
  // ==========================================

  public static handleDutchBuyIntent(
    auctionId: string,
    wallet: string,
    quotedPrice: number,
    idempotencyKey?: string
  ) {
    const now = Date.now();

    // Idempotency check
    if (idempotencyKey && auctionRepository.hasIdempotencyKey(idempotencyKey)) {
      throw new Error('Duplicate transaction retry detected via idempotency key');
    }

    // Lock check: Avoid race conditions (SET NX)
    if (activeAuctionLocks.has(auctionId)) {
      auctionRepository.recordAuditLog(auctionId, 'LOCK_REJECTED', { wallet, quotedPrice, reason: 'LOCKED_BY_ANOTHER' });
      return { success: false, error: 'SOLD_OUT: Another buyer locked this auction first.' };
    }

    const auction = auctionRepository.getAuctionById(auctionId);
    if (!auction || auction.status !== 'ACTIVE') {
      return { success: false, error: 'Auction is not active or already settled' };
    }

    // Acquire Lock
    activeAuctionLocks.add(auctionId);

    try {
      const config = {
        startPrice: auction.start_price!,
        floorPrice: auction.floor_price!,
        startTimeMs: auction.start_time,
        tickMs: auction.tick_ms!,
        tickAmount: auction.tick_amount!,
      };

      const validation = DutchAuctionEngine.validateQuotedPrice(config, quotedPrice, now);
      if (!validation.valid) {
        activeAuctionLocks.delete(auctionId);
        return {
          success: false,
          error: `Stale or invalid price. Server price is $${validation.serverPrice}, your quote was $${quotedPrice}`,
        };
      }

      // Update DB to LOCKED
      auctionRepository.updateAuctionStatus(auctionId, 'LOCKED');
      const bidId = auctionRepository.recordBid(auctionId, wallet, validation.serverPrice, 'LOCKED', idempotencyKey);

      auctionRepository.recordAuditLog(auctionId, 'INTENT_LOCKED', {
        bidId,
        wallet,
        serverPrice: validation.serverPrice,
        quotedPrice,
        serverTs: now,
      });

      AuctionService.broadcastUpdate('AUCTION_LOCKED', { auctionId, wallet, serverPrice: validation.serverPrice });

      return {
        success: true,
        data: {
          auctionId,
          bidId,
          settlementPriceUsdc: validation.serverPrice,
          paymentHeaderRequired: true,
          network: 'base-sepolia',
          expiresInSeconds: 300,
        },
      };
    } catch (err) {
      activeAuctionLocks.delete(auctionId);
      throw err;
    }
  }

  public static settleDutchAuction(auctionId: string, bidId: string, wallet: string, txHash: string) {
    const auction = auctionRepository.getAuctionById(auctionId);
    if (!auction) throw new Error('Auction not found');

    // Settle Auction
    auctionRepository.updateAuctionStatus(auctionId, 'SETTLED', wallet);
    auctionRepository.updateBidStatus(bidId, 'SETTLED', auction.current_price);
    activeAuctionLocks.delete(auctionId);

    // Record Ledger Winnings Payout
    const user = userRepository.getOrCreateByWallet(wallet);
    LedgerService.processDeposit(user.id, auction.pot_usdc, `dutch_win_${auctionId}`);

    auctionRepository.recordAuditLog(auctionId, 'SETTLED', { wallet, bidId, txHash });
    AuctionService.broadcastUpdate('AUCTION_SETTLED', { auctionId, winner: wallet, prizeUsdc: auction.pot_usdc });

    // Auto-create next active round for Dutch Auction
    AuctionService.initDefaultAuctions();

    return { success: true, winner: wallet, prizeUsdc: auction.pot_usdc };
  }

  public static revertDutchLock(auctionId: string, bidId: string, reason: string) {
    auctionRepository.updateAuctionStatus(auctionId, 'ACTIVE');
    auctionRepository.updateBidStatus(bidId, 'REVERTED');
    activeAuctionLocks.delete(auctionId);

    auctionRepository.recordAuditLog(auctionId, 'LOCK_REVERTED', { bidId, reason });
    AuctionService.initDefaultAuctions();
    return { success: true, message: 'Auction reverted to ACTIVE' };
  }

  // ==========================================
  // GAME 2: 1-CENT BID BOMB (PENNY AUCTION)
  // ==========================================

  public static handlePennyBid(auctionId: string, wallet: string, idempotencyKey?: string) {
    if (idempotencyKey && auctionRepository.hasIdempotencyKey(idempotencyKey)) {
      throw new Error('Duplicate bid detected via idempotency key');
    }

    const now = Date.now();
    const auction = auctionRepository.getAuctionById(auctionId);
    if (!auction || auction.status !== 'ACTIVE') {
      return { success: false, error: 'Penny Auction is not active' };
    }

    if (now > auction.timer_end_ts!) {
      if (auction.current_leader_wallet) {
        const user = userRepository.getOrCreateByWallet(auction.current_leader_wallet);
        LedgerService.processDeposit(user.id, auction.pot_usdc, `penny_win_${auctionId}`);
      }
      auctionRepository.updateAuctionStatus(auctionId, 'SETTLED', auction.current_leader_wallet || undefined);
      auctionRepository.recordAuditLog(auctionId, 'PENNY_EXPIRED_SETTLED', { winner: auction.current_leader_wallet, pot: auction.pot_usdc });

      // Auto-restart fresh round
      AuctionService.initDefaultAuctions();

      return { success: false, error: 'Previous round ended! A new round has started. Try bidding again.' };
    }

    // Atomic DB execution
    const state = {
      potUsdc: auction.pot_usdc,
      currentLeaderWallet: auction.current_leader_wallet || null,
      timerEndTs: auction.timer_end_ts!,
      bidCount: auction.bid_count,
    };

    const { newState, extendedBySoftClose } = PennyAuctionEngine.processBid(state, wallet, now);

    // Charge $0.10 bid fee
    const user = userRepository.getOrCreateByWallet(wallet);
    const debitResult = LedgerService.preDebitBet(user.id, 0.10, `penny_bid_${now}`);
    if (!debitResult.success) {
      return { success: false, error: `Insufficient ledger balance: ${debitResult.error}` };
    }

    // Atomic update
    auctionRepository.processPennyBidAtomic(auctionId, newState.potUsdc, wallet, newState.timerEndTs);
    auctionRepository.recordBid(auctionId, wallet, 0.10, 'SETTLED', idempotencyKey);

    auctionRepository.recordAuditLog(auctionId, 'PENNY_BID_ACCEPTED', {
      wallet,
      newPot: newState.potUsdc,
      timerEndTs: newState.timerEndTs,
      extendedBySoftClose,
    });

    AuctionService.broadcastUpdate('PENNY_BID', {
      auctionId,
      potUsdc: newState.potUsdc,
      currentLeaderWallet: wallet,
      timerEndTs: newState.timerEndTs,
    });

    return {
      success: true,
      data: {
        potUsdc: newState.potUsdc,
        currentLeaderWallet: wallet,
        timerEndTs: newState.timerEndTs,
        extendedBySoftClose,
      },
    };
  }

  // ==========================================
  // GAME 3 & 4: SEALED-BID COMMIT & REVEAL
  // ==========================================

  public static submitCommitment(auctionId: string, wallet: string, commitmentHash: string, entryFee: number = 1.0) {
    const auction = auctionRepository.getAuctionById(auctionId);
    if (!auction || auction.status !== 'ACTIVE') {
      return { success: false, error: 'Auction is not active for commitments' };
    }

    // Charge entry fee
    const user = userRepository.getOrCreateByWallet(wallet);
    const debitResult = LedgerService.preDebitBet(user.id, entryFee, `sealed_commit_${auctionId}`);
    if (!debitResult.success) {
      return { success: false, error: `Commitment fee failed: ${debitResult.error}` };
    }

    auctionRepository.saveCommitment(auctionId, wallet, commitmentHash, entryFee);
    auctionRepository.recordAuditLog(auctionId, 'COMMITMENT_SUBMITTED', { wallet, commitmentHash, entryFee });
    AuctionService.broadcastUpdate('COMMITMENT_SUBMITTED', { auctionId, wallet });

    return { success: true, message: 'Commitment hash accepted & entry fee paid.' };
  }

  public static submitReveal(auctionId: string, wallet: string, revealedBid: number, revealedSalt: string) {
    const commitments = auctionRepository.getCommitmentsByAuction(auctionId);
    const existing = commitments
      .slice()
      .reverse()
      .find((c: any) => c.wallet_address.toLowerCase() === wallet.toLowerCase() && c.status === 'COMMITTED');

    if (!existing) {
      return { success: false, error: 'No active commitment found for this wallet' };
    }

    const isValid = SealedAuctionEngine.verifyReveal(existing.commitment_hash, revealedBid, revealedSalt, wallet);
    if (!isValid) {
      auctionRepository.updateRevealStatus(auctionId, wallet, revealedBid, revealedSalt, 'FORFEITED');
      auctionRepository.recordAuditLog(auctionId, 'REVEAL_FORFEITED', { wallet, reason: 'HASH_MISMATCH' });
      return { success: false, error: 'Hash mismatch! Reveal rejected and entry fee forfeited.' };
    }

    auctionRepository.updateRevealStatus(auctionId, wallet, revealedBid, revealedSalt, 'REVEALED');
    auctionRepository.recordAuditLog(auctionId, 'REVEAL_ACCEPTED', { wallet, revealedBid });
    AuctionService.broadcastUpdate('REVEAL_ACCEPTED', { auctionId, wallet });

    return { success: true, message: 'Reveal verified and accepted.' };
  }

  public static resolveSealedAuction(auctionId: string) {
    const auction = auctionRepository.getAuctionById(auctionId);
    if (!auction) throw new Error('Auction not found');

    const commitments = auctionRepository.getCommitmentsByAuction(auctionId);
    const mode = auction.type === 'SEALED_HIGHEST' ? 'HIGHEST_UNIQUE' : 'LOWEST_UNIQUE';

    const result = SealedAuctionEngine.resolveAuction(commitments, mode);

    if (result.winnerWallet) {
      const user = userRepository.getOrCreateByWallet(result.winnerWallet);
      auctionRepository.updateAuctionStatus(auctionId, 'SETTLED', result.winnerWallet);
      LedgerService.processDeposit(user.id, auction.pot_usdc, `sealed_win_${auctionId}`);
    } else {
      auctionRepository.updateAuctionStatus(auctionId, 'CANCELLED');
    }

    auctionRepository.recordAuditLog(auctionId, 'SEALED_RESOLVED', { mode, result });
    AuctionService.broadcastUpdate('SEALED_RESOLVED', { auctionId, mode, result });

    // Auto-create next active round for this game type
    AuctionService.initDefaultAuctions();

    return { success: true, data: result };
  }
}
