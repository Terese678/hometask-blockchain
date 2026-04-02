const { Blockchain, Transaction, Block } = require('./blockchain');
const config = require('../config');
const { save, load } = require('../services/persistence.service');

const { difficulty, miningReward, initialMinerAddress } = config.blockchain;

/**
 * restoreChain — rebuilds proper Block and Transaction class instances
 * from the raw parsed JSON loaded from disk.
 *
 * Why do we need this? JSON.parse gives us plain objects — they have the
 * data but none of the class methods like calculateHash() or isValid().
 * We manually reconstruct each Block and Transaction so the blockchain
 * works exactly as if it was created fresh in memory.
 *
 * This is a trade-off of using JSON file storage over a database —
 * a database driver would handle deserialisation automatically.
 *
 * @param {object} savedState - raw parsed JSON from blockchain.json
 * @returns {Blockchain} fully restored blockchain instance
 */
const restoreChain = (savedState) => {
  // Create a fresh blockchain instance with the saved settings
  const restored = new Blockchain(savedState.difficulty, savedState.miningReward);

  // Rebuild each block as a proper Block instance with all class methods
  restored.chain = savedState.chain.map((blockData) => {
    const block = new Block(
      blockData.timestamp,
      // Rebuild each transaction inside the block as a proper Transaction instance
      blockData.transactions.map((txData) => {
        const tx = new Transaction(txData.fromAddress, txData.toAddress, txData.amount);
        tx.timestamp = txData.timestamp;
        tx.signature = txData.signature;
        return tx;
      }),
      blockData.previousHash
    );
    // Restore the saved hash and nonce — do NOT recalculate
    // Recalculating would change the hash and break the chain
    block.hash = blockData.hash;
    block.nonce = blockData.nonce;
    return block;
  });

  // Restore pending transactions that were not yet mined
  restored.pendingTransactions = savedState.pendingTransactions.map((txData) => {
    const tx = new Transaction(txData.fromAddress, txData.toAddress, txData.amount);
    tx.timestamp = txData.timestamp;
    tx.signature = txData.signature;
    return tx;
  });

  return restored;
};

// Attempt to load saved blockchain state from disk on startup
const savedState = load();

// Single shared blockchain instance — Singleton pattern
// One blockchain shared across all controllers in the app
let blockchain;

if (savedState) {
  // Restore from disk — rebuild proper class instances from raw JSON
  const restored = restoreChain(savedState);

  // Validate the restored chain before trusting it —
  // a corrupted or tampered file must never silently poison the app
  if (restored.isChainValid()) {
    blockchain = restored;
    require('../utils/logger').info('Blockchain restored from saved state');
  } else {
    // Chain failed validation — log warning and start completely fresh
    // Better to lose history than to run on a corrupt chain
    require('../utils/logger').warn(
      'Saved blockchain failed validation — starting fresh'
    );
    blockchain = new Blockchain(difficulty, miningReward);
  }
} else {
  // No saved state found — first run or file was cleared
  blockchain = new Blockchain(difficulty, miningReward);
}

/**
 * saveChain — convenience wrapper so controllers never import
 * persistence.service directly. Keeps persistence logic out of controllers
 * as required by the task rules.
 *
 * @returns {void}
 */
const saveChain = () => save(blockchain);

module.exports = { blockchain, Transaction, saveChain };

