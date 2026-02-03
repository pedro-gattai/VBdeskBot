"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Auction {
  id: string;
  title: string;
  description: string;
  currentBid: number;
  endTime: number;
  status: "active" | "pending_reveal" | "completed";
}

export function AuctionList() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with RPC calls
    const mockAuctions: Auction[] = [
      {
        id: "1",
        title: "NFT Auction #001",
        description: "A rare digital collectible",
        currentBid: 5.5,
        endTime: Date.now() + 86400000,
        status: "active",
      },
      {
        id: "2",
        title: "Virtual Artwork",
        description: "Limited edition digital art",
        currentBid: 2.3,
        endTime: Date.now() + 172800000,
        status: "active",
      },
    ];
    setAuctions(mockAuctions);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="text-white">Loading auctions...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions.map((auction) => (
        <Link key={auction.id} href={`/auction/${auction.id}`}>
          <div className="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition cursor-pointer border border-slate-600">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white font-semibold text-lg">{auction.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                auction.status === "active" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"
              }`}>
                {auction.status}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-4">{auction.description}</p>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">Current Bid</p>
              <p className="text-white font-bold text-xl">{auction.currentBid} SOL</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
