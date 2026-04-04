import React, { useState, useEffect } from 'react';
import './TransactionForm.css';
import { addTransaction } from '../api/blockchain.api';

/**
 * importPrivateKey — converts a PEM private key string into a CryptoKey
 * that the browser's Web Crypto API can use for signing.
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
 * p1363ToDer — converts a Web Crypto ECDSA signature from IEEE P1363 format
 * to DER format expected by Node.js crypto.verify.
 *
 * Why is this needed? Web Crypto API produces signatures as raw r||s bytes
 * (P1363 format — 64 bytes for P-256). Node.js crypto.verify expects the
 * signature in ASN.1 DER format. Without this conversion, verification always
 * fails even when the signature is cryptographically correct.
 *
 * @param {Uint8Array} p1363 - raw 64-byte signature from Web Crypto
 * @returns {Uint8Array} DER-encoded signature
 */
const p1363ToDer = (p1363) => {
  const r = p1363.slice(0, 32);
  const s = p1363.slice(32);

  // Prepend 0x00 if high bit is set to prevent sign misinterpretation in DER
  const rPadded = r[0] & 0x80 ? new Uint8Array([0, ...r]) : r;
  const sPadded = s[0] & 0x80 ? new Uint8Array([0, ...s]) : s;

  const der = new Uint8Array(6 + rPadded.length + sPadded.length);
  let i = 0;
  der[i++] = 0x30; // SEQUENCE tag
  der[i++] = 4 + rPadded.length + sPadded.length; // total length
  der[i++] = 0x02; // INTEGER tag for r
  der[i++] = rPadded.length;
  der.set(rPadded, i); i += rPadded.length;
  der[i++] = 0x02; // INTEGER tag for s
  der[i++] = sPadded.length;
  der.set(sPadded, i);

  return der;
};

/**
 * signTransactionData — signs transaction data using the private key with
 * ECDSA + SHA-256, then converts the signature to DER format so Node.js
 * crypto.verify can validate it on the backend.
 *
 * @param {string} privateKeyPem - sender's private key in PEM format
 * @param {string} data - raw transaction data string to sign
 * @returns {Promise<string>} hex-encoded DER signature
 */
const signTransactionData = async (privateKeyPem, data) => {
  const key = await importPrivateKey(privateKeyPem);
  const encoded = new TextEncoder().encode(data);

  // Web Crypto returns P1363 format — must convert to DER for Node.js
  const p1363 = new Uint8Array(
    await window.crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      key,
      encoded
    )
  );

  const der = p1363ToDer(p1363);

  return Array.from(der)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * TransactionForm — creates and signs a transaction before submitting
 *
 * The private key never leaves the client. We sign here and send only
 * the DER-encoded signature to the backend for verification.
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

  useEffect(() => {
    if (publicKey) {
      setFormData(prev => ({ ...prev, fromAddress: publicKey.trim() }));
    }
  }, [publicKey]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!privateKey) {
        setMessage('Please generate a wallet first before sending a transaction');
        setLoading(false);
        return;
      }

      // Trim fromAddress — sanitizeAddress on the backend calls .trim(),
      // so both sides must operate on the exact same string when signing
      const trimmedFrom = formData.fromAddress.trim();

      // Sign raw concatenated fields — backend verifies the same string
      const dataToSign = `${trimmedFrom}${formData.toAddress}${formData.amount}`;
      const signature = await signTransactionData(privateKey, dataToSign);

      await addTransaction(
        trimmedFrom,
        formData.toAddress,
        formData.amount,
        signature
      );

      setMessage('Transaction added successfully!');
      setFormData({ fromAddress: publicKey.trim() || '', toAddress: '', amount: '' });
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