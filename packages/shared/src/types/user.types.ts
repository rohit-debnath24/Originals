// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  name: string;
  phone?: string;
  upiId?: string; // For INR payout (mocked for now)
  pinHash?: string; // Hashed payment PIN
  walletAddressUSDC?: string; // For x402 payments
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  phone?: string;
  upiId?: string;
  pin?: string; // Raw PIN, will be hashed
  walletAddressUSDC?: string;
}

export interface UserPublic {
  id: string;
  name: string;
  upiId?: string;
}
