const BASE = '/api';

const ENDPOINTS = {
  CHAIN: `${BASE}/chain`,
  CHAIN_VALID: `${BASE}/chain/valid`,
  TRANSACTIONS: `${BASE}/transactions`,
  TRANSACTIONS_PENDING: `${BASE}/transactions/pending`,
  TRANSACTIONS_ALL: `${BASE}/transactions/all`,
  MINE: `${BASE}/mine`,
  STATS: `${BASE}/stats`,
  balance: (address) => `${BASE}/balance/${encodeURIComponent(address)}`,
  // Wallet endpoint, this generates a new secp256k1 key pair via POST /api/wallets
  WALLETS: `${BASE}/wallets`,
};

export default ENDPOINTS;