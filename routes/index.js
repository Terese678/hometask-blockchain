const { Router } = require('express');

// Import all existing resource routes
const blockchainRoutes = require('./blockchain.routes');
const transactionRoutes = require('./transaction.routes');
const miningRoutes = require('./mining.routes');
const balanceRoutes = require('./balance.routes');
const statsRoutes = require('./stats.routes');

// Import our new wallet route — follows the same pattern as all routes above
const walletRoutes = require('./wallet.routes');

const router = Router();

// Register all routes under /api/
// Each route file handles one resource — this is the layered architecture pattern
router.use('/chain', blockchainRoutes);
router.use('/transactions', transactionRoutes);
router.use('/mine', miningRoutes);
router.use('/balance', balanceRoutes);
router.use('/stats', statsRoutes);

// Register wallet route — POST /api/wallets will now be handled by wallet.routes.js
router.use('/wallets', walletRoutes);

module.exports = router;