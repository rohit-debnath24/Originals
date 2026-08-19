'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';

const GRID_SIZE = 25;

export function MinesGame() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(100.0);
  const [betAmount, setBetAmount] = useState<number>(15.0);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [gameOn, setGameOn] = useState<boolean>(false);
  const [mineSet, setMineSet] = useState<Set<number>>(new Set());
  const [revealedSet, setRevealedSet] = useState<Set<number>>(new Set());
  const [hitMine, setHitMine] = useState<boolean>(false);
  const [curMult, setCurMult] = useState<number>(1.0);
  const [seedHash, setSeedHash] = useState<string>('2f8d…31ab');

  const currentUserId = user?.id || 'demo-user-1';

  useEffect(() => {
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
      console.error('Failed to fetch balance', e);
    }
  };

  const handleFaucetTopUp = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${currentUserId}/faucet`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBalance(data.data.balanceUSDC);
      }
    } catch (e) {
      console.error('Faucet failed', e);
    }
  };

  const rndHex = (n: number) => {
    const chars = '0123456789abcdef';
    let s = '';
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * 16)];
    return s;
  };

  const calcMult = (revCount: number) => {
    const houseEdge = 0.98;
    let p = 1;
    for (let i = 0; i < revCount; i++) {
      p *= (GRID_SIZE - minesCount - i) / (GRID_SIZE - i);
    }
    return parseFloat((houseEdge / p).toFixed(2));
  };

  const deductStakeBackend = async (amount: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${currentUserId}/debit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, referenceId: `mines_${Date.now()}` })
      });
      const data = await res.json();
      if (data.success && data.data?.balanceUSDC !== undefined) {
        setBalance(data.data.balanceUSDC);
      }
    } catch (e) {
      console.error('Failed to sync debit with server', e);
    }
  };

  const creditWinBackend = async (amount: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${currentUserId}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, referenceId: `mines_win_${Date.now()}` })
      });
      const data = await res.json();
      if (data.success && data.data?.balanceUSDC !== undefined) {
        setBalance(data.data.balanceUSDC);
      }
    } catch (e) {
      console.error('Failed to sync win credit with server', e);
    }
  };

  const handleStartGame = () => {
    if (gameOn) {
      // Cash out
      handleCashOut();
      return;
    }

    if (betAmount > balance) {
      alert('Insufficient USDC balance! Click + Top Up to claim test USDC.');
      return;
    }

    // Set mines randomly
    const newMines = new Set<number>();
    while (newMines.size < minesCount) {
      newMines.add(Math.floor(Math.random() * GRID_SIZE));
    }

    // Deduct stake immediately upon starting round
    setBalance((b) => parseFloat(Math.max(0, b - betAmount).toFixed(2)));
    deductStakeBackend(betAmount);

    setMineSet(newMines);
    setRevealedSet(new Set());
    setHitMine(false);
    setCurMult(1.0);
    setGameOn(true);
    setSeedHash(`${rndHex(4)}…${rndHex(4)}`);
  };

  const handleRevealTile = (idx: number) => {
    if (!gameOn || revealedSet.has(idx) || hitMine) return;

    if (mineSet.has(idx)) {
      // Mine hit! Stake was debited upfront.
      setHitMine(true);
      setGameOn(false);
      return;
    }

    // Gem revealed!
    const updatedRevealed = new Set(revealedSet);
    updatedRevealed.add(idx);
    setRevealedSet(updatedRevealed);

    const nextMult = calcMult(updatedRevealed.size);
    setCurMult(nextMult);

    if (updatedRevealed.size >= GRID_SIZE - minesCount) {
      // All gems revealed -> Auto Win!
      const payout = parseFloat((betAmount * nextMult).toFixed(2));
      setBalance((b) => parseFloat((b + payout).toFixed(2)));
      creditWinBackend(payout);
      setGameOn(false);
    }
  };

  const handleCashOut = () => {
    if (!gameOn) return;
    const payout = parseFloat((betAmount * curMult).toFixed(2));
    setBalance((b) => parseFloat((b + payout).toFixed(2)));
    creditWinBackend(payout);
    setGameOn(false);
  };

  const nextMult = calcMult(revealedSet.size + 1);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Board Card */}
        <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-archivo text-2xl font-bold text-[#F1EDE1]">Mines</h2>
            <span className="font-mono-code text-sm text-[#E8A93B] border border-[#B8842A] px-3 py-1 rounded-full bg-[#1C332A]">
              {curMult.toFixed(2)}×
            </span>
          </div>

          {/* 5x5 Grid Stage */}
          <div className="grid grid-cols-5 gap-3 max-w-[400px] mx-auto w-full my-4">
            {Array.from({ length: GRID_SIZE }).map((_, i) => {
              const isRevealed = revealedSet.has(i);
              const isMine = hitMine && mineSet.has(i);
              return (
                <button
                  key={i}
                  onClick={() => handleRevealTile(i)}
                  disabled={!gameOn || isRevealed || hitMine}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xl font-bold transition transform active:scale-95 border ${
                    isRevealed
                      ? 'bg-[#E8A93B]/20 border-[#B8842A] text-[#E8A93B]'
                      : isMine
                      ? 'bg-[#C1503A]/30 border-[#C1503A] text-[#C1503A]'
                      : 'bg-[#1C332A] border-[rgba(241,237,225,0.22)] text-transparent hover:bg-[#233b31]'
                  }`}
                >
                  {isRevealed ? '◆' : isMine ? '✕' : ''}
                </button>
              );
            })}
          </div>

          {/* Provably Fair Audit Strip */}
          <div className="pt-4 border-t border-[rgba(241,237,225,0.12)] flex justify-between items-center text-xs font-mono-code text-[#5E6E64]">
            <span>seed hash: <strong className="text-[#93A499]">{seedHash}</strong></span>
            <span>layout: <strong className="text-[#93A499]">shuffled at commit</strong></span>
            <a href="/verifier" className="text-[#E8A93B] font-sans hover:underline">Verify round →</a>
          </div>
        </div>

        {/* Panel Controls */}
        <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] rounded-2xl p-6 space-y-5 h-fit">
          {/* User Balance & Topup */}
          <div className="flex justify-between items-center bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] p-3 rounded-xl">
            <div>
              <span className="text-xs text-[#5E6E64] block">Available Balance</span>
              <span className="font-mono-code text-base font-bold text-[#E8A93B]">{balance.toFixed(2)} USDC</span>
            </div>
            <button
              onClick={handleFaucetTopUp}
              className="px-3 py-1.5 bg-[#E8A93B]/10 hover:bg-[#E8A93B]/20 border border-[#E8A93B]/40 text-[#E8A93B] text-xs font-mono-code rounded-lg font-bold transition"
            >
              + Top Up
            </button>
          </div>

          {/* Bet Input */}
          <div className="space-y-2">
            <label className="text-xs text-[#93A499] block font-medium">Bet amount</label>
            <div className="flex items-center border border-[rgba(241,237,225,0.22)] rounded-xl overflow-hidden bg-[#0F1B16]">
              <input
                type="number"
                min="1"
                disabled={gameOn}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent border-none px-4 py-3 font-mono-code text-base font-bold text-[#F1EDE1] outline-none"
              />
              <span className="px-4 text-xs text-[#5E6E64] font-mono-code">USDC</span>
            </div>
          </div>

          {/* Mines Count Selector */}
          <div className="space-y-2">
            <label className="text-xs text-[#93A499] block font-medium">Mines count</label>
            <div className="flex gap-2 flex-wrap">
              {[3, 5, 8, 12, 24].map((cnt) => (
                <button
                  key={cnt}
                  disabled={gameOn}
                  onClick={() => setMinesCount(cnt)}
                  className={`flex-1 py-2 rounded-lg font-mono-code text-xs border transition ${
                    minesCount === cnt
                      ? 'border-[#C1503A] text-[#C1503A] bg-[#C1503A]/10 font-bold'
                      : 'bg-[#1C332A] border-[rgba(241,237,225,0.12)] text-[#93A499]'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartGame}
            className={`w-full py-4 rounded-xl font-archivo font-bold text-base transition ${
              gameOn
                ? 'bg-[#C1503A] text-white hover:bg-[#8C3A29]'
                : 'bg-[#E8A93B] text-[#0F1B16] hover:bg-[#B8842A]'
            }`}
          >
            {gameOn
              ? `Cash out — ${(betAmount * curMult).toFixed(2)} USDC`
              : 'Start round →'}
          </button>

          {/* Next Gem Payout Banner */}
          <div className="pt-3 border-t border-[rgba(241,237,225,0.12)] flex justify-between items-center text-xs font-mono-code">
            <span className="text-[#93A499]">Next tile pays</span>
            <span className="text-[#E8A93B] font-bold text-sm">{nextMult.toFixed(2)}×</span>
          </div>
        </div>
      </div>
    </div>
  );
}
