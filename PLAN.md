# SafiPoints — Blockchain Loyalty Rewards on XRPL
### Comprehensive Implementation Plan

> **Status:** Planning Phase | **Target Demo:** April 7, 2026  
> **Based on:** SafiSend backend architecture (Node/Express/MongoDB)  
> **New layer:** XRP Ledger (XRPL) for on-chain loyalty token management

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What We Borrow from SafiSend](#2-what-we-borrow-from-safisend)
3. [Architecture Overview](#3-architecture-overview)
4. [XRPL Token Design](#4-xrpl-token-design)
5. [Data Models](#5-data-models)
6. [API Design](#6-api-design)
7. [Phased Implementation Plan](#7-phased-implementation-plan)
8. [Frontend Plan](#8-frontend-plan)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment & Environment](#10-deployment--environment)
11. [Nice-to-Have Roadmap](#11-nice-to-have-roadmap)

---

## 1. Project Overview

**SafiPoints** is a standalone, blockchain-powered loyalty and rewards platform for restaurants. Customers earn **SAFI tokens** when they pay via QR/web checkout, and these tokens are issued and tracked on the **XRP Ledger (XRPL)**.

### Goals

| Goal | Description |
|------|-------------|
| Frictionless earning | Points issued automatically at checkout — no apps or cards |
| On-chain transparency | Every earn/redeem recorded as an XRPL token transfer |
| Multi-merchant | One customer wallet, usable across many restaurants |
| Merchant-friendly | Simple dashboard — no blockchain knowledge required |
| Demo-ready by April 7 | Full end-to-end flow visible in a browser |

### Relationship to SafiSend

SafiPoints is a **separate project** but shares DNA with SafiSend:

```
SafiSend (parent)          SafiPoints (new project)
─────────────────          ──────────────────────────
Express + MongoDB    ──→   Same stack, new DB namespace
Customer auth model  ──→   Adapted for wallet-aware customers
Loyalty models       ──→   Replaced by XRPL-native model
Payment flow hooks   ──→   Webhook receiver (earn trigger)
```

SafiPoints does **not** depend on SafiSend at runtime. It can receive payment webhooks from SafiSend (or any POS/checkout system) to trigger point issuance.

---

## 2. What We Borrow from SafiSend

The following patterns are lifted and adapted — not copied wholesale:

| SafiSend Component | SafiPoints Adaptation |
|---|---|
| `server/config/db.js` | Same Mongoose connection pattern, new DB name `safipoints` |
| `server/config/jwt.js` | Identical JWT middleware, reused verbatim |
| `server/middleware/auth.js` | Adapted: adds `wallet` field to `req.user` |
| `server/models/Customer.js` | New `Customer` model with `xrplAddress` + `xrplSeed` (encrypted) |
| `server/models/Restaurant.js` | New `Merchant` model with XRPL issuer wallet fields |
| `server/services/LoyaltyService.js` | Gutted and replaced by `XRPLLoyaltyService.js` |
| `server/routes/loyalty.js` | Replaced with XRPL-aware routes |
| `client/src/context/CustomerAuthContext.jsx` | Reused pattern, adds wallet display |
| `client/src/components/loyalty/` | New components: `WalletCard`, `EarnAnimation`, `RedeemFlow` |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SafiPoints System                     │
│                                                          │
│  ┌──────────────┐    ┌──────────────────────────────┐   │
│  │  React Client │    │      Express API Server       │   │
│  │  (Port 3000) │◄──►│      (Port 5002)               │   │
│  │              │    │                                │   │
│  │  - Dashboard  │    │  Routes:                       │   │
│  │  - Wallet     │    │  /api/auth         (JWT)       │   │
│  │  - Merchants  │    │  /api/merchants    (CRUD)      │   │
│  │  - Rewards    │    │  /api/customers    (wallets)   │   │
│  │  - Redeem     │    │  /api/loyalty      (earn/burn) │   │
│  └──────────────┘    │  /api/webhook      (SafiSend)  │   │
│                       │  /api/xrpl         (ledger ops)│   │
│                       └────────────┬─────────────────┘   │
│                                    │                      │
│              ┌─────────────────────┼──────────────┐      │
│              ▼                     ▼              ▼      │
│       ┌────────────┐    ┌──────────────────┐  ┌───────┐  │
│       │  MongoDB   │    │   XRPL Testnet   │  │SafiS. │  │
│       │ (safipoints│    │  (or Mainnet)    │  │Webhook│  │
│       │  DB)       │    │                  │  │Source │  │
│       └────────────┘    │  - Token issuance│  └───────┘  │
│                         │  - Transfers     │             │
│                         │  - Balance query │             │
│                         └──────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Key Services

| Service | Responsibility |
|---------|---------------|
| `XRPLService` | Raw XRPL connection, wallet operations, trust lines |
| `TokenService` | Issue SAFI tokens, transfer, burn |
| `WalletService` | Create/encrypt/restore customer & merchant wallets |
| `LoyaltyService` | Business logic: earn rate, redemption rules, tiers |
| `WebhookService` | Receive payment events from SafiSend or other POS |
| `MerchantService` | Merchant onboarding, XRPL issuer setup |

---

## 4. XRPL Token Design

### Token: SAFI

| Property | Value |
|----------|-------|
| Currency Code | `SAFI` (3-char ASCII) |
| Type | IOU (Issued Currency on XRPL) |
| Issuer | SafiPoints Platform Wallet (hot wallet per merchant, or single cold issuer) |
| Decimals | 6 (XRPL standard) |
| Network | **XRPL Testnet** (Sprint 1–2) → Mainnet (post-demo) |

### Wallet Architecture

```
SafiPoints Issuer (Master Hot Wallet)
├── Merchant A Wallet  ──→ issues SAFI to customers of Merchant A
├── Merchant B Wallet  ──→ issues SAFI to customers of Merchant B
└── Customer Wallets
    ├── Customer 1: { SAFI balance from Merchant A, Merchant B }
    ├── Customer 2: { SAFI balance from Merchant A }
    └── ...
```

**Trust Line flow:**
1. Customer wallet is created (funded via XRPL testnet faucet in dev)
2. Customer wallet sets a **trust line** to the SafiPoints issuer for `SAFI`
3. When customer earns points, issuer sends SAFI tokens to customer wallet
4. When customer redeems, customer wallet sends SAFI back to issuer (burn)

### Earn Rate

| Spend Amount | Points Earned |
|---|---|
| KES 100 spent | 10 SAFI |
| KES 500 spent | 50 SAFI |
| KES 1,000 spent | 100 SAFI + bonus 10 (tier multiplier) |

Earn rate configured per merchant (`earnRate: 0.10` = 10%).

### Redemption Rate

| Points Redeemed | Discount Value |
|---|---|
| 100 SAFI | KES 10 discount |
| 500 SAFI | KES 50 discount |
| Minimum redemption | 50 SAFI |

---

## 5. Data Models

### `Merchant` (MongoDB)

```js
{
  _id, name, slug, email, phone,
  xrplIssuerAddress: String,    // XRPL hot wallet address
  xrplIssuerSeedEnc: String,    // AES-256 encrypted seed
  earnRate: Number,             // e.g. 0.10 (10% of spend)
  minRedemption: Number,        // minimum SAFI to redeem
  redemptionRate: Number,       // SAFI per KES discount
  isActive: Boolean,
  createdAt, updatedAt
}
```

### `Customer` (MongoDB)

```js
{
  _id, name, phone, email,
  xrplAddress: String,          // customer's XRPL wallet
  xrplSeedEnc: String,          // AES-256 encrypted seed
  trustLineSet: Boolean,        // has trust line been established?
  totalEarned: Number,          // lifetime SAFI earned (cached)
  totalRedeemed: Number,        // lifetime SAFI redeemed (cached)
  tier: { type: String, enum: ['bronze','silver','gold','platinum'] },
  enrolledMerchants: [{ type: ObjectId, ref: 'Merchant' }],
  createdAt, updatedAt
}
```

### `LoyaltyTransaction` (MongoDB)

```js
{
  _id,
  customer: { type: ObjectId, ref: 'Customer' },
  merchant: { type: ObjectId, ref: 'Merchant' },
  type: { enum: ['earn', 'redeem', 'expire', 'adjustment'] },
  safiAmount: Number,           // SAFI tokens involved
  fiatAmount: Number,           // KES spend that triggered it
  xrplTxHash: String,           // on-chain transaction hash
  xrplLedgerIndex: Number,      // ledger sequence
  status: { enum: ['pending','confirmed','failed'] },
  metadata: Object,             // order ID, table number, etc.
  createdAt
}
```

### `RedemptionRequest` (MongoDB)

```js
{
  _id,
  customer: ObjectId,
  merchant: ObjectId,
  safiAmount: Number,
  discountAmount: Number,       // KES discount granted
  xrplTxHash: String,
  status: { enum: ['pending','applied','expired','cancelled'] },
  expiresAt: Date,              // short-lived redemption window
  appliedToOrderId: String,
  createdAt
}
```

---

## 6. API Design

### Authentication

```
POST /api/auth/merchant/register   → create merchant account + XRPL issuer wallet
POST /api/auth/merchant/login      → JWT token
POST /api/auth/customer/register   → create customer + XRPL customer wallet
POST /api/auth/customer/login      → phone OTP or email magic link
```

### Merchants

```
GET    /api/merchants/:id          → merchant profile + stats
PUT    /api/merchants/:id          → update settings (earn rate, etc.)
GET    /api/merchants/:id/customers → enrolled customers
GET    /api/merchants/:id/transactions → transaction history
```

### Customers

```
GET    /api/customers/me           → profile + wallet + balance
GET    /api/customers/me/balance   → live XRPL balance query
GET    /api/customers/me/transactions → history
POST   /api/customers/me/trustline → set SAFI trust line (first time)
```

### Loyalty (Earn & Redeem)

```
POST   /api/loyalty/earn           → manually trigger earn (testing / cashier)
POST   /api/loyalty/redeem/initiate → start redemption, returns code
POST   /api/loyalty/redeem/confirm  → apply redemption to order
GET    /api/loyalty/balance/:customerId → balance check
```

### Webhook (SafiSend Integration)

```
POST   /api/webhook/safisend       → receives payment_completed event
POST   /api/webhook/generic        → generic POS webhook
```

### XRPL (Internal / Admin)

```
GET    /api/xrpl/wallet/:address   → check wallet info
POST   /api/xrpl/fund              → fund testnet wallet (dev only)
GET    /api/xrpl/tx/:hash          → look up transaction
GET    /api/xrpl/health            → XRPL connection status
```

---

## 7. Phased Implementation Plan

### Sprint 1: Core Infrastructure (Week 1 — by ~Mar 30)

**Goal:** XRPL connected, wallets created, tokens can be issued on testnet.

#### Backend Tasks

| Task | File | Priority |
|------|------|----------|
| Project scaffold | `safipoints/server/index.js` | P0 |
| XRPL connection config | `server/config/xrpl.js` | P0 |
| `XRPLService` — connect, fund, trust line | `server/services/XRPLService.js` | P0 |
| `WalletService` — create/encrypt/restore wallets | `server/services/WalletService.js` | P0 |
| `TokenService` — issue/burn SAFI tokens | `server/services/TokenService.js` | P0 |
| Merchant model + registration route | `server/models/Merchant.js` + route | P0 |
| Customer model + registration route | `server/models/Customer.js` + route | P0 |
| JWT auth middleware | `server/middleware/auth.js` | P0 |
| MongoDB connection | `server/config/db.js` | P0 |
| `.env.example` + environment setup | `.env.example` | P0 |

#### Deliverable — Sprint 1

- [x] `POST /api/auth/merchant/register` → creates merchant + XRPL issuer wallet
- [x] `POST /api/auth/customer/register` → creates customer + XRPL wallet + trust line
- [x] `GET /api/xrpl/health` → confirms XRPL testnet connection
- [x] Manual earn call issues real SAFI tokens on testnet
- [x] XRPL tx hash stored in MongoDB

---

### Sprint 2: Core Features (Week 2 — by ~Apr 4)

**Goal:** Full earn → store → redeem cycle working end-to-end.

#### Backend Tasks

| Task | File | Priority |
|------|------|----------|
| `LoyaltyService` — earn logic with tier multipliers | `server/services/LoyaltyService.js` | P0 |
| Earn endpoint with XRPL issuance | `server/routes/loyalty.js` | P0 |
| Webhook receiver (SafiSend payment hook) | `server/routes/webhook.js` | P0 |
| Redemption flow — initiate + confirm | `server/services/RedemptionService.js` | P0 |
| Live balance query (XRPL + cached) | `server/routes/customers.js` | P0 |
| Transaction history (DB + XRPL hash) | `server/routes/transactions.js` | P1 |
| Tier upgrade logic (bronze→silver→gold) | Inside `LoyaltyService` | P1 |
| `EngagementScoreService` (adapted from SafiSend) | `server/services/EngagementScoreService.js` | P2 |

#### Frontend Tasks

| Task | Component | Priority |
|------|-----------|----------|
| React app scaffold + routing | `client/src/App.jsx` | P0 |
| Customer registration + wallet creation | `pages/CustomerOnboarding.jsx` | P0 |
| Wallet card (balance + address) | `components/WalletCard.jsx` | P0 |
| Earn animation (confetti on earn) | `components/EarnAnimation.jsx` | P1 |
| Transaction history list | `pages/Transactions.jsx` | P1 |
| Merchant dashboard stub | `pages/MerchantDashboard.jsx` | P1 |

#### Deliverable — Sprint 2

- [x] SafiSend sends webhook → SafiPoints issues SAFI on XRPL automatically
- [x] Customer can see balance (live from XRPL)
- [x] Customer can initiate redemption → gets discount code
- [x] Merchant can see issued points and customer list

---

### Sprint 3: Polish + Demo (Week 3 — by Apr 7)

**Goal:** Demo-ready. Smooth UI. End-to-end story in one screen recording.

#### Backend Tasks

| Task | Notes |
|------|-------|
| Error handling + retry for XRPL failures | Queue failed transactions |
| Rate limiting | `express-rate-limit` on earn/redeem |
| Seed script | Sample merchants + customers with SAFI balances |
| XRPL explorer links | Embed testnet explorer URLs in responses |

#### Frontend Tasks

| Task | Component |
|------|-----------|
| Full customer wallet UI | `pages/LoyaltyWallet.jsx` |
| Merchant analytics dashboard | `pages/MerchantDashboard.jsx` |
| QR code for customer wallet | Show wallet address as QR |
| Redemption flow modal | `components/RedeemModal.jsx` |
| XRPL transaction explorer link | Show `https://testnet.xrpl.org/transactions/{hash}` |
| Responsive mobile-first layout | Tailwind + Framer Motion |

#### Deliverable — Sprint 3

- [x] Complete demo flow: register → earn → view balance → redeem
- [x] Every transaction links to XRPL testnet explorer
- [x] Merchant can configure earn rate from dashboard
- [x] App runs locally with `npm run dev`

---

## 8. Frontend Plan

### Page Structure

```
/                    → Landing / marketing page
/login               → Merchant login
/register            → Merchant registration
/dashboard           → Merchant dashboard (transactions, customer list)
/dashboard/settings  → Merchant settings (earn rate, redemption config)

/customer/register   → Customer onboarding (creates wallet)
/customer/login      → Customer phone/email login
/customer/wallet     → Wallet: balance, history, redeem button
/customer/redeem     → Redemption flow
/customer/transactions → Full transaction history
```

### Component Tree

```
App
├── Layout (Navbar, Sidebar)
│   ├── MerchantDashboard
│   │   ├── StatsCards (total issued, redeemed, active customers)
│   │   ├── CustomerList
│   │   └── TransactionFeed
│   └── CustomerWallet
│       ├── WalletCard (balance, address, QR)
│       ├── EarnHistory
│       └── RedeemModal
└── Onboarding
    ├── MerchantRegister
    └── CustomerRegister (creates wallet on submit)
```

### Tech Stack (Frontend)

| Library | Purpose |
|---------|---------|
| React 18 | UI |
| React Router v6 | Routing |
| Tailwind CSS | Styling |
| Framer Motion | Animations (earn confetti, wallet transitions) |
| Axios | API calls |
| React Query | Server state, auto-refetch balances |
| QRCode.react | Render wallet address as QR |

---

## 9. Testing Strategy

### Unit Tests

- `XRPLService` — mock XRPL client, test wallet creation, trust line, token issue
- `LoyaltyService` — earn rate calculation, tier upgrade logic
- `RedemptionService` — redemption amount math, expiry logic

### Integration Tests

- Full earn flow: POST webhook → DB record + XRPL tx hash returned
- Full redeem flow: initiate → confirm → XRPL burn tx

### E2E (Demo Flow)

Using `curl` scripts (adapted from SafiSend's `tests/crm-campaign-contract-tests.sh`):

```bash
# 1. Register merchant
# 2. Register customer
# 3. Simulate payment webhook
# 4. Check customer balance (should show SAFI)
# 5. Initiate redemption
# 6. Confirm redemption
# 7. Check XRPL explorer link
```

### XRPL Testnet Tools

- XRPL Testnet Faucet: `https://faucet.altnet.rippletest.net/accounts`
- Testnet Explorer: `https://testnet.xrpl.org`
- XRPL.js library: `xrpl` npm package (v3.x)

---

## 10. Deployment & Environment

### Environment Variables

```env
# Server
PORT=5002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/safipoints
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# XRPL
XRPL_NETWORK=wss://s.altnet.rippletest.net:51233   # Testnet
# XRPL_NETWORK=wss://xrplcluster.com               # Mainnet (production)
XRPL_ISSUER_ADDRESS=your_issuer_wallet_address
XRPL_ISSUER_SEED=your_issuer_seed_KEEP_SECRET

# Encryption (for storing seeds)
ENCRYPTION_KEY=32_char_AES256_key

# SafiSend Integration
SAFISEND_WEBHOOK_SECRET=shared_webhook_signing_secret
SAFISEND_API_URL=http://localhost:5001

# Client
REACT_APP_API_URL=http://localhost:5002/api
```

### Running Locally

```bash
# Install dependencies
cd safipoints && npm install
cd server && npm install
cd client && npm install

# Start (concurrently)
npm run dev
# → server on :5002
# → client on :3000
```

### Directory Layout

```
safipoints/
├── PLAN.md                          ← this file
├── README.md
├── package.json                     ← root (concurrently)
├── .env.example
├── .gitignore
│
├── server/
│   ├── index.js                     ← Express app entry
│   ├── package.json
│   ├── config/
│   │   ├── db.js                    ← MongoDB connection
│   │   ├── xrpl.js                  ← XRPL client singleton
│   │   └── jwt.js                   ← JWT config
│   ├── middleware/
│   │   ├── auth.js                  ← JWT verify middleware
│   │   ├── merchantAuth.js          ← Merchant-specific guard
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Merchant.js
│   │   ├── Customer.js
│   │   ├── LoyaltyTransaction.js
│   │   └── RedemptionRequest.js
│   ├── routes/
│   │   ├── auth.js                  ← register/login (merchant + customer)
│   │   ├── merchants.js
│   │   ├── customers.js
│   │   ├── loyalty.js               ← earn + redeem endpoints
│   │   ├── webhook.js               ← SafiSend / POS webhooks
│   │   └── xrpl.js                  ← XRPL admin/debug routes
│   └── services/
│       ├── XRPLService.js           ← raw XRPL operations
│       ├── TokenService.js          ← SAFI token issuance/burn
│       ├── WalletService.js         ← wallet create/encrypt/restore
│       ├── LoyaltyService.js        ← earn/redeem business logic
│       ├── RedemptionService.js     ← redemption lifecycle
│       └── WebhookService.js        ← parse + validate webhooks
│
└── client/
    ├── package.json
    ├── public/
    └── src/
        ├── App.jsx
        ├── index.js
        ├── api/
        │   ├── client.js            ← axios instance
        │   ├── loyalty.js
        │   └── merchants.js
        ├── context/
        │   ├── AuthContext.jsx       ← merchant auth
        │   └── CustomerAuthContext.jsx
        ├── pages/
        │   ├── Landing.jsx
        │   ├── MerchantDashboard.jsx
        │   ├── MerchantSettings.jsx
        │   ├── CustomerWallet.jsx
        │   ├── CustomerOnboarding.jsx
        │   ├── Transactions.jsx
        │   └── RedeemPage.jsx
        └── components/
            ├── Layout.jsx
            ├── WalletCard.jsx
            ├── EarnAnimation.jsx
            ├── RedeemModal.jsx
            ├── TransactionFeed.jsx
            └── StatsCards.jsx
```

---

## 11. Nice-to-Have Roadmap

These are post-demo stretch goals:

| Feature | Complexity | Notes |
|---------|------------|-------|
| Cross-restaurant rewards | Medium | One SAFI pool, redeemable at any enrolled merchant |
| Tiered rewards (Bronze/Silver/Gold/Platinum) | Low | Based on `totalEarned` thresholds |
| NFT-based special rewards | High | XRPL NFTs (XLS-20) for milestone rewards |
| On-chain reputation / engagement score | Medium | Adapt `EngagementScoreService` from SafiSend |
| Merchant analytics dashboard | Medium | Charts: points issued/redeemed, customer retention |
| Customer referral program | Medium | Referral bonus in SAFI |
| XRPL AMM for SAFI liquidity | High | Post-MVP only |
| Mobile app (Capacitor) | Medium | Adapt from SafiSend's Capacitor setup |
| Offline sync | Medium | Earn points offline, sync when connected |

---

## Progress Tracker

### Sprint 1 Checklist

- [ ] Project directory scaffolded
- [ ] `npm run dev` starts both server and client
- [ ] XRPL testnet connection established (`/api/xrpl/health` returns OK)
- [ ] Merchant registration creates XRPL issuer wallet
- [ ] Customer registration creates XRPL wallet + sets trust line
- [ ] Manual earn call issues real SAFI on testnet
- [ ] Transaction saved to MongoDB with XRPL tx hash

### Sprint 2 Checklist

- [ ] Webhook from SafiSend triggers earn automatically
- [ ] Customer balance reflects live XRPL balance
- [ ] Redemption flow: initiate → confirm → burn on XRPL
- [ ] Merchant dashboard shows issued points + customer list
- [ ] Customer wallet page shows balance + history

### Sprint 3 Checklist

- [ ] Full demo flow runs end-to-end
- [ ] XRPL explorer links embedded in UI
- [ ] Seed script populates demo data
- [ ] Error states handled gracefully
- [ ] Mobile-responsive UI
- [ ] README with setup instructions

---

*Last updated: March 2026 | SafiPoints v0.1 — Hackathon Edition*
