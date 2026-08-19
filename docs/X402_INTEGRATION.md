# x402 Protocol Integration Guide

## Overview

x402-Pay now uses the **x402 protocol** for payment verification. This provides a standardized way for buyers to pay for API access using on-chain payments (USDC on Base Sepolia).

## How It Works

### Backend (Seller Role)

The backend acts as a **seller** that requires payment before processing transactions:

1. **Payment Middleware**: `x402-express` middleware protects the `/api/payments` endpoint
2. **402 Payment Required**: When a request comes without payment proof, the server returns HTTP 402 with payment details
3. **Payment Verification**: Once buyer pays, x402 middleware verifies the on-chain transaction
4. **Request Processing**: After verification, the request proceeds normally

### Frontend (Buyer Role)

The frontend acts as a **buyer** that automatically handles payment requirements:

1. **Normal Request**: Frontend makes a normal API call
2. **402 Detection**: If server returns 402, `x402Fetch` intercepts it
3. **Payment Prompt**: User is prompted to sign a transaction with their wallet
4. **Automatic Payment**: x402 client handles the on-chain USDC payment
5. **Retry with Proof**: Request is retried with payment proof
6. **Success**: Server verifies and processes the request

## Architecture

```
┌─────────────────┐                     ┌─────────────────┐
│                 │  1. POST /payments  │                 │
│   Frontend      │────────────────────>│   Backend       │
│   (Buyer)       │                     │   (Seller)      │
│                 │<────────────────────│                 │
│  - x402 Client  │  2. 402 Payment     │ - x402 Express  │
│  - wagmi/viem   │     Required        │   Middleware    │
│  - RainbowKit   │                     │                 │
│                 │  3. Pay USDC via    │                 │
│                 │     Base Sepolia    │                 │
│                 │         │           │                 │
│                 │         v           │                 │
│                 │  ┌──────────────┐   │                 │
│                 │  │ x402         │   │                 │
│                 │  │ Facilitator  │   │                 │
│                 │  │ (x402.org)   │   │                 │
│                 │  └──────────────┘   │                 │
│                 │         │           │                 │
│                 │         v           │                 │
│                 │  4. POST /payments  │                 │
│                 │     with proof      │                 │
│                 │────────────────────>│                 │
│                 │                     │   ✓ Verify      │
│                 │  5. Success         │   ✓ Process     │
│                 │<────────────────────│                 │
└─────────────────┘                     └─────────────────┘
```

## Configuration

### Backend Environment Variables

```bash
# x402 Configuration
X402_FACILITATOR_URL=https://x402.org/facilitator  # Base Sepolia testnet
COMPANY_WALLET_ADDRESS=0xYourWalletAddress         # Your receiving address
X402_NETWORK=base-sepolia                          # or 'base' for mainnet
```

### Frontend Environment Variables

```bash
# x402 Configuration
NEXT_PUBLIC_X402_FACILITATOR_URL=https://x402.org/facilitator
```

## Code Integration

### Backend: Protected Route

```typescript
// src/routes/payment.routes.ts
import { x402Wrapper } from '../middleware/x402.middleware.js';

// Payment initiation requires x402 payment
router.post('/', x402Wrapper, async (req, res, next) => {
  // This code only runs after payment is verified
  const payment = await paymentService.initiatePayment(req.body);
  res.status(201).json({ success: true, data: payment });
});
```

### Frontend: x402-Aware Request

```typescript
// Payment with x402 support
const payment = await paymentApi.initiate(
  {
    quoteId: quote.id,
    senderId: user.id,
    pin: userPin,
  },
  walletAddress,      // User's wallet address
  signMessageAsync    // Wallet signing function from wagmi
);
```

## Payment Flow

1. **User Action**: User confirms payment on frontend
2. **Quote Creation**: Backend creates a quote with exchange rate
3. **Payment Initiation**: Frontend calls `POST /api/payments`
4. **x402 Middleware**: Backend middleware checks for payment proof
5. **402 Response**: No proof found, returns 402 with payment details
6. **x402 Client**: Frontend x402 client prompts user to sign transaction
7. **USDC Transfer**: User's wallet sends USDC to company address on Base Sepolia
8. **Transaction Verification**: x402 facilitator verifies the on-chain transaction
9. **Retry Request**: Frontend retries with payment proof header
10. **Verification**: Backend middleware verifies proof with x402
11. **Processing**: Payment service processes the crypto-to-INR transfer
12. **Success**: User receives confirmation, receiver gets INR via UPI

## Benefits of x402

### For Users
- **Transparent Pricing**: See exact cost before paying
- **Instant Verification**: On-chain verification in seconds
- **Standard Protocol**: Works with any x402-enabled service

### For Developers
- **Simple Integration**: Just add middleware
- **Automatic Handling**: x402 handles payment flow
- **No Custom Code**: Standard HTTP 402 response

### For Business
- **Guaranteed Payment**: Payment verified before processing
- **On-Chain Settlement**: No chargebacks, instant finality
- **Global Reach**: Accept USDC from anywhere

## Testing

### With Base Sepolia Testnet

1. **Get Test USDC**:
   - Use Base Sepolia faucet to get testnet ETH
   - Swap for testnet USDC on Uniswap

2. **Configure Testnet**:
   - Set `X402_NETWORK=base-sepolia`
   - Use facilitator: `https://x402.org/facilitator`

3. **Test Payment Flow**:
   - Connect wallet to Base Sepolia
   - Initiate a payment
   - Sign the transaction when prompted
   - Verify payment completes

## Production Deployment

### Mainnet Configuration

1. **Update Network**:
   ```bash
   X402_NETWORK=base
   ```

2. **Use Production Facilitator**:
   - Check https://www.x402.org/ecosystem?category=facilitators
   - Select a mainnet facilitator
   - Update `X402_FACILITATOR_URL`

3. **Security Checklist**:
   - [ ] Use secure wallet for receiving funds
   - [ ] Test with small amounts first
   - [ ] Monitor transaction confirmations
   - [ ] Set up alerts for failed payments
   - [ ] Implement rate limiting
   - [ ] Add comprehensive logging

## Troubleshooting

### Common Issues

**402 Response Not Handled**:
- Ensure frontend uses `x402Fetch` wrapper
- Check wallet is connected
- Verify signing function is provided

**Payment Verification Fails**:
- Check wallet has sufficient USDC + gas
- Verify network matches (testnet vs mainnet)
- Ensure facilitator URL is correct

**Middleware Not Applied**:
- Check `x402Wrapper` is added to route
- Verify middleware is imported correctly
- Check environment variables are loaded

## Resources

- **x402 Documentation**: https://x402.gitbook.io/x402
- **GitHub Repository**: https://github.com/coinbase/x402
- **Facilitator List**: https://www.x402.org/ecosystem?category=facilitators
- **CDP x402 Guide**: https://docs.cdp.coinbase.com/x402/docs/quickstart-sellers

## Next Steps

1. **Test Integration**: Try the payment flow on Base Sepolia
2. **Monitor Payments**: Set up logging and monitoring
3. **Optimize Pricing**: Adjust payment amounts based on usage
4. **Go to Mainnet**: Deploy with production configuration
5. **Add Features**: Implement subscription models, tiered pricing, etc.

---

**Questions?** Check the x402 documentation or open an issue on GitHub.
