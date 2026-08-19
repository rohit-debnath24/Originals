// ============================================
// APPLICATION CONSTANTS
// ============================================

// Fee configuration
export const FEES = {
  // Platform fee charged on each transaction (0.1%)
  PLATFORM_FEE_PERCENT: 0.1,
  // Investor pool fee on earnings (1%)
  INVESTOR_FEE_PERCENT: 1.0,
  // Minimum fee in USDC (to cover gas costs)
  MIN_FEE_USDC: 0.01,
} as const;

// Quote configuration
export const QUOTE = {
  EXPIRY_SECONDS: 120, // Quote expires in 2 minutes (enough time for PIN entry)
  COMPUTATION_TIME_MS: 2000, // 2 seconds for bucket competition
  MIN_AMOUNT_INR: 10, // Minimum transaction amount ₹10
  MAX_AMOUNT_INR: 100000, // Maximum transaction amount ₹1,00,000
} as const;

// Bucket defaults
export const BUCKET = {
  DEFAULT_SUCCESS_PROBABILITY: 0.95,
  DEFAULT_HEALTH_SCORE: 100,
  MIN_HEALTH_SCORE: 50, // Below this, bucket is considered unhealthy
} as const;

// Network configuration
export const NETWORK = {
  // Base Sepolia (testnet)
  BASE_SEPOLIA: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    x402Network: 'eip155:84532',
  },
  // Base Mainnet (production)
  BASE_MAINNET: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    x402Network: 'eip155:8453',
  },
} as const;

// Company configuration
export const COMPANY = {
  NAME: 'CryptoINR',
  // Company's USDC receiving address (where x402 payments are sent)
  DEFAULT_RECEIVER_ADDRESS: '0xfc23834846a42eD1edC70f253CF1919c93EAbA16',
} as const;

// API configuration
export const API = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// USDC decimals (6 decimals for USDC on all chains)
export const USDC_DECIMALS = 6;
