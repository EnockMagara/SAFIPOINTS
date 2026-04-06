# SafiPoints — Architecture V2
### Gap Analysis + Redesign Plan
*Addressing feedback from Pamphile Roy (XRPL Architect) and Nischay Rawal*

---

## Executive Summary

The current SafiPoints V1 has the right idea but the wrong execution at four critical levels:
1. Uses **IOU tokens** instead of **MPT** (Multi-Purpose Token) — wrong primitive
2. **Creates XRPL wallets immediately** on customer registration — too much friction, too early
3. **Phone numbers and wallets are linked on-chain** — privacy violation at the infrastructure level
4. The **value proposition of XRPL is unclear** — feels like a database with extra steps

The V2 design fixes all four, and the user's intuition ("earn first, claim later, earn interest") is exactly the right direction.

---

## Gap 1: IOU vs MPT — Use the Right Primitive

### What V1 does (wrong)
```js
// XRPLService.js — current approach
const tx = {
  TransactionType: 'TrustSet',          // customer must set this first
  LimitAmount: { currency: 'SAFI', issuer: issuerAddress, value: '1000000' }
};
// Then issue:
const tx = {
  TransactionType: 'Payment',
  Amount: { currency: 'SAFI', issuer: issuerAddress, value: '100' }
};
```

**Problems with IOU:**
- Customers must set a **trust line** before receiving tokens — this is a separate on-chain transaction, requires the customer wallet to be funded first, and is an invisible UX wall
- Customer wallets must hold a **2 XRP reserve** just to exist on ledger
- Trust lines add **0.2 XRP reserve each** per currency/issuer pair
- Tokens are linked to the issuer address publicly, making customer flow traceable

### What V2 should use (MPT — Multi-Purpose Token)
MPT (`MPTokenIssuance` / `MPTokenAuthorize`) is XRPL's newer token standard:

```
IOU Flow:   Customer → TrustSet tx → receive IOU → redeem IOU
MPT Flow:   Issuer mints MPT → Customer authorizes → receive MPT → redeem
```

**Why MPT is better for SafiPoints:**
| Property | IOU | MPT |
|----------|-----|-----|
| Trust line required | Yes (friction) | No |
| Customer must be funded first | Yes (2 XRP reserve) | No |
| Transferable between customers | Yes | Configurable (can disable for loyalty) |
| DEX trading | Yes | Not yet |
| Micropayment efficiency | Lower | Higher |
| On-chain footprint | Large | Small |
| Customer profiling risk | Higher | Lower |

MPT allows you to set **transfer restrictions** on the token at issuance time, which is exactly what a loyalty token should have — it should not be tradeable on the open market, only earn and redeem within the SafiPoints ecosystem.

### V2 Action: Migrate to MPT
```
Phase 1 (demo): Keep IOU, document it as "testnet only, MPT migration planned"
Phase 2 (mainnet): Issue MPTIssuance tx, set transferable=false, loyaltyProgram=true
```

---

## Gap 2: Wallet Creation is Wrong — The "Soft Account" Model

### What V1 does (wrong)
```js
// auth.js — current approach: wallet created IMMEDIATELY on register
const walletData = await WalletService.createCustomerWallet(merchant.xrplAddress);
// This instantly:
// 1. Creates a real XRPL account on testnet (funded from faucet)
// 2. Submits a TrustSet transaction
// 3. Stores the seed in MongoDB
```

**Problems:**
- Most customers won't engage — you create wallets for people who order once and leave
- Every wallet creation costs time (~5 seconds), XRPL network calls, and reserve funding
- Testnet faucet has rate limits — this breaks under load
- The seed is created and stored before the customer has consented to anything

### What V2 should do: Three-Phase Wallet Model

The user's intuition is right:

```
Phase 1: SOFT ACCOUNT (off-chain, no XRPL yet)
    → Customer pays at restaurant
    → SafiPoints records "pending SAFI: 150" in MongoDB
    → Customer gets SMS: "You earned 150 SAFI at Kilimanjaro Grill.
       Want to save them? safipoints.ke/claim ↗"
    → No wallet, no keys, no friction

Phase 2: CLAIM (on-chain, customer-initiated)
    → Customer clicks the SMS link
    → Chooses how to claim: passkey / phone OTP / email magic link
    → SafiPoints creates XRPL wallet + mints SAFI
    → Customer now has a real on-chain balance

Phase 3: REDEMPTION (on-chain, at checkout)
    → Customer shows wallet QR or phone number at checkout
    → SafiPoints burns SAFI, SafiSend applies discount
```

**Why this is better:**
- Zero friction at point of sale — the loyalty "just happens"
- You only create on-chain accounts for engaged customers
- Reserve costs are deferred — pay only for customers who actually claim
- No seed management burden until the customer actively wants it

### Pending Points Schema (V2 addition to MongoDB)
```js
PendingPoints {
  _id,
  phone: String,               // the only identifier needed at Phase 1
  merchantId: ObjectId,
  safiAmount: Number,          // points owed
  fiatAmount: Number,          // the order amount that triggered it
  earnedAt: Date,
  expiresAt: Date,             // 12 months from earnedAt
  claimableUntil: Date,        // 6 months to claim to wallet
  status: enum ['pending', 'claimed', 'expired'],
  claimedToAddress: String,    // XRPL address after claim
  xrplTxHash: String,          // set after on-chain mint
  orderId: String,             // SafiSend order reference
}
```

### Expiry Logic (User's Idea, Implemented)
```
earnedAt + 6 months  → "claim_window_expires" — SMS reminder sent at 5 months
earnedAt + 12 months → "points_expire" — final warning at 11 months, then forfeit

At redemption: SAFI is valued at the RATE IT WAS EARNED
(not a fluctuating rate — the rate is locked in PendingPoints.earnRate)
```

---

## Gap 3: Privacy and Customer Profiling

### What V1 does (wrong)
```js
// Customer.js — current model
xrplAddress: String,   // ← linked to phone number in DB
// auth.js — JWT payload
jwt.sign({ id, role, xrplAddress }, ...)   // ← address in every token

// Every XRPL transaction is public
// Anyone can look up the customer's XRPL address and see:
// - When they ate out (timestamps)
// - How much they spent (earn amounts)
// - Which restaurants they visited (merchant issuers)
// This is customer profiling at the infrastructure level
```

**Problem:** XRPL is a public ledger. Linking a phone number to an XRPL address in your DB, and then using that same address for all transactions, creates a traceable spending profile for every customer. Pamphile's concern is valid.

### V2 Privacy Architecture

**Option A: Custodial Phase (simplest, ships fast)**
- During Phase 1 (soft account), there is no on-chain presence at all
- When the customer claims, SafiPoints generates the wallet server-side and holds keys custodially
- Customers interact with SafiPoints, not directly with the ledger
- The phone-to-wallet link exists only in SafiPoints' encrypted database, not on-chain

**Option B: Privacy Addresses (stronger)**
- When minting for a customer, use a fresh derived address each time rather than a static wallet
- The platform issuer maps addresses to customers in a private off-chain registry
- On-chain it looks like "platform issuer sent to address X" — no visible customer identity

**Option C: Aggregated Minting (most private)**
- Batch multiple earns into a single on-chain transaction per time period (daily/weekly)
- Reduces on-chain footprint and makes individual transaction correlation harder
- Works well with MPT which supports batch operations

**V2 Recommendation:** Start with **Option A** (custodial) for the demo. This also solves the reserve/key-management problem — SafiPoints holds the keys until the customer actively exports/takes custody of their wallet.

```
Customer never needs to know about XRPL until they claim
When they claim: they get a wallet address and a seed phrase (or passkey-backed key)
Before claiming: SafiPoints is the custodian
```

---

## Gap 4: Why XRPL? (The Value Proposition Must Be Clear)

Nischay's question: *"What does blockchain improve over a normal loyalty backend?"*

This is the most important question for the pitch. Here is the clear answer:

### What a normal loyalty backend gives you:
- Points stored in a database (restaurant's database)
- Restaurant can change your balance arbitrarily
- If the restaurant closes, your points disappear
- Not usable at any other restaurant
- No customer-owned proof of any kind

### What XRPL gives SafiPoints (and only XRPL gives):
1. **Customer-owned balance** — once claimed, the SAFI tokens live in the customer's wallet, not the restaurant's database. The restaurant literally cannot zero out your balance.

2. **Cross-restaurant interoperability** — because SAFI is issued by one platform issuer (not per-restaurant), the balance travels with the customer wallet, usable at any enrolled merchant. No card re-linking, no new account per restaurant.

3. **Non-repudiable earn/redeem proof** — the XRPL transaction hash is a tamper-proof receipt. "I earned 150 SAFI at 3pm on March 23" is publicly verifiable. A restaurant cannot dispute it.

4. **Expiry enforcement without trust** — in a normal backend, you trust SafiPoints not to expire your points early or extend them unfairly. On XRPL, the MPT rules (expiry, transfer restrictions) are set at token issuance time and cannot be changed by anyone.

5. **The "earn interest" mechanic** — because SAFI is a real on-chain token, its redemption rate can be programmatically set to improve over time (e.g., early holders get a better rate). A database cannot credibly commit to this without trust — a blockchain can.

---

## Gap 5: The "Earn and Hold, Rate Locks In" Mechanic

### User's Vision
> *"Order, receive a message: you've earned X points, want to sign up? They can keep them 6 months, add to wallet as cashback. Earn interest. Expire after 1 year. Redeem at rate at which earned."*

### How to implement this correctly

**Rate locking:**
```
When 150 SAFI is earned:
  PendingPoints.earnRate = 0.10   // 1 SAFI = KES 0.10 at earn time
  PendingPoints.safiAmount = 150

When redeemed:
  discountAmount = 150 × PendingPoints.earnRate = KES 15.00
  (NOT the current global rate — the customer's locked-in rate)
```

**The "earn interest" mechanic (V2 design):**
- Early adopters (first 6 months after SafiPoints launch) earn at a **bonus rate multiplier**, e.g. 1.2× the base
- Or: the global redemption rate improves over time as more merchants join (more merchant revenue → higher SAFI value)
- Because rates are stored per-earn-event in `PendingPoints`, customers who hold longer and claimed earlier get the best deal
- This creates genuine incentive to sign up early and hold rather than immediately redeem

**Cashback framing:**
Instead of calling it "loyalty points", position it as **cashback**:
```
"You have KES 15 cashback waiting from your last visit"
```
This is far more compelling to a Kenyan customer than "you have 150 SAFI points".
The on-chain SAFI is the technical mechanism. The user experience shows KES.

---

## Gap 6: Passkeys + UX Onboarding

Pamphile mentioned passkeys. Here is why this matters and how to use them:

**Current V1 problem:**
- Customers need to "register" with a phone + merchantId before any wallet exists
- The seed is server-generated and stored encrypted in MongoDB
- If SafiPoints' DB is compromised, all seeds are at risk

**V2 Passkey-backed wallet:**
- When a customer claims their points, they create a **passkey** (WebAuthn/FIDO2)
- The passkey is stored on their device (biometrics, iCloud Keychain, etc.)
- SafiPoints derives the XRPL wallet from the passkey or manages signing via server-side HSM using passkey auth
- Customer never sees a seed phrase — authentication is biometric
- On a new device, they re-authenticate via passkey sync (iCloud/Google)

**Minimal implementation for demo:**
```
Step 1: Customer receives SMS with claim link
Step 2: Opens link, enters phone (for OTP)
Step 3: OTP verified → passkey enrollment prompt
Step 4: Passkey created on device
Step 5: SafiPoints creates/mints wallet, associates with passkey fingerprint
Step 6: Future redemptions: show passkey prompt, sign transaction
```

---

## Gap 7: NFT as DID / Ownership Proof (Not Value)

Pamphile noted: *"NFT use has shifted to DID/ownership proof rather than having value in itself."*

**V2 use of NFTs in SafiPoints:**
- **NOT** "this NFT is worth 100 SAFI"
- **YES** "this NFT proves you are a VIP member since March 2026"
- **YES** "this NFT is your receipt for 10 orders at Kilimanjaro Grill"
- **YES** "this NFT is your restaurant membership credential (DID)" — can be used to identify yourself at checkout without revealing phone number on-chain

Practical V2 use: when a customer reaches a tier milestone (Gold, Platinum), mint an **XLS-20 NFT** as a verifiable credential. The NFT proves tier status. The actual SAFI balance remains the token for redemption.

---

## Gap 8: Bugs Found in V1 (Fix Before Demo)

| File | Line | Bug |
|------|------|-----|
| `LoyaltyService.js` | 66–68 | `tierUpgrade.from` reads `customer.tier` *after* assignment — always shows new tier for "from" |
| `SafiSendBridge.js` | 175–177 | `findById(id) \|\| findOne(...)` chained on raw Mongoose Query objects — the short-circuit fails silently |
| `XRPLService.js` | 42–60 | Trust line submitted from `customer.wallet` but `wallet.classicAddress` used — if wallet object shape changes, silent failure |
| `TokenService.js` | 25–29 | `merchant.xrplSeedEnc` not selected (no `.select('+xrplSeedEnc')`) before `WalletService.restoreWallet` — throws on prod |
| `auth.js` | 106–110 | Customer registration requires `merchantId` — breaks if the customer registers independently before knowing a merchant |

---

## V2 Revised Architecture (The Full Picture)

```
┌─────────────────────────────────────────────────────────────────┐
│                     SafiPoints V2                                │
│                                                                  │
│  PHASE 1: EARN (zero friction)                                  │
│  ─────────────────────────────                                  │
│  Order paid at SafiSend                                          │
│  → SafiPoints records PendingPoints in MongoDB                   │
│  → Sends SMS: "You earned 150 SAFI. Claim within 6 months"      │
│  → No wallet, no keys, no on-chain tx yet                        │
│                                                                  │
│  PHASE 2: CLAIM (customer-initiated)                            │
│  ─────────────────────────────────                              │
│  Customer taps SMS link                                          │
│  → OTP / Passkey auth                                            │
│  → SafiPoints mints SAFI via MPT (not IOU, no trust line)        │
│  → PendingPoints → on-chain tokens in customer wallet            │
│  → Rate locked: KES 0.10/SAFI (or better for early claimers)    │
│                                                                  │
│  PHASE 3: REDEEM (at checkout)                                  │
│  ──────────────────────────────                                 │
│  Customer shows QR at SafiSend checkout                          │
│  → SafiPoints burns MPT tokens                                   │
│  → SafiSend applies KES discount (at LOCKED earn rate)           │
│  → XRPL tx hash = non-repudiable proof                          │
│                                                                  │
│  EXPIRY                                                          │
│  ───────                                                         │
│  6 months: claim window closes (pending → expired if unclaimed)  │
│  12 months: on-chain MPT tokens expire (configured at issuance)  │
│  SMS reminders at 5 months + 11 months                           │
│                                                                  │
│  PRIVACY                                                         │
│  ───────                                                         │
│  Phase 1: no on-chain presence (phone stays off-chain)           │
│  Phase 2: custodial (SafiPoints holds key, maps in encrypted DB) │
│  Phase 3: customer can export key / passkey-backed signing       │
│  On-chain: wallet address not linked to phone on XRPL            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap (V2)

### Week 1 (Pre-Demo Must-Haves)
- [ ] Add `PendingPoints` model and schema
- [ ] Refactor `SafiSendBridge.onPaymentCompleted` to create `PendingPoints` instead of immediately minting
- [ ] Build SMS claim flow (Twilio/Africa's Talking) with 6-month window
- [ ] Fix the 5 bugs identified in Gap 8
- [ ] Add idempotency key to earn events (`orderId + phone`)

### Week 2 (Demo Polish)
- [ ] Build `/claim/:token` page (OTP → mint SAFI)
- [ ] Implement rate-locking per PendingPoints record
- [ ] Add expiry cron job (mark expired PendingPoints)
- [ ] Switch to `earnRateAtTime` stored on PendingPoints
- [ ] Add cashback framing to UI ("KES 15 cashback" not "150 SAFI")

### Post-Demo (Mainnet Prep)
- [ ] Migrate from IOU to MPT
- [ ] Implement passkey-backed signing (WebAuthn)
- [ ] Build privacy address derivation scheme
- [ ] Add NFT minting for tier milestones (DID use case)
- [ ] Add MPT expiry configuration at issuance time

---

## Pitch-Ready Answer to "Why XRPL?"

> SafiPoints uses XRPL because it is the only system that can credibly give customers *ownership* of their rewards — not a promise that might change. Once you earn SAFI, it lives in your wallet. The restaurant cannot zero it out. It works at any enrolled restaurant, no re-linking required. And your earn rate is locked on-chain at the moment you order — so the longer you hold, the more your cashback is worth. That is something no database-backed loyalty system can credibly guarantee without trust.

---

*SafiPoints V2 — April 2026*
