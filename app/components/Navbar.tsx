"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export function Navbar() {
  const { connected } = useWallet();

  return (
    <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex gap-6">
          <Link href="/" className="text-white font-bold text-lg hover:text-blue-400 transition">
            VB Desk
          </Link>
          <Link href="/create" className="text-slate-300 hover:text-white transition">
            Create
          </Link>
        </div>
        <WalletMultiButton />
      </div>
      {connected && (
        <div className="bg-blue-500/10 border-t border-blue-500/20 px-4 py-2">
          <p className="text-blue-300 text-sm">Connected to Solana Devnet</p>
        </div>
      )}
    </nav>
  );
}
