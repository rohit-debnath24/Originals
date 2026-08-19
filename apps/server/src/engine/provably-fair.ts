import crypto from 'crypto';

export interface RollCalculationResult {
  outcome: number;
  hash: string;
}

/**
 * Provably Fair Core Engine
 * Uses HMAC-SHA256 for deterministic, verifiable outcomes.
 */
export class ProvablyFairEngine {
  /**
   * Generates a cryptographically secure random server seed (64-char hex string)
   */
  public static generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates a SHA-256 hash of the server seed to share publicly before roll
   */
  public static hashServerSeed(serverSeed: string): string {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }

  /**
   * Generates a random client seed
   */
  public static generateClientSeed(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Computes a deterministic roll outcome (00.00 to 99.99)
   * HMAC-SHA256(server_seed, `${client_seed}:${nonce}`)
   */
  public static calculateRollOutcome(
    serverSeed: string,
    clientSeed: string,
    nonce: number
  ): RollCalculationResult {
    const message = `${clientSeed}:${nonce}`;
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(message);
    const hash = hmac.digest('hex');

    // Take first 8 characters (4 bytes) of the HMAC hash
    const subHash = hash.substring(0, 8);
    const num = parseInt(subHash, 16);

    // Map the 32-bit integer to 0.00 - 99.99 range
    // Modulo 10000 gives 0..9999 -> divide by 100 to get two decimal float
    const rawOutcome = (num % 10000) / 100;
    const outcome = Math.round(rawOutcome * 100) / 100;

    return {
      outcome,
      hash,
    };
  }

  /**
   * Verifies a historical roll result
   */
  public static verifyRoll(
    serverSeed: string,
    clientSeed: string,
    nonce: number
  ): { computedHash: string; computedOutcome: number } {
    const { outcome, hash } = this.calculateRollOutcome(serverSeed, clientSeed, nonce);
    return {
      computedHash: hash,
      computedOutcome: outcome,
    };
  }
}
