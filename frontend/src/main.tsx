import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import './index.css'
import App from './App.tsx'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

function Root() {
  // Use configured RPC endpoint or default to devnet
  const endpoint = useMemo(() => 
    import.meta.env.VITE_RPC_ENDPOINT || clusterApiUrl('devnet'), 
    []
  )
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <StrictMode>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <App />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
