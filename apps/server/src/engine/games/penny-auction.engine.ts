/**
 * Game 2: 1-Cent Bid Bomb (Penny Auction Engine)
 * Handles soft-close timer extension, pot increments, and expiry checks
 */
export interface PennyAuctionState {
  potUsdc: number;
  currentLeaderWallet: string | null;
  timerEndTs: number;
  bidCount: number;
}

export class PennyAuctionEngine {
  /**
   * Calculates new state after a valid $0.10 bid + $0.01 pot increment
   * Includes Soft-Close logic: if bid arrives in final 2s, extends by +2s (not full 15s)
   */
  public static processBid(
    currentState: PennyAuctionState,
    walletAddress: string,
    nowMs: number = Date.now(),
    defaultDurationMs: number = 15000,
    softCloseThresholdMs: number = 2000
  ): { newState: PennyAuctionState; extendedBySoftClose: boolean } {
    if (nowMs > currentState.timerEndTs) {
      throw new Error('Auction has already expired');
    }

    const remainingMs = currentState.timerEndTs - nowMs;
    let newTimerEndTs: number;
    let extendedBySoftClose = false;

    if (remainingMs <= softCloseThresholdMs) {
      // Soft-close: Extend by 2 seconds from current timer end
      newTimerEndTs = currentState.timerEndTs + softCloseThresholdMs;
      extendedBySoftClose = true;
    } else {
      // Full reset: 15s from current bid time
      newTimerEndTs = nowMs + defaultDurationMs;
    }

    return {
      newState: {
        potUsdc: Math.round((currentState.potUsdc + 0.01) * 100) / 100,
        currentLeaderWallet: walletAddress,
        timerEndTs: newTimerEndTs,
        bidCount: currentState.bidCount + 1,
      },
      extendedBySoftClose,
    };
  }

  /**
   * Check if round is expired with no pending bids
   */
  public static isExpired(timerEndTs: number, nowMs: number = Date.now()): boolean {
    return nowMs > timerEndTs;
  }
}
