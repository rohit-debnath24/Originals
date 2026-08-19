export interface ActiveSeedPair {
  id: string;
  userId: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface ProvablyFairLog {
  id: string;
  betId: string;
  userId: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  outcome: number;
  revealedSeed?: string;
  createdAt: string;
}

export interface VerifyRollRequest {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface VerifyRollResult {
  isValid: boolean;
  computedHash: string;
  rollOutcome: number;
}
