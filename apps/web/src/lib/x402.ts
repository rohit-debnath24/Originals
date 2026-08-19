'use client';

import { x402Client, wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme, toClientEvmSigner } from '@x402/evm';
import type { WalletClient, Hex } from 'viem';

/**
 * x402 Client for Payment Handling with Browser Wallet Signing (v2.0.0)
 * 
 * This module implements x402 protocol using the user's connected wallet (MetaMask, etc.)
 * for signing payment authorizations.
 * 
 * ## How x402 Works:
 * 
 * 1. Frontend makes request to protected endpoint
 * 2. Backend returns 402 Payment Required with payment requirements
 * 3. x402 client reads requirements and prompts user to sign (EIP-712)
 * 4. User signs the payment authorization with their wallet
 * 5. x402 client sends signed payload to facilitator
 * 6. Facilitator executes the USDC transfer on-chain
 * 7. x402 client retries original request with payment proof
 * 8. Backend verifies and processes the request
 * 
 * ## Key Point:
 * The user signs an EIP-712 typed message (not a raw transaction).
 * The facilitator handles the actual on-chain USDC transfer.
 */

// Store the configured x402 client and fetch
let configuredClient: x402Client | null = null;
let configuredFetch: ((url: string, options?: RequestInit) => Promise<Response>) | null = null;

/**
 * Convert a wagmi WalletClient to an x402 ClientEvmSigner
 * 
 * x402 v2 expects a specific signer interface that can sign EIP-712 typed data.
 */
function createEvmSignerFromWalletClient(walletClient: WalletClient) {
  if (!walletClient.account) {
    throw new Error('Wallet client has no account');
  }
  
  const address = walletClient.account.address;
  
  // Create a signer compatible with x402's ClientEvmSigner interface
  return toClientEvmSigner({
    address,
    signTypedData: async (params: {
      domain: {
        name?: string;
        version?: string;
        chainId?: number;
        verifyingContract?: Hex;
        salt?: Hex;
      };
      types: Record<string, Array<{ name: string; type: string }>>;
      primaryType: string;
      message: Record<string, unknown>;
    }) => {
      console.log('[x402] Signing EIP-712 message:', {
        domain: params.domain,
        primaryType: params.primaryType,
        messageKeys: Object.keys(params.message),
      });
      
      // Use wagmi's signTypedData which prompts the user
      const signature = await walletClient.signTypedData({
        account: walletClient.account!,
        domain: params.domain,
        types: params.types,
        primaryType: params.primaryType,
        message: params.message,
      });
      
      console.log('[x402] Signature obtained:', signature.slice(0, 20) + '...');
      return signature;
    },
  });
}

/**
 * Create and configure the x402 client with a wallet signer
 * 
 * @param walletClient - Viem WalletClient from wagmi for signing
 * @returns Configured x402 client
 */
export function createX402Client(walletClient: WalletClient): x402Client {
  const client = new x402Client();
  
  // Create an x402-compatible EVM signer from the wallet client
  const evmSigner = createEvmSignerFromWalletClient(walletClient);
  
  // Create the ExactEvmScheme with the signer
  const evmScheme = new ExactEvmScheme(evmSigner);
  
  // Register the scheme for Base Sepolia (testnet) and Base (mainnet)
  client.register('eip155:84532', evmScheme); // Base Sepolia
  client.register('eip155:8453', evmScheme);  // Base Mainnet
  
  configuredClient = client;
  return client;
}

/**
 * Create x402-enabled fetch using a wallet client for signing
 * 
 * @param walletClient - Viem WalletClient from wagmi
 * @returns Fetch function that automatically handles 402 Payment Required
 */
export function createX402Fetch(walletClient: WalletClient): (url: string, options?: RequestInit) => Promise<Response> {
  console.log('[x402] Creating x402 fetch with wallet:', walletClient.account?.address);
  const client = createX402Client(walletClient);
  const wrappedFetch = wrapFetchWithPayment(fetch, client);
  configuredFetch = wrappedFetch as (url: string, options?: RequestInit) => Promise<Response>;
  return configuredFetch;
}

/**
 * Get the current x402 client (if configured)
 */
export function getX402Client(): x402Client | null {
  return configuredClient;
}

/**
 * Get the current x402-wrapped fetch (if configured)
 */
export function getX402Fetch(): ((url: string, options?: RequestInit) => Promise<Response>) | null {
  return configuredFetch;
}

/**
 * x402-aware fetch wrapper for API requests
 * 
 * @param url - Full URL to fetch
 * @param options - Standard fetch options
 * @param walletClient - Viem WalletClient for signing (optional if already configured)
 * @returns Response after handling any payment requirements
 */
export async function x402Fetch(
  url: string,
  options: RequestInit = {},
  walletClient?: WalletClient
): Promise<Response> {
  console.log('[x402] x402Fetch called:', { url, hasWalletClient: !!walletClient });
  
  // Use provided wallet client or fall back to configured fetch
  if (walletClient) {
    const fetchWithPayment = createX402Fetch(walletClient);
    try {
      const response = await fetchWithPayment(url, options);
      console.log('[x402] Response status:', response.status);
      console.log('[x402] Response headers:', {
        'payment-response': response.headers.get('payment-response')?.slice(0, 50),
        'payment-required': response.headers.get('payment-required')?.slice(0, 50),
      });
      
      // If still 402 after payment attempt, check for specific errors
      if (response.status === 402) {
        const paymentRequired = response.headers.get('payment-required');
        if (paymentRequired) {
          try {
            const decoded = JSON.parse(atob(paymentRequired));
            const errorMsg = decoded.error?.toLowerCase() || '';
            
            // Check for common payment errors
            if (errorMsg.includes('insufficient') || errorMsg.includes('balance')) {
              throw new Error(
                'Insufficient USDC balance. Please get Base Sepolia testnet USDC from: https://faucet.circle.com/'
              );
            }
            if (errorMsg.includes('allowance')) {
              throw new Error(
                'USDC approval required. Please approve USDC spending first.'
              );
            }
            // Generic payment error
            throw new Error(`Payment failed: ${decoded.error || 'Unknown error'}`);
          } catch (parseError) {
            if (parseError instanceof Error && parseError.message.includes('USDC')) {
              throw parseError;
            }
            console.error('[x402] Failed to parse 402 error:', parseError);
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('[x402] Fetch error:', error);
      throw error;
    }
  }
  
  // Use pre-configured x402 fetch if available
  if (configuredFetch) {
    return configuredFetch(url, options);
  }
  
  // Fallback to normal fetch (will get 402 if endpoint is protected)
  return fetch(url, options);
}

/**
 * Parse the payment response from a successful x402 request
 * 
 * @param response - Fetch Response object
 * @returns Decoded payment settlement response or null
 */
export function getPaymentSettleResponse(response: Response): X402PaymentResponse | null {
  try {
    const paymentResponseHeader = response.headers.get('payment-response');
    if (!paymentResponseHeader) return null;
    
    const decoded = decodePaymentResponseHeader(paymentResponseHeader);
    return decoded as X402PaymentResponse;
  } catch {
    return null;
  }
}

/**
 * x402 Payment Response type
 * Based on the response format from x402 documentation
 */
export interface X402PaymentResponse {
  success: boolean;
  transaction: string;   // On-chain transaction hash
  network: string;       // e.g., "eip155:84532" (Base Sepolia)
  payer: string;         // Payer's wallet address
  requirements: {
    scheme: string;
    network: string;
    amount: string;      // Amount in atomic units
    asset: string;       // Token contract address (USDC)
    payTo: string;       // Recipient address
    maxTimeoutSeconds: number;
    extra?: {
      name?: string;
      version?: string;
      resourceUrl?: string;
    };
  };
}

/**
 * x402 Payment Requirements (from 402 response)
 * This is what the server sends when payment is required
 */
export interface X402PaymentRequirements {
  x402Version: number;
  error: string;
  resource: {
    url: string;
    description?: string;
    mimeType?: string;
  };
  accepts: Array<{
    scheme: string;        // e.g., "exact"
    network: string;       // e.g., "eip155:84532" (Base Sepolia)
    amount: string;        // Amount in atomic units (e.g., "1000" = 0.001 USDC)
    asset: string;         // Token contract address
    payTo: string;         // Recipient address
    maxTimeoutSeconds: number;
    extra?: {
      name?: string;       // e.g., "USDC"
      version?: string;
      resourceUrl?: string;
    };
  }>;
}

/**
 * Parse a 402 Payment Required response to get payment requirements
 * 
 * @param response - The 402 Response object
 * @returns Payment requirements or null if not a valid 402 response
 */
export async function parsePaymentRequired(response: Response): Promise<X402PaymentRequirements | null> {
  if (response.status !== 402) return null;
  
  const paymentHeader = response.headers.get('x-payment-required') || 
                        response.headers.get('payment-required');
  
  if (!paymentHeader) return null;
  
  try {
    const decoded = JSON.parse(atob(paymentHeader));
    return decoded as X402PaymentRequirements;
  } catch {
    console.error('Failed to decode x402 payment requirements');
    return null;
  }
}
