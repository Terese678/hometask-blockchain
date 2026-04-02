const { blockchain, saveChain } = require('../models');
const { sendSuccess } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * mineBlock — mines all pending transactions into a new block
 * and saves the updated chain to disk immediately after.
 *
 * Why save after mining? Mining is the most significant state change
 * in a blockchain — a new block is permanently added to the chain.
 * If the server restarts after mining but before saving, that block
 * is lost forever. We save immediately to prevent that.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const mineBlock = (req, res, next) => {
  try {
    const miningRewardAddress = req.body.miningRewardAddress || 'miner1';

    logger.info(`Mining block for reward address: ${miningRewardAddress}`);
    blockchain.minePendingTransactions(miningRewardAddress);
    logger.info(`Block mined successfully: ${blockchain.getLatestBlock().hash}`);

    // Persist the chain to disk immediately after successful mining
    // so the new block survives any server restart
    saveChain();

    sendSuccess(res, {
      message: 'Block mined successfully',
      latestBlock: blockchain.getLatestBlock(),
      chainLength: blockchain.chain.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { mineBlock };