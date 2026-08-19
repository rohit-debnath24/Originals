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
      setUser(null);
      setIsAuthenticated(false);
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

  const signOut = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    disconnect();
  }, [disconnect]);

  const setupPin = useCallback(async (_pin: string) => {
    // PIN setup optional in casino platform
  }, []);

  const refreshUser = useCallback(async () => {
    if (address) {
      setUser({
        id: address.toLowerCase(),
        name: `Player_${address.slice(0, 6)}`,
        walletAddress: address,
        hasPin: true,
      });
    }
  }, [address]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConnected,
        isAuthenticated,
        walletAddress: address,
        needsPinSetup: false,
        signIn,
        signOut,
        setupPin,
        refreshUser,
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
