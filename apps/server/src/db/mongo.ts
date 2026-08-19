import mongoose, { Schema, Document } from 'mongoose';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('MongoDB');

// 1. User Model
export interface IUser extends Document {
  id: string;
  walletAddress: string;
  balanceUsdc: number;
  nonce?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true },
    walletAddress: { type: String, required: true, unique: true, index: true },
    balanceUsdc: { type: Number, default: 100.0 },
    nonce: { type: String },
  },
  { timestamps: true }
);

export const MongoUserModel = mongoose.model<IUser>('User', UserSchema);

// 2. Auction Model
export interface IAuction extends Document {
  id: string;
  type: 'DUTCH' | 'PENNY' | 'SEALED_HIGHEST' | 'REVERSE_LOWEST';
  status: 'PENDING' | 'ACTIVE' | 'LOCKED' | 'SETTLED' | 'CANCELLED';
  title: string;
  startPrice?: number;
  floorPrice?: number;
  tickMs?: number;
  tickAmount?: number;
  currentPrice?: number;
  currentLeaderWallet?: string;
  potUsdc: number;
  bidCount: number;
  startTime: number;
  timerEndTs?: number;
  winnerWallet?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema = new Schema<IAuction>(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ['DUTCH', 'PENNY', 'SEALED_HIGHEST', 'REVERSE_LOWEST'], required: true },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'LOCKED', 'SETTLED', 'CANCELLED'], default: 'ACTIVE' },
    title: { type: String, default: 'x402 Arena Auction' },
    startPrice: { type: Number },
    floorPrice: { type: Number },
    tickMs: { type: Number },
    tickAmount: { type: Number },
    currentPrice: { type: Number },
    currentLeaderWallet: { type: String },
    potUsdc: { type: Number, default: 0.0 },
    bidCount: { type: Number, default: 0 },
    startTime: { type: Number },
    timerEndTs: { type: Number },
    winnerWallet: { type: String },
  },
  { timestamps: true }
);

export const MongoAuctionModel = mongoose.model<IAuction>('Auction', AuctionSchema);

// 3. Auction Bid Model
export interface IAuctionBid extends Document {
  id: string;
  auctionId: string;
  walletAddress: string;
  bidPrice: number;
  status: string;
  idempotencyKey?: string;
  timestamp: number;
}

const AuctionBidSchema = new Schema<IAuctionBid>({
  id: { type: String, required: true, unique: true },
  auctionId: { type: String, required: true, index: true },
  walletAddress: { type: String, required: true },
  bidPrice: { type: Number, required: true },
  status: { type: String, required: true },
  idempotencyKey: { type: String, index: true },
  timestamp: { type: Number, default: Date.now },
});

export const MongoAuctionBidModel = mongoose.model<IAuctionBid>('AuctionBid', AuctionBidSchema);

// 4. Auction Commitment Model
export interface IAuctionCommitment extends Document {
  id: string;
  auctionId: string;
  walletAddress: string;
  commitmentHash: string;
  entryFeePaid: number;
  revealedBid?: number;
  revealedSalt?: string;
  revealedAt?: number;
  status: string;
  createdAt: Date;
}

const AuctionCommitmentSchema = new Schema<IAuctionCommitment>(
  {
    id: { type: String, required: true, unique: true },
    auctionId: { type: String, required: true, index: true },
    walletAddress: { type: String, required: true },
    commitmentHash: { type: String, required: true },
    entryFeePaid: { type: Number, default: 0.0 },
    revealedBid: { type: Number },
    revealedSalt: { type: String },
    revealedAt: { type: Number },
    status: { type: String, default: 'COMMITTED' },
  },
  { timestamps: true }
);

export const MongoAuctionCommitmentModel = mongoose.model<IAuctionCommitment>('AuctionCommitment', AuctionCommitmentSchema);

// 5. Audit Log Model
export interface IAuditLog extends Document {
  id: string;
  auctionId: string;
  eventType: string;
  payload: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  id: { type: String, required: true, unique: true },
  auctionId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  payload: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const MongoAuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// Database Connection Manager
export async function connectMongoDB(uri?: string): Promise<boolean> {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.info('No MONGODB_URI provided. Skipping MongoDB connection (using SQLite).');
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info({ uri: mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') }, '🍃 Successfully connected to MongoDB Database!');
    return true;
  } catch (err: any) {
    logger.error({ error: err.message }, '❌ Failed to connect to MongoDB');
    return false;
  }
}
