# 🏗️ Architecture Documentation

## System Overview

x402-Pay is designed as a **monorepo** with three main packages:
- `apps/web` - Next.js frontend
- `apps/server` - Express.js API
- `packages/shared` - Shared types and constants

## Component Architecture

### 1. Frontend (apps/web)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Providers                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ Web3Provider│  │ AuthProvider│  │QueryProvider│     │   │
│  │  │ (RainbowKit)│  │ (User/PIN) │  │(TanStack)  │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                      Pages                            │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │   │
│  │  │  Home  │  │  Send  │  │ Receive│  │ History│    │   │
│  │  │   /    │  │ /send  │  │/receive│  │/history│    │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Components                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Features  │  │     UI      │  │  Providers  │  │   │
│  │  │ WalletButton│  │   Button    │  │ AuthProvider│  │   │
│  │  │ QRScanner   │  │   Card      │  │ Web3Provider│  │   │
│  │  │ PinSetup    │  │   Input     │  │             │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Backend (apps/server)

```
┌─────────────────────────────────────────────────────────────┐
│                     Express.js Server                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Middleware                         │   │
│  │  ┌────────────────┐  ┌────────────────┐              │   │
│  │  │ Request Logger │  │ Error Handler  │              │   │
│  │  └────────────────┘  └────────────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                      Routes                           │   │
│  │  /api/users  /api/quotes  /api/payments  /api/buckets│   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                     Services                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│   │
│  │  │  User    │ │  Quote   │ │ Payment  │ │  Bucket  ││   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  ││   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│           ┌───────────────┼───────────────┐                 │
│           ▼               ▼               ▼                 │
│  ┌────────────┐  ┌────────────────┐  ┌────────────┐        │
│  │ Matching   │  │  Repositories  │  │  Adapters  │        │
│  │  Engine    │  │  (SQLite)      │  │ (External) │        │
│  └────────────┘  └────────────────┘  └────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Shared Package (packages/shared)

```
┌─────────────────────────────────────────────────────────────┐
│                    @crypto-inr/shared                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                      Types                            │   │
│  │  User | Quote | Payment | Bucket | Investor | Ledger │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Constants                          │   │
│  │  FEES | QUOTE | BUCKET | COMPANY | API               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Payment Flow

```
┌────────────┐     ┌─────────────┐     ┌──────────────┐
│   Sender   │────▶│  Frontend   │────▶│   API Server │
│  (Alice)   │     │  (Next.js)  │     │   (Express)  │
└────────────┘     └─────────────┘     └──────────────┘
                                              │
                   ┌──────────────────────────┴────────────────┐
                   │                                           │
                   ▼                                           ▼
          ┌────────────────┐                        ┌──────────────────┐
          │ 1. Create Quote│                        │ 2. Dutch Auction │
          │    POST /quotes│                        │   Matching Engine│
          └────────────────┘                        └──────────────────┘
                   │                                           │
                   │         ┌──────────────────┐              │
                   └────────▶│ 3. Quote Ready   │◀─────────────┘
                             │    with Rate     │
                             └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │ 4. Verify PIN    │
                             │  POST /payments  │
                             └──────────────────┘
                                      │
                   ┌──────────────────┴────────────────────────┐
                   │                                           │
                   ▼                                           ▼
          ┌────────────────┐                        ┌──────────────────┐
          │ 5. USDC Transfer│                       │ 6. INR Payout    │
          │   (x402 - TODO) │                       │   (UPI - Mock)   │
          └────────────────┘                        └──────────────────┘
                   │                                           │
                   └──────────────────┬────────────────────────┘
                                      ▼
                             ┌──────────────────┐
                             │ 7. Complete      │
                             │   Payment Done!  │
                             └──────────────────┘
```

---

## Database Schema

### SQLite Tables

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  upi_id TEXT,
  pin_hash TEXT,
  wallet_address_usdc TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Buckets (Liquidity Pools)
CREATE TABLE buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  base_rate REAL NOT NULL,
  spread_percent REAL NOT NULL,
  total_liquidity_inr REAL DEFAULT 0,
  available_liquidity_inr REAL DEFAULT 0,
  locked_liquidity_inr REAL DEFAULT 0,
  total_usdc_earned REAL DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  success_probability REAL DEFAULT 0.95,
  health_score REAL DEFAULT 100,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Quotes
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_upi_id TEXT NOT NULL,
  amount_inr REAL NOT NULL,
  amount_usdc REAL NOT NULL,
  base_amount_usdc REAL NOT NULL,
  effective_rate REAL NOT NULL,
  sender_fee_percent REAL NOT NULL,
  sender_fee_usdc REAL NOT NULL,
  bucket_allocations TEXT NOT NULL, -- JSON
  status TEXT NOT NULL,
  computation_progress INTEGER DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Payments
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_upi_id TEXT NOT NULL,
  amount_usdc REAL NOT NULL,
  amount_inr REAL NOT NULL,
  sender_fee_usdc REAL NOT NULL,
  x402_tx_ref TEXT,
  company_receiver_address TEXT NOT NULL,
  status TEXT NOT NULL,
  failure_reason TEXT,
  created_at TEXT NOT NULL,
  usdc_received_at TEXT,
  inr_sent_at TEXT,
  completed_at TEXT
);

-- Investors (Bucket Positions)
CREATE TABLE investors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bucket_id TEXT NOT NULL,
  invested_inr REAL DEFAULT 0,
  earned_usdc REAL DEFAULT 0,
  pending_usdc REAL DEFAULT 0,
  share_percent REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, bucket_id)
);

-- Ledger Entries (Audit Trail)
CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  reference_id TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  user_id TEXT,
  bucket_id TEXT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);
```

---

## Dutch Auction Algorithm

### Overview

The matching engine uses a **Dutch auction** (descending price auction) to find optimal bucket allocation:

```typescript
// Auction Parameters
AUCTION_START_RATE: 92    // Start high
AUCTION_END_RATE: 85      // Minimum acceptable
AUCTION_ROUNDS: 8         // Number of rounds
ROUND_DURATION_MS: 200    // 200ms per round
```

### Algorithm Steps

1. **Initialize**: Load all active buckets
2. **Run Rounds**: For each round (rate decreases):
   - Check which buckets can bid at current rate
   - Calculate bid score for each participating bucket
   - Record bids
3. **Early Exit**: If sufficient bids received after round 3
4. **Select Winners**: Sort bids by score, allocate amounts
5. **Split if Needed**: Large orders can use multiple buckets

### Scoring Formula

```typescript
const score = 
  (amountScore * 0.35) +      // Coverage: How much can they fill?
  (healthFactor * 0.25) +     // Health: Pool reliability
  (reliabilityFactor * 0.25) + // Success: Historical rate
  (rateAdvantage * 0.15);     // Rate: Price margin
```

---

## Security Model

### Authentication

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Wallet    │────▶│  Signature   │────▶│   Server    │
│  (MetaMask) │     │  Verification│     │  (Session)  │
└─────────────┘     └──────────────┘     └─────────────┘
```

1. User connects wallet via RainbowKit
2. Server creates/retrieves user by wallet address
3. PIN required for payment authorization

### PIN Security

- PIN hashed before storage
- Required for all payment confirmations
- 4-digit minimum length

### Future Improvements

- [ ] Use bcrypt/argon2 for PIN hashing
- [ ] Implement rate limiting
- [ ] Add request signing
- [ ] JWT-based sessions

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge                           │
│                     (Next.js Frontend)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Railway / Render                        │
│                    (Express API Server)                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │  SQLite  │    │   Base   │    │   UPI    │
       │ (Turso)  │    │ Sepolia  │    │ Gateway  │
       └──────────┘    └──────────┘    └──────────┘
```

---

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/crypto-inr.db
```

---

## Performance Considerations

1. **Dutch Auction**: Completes in ~1.6 seconds (8 rounds × 200ms)
2. **Database**: SQLite with WAL mode for concurrent reads
3. **Quote Expiry**: 2 minutes to balance UX and stale rates
4. **Liquidity Lock**: Immediate lock prevents overselling
