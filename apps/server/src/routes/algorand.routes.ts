import { Router, Request, Response, NextFunction } from 'express';
import { AlgorandService } from '../services/algorand.service.js';

const router = Router();

// POST /api/algorand/atomic/group -> Prepare Algorand Atomic Group
router.post('/atomic/group', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId, walletAddress, bidAmountAlgo, feeAmountAlgo } = req.body;
    if (!walletAddress) {
      res.status(400).json({ success: false, error: 'Missing parameter: walletAddress' });
      return;
    }

    const groupResponse = AlgorandService.prepareBidAtomicGroup(
      auctionId || 'default_auction',
      walletAddress,
      Number(bidAmountAlgo || 1.0),
      Number(feeAmountAlgo || 0.001)
    );

    res.json({
      success: true,
      data: groupResponse,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/algorand/atomic/submit -> Submit & Execute Atomic Group
router.post('/atomic/submit', (req: Request, res: Response) => {
  try {
    const { groupId, signedTransactions } = req.body;
    if (!groupId) {
      res.status(400).json({ success: false, error: 'Missing parameter: groupId' });
      return;
    }

    const result = AlgorandService.executeAtomicGroup(groupId, signedTransactions);
    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Atomic transaction group execution failed',
    });
  }
});

// GET /api/algorand/atomic/group/:groupId -> Get group status
router.get('/atomic/group/:groupId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = AlgorandService.getGroupStatus(req.params.groupId!);
    if (!status) {
      res.status(404).json({ success: false, error: 'Atomic group not found' });
      return;
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
});

export const algorandRoutes = router;
