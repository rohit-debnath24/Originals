import { Router } from 'express';
import { AuctionService } from '../services/auction.service.js';
import { auctionRepository } from '../repositories/auction.repository.js';
import { DutchAuctionEngine } from '../engine/games/dutch-auction.engine.js';

export const auctionRoutes = Router();

// GET active auctions with live server-authoritative prices
auctionRoutes.get('/active', (_req, res) => {
  const auctions = auctionRepository.getActiveAuctions();
  const now = Date.now();

  const enriched = auctions.map((a) => {
    let livePrice = a.current_price;
    if (a.type === 'DUTCH' && a.status === 'ACTIVE') {
      livePrice = DutchAuctionEngine.calculatePrice(
        {
          startPrice: a.start_price!,
          floorPrice: a.floor_price!,
          startTimeMs: a.start_time,
          tickMs: a.tick_ms!,
          tickAmount: a.tick_amount!,
        },
        now
      );
    }

    return {
      ...a,
      current_price: livePrice,
      server_now_ms: now,
    };
  });

  res.json({ success: true, data: enriched });
});

// GAME 1: Dutch Auction Buy Intent (Lock)
auctionRoutes.post('/dutch/buy-intent', (req, res, next) => {
  try {
    const { auctionId, wallet, quotedPrice } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

    if (!auctionId || !wallet || quotedPrice === undefined) {
      res.status(400).json({ error: 'Missing parameters: auctionId, wallet, quotedPrice' });
      return;
    }

    const result = AuctionService.handleDutchBuyIntent(auctionId, wallet, Number(quotedPrice), idempotencyKey);
    if (!result.success) {
      res.status(409).json({ success: false, error: result.error });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GAME 1: Dutch Settle
auctionRoutes.post('/dutch/settle', (req, res, next) => {
  try {
    const { auctionId, bidId, wallet, txHash } = req.body;
    if (!auctionId || !bidId || !wallet) {
      res.status(400).json({ error: 'Missing parameters: auctionId, bidId, wallet' });
      return;
    }

    const result = AuctionService.settleDutchAuction(auctionId, bidId, wallet, txHash || '0x_x402_settled');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GAME 2: 1-Cent Bid Bomb
auctionRoutes.post('/penny/bid', (req, res, next) => {
  try {
    const { auctionId, wallet } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

    if (!auctionId || !wallet) {
      res.status(400).json({ error: 'Missing parameters: auctionId, wallet' });
      return;
    }

    const result = AuctionService.handlePennyBid(auctionId, wallet, idempotencyKey);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GAME 3 & 4: Sealed Commit
auctionRoutes.post('/sealed/commit', (req, res, next) => {
  try {
    const { auctionId, wallet, commitmentHash, entryFee } = req.body;
    if (!auctionId || !wallet || !commitmentHash) {
      res.status(400).json({ error: 'Missing parameters: auctionId, wallet, commitmentHash' });
      return;
    }

    const result = AuctionService.submitCommitment(auctionId, wallet, commitmentHash, Number(entryFee || 1.0));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GAME 3 & 4: Sealed Reveal
auctionRoutes.post('/sealed/reveal', (req, res, next) => {
  try {
    const { auctionId, wallet, revealedBid, revealedSalt } = req.body;
    if (!auctionId || !wallet || revealedBid === undefined || !revealedSalt) {
      res.status(400).json({ error: 'Missing parameters: auctionId, wallet, revealedBid, revealedSalt' });
      return;
    }

    const result = AuctionService.submitReveal(auctionId, wallet, Number(revealedBid), String(revealedSalt));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GAME 3 & 4: Resolve Winner
auctionRoutes.post('/sealed/resolve', (req, res, next) => {
  try {
    const { auctionId } = req.body;
    if (!auctionId) {
      res.status(400).json({ error: 'Missing auctionId' });
      return;
    }

    const result = AuctionService.resolveSealedAuction(auctionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
