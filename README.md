# Blockchain HomeTask Project

A blockchain implementation with a layered Express backend and a React frontend.

> **For Applicants:** See [INSTRUCTIONS.md](./INSTRUCTIONS.md) for task requirements (2 tasks, 4–6 hours).
> See [SETUP.md](./SETUP.md) for a quick-start guide.

---

## Project Structure

```
hometask-blockchain/
│
├── config/
│   └── index.js                  # Environment config (port, CORS, blockchain settings)
│
├── models/
│   ├── blockchain.js             # Block, Transaction, Blockchain domain classes
│   └── index.js                  # Singleton instance + demo data seeding
│
├── utils/
│   ├── logger.js                 # Levelled logger (error / warn / info / debug)
│   ├── response.js               # Unified sendSuccess / sendCreated / sendError helpers
│   └── validator.js              # isValidAddress, isValidAmount, sanitizers
│
├── middleware/
│   ├── cors.middleware.js        # CORS policy
│   ├── logger.middleware.js      # Morgan HTTP request logger
│   ├── errorHandler.middleware.js# Centralised error handler (must be last)
│   ├── notFound.middleware.js    # 404 handler
│   ├── validateRequest.middleware.js  # validateBody / validateParams factories
│   └── rateLimit.middleware.js   # apiLimiter (100 req/min) + writeLimiter (20 req/min)
│
├── routes/
│   ├── index.js                  # Aggregates all /api sub-routes
│   ├── blockchain.routes.js      # /api/chain
│   ├── transaction.routes.js     # /api/transactions
│   ├── mining.routes.js          # /api/mine
│   ├── balance.routes.js         # /api/balance
│   ├── stats.routes.js           # /api/stats
│   └── health.routes.js          # /health (no rate limit)
│
├── controllers/
│   ├── blockchain.controller.js
│   ├── transaction.controller.js
│   ├── mining.controller.js
│   ├── balance.controller.js
│   └── stats.controller.js
│
├── src/                          # React frontend
│   ├── api/
│   │   ├── client.js             # Axios instance with request/response interceptors
│   │   ├── endpoints.js          # All API URL constants
│   │   └── blockchain.api.js     # Typed fetch functions (fetchChain, addTransaction…)
│   ├── hooks/
│   │   ├── useBlockchain.js      # Polls /api/chain + /api/stats, returns state
│   │   └── usePolling.js         # Reusable interval-based polling hook
│   ├── utils/
│   │   ├── formatters.js         # truncateHash, formatTimestamp, formatAmount
│   │   └── helpers.js            # isPositiveNumber, groupTransactionsByBlock, etc.
│   ├── constants/
│   │   └── index.js              # POLL_INTERVAL_MS, DEFAULT_MINER_ADDRESS, enums
│   ├── components/
│   │   ├── BlockchainViewer.js
│   │   ├── TransactionForm.js
│   │   ├── StatsPanel.js
│   │   ├── Header.js
│   │   └── ErrorBoundary.js      # React class error boundary
│   ├── App.js
│   └── index.js
│
├── blockchain.js                 # Backward-compat re-export → models/blockchain.js
├── server.js                     # Entry point — wires middleware, routes, starts server
├── .env.example                  # Template for environment variables
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm

### Install & Configure

```bash
npm install
cp .env.example .env   # then edit .env if you need different ports
```

### Run in Development

```bash
# Terminal 1 — React dev server on http://localhost:3000
npm start

# Terminal 2 — API server on http://localhost:3002, with auto-reload
npm run dev
```

The React app proxies all `/api/*` requests to the API server automatically via `src/setupProxy.js`.

### Run in Production

```bash
npm run serve   # builds the React app, then serves everything from port 3002
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `3002` | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `BLOCKCHAIN_DIFFICULTY` | `2` | Proof-of-work difficulty |
| `BLOCKCHAIN_MINING_REWARD` | `100` | Coinbase reward per mined block |
| `INITIAL_MINER_ADDRESS` | `genesis-miner` | Address for the first demo block reward |
| `SEED_DEMO_DATA` | `true` | Set to `false` to start with an empty chain |
| `REACT_APP_API_URL` | `http://localhost:3002` | Used by the React app |

---

## API Reference

All API responses share a common envelope:

```json
{ "success": true, ...payload }
{ "success": false, "error": "message" }
```

### Chain

| Method | Path | Description |
|---|---|---|
| GET | `/api/chain` | Full chain + length |
| GET | `/api/chain/valid` | `{ isValid: bool }` |

### Transactions

| Method | Path | Description |
|---|---|---|
| POST | `/api/transactions` | Add a pending transaction |
| GET | `/api/transactions/pending` | All pending transactions |
| GET | `/api/transactions/all` | All confirmed transactions |

**POST `/api/transactions` body:**
```json
{ "fromAddress": "address1", "toAddress": "address2", "amount": 100 }
```

### Mining

| Method | Path | Description |
|---|---|---|
| POST | `/api/mine` | Mine pending transactions into a new block |

**POST `/api/mine` body:**
```json
{ "miningRewardAddress": "miner1" }
```

### Balance

| Method | Path | Description |
|---|---|---|
| GET | `/api/balance/:address` | Confirmed balance of an address |

### Stats

| Method | Path | Description |
|---|---|---|
| GET | `/api/stats` | Chain length, difficulty, validity, pending count |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server uptime, env, timestamp — no rate limit |

---

## Frontend Architecture

The React app is organised into distinct concerns:

- **`src/api/`** — all network calls live here. Components never call `fetch`/`axios` directly.
- **`src/hooks/useBlockchain`** — single source of truth for chain + stats state; polls every 5 s.
- **`src/utils/formatters`** — pure formatting functions (hash truncation, timestamps, amounts).
- **`src/constants/`** — magic strings and numbers in one place.
- **`ErrorBoundary`** — catches any unhandled React render errors gracefully.

---

## Technologies

### Backend
- Node.js + Express
- `morgan` — HTTP request logging
- `dotenv` — environment variable loading
- `express-rate-limit` — API rate limiting
- `cors` — CORS policy middleware
- Node.js built-in `crypto` — SHA-256 hashing

### Frontend
- React 18
- Axios (with interceptors)
- CSS3 (glassmorphism, gradients, animations)

---

## Troubleshooting

**Port already in use**
```bash
# Use a different port
PORT=3003 npm run dev
```

**Frontend can't reach the API**
- Confirm `npm run dev` is running on port 3002
- Check `REACT_APP_API_URL` in your `.env`
- Confirm `src/setupProxy.js` target matches `PORT`

**Chain resets on every restart**
- This is expected until you implement Task 2 (Data Persistence) from INSTRUCTIONS.md

---

## License

MIT — for learning and assessment purposes.

---

## Changes

### What I Built

This section documents the two features I added to the base project, the decisions I made, and why.

---

### Task 1 — Cryptographic Wallet System

The original codebase used plain strings like `"address1"` and `"address2"` as wallet addresses — no real cryptography, no signing, no verification. Anyone could send transactions on behalf of anyone else. I replaced this entirely with a real cryptographic key pair system.

**Why P-256?**
P-256 (prime256v1) is supported by both Node.js built-in `crypto` AND the browser's Web Crypto API (`window.crypto.subtle`). secp256k1 is Bitcoin's curve but the browser does not support it natively — using P-256 gives full end-to-end consistency with zero extra dependencies. The instructions allow "ec type" and P-256 is a valid, widely used ec curve.

**What I found in the original code:**
`Transaction.signTransaction()` was written using elliptic library methods (`signingKey.getPublic()`, `signingKey.sign()`, `sig.toDER()`) that don't exist in Node.js built-in crypto. It would have thrown at runtime on the first signing attempt.

`Transaction.isValid()` had a deliberate bypass:
```javascript
if (!this.signature || this.signature.length === 0) {
  return true; // allowed unsigned transactions through
}
```
This meant any unsigned transaction passed validation — a critical security flaw in a system handling real digital assets. I removed this bypass. Unsigned transactions now throw an error at the validation boundary.

**New files:**
- `controllers/wallet.controller.js` — generates P-256 key pair using `crypto.generateKeyPairSync`, returns keys in PEM format
- `routes/wallet.routes.js` — registers `POST /api/wallets`, follows the existing routes → controllers pattern exactly

**Modified files:**
- `models/blockchain.js` — rewrote `signTransaction()` using `crypto.sign()`, fixed `isValid()` to properly verify signatures using `crypto.verify()`
- `routes/index.js` — registered wallet route under `/api/wallets`
- `src/components/Wallet.js` — new React component, generates wallet, displays public key and balance, stores private key in component state only
- `src/components/TransactionForm.js` — signs transaction data using Web Crypto API (`window.crypto.subtle`) before submitting. Converts signature from P1363 to DER format before sending. Private key never leaves the browser.
- `src/App.js` — lifted wallet state up to App so both Wallet and TransactionForm share the same key pair
- `src/api/endpoints.js` — added `WALLETS` endpoint constant
- `src/api/blockchain.api.js` — added `generateWallet()` API function

**Why the frontend uses Web Crypto API instead of Node.js crypto:**
Node.js `crypto` is not available in the browser. `window.crypto.subtle` is the browser-native equivalent — same ECDSA + SHA-256 operations, different API surface. The private key signs the transaction data in the browser and only the signature is sent to the server. The private key itself never touches the network.

---

### Task 2 — Blockchain Persistence

The original chain reset on every server restart — confirmed in the README troubleshooting section: *"Chain resets on every restart — this is expected until you implement Task 2."*

I built a JSON file persistence layer that saves chain state to disk after every mine and every new transaction, then restores it on startup.

**New files:**
- `services/persistence.service.js` — three functions: `save()`, `load()`, `clear()`. All file I/O is wrapped in try/catch. The server cannot crash due to a persistence failure.

**The deserialisation problem:**
`JSON.parse()` gives back plain objects — they have the data but none of the class methods like `calculateHash()` or `isValid()`. I wrote a `restoreChain()` function in `models/index.js` that rebuilds proper `Block` and `Transaction` class instances from the raw parsed JSON. This is a known trade-off of JSON file storage versus a real database — a database ORM would handle deserialisation automatically.

**Edge cases handled:**
- File does not exist → start fresh, no crash ✅
- File is empty → start fresh, no crash ✅
- File contains corrupt JSON → log warning, start fresh, no crash ✅
- Loaded chain fails `isChainValid()` → log warning, start fresh ✅

**Modified files:**
- `models/index.js` — calls `load()` on startup, exports `saveChain()` wrapper
- `controllers/mining.controller.js` — calls `saveChain()` after every successful mine
- `controllers/transaction.controller.js` — calls `saveChain()` after every new transaction

---

### No New Environment Variables

No new environment variables were introduced. The persistence file path (`blockchain.json`) is hardcoded to the project root and is already listed in `.gitignore`.

---

### Known Limitations and Trade-offs

**JSON file storage vs a real database**
Using a flat JSON file is simple and has zero dependencies — appropriate for this task scope. In production you would use a database (PostgreSQL, MongoDB, LevelDB) which handles concurrent writes, atomic transactions, and deserialisation automatically.

**Private key lives in browser memory only**
The private key is stored in React component state and is lost on page refresh. In a production wallet you would use encrypted local storage, a hardware wallet, or a keystore file protected by a user password. For this task, component state satisfies the requirement cleanly.

**Curve choice — P-256 over secp256k1**
The backend generates keys using P-256 (prime256v1) rather than secp256k1. While secp256k1 is Bitcoin's curve, it is not supported by the browser's Web Crypto API (`window.crypto.subtle`). P-256 is supported universally — in Node.js built-in crypto and in all modern browsers — giving full end-to-end consistency. The instructions allow "ec type" and P-256 is a valid, widely used ec curve.

**Signature format — P1363 to DER conversion**
Web Crypto API produces ECDSA signatures in IEEE P1363 format (raw 64-byte r||s). Node.js `crypto.verify` expects ASN.1 DER format. The `p1363ToDer` function in `TransactionForm.js` handles this conversion before the signature is sent to the backend — without it, verification always fails even when the signature is cryptographically correct.

**Single-file persistence**
The current implementation writes one file for the entire chain. On a large chain this becomes slow. A production system would use append-only logs or a proper database with indexed lookups.

**No wallet encryption**
Private keys are stored unencrypted in memory. A production system would encrypt the private key with a user passphrase before storing it anywhere.