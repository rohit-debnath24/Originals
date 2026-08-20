import { AlgorandTx, AtomicGroupResponse, AtomicExecutionResult } from '@crypto-inr/shared';
import { AlgorandAtomicTransferEngine } from '../engine/algorand/atomic-transfer.engine.js';
import { userRepository } from '../repositories/user.repository.js';
import { LedgerService } from './ledger.service.js';
import { createChildLogger } from '../utils/logger.js';
import { generateId } from '../utils/helpers.js';

const logger = createChildLogger('AlgorandService');

const ESCROW_ALGORAND_ADDRESS = 'ALGO_ESCROW_402_ORIGINALS_HOUSE_VAULT_777';

// In-memory store for active Algorand Atomic Group executions
const atomicGroupStore = new Map<string, { response: AtomicGroupResponse; executed: boolean }>();

export class AlgorandService {
  /**
   * Prepares a 2-transaction Algorand Atomic Group for a bid
   */
  public static prepareBidAtomicGroup(
    auctionId: string,
    walletAddress: string,
    bidAmountAlgo: number,
    feeAmountAlgo: number = 0.001
  ): AtomicGroupResponse {
    const amountMicroAlgos = Math.round(bidAmountAlgo * 1_000_000);
    const feeMicroAlgos = Math.round(feeAmountAlgo * 1_000_000);

    const now = Date.now();
    const tx1: AlgorandTx = {
      txId: `tx_algo_bid_${generateId()}`,
      sender: walletAddress,
      receiver: ESCROW_ALGORAND_ADDRESS,
      amountMicroAlgos,
      feeMicroAlgos,
      type: 'pay',
      note: `x402_bid_${auctionId}`,
    };

    const tx2: AlgorandTx = {
      txId: `tx_algo_receipt_${generateId()}`,
      sender: ESCROW_ALGORAND_ADDRESS,
      receiver: walletAddress,
      amountMicroAlgos: 0,
      feeMicroAlgos,
      type: 'appl',
      note: `x402_provably_fair_commit_${now}`,
    };

    const { groupId, transactions } = AlgorandAtomicTransferEngine.assignGroupID([tx1, tx2]);

    const response: AtomicGroupResponse = {
      groupId,
      transactions,
      status: 'PENDING_SIGNATURES',
      serverGenesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDyAHfPO52Q402=',
      expiresAtMs: now + 300_000, // 5 minutes validity
      timestamp: now,
    };

    atomicGroupStore.set(groupId, { response, executed: false });
    logger.info({ groupId, auctionId, walletAddress }, '⚡ Algorand Atomic Group prepared');

    return response;
  }

  /**
   * Executes & verifies an atomic transaction group (All-or-Nothing)
   */
  public static executeAtomicGroup(groupId: string, signedTxns?: AlgorandTx[]): AtomicExecutionResult {
    const item = atomicGroupStore.get(groupId);
    if (!item) {
      throw new Error(`Algorand Atomic Group ${groupId} not found or expired`);
    }

    if (item.executed) {
      throw new Error(`Algorand Atomic Group ${groupId} has already been executed`);
    }

    const txnsToVerify = signedTxns || item.response.transactions;

    // Validate atomic group integrity via SHA-512/256 domain-separated hash
    const isValid = AlgorandAtomicTransferEngine.validateGroupIntegrity(txnsToVerify, groupId);
    if (!isValid) {
      logger.error({ groupId }, '❌ Algorand Atomic Group integrity check failed! Group hash mismatch.');
      throw new Error('ATOMIC_GROUP_INVALID: Transaction group hash mismatch or corrupted payload.');
    }

    // Atomic execution: Debit ledger balance and confirm atomic group settlement
    const firstTx = txnsToVerify[0];
    if (!firstTx) {
      throw new Error('ATOMIC_GROUP_EMPTY: No transactions present in atomic group bundle.');
    }
    const userWallet = firstTx.sender;
    const user = userRepository.getOrCreateByWallet(userWallet);
    
    // Process deposit/credit ledger update for ALGO equivalent
    const amountAlgo = firstTx.amountMicroAlgos / 1_000_000;
    LedgerService.processDeposit(user.id, amountAlgo, `algo_atomic_${groupId}`);

    item.executed = true;
    item.response.status = 'EXECUTED';

    const now = Date.now();
    const result: AtomicExecutionResult = {
      groupId,
      txHashes: txnsToVerify.map((t) => t.txId),
      blockRound: 42_891_004,
      confirmedTime: Math.floor(now / 1000),
      status: 'ALL_OR_NOTHING_SETTLED',
      winnerWallet: userWallet,
      prizeAlgo: amountAlgo,
    };

    logger.info({ groupId, userWallet, amountAlgo }, '✅ Algorand Atomic Group executed successfully!');
    return result;
  }

  /**
   * Returns current status of an atomic group
   */
  public static getGroupStatus(groupId: string) {
    const item = atomicGroupStore.get(groupId);
    if (!item) return null;
    return item.response;
  }
}
