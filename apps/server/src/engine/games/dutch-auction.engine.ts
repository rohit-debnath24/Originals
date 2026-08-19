/**
 * Game 1: Dutch Auction Royale Engine
 * Server-authoritative decay price calculation and lock verification
 */
export interface DutchAuctionConfig {
  startPrice: number;
  floorPrice: number;
  startTimeMs: number;
  tickMs: number;
  tickAmount: number;
}

export class DutchAuctionEngine {
  /**
   * Server-authoritative Price Function:
   * price(t) = max(floor_price, start_price - floor((t - start_time) / tick_ms) * tick_amount)
   */
  public static calculatePrice(config: DutchAuctionConfig, nowMs: number = Date.now()): number {
    const { startPrice, floorPrice, startTimeMs, tickMs, tickAmount } = config;
    if (nowMs < startTimeMs) {
      return startPrice;
    }

    const elapsed = nowMs - startTimeMs;
    const ticksPassed = Math.floor(elapsed / tickMs);
    const priceDecay = ticksPassed * tickAmount;
    const currentPrice = startPrice - priceDecay;

    return Math.max(floorPrice, Math.round(currentPrice * 100) / 100);
  }

  /**
   * Validate client quoted price is within 1 tick tolerance of current server price
   */
  public static validateQuotedPrice(
    config: DutchAuctionConfig,
    quotedPrice: number,
    nowMs: number = Date.now()
  ): { valid: boolean; serverPrice: number; diff: number } {
    const serverPrice = this.calculatePrice(config, nowMs);
    const tickTolerance = config.tickAmount;
    const diff = Math.abs(quotedPrice - serverPrice);

    return {
      valid: diff <= tickTolerance,
      serverPrice,
      diff: Math.round(diff * 100) / 100
    };
  }
}
