'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { useConnect } from 'wagmi';

export function CreateWalletModal() {
  const { isConnected, isAuthenticated, createInstantWallet } = useAuth();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  
  const [isOpen, setIsOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [previewWallet, setPreviewWallet] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<string | null>(null);

  // Generate a random preview wallet address on mount
  useEffect(() => {
    generateRandomAddress();
  }, []);

  const generateRandomAddress = () => {
    const chars = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += chars[Math.floor(Math.random() * chars.length)];
    }
    setPreviewWallet(addr);
  };

  // Auto-open modal on page load if user has no wallet connected/saved
  useEffect(() => {
    const timer = setTimeout(() => {
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('x402_wallet_modal_dismissed') : null;
      if (!isConnected && !isAuthenticated && !dismissed) {
        setIsOpen(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [isConnected, isAuthenticated]);

  if (!isOpen || isConnected || isAuthenticated) {
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const walletName = nickname.trim() || `Player_${previewWallet.slice(2, 8)}`;
      const result = await createInstantWallet(walletName, previewWallet);
      setCreatedSuccess(`🎉 Wallet ${result.address.slice(0, 6)}... created with $100.00 USDC balance!`);
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error('Wallet creation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('x402_wallet_modal_dismissed', 'true');
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1410]/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#152620] border-2 border-[#E8A93B]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(232,169,59,0.15)] overflow-hidden">
        
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#E8A93B]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#3ECF8E]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C332A] border border-[rgba(241,237,225,0.12)] text-[#93A499] hover:text-[#F1EDE1] flex items-center justify-center transition"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8A93B]/10 border border-[#E8A93B]/30 text-[#E8A93B] font-mono-code text-xs font-bold uppercase tracking-wider mb-3">
            <span>✨</span> Instant Account Setup
          </div>
          <h2 className="font-archivo text-2xl sm:text-3xl font-black text-[#F1EDE1] tracking-tight">
            Create Your x402 Wallet
          </h2>
          <p className="text-[#93A499] text-xs sm:text-sm mt-2 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
            No seed phrase required. Create a gasless x402 wallet instantly and claim <strong className="text-[#E8A93B]">$100.00 USDC</strong> testnet balance.
          </p>
        </div>

        {/* Success Alert */}
        {createdSuccess ? (
          <div className="bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 rounded-2xl p-6 text-center space-y-2 animate-bounce-short">
            <div className="text-3xl">🎉</div>
            <div className="font-bold text-[#3ECF8E] text-base">{createdSuccess}</div>
            <p className="text-xs text-[#93A499]">Redirecting you to the games...</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Nickname Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-code uppercase tracking-wider text-[#93A499]">
                Player Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. HighRoller99"
                className="w-full px-4 py-3 bg-[#0F1B16] border border-[rgba(241,237,225,0.18)] focus:border-[#E8A93B] rounded-xl text-[#F1EDE1] text-sm outline-none transition placeholder:text-[#5E6E64]"
              />
            </div>

            {/* Generated Address Preview */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono-code uppercase tracking-wider text-[#93A499]">
                <span>Generated Wallet Address</span>
                <button
                  type="button"
                  onClick={generateRandomAddress}
                  className="text-[#E8A93B] hover:underline flex items-center gap-1 font-normal lowercase"
                >
                  🎲 reroll
                </button>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0F1B16]/80 border border-[rgba(241,237,225,0.12)] rounded-xl font-mono-code text-xs text-[#E8A93B] break-all">
                <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse shrink-0" />
                <span className="truncate">{previewWallet}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#E8A93B] to-[#D4952A] hover:from-[#F0B44D] hover:to-[#E8A93B] text-[#0F1B16] font-extrabold text-sm sm:text-base shadow-lg transition transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#0F1B16]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating & Funding Wallet...</span>
                </>
              ) : (
                <>
                  <span>🚀 Create Wallet & Claim $100 USDC</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(241,237,225,0.12)]" />
              </div>
              <span className="relative px-3 bg-[#152620] text-[11px] font-mono-code text-[#5E6E64] uppercase">
                or connect browser wallet
              </span>
            </div>

            {/* Web3 Connectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  type="button"
                  onClick={() => {
                    connect({ connector });
                    handleClose();
                  }}
                  disabled={isConnectPending}
                  className="py-2.5 px-4 bg-[#1C332A] hover:bg-[#254237] border border-[rgba(241,237,225,0.12)] rounded-xl text-xs font-semibold text-[#F1EDE1] transition flex items-center justify-center gap-2"
                >
                  <span>🦊</span> {connector.name}
                </button>
              ))}
            </div>

            {/* Skip Option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-[#5E6E64] hover:text-[#93A499] transition underline"
              >
                Skip for now & explore as guest
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
