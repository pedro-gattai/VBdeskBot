"use client";

export const runtime = 'edge';

import { Navbar } from "@/components/Navbar";
import { AuctionDetail } from "@/components/AuctionDetail";
import { BidForm } from "@/components/BidForm";
import { RevealForm } from "@/components/RevealForm";
import { useParams } from "next/navigation";

export default function AuctionPage() {
  const params = useParams();
  const auctionId = params.id as string;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <AuctionDetail auctionId={auctionId} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <BidForm auctionId={auctionId} />
          <RevealForm auctionId={auctionId} />
        </div>
      </div>
    </main>
  );
}
