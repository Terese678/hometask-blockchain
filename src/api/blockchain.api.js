import client from './client';
import ENDPOINTS from './endpoints';

// Each function here is a thin wrapper around the HTTP client.
// Controllers never make fetch calls directly — all API communication
// flows through this file. One place to change if the API ever moves.

export const fetchChain = () => client.get(ENDPOINTS.CHAIN);

export const fetchChainValidity = () => client.get(ENDPOINTS.CHAIN_VALID);

export const fetchStats = () => client.get(ENDPOINTS.STATS);

export const fetchPendingTransactions = () =>
  client.get(ENDPOINTS.TRANSACTIONS_PENDING);

export const fetchAllTransactions = () =>
  client.get(ENDPOINTS.TRANSACTIONS_ALL);

export const addTransaction = (fromAddress, toAddress, amount) =>
  client.post(ENDPOINTS.TRANSACTIONS, { fromAddress, toAddress, amount });

export const mineBlock = (miningRewardAddress = 'miner1') =>
  client.post(ENDPOINTS.MINE, { miningRewardAddress });

export const fetchBalance = (address) =>
  client.get(ENDPOINTS.balance(address));

export const fetchDashboard = () =>
  Promise.all([fetchChain(), fetchStats()]).then(([chainData, statsData]) => ({
    chainData,
    statsData,
  }));

/**
 * generateWallet — calls POST /api/wallets to create a new secp256k1 key pair
 *
 * Why does this live in the API layer and not the component?
 * Keeping HTTP calls out of components means if the endpoint ever changes,
 * we fix it here — not scattered across multiple React components.
 * This is the same pattern every other API call in this file follows.
 *
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
export const generateWallet = () => client.post(ENDPOINTS.WALLETS);