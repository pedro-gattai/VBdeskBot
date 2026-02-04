import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface Auction {
  publicKey: PublicKey;
  seller: PublicKey;
  auctionId: number;
  sellingToken: PublicKey;
  buyingToken: PublicKey;
  sellingAmount: number;
  reservePrice: number;
  commitEnd: Date;
  revealEnd: Date;
  status: 'Open' | 'Finalized' | 'Cancelled' | 'Completed';
  winner?: PublicKey;
  winningBid?: number;
}

export const AuctionList: FC = () => {
  const { connection } = useConnection();
  //const { publicKey } = useWallet();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuctions();
  }, [connection]);

  async function loadAuctions() {
    setLoading(true);
    try {
      // TODO: Fetch auctions from program
      setAuctions([]);
    } catch (error) {
      console.error('Failed to load auctions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading auctions...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Auctions</h2>
      {auctions.length === 0 ? (
        <p>No auctions found. Create the first one!</p>
      ) : (
        <div>
          {auctions.map((auction) => (
            <div key={auction.publicKey.toString()} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
              <div>Auction #{auction.auctionId}</div>
              <div>Selling: {auction.sellingAmount} tokens</div>
              <div>Reserve: {auction.reservePrice}</div>
              <div>Status: {auction.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
