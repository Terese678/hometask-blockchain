const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * The persistence file lives in the project root.
 * Already added to .gitignore so chain data never gets committed.
 *
 * File shape:
 * {
 *   "chain": [
 *     {
 *       "timestamp": 1700000000000,
 *       "transactions": [...],
 *       "previousHash": "0",
 *       "nonce": 0,
 *       "hash": "abc123..."
 *     }
 *   ],
 *   "pendingTransactions": [...],
 *   "difficulty": 2,
 *   "miningReward": 100
 * }
 */
const BLOCKCHAIN_FILE = path.join(__dirname, '..', 'blockchain.json');

/**
 * save — serialises the blockchain and writes it to blockchain.json
 *
 * Why JSON.stringify with 2 spaces? Makes the file human-readable
 * so we can inspect the chain state directly without a tool.
 * In production you would use a real database instead.
 *
 * @param {import('../models/blockchain').Blockchain} blockchain
 */
const save = (blockchain) => {
  try {
    const data = JSON.stringify(
      {
        chain: blockchain.chain,
        pendingTransactions: blockchain.pendingTransactions,
        difficulty: blockchain.difficulty,
        miningReward: blockchain.miningReward,
      },
      null,
      2
    );

    // Write synchronously — we need the file written before the response
    // is sent back to the client. Async write risks the server restarting
    // before the file is flushed to disk.
    fs.writeFileSync(BLOCKCHAIN_FILE, data, 'utf8');
    logger.info('Blockchain saved to disk');
  } catch (err) {
    // A save failure must never crash the server — log and continue.
    // The chain lives in memory and keeps working even if disk write fails.
    logger.error(`Failed to save blockchain: ${err.message}`);
  }
};

/**
 * load — reads blockchain.json and returns the parsed state
 *
 * Returns null in three safe cases:
 * 1. File does not exist (first run)
 * 2. File contains corrupt/invalid JSON
 * 3. Any unexpected file system error
 *
 * The caller (models/index.js) decides what to do with null — start fresh.
 *
 * @returns {object|null} parsed blockchain state or null
 */
const load = () => {
  try {
    // If no saved file exists this is a clean first run — return null
    if (!fs.existsSync(BLOCKCHAIN_FILE)) {
      logger.info('No saved blockchain found — starting fresh');
      return null;
    }

    const data = fs.readFileSync(BLOCKCHAIN_FILE, 'utf8');

    // If the file is empty or whitespace treat it as missing
    if (!data || !data.trim()) {
      logger.warn('Blockchain file is empty — starting fresh');
      return null;
    }

    const parsed = JSON.parse(data);
    logger.info('Blockchain loaded from disk');
    return parsed;
  } catch (err) {
    // Corrupt JSON or any file system error — log warning and start fresh
    // A bad persistence file must never prevent the server from starting
    logger.warn(`Failed to load blockchain: ${err.message} — starting fresh`);
    return null;
  }
};

/**
 * clear — deletes blockchain.json from disk
 *
 * Used during testing to reset chain state without manually
 * deleting the file. Safe to call even if the file does not exist.
 */
const clear = () => {
  try {
    if (fs.existsSync(BLOCKCHAIN_FILE)) {
      fs.unlinkSync(BLOCKCHAIN_FILE);
      logger.info('Blockchain file cleared from disk');
    }
  } catch (err) {
    logger.error(`Failed to clear blockchain file: ${err.message}`);
  }
};

module.exports = { save, load, clear };