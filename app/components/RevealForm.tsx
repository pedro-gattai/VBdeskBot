"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import crypto from "crypto";

export function RevealForm({ auctionId }: { auctionId: string }) {
  const { connected, publicKey, signMessage } = useWallet();
  const [bidAmount, setBidAmount] = useState("");
  const [nonce, setNonce] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generateHash = (amount: string, nonce: string): string => {
    const data = `${amount}${nonce}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey || !signMessage) {
      setMessage("Please connect your Phantom wallet");
      return;
    }

    if (!bidAmount || !nonce) {
      setMessage("Please enter bid amount and nonce");
      return;
    }

    setIsLoading(true);
    try {
      const hash = generateHash(bidAmount, nonce);
      const messageData = new TextEncoder().encode(
        `Reveal bid ${bidAmount} SOL on auction ${auctionId} with hash ${hash}`
      );
      const signature = await signMessage(messageData);
      console.log("Signed reveal:", signature);
      setMessage("Reveal submitted successfully!");
      setBidAmount("");
      setNonce("");
    } catch (error) {
      setMessage("Failed to reveal bid");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-700 rounded-lg p-6 border border-slate-600">
      <h2 className="text-white font-semibold text-xl mb-4">Reveal Bid</h2>

      {!connected ? (
        <p className="text-yellow-300 text-sm mb-4">Connect your wallet to reveal</p>
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
            placeholder="Your actual bid amount"
            className="w-full bg-slate-800 text-white rounded px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            disabled={!connected || isLoading}
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-2">Nonce</label>
          <input
            type="text"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            placeholder="Your secret nonce"
            className="w-full bg-slate-800 text-white rounded px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            disabled={!connected || isLoading}
          />
          <p className="text-slate-400 text-xs mt-1">Must match the nonce used when placing bid</p>
        </div>

        <button
          type="submit"
          disabled={!connected || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition"
        >
          {isLoading ? "Revealing..." : "Reveal Bid"}
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
