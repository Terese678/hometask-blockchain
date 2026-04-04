// Import saveChain so we can persist state after every new transaction
const { blockchain, Transaction, saveChain } = require('../models');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { isValidAddress, isValidAmount, sanitizeAddress, sanitizeAmount } = require('../utils/validator');

const addTransaction = (req, res, next) => {
  try {
    // Extract signature alongside the other fields — the frontend signs
    // the transaction before submitting so the signature arrives in the body
    const { fromAddress, toAddress, amount, signature } = req.body;

    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount)
    );

    // Attach the signature the frontend produced before calling isValid()
    // Without this, the transaction object has an empty signature and gets rejected
    if (signature) {
      transaction.signature = signature;
    }

    blockchain.addTransaction(transaction);

    // Persist immediately after adding — if server restarts before mining,
    // pending transactions are not lost. Every state change must survive restarts.
    saveChain();

    sendCreated(res, {
      message: 'Transaction added to pending pool',
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

const getPendingTransactions = (req, res) => {
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

const getAllTransactions = (req, res) => {
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

module.exports = { addTransaction, getPendingTransactions, getAllTransactions };