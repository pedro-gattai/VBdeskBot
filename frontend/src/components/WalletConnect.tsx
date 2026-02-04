import { useEffect } from 'react';
import type { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'react-toastify';

/**
 * WalletConnect component for connecting to a Solana wallet.
 */
export const WalletConnect: FC = () => {
  const { connecting, connected, disconnecting, wallet, publicKey } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toString();
      const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
      toast.success(`🎉 Wallet connected: ${shortAddress}`, {
        autoClose: 3000,
      });
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (disconnecting) {
      toast.info('Disconnecting wallet...', {
        autoClose: 2000,
      });
    }
  }, [disconnecting]);

  return (
    <div className="wallet-connect">
      {connecting && (
        <div className="text-secondary" style={{ marginRight: 'var(--space-md)', fontSize: '0.875rem' }}>
          <span className="spinner spinner-small" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 'var(--space-xs)' }}></span>
          Connecting...
        </div>
      )}
      <WalletMultiButton />
      {connected && wallet && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-xs)' }}>
          {wallet.adapter.name}
        </div>
      )}
    </div>
  );
};
