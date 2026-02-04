import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
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
  const { publicKey } = useWallet();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'my-auctions' | 'my-bids'>('active');

  useEffect(() => {
    loadAuctions();
  }, [connection, filter]);

  async function loadAuctions() {
    setLoading(true);
    try {
      // TODO: Fetch auctions from program after deployment
      // const program = await getProgram(wallet);
      // const accounts = await program.account.auction.all();
      
      // Mock data for now
      setAuctions([]);
    } catch (error) {
      console.error('Failed to load auctions:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTimeRemaining(deadline: Date): string {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function getPhase(auction: Auction): 'commit' | 'reveal' | 'finalized' {
    const now = new Date();
    if (auction.status !== 'Open') return 'finalized';
    if (now < auction.commitEnd) return 'commit';
    if (now < auction.revealEnd) return 'reveal';
    return 'finalized';
  }

  if (loading) {
    return (
      <div className=\"auction-list loading\">
        <div className=\"spinner\">Loading auctions...</div>
      </div>
    );
  }

  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'active') return auction.status === 'Open';
    if (filter === 'my-auctions') return publicKey && auction.seller.equals(publicKey);
    if (filter === 'my-bids') {
      // TODO: Check if user has bid on this auction
      return false;
    }
    return true;
  });

  return (
    <div className=\"auction-list\">
      <div className=\"auction-list-header\">
        <h2>Auctions</h2>
        <div className=\"filters\">
          <button 
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {publicKey && (
            <>
              <button 
                className={filter === 'my-auctions' ? 'active' : ''}
                onClick={() => setFilter('my-auctions')}
              >
                My Auctions
              </button>
              <button 
                className={filter === 'my-bids' ? 'active' : ''}
                onClick={() => setFilter('my-bids')}
              >
                My Bids
              </button>
            </>
          )}
        </div>
      </div>

      {filteredAuctions.length === 0 ? (
        <div className=\"no-auctions\">
          <p>No auctions found.</p>
          {filter === 'active' && <p>Be the first to create one!</p>}
        </div>
      ) : (
        <div className=\"auction-grid\">
          {filteredAuctions.map((auction) => {
            const phase = getPhase(auction);
            const timeRemaining = phase === 'commit' 
              ? getTimeRemaining(auction.commitEnd)
              : phase === 'reveal'
              ? getTimeRemaining(auction.revealEnd)
              : 'Ended';

            return (
              <div key={auction.publicKey.toString()} className=\"auction-card\">
                <div className=\"auction-card-header\">
                  <span className={`status-badge ${auction.status.toLowerCase()}`}>
                    {auction.status}
                  </span>
                  <span className={`phase-badge ${phase}`}>
                    {phase === 'commit' ? '🔒 Commit Phase' : 
                     phase === 'reveal' ? '👁️ Reveal Phase' : 
                     '✅ Finalized'}
                  </span>
                </div>

                <div className=\"auction-details\">
                  <div className=\"token-pair\">
                    <span className=\"selling\">
                      Selling: {auction.sellingAmount} tokens
                    </span>
                    <span className=\"arrow\">→</span>
                    <span className=\"buying\">
                      For: {auction.buyingToken.toString().slice(0, 8)}...
                    </span>
                  </div>

                  <div className=\"auction-info\">
                    <div className=\"info-row\">
                      <span>Reserve Price:</span>
                      <span>{auction.reservePrice} tokens</span>
                    </div>
                    <div className=\"info-row\">
                      <span>Time Remaining:</span>
                      <span className=\"time\">{timeRemaining}</span>
                    </div>
                    {auction.winner && (
                      <div className=\"info-row\">
                        <span>Winner:</span>
                        <span className=\"winner\">
                          {auction.winner.toString().slice(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className=\"auction-actions\">
                  {phase === 'commit' && auction.status === 'Open' && (
                    <button className=\"btn-primary\">
                      Place Bid
                    </button>
                  )}
                  {phase === 'reveal' && auction.status === 'Open' && (
                    <button className=\"btn-secondary\">
                      Reveal Bid
                    </button>
                  )}
                  {phase === 'finalized' && auction.winner && (
                    <button className=\"btn-success\">
                      View Results
                    </button>
                  )}
                  <button className=\"btn-ghost\">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
