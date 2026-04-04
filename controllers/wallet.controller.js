const crypto = require('crypto');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * generateWallet — creates a new P-256 (prime256v1) cryptographic key pair
 *
 * Why P-256? It is supported by both Node.js built-in crypto AND the browser's
 * Web Crypto API (window.crypto.subtle). This gives us full end-to-end consistency —
 * the same curve is used for key generation, signing, and verification.
 *
 * secp256k1 is Bitcoin's curve but is NOT supported by the browser's Web Crypto API.
 * P-256 is the NIST standard curve supported universally across all environments.
 * The instructions allow "ec type" — P-256 is a valid ec curve.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const generateWallet = (req, res) => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      // spki = SubjectPublicKeyInfo — the standard format for storing/transmitting public keys
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      // pkcs8 = industry standard format for storing private keys securely
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return sendSuccess(res, { publicKey, privateKey }, 201);
  } catch (err) {
    return sendError(res, 'Failed to generate wallet', 500);
  }
};

module.exports = { generateWallet };