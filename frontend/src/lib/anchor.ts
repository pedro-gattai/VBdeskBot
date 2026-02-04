import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import IDL from '../idl/vb_desk.json';

// VB Desk Program ID (deployed to devnet)
export const PROGRAM_ID = new PublicKey('AQN8iwxj5s9cupFA4bhaK7ccuCyN2fD7EH3ari3T3uXf');

// Devnet RPC endpoint (configurable via env)
export const DEVNET_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || clusterApiUrl('devnet');

export function getProvider(wallet: AnchorWallet): AnchorProvider {
  const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');
  return new AnchorProvider(connection, wallet, {
    preflightCommitment: 'confirmed',
  });
}

export function getProgram(wallet: AnchorWallet): Program {
  const provider = getProvider(wallet);
  return new Program(IDL as Idl, provider);
}
