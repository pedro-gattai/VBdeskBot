import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletConnect } from './components/WalletConnect'
import { AuctionList } from './components/AuctionList'
import { CreateAuctionForm } from './components/CreateAuctionForm'
import { ToastProvider } from './components/ToastProvider'
import { LandingPage } from './components/LandingPage'
import './App.css'

type View = 'auctions' | 'create'

function App() {
  const { connected } = useWallet()
  const [currentView, setCurrentView] = useState<View>('auctions')

  return (
    <>
      <ToastProvider />
      
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <h1>🎯 VB Desk</h1>
              <p className="tagline">Vickrey-Boneh Sealed-Bid Auctions on Solana</p>
            </div>
            <WalletConnect />
          </div>
          
          {connected && (
            <nav className="main-nav">
              <button
                className={currentView === 'auctions' ? 'active' : ''}
                onClick={() => setCurrentView('auctions')}
              >
                📋 Browse Auctions
              </button>
              <button
                className={currentView === 'create' ? 'active' : ''}
                onClick={() => setCurrentView('create')}
              >
                ➕ Create Auction
              </button>
            </nav>
          )}
        </header>

        <main className="app-main">
          {!connected ? (
            <LandingPage />
          ) : (
            <>
              {currentView === 'auctions' && <AuctionList />}
              {currentView === 'create' && (
                <CreateAuctionForm 
                  onSuccess={() => setCurrentView('auctions')}
                />
              )}
            </>
          )}
        </main>

        <footer className="app-footer">
          <p>
            Built with ❤️ on Solana | 
            <a href="https://github.com/yourusername/VBdeskBot" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            {' | '}
            <a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer">
              Explorer
            </a>
          </p>
        </footer>
      </div>
    </>
  )
}

export default App
