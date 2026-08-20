'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { type AuthUser } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  walletAddress: string | undefined;
  needsPinSetup: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  setupPin: (pin: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  createInstantWallet: (nickname?: string, customAddress?: string) => Promise<{ address: string; name: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      const activeUser: AuthUser = {
        id: address.toLowerCase(),
        name: `Player_${address.slice(0, 6)}`,
        walletAddress: address,
        hasPin: true,
      };
      setUser(activeUser);
      setIsAuthenticated(true);
    } else {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('x402_saved_wallet') : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser({
            id: parsed.address.toLowerCase(),
            name: parsed.name || `Player_${parsed.address.slice(0, 6)}`,
            walletAddress: parsed.address,
            hasPin: true,
          });
          setIsAuthenticated(true);
        } catch {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [isConnected, address]);

  const signIn = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    const activeUser: AuthUser = {
      id: address.toLowerCase(),
      name: `Player_${address.slice(0, 6)}`,
      walletAddress: address,
      hasPin: true,
    };
    setUser(activeUser);
    setIsAuthenticated(true);
  }, [address]);

  const createInstantWallet = useCallback(async (nickname?: string, customAddress?: string) => {
    const chars = '0123456789abcdef';
    let newAddress = customAddress;
    if (!newAddress) {
      newAddress = '0x';
      for (let i = 0; i < 40; i++) {
        newAddress += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    const walletName = nickname || `Player_${newAddress.slice(2, 8)}`;

    try {
      await fetch('http://localhost:3001/api/users/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: newAddress }),
      });
    } catch (e) {
      console.error('Auto faucet failed during instant wallet creation', e);
    }

    const activeUser: AuthUser = {
      id: newAddress.toLowerCase(),
      name: walletName,
      walletAddress: newAddress,
      hasPin: true,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('x402_saved_wallet', JSON.stringify({ address: newAddress, name: walletName }));
    }

    setUser(activeUser);
    setIsAuthenticated(true);
    return { address: newAddress, name: walletName };
  }, []);

  const signOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('x402_saved_wallet');
    }
    setUser(null);
    setIsAuthenticated(false);
    disconnect();
  }, [disconnect]);

  const setupPin = useCallback(async (_pin: string) => {
    // PIN setup optional in casino platform
  }, []);

  const refreshUser = useCallback(async () => {
    if (user?.walletAddress) {
      setUser({
        id: user.walletAddress.toLowerCase(),
        name: user.name,
        walletAddress: user.walletAddress,
        hasPin: true,
      });
    } else if (address) {
      setUser({
        id: address.toLowerCase(),
        name: `Player_${address.slice(0, 6)}`,
        walletAddress: address,
        hasPin: true,
      });
    }
  }, [address, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConnected,
        isAuthenticated,
        walletAddress: user?.walletAddress || address,
        needsPinSetup: false,
        signIn,
        signOut,
        setupPin,
        refreshUser,
        createInstantWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
