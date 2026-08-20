'use client';

import React, { useState } from 'react';
import { algorandClient } from '@/lib/algorand';
import { AtomicGroupResponse, AtomicExecutionResult } from '@crypto-inr/shared';

interface Props {
  auctionId?: string;
  walletAddress?: string;
  onSuccess?: (result: AtomicExecutionResult) => void;
}

export function AlgorandAtomicBadge({ auctionId = 'dutch_royale_1', walletAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState<AtomicGroupResponse | null>(null);
  const [executionResult, setExecutionResult] = useState<AtomicExecutionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePrepare = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const group = await algorandClient.prepareAtomicGroup(auctionId, walletAddress, 5.0);
      setActiveGroup(group);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!activeGroup) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await algorandClient.submitAtomicGroup(activeGroup.groupId);
      setExecutionResult(result);
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#152620] border border-[#3ECF8E]/30 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 flex items-center justify-center font-mono-code text-xs font-bold text-[#3ECF8E]">
            ⚡
          </div>
          <div>
            <h4 className="font-archivo text-base font-bold text-[#F1EDE1]">
              Algorand Atomic Transfer Protocol
            </h4>
            <p className="text-xs text-[#93A499]">
              Indivisible Group Transactions · All-or-Nothing Execution
            </p>
          </div>
        </div>

        <span className="font-mono-code text-[11px] px-3 py-1 rounded-full uppercase bg-[#3ECF8E]/10 text-[#3ECF8E] font-semibold border border-[#3ECF8E]/30">
          Algorand Standard
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 rounded-xl text-xs text-[#FF5C5C]">
          ❌ {errorMsg}
        </div>
      )}

      {/* Execution Result */}
      {executionResult ? (
        <div className="bg-[#3ECF8E]/10 border border-[#3ECF8E]/40 rounded-xl p-4 space-y-2 animate-fade-in font-mono-code text-xs">
          <div className="flex justify-between items-center text-[#3ECF8E] font-bold">
            <span>✅ GROUP SETTLED (ALL-OR-NOTHING)</span>
            <span>Block #{executionResult.blockRound}</span>
          </div>
          <div className="text-[#93A499] break-all">
            Group ID: <span className="text-[#F1EDE1]">{executionResult.groupId}</span>
          </div>
          <div className="text-[#93A499]">
            Hashes: <span className="text-[#E8A93B]">{executionResult.txHashes.join(' · ')}</span>
          </div>
        </div>
      ) : activeGroup ? (
        /* Active Prepared Group Card */
        <div className="space-y-3 bg-[#0F1B16] p-4 rounded-xl border border-[rgba(241,237,225,0.12)]">
          <div className="flex justify-between items-center text-xs font-mono-code text-[#E8A93B]">
            <span>GROUP ID: {activeGroup.groupId}</span>
            <span>2 Tx Batch</span>
          </div>

          <div className="space-y-1.5 text-xs font-mono-code text-[#93A499]">
            {activeGroup.transactions.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#152620] px-3 py-1.5 rounded-lg border border-[rgba(241,237,225,0.08)]">
                <span>Tx #{idx + 1} ({tx.type.toUpperCase()})</span>
                <span className="text-[#F1EDE1]">{tx.amountMicroAlgos / 1_000_000} ALGO</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleExecute}
            disabled={loading}
            className="w-full py-2.5 bg-[#3ECF8E] hover:bg-[#32B57A] text-[#0F1B16] font-bold text-xs rounded-xl transition shadow"
          >
            {loading ? 'Executing Atomic Group...' : '⚡ Confirm & Execute Atomic Transfer'}
          </button>
        </div>
      ) : (
        /* Initial Action Button */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <p className="text-xs text-[#5E6E64] max-w-md">
            Prepare a SHA-512/256 domain-separated transaction group to execute bid and settlement atomically.
          </p>
          <button
            onClick={handlePrepare}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1C332A] hover:bg-[#254237] border border-[#3ECF8E]/40 text-[#3ECF8E] font-bold text-xs rounded-xl transition shrink-0"
          >
            {loading ? 'Preparing Group...' : '✨ Prepare Atomic Group'}
          </button>
        </div>
      )}
    </div>
  );
}
