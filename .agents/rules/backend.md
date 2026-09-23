# Backend rules (Express + Mongoose)

## Layering

`routes → middleware → controllers → services → model`

- **Routes** only wire paths + middleware. No business logic.
- **Controllers** parse/validate input, call one or more services, map results to HTTP. They must not open ad-hoc mongoose sessions for money movement.
- **Services** own business rules, external provider calls, and transactions. Prefer extending an existing service over creating a new one-off.
- **Models** hold schema + indexes only.

## Conventions

- CommonJS (`require` / `module.exports`) on the backend; no ESM in root server code.
- Match the style of the neighboring file (quotes, async style, error patterns). Prefer small, focused edits over reformatting.
- Errors thrown as `{ status, message }` or `Error` with `status` are handled by `middleware/errorHandler.js` (`handleServiceError`). Use that shape instead of ad-hoc `res.status(...).json(...)` for service-level failures when the surrounding code does.
- Validation: use `services/validationService.js` where it already exists; otherwise validate at the controller edge and fail closed.

## Auth & middleware

- Customer routes: `require('../middleware/authMiddleware')` — Bearer JWT, HS256, loads `req.user = { id, role, email }`.
- Admin routes: also `adminMiddleware` — role must be `admin` in DB; deleted accounts lose access.
- Money-touching routes: apply `financialRateLimit` and `walletSubject` as neighboring wallet routes do — do not skip them on new money endpoints.
- Never trust query/body alone for ownership; resolve the wallet/subject server-side.

## External providers

- Gateways: Paystack, Monnify (`services/paymentGatewayService.js`, deposit/wallet controllers).
- Utilities: VTpass, Club Konnect (`vtpassService.js`, `clubkonnectService.js`).
- Prefer sandbox URLs from env; never hardcode live keys or switch a sandbox URL to live without explicit confirmation.
- Provider responses: never invent fields. Parse only what the provider returned; treat missing/invalid amounts as `null` and investigate (see pricing `actualCost`).

## Adding an endpoint (checklist)

1. Route in `routes/`, mounted in `app.js` if new router.
2. Controller + service logic; money via `accountingService` only.
3. Auth/admin/financial middleware as appropriate.
4. Idempotent handling for anything that can be retried.
5. Add/extend a test in `tests/` when behavior is payment-, pricing-, or auth-related.
6. Do not log secrets, tokens, PIN hashes, or full provider payloads.

## Gotchas

- `nodemon.json` ignores `client/` — frontend changes do not restart the API.
- Vite proxies `/api` to port **5001**; keep backend `PORT` consistent with local proxy when debugging the SPA.
- Some controllers still have legacy aliases (e.g. wallet routes). Prefer the hardened path documented in `docs/PAYMENT_HARDENING.md` over reintroducing removed direct-credit/OTP flows.
