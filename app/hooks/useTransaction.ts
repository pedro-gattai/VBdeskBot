import { useState, useCallback } from 'react';

type TxStatus = 'idle' | 'pending' | 'confirmed' | 'error';

interface TransactionState {
  status: TxStatus;
  txId?: string;
  message?: string;
  errorMessage?: string;
}

interface UseTransactionReturn extends TransactionState {
  setPending: (message?: string) => void;
  setConfirmed: (txId: string, message?: string) => void;
  setError: (errorMessage: string) => void;
  reset: () => void;
  execute: <T,>(
    fn: () => Promise<T>,
    options?: {
      pendingMessage?: string;
      successMessage?: string;
      extractTxId?: (result: T) => string;
    }
  ) => Promise<T | null>;
}

export const useTransaction = (): UseTransactionReturn => {
  const [txState, setTxState] = useState<TransactionState>({
    status: 'idle',
  });

  const setPending = useCallback((message?: string) => {
    setTxState({
      status: 'pending',
      message: message || 'Processing transaction...',
    });
  }, []);

  const setConfirmed = useCallback((txId: string, message?: string) => {
    setTxState({
      status: 'confirmed',
      txId,
      message: message || 'Transaction confirmed!',
    });
  }, []);

  const setError = useCallback((errorMessage: string) => {
    setTxState({
      status: 'error',
      errorMessage,
    });
  }, []);

  const reset = useCallback(() => {
    setTxState({ status: 'idle' });
  }, []);

  const execute = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: {
        pendingMessage?: string;
        successMessage?: string;
        extractTxId?: (result: T) => string;
      }
    ): Promise<T | null> => {
      setPending(options?.pendingMessage);
      try {
        const result = await fn();
        const txId = options?.extractTxId?.(result) || String(result);
        setConfirmed(txId, options?.successMessage);
        return result;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMsg);
        return null;
      }
    },
    [setPending, setConfirmed, setError]
  );

  return {
    ...txState,
    setPending,
    setConfirmed,
    setError,
    reset,
    execute,
  };
};
