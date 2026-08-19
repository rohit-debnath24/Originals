# 🚀 Deployment Guide for Render

This guide walks you through deploying x402-Pay on [Render](https://render.com) with both the backend API and frontend web app.

## 📋 Prerequisites

1. A [Render](https://render.com) account (free tier works!)
2. A [WalletConnect Cloud](https://cloud.walletconnect.com) project ID
3. An EVM wallet address to receive USDC payments
4. Your code pushed to a GitHub repository

---

## 🏗️ Deployment Options

### Option 1: One-Click Deploy with Blueprint (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New"** → **"Blueprint"**
4. Connect your GitHub repository
5. Render will detect `render.yaml` and create both services
6. Set the required environment variables (see below)
7. Click **"Apply"**

### Option 2: Manual Deployment

Deploy each service separately following the steps below.

---

## 🔧 Backend API Deployment

### Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `x402-pay-api` |
| **Region** | Oregon (or closest to your users) |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build --workspace=@crypto-inr/shared && npm run build --workspace=@crypto-inr/server` |
| **Start Command** | `npm run start --workspace=@crypto-inr/server` |
| **Plan** | Free |

### Environment Variables (Backend)

Add these in the Render dashboard under **"Environment"**:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `3001` | Required |
| `FRONTEND_URL` | `https://x402-pay-web.onrender.com` | Your frontend URL |
| `X402_FACILITATOR_URL` | `https://x402.org/facilitator` | x402 facilitator |
| `X402_NETWORK` | `base-sepolia` | Use `base` for mainnet |
| `COMPANY_WALLET_ADDRESS` | `0xYourWalletAddress` | ⚠️ Your wallet! |
| `SESSION_SECRET` | (click "Generate") | Auto-generate |
| `DATABASE_PATH` | `./data/crypto-inr.db` | SQLite path |

### Health Check

Set health check path to: `/health`

---

## 🌐 Frontend Web Deployment

### Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect the same GitHub repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `x402-pay-web` |
| **Region** | Oregon (same as backend) |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build --workspace=@crypto-inr/shared && npm run build --workspace=@crypto-inr/web` |
| **Start Command** | `npm run start --workspace=@crypto-inr/web` |
| **Plan** | Free |

### Environment Variables (Frontend)

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `3000` | Required |
| `NEXT_PUBLIC_API_URL` | `https://x402-pay-api.onrender.com/api` | Your backend URL |
| `NEXT_PUBLIC_X402_FACILITATOR_URL` | `https://x402.org/facilitator` | x402 facilitator |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | `your-project-id` | ⚠️ Get from WalletConnect |

---

## 🔑 Getting Required Keys

### WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Sign up / Log in
3. Create a new project
4. Copy the **Project ID**
5. Add it as `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`

### Company Wallet Address

1. Create an EVM wallet (MetaMask, Rainbow, etc.)
2. Use the same wallet you want to receive USDC payments
3. Copy the address (starts with `0x`)
4. Add it as `COMPANY_WALLET_ADDRESS`

> ⚠️ **Important**: For Base Sepolia testnet, you can use any address. For mainnet, ensure this is a secure wallet you control!

---

## 📊 Post-Deployment Checklist

After deployment, verify everything works:

- [ ] Backend health check: `https://x402-pay-api.onrender.com/health`
- [ ] Frontend loads: `https://x402-pay-web.onrender.com`
- [ ] Wallet connection works (MetaMask popup appears)
- [ ] Quote creation works
- [ ] x402 payment flow triggers MetaMask signing

---

## 🐛 Troubleshooting

### "CORS Error" in Console

- Check `FRONTEND_URL` env var matches your actual frontend URL
- Ensure it includes `https://` prefix
- Restart the backend service after changing

### "Wallet Connect Failed"

- Verify `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is set correctly
- Check WalletConnect Cloud dashboard for errors
- Ensure your project is not rate-limited

### "x402 Payment Failed"

- Check browser console for detailed error
- Verify you have testnet USDC on Base Sepolia
- Ensure `COMPANY_WALLET_ADDRESS` is a valid address

### Database Issues

- Free Render instances have ephemeral storage
- Database resets on deploy/restart
- For persistence, upgrade to paid plan with disk

---

## 🔄 Updating the Deployment

When you push to `main`, Render will automatically:

1. Detect the new commits
2. Run the build command
3. Deploy if build succeeds
4. Keep old version running until new one is ready

---

## 💰 Render Pricing

| Plan | Backend | Frontend | Notes |
|------|---------|----------|-------|
| **Free** | ✅ | ✅ | Sleeps after 15 min inactivity |
| **Starter ($7/mo)** | ✅ | ✅ | Always on, custom domains |
| **Pro** | ✅ | ✅ | Auto-scaling, SLA |

For hackathon demos, the **free tier** works great!

---

## 🎯 Production Checklist

Before going to mainnet:

- [ ] Change `X402_NETWORK` to `base`
- [ ] Update `X402_FACILITATOR_URL` to mainnet facilitator
- [ ] Use a secure production wallet for `COMPANY_WALLET_ADDRESS`
- [ ] Add persistent disk for database
- [ ] Set up monitoring and alerts
- [ ] Add rate limiting
- [ ] Implement proper error tracking (Sentry, etc.)

---

## 🆘 Support

- **x402 Documentation**: https://docs.x402.org
- **Render Documentation**: https://render.com/docs
- **WalletConnect Docs**: https://docs.walletconnect.com

Good luck with your deployment! 🚀
