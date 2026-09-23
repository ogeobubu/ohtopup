# Security rules

## Secrets

- Never read, echo, commit, or paste values from `.env` (or `client/.env`). Reference `.env.example` keys only as names.
- Never hardcode API keys, JWT secrets, session secrets, Firebase private keys, or gateway credentials in source, tests, fixtures, or docs.
- Error messages must not leak internals: no stack traces or secret-bearing provider bodies to clients (see email transport tests for the pattern: surface a safe reason, not credentials).

## AuthN / AuthZ

- JWT: HS256 via `JWT_SECRET`; `middleware/authMiddleware.js` verifies `Bearer` tokens and reloads the user (reject deleted accounts).
- Admin: `middleware/adminMiddleware.js` — require a live DB `admin` role, not a JWT claim alone.
- CSRF: SPA fetches `GET /api/csrf-token`; mutating requests follow the existing cookie/header pattern in `client/src/api`. Do not remove CSRF middleware from `app.js`.
- PINs/passwords: bcrypt only; never return PIN or password hashes in API responses.

## HTTP hardening (`app.js`)

- Keep `helmet`, CORS allowlists (exact production origins), rate limits, and body size limits (`express.json({ limit: '256kb', verify: ... })`) intact.
- The `verify` callback preserves raw body for Paystack webhook signature checks — do not remove it or switch to a JSON parser that discards raw bytes.
- CSP nonce is generated per request (`res.locals.nonce`); respect it in any new HTML/template responses.

## Payments & abuse

- Money routes keep `financialRateLimit` (per-user failed attempt limit).
- Webhooks: constant-time signature comparison against original bytes; reject mismatches before business handling.
- No endpoint may grant wallet credit from client-supplied amounts alone — server-side quote + provider verification only.
- Uploads/external URLs: none currently expected; if added, validate and avoid SSRF to internal hosts.

## Data & logging

- Do not log full request bodies on auth, wallet, webhook, or KYC-like routes.
- Do not log `Authorization` headers or session cookies.
- `SystemLog` / console output should use redacted summaries, not raw secrets.

## Dependencies & platform

- Deployed on Render (`render.yaml`): production needs HTTPS `CLIENT_URL` / `FRONTEND_URL` and secrets set in the dashboard — never commit them.
- If adding a dependency, prefer already-present packages; run the test suite afterward.
