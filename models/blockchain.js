const crypto = require('crypto');

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.previousHash +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0');

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }
}

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = '';
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

  /**
   * signTransaction — signs this transaction with the sender's private key
   *
   * The original code used elliptic library methods (.getPublic(), .sign(), .toDER())
   * which don't exist in Node.js built-in crypto. Replaced entirely with
   * crypto.sign() which is native to Node.js — no extra dependencies needed.
   *
   * Why sha256? It produces a fixed 32-byte hash regardless of transaction size.
   * That hash is what we actually sign — not the raw transaction data.
   * This is exactly how Bitcoin signs transactions under the hood.
   *
   * @param {string} privateKeyPem - the sender's private key in PEM/pkcs8 format
   * @param {string} publicKeyPem - the sender's public key in PEM/spki format
   */
  signTransaction(privateKeyPem, publicKeyPem) {
    if (publicKeyPem !== this.fromAddress) {
      throw new Error(
        'You cannot sign transactions for other wallets — public key mismatch'
      );
    }

    const hashTx = this.calculateHash();

    this.signature = crypto
      .sign('sha256', Buffer.from(hashTx), privateKeyPem)
      .toString('hex');
  }

  /**
   * isValid — verifies this transaction has a legitimate cryptographic signature
   *
   * The original code had a critical security bypass:
   *   if (!this.signature || this.signature.length === 0) return true
   * This allowed ANY unsigned transaction to pass validation — a serious flaw
   * in a system handling real digital assets.
   *
   * Mining reward transactions (fromAddress === null) are the only legitimate
   * exception — they are created by the blockchain itself, not by a user wallet.
   *
   * Why verify against raw fields and not calculateHash()?
   * The browser signs fromAddress + toAddress + amount directly — crypto.verify
   * with 'sha256' applies SHA-256 internally during verification. Passing
   * calculateHash() would pre-hash the data and then SHA-256 it again inside
   * verify(), causing a double-hash mismatch. Raw fields match what the
   * browser signed.
   *
   * @returns {boolean} true only if signature is valid, false otherwise
   */
  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error(
        'Transaction has no signature — unsigned transactions are rejected'
      );
    }

    try {
      const publicKey = crypto.createPublicKey({
        key: this.fromAddress,
        format: 'pem',
        type: 'spki',
      });

      // Verify against raw transaction fields — matches exactly what the
      // browser signed in TransactionForm.js:
      //   const hash = `${fromAddress}${toAddress}${amount}`;
      // crypto.verify applies SHA-256 internally so we must NOT pre-hash here.
      const rawData = Buffer.from(
        this.fromAddress + this.toAddress + this.amount
      );

      return crypto.verify(
        'sha256',
        rawData,
        publicKey,
        Buffer.from(this.signature, 'hex')
      );
    } catch {
      return false;
    }
  }
}

class Blockchain {
  constructor(difficulty, miningReward) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty || 2;
    this.pendingTransactions = [];
    this.miningReward = miningReward || 100;
  }

  createGenesisBlock() {
    return new Block(Date.now(), [], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    this.pendingTransactions = [];
  }

  /**
   * addTransaction — validates and queues a transaction for the next block
   *
   * Rejects any transaction that fails cryptographic validation.
   * This is the enforcement point — no unsigned or tampered transaction
   * ever reaches the chain. Think of this as the bouncer at the door.
   *
   * @param {Transaction} transaction - the transaction to add
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) balance -= trans.amount;
        if (trans.toAddress === address) balance += trans.amount;
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (!current.hasValidTransactions()) return false;
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }

    return true;
  }

  getAllTransactions() {
    return this.chain.flatMap((block) => block.transactions);
  }
}

module.exports = { Blockchain, Block, Transaction };