import { AtomicGroupResponse, AtomicExecutionResult } from '@crypto-inr/shared';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

export const algorandClient = {
  /**
   * Prepares a 2-transaction Algorand Atomic Group for a bid
   */
  async prepareAtomicGroup(auctionId: string, walletAddress: string, bidAmountAlgo: number = 1.0): Promise<AtomicGroupResponse> {
    const res = await fetch(`${API_URL}/algorand/atomic/group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auctionId,
        walletAddress,
        bidAmountAlgo,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to prepare Algorand Atomic Group');
    }
    return data.data;
  },

  /**
   * Executes an atomic transaction group
   */
  async submitAtomicGroup(groupId: string): Promise<AtomicExecutionResult> {
    const res = await fetch(`${API_URL}/algorand/atomic/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Algorand Atomic execution failed');
    }
    return data.data;
  },
};
