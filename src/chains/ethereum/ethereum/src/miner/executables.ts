import { TypedTransaction } from "@ganache/ethereum-transaction";
import { Heap } from "@ganache/utils";
import { byNonce } from "../transaction-pool";

export class Executables {
  public inProgress: Set<TypedTransaction> = new Set();
  public pending: Map<string, Heap<TypedTransaction>> = new Map();

  /**
   * Deep clones the executables, moving all `inProgress` transactions to the
   * pending queue and unlocking all transactions.
   * @returns Cloned and reset executables.
   */
  public cloneAndReset() {
    const executables = new Executables();
    const { inProgress, pending } = this;

    inProgress.forEach(transaction => {
      const copy = transaction.copy();
      copy.locked = false;
      const origin = copy.from.toString();
      const txsFromOrigin = executables.pending.get(origin);
      if (txsFromOrigin) {
        txsFromOrigin.push(copy);
      } else {
        executables.pending.set(origin, Heap.from(copy, byNonce));
      }
    });

    pending.forEach((transactionHeap, from) => {
      const { array: transactions, length } = transactionHeap;
      let newOrigin = executables.pending.get(from);
      if (!newOrigin) {
        newOrigin = new Heap(byNonce);
        executables.pending.set(from, newOrigin);
      }
      for (let i = 0; i < length; i++) {
        const copy = transactions[i].copy();
        copy.locked = false;
        newOrigin.push(copy);
      }
    });

    return executables;
  }
}
