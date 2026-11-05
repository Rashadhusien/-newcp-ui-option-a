# New CP frontend: UI Option A

React + MUI frontend for **New CP**, the rebuild of the 3D Diagnostix Case Portal, built for the October 2026 CEO demo. It talks to the New CP API (Express + TypeScript + Drizzle + Zod on PostgreSQL V3) through one typed client, against the OpenAPI contract in `docs/openapi/`.

Option A is one of two independent UIs over the same API. The plan, demo scope and open questions are in [docs/PLAN.md](docs/PLAN.md); the tasks are in [TASKS.md](TASKS.md).

## Requirements
- Node.js 22.12 or newer (`engines` in `package.json`)
- npm 10 or newer

## Run
```bash
npm install
cp .env.example .env.local   # then edit; placeholders only in git
npm run dev                  # http://localhost:3000 (real backend + Google sign-in)
npm run dev:mock             # http://localhost:3000 (mock data, no backend)
```
Until Google login lands (A4), the login page has a single **Sign in (mock)** button.

## Scripts
| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:3000 with the real backend and Google sign-in: mocks off, `/api` proxied to the test server; values in the git-ignored `.env.integration.local` (see `.env.example`). Without that file it falls back to mocks. |
| `npm run dev:mock` | Same port with mock data only (rehearsal, no VPN needed) |
| `npm run lint` | ESLint (TypeScript strict-type-checked, react-hooks, jsx-a11y) |
| `npm run typecheck` | `tsc -b` in strict mode |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check-tokens` | Fails on any colour literal outside `src/theme/tokens.ts` |
| `npm run test` | Unit and component tests (Vitest + React Testing Library, jsdom) |
| `npm run verify` | lint + typecheck + build + check-tokens + test; must pass before every PR |

Contrast helper: `node scripts/contrast.mjs "#RRGGBB" "#RRGGBB"` prints the WCAG ratio.

## Mocks or live API
Set `VITE_USE_MOCKS` in `.env.local`:
- `true`: the API client answers from `src/mocks/` (contract-shaped data and errors). Available from A2.
- `false`: the client calls `VITE_API_BASE_URL`. Use this only when the team says the live API is ready.

Restart `npm run dev` after changing `.env.local`.

## Folder map
```
docs/        PLAN, DEVIATIONS (reuse map, deviations, questions), EVIDENCE, openapi/
scripts/     check-tokens.mjs, contrast.mjs
src/
  main.tsx   entry: fonts, root render
  app/       App, providers (theme, dates, toasts, router), router (lazy pages), routes, AuthBoundary, 404
  features/  auth, orders, models, conversion, reporting, settings (one lazy page each)
  shared/    components/{basic,composite,data-display,feedback,layout}, hooks, lib, status, api (A2)
  mocks/     contract-shaped handlers and fixtures (A2)
  theme/     tokens.ts (the only file with colours), theme.ts, palette.ts, typography.ts, components/
```
Rules for contributors (and the AI assistant) are in [CLAUDE.md](CLAUDE.md) and [GIT_WORKFLOW.md](GIT_WORKFLOW.md).
