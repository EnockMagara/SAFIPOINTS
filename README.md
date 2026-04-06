# SafiPoints — Blockchain Loyalty Rewards on XRPL

Blockchain-powered loyalty and rewards system for restaurants. Customers earn, store, and redeem **SAFI tokens** on the XRP Ledger.

## Architecture

```
React Client (3000) ←→ Express API (5002) ←→ MongoDB + XRPL Testnet
```

- **Backend:** Node.js / Express / Mongoose
- **Blockchain:** XRPL (XRP Ledger) — testnet for development
- **Token:** SAFI (issued currency / IOU on XRPL)
- **Frontend:** React with custom CSS

## Quick Start

```bash
# 1. Clone & install
cd SAFIPOINTS
npm install --prefix server
npm install --prefix client

# 2. Copy environment
cp .env.example .env
# Edit .env with your ENCRYPTION_KEY (must be exactly 32 chars)

# 3. Start MongoDB (must be running)
mongod

# 4. Run (both server + client)
npx concurrently "npm run server" "npm run client"
# → API: http://localhost:5002
# → App: http://localhost:3000

# 5. Seed demo data (optional — creates wallets on XRPL testnet)
cd server && npm run seed
```

## Demo Credentials (after seeding)

| Role | Login | Password |
|------|-------|----------|
| Merchant | kili@demo.com | demo1234 |
| Customer | +254711111111 | (phone login) |

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/merchant/register | Register merchant + create XRPL issuer wallet |
| POST | /api/auth/merchant/login | Merchant JWT login |
| POST | /api/auth/customer/register | Register customer + XRPL wallet + trust line |
| POST | /api/auth/customer/login | Customer phone login |

### Loyalty
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/loyalty/earn | Earn SAFI tokens (issues on XRPL) |
| GET | /api/loyalty/balance | Live SAFI balance from XRPL |
| POST | /api/loyalty/redeem/initiate | Start redemption, get code |
| POST | /api/loyalty/redeem/confirm | Confirm redemption, burn tokens on XRPL |
| GET | /api/loyalty/transactions | Transaction history with XRPL hashes |

### Webhooks
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/webhook/safisend | Receive payment events from SafiSend |

### XRPL
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/xrpl/health | XRPL connection status |
| GET | /api/xrpl/account/:address | XRPL account info |
| GET | /api/xrpl/tx/:hash | Look up transaction on XRPL |

## How XRPL Is Used

1. **Wallet Creation** — Each merchant and customer gets an XRPL wallet (testnet-funded)
2. **Trust Lines** — Customers set trust lines to accept SAFI tokens from merchant issuers
3. **Token Issuance** — When customers earn points, SAFI tokens are issued as IOU payments on XRPL
4. **Token Burning** — When customers redeem, tokens are sent back to the issuer (burned)
5. **Balance Queries** — Live balances are read directly from XRPL via `account_lines`
6. **Transaction Proof** — Every earn/redeem stores the XRPL transaction hash, linkable to the testnet explorer

## Testing

```bash
# Sprint 1: Infrastructure (XRPL connect, wallet creation, auth)
bash tests/sprint1-test.sh

# Sprint 2: Full lifecycle (earn → balance → redeem → webhook)
bash tests/sprint2-test.sh

# Sprint 3: Full e2e demo flow
bash tests/sprint3-e2e-test.sh
```

## Project Structure

```
SAFIPOINTS/
├── PLAN.md                      # Comprehensive implementation plan
├── README.md                    # This file
├── .env / .env.example
├── server/
│   ├── index.js                 # Express entry point
│   ├── config/                  # DB, JWT, XRPL, encryption
│   ├── middleware/               # Auth, error handler
│   ├── models/                  # Merchant, Customer, LoyaltyTransaction, RedemptionRequest
│   ├── routes/                  # auth, loyalty, webhook, merchants, customers, xrpl
│   ├── services/                # XRPLService, TokenService, WalletService, LoyaltyService, etc.
│   └── scripts/seed.js          # Demo data seeder
├── client/
│   └── src/
│       ├── App.js               # Router + protected routes
│       ├── api/client.js        # Axios instance
│       ├── context/AuthContext   # Auth state management
│       ├── components/Layout    # Nav + layout shell
│       └── pages/               # Landing, Login, Register, Dashboard, Wallet, Redeem, Transactions
└── tests/                       # Curl test scripts per sprint
```

## XRPL Testnet Resources

- Explorer: https://testnet.xrpl.org
- Faucet: https://faucet.altnet.rippletest.net/accounts
- WebSocket: `wss://s.altnet.rippletest.net:51233`
