# CLAUDE.md: New CP frontend, UI Option A (React + MUI)

Frontend for the New CP October CEO demo (3D Diagnostix). Option A is owned by Rashad (frontend intern); Option B is a separate UI by another developer over the same API. Mentor and code reviewer: Aya Adel.
Read first, in this order: `docs/PLAN.md`, `TASKS.md`, `GIT_WORKFLOW.md`, then the `OpenAPI` contract once it is in `docs/openapi/`. Keep this file under 200 lines.

## Never start a task before the developer says so
Only after the developer writes `start A<NN>` (for example `start A1`). Work on that task only. At its end run `npm run verify`, write the handoff, STOP. If a task needs something that does not exist yet (the contract, an endpoint, an approval), stop and say exactly what is missing.

## What we are building (one paragraph)
A Google-authenticated UI over the New CP API (Express + TypeScript + Drizzle + Zod on PostgreSQL V3). The demo flow is: log in, open the combined Models/Conversion report (counted by service **instance**), create/edit/reopen/transition a Models and a Conversion service with history, and show that two same-type instances in one order are independent. Invalid input must leave no partial record and show an actionable error. Attachments are display-only. Unauthorized or cross-tenant access is denied. Every screen has loading, empty and error states and works on desktop, tablet and mobile.

## Stack and commands (versions pinned in `package.json`; every dependency must be approved)
React + TypeScript strict + Vite, React Router, react-hook-form + zod, MUI (`@mui/material`, `@mui/x-date-pickers` only), dayjs, @fontsource fonts, `@mui/icons-material` only. No paid UI library. No second UI kit. No state library beyond React context/hooks (a data-fetching helper only if approved).
```
npm install            # only approved dependencies
npm run dev            # Vite dev server
npm run lint           # eslint with jsx-a11y
npm run typecheck      # tsc -b (strict)
npm run build          # vite build
npm run check-tokens   # fails on colour literals outside src/theme/tokens.ts
npm run test           # Vitest + React Testing Library (added in A11, after approval)
npm run verify         # lint + typecheck + build + check-tokens (+ test from A11); must pass before every handoff
```

## Folder structure (New CP standard)
```
docs/ PLAN.md  DEVIATIONS.md  EVIDENCE.md  ux-rationale.md  api-integration.md  openapi/
scripts/ check-tokens.mjs
src/
  main.tsx
  app/        App.tsx  providers.tsx  router.tsx  routes.ts  AuthBoundary.tsx
  features/   auth/  orders/  models/  conversion/  reporting/  settings/
  shared/     components/ (basic, composite, data-display, feedback, layout)  hooks/  lib/  status/  api/
  mocks/      handlers and fixtures shaped from the OpenAPI examples (never imported by production code except through api/)
  theme/      tokens.ts  theme.ts  components/  palette.ts  typography.ts
```
Features import from `@/shared/*`; features never import another feature's internals. Pages are default-exported and lazy; everything else uses named exports.

## API rules (contract-first)
- The OpenAPI contract is the only source for endpoints, fields and error shapes. **Never invent an endpoint or a field.** If the contract is silent, write it as a question in `docs/DEVIATIONS.md` and ask the developer.
- All network calls go through `src/shared/api/` (one typed client). Pages and components never call `fetch` directly.
- `VITE_USE_MOCKS=true` switches the client to `src/mocks/`. The mock must return contract-shaped data and contract-shaped errors (validation, prohibited transition, invoiced, locked by another user, 403/cross-tenant, 5xx).
- Frontend validation (zod) is only for usability; the server is authoritative. Always show server errors in the UI.
- Status values are provisional (Models: Awaiting Models, On its way, In Progress, Done. Conversion: No Scans, In Progress, Download). They live in ONE file, `src/shared/status/status.ts`. Never hard-code a status string elsewhere.

## The token rule
No colour literals (hex, rgb(), hsl(), named colours) outside `src/theme/tokens.ts`. Components use theme/palette references; JS-held colours come from the theme. Sizes, spacing, radius, elevation, motion and z-index come from tokens too. `check-tokens` enforces it. `sx` in features is for layout only (flex/grid/gap/responsive display using `theme.spacing`).

## Hard rules
- **Mock data only in this repo and in prompts.** Invent names, ids, emails, phones. No real patient, doctor, customer or clinic data, ever. Never open a database, never call staging or any real API unless the developer explicitly says the live API is ready for the current task (then use only the URL in `.env.local`).
- **No secrets** in any file, log, commit message or screenshot (tokens, passwords, keys, client secrets). `.env*` is git-ignored except `.env.example` with placeholders. If you meet a credential in a source, do not copy it; tell the developer (file name only).
- **Security rules from the team**: accounts are personal and are never shared; database access is for review only; no data is exported or shared with any AI tool. You never receive database data. If you are shown real data by mistake, stop and tell the developer.
- **[NEEDS VERIFICATION]**: state only what you can trace to a source (file:line, the contract, a document). Anything else is written `[NEEDS VERIFICATION]` and logged in `docs/DEVIATIONS.md`; never guess a status, field, role or rule.
- The two source POCs (`sources/mui`, `sources/poc-mui`) are **read-only**: copy files out of them, never edit them, never run their install or build.
- No dependency that is not approved. Tests (Vitest, React Testing Library, vitest-axe) are required by New CP standards but must not be installed until the developer confirms Aya's approval (A11).
- No `any` (use `unknown` + narrowing); no non-null `!` without a comment; no `@ts-ignore`; no `!important`; no `console.log` left in code.

## Quality expectations
Dockerfile, README, `.env.example`, tests (critical forms, validation display, states, permissions, responsive), GitHub Actions CI, SonarQube quality gate, lint/typecheck/build. These are scheduled in A10 to A14; do not skip them and do not bring them forward without the developer saying so.

## Accessibility and responsive minimums
Every control has a visible label or `aria-label`; error text linked with `aria-describedby`; focus always visible; dialogs trap focus and restore it; tables have headers (`scope`); status never by colour alone (icon + label); touch targets >= 40 px under 768; respect `prefers-reduced-motion`. Verify at 390, 768, 1024, 1440; no horizontal page scroll (tables become cards on phones); light and dark both checked.

## Code conventions
Files: components `PascalCase.tsx`, hooks `useThing.ts`, utilities `camelCase.ts`; one component per file; props typed as `<Component>Props`. Forms: react-hook-form + zod, an error summary on failed submit, a dirty guard on long forms. Icons: `@mui/icons-material`, sizes 16/20/24.

## Git rules (full text: `GIT_WORKFLOW.md`)
- One task = one branch = one commit = one PR. Branch names are in `TASKS.md`. Never commit or push to `main` or the integration branch.
- Start of task: `git rev-parse --is-inside-work-tree`, `git branch --show-current`, `git status --porcelain`; stop if not a repo, dirty, or an unexpected branch. Then exactly ONE mutating command: `git switch -c <branch>`.
- Never run add, commit, push, pull, fetch, merge, rebase, reset, restore, checkout, stash, tag, clean, config, or any force option. Read-only git is fine. The developer commits.
- End of task: `npm run verify`, save the message to `.handoff/task-A<NN>-commit.txt`, print the handoff block, STOP.

## AI_USAGE_LOG.md
After **each task**, immediately append a row: date, task id, what Claude did, what the developer changed or corrected, time spent, issues. Tick the task's "AI_USAGE_LOG.md updated" box.

## Start-of-task and end-of-task protocol
Start: wait for `start A<NN>` -> git checks -> `git switch -c <branch>` -> read the task in `TASKS.md` and the PLAN sections it cites -> work subtask by subtask (a verify command per subtask).
End: all subtasks ticked -> `npm run verify` -> update `docs/EVIDENCE.md` and the task log in `TASKS.md` (status only; hours by the developer) -> save the commit message -> handoff block -> STOP.
