import React, { useState } from 'react';
import './App.css';

import BlockchainViewer from './components/BlockchainViewer';
import TransactionForm from './components/TransactionForm';
import StatsPanel from './components/StatsPanel';
import Header from './components/Header';
import Wallet from './components/Wallet';

import useBlockchain from './hooks/useBlockchain';
import { mineBlock } from './api/blockchain.api';

/**
 * App — root component that owns wallet state and wires all panels together
 *
 * Why does App own the wallet state and not Wallet component?
 * Because TransactionForm needs the privateKey to sign transactions.
 * Lifting state up to App is the standard React pattern for sharing
 * state between sibling components — Wallet sets it, TransactionForm uses it.
 */
function App() {
  const { chain, stats, loading, error, refresh } = useBlockchain();

  // Wallet state lives here so both Wallet and TransactionForm can access it
  // privateKey never leaves the frontend — it is never sent to any API call
  const [walletKeys, setWalletKeys] = useState({
    publicKey: '',
    privateKey: '',
  });

  /**
   * handleWalletGenerated — called by Wallet component after key pair is created
   * Stores keys in App state so TransactionForm can use privateKey for signing
   *
   * @param {{ publicKey: string, privateKey: string }} keys
   */
  const handleWalletGenerated = ({ publicKey, privateKey }) => {
    setWalletKeys({ publicKey, privateKey });
  };

  const handleMine = async () => {
    try {
      await mineBlock();
      await refresh();
    } catch (err) {
      console.error('Mining failed:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading Blockchain...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <div className="app-container">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        <div className="main-content">
          <div className="left-panel">
            {/* Wallet panel — generate key pair, view address and balance */}
            <Wallet onWalletGenerated={handleWalletGenerated} />

            <StatsPanel stats={stats} onMine={handleMine} />

            {/* TransactionForm receives keys so it can sign before submitting */}
            <TransactionForm
              onTransactionAdded={refresh}
              privateKey={walletKeys.privateKey}
              publicKey={walletKeys.publicKey}
            />
          </div>

          <div className="right-panel">
            <BlockchainViewer blockchain={chain} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;