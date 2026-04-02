// Express Router — creates a mini-app that handles routes for /api/wallets
const { Router } = require('express');

// Import the generateWallet function we built in wallet.controller.js
const { generateWallet } = require('../controllers/wallet.controller');

// validateBody is in its own file — not a barrel export from middleware/index.js
// Copied the exact import pattern from transaction.routes.js
const { validateBody } = require('../middleware/validateRequest.middleware');

// Create a new router instance following the same pattern as all other route files
const router = Router();

/**
 * POST /api/wallets
 * Generates a new secp256k1 key pair and returns { publicKey, privateKey }
 *
 * Why no validateBody here? Wallet generation needs no request body —
 * it generates keys from scratch using Node.js crypto.
 * validateBody is used on routes that receive user input to validate.
 */
router.post('/', generateWallet);

// Export router so routes/index.js can register it under /api/wallets
module.exports = router;