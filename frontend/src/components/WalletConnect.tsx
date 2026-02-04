import { FC, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

/**
 * WalletConnect component for connecting to a Solana wallet.
 */
export const WalletConnect: FC = () => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      // Simulate wallet connection (replace with actual connection logic)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Wallet connected successfully!');
    } catch (e: any) {
      console.error('Failed to connect wallet:', e);
      setError(e.message || 'Failed to connect wallet.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="wallet-connect">
      <WalletMultiButton onClick={handleConnect} disabled={connecting} />
      {connecting && <p>Connecting...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
};
