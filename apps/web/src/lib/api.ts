const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!data.success || !response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data.data as T;
}

export interface AuthUser {
  id: string;
  name: string;
  walletAddress: string;
  hasPin: boolean;
}

export const authApi = {
  getNonce: async () => ({ nonce: 'demo-nonce' }),
  verify: async (_message: string, _signature: string) => ({
    token: 'demo-token',
    user: { id: 'demo-user-1', name: 'Demo Player', walletAddress: '0x71C...8976F', hasPin: false }
  }),
  getMe: async () => ({ id: 'demo-user-1', name: 'Demo Player', walletAddress: '0x71C...8976F', hasPin: false }),
  logout: async () => ({ message: 'Logged out' })
};

export const userApi = {
  setPin: async (_id: string, _pin: string) => ({ message: 'PIN set' }),
};

export const paymentApi = {
  getBySender: async (_id: string) => [],
  getByReceiver: async (_id: string) => [],
};

export const gameApi = {
  rollDice: (input: {
    userId: string;
    betAmount: number;
    targetNumber: number;
    condition: 'OVER' | 'UNDER';
    clientSeed?: string;
  }) =>
    request<any>('/game/dice/roll', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getActiveSeed: (userId: string) =>
    request<any>(`/game/provably-fair/active-seed/${userId}`),

  rotateSeed: (userId: string, clientSeed?: string) =>
    request<any>('/game/provably-fair/rotate-seed', {
      method: 'POST',
      body: JSON.stringify({ userId, clientSeed }),
    }),

  verifyRoll: (input: { serverSeed: string; clientSeed: string; nonce: number }) =>
    request<any>('/game/provably-fair/verify', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getRecentBets: () => request<any[]>('/game/recent-bets'),
};
