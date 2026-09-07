# Payment hardening

This change keeps MERN and consolidates wallet accounting. It has been tested with an isolated MongoDB replica set and mocked payment providers. It has **not** been deployed or exercised against live payment accounts.

## What changed

- Customer and admin manual-credit endpoints are disabled. All Paystack confirmation aliases verify the reference with Paystack and require a deposit recorded before checkout.
- The web checkout first requests a server quote, displays the fee and net credit, and then opens the gateway checkout. Callback query parameters alone never imply success.
- Deposits validate owner, provider, reference, amount and NGN currency. The quoted credit, accounting entry and completed transaction commit together.
- `Wallet.balanceKobo` is the integer accounting balance. `balance` remains the naira compatibility field. Every new money movement writes a uniquely keyed `WalletEntry` within a database transaction. Existing valid balances are adopted on their first movement; no live data migration was performed.
- Purchases reserve funds and persist their request ID before sending to a provider. A timeout or unknown response stays pending. Confirmed failures refund once. Prepaid electricity never invents tokens.
- Clients send `Idempotency-Key`. Keep the same key when retrying an uncertain request. Reusing it with changed purchase details fails. Identical unresolved purchases are also deduplicated across different keys.
- Paystack webhook signatures are checked against original request bytes. Events are stored before acknowledgment, leased to the worker, and retried after crashes. After 12 failed attempts, events remain in `review` for investigation.
- The payment worker starts with the application and checks pending deposits and purchases. It requeries purchases; it never blindly buys again. Reconciliation can run on multiple instances; accounting remains idempotent.
- All withdrawal request aliases now create an admin-approved withdrawal request. Direct transfer/OTP routes and automatic withdrawal retry are unavailable. Pending or approved rejection refunds the full recorded debit including fees. Admin transitions and their audit entry commit together.
- Game balance changes and point redemptions use the same accounting transactions.
- Administrative routes require a current database admin role. Deleted accounts lose access. Customer catalog aliases remain available to authenticated customers.
- New PINs are bcrypt hashed; existing PINs migrate after successful verification. Changing an existing PIN requires the current PIN, and profile responses never return PINs or password hashes.
- Sessions persist in MongoDB. Production requires secrets and a full HTTPS CLIENT_URL. CORS uses exact production origins.

## Deployment requirements

1. Use MongoDB Atlas, another replica set, or a sharded cluster. Standalone MongoDB cannot run these accounting transactions; startup intentionally fails.
2. Back up the database and verify restoration to a separate environment. Do not run old and new application versions against the same wallet database during rollout: old code does not maintain `balanceKobo` or the ledger.
3. Run `npm run payment:preflight` against the intended database. This reads counts only. Resolve duplicate wallet owners, invalid balances, unquoted legacy deposits, and open legacy withdrawals before launch. Never invent a historical quote or refund: compare with provider statements and original records.
4. Startup creates unique indexes on wallet owner, transaction reference, purchase operation key, ledger key and event key. Existing duplicates must be reviewed, not automatically deleted.
5. Configure `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`, `CLIENT_URL` (including `https://`), payment credentials and provider records. Monnify also requires its contract code and API URL. Check production provider URLs explicitly; VTPass defaults may point to sandbox.
6. Set the Paystack webhook URL to `/api/users/wallet/deposit/paystack/webhook` on the production origin. Confirm the reverse proxy forwards the original body and signature header. Keep a web process running for the worker; a sleeping/free instance delays reconciliation.
7. Verify each enabled provider in staging: payment initialization, success, decline, timeout, status requery, correct pricing, token delivery, and duplicate notifications. The test suite mocks providers and does not certify their live configuration.
8. Run a small real deposit and purchase before inviting customers. Match wallet entries, customer credit, provider delivery and transaction history. This has not been done by the agent.

## Operations

- `npm test`: database concurrency, rollback, ownership, HTTP authorization, checkout, webhook retry, withdrawal refund and purchase timeout regression tests. The first run downloads a MongoDB binary; local ports are required. No production database or real gateway is used.
- `npm run build`: production frontend build. The existing large-bundle warning remains a performance follow-up.
- `npm run payment:preflight`: read-only database readiness and outstanding-payment summary. A nonzero exit means investigate the reported counts.
- Alert on `paymentevents.status = review`, purchases pending over 15 minutes, and failed worker logs. Never refund a provider timeout solely because time elapsed.
- After fixing the cause of an event failure, an operator can requeue its stored event by changing its status to `pending` and nextAttemptAt to the current time. Keep the original payload. Idempotent accounting makes replay safe.
- Legacy deposits without a credit quote and legacy withdrawals without ledger entries deliberately require review. Monnify deposits without a saved gateway reference also need provider reconciliation.
- A crash after reservation but before the provider call leaves a pending purchase. Query the provider by its saved request ID; investigate unknown results rather than automatically refunding or resending.
- Manual withdrawal completion assumes the administrator has verified the actual bank transfer. A processing failure/refund must only follow a confirmed failure. Automatic payout initiation is not part of this workflow.

## Remaining validation

This is a payment hardening pass, not a complete penetration test, load test or production-readiness certification. Live provider contract behavior, backups/restoration, production monitoring, broader account recovery, rewards/business rules, and all non-payment features still need review before a public launch.
