import * as wsModule from 'ws';
import type { Server } from 'http';
import { GameService } from '../services/game.service.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('WSGateway');
const WSServer: any = (wsModule as any).WebSocketServer || (wsModule as any).default?.WebSocketServer || (wsModule as any).default;

export class WebSocketGateway {
  private wss: any;
  private clients: Set<any> = new Set();

  constructor(server: Server) {
    this.wss = new WSServer({ server, path: '/ws' });
    this.setupListeners();
    logger.info('WebSocket Gateway initialized on /ws');
  }

  private setupListeners() {
    this.wss.on('connection', (wsClient: any) => {
      this.clients.add(wsClient);
      logger.info({ clientCount: this.clients.size }, 'New WebSocket client connected');

      wsClient.on('message', (data: any) => {
        try {
          const payload = JSON.parse(data.toString());
          this.handleMessage(wsClient, payload);
        } catch (err: any) {
          wsClient.send(JSON.stringify({ type: 'ERROR', error: 'Invalid JSON payload' }));
        }
      });

      wsClient.on('close', () => {
        this.clients.delete(wsClient);
        logger.info({ clientCount: this.clients.size }, 'WebSocket client disconnected');
      });

      wsClient.on('error', (error: any) => {
        logger.error({ error }, 'WebSocket client error');
      });

      wsClient.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to x402 Casino WS Gateway' }));
    });
  }

  private handleMessage(wsClient: any, payload: any) {
    switch (payload.type) {
      case 'PING':
        wsClient.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        break;

      case 'BET_DICE':
        try {
          const { userId, betAmount, targetNumber, condition, clientSeed } = payload.data || {};
          if (!userId || !betAmount || targetNumber === undefined || !condition) {
            wsClient.send(JSON.stringify({ type: 'ERROR', error: 'Missing required bet parameters' }));
            return;
          }

          const result = GameService.playDice({
            userId,
            betAmount: Number(betAmount),
            targetNumber: Number(targetNumber),
            condition,
            clientSeed
          });

          wsClient.send(JSON.stringify({ type: 'DICE_RESULT', data: result }));

          this.broadcast({
            type: 'PUBLIC_BET_BROADCAST',
            data: {
              id: result.id,
              userId: result.userId,
              gameType: result.gameType,
              betAmount: result.betAmount,
              rollResult: result.rollResult,
              multiplier: result.multiplier,
              payout: result.payout,
              status: result.status,
              createdAt: result.createdAt
            }
          });
        } catch (error: any) {
          wsClient.send(JSON.stringify({ type: 'BET_ERROR', error: error.message || 'Bet processing failed' }));
        }
        break;

      default:
        wsClient.send(JSON.stringify({ type: 'ERROR', error: `Unknown message type: ${payload.type}` }));
    }
  }

  public broadcast(message: any) {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    }
  }
}
