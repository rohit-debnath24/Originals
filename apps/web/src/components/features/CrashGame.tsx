'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers';

interface RoundPill {
  id: string;
  multiplier: number;
}

interface PlayerBet {
  wallet: string;
  amount: number;
  cashedAt?: number;
}

export function CrashGame() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(100.0);
  const [betAmount, setBetAmount] = useState<number>(25.0);
  const [autoTarget, setAutoTarget] = useState<number>(2.0);
  const [isAutoOn, setIsAutoOn] = useState<boolean>(false);
  
  const [gameState, setGameState] = useState<'IDLE' | 'RUNNING' | 'BUSTED'>('IDLE');
  const [curMult, setCurMult] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(1.0);
  const [betPlaced, setBetPlaced] = useState<boolean>(false);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [cashedMult, setCashedMult] = useState<number>(1.0);
  const [cashedPayout, setCashedPayout] = useState<number>(0);
  
  const [history, setHistory] = useState<RoundPill[]>([
    { id: '1', multiplier: 2.41 },
    { id: '2', multiplier: 1.15 },
    { id: '3', multiplier: 5.80 },
    { id: '4', multiplier: 1.02 },
    { id: '5', multiplier: 14.20 },
    { id: '6', multiplier: 3.10 },
  ]);

  const [players, setPlayers] = useState<PlayerBet[]>([
    { wallet: '0x4f…9a2', amount: 42.0 },
    { wallet: '0x71…c03', amount: 18.4, cashedAt: 2.1 },
    { wallet: '0x9e…441', amount: 100.0 },
    { wallet: '0x2a…f88', amount: 6.0, cashedAt: 1.34 },
  ]);

  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [activeSeedHash, setActiveSeedHash] = useState<string>('9b2f…7710');
  const [roundId, setRoundId] = useState<string>('#48213');

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

  const startRound = () => {
    if (betAmount > balance && !betPlaced) {
      alert('Insufficient USDC balance! Top up using the + Top Up button.');
      return;
    }

    const targetCrash = Math.max(1.01, parseFloat((0.98 / (1 - Math.random())).toFixed(2)));
    setCrashPoint(targetCrash);
    setGameState('RUNNING');
    setCurMult(1.0);
    setPoints([{ x: 0, y: 210 }]);
    setActiveSeedHash(`${rndHex(4)}…${rndHex(4)}`);
    setRoundId(`#${Math.floor(40000 + Math.random() * 9000)}`);

    let t = 0;
    const interval = setInterval(() => {
      t += 1;
      const nextMult = parseFloat((1 + Math.pow(t / 28, 1.55)).toFixed(2));
      
      const x = Math.min(630, t * 7);
      const y = Math.max(10, 210 - Math.log(nextMult) * 70);
      setPoints((prev) => [...prev, { x, y }]);
      setCurMult(nextMult);

      // Auto cash out check
      if (betPlaced && !cashedOut && isAutoOn && nextMult >= autoTarget) {
        doCashOut(nextMult);
      }

      if (nextMult >= targetCrash) {
        clearInterval(interval);
        setGameState('BUSTED');
        setHistory((prev) => [{ id: String(Date.now()), multiplier: targetCrash }, ...prev.slice(0, 15)]);
        
        if (betPlaced && !cashedOut) {
          // Player busted
          setBalance((b) => Math.max(0, b - betAmount));
          setBetPlaced(false);
        }

        setTimeout(() => {
          setGameState('IDLE');
          setCashedOut(false);
          setBetPlaced(false);
        }, 2200);
      }
    }, 90);
  };

  const doCashOut = (mult: number) => {
    if (!betPlaced || cashedOut) return;
    setCashedOut(true);
    setCashedMult(mult);
    const winAmt = parseFloat((betAmount * mult).toFixed(2));
    setCashedPayout(winAmt);
    setBalance((b) => parseFloat((b + winAmt - betAmount).toFixed(2)));
  };

  const handlePlaceBet = () => {
    if (gameState === 'IDLE') {
      setBetPlaced(true);
      setCashedOut(false);
      startRound();
    } else if (gameState === 'RUNNING' && !betPlaced) {
      setBetPlaced(true);
      setCashedOut(false);
    } else if (gameState === 'RUNNING' && betPlaced && !cashedOut) {
      doCashOut(curMult);
    }
  };

  const pathD = points.length > 0
    ? `M 0 210 ` + points.map((p) => `L ${p.x} ${p.y}`).join(' ')
    : 'M 0 210 L 630 210';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Past Multipliers Strip */}
      <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] rounded-xl p-3 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto no-scrollbar font-mono-code text-xs">
          {history.map((h) => (
            <span
              key={h.id}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap ${
                h.multiplier >= 2.0 ? 'text-[#E8A93B] bg-[#E8A93B]/10 border border-[#E8A93B]/30' : 'text-[#C1503A] bg-[#C1503A]/10 border border-[#C1503A]/30'
              }`}
            >
              {h.multiplier.toFixed(2)}×
            </span>
          ))}
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Chart Stage Card */}
        <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] rounded-2xl p-6 relative flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-archivo text-2xl font-bold text-[#F1EDE1]">Crash</h2>
            <span className={`font-mono-code text-xs px-3 py-1 rounded-full border ${
              gameState === 'RUNNING' ? 'text-[#E8A93B] bg-[#E8A93B]/10 border-[#E8A93B]/30' : 'text-[#93A499] bg-[#0F1B16] border-[rgba(241,237,225,0.12)]'
            }`}>
              {gameState === 'RUNNING' ? 'Round live' : gameState === 'BUSTED' ? `Busted @ ${crashPoint.toFixed(2)}×` : 'Waiting for bet'}
            </span>
          </div>

          {/* Large Multiplier Display */}
          <div className="text-center py-6">
            <div className={`font-mono-code text-6xl font-bold transition-all ${
              gameState === 'BUSTED' ? 'text-[#C1503A]' : 'text-[#E8A93B]'
            }`}>
              {curMult.toFixed(2)}×
            </div>
            <p className="text-xs text-[#5E6E64] font-mono-code mt-2">
              {gameState === 'RUNNING' ? 'rocket climbing…' : gameState === 'BUSTED' ? `busted at ${crashPoint.toFixed(2)}×` : 'place bet to start next rocket'}
            </p>
          </div>

          {/* SVG Rocket Path Graph */}
          <div className="relative w-full h-[220px] bg-[#0F1B16] border border-[rgba(241,237,225,0.12)] rounded-xl overflow-hidden mb-4">
            <svg viewBox="0 0 640 220" className="w-full h-full">
              <path
                d={pathD}
                fill="none"
                stroke={gameState === 'BUSTED' ? '#C1503A' : '#E8A93B'}
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* Provably Fair Audit Strip */}
          <div className="pt-3 border-t border-[rgba(241,237,225,0.12)] flex justify-between items-center text-xs font-mono-code text-[#5E6E64]">
            <span>seed hash: <strong className="text-[#93A499]">{activeSeedHash}</strong></span>
            <span>round: <strong className="text-[#93A499]">{roundId}</strong></span>
            <a href="/verifier" className="text-[#E8A93B] font-sans hover:underline">Verify round →</a>
          </div>
        </div>

        {/* Betting Control Panel */}
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

          {/* Stake Input */}
          <div className="space-y-2">
            <label className="text-xs text-[#93A499] block font-medium">Bet amount</label>
            <div className="flex items-center border border-[rgba(241,237,225,0.22)] rounded-xl overflow-hidden bg-[#0F1B16]">
              <input
                type="number"
                min="1"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent border-none px-4 py-3 font-mono-code text-base font-bold text-[#F1EDE1] outline-none"
              />
              <span className="px-4 text-xs text-[#5E6E64] font-mono-code">USDC</span>
            </div>
          </div>

          {/* Auto Cashout Toggle */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-[#93A499]">
              <span>Auto cash out at</span>
              <button
                onClick={() => setIsAutoOn(!isAutoOn)}
                className={`w-9 h-5 rounded-full p-0.5 transition ${isAutoOn ? 'bg-[#B8842A]' : 'bg-[#1C332A]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-[#F1EDE1] transition transform ${isAutoOn ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {isAutoOn && (
              <div className="flex items-center border border-[rgba(241,237,225,0.22)] rounded-xl overflow-hidden bg-[#0F1B16]">
                <input
                  type="number"
                  min="1.01"
                  step="0.1"
                  value={autoTarget}
                  onChange={(e) => setAutoTarget(parseFloat(e.target.value) || 1.01)}
                  className="w-full bg-transparent border-none px-4 py-2.5 font-mono-code text-sm font-bold text-[#F1EDE1] outline-none"
                />
                <span className="px-4 text-xs text-[#5E6E64] font-mono-code">×</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handlePlaceBet}
            disabled={gameState === 'BUSTED' || (betPlaced && cashedOut)}
            className={`w-full py-4 rounded-xl font-archivo font-bold text-base transition ${
              betPlaced && !cashedOut
                ? 'bg-[#C1503A] text-white hover:bg-[#8C3A29]'
                : 'bg-[#E8A93B] text-[#0F1B16] hover:bg-[#B8842A]'
            } disabled:opacity-50`}
          >
            {betPlaced && !cashedOut
              ? `Cash out @ ${curMult.toFixed(2)}× (${(betAmount * curMult).toFixed(2)} USDC)`
              : cashedOut
              ? `Cashed at ${cashedMult.toFixed(2)}× · +${cashedPayout.toFixed(2)} USDC`
              : 'Place bet →'}
          </button>

          {/* Active Players List */}
          <div className="pt-4 border-t border-[rgba(241,237,225,0.12)] space-y-2">
            <span className="text-xs text-[#5E6E64] block font-mono-code uppercase">Live Round Stakes</span>
            <div className="space-y-1 text-xs font-mono-code">
              {players.map((p, idx) => (
                <div key={idx} className="flex justify-between text-[#93A499]">
                  <span>{p.wallet}</span>
                  <span className={p.cashedAt ? 'text-[#E8A93B] font-bold' : 'text-[#F1EDE1]'}>
                    {p.cashedAt ? `${(p.amount * p.cashedAt).toFixed(2)} USDC @ ${p.cashedAt}×` : `${p.amount.toFixed(2)} USDC`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
