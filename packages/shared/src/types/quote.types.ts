// ============================================
// QUOTE TYPES
// ============================================

export type QuoteStatus = 'computing' | 'ready' | 'locked' | 'expired' | 'completed' | 'failed';

export interface BucketAllocation {
  bucketId: string;
  bucketName: string;
  amountINR: number; // INR portion from this bucket
  amountUSDC: number; // USDC going to this bucket
  rate: number; // Effective rate for this allocation
}

export interface Quote {
  id: string;
  senderId: string;
  receiverUpiId: string; // Real UPI ID of the receiver
  
  // Amounts
  amountINR: number; // What receiver gets (full amount, no fees deducted)
  amountUSDC: number; // What sender pays (includes platform fee)
  baseAmountUSDC: number; // USDC at market rate (before fees)
  
  // Rate info
  effectiveRate: number; // Weighted average rate (INR per USDC)
  
  // Fee breakdown (0.1% platform fee)
  platformFeePercent: number; // 0.1
  platformFeeUSDC: number;    // Actual fee in USDC
  
  // Legacy field for compatibility
  senderFeePercent: number;
  senderFeeUSDC: number;
  
  // Bucket allocation
  bucketAllocations: BucketAllocation[];
  
  // Status
  status: QuoteStatus;
  computationProgress: number; // 0-100, for loading bar
  
  // Timing
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateQuoteInput {
  senderId: string;
  receiverUpiId: string; // Real UPI ID (e.g., name@paytm, 9876543210@ybl)
  amountINR: number;
}

export interface QuoteResponse {
  id: string;
  amountINR: number;
  amountUSDC: number;
  baseAmountUSDC: number;
  effectiveRate: number;
  
  // Fee breakdown
  platformFeePercent: number;
  platformFeeUSDC: number;
  
  // Legacy
  senderFeeUSDC: number;
  
  status: QuoteStatus;
  computationProgress: number;
  bucketAllocations: BucketAllocation[]; // Shows which pools were selected
  expiresAt: Date;
  expiresInSeconds: number;
}
