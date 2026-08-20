'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WalletButton, AlgorandAtomicBadge } from '@/components/features';
import { useAuth } from '@/components/providers';

interface AuctionItem {
  id: string;
  type: 'DUTCH' | 'PENNY' | 'SEALED_HIGHEST' | 'REVERSE_LOWEST';
  status: string;
  title: string;
  start_price: number;
  floor_price: number;
  current_price: number;
  current_leader_wallet: string | null;
  pot_usdc: number;
  bid_count: number;
  start_time: number;
  timer_end_ts: number | null;
}

interface AuditLog {
  id: string;
  auction_id: string;
  event_type: string;
  payload: string;
  timestamp: string;
}

export default function AuctionsArenaPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 's1' | 's2' | 's3' | 's4'>('all');
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // User Wallet & Balance State dynamically derived from auth provider
  const DEMO_WALLET = user?.walletAddress || user?.id || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  const [balance, setBalance] = useState<number>(100.0);
  const [deductionAnim, setDeductionAnim] = useState<{ text: string; color: string } | null>(null);

  // Game 1: Dutch State
  const [dutchPrice, setDutchPrice] = useState(150);
  const [dutchElapsed, setDutchElapsed] = useState(0);
  const [dutchTicks, setDutchTicks] = useState(0);
  const [dutchFlashing, setDutchFlashing] = useState(false);
  const [dutchWinner, setDutchWinner] = useState<{
    winnerWallet: string;
    buyPrice: number;
    prizePool: number;
    netProfit: number;
    cooldownSeconds: number;
  } | null>(null);
  const [lastDutchWinner, setLastDutchWinner] = useState<{ wallet: string; price: number; profit: number } | null>(null);

  // Game 2: Penny Bomb State
  const [pennyTimeLeft, setPennyTimeLeft] = useState(12.4);
  const [pennyPotVal, setPennyPotVal] = useState(34.09);
  const [pennyLeader, setPennyLeader] = useState('0x9F...2a1');
  const [bidLog, setBidLog] = useState<{ wallet: string; amount: number; pot: number }[]>([
    { wallet: '0x9F...2a1', amount: 0.1, pot: 34.09 },
    { wallet: '0x71...b3c', amount: 0.1, pot: 34.08 },
    { wallet: '0x9F...2a1', amount: 0.1, pot: 34.07 },
    { wallet: '0xC2...9e0', amount: 0.1, pot: 34.06 },
  ]);

  // Game 3 & 4: Sealed State
  const [sealedBidInput, setSealedBidInput] = useState('9.23');
  const [sealedSaltInput, setSealedSaltInput] = useState('secret123');
  const [reverseCentInput, setReverseCentInput] = useState('03');
  const [selectedCell, setSelectedCell] = useState(3);

  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

  // Fetch live user balance
  const fetchUserBalance = async () => {
    try {
      const baseUrl = API_URL.replace('/auction', '');
      const res = await fetch(`${baseUrl}/users/me?wallet=${DEMO_WALLET}`);
      const data = await res.json();
      if (data.success && data.data && data.data.balance_usdc !== undefined) {
        setBalance(data.data.balance_usdc);
      }
    } catch (err) {
      console.error('Failed to fetch user balance', err);
    }
  };

  // Claim Testnet USDC Faucet
  const handleTopUp = async () => {
    try {
      const baseUrl = API_URL.replace('/auction', '');
      const res = await fetch(`${baseUrl}/users/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: DEMO_WALLET }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const newBal = data.data.balance_usdc ?? data.data.balanceUSDC ?? 100.0;
        setBalance(newBal);
        triggerDeductionAnimation('+100.00 USDC', 'text-[#3ECF8E]');
        setActionMsg('🎉 Claimed +100 USDC testnet balance!');
      }
    } catch (err: any) {
      setActionMsg(`❌ Top up failed: ${err.message}`);
    }
  };

  // Floating Deduction Animation Helper
  const triggerDeductionAnimation = (text: string, color: string) => {
    setDeductionAnim({ text, color });
    setTimeout(() => setDeductionAnim(null), 2500);
  };

  // Fetch live auctions & audit logs from server
  const fetchAuctionsAndLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/auction/active`);
      const data = await res.json();
      if (data.success && data.data) {
        setAuctions(data.data);

        // Update Dutch live price if present
        const dutch = data.data.find((a: AuctionItem) => a.type === 'DUTCH');
        if (dutch && dutch.current_price) {
          setDutchPrice(dutch.current_price);
        }

        // Update Penny live pot if present
        const penny = data.data.find((a: AuctionItem) => a.type === 'PENNY');
        if (penny) {
          setPennyPotVal(penny.pot_usdc || 34.09);
          if (penny.current_leader_wallet) {
            setPennyLeader(`${penny.current_leader_wallet.substring(0, 4)}...${penny.current_leader_wallet.substring(38)}`);
          }
        }
      }

      // Fetch audit logs
      const logRes = await fetch(`${API_URL}/auction/audit-logs`);
      const logData = await logRes.json();
      if (logData.success && logData.data) {
        setAuditLogs(logData.data);
        const dutchLog = logData.data.find((l: AuditLog) => l.event_type === 'SETTLED');
        if (dutchLog && dutchLog.payload) {
          try {
            const parsed = JSON.parse(dutchLog.payload);
            if (parsed.wallet) {
              const p = parsed.serverPrice || 45.0;
              setLastDutchWinner((prev) => prev || {
                wallet: parsed.wallet,
                price: p,
                profit: Math.max(0, 100.0 - p),
              });
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Auction polling failed', err);
    }
  };

  useEffect(() => {
    fetchUserBalance();
    fetchAuctionsAndLogs();
    const interval = setInterval(() => {
      fetchAuctionsAndLogs();
      fetchUserBalance();
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Dutch winner cooldown timer
  useEffect(() => {
    if (!dutchWinner) return;

    if (dutchWinner.cooldownSeconds <= 0) {
      setDutchWinner(null);
      fetchAuctionsAndLogs();
      return;
    }

    const timer = setInterval(() => {
      setDutchWinner((prev) => (prev ? { ...prev, cooldownSeconds: prev.cooldownSeconds - 1 } : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [dutchWinner]);

  // Dutch local timer tick animation
  useEffect(() => {
    const dutchItem = auctions.find((a) => a.type === 'DUTCH');
    if (!dutchItem || dutchWinner) return;

    const tickInterval = setInterval(() => {
      const elapsed = Date.now() - dutchItem.start_time;
      const ticks = Math.floor(elapsed / 500);
      const computedPrice = Math.max(10, 150 - ticks);

      setDutchElapsed(elapsed / 1000);
      setDutchTicks(ticks);
      setDutchPrice(computedPrice);

      setDutchFlashing(true);
      setTimeout(() => setDutchFlashing(false), 200);
    }, 500);

    return () => clearInterval(tickInterval);
  }, [auctions, dutchWinner]);

  // Penny Bomb real-time countdown timer derived from server end timestamp
  useEffect(() => {
    const pennyItem = auctions.find((a) => a.type === 'PENNY');
    if (!pennyItem || !pennyItem.timer_end_ts) return;

    const timerInterval = setInterval(() => {
      const remainingMs = pennyItem.timer_end_ts! - Date.now();
      if (remainingMs <= 0) {
        setPennyTimeLeft(0.0);
        setActionMsg(`💥 BOMB EXPLODED! 🏆 ${pennyLeader} won the $${pennyPotVal.toFixed(2)} USDC jackpot!`);
      } else {
        setPennyTimeLeft(Math.round((remainingMs / 1000) * 10) / 10);
      }
    }, 100);

    return () => clearInterval(timerInterval);
  }, [auctions, pennyLeader, pennyPotVal]);

  // --- Handlers ---
  const handleDutchBuyNow = async () => {
    const dutchItem = auctions.find((a) => a.type === 'DUTCH');
    if (!dutchItem || dutchWinner) return;

    try {
      setActionMsg('⚡ Submitting x402 Buy Intent lock...');
      const res = await fetch(`${API_URL}/auction/dutch/buy-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': `intent_${Date.now()}`,
        },
        body: JSON.stringify({
          auctionId: dutchItem.id,
          wallet: DEMO_WALLET,
          quotedPrice: dutchPrice,
        }),
      });

      const result = await res.json();
      if (result.success) {
        const buyPrice = result.data.settlementPriceUsdc;
        const prizePool = dutchItem.pot_usdc || 100.0;
        const netProfit = Math.max(0, prizePool - buyPrice);

        setActionMsg(`🏆 DUTCH ROYALE WON! Bought at $${buyPrice.toFixed(2)} for $${prizePool} pool (+$${netProfit.toFixed(2)} profit)!`);
        
        // Immediate balance deduction animation
        setBalance((prev) => Math.max(0, prev - buyPrice));
        triggerDeductionAnimation(`-${buyPrice.toFixed(2)} USDC`, 'text-[#FF5C5C]');

        await fetch(`${API_URL}/auction/dutch/settle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auctionId: dutchItem.id,
            bidId: result.data.bidId,
            wallet: DEMO_WALLET,
            txHash: '0x_x402_settled_tx',
          }),
        });

        // Trigger win payout animation & winner celebration screen
        triggerDeductionAnimation(`+$${prizePool} WIN!`, 'text-[#3ECF8E]');
        
        setDutchWinner({
          winnerWallet: DEMO_WALLET,
          buyPrice,
          prizePool,
          netProfit,
          cooldownSeconds: 5,
        });

        setLastDutchWinner({
          wallet: DEMO_WALLET,
          price: buyPrice,
          profit: netProfit,
        });

        fetchUserBalance();
      } else {
        setActionMsg(`❌ ${result.error}`);
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  const handlePennyBidNow = async () => {
    const pennyItem = auctions.find((a) => a.type === 'PENNY');
    if (!pennyItem) return;

    try {
      // Immediate frontend deduction for snappy UX
      setBalance((prev) => Math.max(0, prev - 0.10));
      triggerDeductionAnimation('-0.10 USDC', 'text-[#FF5C5C]');

      const res = await fetch(`${API_URL}/auction/penny/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': `penny_${Date.now()}`,
        },
        body: JSON.stringify({
          auctionId: pennyItem.id,
          wallet: DEMO_WALLET,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setPennyTimeLeft(15.0);
        setPennyPotVal(result.data.potUsdc);
        setPennyLeader('0x71...976F');
        setBidLog((prev) => [
          { wallet: '0x71...976F', amount: 0.1, pot: result.data.potUsdc },
          ...prev.slice(0, 5),
        ]);
        setActionMsg(`💣 Bid placed! Pot increased to $${result.data.potUsdc.toFixed(2)} USDC.`);
        fetchAuctionsAndLogs();
        fetchUserBalance();
      } else {
        setActionMsg(`❌ ${result.error}`);
        fetchUserBalance();
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  const computeHash = async (bid: number, salt: string, wallet: string) => {
    const text = `${bid}:${salt}:${wallet.toLowerCase()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSealedCommit = async (type: 'SEALED_HIGHEST' | 'REVERSE_LOWEST') => {
    const item = auctions.find((a) => a.type === type);
    if (!item) return;

    try {
      const val = type === 'SEALED_HIGHEST' ? parseFloat(sealedBidInput) : parseFloat(reverseCentInput) / 100;
      const fee = type === 'SEALED_HIGHEST' ? 1.0 : 0.25;
      const hash = await computeHash(val, sealedSaltInput, DEMO_WALLET);

      // Deduct entry fee
      setBalance((prev) => Math.max(0, prev - fee));
      triggerDeductionAnimation(`-${fee.toFixed(2)} USDC`, 'text-[#FF5C5C]');

      const res = await fetch(`${API_URL}/auction/sealed/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: item.id,
          wallet: DEMO_WALLET,
          commitmentHash: hash,
          entryFee: fee,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setActionMsg(`🙈 Commitment submitted! Hash: ${hash.substring(0, 10)}...`);
        fetchAuctionsAndLogs();
        fetchUserBalance();
      } else {
        setActionMsg(`❌ ${result.error}`);
        fetchUserBalance();
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleSealedReveal = async (type: 'SEALED_HIGHEST' | 'REVERSE_LOWEST') => {
    const item = auctions.find((a) => a.type === type);
    if (!item) return;

    try {
      const val = type === 'SEALED_HIGHEST' ? parseFloat(sealedBidInput) : parseFloat(reverseCentInput) / 100;
      const res = await fetch(`${API_URL}/auction/sealed/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: item.id,
          wallet: DEMO_WALLET,
          revealedBid: val,
          revealedSalt: sealedSaltInput,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setActionMsg(`🔓 Reveal verified! Bid: $${val} accepted.`);
        fetchAuctionsAndLogs();
      } else {
        setActionMsg(`❌ ${result.error}`);
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleSealedResolve = async (type: 'SEALED_HIGHEST' | 'REVERSE_LOWEST') => {
    const item = auctions.find((a) => a.type === type);
    if (!item) return;

    try {
      const res = await fetch(`${API_URL}/auction/sealed/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId: item.id }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        if (result.data.winnerWallet) {
          setActionMsg(`🏆 Winner: ${result.data.winnerWallet.substring(0, 8)}... Winning Bid: $${result.data.winningBid}`);
          if (result.data.winnerWallet.toLowerCase() === DEMO_WALLET.toLowerCase()) {
            triggerDeductionAnimation('+$50.00 WIN!', 'text-[#3ECF8E]');
          }
        } else {
          setActionMsg(`🔄 No unique bids found. Pot rolled over!`);
        }
        fetchAuctionsAndLogs();
        fetchUserBalance();
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  // SVG Ring Math
  const CIRC = 352;
  const pct = Math.max(0, pennyTimeLeft / 15);
  const strokeOffset = CIRC * (1 - pct);
  const ringColor = pct < 0.25 ? '#FF5C5C' : '#F5A623';

  // Grid Sets for Game 4
  const takenOnce = new Set([7, 14, 22, 31, 45]);
  const takenMult = new Set([1, 2, 5, 8, 12, 19, 25, 33, 40]);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#EDEFF3] font-mono selection:bg-[#F5A623] selection:text-[#0A0C10] flex justify-center">
      <div className="w-full max-w-[1240px] min-h-screen border-x border-[#242A34] bg-[#0A0C10] flex flex-col">
        {/* Topbar */}
        <div className="p-4 md:px-8 border-b border-[#242A34] flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-sans font-bold text-lg md:text-xl tracking-wider flex items-center gap-2.5 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3ECF8E] shadow-[0_0_10px_#3ECF8E] animate-pulse" />
            x402 ARENA
          </Link>
          
          {/* Live Wallet & Balance Widget */}
          <div className="flex items-center gap-3 bg-[#12151B] border border-[#242A34] px-3.5 py-1.5 rounded-xl relative">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7A8290]">💰 Wallet:</span>
              <span className="font-mono text-sm font-bold text-[#F5A623]">
                ${balance.toFixed(2)} USDC
              </span>
            </div>

            {/* Floating Live Deduction Animation */}
            {deductionAnim && (
              <span className={`absolute -bottom-5 right-2 text-xs font-bold animate-bounce ${deductionAnim.color}`}>
                {deductionAnim.text}
              </span>
            )}

            <button
              onClick={handleTopUp}
              className="bg-[#123526] hover:bg-[#1A4533] text-[#3ECF8E] border border-[#3ECF8E]/30 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider transition active:scale-95"
            >
              + Top Up
            </button>

            <WalletButton />
          </div>
        </div>

        {/* Ticker Marquee Band */}
        <div className="border-b border-[#242A34] bg-[#12151B] overflow-hidden whitespace-nowrap py-2 text-[11px]">
          <div className="inline-block animate-scroll pl-full">
            <span className="mr-8 text-[#7A8290]">
              DUTCH #4471 settled at <b className="text-[#F5A623] font-semibold">$118</b>
            </span>
            <span className="mr-8 text-[#7A8290]">
              PENNY BOMB pot <b className="text-[#F5A623] font-semibold">${pennyPotVal.toFixed(2)}</b> — 6 bids left standing
            </span>
            <span className="mr-8 text-[#7A8290]">
              SEALED-BID round closes in <b className="text-[#F5A623] font-semibold">0:42</b>
            </span>
            <span className="mr-8 text-[#7A8290]">
              REVERSE round #12 — <b className="text-[#F5A623] font-semibold">3 unique guesses</b> so far
            </span>
          </div>
        </div>

        {/* Navigation & Layout Switcher */}
        <div className="p-4 md:px-8 border-b border-[#242A34] flex flex-wrap items-center justify-between gap-4 bg-[#12151B]/50">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-sans font-bold uppercase rounded-lg border transition ${
                activeTab === 'all'
                  ? 'bg-[#F5A623] text-[#0A0C10] border-[#F5A623]'
                  : 'bg-[#181C24] text-[#7A8290] border-[#242A34] hover:text-white'
              }`}
            >
              📊 All Games Grid (PC)
            </button>
            <button
              onClick={() => setActiveTab('s1')}
              className={`px-3.5 py-2 text-xs font-sans font-semibold uppercase rounded-lg border transition ${
                activeTab === 's1'
                  ? 'bg-[#F5A623] text-[#0A0C10] border-[#F5A623]'
                  : 'bg-[#181C24] text-[#7A8290] border-[#242A34] hover:text-white'
              }`}
            >
              Dutch Auction
            </button>
            <button
              onClick={() => setActiveTab('s2')}
              className={`px-3.5 py-2 text-xs font-sans font-semibold uppercase rounded-lg border transition ${
                activeTab === 's2'
                  ? 'bg-[#F5A623] text-[#0A0C10] border-[#F5A623]'
                  : 'bg-[#181C24] text-[#7A8290] border-[#242A34] hover:text-white'
              }`}
            >
              Penny Bomb
            </button>
            <button
              onClick={() => setActiveTab('s3')}
              className={`px-3.5 py-2 text-xs font-sans font-semibold uppercase rounded-lg border transition ${
                activeTab === 's3'
                  ? 'bg-[#F5A623] text-[#0A0C10] border-[#F5A623]'
                  : 'bg-[#181C24] text-[#7A8290] border-[#242A34] hover:text-white'
              }`}
            >
              Sealed Bid
            </button>
            <button
              onClick={() => setActiveTab('s4')}
              className={`px-3.5 py-2 text-xs font-sans font-semibold uppercase rounded-lg border transition ${
                activeTab === 's4'
                  ? 'bg-[#F5A623] text-[#0A0C10] border-[#F5A623]'
                  : 'bg-[#181C24] text-[#7A8290] border-[#242A34] hover:text-white'
              }`}
            >
              Reverse Auction
            </button>
          </div>

          <div className="text-xs text-[#7A8290] font-mono">
            Mode: <span className="text-[#3ECF8E] font-bold">Lock-Verify-Settle</span>
          </div>
        </div>

        {/* Action / Notification Banner */}
        {actionMsg && (
          <div className="mx-4 md:mx-8 mt-4 p-3.5 bg-[#181C24] border border-[#F5A623]/50 rounded-xl text-xs text-[#EDEFF3] flex justify-between items-center shadow-lg">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg(null)} className="text-xs text-[#7A8290] hover:text-white px-2">✕</button>
          </div>
        )}

        {/* Main Content Arena */}
        <div className="flex-1 p-4 md:p-8 space-y-6">
          <AlgorandAtomicBadge walletAddress={DEMO_WALLET} />

          <div className={`grid gap-6 lg:gap-8 ${activeTab === 'all' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
            
            {/* GAME 1: DUTCH AUCTION */}
            {(activeTab === 'all' || activeTab === 's1') && (
              <div className="bg-[#12151B] border border-[#242A34] rounded-2xl p-6 flex flex-col justify-between hover:border-[#F5A623]/40 transition shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-sans text-xl font-bold text-white">Dutch Auction Royale</h3>
                      <p className="text-xs text-[#7A8290] mt-0.5">$100 USDC jackpot. Price ticks down $1 every 500ms.</p>
                    </div>
                    <span className="text-[10px] bg-[#F5A623]/10 text-[#F5A623] px-2.5 py-1 rounded-full uppercase font-bold border border-[#F5A623]/20">
                      SPEED GAME
                    </span>
                  </div>

                  {dutchWinner ? (
                    <div className="bg-[#3ECF8E]/10 border-2 border-[#3ECF8E] rounded-2xl p-6 text-center my-4 animate-bounce-short shadow-[0_0_30px_rgba(62,207,142,0.2)]">
                      <div className="text-4xl mb-1">🏆</div>
                      <h4 className="font-archivo text-xl font-black text-[#3ECF8E] tracking-tight uppercase">
                        DUTCH ROYALE WINNER!
                      </h4>
                      <p className="text-sm font-bold text-white mt-1">
                        {dutchWinner.winnerWallet === DEMO_WALLET
                          ? '🎉 YOU WON THIS ROUND!'
                          : `Winner: ${dutchWinner.winnerWallet.slice(0, 6)}...${dutchWinner.winnerWallet.slice(-4)}`}
                      </p>

                      <div className="grid grid-cols-3 gap-2 my-4 bg-[#0A0C10] p-3 rounded-xl border border-[#3ECF8E]/30 font-mono text-xs">
                        <div>
                          <div className="text-[#93A499] text-[10px]">Buy Price</div>
                          <div className="text-[#FF5C5C] font-bold text-sm">${dutchWinner.buyPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[#93A499] text-[10px]">Prize Pool</div>
                          <div className="text-[#F1EDE1] font-bold text-sm">${dutchWinner.prizePool.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[#93A499] text-[10px]">Net Profit</div>
                          <div className="text-[#3ECF8E] font-bold text-sm">+${dutchWinner.netProfit.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#E8A93B]/10 border border-[#E8A93B]/30 rounded-full text-xs font-mono text-[#E8A93B]">
                        <span>⏳ Next Round Starting in {dutchWinner.cooldownSeconds}s...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#0A0C10] p-6 rounded-xl border border-[#242A34] text-center my-4">
                        <div className="text-[10px] text-[#454C58] tracking-widest uppercase mb-1">Current Price</div>
                        <div className={`font-sans text-5xl lg:text-6xl font-bold tracking-tight transition-colors duration-150 ${dutchFlashing ? 'text-[#FF5C5C]' : 'text-white'}`}>
                          ${dutchPrice}
                        </div>
                        <div className="text-xs text-[#7A8290] mt-2">Prize value: $100 USDC · buy low for max profit</div>

                        {/* Meter */}
                        <div className="h-2 bg-[#181C24] rounded-full overflow-hidden my-4">
                          <div
                            className="h-full bg-gradient-to-r from-[#F5A623] to-[#FF5C5C] transition-all duration-300"
                            style={{ width: `${Math.max(2, (dutchPrice / 150) * 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-xs text-[#454C58] font-mono">
                          <span>$150 start</span>
                          <span>$10 floor</span>
                        </div>
                      </div>

                      <button
                        onClick={handleDutchBuyNow}
                        className="w-full py-4 bg-[#F5A623] hover:bg-[#D98E1A] active:scale-[0.98] text-[#141414] font-sans font-bold text-base rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                      >
                        <span>⚡ BUY NOW AT ${dutchPrice}</span>
                      </button>
                    </>
                  )}

                  {lastDutchWinner && (
                    <div className="mt-3 p-2.5 bg-[#0A0C10] border border-[rgba(241,237,225,0.12)] rounded-xl flex items-center justify-between text-xs font-mono">
                      <span className="text-[#93A499]">🏆 Last Winner:</span>
                      <span className="text-[#E8A93B]">
                        {lastDutchWinner.wallet.slice(0, 6)}...{lastDutchWinner.wallet.slice(-4)} bought @ ${lastDutchWinner.price.toFixed(2)} (<strong className="text-[#3ECF8E]">+{lastDutchWinner.profit > 0 ? lastDutchWinner.profit.toFixed(2) : '0.00'} profit</strong>)
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-[#181C24] border border-[#242A34] rounded-lg p-2.5 text-center">
                      <div className="text-sm font-semibold text-white">{dutchElapsed.toFixed(1)}s</div>
                      <div className="text-[9px] text-[#454C58] uppercase tracking-wider mt-0.5">Elapsed</div>
                    </div>
                    <div className="bg-[#181C24] border border-[#242A34] rounded-lg p-2.5 text-center">
                      <div className="text-sm font-semibold text-white">{dutchTicks}</div>
                      <div className="text-[9px] text-[#454C58] uppercase tracking-wider mt-0.5">Ticks</div>
                    </div>
                    <div className="bg-[#181C24] border border-[#242A34] rounded-lg p-2.5 text-center">
                      <div className="text-sm font-semibold text-white">50</div>
                      <div className="text-[9px] text-[#454C58] uppercase tracking-wider mt-0.5">Watching</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#242A34] text-[10px] text-[#454C58] text-center">
                  Server timestamp arrival locks exact tick price.
                </div>
              </div>
            )}

            {/* GAME 2: PENNY BOMB */}
            {(activeTab === 'all' || activeTab === 's2') && (
              <div className="bg-[#12151B] border border-[#242A34] rounded-2xl p-6 flex flex-col justify-between hover:border-[#FF5C5C]/40 transition shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-sans text-xl font-bold text-white">1-Cent Bid Bomb</h3>
                      <p className="text-xs text-[#7A8290] mt-0.5">Each bid costs $0.10, adds $0.01 to pot, resets clock to 15s.</p>
                    </div>
                    <span className="text-[10px] bg-[#FF5C5C]/10 text-[#FF5C5C] px-2.5 py-1 rounded-full uppercase font-bold border border-[#FF5C5C]/20">
                      JACKPOT BOMB
                    </span>
                  </div>

                  <div className="bg-[#0A0C10] p-6 rounded-xl border border-[#242A34] text-center my-4 flex flex-col items-center">
                    <div className="font-sans text-4xl lg:text-5xl font-bold text-[#3ECF8E]">${pennyPotVal.toFixed(2)}</div>
                    <div className="text-[10px] text-[#7A8290] tracking-wider uppercase mt-1">Current Pot</div>

                    {/* Timer Ring */}
                    <div className="relative w-[130px] h-[130px] my-4">
                      <svg width="130" height="130" className="transform -rotate-90">
                        <circle cx="65" cy="65" r="56" stroke="#242A34" strokeWidth="8" fill="none" />
                        <circle
                          cx="65"
                          cy="65"
                          r="56"
                          stroke={ringColor}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={CIRC}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          className="transition-all duration-100"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-sans text-3xl font-bold text-white">
                        {pennyTimeLeft.toFixed(1)}
                      </div>
                    </div>

                    {/* Leader Row */}
                    <div className="w-full bg-[#181C24] border border-[#242A34] rounded-lg p-2.5 px-3 flex items-center justify-between">
                      <div className="text-xs font-semibold text-white">
                        Leading: <b className="text-[#3ECF8E]">{pennyLeader}</b>
                      </div>
                      <span className="text-[9px] bg-[#123526] text-[#3ECF8E] px-2 py-0.5 rounded tracking-wide uppercase font-semibold">
                        IN THE LEAD
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePennyBidNow}
                    className="w-full py-4 bg-[#FF5C5C] hover:bg-[#E04B4B] active:scale-[0.98] text-white font-sans font-bold text-base rounded-xl transition shadow-lg"
                  >
                    💣 BID $0.10 — RESET CLOCK (+2s Soft-Close)
                  </button>

                  <div className="mt-4 max-h-[100px] overflow-y-auto divide-y divide-[#242A34] text-xs">
                    {bidLog.map((log, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-[#7A8290] py-1.5">
                        <span>
                          <b className="text-white">{log.wallet}</b> bid ${log.amount.toFixed(2)}
                        </span>
                        <span className="text-[#3ECF8E]">+0.01 pot</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#242A34] text-[10px] text-[#454C58] text-center">
                  Timer hits 0 → last bidder wins pot.
                </div>
              </div>
            )}

            {/* GAME 3: SEALED BID */}
            {(activeTab === 'all' || activeTab === 's3') && (
              <div className="bg-[#12151B] border border-[#242A34] rounded-2xl p-6 flex flex-col justify-between hover:border-[#3ECF8E]/40 transition shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-sans text-xl font-bold text-white">Sealed-Bid Blind Auction</h3>
                      <p className="text-xs text-[#7A8290] mt-0.5">Highest UNIQUE bid wins. Matching bids cancel out.</p>
                    </div>
                    <span className="text-[10px] bg-[#3ECF8E]/10 text-[#3ECF8E] px-2.5 py-1 rounded-full uppercase font-bold border border-[#3ECF8E]/20">
                      BLIND COMMIT
                    </span>
                  </div>

                  {/* Phase Strip */}
                  <div className="flex rounded-lg overflow-hidden border border-[#242A34] my-3">
                    <div className="flex-1 text-center py-2 text-[10px] uppercase tracking-wider bg-[#5C4517] text-[#F5A623] font-semibold border-r border-[#242A34]">
                      1. Commit
                    </div>
                    <div className="flex-1 text-center py-2 text-[10px] uppercase tracking-wider bg-[#12151B] text-[#454C58] border-r border-[#242A34]">
                      2. Reveal
                    </div>
                    <div className="flex-1 text-center py-2 text-[10px] uppercase tracking-wider bg-[#12151B] text-[#454C58]">
                      3. Resolve
                    </div>
                  </div>

                  <div className="bg-[#0A0C10] p-5 rounded-xl border border-[#242A34] my-3">
                    <div className="text-[10px] text-[#454C58] uppercase tracking-wider mb-1.5">
                      Your Sealed Bid ($0.10 – $10.00)
                    </div>
                    <div className="flex items-center bg-[#181C24] border border-[#242A34] rounded-lg p-3">
                      <span className="text-2xl text-[#7A8290] mr-2">$</span>
                      <input
                        type="text"
                        value={sealedBidInput}
                        onChange={(e) => setSealedBidInput(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-white font-mono text-2xl font-semibold w-full"
                      />
                    </div>

                    <div className="mt-2 text-[10px] text-[#454C58] leading-relaxed">
                      Bid is hashed with random salt locally. House cannot see bids until reveal.
                    </div>

                    <div className="flex justify-between mt-4 pt-3 border-t border-[#242A34] text-center">
                      <div>
                        <div className="text-lg font-bold text-white">18</div>
                        <div className="text-[9px] text-[#454C58] uppercase">Entries</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[#F5A623]">$21.60</div>
                        <div className="text-[9px] text-[#454C58] uppercase">Pool</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">1:47</div>
                        <div className="text-[9px] text-[#454C58] uppercase">Closes in</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 mt-4">
                      <button
                        onClick={() => handleSealedCommit('SEALED_HIGHEST')}
                        className="bg-[#5C4517] hover:bg-[#73571D] text-[#F5A623] text-xs font-bold py-3 rounded-lg border border-[#F5A623]/30 transition"
                      >
                        1. Commit
                      </button>
                      <button
                        onClick={() => handleSealedReveal('SEALED_HIGHEST')}
                        className="bg-[#181C24] hover:bg-[#242A34] text-white text-xs font-bold py-3 rounded-lg border border-[#242A34] transition"
                      >
                        2. Reveal
                      </button>
                      <button
                        onClick={() => handleSealedResolve('SEALED_HIGHEST')}
                        className="bg-[#123526] hover:bg-[#1A4533] text-[#3ECF8E] text-xs font-bold py-3 rounded-lg border border-[#3ECF8E]/30 transition"
                      >
                        3. Resolve
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#454C58] uppercase tracking-wider mb-2">Last Round Reveal</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-[#181C24] border border-[#242A34] rounded-lg p-2.5 px-3 text-xs opacity-40 line-through">
                      <span>$9.50</span>
                      <span className="text-[9px] bg-[#12151B] text-[#454C58] px-2 py-0.5 rounded border border-[#242A34]">3 players — void</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#123526] border border-[#3ECF8E] rounded-lg p-2.5 px-3 text-xs">
                      <span className="text-white font-semibold">$9.23 — you</span>
                      <span className="text-[9px] bg-[#3ECF8E] text-[#062017] px-2 py-0.5 rounded font-bold uppercase">unique · winner</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#242A34] text-[10px] text-[#454C58] text-center">
                  Non-reveals forfeit entry automatically on window close.
                </div>
              </div>
            )}

            {/* GAME 4: REVERSE AUCTION */}
            {(activeTab === 'all' || activeTab === 's4') && (
              <div className="bg-[#12151B] border border-[#242A34] rounded-2xl p-6 flex flex-col justify-between hover:border-[#F5A623]/40 transition shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-sans text-xl font-bold text-white">Reverse Auction: Lowest Unmatched</h3>
                      <p className="text-xs text-[#7A8290] mt-0.5">$50 USDC prize. Lowest guess that NO ONE ELSE picked wins.</p>
                    </div>
                    <span className="text-[10px] bg-[#F5A623]/10 text-[#F5A623] px-2.5 py-1 rounded-full uppercase font-bold border border-[#F5A623]/20">
                      LOWEST UNIQUE
                    </span>
                  </div>

                  <div className="bg-[#0A0C10] p-5 rounded-xl border border-[#242A34] my-3">
                    <div className="text-[10px] text-[#454C58] uppercase tracking-wider mb-1.5">
                      Pick Your Number (cents, $0.01–$5.00)
                    </div>
                    <div className="flex items-center bg-[#181C24] border border-[#242A34] rounded-lg p-3">
                      <span className="text-2xl text-[#7A8290] mr-2">$0.</span>
                      <input
                        type="text"
                        value={reverseCentInput}
                        onChange={(e) => {
                          setReverseCentInput(e.target.value);
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) setSelectedCell(val);
                        }}
                        className="flex-1 bg-transparent outline-none text-white font-mono text-2xl font-semibold w-full"
                      />
                    </div>

                    <div className="flex justify-between mt-4 pt-3 border-t border-[#242A34] text-center">
                      <div>
                        <div className="text-lg font-bold text-[#F5A623]">$50</div>
                        <div className="text-[9px] text-[#454C58] uppercase">Prize</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">41</div>
                        <div className="text-[9px] text-[#454C58] uppercase">Entries</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">0:58</div>
                        <div className="text-[9px] text-[#454C58] uppercase">Ends in</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 mt-4">
                      <button
                        onClick={() => handleSealedCommit('REVERSE_LOWEST')}
                        className="bg-[#5C4517] hover:bg-[#73571D] text-[#F5A623] text-xs font-bold py-3 rounded-lg border border-[#F5A623]/30 transition"
                      >
                        1. Commit
                      </button>
                      <button
                        onClick={() => handleSealedReveal('REVERSE_LOWEST')}
                        className="bg-[#181C24] hover:bg-[#242A34] text-white text-xs font-bold py-3 rounded-lg border border-[#242A34] transition"
                      >
                        2. Reveal
                      </button>
                      <button
                        onClick={() => handleSealedResolve('REVERSE_LOWEST')}
                        className="bg-[#123526] hover:bg-[#1A4533] text-[#3ECF8E] text-xs font-bold py-3 rounded-lg border border-[#3ECF8E]/30 transition"
                      >
                        3. Resolve
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#454C58] uppercase tracking-wider mb-2">
                    50-Cell Interactive Grid (Cents $0.01–$0.50)
                  </div>

                  {/* 50-Cell Grid */}
                  <div className="grid grid-cols-10 gap-1.5">
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => {
                      const isMine = num === selectedCell;
                      const isTaken = takenOnce.has(num);
                      const isMult = takenMult.has(num);

                      let cellStyle = 'bg-[#181C24] text-[#454C58] border-[#242A34]';
                      if (isMine) {
                        cellStyle = 'bg-[#5C4517] text-[#F5A623] border-[#F5A623] font-bold shadow-md';
                      } else if (isTaken) {
                        cellStyle = 'bg-[#3A1717] text-[#FF5C5C] border-[#FF5C5C]';
                      } else if (isMult) {
                        cellStyle = 'bg-[#181C24] text-[#454C58] border-[#242A34] line-through';
                      }

                      return (
                        <button
                          key={num}
                          onClick={() => {
                            setSelectedCell(num);
                            setReverseCentInput(String(num).padStart(2, '0'));
                          }}
                          className={`aspect-square rounded text-[9px] border flex items-center justify-center transition hover:scale-105 ${cellStyle}`}
                        >
                          .{String(num).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>

                  {/* Grid Legend */}
                  <div className="flex gap-4 mt-3 flex-wrap text-[10px] text-[#7A8290]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#3A1717] border border-[#FF5C5C]" /> picked once
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#181C24] border border-[#242A34]" /> 2+ (void)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#5C4517] border border-[#F5A623]" /> winning pick
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#242A34] text-[10px] text-[#454C58] text-center">
                  Winner: lowest cell with exactly one pick.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Platform Audit Stream & Bet History Stream */}
        <section className="p-4 md:p-8 border-t border-[#242A34] bg-[#12151B]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-[10px] text-[#3ECF8E] uppercase tracking-widest font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-ping" />
                LIVE PLATFORM AUDIT STREAM & BET HISTORY
              </div>
              <h3 className="font-sans text-xl font-bold text-white mt-0.5">Real-Time x402 Game Logs</h3>
            </div>
            <span className="text-xs text-[#7A8290] border border-[#242A34] px-3 py-1 rounded-lg">
              Append-Only Ledger
            </span>
          </div>

          <div className="bg-[#0A0C10] border border-[#242A34] rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#242A34] bg-[#181C24] text-[#7A8290] font-sans text-[10px] uppercase tracking-wider">
                    <th className="p-3 pl-4">Event Type</th>
                    <th className="p-3">Player Wallet</th>
                    <th className="p-3">Details / Amount</th>
                    <th className="p-3 text-right pr-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242A34] font-mono">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-[#454C58] text-xs">
                        No live audit logs recorded yet. Place a bid to see real-time events!
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      let parsedPayload: any = {};
                      try {
                        parsedPayload = JSON.parse(log.payload);
                      } catch (e) {}

                      let badgeColor = 'bg-[#181C24] text-[#7A8290] border-[#242A34]';
                      let icon = '📝';
                      if (log.event_type.includes('LOCKED')) {
                        badgeColor = 'bg-[#5C4517] text-[#F5A623] border-[#F5A623]/30';
                        icon = '⚡';
                      } else if (log.event_type.includes('PENNY')) {
                        badgeColor = 'bg-[#3A1717] text-[#FF5C5C] border-[#FF5C5C]/30';
                        icon = '💣';
                      } else if (log.event_type.includes('COMMIT')) {
                        badgeColor = 'bg-[#123526] text-[#3ECF8E] border-[#3ECF8E]/30';
                        icon = '🙈';
                      } else if (log.event_type.includes('REVEAL')) {
                        badgeColor = 'bg-[#12151B] text-white border-[#242A34]';
                        icon = '🔓';
                      } else if (log.event_type.includes('SETTLED') || log.event_type.includes('RESOLVED')) {
                        badgeColor = 'bg-[#3ECF8E] text-[#062017] border-[#3ECF8E]';
                        icon = '🏆';
                      }

                      const walletStr = parsedPayload.wallet || parsedPayload.winner || '0x71C7...976F';

                      return (
                        <tr key={log.id} className="hover:bg-[#181C24]/50 transition">
                          <td className="p-3 pl-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold border ${badgeColor}`}>
                              <span>{icon}</span>
                              <span>{log.event_type}</span>
                            </span>
                          </td>
                          <td className="p-3 text-white font-semibold">
                            {walletStr.substring(0, 6)}...{walletStr.substring(walletStr.length - 4)}
                          </td>
                          <td className="p-3 text-[#7A8290]">
                            {parsedPayload.serverPrice ? `Price Locked: $${parsedPayload.serverPrice}` : ''}
                            {parsedPayload.newPot ? `Pot: $${parsedPayload.newPot.toFixed(2)} USDC` : ''}
                            {parsedPayload.commitmentHash ? `Hash: ${parsedPayload.commitmentHash.substring(0, 10)}...` : ''}
                            {parsedPayload.revealedBid ? `Bid: $${parsedPayload.revealedBid}` : ''}
                            {parsedPayload.result?.winningBid ? `Winning Bid: $${parsedPayload.result.winningBid}` : ''}
                          </td>
                          <td className="p-3 text-right pr-4 text-[#454C58] text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Game Rules & Protocol Mechanics Section */}
        <section className="p-4 md:p-8 border-t border-[#242A34] bg-[#12151B]/40">
          <div className="mb-6">
            <div className="text-[10px] text-[#F5A623] uppercase tracking-widest font-bold mb-1">
              PROTOCOL SPECIFICATIONS & GUIDELINES
            </div>
            <h2 className="font-sans text-2xl font-bold text-white">📜 Game Rules & Mechanics Guide</h2>
            <p className="text-xs text-[#7A8290] mt-1">
              All 4 bidding games run on server-authoritative state machines, cryptographic hashes, and async x402 payment locks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rule 1: Dutch Auction */}
            <div className="bg-[#12151B] border border-[#242A34] rounded-xl p-5 hover:border-[#F5A623]/30 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">⚡</span>
                <h3 className="font-sans font-bold text-white text-base">Dutch Auction Royale</h3>
              </div>
              <ul className="text-xs text-[#7A8290] space-y-2 leading-relaxed list-disc pl-4">
                <li><b className="text-white">Price Decay:</b> The price starts at $150 and drops by $1 every 500ms down to a floor of $10.</li>
                <li><b className="text-white">Lock-Verify-Settle:</b> Tapping <b className="text-[#F5A623]">BUY NOW</b> sends an instant buy intent to lock the server's exact tick price.</li>
                <li><b className="text-white">First Payment Wins:</b> The server holds a nano-precision lock. If payment settles, you win the $100 USDC jackpot!</li>
                <li><b className="text-white">Anti-Griefing:</b> Failed/abandoned payments resume price decay from current elapsed time (no price reset spam).</li>
              </ul>
            </div>

            {/* Rule 2: Penny Bomb */}
            <div className="bg-[#12151B] border border-[#242A34] rounded-xl p-5 hover:border-[#FF5C5C]/30 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">💣</span>
                <h3 className="font-sans font-bold text-white text-base">1-Cent Bid Bomb</h3>
              </div>
              <ul className="text-xs text-[#7A8290] space-y-2 leading-relaxed list-disc pl-4">
                <li><b className="text-white">Pot Increment:</b> Every bid costs $0.10 USDC, adds $0.01 to the pot, and resets the clock to 15s.</li>
                <li><b className="text-white">Soft-Close Anti-Snipe:</b> Bids placed in the final 2 seconds extend the countdown timer by exactly <b className="text-[#FF5C5C]">+2 seconds</b>.</li>
                <li><b className="text-white">Winning Condition:</b> When the timer reaches 00:00, the last bidder standing wins the accumulated jackpot!</li>
              </ul>
            </div>

            {/* Rule 3: Sealed Bid */}
            <div className="bg-[#12151B] border border-[#242A34] rounded-xl p-5 hover:border-[#3ECF8E]/30 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🙈</span>
                <h3 className="font-sans font-bold text-white text-base">Sealed-Bid Blind Auction</h3>
              </div>
              <ul className="text-xs text-[#7A8290] space-y-2 leading-relaxed list-disc pl-4">
                <li><b className="text-white">Phase 1 (Commit):</b> Pick a secret bid ($0.10–$10.00). Only SHA-256 hash <code className="text-[#3ECF8E]">hash(bid:salt:wallet)</code> is submitted.</li>
                <li><b className="text-white">Phase 2 (Reveal):</b> Submit your bid and secret salt to verify your commitment.</li>
                <li><b className="text-white">Phase 3 (Resolve):</b> Duplicate bids cancel out! The single <b className="text-[#3ECF8E]">highest unique bid</b> wins the pool.</li>
              </ul>
            </div>

            {/* Rule 4: Reverse Auction */}
            <div className="bg-[#12151B] border border-[#242A34] rounded-xl p-5 hover:border-[#F5A623]/30 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🎯</span>
                <h3 className="font-sans font-bold text-white text-base">Reverse Auction (Lowest Unmatched)</h3>
              </div>
              <ul className="text-xs text-[#7A8290] space-y-2 leading-relaxed list-disc pl-4">
                <li><b className="text-white">The Goal:</b> Pick a number between $0.01 and $5.00 (50-cell grid). Entry fee is $0.25 USDC.</li>
                <li><b className="text-white">Unique Pick Wins:</b> If multiple players pick the same number, those picks are voided (cancelled out).</li>
                <li><b className="text-white">Winning Pick:</b> The <b className="text-[#F5A623]">lowest single pick that no one else chose</b> wins the entire $50 USDC prize!</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#181C24] border border-[#242A34] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A8290]">
            <div className="flex items-center gap-2">
              <span className="text-[#3ECF8E]">✓</span>
              <span>All game outcomes and audit logs are recorded on an append-only SQLite ledger.</span>
            </div>
            <span className="font-mono text-[#F5A623]">x402-Pay Compliant</span>
          </div>
        </section>

        <div className="border-t border-[#242A34] p-4 md:px-8 text-[10px] text-[#454C58] text-center">
          x402 Protocol Compliant · Sub-Second Base Sepolia Settlement
        </div>
      </div>
    </div>
  );
}
