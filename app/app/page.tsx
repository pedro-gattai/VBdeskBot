import { Navbar } from "@/components/Navbar";
import { AuctionList } from "@/components/AuctionList";

export const runtime = 'edge';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">VB Desk</h1>
        <p className="text-slate-400 mb-8">Browse and bid on Solana auctions</p>
        <AuctionList />
      </div>
    </main>
  );
}
