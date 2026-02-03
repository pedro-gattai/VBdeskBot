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

  const isAuctionEnded = timeRemaining === 0;

  return (
    <div className="card-dark">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">{auction.title}</h1>
        <p className="text-slate-300 text-lg">{auction.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="space-y-6">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Current Bid</p>
              <p className="text-white font-bold text-4xl">{auction.currentBid}</p>
              <p className="text-slate-400 text-sm">SOL</p>
            </div>
            
            <div className={`rounded-lg p-4 ${isAuctionEnded ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
              <p className={`text-xs uppercase tracking-wide mb-1 ${isAuctionEnded ? 'text-red-300' : 'text-slate-400'}`}>
                {isAuctionEnded ? "Auction Ended" : "Time Remaining"}
              </p>
              <p className={`font-bold text-2xl ${isAuctionEnded ? 'text-red-300' : 'text-white'}`}>
                {isAuctionEnded ? "Ended" : `${hoursLeft}h ${minutesLeft}m`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            📊 Recent Bids
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {auction.bids.length > 0 ? (
              auction.bids.map((bid, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-700/50 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm font-mono">{bid.bidder}</span>
                  <span className="text-white font-semibold">{bid.amount} SOL</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No bids yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
