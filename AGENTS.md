# OhTopUp — agent instructions

Nigerian airtime/data/cable/electricity top-up platform. MERN monorepo-style app: Express + MongoDB backend at the repo root, React + Vite + Tailwind frontend in `client/`.

Use this file as the entry point. Load the detailed rule files in `.agents/rules/` on demand for the area you are touching — do not dump them all into context unless relevant.

## Commands

- Install backend deps: `npm install`
- API dev server (nodemon): `npm run dev` (watches `app.js`, `routes/`, `controllers/`, `model/`, `middleware/`, `config/`, `utils/`)
- Frontend dev: `npm run client` (Vite on `:5173`, proxies `/api` → `http://localhost:5001`)
- Both together: `npm run dev:all`
- Tests (Node test runner + mongodb-memory-server): `npm test`
- Payment preflight (read-only DB checks): `npm run payment:preflight`
- Production frontend build: `npm run build` (also runs on `postinstall`)
- Client lint: `npm run lint` in `client/`

There is no backend ESLint/typecheck script — keep backend style consistent with neighboring files.

## Repo map

| Path | Role |
|------|------|
| `app.js` | Express entry: security middleware, session, route mounting, static client serve |
| `routes/` | Express routers (`walletRoutes.js`, `authRoutes.js`, `adminRoutes.js`, …) |
| `controllers/` | Request handlers; thin-ish layer over services |
| `services/` | Business logic: `accountingService`, `depositService`, `purchaseService`, `paymentEventService`, `pricingService`, `walletService`, `withdrawalService`, `emailTransport`, … |
| `model/` | Mongoose models (`Wallet`, `WalletEntry`, `Transaction`, `PaymentEvent`, `Utility`, `User`, …) |
| `middleware/` | `authMiddleware` (JWT HS256), `adminMiddleware`, `financialRateLimit`, `walletSubject`, `errorHandler` |
| `client/` | React SPA: `src/pages`, `src/api`, `src/store.js`, Vite config |
| `tests/` | Payment/pricing/email regression tests (kept in git despite general `*.test.js` ignore rules) |
| `scripts/` | Ops/seed scripts including `payment-preflight.js` |
| `docs/` | Longer-form docs; payment rules live in `docs/PAYMENT_HARDENING.md` |

## Non-negotiables

1. **Money integrity** — all balance changes go through `services/accountingService.js` (`transact` + `move`) with a unique ledger key, inside the same DB transaction as the business record. Never mutate `Wallet.balance` / `balanceKobo` directly. Read `.agents/rules/money.md` before touching wallets, deposits, withdrawals, purchases, or pricing.
2. **MongoDB must be a replica set** — multi-document transactions require it; standalone Mongo is intentionally rejected at startup.
3. **Never invent money outcomes** — no manual credits, no refund on timeout alone, no fake electricity tokens, no pricing that creates a configured loss.
4. **Secrets** — never read, print, commit, or hardcode `.env` values. Use `.env.example` as the template only.
5. **Idempotency** — payment callbacks/webhooks and purchase retries must stay idempotent; clients send `Idempotency-Key`.

## How to load deeper rules

When you start work in an area, read the matching file under `.agents/rules/`:

- Backend/API/routes/services/controllers → `.agents/rules/backend.md`
- Money, payments, wallets, pricing, withdrawals → `.agents/rules/money.md` (and `docs/PAYMENT_HARDENING.md`)
- `client/` UI → `.agents/rules/frontend.md`
- Auth, headers, CORS, rate limits, secrets → `.agents/rules/security.md`
- Writing or fixing tests → `.agents/rules/testing.md`

Skills (reusable workflows) live in `.agents/skills/*/SKILL.md`. Prefer loading a skill over reinventing the checklist when one matches the task.

## Definition of done

- Relevant `npm test` cases pass (payment changes must keep the full suite green).
- No secrets in the diff; no drive-by refactors outside the task.
- Backend money paths: ledger entry written, idempotent under concurrent calls.
- Frontend: build still works if you touched `client/` (`npm run build`).
