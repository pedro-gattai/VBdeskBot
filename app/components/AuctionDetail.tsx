"use client";

import { useEffect, useState } from "react";

interface AuctionData {
  id: string;
  title: string;
  description: string;
  currentBid: number;
  endTime: number;
  bids: Array<{ bidder: string; amount: number; timestamp: number }>;
}

export function AuctionDetail({ auctionId }: { auctionId: string }) {
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - will be replaced with RPC calls
    const mockAuction: AuctionData = {
      id: auctionId,
      title: `Auction #${auctionId}`,
      description: "Detailed description of this auction item",
      currentBid: 5.5,
      endTime: Date.now() + 86400000,
      bids: [
        { bidder: "Alice...3xyz", amount: 5.5, timestamp: Date.now() - 3600000 },
        { bidder: "Bob...7abc", amount: 4.2, timestamp: Date.now() - 7200000 },
      ],
    };
    setAuction(mockAuction);
    setLoading(false);
  }, [auctionId]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!auction) return <div className="text-white">Auction not found</div>;

  const timeRemaining = Math.max(0, auction.endTime - Date.now());
  const hoursLeft = Math.floor(timeRemaining / 3600000);
  const minutesLeft = Math.floor((timeRemaining % 3600000) / 60000);

  return (
    <div className="bg-slate-700 rounded-lg p-8 border border-slate-600">
      <h1 className="text-4xl font-bold text-white mb-4">{auction.title}</h1>
      <p className="text-slate-300 text-lg mb-6">{auction.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-slate-400 text-sm mb-2">Current Bid</p>
          <p className="text-white font-bold text-3xl mb-4">{auction.currentBid} SOL</p>
          <p className="text-slate-400 text-sm">Time Remaining</p>
          <p className="text-white font-bold text-xl">
            {hoursLeft}h {minutesLeft}m
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Recent Bids</h3>
          <div className="space-y-2">
            {auction.bids.map((bid, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-300">{bid.bidder}</span>
                <span className="text-white font-semibold">{bid.amount} SOL</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
