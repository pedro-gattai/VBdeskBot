"use client";

export const runtime = 'edge';

import { Navbar } from "@/components/Navbar";
import { CreateAuctionForm } from "@/components/CreateAuctionForm";

export default function Create() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Create Auction</h1>
        <p className="text-slate-400 mb-8">Start a new auction on the Solana blockchain</p>
        <CreateAuctionForm />
      </div>
    </main>
  );
}
