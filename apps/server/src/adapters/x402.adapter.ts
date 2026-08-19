import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('X402Adapter');

export interface X402DepositRequest {
  senderAddress: string;
  amountUSDC: number;
}

export interface X402DepositResponse {
  success: boolean;
  txRef: string;
}

export interface IX402Adapter {
  recordPayment(txRef: string, request: X402DepositRequest): Promise<X402DepositResponse>;
  verifyPayment(txRef: string): Promise<boolean>;
}

export const x402Adapter: IX402Adapter = {
  async recordPayment(txRef: string, request: X402DepositRequest): Promise<X402DepositResponse> {
    logger.info(
      { 
        txRef,
        sender: request.senderAddress,
        amount: request.amountUSDC 
      },
      'Recording x402 payment deposit'
    );

    return {
      success: true,
      txRef,
    };
  },

  async verifyPayment(txRef: string): Promise<boolean> {
    logger.info({ txRef }, 'Verifying x402 payment');
    return !!txRef && (txRef.startsWith('0x') || txRef.startsWith('x402_'));
  },
};

export const createX402Adapter = (): IX402Adapter => {
  return x402Adapter;
};
