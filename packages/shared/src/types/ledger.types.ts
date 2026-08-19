// ============================================
// LEDGER TYPES (Immutable Accounting Records)
// ============================================

export type LedgerEntryType = 
  | 'usdc_in'           // USDC received (from sender via x402)
  | 'usdc_out'          // USDC withdrawn (by investor)
  | 'inr_in'            // INR deposited (by investor)
  | 'inr_out'           // INR sent (to receiver)
  | 'fee_sender'        // Fee collected from sender
  | 'fee_investor'      // Fee collected from investor
  | 'investor_credit';  // USDC credited to investor

export type LedgerReferenceType = 'payment' | 'investment' | 'withdrawal';

export type Currency = 'USDC' | 'INR';

export interface LedgerEntry {
  id: string;
  
  // Reference to parent transaction
  referenceId: string;
  referenceType: LedgerReferenceType;
  
  // Related entities
  bucketId?: string;
  userId?: string;
  
  // Entry details
  type: LedgerEntryType;
  amount: number;
  currency: Currency;
  
  // Balance tracking (optional, for reconciliation)
  balanceBefore?: number;
  balanceAfter?: number;
  
  // Metadata
  description?: string;
  metadata?: Record<string, unknown>;
  
  // Immutable timestamp
  timestamp: Date;
}

export interface CreateLedgerEntryInput {
  referenceId: string;
  referenceType: LedgerReferenceType;
  bucketId?: string;
  userId?: string;
  type: LedgerEntryType;
  amount: number;
  currency: Currency;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface LedgerSummary {
  totalUSDCIn: number;
  totalUSDCOut: number;
  totalINRIn: number;
  totalINROut: number;
  totalFeesSender: number;
  totalFeesInvestor: number;
}
