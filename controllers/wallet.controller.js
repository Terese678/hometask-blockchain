const crypto = require('crypto');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * generateWallet — creates a new secp256k1 cryptographic key pair
 *
 * Why secp256k1? It is the same elliptic curve Bitcoin and Ethereum use.
 * Industry standard for blockchain transaction signing.
 * Node.js built-in crypto means zero extra dependencies.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const generateWallet = (req, res) => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      // spki = SubjectPublicKeyInfo, the standard format for storing public keys
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