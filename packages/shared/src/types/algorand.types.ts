export interface AlgorandTx {
  txId: string;
  sender: string;
  receiver: string;
  amountMicroAlgos: number;
  feeMicroAlgos: number;
  note?: string;
  type: 'pay' | 'axfer' | 'appl';
  groupId?: string;
  signature?: string;
}

export interface AtomicGroupRequest {
  auctionId: string;
  walletAddress: string;
  bidAmountAlgo: number;
  feeAmountAlgo?: number;
  idempotencyKey?: string;
}

export interface AtomicGroupResponse {
  groupId: string;
  transactions: AlgorandTx[];
  status: 'PENDING_SIGNATURES' | 'READY_FOR_SUBMISSION' | 'EXECUTED' | 'FAILED';
  serverGenesisHash: string;
  expiresAtMs: number;
  timestamp: number;
}

export interface AtomicExecutionResult {
  groupId: string;
  txHashes: string[];
  blockRound: number;
  confirmedTime: number;
  status: 'ALL_OR_NOTHING_SETTLED' | 'REVERTED';
  winnerWallet?: string;
  prizeAlgo?: number;
}
