# x402-Pay

**Enterprise-Grade Crypto-to-INR Settlement Protocol**

Instant payment solution enabling USDC transfers (Base Sepolia) with immediate INR settlement via UPI. Built with a distributed liquidity matching engine using Dutch auction mechanism.

## Overview

x402-Pay is a production-ready platform that bridges blockchain and traditional payment rails. Users send USDC and recipients receive INR instantly via UPI through an automated, rate-competitive matching system.

### Core Value Propositions

- **Senders**: Execute cross-currency transactions with transparent pricing
- **Receivers**: Accept payments without platform registration via existing UPI rails
- **Liquidity Providers**: Deploy capital through smart contract integration with algorithmic matching

### Key Differentiators

- **Dutch Auction Matching**: Pools compete on rate, health metrics, and liquidity availability
- **Zero Receiver Friction**: Direct UPI QR scanning—no onboarding required
- **Real-Time Settlement**: Immediate INR credit via established payment gateways
- **x402 Protocol Compliant**: Full integration with payment verification standards

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         x402-Pay System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Sender     │    │   Receiver   │    │   Investor   │       │
│  │   (Alice)    │    │   (Any UPI)  │    │   (Charlie)  │       │
│  │              │    │              │    │              │       │
│  │  Pays USDC   │    │  Gets INR    │    │  Provides    │       │
│  │  on Base     │    │  via UPI     │    │  INR Liq.    │       │
│  └──────┬───────┘    └──────▲───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         │    ┌──────────────┴───────────────┐   │                │
│         │    │                              │   │                │
│         ▼    │     🏦 Dutch Auction         │   ▼                │
│  ┌───────────┴──────────────────────────────┴───────────┐       │
│  │                  Matching Engine                      │       │
│  │                                                       │       │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │       │
│  │   │ 🅰️ Alpha │ │ 🅱️ Beta │ │ 🌟 Gamma │ │ ⚡ Epsilon│   │       │
│  │   │ Pool    │ │ Pool    │ │ Pool    │ │ Pool    │   │       │
│  │   │ 89.95   │ │ 90.27   │ │ 88.68   │ │ 91.09   │   │       │
│  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘   │       │
│  │                                                       │       │
│  │   Pools compete on: Rate + Health + Liquidity        │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐       │
│  │                    💾 SQLite Database                 │       │
│  │   Users | Buckets | Quotes | Payments | Ledger       │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Project Status

### Completed Features

| Feature | Status | Description |
|---------|--------|-------------|
| 🔐 Wallet Login | ✅ Done | RainbowKit + wagmi integration |
| 📝 PIN Setup | ✅ Done | 4-digit PIN on first connect |
| 📷 QR Scanner | ✅ Done | Scan UPI QR codes to pay |
| 💱 Quote System | ✅ Done | Real-time rate quotes with 2-min expiry |
| 🏦 Dutch Auction | ✅ Done | Pools compete for best rates |
| 💾 SQLite Database | ✅ Done | Persistent storage for all entities |
| 📊 Transaction History | ✅ Done | View past payments |
| 🎨 Mobile-First UI | ✅ Done | Tailwind CSS responsive design |
| 💸 x402 Integration | ✅ Done | Real USDC transfers on Base Sepolia |

### In Progress

| Feature | Status | Description |
|---------|--------|-------------|
| 🏧 UPI Payout | 🚧 Mock | Actual UPI disbursement |
| 👛 Company Wallet | 🚧 Placeholder | Production wallet address |

### Planned

| Feature | Status | Description |
|---------|--------|-------------|
| 📈 Investor Dashboard | 📋 Planned | Manage liquidity positions |
| 🔔 Notifications | 📋 Planned | Payment alerts |
| 📱 PWA Support | 📋 Planned | Install as mobile app |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- A Web3 wallet (MetaMask, Rainbow, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/rajat-sharma-Dev/x402-Pay.git
cd x402-Pay

# Install dependencies
npm install

# Start development servers
npm run dev
```

This starts:
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001

### Test Accounts (Seeded)

| User | Role | PIN | Notes |
|------|------|-----|-------|
| Alice | Sender | 1234 | Test payments |
| Bob | Receiver | 1234 | Has UPI ID |
| Charlie | Investor | 1234 | Owns Alpha, Gamma, Epsilon pools |
| Diana | Investor | 1234 | Owns Beta, Delta pools |

---

## 📁 Project Structure

```
x402-Pay/
├── apps/
│   ├── server/          # Express.js API server
│   │   ├── src/
│   │   │   ├── adapters/      # External service adapters
│   │   │   ├── db/            # SQLite database setup
│   │   │   ├── matching/      # Dutch auction engine
│   │   │   ├── repositories/  # Data access layer
│   │   │   ├── routes/        # API endpoints
│   │   │   ├── services/      # Business logic
│   │   │   └── utils/         # Helpers & logging
│   │   └── data/              # SQLite database files
│   │
│   └── web/             # Next.js 15 frontend
│       └── src/
│           ├── app/           # Pages (App Router)
│           ├── components/    # React components
│           └── lib/           # API client & utilities
│
├── packages/
│   └── shared/          # Shared types & constants
│       └── src/
│           ├── types/         # TypeScript interfaces
│           └── constants/     # App configuration
│
└── docs/                # Documentation
    ├── ARCHITECTURE.md
    ├── API.md
    └── USER_GUIDE.md
```

---

## 🔧 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **RainbowKit** - Wallet connection UI
- **wagmi + viem** - Ethereum interactions
- **html5-qrcode** - QR code scanning

### Backend
- **Express.js** - API server
- **TypeScript** - Type safety
- **better-sqlite3** - SQLite database
- **pino** - Structured logging
- **uuid** - ID generation

### Blockchain
- **Base Sepolia** - L2 testnet
- **USDC** - Stablecoin for payments

---

## 🏦 Dutch Auction System

The matching engine runs a Dutch auction to find the best rate:

```
Auction Start Rate: 92 INR/USDC
         ↓ (decreases each round)
Auction End Rate: 85 INR/USDC

Rounds: 8 (200ms each)
```

### Scoring Formula

```typescript
Score = (Amount Coverage × 0.35) +  // Can they fill the order?
        (Health Score × 0.25) +      // Pool reliability
        (Success Rate × 0.25) +      // Historical success
        (Rate Margin × 0.15)         // Price competitiveness
```

### Example Auction Log

```
📢 ROUND 1/8 | Current Rate: 92.00 INR/USDC | Remaining: ₹50,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🙋 🌟 Gamma Pool: BID! Offers ₹50,000 @ 88.68 INR/USDC
      📊 Score: Amount 100% | Health 100% | Reliability 99%
      🎯 Total Score: 85.3/100

🏆 AUCTION COMPLETE
   💰 Total INR: ₹50,000
   💵 Total USDC: 563.84 USDC
   📈 Weighted Average Rate: 88.68 INR/USDC
```

---

## 📡 API Documentation

See [docs/API.md](docs/API.md) for full API documentation.

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | POST | Create user |
| `/api/users/wallet/:address` | GET | Get user by wallet |
| `/api/users/:id/pin` | POST | Set PIN |
| `/api/quotes` | POST | Create quote |
| `/api/quotes/:id` | GET | Get quote |
| `/api/payments` | POST | Initiate payment |
| `/api/payments/:id/status` | GET | Check status |
| `/api/buckets` | GET | List liquidity pools |

---

## 🔐 Security Considerations

- **PIN Storage**: Hashed before storage (use bcrypt in production)
- **Wallet Auth**: Signature-based authentication
- **Rate Limiting**: Implement in production
- **HTTPS**: Required for production

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [RainbowKit](https://rainbowkit.com/) for wallet connection
- [Base](https://base.org/) for L2 infrastructure
- [Coinbase](https://www.coinbase.com/) for x402 protocol inspiration

---

<div align="center">

**Built with ❤️ for the x402 Hackathon**

</div>
