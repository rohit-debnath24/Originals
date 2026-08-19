import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import type { Network } from '@x402/core/types';
import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('X402Middleware');

const COMPANY_WALLET_ADDRESS = (process.env['COMPANY_WALLET_ADDRESS'] || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const X402_FACILITATOR_URL = process.env['X402_FACILITATOR_URL'] || 'https://x402.org/facilitator';
const X402_NETWORK = process.env['X402_NETWORK'] || 'base-sepolia';

const NETWORK_TO_CHAIN_ID: Record<string, Network> = {
  'base-sepolia': 'eip155:84532' as Network,
  'base': 'eip155:8453' as Network,
};

const chainId: Network = NETWORK_TO_CHAIN_ID[X402_NETWORK] || ('eip155:84532' as Network);

const facilitatorClient = new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient);

registerExactEvmScheme(resourceServer, { networks: [chainId] });

resourceServer
  .onBeforeVerify(async () => {
    logger.debug('x402: Before verify');
  })
  .onAfterSettle(async (ctx) => {
    logger.info({ 
      transaction: ctx.result?.transaction,
      payer: ctx.result?.payer,
    }, 'x402: Payment settled successfully');
  })
  .onSettleFailure(async (ctx) => {
    logger.error({ error: ctx.error }, 'x402: Settlement failed');
  });

export const preFetchQuoteMiddleware = async (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export const x402PaymentMiddleware = paymentMiddleware(
  {
    'POST /api/game/deposit': {
      accepts: {
        scheme: 'exact',
        price: '$10.00',
        network: chainId,
        payTo: COMPANY_WALLET_ADDRESS,
        maxTimeoutSeconds: 300,
      },
      description: 'USDC deposit to x402 Casino ledger',
    },
  },
  resourceServer,
);

export const x402Wrapper = (req: Request, res: Response, next: NextFunction) => {
  const paymentHeader = req.headers['x-payment'] as string | undefined;
  
  if (paymentHeader) {
    logger.info({ 
      path: req.path,
      method: req.method,
      hasPaymentHeader: true
    }, 'x402 payment verification in progress');
  }

  const originalEnd = res.end.bind(res);
  
  res.end = function(this: Response, ...args: Parameters<Response['end']>): Response {
    const paymentResponse = res.getHeader('payment-response') as string | undefined;
    if (paymentResponse) {
      try {
        const decoded = JSON.parse(Buffer.from(paymentResponse, 'base64').toString('utf-8'));
        (req as Request & { x402Payment?: unknown }).x402Payment = decoded;
        
        logger.info({ 
          path: req.path,
          transaction: decoded.transaction,
          payer: decoded.payer,
          network: decoded.network
        }, 'x402 payment settled successfully');
      } catch (parseError) {
        logger.warn({ parseError }, 'Failed to parse x402 payment response');
      }
    }
    
    return originalEnd.apply(this, args);
  } as Response['end'];

  x402PaymentMiddleware(req, res, next);
};

export interface X402PaymentInfo {
  success: boolean;
  transaction: string;
  network: string;
  payer: string;
  requirements: {
    scheme: string;
    network: string;
    amount: string;
    asset: string;
    payTo: string;
    maxTimeoutSeconds: number;
  };
}

export interface X402Request extends Request {
  x402Payment?: X402PaymentInfo;
}
