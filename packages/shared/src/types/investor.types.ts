// ============================================
// INVESTOR POSITION TYPES
// ============================================

export interface InvestorPosition {
  id: string;
  investorId: string; // References User
  bucketId: string;
  
  // Investment
  principalINR: number; // Total INR deposited
  sharePercent: number; // % of bucket owned (calculated based on total)
  
  // Earnings
  earnedUSDC: number; // Total USDC earned (after fees)
  withdrawnUSDC: number; // Total USDC already withdrawn
  withdrawableUSDC: number; // Available to withdraw now
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DepositInput {
  investorId: string;
  bucketId: string;
  amountINR: number;
}

export interface WithdrawInput {
  investorId: string;
  bucketId: string;
  amountUSDC: number; // Amount to withdraw
}

export interface InvestorPositionPublic {
  id: string;
  bucketId: string;
  bucketName: string;
  principalINR: number;
  sharePercent: number;
  earnedUSDC: number;
  withdrawableUSDC: number;
}
