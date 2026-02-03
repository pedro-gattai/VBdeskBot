"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";

export function BidForm({ auctionId }: { auctionId: string }) {
  const { connected, publicKey, signMessage } = useWallet();
  const [bidAmount, setBidAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey || !signMessage) {
      setMessage("Please connect your Phantom wallet");
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setMessage("Please enter a valid bid amount");
      return;
    }

    setIsLoading(true);
    try {
      // This will be connected to the actual smart contract
      const messageData = new TextEncoder().encode(
        `Bid ${bidAmount} SOL on auction ${auctionId}`
      );
      const signature = await signMessage(messageData);
      console.log("Signed bid:", signature);
      setMessage("Bid submitted successfully!");
      setBidAmount("");
    } catch (error) {
      setMessage("Failed to submit bid");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-700 rounded-lg p-6 border border-slate-600">
      <h2 className="text-white font-semibold text-xl mb-4">Place Bid</h2>

      {!connected ? (
        <p className="text-yellow-300 text-sm mb-4">Connect your wallet to bid</p>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm mb-2">Bid Amount (SOL)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full bg-slate-800 text-white rounded px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            disabled={!connected || isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!connected || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition"
        >
          {isLoading ? "Submitting..." : "Place Bid"}
        </button>
      </div>

      {message && (
        <p className={`text-sm mt-4 ${message.includes("successfully") ? "text-green-300" : "text-red-300"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
