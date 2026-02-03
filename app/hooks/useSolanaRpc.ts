import { useMemo } from 'react';
import { Connection, clusterApiUrl } from '@solana/web3.js';

export type SolanaNetwork = 'devnet' | 'mainnet-beta' | 'testnet';

const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as SolanaNetwork) || 'devnet';
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT;

/**
 * Hook to get Solana RPC connection
 * Uses custom RPC endpoint if provided, otherwise defaults to cluster API
 */
export const useSolanaRpc = () => {
  const connection = useMemo(() => {
    const endpoint = RPC_ENDPOINT || clusterApiUrl(NETWORK);
    return new Connection(endpoint, 'processed');
  }, []);

  return {
    connection,
    network: NETWORK,
    endpoint: RPC_ENDPOINT || clusterApiUrl(NETWORK),
  };
};

/**
 * Get the RPC endpoint URL
 */
export const getSolanaRpcEndpoint = (): string => {
  return RPC_ENDPOINT || clusterApiUrl(NETWORK);
};

/**
 * Get the current Solana network
 */
export const getSolanaNetwork = (): SolanaNetwork => {
  return NETWORK;
};
