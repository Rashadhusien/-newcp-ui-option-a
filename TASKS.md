# TASKS: New CP frontend, UI Option A

**Do not start any task until the developer says `start A<NN>`.** One task = one branch = one commit = one PR (see `GIT_WORKFLOW.md`). Base: the integration branch (name to confirm). Update `AI_USAGE_LOG.md` right after every subtask group.
Sources of truth: `docs/PLAN.md`, the OpenAPI contract in `docs/openapi/` (when received), `CLAUDE.md`. Unknown means `[NEEDS VERIFICATION]`; log gaps in `docs/DEVIATIONS.md`.
Total estimate: **24 h** (4 h/day, 20-27 Oct 2026).

## Task A1: Bootstrap the repo from the existing mui POC
Branch: build/fe-a-a01-bootstrap | Gate: D1 | Date: Tue 20 Oct | Estimate: 2.0 h | Depends on: sources available | Status: ready for review
Goal: an empty-but-correct New CP frontend whose `npm run verify` passes, in the New CP folder layout, with only the features the demo needs.
- [x] A1.1 Inventory the sources read-only and write `docs/DEVIATIONS.md` section "Reuse map": for every file copied say source path, destination, and why. Do not copy anything not listed in PLAN section 6 without writing the reason. Verify: the file exists and every copied file appears in it.
  - [x] AI_USAGE_LOG.md updated
- [x] A1.2 Create the project: `package.json` (name `newcp-frontend-a`, Node engine, scripts per CLAUDE.md except `test`), Vite + React + TS strict config, `@/` path alias, `index.html` with the pre-paint theme script, eslint flat config with jsx-a11y and react-hooks. Take versions from `sources/mui/package.json` and remove unused packages (react-odontogram, x-charts, fontsource families not used). No new dependency. Verify: `npm install && npm run lint`.
  - [x] AI_USAGE_LOG.md updated
- [x] A1.3 Copy and re-home the base code into `src/app`, `src/theme`, `src/shared/{components,hooks,lib,status}` and an empty `src/features/{auth,orders,models,conversion,reporting,settings}` (each with a placeholder route page). Fix imports to `@/shared/...`. Delete the unused features, seed JSON, teeth chart, kanban and charts from the copy (never from the sources). Keep a minimal AppShell, Sidebar, Header, theme (light/dark/system) and the 404 page. Verify: `npm run typecheck && npm run build`.
  - [x] AI_USAGE_LOG.md updated
- [x] A1.4 Port `scripts/check-tokens.mjs` (adapt to `src/theme/tokens.ts`) and `scripts/contrast.mjs`; fix any colour literal found outside tokens. Verify: `npm run check-tokens`.
  - [x] AI_USAGE_LOG.md updated
- [x] A1.5 Write `README.md` (what it is, requirements, run, scripts, folder map, how to switch mocks/live), `.env.example` (`VITE_API_BASE_URL`, `VITE_USE_MOCKS`, `VITE_GOOGLE_CLIENT_ID` with placeholders only), `.gitignore` per GIT_WORKFLOW, `docs/EVIDENCE.md` and `AI_USAGE_LOG.md` templates. Verify: `npm run verify`.
  - [x] AI_USAGE_LOG.md updated
Done when: `npm run verify` is green; the app starts on a login placeholder with the shell; light and dark both render; no unused feature code remains; DEVIATIONS lists every deviation.

## Task A2: OpenAPI review, typed client, contract-shaped mocks
Branch: feat/fe-a-a02-api-client-mocks | Gate: D1 | Date: Tue 20 Oct | Estimate: 1.5 h | Depends on: A1; OpenAPI draft | Status: in progress (A2.4 done; A2.1 pre-contract questions B1-B10 from the V3 docs recorded, D-16 to D-20; A2.1 contract review, A2.2, A2.3 blocked on the contract, D-12)
- [ ] A2.1 Read the contract in `docs/openapi/`; write the question list for Bishoy in `docs/DEVIATIONS.md` (missing fields, statuses, error shapes, pagination, auth). Verify: list reviewed by the developer.
- [ ] A2.2 `src/shared/api/`: typed client (fetch wrapper, base URL, auth header from session, error normalisation into one `ApiError` with kind: validation, transition, invoiced, locked, forbidden, unauthorized, server, network), types matching the contract. Verify: `npm run typecheck`.
- [ ] A2.3 `src/mocks/`: handlers and fixtures from the contract examples, including every error kind and a duplicate-instances order; `VITE_USE_MOCKS` switch; latency and failure injection (`?fail=1`). Verify: a dev page or console check shows each error kind.
- [x] A2.4 `src/shared/status/status.ts` single status mapping with label, icon and tone. Verify: `npm run verify`.
Each subtask: - [ ] AI_USAGE_LOG.md updated

## Task A3: Breakdown and kickoff (developer-owned, no Claude work)
The developer sends the breakdown to Aya and raises Q1 to Q7. Claude only helps with wording if asked.

## Task A4: Google login and protected routes
Branch: feat/fe-a-a04-auth-guard | Gate: D2 | Date: Wed 21 Oct | Estimate: 2.0 h | Depends on: A1, A2; auth contract (Q3) | Status: not started
- [ ] A4.1 Login page (Google sign-in button, error and loading states, no secrets in code; client id from env). Mock session when `VITE_USE_MOCKS=true`.
- [ ] A4.2 Session provider, `AuthBoundary` route guard, redirect with return path, logout, session-expired handling (401 anywhere sends the user to login).
- [ ] A4.3 Unauthorized and forbidden pages; user menu with the current user only (no role simulator in production code).
Done when: an unauthenticated user cannot open any app route; the guard is covered by a manual check (tests arrive in A11).

## Task A5: Combined Models/Conversion report on mocks
Branch: feat/fe-a-a05-report-shell | Gate: D2 | Date: Wed 21 Oct | Estimate: 2.0 h | Depends on: A2 | Status: ready for review (on provisional fixtures, D-13)
- [x] A5.1 Reporting feature: table counted by service **instance** (one row per instance, not per order), columns: order, client, patient code, service type, option, arch, quantity, status chip (icon + label), due date, priority.
- [x] A5.2 Filters (service type, status, text search), sort, paging, state in the URL (`useQueryState` style), counts per status.
- [x] A5.3 Loading, empty, error-with-retry states; PriorityTable/cards on phones, no horizontal scroll at 390/768/1024/1440.
Done when: counts equal instances in the mock data (a mock order with two same-type instances adds two rows).

## Task A6: Models create/edit form
Branch: feat/fe-a-a06-models-form | Gate: D3 | Date: Thu 22 Oct | Estimate: 2.5 h | Depends on: A2, A5; Models endpoints (Q1) | Status: not started
- [ ] A6.1 Form (react-hook-form + zod) for add and edit; labels, `aria-describedby` errors, dirty guard, Cancel.
- [ ] A6.2 Error summary on failed submit; server error mapping (validation field errors, invoiced, locked by another user) with actionable text; nothing is added to the report on failure.
- [ ] A6.3 Save then reopen shows the saved values; success toast; report refreshes.

## Task A7: Models details, transition, history
Branch: feat/fe-a-a07-models-details-history | Gate: D3 | Date: Thu 22 Oct | Estimate: 1.5 h | Depends on: A6; history and transition endpoints (Q2) | Status: not started
- [ ] A7.1 Details page: service info, order context (patient code only), existing attachments display-only.
- [ ] A7.2 Allowed-next-status action only; prohibited-transition message leaves the status unchanged; confirm dialog where destructive.
- [ ] A7.3 History timeline (newest first, who/when, status change and field edits).

## Task A8: Conversion create/edit/transition/history
Branch: feat/fe-a-a08-conversion | Gate: D4 | Date: Sun 25 Oct | Estimate: 2.0 h | Depends on: A6, A7; Conversion endpoints | Status: not started
- [ ] A8.1 Conversion form on the same form host; fields and options from the contract.
- [ ] A8.2 Transition, details and history reuse the A7 components.
- [ ] A8.3 Same error handling as Models; report shows Conversion rows.

## Task A9: Same-type duplicate instances and access control
Branch: feat/fe-a-a09-duplicates-access | Gate: D4 | Date: Sun 25 Oct | Estimate: 2.0 h | Depends on: A8; seeded duplicate case (Q5) | Status: not started
- [ ] A9.1 Two instances of one type in one order: distinct IDs shown, edit or transition one and the other stays unchanged, separate history.
- [ ] A9.2 403 and cross-tenant denied state (no data leakage in the message); disabled actions with an explanation when the user lacks permission.
- [ ] A9.3 Manual check script for the D4 demo.

## Task A10: Live API integration
Branch: feat/fe-a-a10-live-api | Gate: D5 | Date: Mon 26 Oct | Estimate: 1.5 h | Depends on: backend endpoints deployed (Q4) | Status: not started
- [ ] A10.1 Switch report and forms to the live API; fix contract drift (record each mismatch in DEVIATIONS and tell Bishoy).
- [ ] A10.2 Write `docs/api-integration.md` (endpoints used, error mapping, how to switch mock/live, known gaps).

## Task A11: Tests
Branch: test/fe-a-a11-tests | Gate: D5 | Date: Mon 26 Oct | Estimate: 2.0 h | Depends on: A6 to A9; approval of Vitest/RTL (Q7) | Status: not started
- [ ] A11.1 Install the approved test dependencies only after the developer confirms approval. Configure Vitest + jsdom + RTL; `npm run test`; add to `verify`.
- [ ] A11.2 Tests: critical forms (Models, Conversion), validation display, loading/empty/error states, permissions (guard, disabled actions), responsive layout switch. Use mock data only.

## Task A12: CI and quality gate
Branch: ci/fe-a-a12-ci-sonar | Gate: D5 | Date: Mon 26 Oct | Estimate: 0.5 h | Depends on: A11; Sonar access | Status: not started
- [ ] A12.1 GitHub Actions: install, lint, typecheck, test with coverage, build. [ ] A12.2 `sonar-project.properties` and the quality-gate step; no secrets in the repo (tokens come from repository secrets).

## Task A13: Docker and documentation
Branch: build/fe-a-a13-docker-docs | Gate: D6 | Date: Tue 27 Oct | Estimate: 1.5 h | Depends on: A12 | Status: not started
- [ ] A13.1 Multi-stage Dockerfile + nginx config (SPA fallback), `.dockerignore`. [ ] A13.2 README final (run, env, test, docker). [ ] A13.3 `docs/ux-rationale.md`: how Option A differs from Option B and why.

## Task A14: Stabilize and release candidate
Branch: fix/fe-a-a14-stabilize-rc | Gate: D6 | Date: Tue 27 Oct | Estimate: 2.5 h | Depends on: A13; feature freeze | Status: not started
- [ ] A14.1 Fix review and Sonar findings. [ ] A14.2 Run the demo acceptance checklist and the rehearsal script. [ ] A14.3 Propose the RC tag to the developer (Claude never tags).

## Phase log
| Task | Status | Notes |
|---|---|---|
| A1 | ready for review | verify green; awaiting developer commit and PR |
| A2 | in progress | A2.4 done; V3 findings + questions B1-B10 recorded (part 2a); contract review, client and mocks blocked: no OpenAPI draft |
| A5 | ready for review | built on provisional fixtures (D-13); swap to mocks when A2 resumes |
| A3, A4, A6 to A14 | not started | status only; hours are written by the developer |
