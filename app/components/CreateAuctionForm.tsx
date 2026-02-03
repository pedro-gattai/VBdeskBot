"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";

export function CreateAuctionForm() {
  const { connected, publicKey, signMessage } = useWallet();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startingBid: "",
    durationHours: "24",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey || !signMessage) {
      setMessage("Please connect your Phantom wallet");
      return;
    }

    if (!formData.title || !formData.description || !formData.startingBid) {
      setMessage("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const messageData = new TextEncoder().encode(
        `Create auction: ${formData.title} starting at ${formData.startingBid} SOL`
      );
      const signature = await signMessage(messageData);
      console.log("Auction created:", signature);
      setMessage("Auction created successfully!");
      setFormData({ title: "", description: "", startingBid: "", durationHours: "24" });
    } catch (error) {
      setMessage("Failed to create auction");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-700 rounded-lg p-8 border border-slate-600 max-w-2xl">
      {!connected ? (
        <p className="text-yellow-300 text-sm mb-6">Connect your wallet to create an auction</p>
      ) : null}

      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-slate-300 text-sm font-medium mb-2">Auction Title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Rare NFT Collection"
            aria-label="Auction title"
            className="input-field"
            disabled={!connected || isLoading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-slate-300 text-sm font-medium mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your auction item..."
            rows={4}
            aria-label="Auction description"
            className="input-field resize-none"
            disabled={!connected || isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="starting-bid" className="block text-slate-300 text-sm font-medium mb-2">Starting Bid (SOL)</label>
            <input
              id="starting-bid"
              type="number"
              name="startingBid"
              step="0.01"
              min="0"
              value={formData.startingBid}
              onChange={handleChange}
              placeholder="0.00"
              aria-label="Starting bid in SOL"
              className="input-field"
              disabled={!connected || isLoading}
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-slate-300 text-sm font-medium mb-2">Duration (Hours)</label>
            <select
              id="duration"
              name="durationHours"
              value={formData.durationHours}
              onChange={handleChange}
              aria-label="Auction duration"
              className="input-field"
              disabled={!connected || isLoading}
            >
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
              <option value="72">72 hours</option>
              <option value="168">1 week</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!connected || isLoading}
          aria-busy={isLoading}
          className="w-full btn-primary py-3"
        >
          {isLoading ? "Creating..." : "Create Auction"}
        </button>
      </div>

      {message && (
        <p className={`text-sm mt-6 ${message.includes("successfully") ? "text-green-300" : "text-red-300"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
