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
        <Link key={auction.id} href={`/auction/${auction.id}`} className="group">
          <div className="card-dark group-hover:bg-slate-600 group-hover:border-blue-500 transition-all duration-200 cursor-pointer transform group-hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition">{auction.title}</h3>
              <span className={`status-badge ${
                auction.status === "active" 
                  ? "status-active" 
                  : auction.status === "pending_reveal"
                  ? "status-pending"
                  : "status-completed"
              }`}>
                {auction.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-4 line-clamp-2">{auction.description}</p>
            <div className="space-y-2 mb-4">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Current Bid</p>
              <p className="text-white font-bold text-2xl">{auction.currentBid} <span className="text-sm text-slate-400">SOL</span></p>
            </div>
            <div className="pt-4 border-t border-slate-600">
              <p className="text-slate-400 text-xs">
                ⏱️ {Math.floor((auction.endTime - Date.now()) / 3600000)}h remaining
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
