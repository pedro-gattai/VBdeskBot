import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-toastify';

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

const SkeletonCard = () => (
  <div className="auction-card">
    <div className="auction-card-header">
      <div className="skeleton skeleton-title" style={{ width: '40%' }}></div>
      <div className="skeleton" style={{ width: '60px', height: '24px' }}></div>
    </div>
    <div className="auction-info">
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
    </div>
  </div>
);

const EmptyState: FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="empty-state">
    <div className="empty-state-icon">🎯</div>
    <h3>No Auctions Yet</h3>
    <p>Be the first to create a sealed-bid auction on VB Desk!</p>
    <button onClick={onCreate} className="btn-primary btn-large">
      ✨ Create First Auction
    </button>
  </div>
);

export const AuctionList: FC = () => {
  const { connection } = useConnection();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAuctions();
  }, [connection]);

  async function loadAuctions() {
    setLoading(true);
    try {
      // TODO: Fetch auctions from program
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data for development
      setAuctions([
        // Uncomment to test with mock data:
        // {
        //   publicKey: new PublicKey('11111111111111111111111111111111'),
        //   seller: new PublicKey('11111111111111111111111111111111'),
        //   auctionId: 1,
        //   sellingToken: new PublicKey('So11111111111111111111111111111111111111112'),
        //   buyingToken: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        //   sellingAmount: 100,
        //   reservePrice: 50,
        //   commitEnd: new Date(Date.now() + 86400000),
        //   revealEnd: new Date(Date.now() + 172800000),
        //   status: 'Open',
        // }
      ]);
    } catch (error: any) {
      console.error('Failed to load auctions:', error);
      toast.error(`Failed to load auctions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAuctions();
    setRefreshing(false);
    toast.success('Auctions refreshed!');
  }

  const formatTimeRemaining = (endDate: Date): string => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h left`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m left`;
  };

  const formatTokenAddress = (address: PublicKey): string => {
    const str = address.toString();
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="auction-list-container">
        <div className="auction-list-header">
          <h2>Browse Auctions</h2>
        </div>
        <div className="auction-grid">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="auction-list-container">
        <EmptyState onCreate={() => {
          // Navigate to create auction (handled by parent)
          toast.info('Click "Create Auction" in the navigation above');
        }} />
      </div>
    );
  }

  return (
    <div className="auction-list-container">
      <div className="auction-list-header">
        <h2>Browse Auctions ({auctions.length})</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary"
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="auction-grid">
        {auctions.map((auction) => (
          <div
            key={auction.publicKey.toString()}
            className="auction-card"
            onClick={() => {
              // TODO: Navigate to auction detail
              toast.info(`Auction #${auction.auctionId} details coming soon!`);
            }}
          >
            <div className="auction-card-header">
              <div className="auction-id">Auction #{auction.auctionId}</div>
              <div className={`auction-status ${auction.status.toLowerCase()}`}>
                {auction.status}
              </div>
            </div>

            <div className="auction-info">
              <div className="auction-info-row">
                <span className="auction-info-label">Selling</span>
                <span className="auction-info-value">
                  {auction.sellingAmount} {formatTokenAddress(auction.sellingToken)}
                </span>
              </div>

              <div className="auction-info-row">
                <span className="auction-info-label">Reserve Price</span>
                <span className="auction-info-value">
                  {auction.reservePrice} {formatTokenAddress(auction.buyingToken)}
                </span>
              </div>

              <div className="auction-info-row">
                <span className="auction-info-label">Commit Phase</span>
                <span className="auction-info-value">
                  {formatTimeRemaining(auction.commitEnd)}
                </span>
              </div>

              <div className="auction-info-row">
                <span className="auction-info-label">Seller</span>
                <span className="auction-info-value">
                  {formatTokenAddress(auction.seller)}
                </span>
              </div>
            </div>

            {auction.winner && (
              <div className="alert alert-success" style={{ marginTop: 'var(--space-lg)', marginBottom: 0 }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  🏆 Winner: {formatTokenAddress(auction.winner)}
                  {auction.winningBid && ` - ${auction.winningBid} tokens`}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
