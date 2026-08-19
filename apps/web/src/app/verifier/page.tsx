'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function VerifierPage() {
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('0');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverSeed || !clientSeed) {
      alert('Please fill in both Server Seed and Client Seed.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/game/provably-fair/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverSeed,
          clientSeed,
          nonce: Number(nonce)
        })
      });

      const data = await res.json();
      if (data.success) {
        setVerificationResult(data.data);
      } else {
        alert(data.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error', err);
      alert('Failed to connect to verification server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-lg flex items-center justify-center font-bold text-white">
              🎲
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              x402 Casino • Verifier
            </span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition">
            ← Back to Game
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 my-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white">Public Provably Fair Audit Engine</h1>
          <p className="text-slate-400 text-sm">
            Independently audit any past game outcome using cryptographic HMAC-SHA256 outcome verification.
          </p>
        </div>

        {/* Verification Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-indigo-300 uppercase mb-2">
                Unrevealed / Revealed Server Seed (Hex String)
              </label>
              <input
                type="text"
                value={serverSeed}
                onChange={(e) => setServerSeed(e.target.value)}
                placeholder="e.g. 5d9f30b9a8c1e2f4..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-indigo-300 uppercase mb-2">
                  Client Seed
                </label>
                <input
                  type="text"
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  placeholder="e.g. player_seed_123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-300 uppercase mb-2">
                  Nonce (Bet Sequence Number)
                </label>
                <input
                  type="number"
                  min="0"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
            >
              {loading ? 'Verifying...' : 'VERIFY PROVABLY FAIR ROLL 🔍'}
            </button>
          </form>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div className="p-6 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="text-lg font-bold text-emerald-400">Outcome Cryptographically Verified!</h3>
                  <p className="text-xs text-slate-400">HMAC-SHA256 calculation matches server parameters exactly.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs pt-2">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block mb-1">Server Seed Hash (SHA256):</span>
                  <span className="text-indigo-300 break-all">{verificationResult.serverSeedHash}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block mb-1">HMAC Hash:</span>
                  <span className="text-indigo-300 break-all">{verificationResult.computedHash}</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400 uppercase tracking-widest block mb-1">Computed Roll Result</span>
                <span className="text-4xl font-black font-mono text-emerald-400">
                  {verificationResult.computedOutcome.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Informational Explanation Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 text-sm text-slate-400">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <span>🛡️</span> How Provably Fair Works
          </h3>
          <p>
            Before any bet is placed, the server generates a secret <strong>Server Seed</strong> and provides you with its <strong>SHA256 Hash</strong>. Because you know the hash in advance, the server cannot alter the outcome after seeing your bet.
          </p>
          <p>
            The game outcome is computed as:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300">
            HMAC-SHA256(ServerSeed, `${'{'}ClientSeed{'}'}:${'{'}Nonce{'}'}`)
          </div>
          <p>
            When the server seed is rotated, it is revealed to you, allowing you to run this verifier and prove that every roll was 100% fair.
          </p>
        </div>
      </main>
    </div>
  );
}
