"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { connected } = useWallet();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex gap-8 items-center">
            <Link 
              href="/" 
              className="text-white font-bold text-xl hover:text-blue-400 transition duration-200"
            >
              ✨ VB Desk
            </Link>
            <div className="flex gap-6">
              <Link 
                href="/" 
                className={`transition duration-200 ${
                  isActive("/") 
                    ? "text-blue-400 border-b-2 border-blue-400 pb-1" 
                    : "text-slate-300 hover:text-white"
                }`}
                aria-current={isActive("/") ? "page" : undefined}
              >
                Auctions
              </Link>
              <Link 
                href="/create" 
                className={`transition duration-200 ${
                  isActive("/create") 
                    ? "text-blue-400 border-b-2 border-blue-400 pb-1" 
                    : "text-slate-300 hover:text-white"
                }`}
                aria-current={isActive("/create") ? "page" : undefined}
              >
                Create
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {connected && (
              <div className="hidden sm:flex items-center gap-2 text-green-400 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Connected
              </div>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </nav>
      {connected && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2">
          <p className="container mx-auto text-blue-300 text-sm">🔗 Connected to Solana Devnet</p>
        </div>
      )}
    </>
  );
}
