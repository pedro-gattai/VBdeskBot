"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { generateNonce, formatSol } from "@/utils/crypto";

export function BidForm({ auctionId }: { auctionId: string }) {
  const { connected, publicKey, signMessage } = useWallet();
  const [bidAmount, setBidAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null);
  const [nonce, setNonce] = useState("");
  const [showNonce, setShowNonce] = useState(false);

  const handleGenerateNonce = () => {
    const generatedNonce = generateNonce(16);
    setNonce(generatedNonce);
    setMessage(`Nonce generated: ${generatedNonce.slice(0, 8)}...`);
    setMessageType('info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey || !signMessage) {
      setMessage("Please connect your Phantom wallet");
      setMessageType('error');
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setMessage("Please enter a valid bid amount");
      setMessageType('error');
      return;
    }

    if (!nonce) {
      setMessage("Generate a nonce to secure your bid");
      setMessageType('error');
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
      console.log("Nonce:", nonce);
      
      setMessage("✅ Bid submitted successfully!");
      setMessageType('success');
      setBidAmount("");
      setNonce("");
      setShowNonce(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to submit bid";
      setMessage(errorMsg);
      setMessageType('error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-dark">
      <h2 className="text-white font-semibold text-xl mb-6">🎯 Place Sealed Bid</h2>

      {!connected ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mb-4">
          <p className="text-yellow-300 text-sm">📱 Connect your Phantom wallet to place a bid</p>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/30 rounded p-3 mb-4">
          <p className="text-green-300 text-sm">✅ Wallet connected and ready</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Bid Amount */}
        <div>
          <label htmlFor="bid-amount" className="block text-slate-300 text-sm font-medium mb-2">
            Bid Amount (SOL)
          </label>
          <input
            id="bid-amount"
            type="number"
            step="0.01"
            min="0"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="5.0"
            aria-label="Bid amount in SOL"
            className="input-field text-lg font-semibold"
            disabled={!connected || isLoading}
          />
          {bidAmount && (
            <p className="text-slate-400 text-xs mt-1">= {formatSol(parseFloat(bidAmount))}</p>
          )}
        </div>

        {/* Nonce Generator */}
        <div className="bg-slate-800/50 rounded p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-slate-300 text-sm font-medium">
              🔐 Security Nonce
            </label>
            <button
              type="button"
              onClick={handleGenerateNonce}
              disabled={isLoading || !connected}
              className="text-blue-400 hover:text-blue-300 text-xs font-semibold transition"
            >
              {nonce ? "Regenerate" : "Generate"}
            </button>
          </div>
          
          {nonce && (
            <div className="space-y-2">
              <code className="block bg-slate-900 p-2 rounded text-xs font-mono text-slate-300 break-all">
                {nonce}
              </code>
              <p className="text-slate-400 text-xs">
                ℹ️ Save this nonce securely. You'll need it to reveal your bid later.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!connected || isLoading || !nonce}
          aria-busy={isLoading}
          className="w-full btn-primary py-3 font-semibold text-lg"
        >
          {isLoading ? "⏳ Submitting bid..." : "Place Sealed Bid"}
        </button>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`text-sm mt-4 p-3 rounded flex items-start gap-2 ${
          messageType === 'success' 
            ? 'bg-green-500/10 border border-green-500/30'
            : messageType === 'error'
            ? 'bg-red-500/10 border border-red-500/30'
            : 'bg-blue-500/10 border border-blue-500/30'
        }`}>
          <span className="text-lg mt-0.5">
            {messageType === 'success' ? '✅' : messageType === 'error' ? '❌' : 'ℹ️'}
          </span>
          <p className={
            messageType === 'success'
              ? 'text-green-300'
              : messageType === 'error'
              ? 'text-red-300'
              : 'text-blue-300'
          }>
            {message}
          </p>
        </div>
      )}
    </form>
  );
}
