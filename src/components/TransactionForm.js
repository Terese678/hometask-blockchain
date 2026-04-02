import React, { useState } from 'react';
import './TransactionForm.css';
import { addTransaction } from '../api/blockchain.api';

/**
 * importPrivateKey — converts a PEM private key string into a CryptoKey
 * that the browser's Web Crypto API can use for signing.
 *
 * Why Web Crypto API? Node.js crypto is not available in the browser.
 * Web Crypto (window.crypto.subtle) is the browser-native equivalent —
 * same cryptographic operations, different API.
 *
 * @param {string} pem - private key in PEM/pkcs8 format
 * @returns {Promise<CryptoKey>}
 */
const importPrivateKey = async (pem) => {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')
    .trim();

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
};

/**
 * signTransactionData — signs the transaction hash using the private key
 * with ECDSA + SHA-256, matching the verification in models/blockchain.js
 *
 * Why sign the hash and not raw data? Signing a fixed-size hash is faster
 * and more secure than signing variable-length raw transaction data.
 * This is exactly how Bitcoin signs transactions under the hood.
 *
 * @param {string} privateKeyPem - sender's private key in PEM format
 * @param {string} hash - transaction data hash
 * @returns {Promise<string>} hex-encoded signature
 */
const signTransactionData = async (privateKeyPem, hash) => {
  const key = await importPrivateKey(privateKeyPem);
  const encoder = new TextEncoder();
  const data = encoder.encode(hash);

  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    key,
    data
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * TransactionForm — creates and signs a transaction before submitting
 *
 * Why sign in the frontend? The private key never leaves the client.
 * We sign the transaction hash here and send only the signature to
 * the backend — the private key itself never touches the server.
 * This is how real blockchain wallets work.
 *
 * @param {function} onTransactionAdded - callback after successful submission
 * @param {string} privateKey - sender's private key from Wallet component
 * @param {string} publicKey - sender's public key (wallet address)
 */
const TransactionForm = ({ onTransactionAdded, privateKey, publicKey }) => {
  const [formData, setFormData] = useState({
    fromAddress: publicKey || '',
    toAddress: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Block submission if no wallet has been generated yet
      if (!privateKey) {
        setMessage('Please generate a wallet first before sending a transaction');
        setLoading(false);
        return;
      }

      // Sign the transaction hash with the private key before submitting.
      // The signature proves ownership of the wallet without revealing the private key.
      // This is the same principle used in every real blockchain transaction.
      const hash = `${formData.fromAddress}${formData.toAddress}${formData.amount}`;
      const signature = await signTransactionData(privateKey, hash);

      await addTransaction(
        formData.fromAddress,
        formData.toAddress,
        formData.amount,
        signature
      );

      setMessage('Transaction added successfully!');
      setFormData({ fromAddress: publicKey || '', toAddress: '', amount: '' });
      onTransactionAdded();
    } catch (err) {
      setMessage(err.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-form">
      <h2 className="panel-title">Create Transaction</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fromAddress">From Address</label>
          <input
            type="text"
            id="fromAddress"
            name="fromAddress"
            value={formData.fromAddress}
            onChange={handleChange}
            placeholder="Generate a wallet first"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="toAddress">To Address</label>
          <input
            type="text"
            id="toAddress"
            name="toAddress"
            value={formData.toAddress}
            onChange={handleChange}
            placeholder="e.g., address2"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g., 100"
            step="0.01"
            min="0"
            required
          />
        </div>

        {message && (
          <div
            className={`form-message ${
              message.includes('success') ? 'success' : 'error'
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={loading || !privateKey}
        >
          {loading ? 'Signing & Sending...' : 'Sign & Send Transaction'}
        </button>

        {/* Inform user they need a wallet before transacting */}
        {!privateKey && (
          <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            Generate a wallet above to enable transactions
          </p>
        )}
      </form>
    </div>
  );
};

export default TransactionForm;