---
name: payment-regression
description: Run and fix the OhTopUp payment/wallet regression suite after changes to accounting, deposits, withdrawals, purchases, pricing, webhooks, or money-related routes. Use when a task touches services/accountingService, depositService, purchaseService, withdrawalService, pricingService, paymentEventService, or tests/payments.test.js and tests/pricing.test.js.
---

# Payment regression workflow

Use this whenever wallet, deposit, purchase, withdrawal, pricing, webhook, or ledger code changes.

## 1. Load rules

Read `.agents/rules/money.md` and skim `docs/PAYMENT_HARDENING.md` if the change is more than a typo.

## 2. Run tests

From the repo root:

```bash
npm test
```

If the suite fails only on binary download/network for mongodb-memory-server, retry once; do not weaken assertions.

Focused runs:

```bash
node --test tests/payments.test.js
node --test tests/pricing.test.js
```

## 3. Checklist before green

- [ ] Balance changes still go only through `accounting.transact` + `accounting.move` with a stable unique `key`.
- [ ] Concurrent duplicate callbacks/webhooks credit **once** (`WalletEntry` count = 1).
- [ ] Failed business writes roll back wallet **and** leave no orphan entries.
- [ ] Wrong owner/amount/currency/provider cannot credit a wallet.
- [ ] Purchase timeout stays pending / requery; confirmed failure refunds once; no invented tokens.
- [ ] Pricing cannot produce a configured loss; public quotes omit internal margin.
- [ ] No secrets or live URLs introduced.

## 4. Report

State which test files ran and the pass/fail result. If you intentionally changed a money invariant, update `.agents/rules/money.md` and `docs/PAYMENT_HARDENING.md` in the same change.
