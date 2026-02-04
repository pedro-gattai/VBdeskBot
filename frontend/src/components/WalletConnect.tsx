import { FC } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const WalletConnect: FC = () => {
  return (
    <div className="wallet-connect">
      <WalletMultiButton />
    </div>
  );
};
