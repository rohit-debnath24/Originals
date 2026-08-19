'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HistoryPage() {
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/game/recent-bets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBets(data.data);
        }
      })
      .catch((e) => console.error('Failed to load bet history', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
            ← Back to Game
          </Link>
          <span className="font-bold">Player Bet History</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 my-8">
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-mono">Loading bet history...</div>
        ) : bets.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <p className="text-slate-400">No bets recorded yet.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-black text-white">Recent Rolls Audit Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3">Bet ID</th>
                    <th className="p-3">Stake</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Result</th>
                    <th className="p-3">Payout</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {bets.map((b) => (
                    <tr key={b.id}>
                      <td className="p-3 text-indigo-300 truncate max-w-[100px]">{b.id}</td>
                      <td className="p-3 text-white font-bold">{b.bet_amount} USDC</td>
                      <td className="p-3 text-slate-400">{b.condition} {b.target_number}</td>
                      <td className="p-3 text-indigo-400 font-bold">{b.roll_result?.toFixed(2)}</td>
                      <td className="p-3 font-bold text-emerald-400">+{b.payout.toFixed(2)} USDC</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          b.status === 'WON' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
