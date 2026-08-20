'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useAuth } from '@/components/providers';

export function WalletButton() {
  const { user, isAuthenticated, walletAddress, signOut, createInstantWallet } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const currentAddress = user?.walletAddress || walletAddress || address;

  if (isAuthenticated && currentAddress) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-3.5 py-1.5 bg-[#152620] border border-[rgba(241,237,225,0.18)] rounded-xl flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3ECF8E] animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-[#F1EDE1] leading-none">
              {user?.name || 'Player'}
            </span>
            <span className="font-mono-code text-[11px] text-[#E8A93B]">
              {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            signOut();
            disconnect();
          }}
          className="px-3 py-1.5 border border-[rgba(241,237,225,0.12)] hover:border-[#FF5C5C]/50 text-xs font-medium text-[#93A499] hover:text-[#FF5C5C] rounded-xl transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('x402_wallet_modal_dismissed');
            window.dispatchEvent(new Event('storage'));
          }
          createInstantWallet();
        }}
        className="bg-gradient-to-r from-[#E8A93B] to-[#D4952A] hover:from-[#F0B44D] hover:to-[#E8A93B] text-[#0F1B16] font-bold text-xs px-4 py-2 rounded-xl transition shadow"
      >
        ✨ Create Wallet
      </button>

      {connectors.slice(0, 1).map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="border border-[rgba(241,237,225,0.22)] hover:border-[#F1EDE1] text-xs font-medium text-[#F1EDE1] px-3 py-2 rounded-xl transition"
        >
          {isPending ? 'Connecting...' : 'Connect Web3'}
        </button>
      ))}
    </div>
  );
}
