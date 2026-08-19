import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger.js';
import { errorHandler, requestLogger } from './middleware/index.js';
import { authRoutes, userRoutes, gameRoutes } from './routes/index.js';
import { initializeDatabase } from './db/index.js';
import { WebSocketGateway } from './gateway/ws.gateway.js';
import { userRepository } from './repositories/user.repository.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env['PORT'] || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const allowedOrigins = [
  process.env['FRONTEND_URL'] || 'http://localhost:3000',
  /\.onrender\.com$/,
  /\.vercel\.app$/,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return origin === allowed;
      return allowed.test(origin);
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: [
    'PAYMENT-REQUIRED',
    'PAYMENT-RESPONSE', 
    'X-PAYMENT-RESPONSE',
    'X-PAYMENT-REQUIRED'
  ],
}));

app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'x402-casino-server', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Attach WebSocket Gateway
new WebSocketGateway(server);

// Start server
const start = async () => {
  try {
    // Initialize database
    initializeDatabase();

    // Seed default demo user
    userRepository.getOrCreateByWallet('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');

    server.listen(PORT, () => {
      logger.info({ port: PORT }, '🚀 x402 Casino Server & WS Gateway started');
      logger.info(`   Health: http://localhost:${PORT}/health`);
      logger.info(`   API:    http://localhost:${PORT}/api/game/recent-bets`);
      logger.info(`   WS:     ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

start();
