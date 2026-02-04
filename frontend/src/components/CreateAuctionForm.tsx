import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

/**
 * Component for creating a new auction.
 */
export const CreateAuctionForm: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // State variables for form inputs
  const [sellingTokenMint, setSellingTokenMint] = useState('');
  const [buyingTokenMint, setBuyingTokenMint] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [commitDuration, setCommitDuration] = useState('3600'); // 1 hour default
  const [revealDuration, setRevealDuration] = useState('1800'); // 30 min default
  const [minBidDeposit, setMinBidDeposit] = useState('0.1'); // 0.1 SOL default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles form submission.
   * @param e Form event
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!sellingTokenMint || !buyingTokenMint) {
        throw new Error('Please enter both token mint addresses');
      }

      // Validate mint addresses are valid public keys
      try {
        new PublicKey(sellingTokenMint);
        new PublicKey(buyingTokenMint);
      } catch {
        throw new Error('Invalid mint address');
      }

      if (isNaN(parseFloat(sellingAmount)) || parseFloat(sellingAmount) <= 0) {
        throw new Error('Selling amount must be a positive number');
      }

      if (isNaN(parseFloat(reservePrice)) || parseFloat(reservePrice) <= 0) {
        throw new Error('Reserve price must be a positive number');
      }

      if (isNaN(parseFloat(minBidDeposit)) || parseFloat(minBidDeposit) <= 0) {
        throw new Error('Minimum bid deposit must be a positive number');
      }

      const sellingMint = new PublicKey(sellingTokenMint);
      const buyingMint = new PublicKey(buyingTokenMint);
      const sellingAmountBN = new BN(parseFloat(sellingAmount) * 1e9); // Assuming 9 decimals
      const reservePriceBN = new BN(parseFloat(reservePrice) * 1e9);
      const commitDurationBN = new BN(parseInt(commitDuration));
      const revealDurationBN = new BN(parseInt(revealDuration));
      const minDepositBN = new BN(parseFloat(minBidDeposit) * 1e9);

      // TODO: Call create_auction instruction after deployment
      // const program = await getProgram(wallet);
      // const auctionId = new BN(Date.now());
      // 
      // const tx = await program.methods
      //   .createAuction(
      //     auctionId,
      //     sellingAmountBN,
      //     reservePriceBN,
      //     commitDurationBN,
      //     revealDurationBN,
      //     minDepositBN
      //   )
      //   .accounts({ ... })
      //   .rpc();

      console.log('Creating auction...', {
        sellingMint: sellingMint.toString(),
        buyingMint: buyingMint.toString(),
        sellingAmount: sellingAmountBN.toString(),
        reservePrice: reservePriceBN.toString(),
      });

      alert('Auction creation will be available after contract deployment');
      
    } catch (err: any) {
      console.error('Failed to create auction:', err);
      setError(err.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Formats duration in seconds to HHh MMm format.
   * @param seconds Duration in seconds
   * @returns Formatted duration string
   */
  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  return (
    <div className=\"create-auction-form\">
      <h2>Create New Auction</h2>
      
      {!publicKey ? (
        <div className=\"warning-box\">
          <p>⚠️ Please connect your wallet to create an auction</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className=\"form-section\">
            <h3>Token Details</h3>
            
            <div className=\"form-group\">
              <label htmlFor=\"sellingToken\">
                Selling Token Mint Address
                <span className=\"required\">*</span>
              </label>
              <input
                id=\"sellingToken\"
                type=\"text\"
                placeholder=\"Token mint address (e.g., So11111...11112 for SOL)\"
                value={sellingTokenMint}
                onChange={(e) => setSellingTokenMint(e.target.value)}
                required
              />
              <small>The SPL token you want to sell</small>
            </div>

            <div className=\"form-group\">
              <label htmlFor=\"sellingAmount\">
                Selling Amount
                <span className=\"required\">*</span>
              </label>
              <input
                id=\"sellingAmount\"
                type=\"number\"
                step=\"0.000000001\"
                placeholder=\"10.5\"
                value={sellingAmount}
                onChange={(e) => setSellingAmount(e.target.value)}
                required
              />
              <small>Amount of tokens to sell (in token units)</small>
            </div>

            <div className=\"form-group\">
              <label htmlFor=\"buyingToken\">
                Buying Token Mint Address
                <span className=\"required\">*</span>
              </label>
              <input
                id=\"buyingToken\"
                type=\"text\"
                placeholder=\"Token mint address (e.g., USDC mint)\"
                value={buyingTokenMint}
                onChange={(e) => setBuyingTokenMint(e.target.value)}
                required
              />
              <small>The SPL token you want to receive</small>
            </div>

            <div className=\"form-group\">
              <label htmlFor=\"reservePrice\">
                Reserve Price (Minimum Bid)
                <span className=\"required\">*</span>
              </label>
              <input
                id=\"reservePrice\"
                type=\"number\"
                step=\"0.000000001\"
                placeholder=\"1000\"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                required
              />
              <small>Minimum acceptable bid in buying token</small>
            </div>
          </div>

          <div className=\"form-section\">
            <h3>Auction Timing</h3>

            <div className=\"form-group\">
              <label htmlFor=\"commitDuration\">
                Commit Phase Duration
                <span className=\"required\">*</span>
              </label>
              <select
                id=\"commitDuration\"
                value={commitDuration}
                onChange={(e) => setCommitDuration(e.target.value)}
              >
                <option value=\"1800\">30 minutes</option>
                <option value=\"3600\">1 hour</option>
                <option value=\"7200\">2 hours</option>
                <option value=\"14400\">4 hours</option>
                <option value=\"86400\">24 hours</option>
              </select>
              <small>How long bidders can submit sealed bids</small>
            </div>

            <div className=\"form-group\">
              <label htmlFor=\"revealDuration\">
                Reveal Phase Duration
                <span className=\"required\">*</span>
              </label>
              <select
                id=\"revealDuration\"
                value={revealDuration}
                onChange={(e) => setRevealDuration(e.target.value)}
              >
                <option value=\"900\">15 minutes</option>
                <option value=\"1800\">30 minutes</option>
                <option value=\"3600\">1 hour</option>
                <option value=\"7200\">2 hours</option>
              </select>
              <small>How long bidders have to reveal their bids</small>
            </div>
          </div>

          <div className=\"form-section\">
            <h3>Security Settings</h3>

            <div className=\"form-group\">
              <label htmlFor=\"minBidDeposit\">
                Minimum Bid Deposit (SOL)
                <span className=\"required\">*</span>
              </label>
              <input
                id=\"minBidDeposit\"
                type=\"number\"
                step=\"0.01\"
                placeholder=\"0.1\"
                value={minBidDeposit}
                onChange={(e) => setMinBidDeposit(e.target.value)}
                required
              />
              <small>SOL deposit required from each bidder (prevents spam)</small>
            </div>

            <div className=\"info-box\">
              <p>ℹ️ <strong>Deposit Info:</strong></p>
              <ul>
                <li>Bidders who reveal get their deposit back (win or lose)</li>
                <li>Bidders who don't reveal forfeit their deposit</li>
                <li>Higher deposits discourage fake bids</li>
              </ul>
            </div>
          </div>

          <div className=\"form-summary\">
            <h3>Summary</h3>
            <div className=\"summary-row\">
              <span>Commit Phase:</span>
              <span>{formatDuration(parseInt(commitDuration))}</span>
            </div>
            <div className=\"summary-row\">
              <span>Reveal Phase:</span>
              <span>{formatDuration(parseInt(revealDuration))}</span>
            </div>
            <div className=\"summary-row\">
              <span>Total Duration:</span>
              <span>{formatDuration(parseInt(commitDuration) + parseInt(revealDuration))}</span>
            </div>
            <div className=\"summary-row\">
              <span>Required Deposit:</span>
              <span>{minBidDeposit} SOL per bidder</span>
            </div>
          </div>

          {error && (
            <div className=\"error-box\">
              <p>❌ {error}</p>
            </div>
          )}

          <div className=\"form-actions\">
            <button 
              type=\"submit\" 
              className=\"btn-primary btn-large\"
              disabled={loading || !publicKey}
            >
              {loading ? 'Creating Auction...' : 'Create Auction'}
            </button>
          </div>

          <div className=\"warning-box\">
            <p>⚠️ <strong>Before you create:</strong></p>
            <ul>
              <li>Double-check token mint addresses</li>
              <li>You'll need to approve token transfer</li>
              <li>Auction cannot be cancelled once bids are placed</li>
            </ul>
          </div>
        </form>
      )}
    </div>
  );
};
