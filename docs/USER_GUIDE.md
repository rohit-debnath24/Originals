# 📱 x402-Pay User Guide

Welcome to x402-Pay! This guide will help you understand how to use the app for sending crypto payments that arrive as INR via UPI.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [For Senders (Pay with Crypto)](#for-senders-pay-with-crypto)
3. [For Receivers (Get INR via UPI)](#for-receivers-get-inr-via-upi)
4. [For Investors (Provide Liquidity)](#for-investors-provide-liquidity)
5. [Transaction History](#transaction-history)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Step 1: Connect Your Wallet

1. Open the app at `http://localhost:3000`
2. Click **"Connect Wallet"** button
3. Choose your wallet (MetaMask, Rainbow, Coinbase Wallet, etc.)
4. Approve the connection request in your wallet
5. Make sure you're connected to **Base Sepolia** testnet

### Step 2: Set Up Your PIN

On first connection, you'll be prompted to set a 4-digit PIN:

1. Enter a 4-digit PIN
2. Confirm your PIN
3. Click **"Set PIN"**

> ⚠️ **Important**: Remember your PIN! You'll need it to confirm payments.

### Step 3: Get Test USDC

To make test payments, you need USDC on Base Sepolia:

1. Get Base Sepolia ETH from a faucet:
   - [Coinbase Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)
   - [Alchemy Faucet](https://sepoliafaucet.com/)

2. Get test USDC (or use mock USDC if provided)

---

## For Senders (Pay with Crypto)

### Making a Payment

#### Option A: Scan QR Code

1. Navigate to **"Send"** from the home screen
2. Click **"Scan QR Code"**
3. Allow camera access when prompted
4. Point your camera at a UPI QR code
5. The UPI ID will be automatically detected

#### Option B: Enter UPI ID Manually

1. Navigate to **"Send"**
2. Enter the recipient's UPI ID (e.g., `name@paytm`, `phone@ybl`)
3. Click **"Continue"**

### Getting a Quote

After entering the UPI ID:

1. Enter the amount in INR you want to send
2. Click **"Get Quote"**
3. You'll see:
   - **Exchange Rate**: Current INR/USDC rate
   - **USDC Amount**: How much USDC you'll pay
   - **Breakdown**: Fee details (if any)
   - **Expiry Timer**: Quote valid for 2 minutes

### Confirming Payment

1. Review the quote details
2. Click **"Pay Now"**
3. Enter your 4-digit PIN
4. Approve the transaction in your wallet
5. Wait for confirmation

### Payment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Enter UPI  │ --> │  Get Quote  │ --> │  Confirm &  │
│  ID/Scan QR │     │  (2 min)    │     │  Pay USDC   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Receiver   │ <-- │  UPI Payout │ <-- │  USDC Locked│
│  Gets INR   │     │  Initiated  │     │  in System  │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## For Receivers (Get INR via UPI)

### No Registration Required!

The beauty of x402-Pay is that receivers don't need to:
- Download any app
- Create an account
- Have crypto knowledge

### How It Works

1. Someone sends you a payment using your UPI ID
2. You receive INR directly in your UPI-linked bank account
3. Just like a regular UPI payment!

### What You'll See

- A standard UPI credit notification
- Money from "x402-Pay" or similar
- Full INR amount (sender pays any fees)

---

## For Investors (Provide Liquidity)

### Understanding Liquidity Pools (Buckets)

Investors provide INR liquidity that enables instant payouts. In return, they earn USDC when payments are processed.

### Creating a Liquidity Pool

1. Navigate to **"Invest"** from the home screen
2. Click **"Create New Pool"**
3. Configure your pool:
   - **Pool Name**: Give it a memorable name
   - **INR Amount**: How much INR you're providing
   - **Rate**: Your INR/USDC rate (higher = more competitive)
   - **UPI ID**: Your UPI for adding/withdrawing funds

### Managing Your Pool

#### View Pool Status
- **Available Balance**: INR ready for payouts
- **Locked Amount**: INR committed to pending payments
- **Health Score**: Pool reliability rating
- **Success Rate**: Historical payout success

#### Add Liquidity
1. Go to your pool details
2. Click **"Add Funds"**
3. Transfer INR via UPI
4. Funds appear after confirmation

#### Withdraw Liquidity
1. Go to your pool details
2. Click **"Withdraw"**
3. Enter amount to withdraw
4. Receive INR to your UPI

### Earning USDC

When your pool fulfills a payment:

1. Your INR is sent to the receiver
2. You receive equivalent USDC at your set rate
3. USDC is sent to your connected wallet

### Pool Competition (Dutch Auction)

When a payment is initiated, pools compete:

```
Your Pool Settings:
  Rate: 89.5 INR/USDC
  Liquidity: ₹1,00,000
  Health: 95%
  Success Rate: 98%

Competition Factors:
  1. Rate (lower = more competitive)
  2. Available liquidity
  3. Health score
  4. Historical reliability
```

> 💡 **Tip**: Balance your rate competitively. Too high = fewer matches. Too low = less profit.

---

## Transaction History

### Viewing Past Transactions

1. Navigate to **"History"** from the home screen
2. See all your past transactions
3. Filter by status or date

### Transaction Statuses

| Status | Meaning |
|--------|---------|
| 🟡 Pending | Payment initiated, awaiting confirmation |
| 🔵 Processing | USDC received, UPI payout in progress |
| 🟢 Completed | Payment successfully delivered |
| 🔴 Failed | Payment failed (will be refunded) |
| ⚪ Refunded | USDC returned to sender |

### Transaction Details

Click any transaction to see:
- Transaction ID
- Timestamp
- Amount (INR & USDC)
- Exchange rate used
- Recipient UPI ID
- Blockchain transaction hash

---

## Troubleshooting

### Wallet Connection Issues

**Problem**: Wallet won't connect

**Solutions**:
1. Refresh the page
2. Check if wallet extension is enabled
3. Try disconnecting and reconnecting
4. Clear browser cache

---

**Problem**: Wrong network

**Solution**:
1. Open your wallet
2. Switch to "Base Sepolia" network
3. If not listed, add it manually:
   - Network Name: Base Sepolia
   - RPC URL: `https://sepolia.base.org`
   - Chain ID: 84532
   - Currency: ETH
   - Explorer: `https://sepolia.basescan.org`

---

### Payment Issues

**Problem**: Quote expired

**Solution**:
- Quotes are valid for 2 minutes
- Click "Get New Quote" to refresh

---

**Problem**: Transaction stuck on pending

**Solutions**:
1. Check your wallet for pending transactions
2. Try speeding up the transaction in your wallet
3. Wait for network confirmation (usually 2-5 seconds on Base)

---

**Problem**: Payment failed

**Possible Causes**:
- Insufficient USDC balance
- Insufficient ETH for gas
- Network congestion

**Solution**:
- Check error message
- Ensure you have enough USDC + ETH for gas
- Try again with a new quote

---

### PIN Issues

**Problem**: Forgot PIN

**Solution**:
- Currently, contact support to reset
- Future: PIN recovery via wallet signature

---

**Problem**: PIN not accepted

**Solution**:
1. Make sure you're entering exactly 4 digits
2. Check for typos
3. Wait a moment between attempts

---

### UPI Issues

**Problem**: Invalid UPI ID error

**Solutions**:
1. Check the UPI ID format (e.g., `name@bank`)
2. Verify the UPI ID is active
3. Try a different UPI ID

---

**Problem**: UPI payout delayed

**Info**:
- Most payouts complete in seconds
- Some banks may take up to 30 minutes
- Check transaction status in History

---

## FAQ

### General

**Q: Is this safe?**
A: The system uses secure wallet signatures for authentication. Your crypto is only transferred when you explicitly approve. Currently in testnet mode.

**Q: What fees are charged?**
A: The system takes a small spread on the exchange rate. No hidden fees.

**Q: What's the minimum/maximum payment?**
A: Minimum: ₹100 | Maximum: ₹1,00,000 per transaction

---

### For Senders

**Q: What if the receiver doesn't have UPI?**
A: The receiver needs an active UPI ID to receive funds. Any Indian bank account with UPI works.

**Q: Can I cancel a payment?**
A: Once confirmed on-chain, payments cannot be cancelled. They will either complete or auto-refund.

**Q: How long does the receiver take to get money?**
A: Usually instant (seconds). Maximum 30 minutes depending on bank.

---

### For Investors

**Q: What's the minimum investment?**
A: Minimum pool size is ₹10,000.

**Q: How are pools selected for payments?**
A: Through a Dutch auction system that considers rate, liquidity, and reliability.

**Q: What if my pool runs out of liquidity?**
A: Your pool won't be selected for new payments. Add more funds to continue earning.

---

## Need Help?

- **GitHub Issues**: [Report a bug](https://github.com/rajat-sharma-Dev/x402-Pay/issues)
- **Documentation**: See `/docs` folder for technical details

---

<div align="center">

**Happy Paying! 💸**

</div>
