'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DiceGame, WalletButton } from '@/components/features';

export default function HomePage() {
  const [tickerTicks, setTickerTicks] = useState<any[]>([]);

  useEffect(() => {
    const games = ['DICE', 'PLINKO', 'CRASH', 'MINES'];
    const generateTicks = () => {
      const list = [];
      for (let i = 0; i < 16; i++) {
        const g = games[Math.floor(Math.random() * games.length)];
        const result =
          g === 'DICE'
            ? `roll ${(Math.random() * 99.9).toFixed(1)}`
            : g === 'CRASH'
            ? `${(1 + Math.random() * 4).toFixed(2)}x`
            : g === 'MINES'
            ? `${Math.floor(Math.random() * 12) + 3} tiles`
            : `${(2 + Math.random() * 10).toFixed(1)}x bucket`;

        const randomHash = Math.random().toString(16).substring(2, 10);
        list.push({ game: g, result, hash: `${randomHash}…${randomHash.substring(0, 4)}` });
      }
      return list;
    };
    setTickerTicks(generateTicks());
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1B16] text-[#F1EDE1] flex flex-col font-sans selection:bg-[#E8A93B] selection:text-[#0F1B16]">
      {/* Navigation */}
      <nav className="border-b border-[rgba(241,237,225,0.12)] py-5 sticky top-0 bg-[#0F1B16]/90 backdrop-blur-md z-50">
        <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-xl font-black font-archivo tracking-tight">
            <div className="w-7 h-7 border-[1.5px] border-[#E8A93B] flex items-center justify-center font-mono-code text-xs text-[#E8A93B] transform rotate-45">
              <span className="transform -rotate-45">O</span>
            </div>
            <span>Originals</span>
          </Link>

          <div className="hidden md:flex gap-8 text-sm text-[#93A499] font-medium">
            <a href="#games" className="hover:text-[#F1EDE1] transition">Games</a>
            <a href="#fair" className="hover:text-[#F1EDE1] transition">Provably fair</a>
            <a href="#pay" className="hover:text-[#F1EDE1] transition">Payments</a>
            <Link href="/verifier" className="hover:text-[#E8A93B] transition text-[#93A499]">Verifier</Link>
          </div>

          <WalletButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 border-b border-[rgba(241,237,225,0.12)]">
        <div className="max-w-[1120px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-14 items-end">
          <div>
            <div className="font-mono-code text-xs tracking-[0.14em] uppercase text-[#E8A93B] mb-4">
              INSTANT-WIN · SETTLED ON X402
            </div>
            <h1 className="font-archivo text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.98] mb-6">
              Every round<br />verifies <em className="not-italic text-[#E8A93B]">itself.</em>
            </h1>
            <p className="text-[#93A499] text-base sm:text-lg max-w-[480px] mb-8 leading-relaxed">
              Four in-house games, no account, no custody. Connect a wallet, stake in USDC, and check the math on any round yourself — the seed's hashed before you bet and revealed after.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="#games" className="bg-[#E8A93B] hover:bg-[#B8842A] text-[#0F1B16] px-6 py-3.5 rounded-[10px] font-semibold text-sm transition">
                Play now →
              </a>
              <a href="#fair" className="border border-[rgba(241,237,225,0.22)] hover:border-[#F1EDE1] px-6 py-3.5 rounded-[10px] font-medium text-sm text-[#F1EDE1] transition">
                How it's verified
              </a>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-[rgba(241,237,225,0.12)] pt-6 lg:pt-0 lg:pl-8 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[rgba(241,237,225,0.12)]">
              <span className="text-xs text-[#5E6E64]">Wagered, 24h</span>
              <span className="font-mono-code text-xl text-[#F1EDE1]">$482,110</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[rgba(241,237,225,0.12)]">
              <span className="text-xs text-[#5E6E64]">Rounds settled</span>
              <span className="font-mono-code text-xl text-[#E8A93B]">228,904</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[rgba(241,237,225,0.12)]">
              <span className="text-xs text-[#5E6E64]">Median payout time</span>
              <span className="font-mono-code text-xl text-[#F1EDE1]">1.8s</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[rgba(241,237,225,0.12)]">
              <span className="text-xs text-[#5E6E64]">Settlement rail</span>
              <span className="font-mono-code text-xl text-[#F1EDE1]">USDC / Base</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker Marquee Band */}
      <div className="border-b border-[rgba(241,237,225,0.12)] bg-[#152620] overflow-hidden relative py-3">
        <div className="flex w-max animate-scroll">
          {[...tickerTicks, ...tickerTicks].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 px-6 border-r border-[rgba(241,237,225,0.12)] font-mono-code text-xs whitespace-nowrap">
              <span className="text-[#93A499]">{item.game}</span>
              <span className="text-[#F1EDE1] font-medium">{item.result}</span>
              <span className="text-[#5E6E64]">{item.hash}</span>
              <span className="text-[#E8A93B]">✓ verified</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Game Stage Section */}
      <section className="py-20" id="games">
        <div className="max-w-[1120px] mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="font-mono-code text-xs tracking-[0.14em] uppercase text-[#E8A93B] mb-2">
                THE ORIGINALS
              </div>
              <h2 className="font-archivo text-3xl sm:text-4xl font-bold">Built in-house, opened up</h2>
            </div>
            <p className="text-[#93A499] text-sm max-w-sm">
              Each game's outcome is a deterministic function of a server seed, your client seed, and the round number — nothing is decided after you bet.
            </p>
          </div>

          {/* Interactive Dice Game Play Area */}
          <DiceGame />

          {/* Other Originals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] hover:border-[rgba(241,237,225,0.22)] rounded-2xl p-6 transition">
              <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#1C332A] flex items-center justify-center text-xl">
                  📍
                </div>
                <span className="font-mono-code text-xs px-2.5 py-1 rounded-full uppercase text-[#8FBF8A] bg-[#8FBF8A]/10">
                  Adjustable risk
                </span>
              </div>
              <h3 className="font-archivo text-xl font-bold mb-2">Plinko</h3>
              <p className="text-[#93A499] text-sm mb-5">Drop down a pegged pyramid. Set rows and risk, the ball's path is fixed by the seed before it falls.</p>
              <div className="flex justify-between items-center pt-3 border-t border-[rgba(241,237,225,0.12)] font-mono-code text-xs text-[#5E6E64]">
                <span>last: a4f9…c113</span>
                <Link href="/plinko" className="text-[#E8A93B] font-sans font-semibold text-sm hover:underline">Play Plinko →</Link>
              </div>
            </div>

            <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] hover:border-[rgba(241,237,225,0.22)] rounded-2xl p-6 transition">
              <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#1C332A] flex items-center justify-center text-xl">
                  📈
                </div>
                <span className="font-mono-code text-xs px-2.5 py-1 rounded-full uppercase text-[#C1503A] bg-[#C1503A]/10">
                  High variance
                </span>
              </div>
              <h3 className="font-archivo text-xl font-bold mb-2">Crash</h3>
              <p className="text-[#93A499] text-sm mb-5">Watch the multiplier climb, cash out before it busts. The crash point is committed before the round starts.</p>
              <div className="flex justify-between items-center pt-3 border-t border-[rgba(241,237,225,0.12)] font-mono-code text-xs text-[#5E6E64]">
                <span>last: 2.41×</span>
                <Link href="/crash" className="text-[#E8A93B] font-sans font-semibold text-sm hover:underline">Play Crash →</Link>
              </div>
            </div>

            <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] hover:border-[rgba(241,237,225,0.22)] rounded-2xl p-6 transition">
              <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#1C332A] flex items-center justify-center text-xl">
                  💣
                </div>
                <span className="font-mono-code text-xs px-2.5 py-1 rounded-full uppercase text-[#C1503A] bg-[#C1503A]/10">
                  Player-set mines
                </span>
              </div>
              <h3 className="font-archivo text-xl font-bold mb-2">Mines</h3>
              <p className="text-[#93A499] text-sm mb-5">Clear tiles on a 5×5 grid, cash out any time. Mine placement is shuffled by the round's seed, not by outcome.</p>
              <div className="flex justify-between items-center pt-3 border-t border-[rgba(241,237,225,0.12)] font-mono-code text-xs text-[#5E6E64]">
                <span>last: 7 tiles · win</span>
                <Link href="/mines" className="text-[#E8A93B] font-sans font-semibold text-sm hover:underline">Play Mines →</Link>
              </div>
            </div>

            <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] hover:border-[rgba(241,237,225,0.22)] rounded-2xl p-6 transition">
              <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#1C332A] flex items-center justify-center text-xl">
                  🎲
                </div>
                <span className="font-mono-code text-xs px-2.5 py-1 rounded-full uppercase text-[#8FBF8A] bg-[#8FBF8A]/10">
                  Set your odds
                </span>
              </div>
              <h3 className="font-archivo text-xl font-bold mb-2">Dice</h3>
              <p className="text-[#93A499] text-sm mb-5">Slide the threshold, pick high or low. One HMAC roll per bet — auto-bet supported for streaks.</p>
              <div className="flex justify-between items-center pt-3 border-t border-[rgba(241,237,225,0.12)] font-mono-code text-xs text-[#5E6E64]">
                <span>last: roll 63.2</span>
                <Link href="/dice" className="text-[#E8A93B] font-sans font-semibold text-sm hover:underline">Play Dice →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provably Fair 3-Step Explanation */}
      <section className="py-20" id="fair">
        <div className="max-w-[1120px] mx-auto px-6 space-y-10">
          <div>
            <div className="font-mono-code text-xs tracking-[0.14em] uppercase text-[#E8A93B] mb-2">
              PROVABLY FAIR
            </div>
            <h2 className="font-archivo text-3xl sm:text-4xl font-bold">Nothing to take on faith</h2>
            <p className="text-[#93A499] text-sm mt-2">Same three-step commit-reveal scheme behind every game on the platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[rgba(241,237,225,0.12)] border border-[rgba(241,237,225,0.12)] rounded-2xl overflow-hidden">
            <div className="bg-[#0F1B16] p-8 space-y-4">
              <div className="font-mono-code text-2xl text-[#E8A93B] border border-[rgba(241,237,225,0.22)] w-12 h-12 flex items-center justify-center rounded-lg">
                1
              </div>
              <h3 className="font-archivo text-lg font-bold">Seed is committed</h3>
              <p className="text-[#93A499] text-sm">Before you bet, we hash a server seed and show you the hash. It can't change after this point.</p>
            </div>

            <div className="bg-[#0F1B16] p-8 space-y-4">
              <div className="font-mono-code text-2xl text-[#E8A93B] border border-[rgba(241,237,225,0.22)] w-12 h-12 flex items-center justify-center rounded-lg">
                2
              </div>
              <h3 className="font-archivo text-lg font-bold">Round resolves</h3>
              <p className="text-[#93A499] text-sm">Your client seed plus the round nonce runs through the hash to produce the outcome — deterministic, not drawn live.</p>
            </div>

            <div className="bg-[#0F1B16] p-8 space-y-4">
              <div className="font-mono-code text-2xl text-[#E8A93B] border border-[rgba(241,237,225,0.22)] w-12 h-12 flex items-center justify-center rounded-lg">
                3
              </div>
              <h3 className="font-archivo text-lg font-bold">Seed is revealed</h3>
              <p className="text-[#93A499] text-sm">The original seed is published. Recompute it yourself and confirm the hash matches what we showed you upfront.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Rail Section */}
      <section className="py-20" id="pay">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="bg-[#152620] border border-[rgba(241,237,225,0.12)] rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <div className="font-mono-code text-xs tracking-[0.14em] uppercase text-[#E8A93B] mb-2">
                PAYMENTS
              </div>
              <h2 className="font-archivo text-3xl font-bold mb-3">Stake and get paid in USDC</h2>
              <p className="text-[#93A499] text-sm max-w-md">
                Deposits and payouts run over x402 — no accounts, no withdrawal queue. Your wallet is your balance.
              </p>
            </div>

            <div className="space-y-4 divide-y divide-[rgba(241,237,225,0.12)]">
              <div className="flex gap-4 pt-4 first:pt-0">
                <span className="font-mono-code text-[#E8A93B] text-sm font-bold">01</span>
                <div>
                  <div className="font-medium text-sm text-[#F1EDE1]">Sign the bet</div>
                  <div className="text-xs text-[#5E6E64]">Wallet signs a gasless USDC transfer for your stake</div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <span className="font-mono-code text-[#E8A93B] text-sm font-bold">02</span>
                <div>
                  <div className="font-medium text-sm text-[#F1EDE1]">Facilitator settles</div>
                  <div className="text-xs text-[#5E6E64]">Payment verified and confirmed onchain</div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <span className="font-mono-code text-[#E8A93B] text-sm font-bold">03</span>
                <div>
                  <div className="font-medium text-sm text-[#F1EDE1]">Payout is instant</div>
                  <div className="text-xs text-[#5E6E64]">Wins transfer back the moment the round resolves</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(241,237,225,0.12)] py-12">
        <div className="max-w-[1120px] mx-auto px-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-3 text-lg font-black font-archivo">
              <div className="w-6 h-6 border border-[#E8A93B] flex items-center justify-center font-mono-code text-xs text-[#E8A93B] transform rotate-45">
                <span className="transform -rotate-45">O</span>
              </div>
              <span>Originals</span>
            </div>

            <div className="flex gap-6 text-sm text-[#93A499]">
              <Link href="/verifier" className="hover:text-[#F1EDE1] transition">Verifier</Link>
              <a href="#fair" className="hover:text-[#F1EDE1] transition">Fairness docs</a>
              <a href="https://github.com/rajat-sharma-Dev/x402-Pay" target="_blank" rel="noreferrer" className="hover:text-[#F1EDE1] transition">GitHub</a>
            </div>
          </div>

          <p className="text-xs text-[#5E6E64] max-w-3xl leading-relaxed">
            Originals are software games settled in USDC over x402. Online real-money gaming is regulated and licensing requirements vary by jurisdiction — this product is not available where prohibited. Play within your means; if gambling stops being fun, stop.
          </p>
        </div>
      </footer>
    </div>
  );
}
