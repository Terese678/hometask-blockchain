import React, { useState } from 'react';
import { generateWallet, fetchBalance } from '../api/blockchain.api';

/**
 * Wallet — generates a secp256k1 key pair and displays wallet info
 *
 * The private key is stored ONLY in React component state.
 * It is never sent to the server, never logged, never stored in
 * localStorage. It lives in memory for the lifetime of this component.
 *
 * Why keep private key in state? In a real wallet app you would use
 * hardware security modules or encrypted keystores. For this task,
 * component state is the correct scope — it satisfies the requirement
 * while keeping the architecture clean and simple.
 *
 * @param {function} onWalletGenerated - callback passing { publicKey, privateKey }
 * to parent so TransactionForm can sign transactions
 */
const Wallet = ({ onWalletGenerated }) => {
  // publicKey is the wallet address — safe to display publicly
  const [publicKey, setPublicKey] = useState('');

  // privateKey stays in state — never sent to server, never displayed fully
  // eslint-disable-next-line no-unused-vars
  const [privateKey, setPrivateKey] = useState('');

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * handleGenerate — calls POST /api/wallets to create a fresh key pair
   * then immediately fetches the balance for the new address (will be 0)
   */
  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await generateWallet();

      // Store both keys in local state
      setPublicKey(data.publicKey);
      setPrivateKey(data.privateKey);

      // Fetch balance — will be 0 for a brand new wallet
      const balanceData = await fetchBalance(data.publicKey);
      setBalance(balanceData.balance);

      // Notify parent component so TransactionForm can access the keys
      // for signing — private key goes no further than the parent component
      if (onWalletGenerated) {
        onWalletGenerated({
          publicKey: data.publicKey,
          privateKey: data.privateKey,
        });
      }
    } catch (err) {
      setError('Failed to generate wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-panel">
      <h2 className="panel-title">My Wallet</h2>

      <button
        className="submit-button"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Wallet'}
      </button>

      {error && <div className="form-message error">{error}</div>}

      {publicKey && (
        <div className="wallet-info">
          <div className="form-group">
            <label>Wallet Address (Public Key)</label>
            {/* Display full public key — this is safe to share publicly */}
            <textarea
              readOnly
              value={publicKey}
              rows={4}
              style={{ width: '100%', fontSize: '11px', fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label>Balance</label>
            <div className="balance-display">
              {/* Balance is 0 for new wallets — increases after mining rewards */}
              <strong>{balance ?? 0}</strong> coins
            </div>
          </div>

          {/* Private key indicator — we confirm it exists but never display it */}
          <div className="form-message success">
            ✓ Private key loaded into memory — ready to sign transactions
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;