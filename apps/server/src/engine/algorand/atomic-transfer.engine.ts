import { AlgorandTx } from '@crypto-inr/shared';
import crypto from 'node:crypto';

export class AlgorandAtomicTransferEngine {
  /**
   * Computes SHA-512/256 Group ID Hash according to Algorand Atomic Transfer Standard
   * Prefix "TG" + canonical serialization of transaction hashes in order
   */
  public static computeGroupID(txns: AlgorandTx[]): string {
    if (!txns || txns.length === 0) {
      throw new Error('Cannot compute Group ID for empty transaction list');
    }
    if (txns.length > 16) {
      throw new Error('Algorand Atomic Transfers allow a maximum of 16 transactions per group');
    }

    const hash = crypto.createHash('sha512-256');
    // Algorand protocol domain separator for Transaction Group: "TG"
    hash.update(Buffer.from('TG', 'utf-8'));

    for (const tx of txns) {
      const payload = `${tx.sender}:${tx.receiver}:${tx.amountMicroAlgos}:${tx.feeMicroAlgos}:${tx.type}:${tx.note || ''}`;
      hash.update(Buffer.from(payload, 'utf-8'));
    }

    const groupHashHex = hash.digest('hex');
    return `grp_algo_${groupHashHex.slice(0, 32)}`;
  }

  /**
   * Assigns the computed Group ID to all transactions in the batch
   */
  public static assignGroupID(txns: AlgorandTx[]): { groupId: string; transactions: AlgorandTx[] } {
    const groupId = this.computeGroupID(txns);
    const updated = txns.map((tx) => ({
      ...tx,
      groupId,
    }));

    return {
      groupId,
      transactions: updated,
    };
  }

  /**
   * Validates that all transactions in the group share the exact same expected Group ID
   */
  public static validateGroupIntegrity(txns: AlgorandTx[], expectedGroupId: string): boolean {
    if (!txns || txns.length === 0) return false;
    
    const recomputed = this.computeGroupID(txns);
    if (recomputed !== expectedGroupId) return false;

    return txns.every((tx) => tx.groupId === expectedGroupId);
  }
}
