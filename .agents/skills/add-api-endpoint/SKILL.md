---
name: add-api-endpoint
description: Standard checklist for adding or changing an HTTP API endpoint on the OhTopUp Express backend (routes, controllers, services, middleware, idempotency). Use when creating new routes, mounting routers in app.js, or altering wallet/user/admin API surfaces.
---

# Add or change an API endpoint

## Rules to load first

- `.agents/rules/backend.md`
- If money is involved: `.agents/rules/money.md`
- If auth/headers change: `.agents/rules/security.md`

## Steps

1. **Route** — add handlers under `routes/`; mount in `app.js` only for a new router. Paths are typically under `/api/...`.
2. **Middleware** — order matters:
   - public vs `authMiddleware` (`Bearer` JWT)
   - `adminMiddleware` for admin ops
   - `financialRateLimit` + `walletSubject` for money/pin-sensitive ops
3. **Controller** — parse input, `toKobo` at the edge for amounts, call services, use `{ status, message }` errors handled by `errorHandler`.
4. **Service** — all side effects and provider calls; money via `accountingService` in the same session as business records.
5. **Idempotency** — retried-safe operations accept `Idempotency-Key` (or equivalent unique operation key) and dedupe.
6. **Response shape** — match neighboring endpoints (`{ message }` errors, existing success payloads). Never return PIN/password hashes.
7. **Tests** — for payment/authz behavior, extend `tests/payments.test.js` or the relevant suite; run `npm test`.
8. **Frontend (if consumed)** — add the call in `client/src/api/`, not ad-hoc `fetch` in pages.

## Do not

- Trust client-supplied `userId` for wallet ownership.
- Skip CSRF/CORS/rate-limit middleware “just for this route”.
- Log raw bodies on auth or webhook routes.
