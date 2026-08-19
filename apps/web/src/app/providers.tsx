'use client';

import { Web3Provider, AuthProvider } from '@/components/providers';
import { PinSetupModal } from '@/components/features';
import { useAuth } from '@/components/providers';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { needsPinSetup } = useAuth();
  
  return (
    <>
      {children}
      <PinSetupModal isOpen={needsPinSetup} />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <AuthProvider>
        <AuthWrapper>{children}</AuthWrapper>
      </AuthProvider>
    </Web3Provider>
  );
}
