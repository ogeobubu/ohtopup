# Frontend rules (React + Vite + Tailwind, `client/`)

## Layout

- Entry: `client/src/main.tsx` → `App.tsx`. Routing under `client/src/routes/`, pages under `client/src/pages/`.
- API calls: centralize in `client/src/api/` (`index.js`) — do not scatter raw `fetch`/`axios` URLs across components.
- State: Redux store in `client/src/store.js` with `actions/`, `reducers/`, `hooks/`.
- Styling: Tailwind (+ `tailwind.config.js`). Shared bits in `client/src/components/` and `client/src/components/ui/`.

## Conventions

- TSX for pages/components; keep existing file extensions (`.tsx` / `.js`) rather than mass-renaming.
- Vite dev proxies `/api` → `http://localhost:5001`. Call relative `/api/...` paths; never hardcode `localhost` in app code.
- Auth tokens: follow how `client/src/api` already attaches Authorization headers; do not log tokens.
- Money display: format from server-provided numbers; do not recompute balances client-side as source of truth.

## Build & lint

- From `client/`: `npm run build` (also `npm run build` at repo root via `postinstall`).
- Lint: `cd client && npm run lint` (flat config in `client/eslint.config.js`).
- The root production build installs and builds the client — treat client breakage as a deploy blocker.

## UI expectations

- Match the visual language of neighboring pages (existing spacing, card/table components `dataTable`, `transactionTable`, `modernPagination`).
- Prefer editing existing components over introducing a new UI library.
- Responsive behavior matters (see `docs/responsive-design.md`); check narrow widths for new layouts when practical.
- Do not commit screenshots, `.DS_Store`, or `dist/`.

## Gotchas

- `*.test.js` patterns are gitignored at the repo level but `tests/*.test.js` is force-included — frontend tests are not part of the root `npm test` glob (`tests/*.test.js` only).
- Odd `*.crswap` files exist from prior tooling — leave them unless the task is cleanup.
