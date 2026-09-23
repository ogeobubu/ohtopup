# Testing rules

## How tests run

- Runner: Node’s built-in `node:test` + `node:assert/strict` (no Jest/Mocha at repo root).
- Command: `npm test` → `node --test tests/*.test.js`.
- DB: `mongodb-memory-server` with **MongoMemoryReplSet** (replica set required for transactions). First run may download a MongoDB binary; leave `binary.downloadDir` as the tests set it (or allow `/tmp/ohtopup-mongodb`).
- CI: `.github/workflows/verify.yml` runs `npm ci --ignore-scripts`, client ci, `npm test`, `npm run build`.

## What lives where

| File | Covers |
|------|--------|
| `tests/payments.test.js` | money unit conversion, concurrent debits, transaction rollback, deposit settle idempotency, ownership/authz, webhooks, withdrawals, purchase timeout/refund |
| `tests/pricing.test.js` | commission/discount math, caps, loss prevention, validation, public quote redaction, provider `actualCost` parsing |
| `tests/emailTransport.test.js` | Resend mapping, BCC protection, error sanitization, missing env |

## Writing tests

- Follow the existing style: CommonJS, `require('node:test')`, strict assert, minimal comments.
- Money tests must assert **ledger entries** (`WalletEntry`), not just `Wallet.balance` / `balanceKobo`.
- Prefer concurrency/`Promise.allSettled` and duplicate-callback cases over happy-path-only tests when touching payments.
- Isolate env: tests set `NODE_ENV=test`, stub `dotenv.config` / `node-cron` as `payments.test.js` does — never point tests at production URLs or real keys.
- Restore mocks/`process.env` in `t.after` / `after` so files stay order-independent.
- New payment/pricing/auth behavior → add coverage in the matching file; keep the full suite green.

## What not to do

- Do not add tests under paths that `.gitignore` excludes (`**/*.test.js` is ignored globally; only `tests/*.test.js` is re-included — put new root tests there).
- Do not use the real network, real Paystack/Monnify/VTpass, or a shared developer database.
- Do not snapshot entire HTTP error stacks.

## Running locally

```bash
npm test                          # full suite
node --test tests/pricing.test.js # single file
npm run payment:preflight         # read-only readiness against MONGODB_URI (optional)
cd client && npm run lint         # frontend lint when UI changes
npm run build                     # verify client production build when UI changes
```
