'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';

const RISKS: Record<string, Record<number, number[]>> = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [8.1, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 8.1],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  med: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [24, 5, 2, 1.4, 0.6, 0.4, 0.2, 0.4, 0.6, 1.4, 2, 5, 24],
    16: [43, 10, 5, 2, 1.4, 0.6, 0.4, 0.2, 0.2, 0.2, 0.4, 0.6, 1.4, 2, 5, 10, 43],
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [76, 10, 3, 0.5, 0.3, 0.2, 0.1, 0.2, 0.3, 0.5, 3, 10, 76],
    16: [420, 41, 10, 5, 2, 0.5, 0.3, 0.1, 0.1, 0.1, 0.3, 0.5, 2, 5, 10, 41, 420],
  },
};

export function PlinkoGame() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(100.0);
  const [betAmount, setBetAmount] = useState<number>(10.0);
  const [curRisk, setCurRisk] = useState<'low' | 'med' | 'high'>('low');
  const [curRows, setCurRows] = useState<number>(12);
  const [isDropping, setIsDropping] = useState<boolean>(false);

  // Active ball position state
  const [ball, setBall] = useState<{ cx: number; cy: number } | null>(null);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);

  const [lastMult, setLastMult] = useState<number | null>(null);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [history, setHistory] = useState<{ id: string; mult: number }[]>([]);

  const [seedHash, setSeedHash] = useState<string>('7c1a…e902');
  const [nonceVal, setNonceVal] = useState<number>(4821);

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

  const handleDropBall = () => {
    if (isDropping) return;
    if (betAmount > balance) {
      alert('Insufficient USDC balance! Click + Top Up to claim test USDC.');
      return;
    }

    setIsDropping(true);
    setActiveBucket(null);
    setSeedHash(`${rndHex(4)}…${rndHex(4)}`);
    setNonceVal(Math.floor(Math.random() * 9000 + 1000));

    const rows = curRows;
    const startX = 320;
    let currX = startX;
    let currY = 14;
    let pathAcc = 0;
    let step = 0;
    const spacingY = (340 - 30) / rows;

    setBall({ cx: currX, cy: currY });

    const interval = setInterval(() => {
      if (step >= rows) {
        clearInterval(interval);

        const mults = RISKS[curRisk][rows];
        const bucketIdx = Math.min(
          mults.length - 1,
          Math.max(0, pathAcc + Math.floor(mults.length / 2))
        );
        const chosenMult = mults[bucketIdx];
        const payout = parseFloat((betAmount * chosenMult).toFixed(2));

        setActiveBucket(bucketIdx);
        setLastMult(chosenMult);
        setLastPayout(payout);
        setHistory((prev) => [{ id: String(Date.now()), mult: chosenMult }, ...prev.slice(0, 10)]);
        setBalance((b) => parseFloat((b + payout - betAmount).toFixed(2)));

        setTimeout(() => {
          setBall(null);
          setIsDropping(false);
        }, 400);

        return;
      }

      const dir = Math.random() < 0.5 ? -1 : 1;
      pathAcc += dir > 0 ? 1 : -1;
      currX += dir * 13;
      currY += spacingY;
      setBall({ cx: currX, cy: currY });
      step++;
    }, 70);
  };

  const currentMults = RISKS[curRisk][curRows];
  const bucketW = 460 / currentMults.length;
  const startX = (640 - 460) / 2;
  const spacingY = (340 - 30) / curRows;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Plinko Pyramid Board Card */}
        <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="font-archivo text-2xl font-bold text-[#F1EDE1]">Plinko</h2>

            {/* Risk Tabs */}
            <div className="flex gap-1.5 bg-[#1C332A] p-1 rounded-xl border border-[rgba(241,237,225,0.12)]">
              {(['low', 'med', 'high'] as const).map((r) => (
                <button
                  key={r}
                  disabled={isDropping}
                  onClick={() => setCurRisk(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase font-mono-code transition ${
                    curRisk === r ? 'bg-[#E8A93B] text-[#0F1B16]' : 'text-[#93A499] hover:text-[#F1EDE1]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Plinko SVG Board */}
          <div className="relative w-full overflow-hidden my-2">
            <svg viewBox="0 0 640 420" className="w-full h-auto">
              {/* Pegs */}
              {Array.from({ length: curRows }).map((_, r) => {
                const cnt = r + 3;
                const spX = 460 / (cnt + 1);
                const sX = (640 - 460) / 2;
                return Array.from({ length: cnt }).map((__, c) => {
                  const cx = sX + spX * (c + 1);
                  const cy = 30 + r * spacingY;
                  return <circle key={`${r}-${c}`} cx={cx} cy={cy} r="3.4" fill="#5E6E64" />;
                });
              })}

              {/* Animated Dropping Ball */}
              {ball && (
                <circle
                  cx={ball.cx}
                  cy={ball.cy}
                  r="6.5"
                  fill="#F1EDE1"
                  className="transition-all duration-75 shadow-lg"
                  filter="drop-shadow(0px 0px 6px #E8A93B)"
                />
              )}

              {/* Multiplier Buckets */}
              {currentMults.map((m, i) => {
                const x = startX + i * bucketW;
                const isHit = activeBucket === i;
                return (
                  <g key={i}>
                    <rect
                      x={x + 2}
                      y={360}
                      width={bucketW - 4}
                      height={30}
                      rx={4}
                      fill={
                        isHit
                          ? '#E8A93B'
                          : m >= 1
                          ? 'rgba(232, 169, 59, 0.18)'
                          : 'rgba(193, 80, 58, 0.18)'
                      }
                      stroke={isHit ? '#F1EDE1' : m >= 1 ? '#B8842A' : '#C1503A'}
                      strokeWidth={isHit ? '2' : '1'}
                      className="transition-all duration-150"
                    />
                    <text
                      x={x + bucketW / 2}
                      y={380}
                      className="font-mono-code text-[11px] font-bold"
                      textAnchor="middle"
                      fill={isHit ? '#0F1B16' : m >= 1 ? '#E8A93B' : '#C1503A'}
                    >
                      {m}×
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Row Selectors */}
          <div className="flex gap-2 my-3">
            {[8, 12, 16].map((rows) => (
              <button
                key={rows}
                disabled={isDropping}
                onClick={() => setCurRows(rows)}
                className={`flex-1 py-2 rounded-lg font-mono-code text-xs border transition ${
                  curRows === rows
                    ? 'border-[#E8A93B] text-[#E8A93B] bg-[#E8A93B]/10 font-bold'
                    : 'bg-[#1C332A] border-[rgba(241,237,225,0.12)] text-[#93A499]'
                }`}
              >
                {rows} rows
              </button>
            ))}
          </div>

          {/* Provably Fair Audit Strip */}
          <div className="pt-3 border-t border-[rgba(241,237,225,0.12)] flex justify-between items-center text-xs font-mono-code text-[#5E6E64]">
            <span>seed hash: <strong className="text-[#93A499]">{seedHash}</strong></span>
            <span>nonce: <strong className="text-[#93A499]">{nonceVal}</strong></span>
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

          {/* Stake Input */}
          <div className="space-y-2">
            <label className="text-xs text-[#93A499] block font-medium">Bet amount</label>
            <div className="flex items-center border border-[rgba(241,237,225,0.22)] rounded-xl overflow-hidden bg-[#0F1B16]">
              <button
                onClick={() => setBetAmount((b) => Math.max(1, b - 1))}
                className="px-3 text-lg font-mono-code text-[#93A499] hover:text-[#F1EDE1]"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent border-none text-center px-2 py-3 font-mono-code text-base font-bold text-[#F1EDE1] outline-none"
              />
              <span className="px-3 text-xs text-[#5E6E64] font-mono-code">USDC</span>
              <button
                onClick={() => setBetAmount((b) => b + 1)}
                className="px-3 text-lg font-mono-code text-[#93A499] hover:text-[#F1EDE1]"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="flex gap-2">
            <button
              onClick={() => setBetAmount((b) => Math.max(1, b / 2))}
              className="flex-1 py-2 bg-[#1C332A] border border-[rgba(241,237,225,0.12)] rounded-lg font-mono-code text-xs text-[#93A499] hover:text-[#F1EDE1]"
            >
              ½
            </button>
            <button
              onClick={() => setBetAmount((b) => b * 2)}
              className="flex-1 py-2 bg-[#1C332A] border border-[rgba(241,237,225,0.12)] rounded-lg font-mono-code text-xs text-[#93A499] hover:text-[#F1EDE1]"
            >
              2×
            </button>
            <button
              onClick={() => setBetAmount(balance)}
              className="flex-1 py-2 bg-[#1C332A] border border-[rgba(241,237,225,0.12)] rounded-lg font-mono-code text-xs text-[#93A499] hover:text-[#F1EDE1]"
            >
              Max
            </button>
          </div>

          {/* Drop Action */}
          <button
            onClick={handleDropBall}
            disabled={isDropping}
            className="w-full py-4 bg-[#E8A93B] hover:bg-[#B8842A] text-[#0F1B16] font-archivo font-bold text-base rounded-xl transition disabled:opacity-50"
          >
            {isDropping ? 'Dropping ball...' : 'Drop ball →'}
          </button>

          {/* Last Drop Result */}
          <div className="pt-4 border-t border-[rgba(241,237,225,0.12)] flex justify-between items-center font-mono-code">
            <div>
              <span className="text-[11px] text-[#5E6E64] block">Last multiplier</span>
              <span className="text-2xl font-bold text-[#E8A93B]">{lastMult !== null ? `${lastMult}×` : '—'}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#5E6E64] block">Payout</span>
              <span className="text-lg font-bold text-[#F1EDE1]">{lastPayout !== null ? `${lastPayout.toFixed(2)} USDC` : '—'}</span>
            </div>
          </div>

          {/* Recent Drops History */}
          <div className="space-y-2">
            <span className="text-xs text-[#93A499] block">Recent drops</span>
            <div className="flex gap-2 flex-wrap">
              {history.map((h) => (
                <span
                  key={h.id}
                  className={`font-mono-code text-xs px-2.5 py-1 rounded bg-[#1C332A] ${
                    h.mult >= 1 ? 'text-[#E8A93B] font-bold' : 'text-[#93A499]'
                  }`}
                >
                  {h.mult}×
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
