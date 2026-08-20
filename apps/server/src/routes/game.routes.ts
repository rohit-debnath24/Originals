import { Router } from 'express';
import { GameService } from '../services/game.service.js';
import { betRepository } from '../repositories/index.js';

export const gameRoutes = Router();

gameRoutes.post('/dice/roll', (req, res, next) => {
  try {
    const { userId, betAmount, targetNumber, condition, clientSeed } = req.body;
    if (!userId || !betAmount || targetNumber === undefined || !condition) {
      res.status(400).json({ error: 'Missing required parameters: userId, betAmount, targetNumber, condition' });
      return;
    }

    const result = GameService.playDice({
      userId,
      betAmount: Number(betAmount),
      targetNumber: Number(targetNumber),
      condition,
      clientSeed
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    next(error);
  }
});

gameRoutes.get('/provably-fair/active-seed/:userId', (req, res) => {
  const seedPair = GameService.getOrCreateActiveSeed(req.params.userId);
  res.json({
    success: true,
    data: {
      id: seedPair.id,
      serverSeedHash: seedPair.server_seed_hash,
      clientSeed: seedPair.client_seed,
      nonce: seedPair.nonce
    }
  });
});

gameRoutes.post('/provably-fair/rotate-seed', (req, res) => {
  const { userId, clientSeed } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const result = GameService.rotateSeedPair(userId, clientSeed);
  res.json({ success: true, data: result });
});

gameRoutes.post('/provably-fair/verify', (req, res) => {
  const { serverSeed, clientSeed, nonce } = req.body;
  if (!serverSeed || !clientSeed || nonce === undefined) {
    res.status(400).json({ error: 'serverSeed, clientSeed, and nonce are required' });
    return;
  }

  const result = GameService.verifyRoll(serverSeed, String(clientSeed), Number(nonce));
  res.json({ success: true, data: result });
});

gameRoutes.get('/recent-bets', (_req, res) => {
  const bets = betRepository.getRecentBets(20);
  res.json({ success: true, data: bets });
});

gameRoutes.get('/stats', (_req, res) => {
  const stats = betRepository.getStats();
  res.json({ success: true, data: stats });
});

gameRoutes.get('/ticker', (_req, res) => {
  const ticker = betRepository.getTickerData();
  res.json({ success: true, data: ticker });
});
