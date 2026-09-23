# Money, wallet, and payment rules

Authoritative long-form doc: `docs/PAYMENT_HARDENING.md`. Read it before large payment changes.

## Invariants

1. `Wallet.balanceKobo` is the integer source of truth (kobo). `balance` is the naira compatibility field, always `balanceKobo / 100`.
2. Every money movement uses `accounting.transact(work)` + `accounting.move({ walletId, deltaKobo, key, reason, session })` in the **same** mongoose session as the business record (transaction, utility, withdrawal, reward, game debit, …).
3. Ledger key is unique (`WalletEntry.key`). Replaying the same key with the same delta is a no-op; conflicting reuse → 409.
4. Negative balances are impossible: `move` rejects when funds are insufficient or wallet is disabled.
5. Never call `wallet.save()` to adjust a balance outside `accountingService`.
6. Never enable or restore manual credit / manual-credit admin endpoints.
7. Callback query params alone never prove payment success — verify with the provider (`reference`, owner, amount, currency, provider).
8. Webhooks: verify signature against **original raw body**, store event before ack, process idempotently via `paymentEventService` / `paymentWorker`.
9. Deposits: quote first (fee + net credit), validate owner/provider/reference/amount/NGN, commit credit + entry + completed transaction together.
10. Purchases: reserve funds and persist provider request ID **before** calling the provider. Timeout/unknown → stay `pending` and requery. Confirmed failure → refund exactly once. Never invent prepaid electricity tokens.
11. Withdrawals: admin-approved request flow only. Rejection refunds full debit including fees, atomically with audit entry.
12. Client retries use the same `Idempotency-Key`; changing details under the same key fails.

## Pricing

- Rules live in `services/pricingService.js` + `PricingRule` model.
- `validateRule` rejects invalid rates/scope; `calculate` never produces a configured loss (flat/percentage/cap/discount).
- Public quotes must not leak `estimatedPlatformMargin`.
- Provider actual cost comes only from explicit response fields (`actualCost`); absent/bad values → `null`, not a guess.

## Currency & units

- Convert money at the boundary with `utils/money.js` (`toKobo`). It throws on fractional kobo, non-finite, unsafe, and non-positive-invalid inputs.
- Do not use floating-point naira math in comparisons; compare kobo integers.

## Operational

- `npm run payment:preflight` is **read-only** readiness; nonzero exit means investigate counts (duplicate wallets, invalid balances, legacy deposits/withdrawals, `review` events, stale pendings).
- Do not auto-delete duplicate references/owners — review against provider statements.
- Alert-worthy states: `paymentevents.status = review`, purchases pending > 15 min, worker failures.
- After fixing a failed event: requeue by setting status `pending` + due `nextAttemptAt`, keep original payload. Accounting idempotency makes replay safe.
- Never refund solely because time elapsed.

## When changing this area

- Extend `tests/payments.test.js` (and pricing tests) — concurrency, rollback, ownership, webhook/duplicate settle, purchase timeout.
- Run full `npm test`, not only the file you edited.
