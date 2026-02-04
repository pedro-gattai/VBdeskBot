import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';

// VB Desk Program ID (will be updated after devnet deployment)
export const PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

// Devnet RPC endpoint
export const DEVNET_ENDPOINT = clusterApiUrl('devnet');

export function getProvider(wallet: AnchorWallet): AnchorProvider {
  const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');
  return new AnchorProvider(connection, wallet, {
    preflightCommitment: 'confirmed',
  });
}

export async function getProgram(wallet: AnchorWallet) {
  const provider = getProvider(wallet);
  // IDL will be loaded after contract deployment
  // const idl = await Program.fetchIdl(PROGRAM_ID, provider);
  // return new Program(idl!, provider);
  throw new Error('Program not yet deployed - update PROGRAM_ID after deployment');
}
