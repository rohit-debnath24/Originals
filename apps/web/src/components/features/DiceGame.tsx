'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';

interface BetResult {
  id: string;
  betAmount: number;
  rollResult: number;
  multiplier: number;
  payout: number;
  status: 'WON' | 'LOST' | 'REFUNDED';
  userBalanceAfter: number;
  provablyFair: {
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  };
}

export function DiceGame() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(100.0);
  const [betAmount, setBetAmount] = useState<number>(10.0);
  const [targetNumber, setTargetNumber] = useState<number>(50.0);
  const [condition, setCondition] = useState<'OVER' | 'UNDER'>('OVER');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<BetResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSeed, setActiveSeed] = useState<{ serverSeedHash: string; clientSeed: string; nonce: number } | null>(null);
  const [recentBets, setRecentBets] = useState<any[]>([]);

  // Multiplier & Win Chance calculations
  const winChance = condition === 'OVER' ? 100 - targetNumber : targetNumber;
  const rawMultiplier = (99 / winChance) * 0.99; // 1% house edge
  const multiplier = Math.max(1.01, Math.round(rawMultiplier * 100) / 100);
  const profitOnWin = Math.round(betAmount * (multiplier - 1) * 100) / 100;

  const currentUserId = user?.id || 'demo-user-1';

  useEffect(() => {
    fetchActiveSeed();
    fetchRecentBets();
    fetchUserBalance();
  }, [currentUserId]);

  const fetchUserBalance = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${currentUserId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setBalance(data.data.balance_usdc);
      }
    } catch (e) {
      console.error('Failed to fetch user balance', e);
    }
  };

  const fetchActiveSeed = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/game/provably-fair/active-seed/${currentUserId}`);
      const data = await res.json();
      if (data.success) {
        setActiveSeed(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch provably fair seed', e);
    }
  };

  const fetchRecentBets = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/game/recent-bets');
      const data = await res.json();
      if (data.success) {
        setRecentBets(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch recent bets', e);
    }
  };

  const handleFaucetTopUp = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${currentUserId}/faucet`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setBalance(data.data.balance_usdc ?? data.data.balanceUSDC ?? 100.0);
        setErrorMessage(null);
      }
    } catch (e) {
      console.error('Faucet top-up failed', e);
    }
  };

  const handleRoll = async () => {
    if (isRolling) return;
    setErrorMessage(null);

    if (betAmount > balance) {
      setErrorMessage(`Insufficient balance! Your current balance is ${balance.toFixed(2)} USDC. Click "+ Top Up" to claim +100 USDC test balance.`);
      return;
    }

    setIsRolling(true);
    try {
      const response = await fetch('http://localhost:3001/api/game/dice/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          betAmount,
          targetNumber,
          condition,
          clientSeed: activeSeed?.clientSeed
        })
      });

      const data = await response.json();
      if (data.success) {
        setLastResult(data.data);
        setBalance(data.data.userBalanceAfter);
        setActiveSeed(data.data.provablyFair);
        fetchRecentBets();
      } else {
        const errorMsg = data.error?.message || data.error || 'Roll failed';
        setErrorMessage(errorMsg);
      }
    } catch (err) {
      console.error('Roll request error', err);
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Game Card Container */}
      <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Game Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1C332A] border border-[rgba(241,237,225,0.12)] flex items-center justify-center text-2xl">
              🎲
            </div>
            <div>
              <h2 className="font-archivo text-2xl font-bold text-[#F1EDE1]">Dice</h2>
              <p className="font-mono-code text-xs text-[#93A499]">Provably fair • Settled on x402</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] px-4 py-2 rounded-xl">
              <span className="text-xs text-[#93A499] font-medium">Balance:</span>
              <span className="font-mono-code text-lg font-bold text-[#E8A93B]">{balance.toFixed(2)} USDC</span>
            </div>

            <button
              onClick={handleFaucetTopUp}
              className="px-3 py-2 bg-[#E8A93B]/10 hover:bg-[#E8A93B]/20 border border-[#E8A93B]/40 text-[#E8A93B] text-xs font-mono-code rounded-xl font-bold transition"
            >
              + Top Up (+100)
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#C1503A]/20 border border-[#C1503A]/40 rounded-xl text-xs font-mono-code text-[#F1EDE1] flex items-center justify-between gap-4">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={handleFaucetTopUp}
              className="px-3 py-1.5 bg-[#E8A93B] text-[#0F1B16] font-bold font-archivo rounded-lg text-xs hover:bg-[#B8842A] transition"
            >
              Top Up Now
            </button>
          </div>
        )}

        {/* Outcome Display Stage */}
        <div className="relative my-6 bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
          {lastResult ? (
            <div className="space-y-2">
              <div className="font-mono-code text-xs tracking-widest text-[#93A499] uppercase">
                Roll Outcome
              </div>
              <div className={`font-mono-code text-6xl font-bold tracking-tight ${
                lastResult.status === 'WON' ? 'text-[#E8A93B]' : 'text-[#C1503A]'
              }`}>
                {lastResult.rollResult.toFixed(2)}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono-code bg-[#152620] border border-[rgba(241,237,225,0.12)]">
                {lastResult.status === 'WON' ? (
                  <span className="text-[#E8A93B]">✓ WON +{lastResult.payout.toFixed(2)} USDC ({lastResult.multiplier}x)</span>
                ) : (
                  <span className="text-[#C1503A]">✕ LOST -{lastResult.betAmount.toFixed(2)} USDC</span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-mono-code text-5xl font-bold text-[#5E6E64]">50.00</div>
              <p className="text-xs text-[#93A499]">Select your odds and click Roll Dice</p>
            </div>
          )}
        </div>

        {/* Range Slider & Stats Grid */}
        <div className="space-y-6 bg-[#0F1B16]/60 p-6 rounded-xl border border-[rgba(241,237,225,0.12)]">
          <div className="flex justify-between items-center text-xs font-mono-code text-[#93A499]">
            <span>0.00</span>
            <span className="text-[#E8A93B] font-bold">
              Target: {condition === 'OVER' ? '>' : '<'} {targetNumber.toFixed(2)}
            </span>
            <span>99.99</span>
          </div>

          <input
            type="range"
            min="2"
            max="97"
            step="1"
            value={targetNumber}
            onChange={(e) => setTargetNumber(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#1C332A] rounded-lg appearance-none cursor-pointer accent-[#E8A93B]"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] p-3 rounded-xl text-center">
              <span className="text-xs text-[#5E6E64] font-medium block">Condition</span>
              <div className="flex mt-1.5 bg-[#152620] p-1 rounded-lg border border-[rgba(241,237,225,0.12)]">
                <button
                  onClick={() => setCondition('OVER')}
                  className={`flex-1 py-1 text-xs font-bold rounded transition ${
                    condition === 'OVER' ? 'bg-[#E8A93B] text-[#0F1B16]' : 'text-[#93A499] hover:text-[#F1EDE1]'
                  }`}
                >
                  Over
                </button>
                <button
                  onClick={() => setCondition('UNDER')}
                  className={`flex-1 py-1 text-xs font-bold rounded transition ${
                    condition === 'UNDER' ? 'bg-[#E8A93B] text-[#0F1B16]' : 'text-[#93A499] hover:text-[#F1EDE1]'
                  }`}
                >
                  Under
                </button>
              </div>
            </div>

            <div className="bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] p-3 rounded-xl text-center">
              <span className="text-xs text-[#5E6E64] font-medium block">Win Chance</span>
              <div className="font-mono-code text-xl font-bold text-[#F1EDE1] mt-1">{winChance.toFixed(2)}%</div>
            </div>

            <div className="bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] p-3 rounded-xl text-center">
              <span className="text-xs text-[#5E6E64] font-medium block">Multiplier</span>
              <div className="font-mono-code text-xl font-bold text-[#E8A93B] mt-1">{multiplier.toFixed(2)}x</div>
            </div>

            <div className="bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] p-3 rounded-xl text-center">
              <span className="text-xs text-[#5E6E64] font-medium block">Profit on Win</span>
              <div className="font-mono-code text-xl font-bold text-[#E8A93B] mt-1">+{profitOnWin.toFixed(2)}</div>
            </div>
          </div>

          {/* Stake & Roll Action */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] rounded-xl px-4 py-3 font-mono-code text-lg font-bold text-[#F1EDE1] focus:outline-none focus:border-[#E8A93B]"
                placeholder="Stake Amount"
              />
              <span className="absolute right-4 top-3.5 text-xs text-[#93A499] font-mono-code">USDC</span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setBetAmount((prev) => Math.max(0.1, prev / 2))}
                className="px-3 py-3 bg-[#1C332A] hover:bg-[#152620] text-xs font-mono-code rounded-xl text-[#F1EDE1] transition border border-[rgba(241,237,225,0.12)]"
              >
                1/2
              </button>
              <button
                onClick={() => setBetAmount((prev) => prev * 2)}
                className="px-3 py-3 bg-[#1C332A] hover:bg-[#152620] text-xs font-mono-code rounded-xl text-[#F1EDE1] transition border border-[rgba(241,237,225,0.12)]"
              >
                2x
              </button>
              <button
                onClick={() => setBetAmount(balance)}
                className="px-3 py-3 bg-[#1C332A] hover:bg-[#152620] text-xs font-mono-code rounded-xl text-[#F1EDE1] transition border border-[rgba(241,237,225,0.12)]"
              >
                MAX
              </button>
            </div>

            <button
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#E8A93B] hover:bg-[#B8842A] text-[#0F1B16] font-archivo font-bold text-base rounded-xl transition transform active:scale-95 disabled:opacity-50"
            >
              {isRolling ? 'Rolling...' : 'Roll Dice →'}
            </button>
          </div>
        </div>

        {/* Seed Info Banner */}
        {activeSeed && (
          <div className="mt-4 p-3 bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] rounded-xl flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono-code text-[#93A499]">
            <div className="truncate max-w-md">
              <span className="text-[#E8A93B]">Active Hash:</span> {activeSeed.serverSeedHash}
            </div>
            <div className="flex items-center gap-3">
              <span>Nonce: <strong className="text-[#F1EDE1]">{activeSeed.nonce}</strong></span>
              <a href="/verifier" className="text-[#E8A93B] hover:underline font-sans font-medium">
                Verify Math →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Recent Bets Table */}
      <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] rounded-2xl p-6 shadow-xl">
        <h3 className="font-archivo text-lg font-bold text-[#F1EDE1] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E8A93B] animate-ping" />
          Live Settlement Stream
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#93A499]">
            <thead className="bg-[#0F1B16] text-xs uppercase text-[#5E6E64] font-mono-code">
              <tr>
                <th className="p-3 rounded-l-lg">Game</th>
                <th className="p-3">Player</th>
                <th className="p-3">Stake</th>
                <th className="p-3">Roll</th>
                <th className="p-3">Mult</th>
                <th className="p-3 rounded-r-lg">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(241,237,225,0.08)] font-mono-code">
              {recentBets.length > 0 ? (
                recentBets.map((b: any) => (
                  <tr key={b.id} className="hover:bg-[#1C332A]/50 transition">
                    <td className="p-3 font-sans font-medium text-[#F1EDE1]">🎲 Dice</td>
                    <td className="p-3 text-[#93A499] truncate max-w-[120px]">{b.user_id}</td>
                    <td className="p-3 text-[#F1EDE1] font-bold">{b.bet_amount} USDC</td>
                    <td className="p-3 text-[#E8A93B] font-bold">{b.roll_result?.toFixed(2)}</td>
                    <td className="p-3 text-[#93A499]">{b.multiplier}x</td>
                    <td className="p-3 font-bold">
                      {b.status === 'WON' ? (
                        <span className="text-[#E8A93B]">+{b.payout.toFixed(2)} USDC</span>
                      ) : (
                        <span className="text-[#C1503A]">0.00 USDC</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-[#5E6E64] font-sans">
                    No rounds settled yet. Be the first to play!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
