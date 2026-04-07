# SafiPoints — Blockchain Loyalty Rewards on XRPL

Blockchain-powered loyalty and cashback system for restaurants, built on the XRP Ledger. Customers earn **SAFI tokens** automatically when they pay, store them on-chain, and redeem them for discounts at checkout.

**Live:** [https://safipoints.com](https://safipoints.com)

## How It Works

```
Customer scans QR → browses menu → places order → pays →
  earns SAFI tokens (minted on XRPL) → redeems at next visit for a discount
```

1. **Scan** — Customer scans the restaurant's QR code
2. **Order** — Browse the menu, add items to cart, enter phone number
3. **Earn** — SAFI tokens are minted on XRPL as cashback (10% of spend)
4. **Claim** — First-time customers claim via SMS OTP; returning customers get auto-minted
5. **Redeem** — Toggle "Pay with SAFI Points" at checkout to apply discount

## Architecture

```
React SPA ──→ Nginx (SSL) ──→ Express API ──→ MongoDB
                                    │
                                    └──→ XRPL Testnet (token mint/burn/balance)
```

| Layer | Stack |
|-------|-------|
| Frontend | React, Framer Motion, custom CSS |
| API | Node.js, Express, Mongoose |
| Database | MongoDB 7 |
| Blockchain | XRPL Testnet — SAFI (3-char IOU) |
| Infrastructure | Docker Compose, Nginx, Let's Encrypt SSL |
| CI/CD | GitHub Actions → ghcr.io → DigitalOcean |

## Quick Start (Local Development)

```bash
# 1. Clone & install
git clone https://github.com/EnockMagara/SAFIPOINTS.git
cd SAFIPOINTS
npm install --prefix server
npm install --prefix client

# 2. Environment
cp .env.example .env
# Set ENCRYPTION_KEY (exactly 32 chars) and MONGODB_URI

# 3. Start with Docker Compose (includes MongoDB)
docker compose up -d

# OR run natively:
mongod                                    # start MongoDB
npm run dev --prefix server               # API on :5002
npm start --prefix client                 # React on :3000

# 4. Seed demo data (creates XRPL wallets — takes ~30s)
cd server && node scripts/seed.js

# 5. Seed menu items
node scripts/seed-menu.js kilimanajaro
```

## Production Deployment

Deployed via Docker Compose on DigitalOcean with GitHub Actions CI/CD.

```bash
# Docker services
docker compose up -d
# → mongo:7          (database)
# → api              (Express on :5002, internal)
# → client           (Nginx serving React build)
# → nginx            (reverse proxy, SSL termination, ports 80/443)
# → certbot          (Let's Encrypt renewal)
```

## Live Demo

| What | URL |
|------|-----|
| Customer order flow | [safipoints.com/m/kilimanajaro](https://safipoints.com/m/kilimanajaro) |
| Merchant dashboard | [safipoints.com/login](https://safipoints.com/login) |
| Merchant QR code | [safipoints.com/merchant/qr](https://safipoints.com/merchant/qr) (after login) |

### Demo Credentials

| Role | Login | Password | Notes |
|------|-------|----------|-------|
| Merchant | kilimanjaro@res.com | *(set at registration)* | Dashboard, QR, menu management |
| Demo Customer | 0700000001 | — | 200 SAFI balance, enrolled, can redeem |
| Existing Customer | 0748487563 | — | 99 SAFI balance |

**Testing the SAFI toggle:**
1. Go to [safipoints.com/m/kilimanajaro](https://safipoints.com/m/kilimanajaro)
2. Add items to cart
3. Enter phone `0700000001` and place order
4. On the payment page, the "Pay with SAFI Points" toggle appears
5. Toggle it on to see the discount preview, then pay with Cash

## API Endpoints

### Public (no auth — customer ordering)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/public/merchant/:slug | Menu + merchant info |
| POST | /api/public/order | Place an order |
| POST | /api/public/order/:id/pay | Pay for an order (+ auto-mint SAFI) |
| GET | /api/public/safi-status | Check SAFI balance by phone |
| POST | /api/public/calculate-discount | Preview SAFI discount at checkout |

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

### Merchant
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/merchants/me | Merchant profile |
| GET | /api/merchants/me/menu | Menu items |
| GET | /api/merchants/me/stats | Dashboard stats |

### Webhooks
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/webhook/safisend | Receive payment events from SafiSend POS |

### XRPL
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/xrpl/health | XRPL connection status |
| GET | /api/xrpl/account/:address | XRPL account info |
| GET | /api/xrpl/tx/:hash | Look up transaction on XRPL |

## How XRPL Is Used

1. **Wallet Creation** — Each merchant gets an XRPL issuer wallet; customers get wallets on first claim
2. **Trust Lines** — Customers set trust lines to accept SAFI from their merchant's issuer address
3. **Token Issuance** — SAFI tokens minted as IOU payments on XRPL when customers earn cashback
4. **Token Burning** — On redemption, tokens are sent back to the issuer (burned on-chain)
5. **Live Balances** — Balances queried directly from XRPL via `account_lines`
6. **Transaction Proof** — Every earn/redeem stores the XRPL tx hash, verifiable on the testnet explorer

### V2 Soft Account Model

The earn flow uses a two-phase model to eliminate onboarding friction:

- **Phase 1 (Pending)** — Customer pays → `PendingPoints` record created off-chain. No wallet needed yet.
- **Phase 2 (Claim)** — Customer verifies via SMS OTP → XRPL wallet created, SAFI minted on-chain.
- **Auto-mint** — Returning enrolled customers skip Phase 2; tokens are minted directly after payment.

### Loyalty Economics

| Parameter | Value |
|-----------|-------|
| Earn rate | 10% of spend → SAFI |
| Redemption rate | 1 SAFI = KES 0.10 discount |
| Minimum redemption | 50 SAFI |
| Tiers | Bronze (1.0x), Silver (1.15x, 500+), Gold (1.30x, 2000+), Platinum (1.50x, 10000+) |
| Claim window | 6 months |
| Expiry | 1 year |

## Project Structure

```
SAFIPOINTS/
├── docker-compose.yml           # Production stack (5 services)
├── .github/workflows/ci-cd.yml  # GitHub Actions CI/CD pipeline
├── server/
│   ├── index.js                 # Express entry point
│   ├── config/                  # DB, JWT, XRPL, encryption
│   ├── middleware/              # Auth, error handler
│   ├── models/                  # Merchant, Customer, MenuItem, Order, PendingPoints, ...
│   ├── routes/                  # auth, public, loyalty, merchants, customers, xrpl, webhook
│   ├── services/                # XRPLService, TokenService, WalletService, LoyaltyService,
│   │                            # SafiSendBridge, RedemptionService, ExpiryService
│   └── scripts/                 # seed.js, seed-menu.js
├── client/
│   ├── Dockerfile               # Multi-stage: node:20-slim → nginx:alpine
│   └── src/
│       ├── App.js               # Router + protected routes
│       ├── api/client.js        # Axios instance
│       ├── context/AuthContext   # Auth state management
│       ├── components/          # Layout, RewardPrompt
│       ├── pages/               # MenuPage, PayPage, ClaimPage, OrderSuccess,
│       │                        # MerchantDashboard, MerchantQR, CustomerWallet, ...
│       └── styles/              # tokens.css, base.css, menu.css, pay.css, ...
├── deploy/                      # Nginx configs, SSL init, deploy scripts
└── tests/                       # Integration test scripts
```

## XRPL Testnet Resources

- Explorer: https://testnet.xrpl.org
- Faucet: https://faucet.altnet.rippletest.net/accounts
- WebSocket: `wss://s.altnet.rippletest.net:51233`

## License

Built for the XRPL Student Builder Residence.
