import { useState } from 'react';
import type { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface CreateAuctionFormProps {
  onSuccess: () => void;
}

export const CreateAuctionForm: FC<CreateAuctionFormProps> = ({ onSuccess }) => {
  const { publicKey } = useWallet();
  const [sellingToken, setSellingToken] = useState('');
  const [buyingToken, setBuyingToken] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [commitDuration, setCommitDuration] = useState('24');
  const [revealDuration, setRevealDuration] = useState('24');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Create auction on chain
      console.log('Creating auction:', {
        sellingToken,
        buyingToken,
        sellingAmount,
        reservePrice,
        commitDuration,
        revealDuration,
      });

      alert('Auction creation not yet implemented - smart contract integration pending');
      onSuccess();
    } catch (error) {
      console.error('Failed to create auction:', error);
      alert('Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Create New Auction</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Selling Token Address:</label>
          <input
            type="text"
            value={sellingToken}
            onChange={(e) => setSellingToken(e.target.value)}
            required
            placeholder="Token mint address"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Buying Token Address:</label>
          <input
            type="text"
            value={buyingToken}
            onChange={(e) => setBuyingToken(e.target.value)}
            required
            placeholder="Token mint address"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Selling Amount:</label>
          <input
            type="number"
            value={sellingAmount}
            onChange={(e) => setSellingAmount(e.target.value)}
            required
            min="0"
            step="any"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Reserve Price (minimum acceptable price):</label>
          <input
            type="number"
            value={reservePrice}
            onChange={(e) => setReservePrice(e.target.value)}
            required
            min="0"
            step="any"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Commit Phase Duration (hours):</label>
          <input
            type="number"
            value={commitDuration}
            onChange={(e) => setCommitDuration(e.target.value)}
            required
            min="1"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Reveal Phase Duration (hours):</label>
          <input
            type="number"
            value={revealDuration}
            onChange={(e) => setRevealDuration(e.target.value)}
            required
            min="1"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !publicKey}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create Auction'}
        </button>
      </form>
    </div>
  );
};
