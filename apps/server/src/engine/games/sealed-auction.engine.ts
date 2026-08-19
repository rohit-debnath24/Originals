import { createHash } from 'crypto';

export interface SealedCommitment {
  walletAddress: string;
  commitmentHash: string;
  revealedBid?: number;
  revealedSalt?: string;
  status: 'COMMITTED' | 'REVEALED' | 'FORFEITED';
}

export interface ResolutionResult {
  winnerWallet: string | null;
  winningBid: number | null;
  uniqueBidsCount: number;
  allUniqueBids: number[];
  rolledOver: boolean;
}

export class SealedAuctionEngine {
  /**
   * Generates or verifies commitment hash: hash(bid || salt || wallet)
   */
  public static computeCommitmentHash(bid: number, salt: string, wallet: string): string {
    return createHash('sha256')
      .update(`${bid}:${salt}:${wallet.toLowerCase()}`)
      .digest('hex');
  }

  /**
   * Verifies if revealed bid and salt match the stored commitment hash
   */
  public static verifyReveal(
    storedCommitmentHash: string,
    revealedBid: number,
    revealedSalt: string,
    wallet: string
  ): boolean {
    const computed = this.computeCommitmentHash(revealedBid, revealedSalt, wallet);
    return computed === storedCommitmentHash;
  }

  /**
   * O(N) Resolution Algorithm for Game 3 (Highest Unique) and Game 4 (Lowest Unique)
   * 1. Group revealed bids into Map<number, string[]>
   * 2. Filter for unique keys (length === 1)
   * 3. Take Math.max (Highest) or Math.min (Lowest)
   */
  public static resolveAuction(
    commitments: SealedCommitment[],
    mode: 'HIGHEST_UNIQUE' | 'LOWEST_UNIQUE'
  ): ResolutionResult {
    const bidToWallets = new Map<number, string[]>();

    // Step 1: O(N) Grouping
    for (const item of commitments) {
      if (item.status === 'REVEALED' && item.revealedBid !== undefined) {
        const bid = item.revealedBid;
        const list = bidToWallets.get(bid) || [];
        list.push(item.walletAddress);
        bidToWallets.set(bid, list);
      }
    }

    // Step 2: Filter for unique bids (exactly 1 wallet picked it)
    const uniqueBids: number[] = [];
    const uniqueWalletMap = new Map<number, string>();

    for (const [bid, wallets] of bidToWallets.entries()) {
      if (wallets.length === 1) {
        uniqueBids.push(bid);
        uniqueWalletMap.set(bid, wallets[0]!);
      }
    }

    // Step 3: Pick Winner
    if (uniqueBids.length === 0) {
      return {
        winnerWallet: null,
        winningBid: null,
        uniqueBidsCount: 0,
        allUniqueBids: [],
        rolledOver: true,
      };
    }

    let winningBid: number;
    if (mode === 'HIGHEST_UNIQUE') {
      winningBid = Math.max(...uniqueBids);
    } else {
      winningBid = Math.min(...uniqueBids);
    }

    const winnerWallet = uniqueWalletMap.get(winningBid) || null;

    return {
      winnerWallet,
      winningBid,
      uniqueBidsCount: uniqueBids.length,
      allUniqueBids: uniqueBids.sort((a, b) => a - b),
      rolledOver: false,
    };
  }
}
