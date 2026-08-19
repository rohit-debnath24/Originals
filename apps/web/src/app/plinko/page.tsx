'use client';

import React from 'react';
import Link from 'next/link';
import { PlinkoGame, WalletButton } from '@/components/features';

export default function PlinkoPage() {
  return (
    <div className="min-h-screen bg-[#0F1B16] text-[#F1EDE1] flex flex-col font-sans selection:bg-[#E8A93B] selection:text-[#0F1B16]">
      <nav className="border-b border-[rgba(241,237,225,0.12)] py-4 bg-[#0F1B16]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black font-archivo">
            <div className="w-6 h-6 border-[1.5px] border-[#E8A93B] flex items-center justify-center font-mono-code text-xs text-[#E8A93B] transform rotate-45">
              <span className="transform -rotate-45">O</span>
            </div>
            <span>Originals</span>
          </Link>

          <Link href="/" className="text-xs text-[#93A499] hover:text-[#F1EDE1] transition">
            ← Lobby
          </Link>

          <WalletButton />
        </div>
      </nav>

      <main className="flex-1 py-8 px-4">
        <PlinkoGame />
      </main>
    </div>
  );
}
