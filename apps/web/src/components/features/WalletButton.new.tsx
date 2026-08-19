'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { useState, useEffect } from 'react';

export function WalletButton() {
  const { isAuthenticated, isLoading: authLoading, signIn, signOut } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [signingIn, setSigningIn] = useState(false);

  // Auto sign-in when connected but not authenticated
  useEffect(() => {
    if (isConnected && !isAuthenticated && !authLoading && !signingIn) {
      setSigningIn(true);
      signIn()
        .catch((error) => {
          console.error('Auto sign-in failed:', error);
        })
        .finally(() => {
          setSigningIn(false);
        });
    }
  }, [isConnected, isAuthenticated, authLoading, signingIn, signIn]);

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <Button
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Connecting...' : `Connect ${connector.name}`}
          </Button>
        ))}
      </div>
    );
  }

  // Connected but not authenticated - show sign in button
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-3">
        <div className="px-4 py-2 bg-gray-800 rounded-lg text-center">
          <p className="text-xs text-gray-400">Connected</p>
          <p className="font-mono text-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <Button
          onClick={async () => {
            setSigningIn(true);
            try {
              await signIn();
            } catch (error) {
              console.error('Sign in failed:', error);
            } finally {
              setSigningIn(false);
            }
          }}
          disabled={authLoading || signingIn}
          className="w-full"
        >
          {signingIn ? 'Signing in...' : 'Sign In with Wallet'}
        </Button>
        <button
          onClick={() => disconnect()}
          className="text-sm text-gray-400 hover:text-white"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Connected and authenticated - show account menu
  return (
    <div className="flex flex-col gap-3">
      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
        <p className="text-xs text-emerald-400">Authenticated</p>
        <p className="font-mono text-sm">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>
      <Button
        onClick={async () => {
          await signOut();
          disconnect();
        }}
        variant="outline"
        className="w-full"
      >
        Sign Out & Disconnect
      </Button>
    </div>
  );
}
