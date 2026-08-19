// ============================================
// BUCKET TYPES (Liquidity Pool)
// ============================================

export type BucketStatus = 'active' | 'paused' | 'depleted';

export interface Bucket {
  id: string;
  name: string;
  ownerId: string; // Creator/primary investor
  
  // Pricing
  baseRate: number; // e.g., 90 (1 USDC = 90 INR base)
  spreadPercent: number; // e.g., 0.5 means 0.5%
  
  // Liquidity
  totalLiquidityINR: number; // Total INR in the bucket
  availableLiquidityINR: number; // Available for transactions
  lockedLiquidityINR: number; // Temporarily locked during quotes
  totalUSDCEarned: number; // Total USDC received from transactions
  
  // Limits
  maxTransactionINR: number;
  minTransactionINR: number;
  
  // Health metrics
  successProbability: number; // 0-1, historical success rate
  healthScore: number; // 0-100, overall bucket health
  
  // Fees
  investorFeePercent: number; // Fee taken from investor USDC earnings
  
  // Privacy
  isPrivate: boolean; // If true, only owner can deposit
  
  status: BucketStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBucketInput {
  name: string;
  ownerId: string;
  baseRate: number;
  spreadPercent: number;
  initialLiquidityINR: number;
  maxTransactionINR: number;
  minTransactionINR: number;
  isPrivate?: boolean;
}

export interface BucketPublic {
  id: string;
  name: string;
  baseRate: number;
  spreadPercent: number;
  effectiveRate: number; // baseRate * (1 + spreadPercent/100)
  availableLiquidityINR: number;
  maxTransactionINR: number;
  minTransactionINR: number;
  healthScore: number;
  isPrivate: boolean;
  status: BucketStatus;
}
