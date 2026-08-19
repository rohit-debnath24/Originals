// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentStatus = 
  | 'initiated'      // Payment started
  | 'pin_verified'   // PIN verified
  | 'usdc_pending'   // x402 transaction submitted
  | 'usdc_received'  // USDC received at company address
  | 'inr_sending'    // INR transfer initiated to receiver
  | 'completed'      // All done
  | 'failed';        // Something went wrong

export interface Payment {
  id: string;
  quoteId: string;
  senderId: string;
  receiverUpiId: string; // Real UPI ID of the receiver
  
  // Amounts
  amountUSDC: number;     // Total USDC amount charged to sender
  amountINR: number;      // INR amount sent to receiver
  baseAmountUSDC: number; // USDC before fees
  
  // Fee breakdown
  platformFeeUSDC: number;  // Platform fee (0.1%)
  platformFeePercent: number;
  
  // On-chain transaction details
  x402TxHash?: string;          // On-chain transaction hash
  x402Network?: string;         // Network (e.g., "eip155:84532")
  x402PayerAddress?: string;    // Sender's wallet address
  x402ReceiverAddress: string;  // Company wallet address
  
  // Legacy field for compatibility
  x402TxRef?: string;
  companyReceiverAddress: string;
  
  // Status
  status: PaymentStatus;
  failureReason?: string;
  
  // Timestamps
  createdAt: Date;
  usdcReceivedAt?: Date;
  inrSentAt?: Date;
  completedAt?: Date;
}

export interface InitiatePaymentInput {
  quoteId: string;
  senderId: string;
  pin: string; // Raw PIN for verification
}

export interface PaymentStatusResponse {
  id: string;
  status: PaymentStatus;
  
  // Amounts
  amountUSDC: number;
  amountINR: number;
  baseAmountUSDC: number;
  platformFeeUSDC: number;
  platformFeePercent: number;
  
  // Receiver
  receiverUpiId: string;
  
  // On-chain details (available after USDC received)
  x402TxHash?: string;
  x402Network?: string;
  x402ExplorerUrl?: string;  // Link to block explorer
  
  // Status
  failureReason?: string;
  completedAt?: Date;
}

// x402 adapter types
export interface X402PaymentRequest {
  senderAddress: string;
  receiverAddress: string;
  amountUSDC: number;
  memo?: string;
}

export interface X402PaymentResponse {
  success: boolean;
  txHash?: string;
  txRef?: string;
  network?: string;
  explorerUrl?: string;
  error?: string;
}
