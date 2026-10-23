# TASKS: New CP frontend, UI Option A

**Do not start any task until the developer says `start A<NN>`.** One task = one branch = one commit = one PR (see `GIT_WORKFLOW.md`). Base: `develop` (name to confirm, G7); stack on the previous branch while its PR is unmerged. Update `AI_USAGE_LOG.md` right after every subtask group.
Sources of truth (highest first): the v0.9 handoff package in `docs/newcp-ai/`, `CLAUDE.md`, `docs/PLAN.md`. Unknown means `[NEEDS VERIFICATION]`; log gaps in `docs/DEVIATIONS.md`.
Total: **24 h** (4 h/day, 20-27 Oct 2026). Re-baselined 23 Oct (A00), then again after Bishoy's v1 contract: 13.5 h of work for 12 h left (25-27 Oct) after folding A9R into A7R and reducing A5R; cut order for the last 1.5 h in PLAN section 8.

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
Branch: feat/fe-a-a02-api-client-mocks | Gate: D1 | Date: Tue 20 Oct | Estimate: 1.5 h | Depends on: A1; OpenAPI draft | Status: closed 23 Oct (A2.4 done; V3 findings and B1-B10 recorded as part 2a; A2.1-A2.3 superseded by A00 and A2R, because the v0.9 package delivered the contract)
- [ ] A2.1 Read the contract in `docs/openapi/`; write the question list for Bishoy in `docs/DEVIATIONS.md` (missing fields, statuses, error shapes, pagination, auth). Verify: list reviewed by the developer.
- [ ] A2.2 `src/shared/api/`: typed client (fetch wrapper, base URL, auth header from session, error normalisation into one `ApiError` with kind: validation, transition, invoiced, locked, forbidden, unauthorized, server, network), types matching the contract. Verify: `npm run typecheck`.
- [ ] A2.3 `src/mocks/`: handlers and fixtures from the contract examples, including every error kind and a duplicate-instances order; `VITE_USE_MOCKS` switch; latency and failure injection (`?fail=1`). Verify: a dev page or console check shows each error kind.
- [x] A2.4 `src/shared/status/status.ts` single status mapping with label, icon and tone. Verify: `npm run verify`.
Each subtask: - [ ] AI_USAGE_LOG.md updated

## Task A3: Breakdown and kickoff (developer-owned, no Claude work)
The developer sends the breakdown to Aya and raises Q1 to Q7. Claude only helps with wording if asked.

## Task A4 (20 Oct version): Google login and protected routes
Status: superseded 23 Oct by "Task A4: Auth (reduced)" below (0.5 h); real Google sign-in blocked (R06). A4.2 guard parts already exist from A1.
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

## Tasks A6 to A10 (20 Oct versions): superseded
Replaced on 23 Oct by A6R, A7R, A8R, A9R and A10 (blocked) below, because the v0.9 package changed the fields, statuses, Bill To and contract (D-22 to D-27).

## Task A00: Adopt the v0.9 handoff package (docs only)
Branch: docs/fe-a-a00-adopt-handoff-v09 (stacked on docs/fe-a-a02-v3-findings) | Date: 23 Oct | Estimate: 0.5 h | Status: ready for review
- [x] A00.1 Merged `CLAUDE.md` (approved text) and root `AGENTS.md` pointer.
- [x] A00.2 Re-baselined `docs/PLAN.md` and this file (16 h, cut order, A9R-into-A7R rule).
- [x] A00.3 `docs/DEVIATIONS.md`: superseded items, contract gaps, R01-R14 status, questions G1-G7 and Q-B1-Q-B7.
- [x] AI_USAGE_LOG.md updated

## Task A2R: Shared API client, mock adapter, status mapper, test runner
Branch: feat/fe-a-a02r-api-adapter | Date: 23/25 Oct | Estimate: 2.0 h | Depends on: A00; G1 for the test runner | Status: ready for review
- [x] A2R.1 `src/shared/api/`: client ported from `newcp-demo-client-f07.ts` with types from the OpenAPI (CatalogService, FormDefinition, ServiceItem, AvailableTransition, HistoryEvent, BilledPartyChoice, Problem); token source; `ApiError` normalised from `Problem` + status (400/401/403/404/409/422/5xx/network).
- [x] A2R.2 `src/features/services/data/serviceApi.ts`: one interface, mock implementation on the F07 synthetic fixtures (two same-type items with different payers, every error status, latency, `?fail=`); real implementation wired to the client but off (`VITE_USE_MOCKS`). Evidence label MOCK/INTEGRATED.
- [x] A2R.3 Rewrite `src/shared/status/status.ts` as a mapper (API value -> label/icon/tone, neutral fallback); remove the provisional statuses; adapt `StatusBadge` and the report.
- [x] A2R.4 After G1: Vitest + jsdom + React Testing Library; `npm run test` in `verify`; unit tests for the client error mapping, the mock adapter and the status mapper.
- [x] AI_USAGE_LOG.md updated

## Task A2C: Adopt contract v1 in the code
Branch: feat/fe-a-a2c-contract-v1 | Date: 25 Oct | Estimate: 1.0 h | Depends on: contract v1 docs PR | Status: ready for review
- [x] A2C.1 `src/shared/api/types.ts` to v1: `FormAnswer { fieldCode, value?, optionCodes? }`; Create/Patch add `quantity`, `isBillable`, `zeroChargeReasonCode`, `zeroChargeNote`; Patch adds `holdType`, `holdReasonCode`; `ServiceItem` adds the money breakdown, hold, zero-charge, `redoOfItemUuid`, `createdAt`, `updatedAt` (and the new required fields); `ZeroChargeReason`, `HoldReason`.
- [x] A2C.2 Client: `zeroChargeReasons()`, `holdReasons(holdType?)`; mock: lookups with synthetic codes, new item fields, `holdType` only while `on_hold`, quantity >= 1.
- [x] A2C.3 Update the tests; `npm run verify`.
- [x] AI_USAGE_LOG.md updated

## Task A6R: Service forms (Biomodel and Conversion, all controls)
Branch: feat/fe-a-a06r-service-forms | Date: 25 Oct | Estimate: 3.0 h | Depends on: A2C | Status: ready for review
- [x] A6R.1 Typed field definitions from `form_biomodel.json` (28) and `form_conversion.json` (21), served by the mock `formSchema`; one form host (react-hook-form + zod) rendering radio/select/text/number/boolean with labels and `aria-describedby`.
- [x] A6R.2 Conditional and nested controls (digital design deliverables, printer brand/model, arch customisation and colour, software/format, model scan -> intra-oral); only UI-attached validators (VAL-CONV-001/002/004/005, VAL-BIO-001/002/003); VAL-CONV-003 as a warning.
- [x] A6R.3 Create on an existing order (new UUID even for the same type, `Idempotency-Key` per intentional create); answers in the v1 model (`optionCodes` for every choice, `value` otherwise); edit via PATCH answers; 422 field details mapped to fields; error summary; dirty guard; no success without a persisted response.
- [x] AI_USAGE_LOG.md updated

## Task A7R: Service instance detail, staff fields, transitions, history, independence
Branch: feat/fe-a-a07r-instance-detail | Date: 25/26 Oct | Estimate: 3.0 h (includes A9R) | Depends on: A6R | Status: not started
- [ ] A7R.1 Order services list: one row per instance with UUID (short) and line number; open one instance.
- [ ] A7R.2 Staff fields via PATCH: Redo and redo-of, service notes, pending reason, quantity, billable, zero-charge reason (lookup) and note, hold type and reason (lookup, only while on hold). Read-only and labelled: unit price, currency, rush, cost, fields/discount/voucher amounts, line total.
- [ ] A7R.3 Status: actions from `available-transitions` only (label from the API), confirm, 409/422 leave the status unchanged; history timeline from the history endpoint.
- [ ] A7R.4 (was A9R) Two same-type instances stay independent (edit, transition, payer); 401 -> login, 403 -> read-only, tenant-masked 404 without data leakage.
- [ ] AI_USAGE_LOG.md updated

## Task A8R: Service-level Bill To (F07, mock)
Branch: feat/fe-a-a08r-bill-to | Date: 26 Oct | Estimate: 1.0 h | Depends on: A7R | Status: not started
- [ ] A8R.1 Doctor/Scanning Center selector from `eligible-billed-parties`; `billedToContactUuid` for ONE service on create/patch; never send provenance or tenant; never copy an order-level Bill To.
- [ ] A8R.2 `canEditBilledParty` -> read-only with an explanation; 403/409/422 rendered; no success unless persisted; real save disabled until the F07 gate (shown in the UI).
- [ ] AI_USAGE_LOG.md updated

## Task A9R: Same-type independence and denied states
Status: folded into A7R (A7R.4) on 23 Oct to fit 12 h; no separate branch.

## Task A5R: Report re-key
Branch: feat/fe-a-a05r-report-rekey | Date: 26 Oct | Estimate: 0.5 h | Depends on: A2C | Status: not started
- [ ] A5R.1 Remove obsolete fields (option, arch, quantity, `ORD-` strings, provisional statuses); rows from the mock adapter's service items; status via the mapper; MOCK label; no report endpoint yet (G3).
- [ ] AI_USAGE_LOG.md updated

## Task A11: Tests
Branch: test/fe-a-a11-tests | Date: 26 Oct | Estimate: 2.0 h | Depends on: A6R, A7R, A8R | Status: not started
- [ ] A11.1 Component tests: form conditions and attached validators, 422 mapping, Bill To single-instance patch, two-instance independence, transitions from the API, error/empty/loading states, read-only on 403. Mock data only.
- [ ] AI_USAGE_LOG.md updated

## Task A4: Auth (reduced)
Branch: feat/fe-a-a04-auth-token | Date: 27 Oct | Estimate: 0.5 h | Depends on: A2R | Status: not started
- [ ] A4.1 Token source for the client from the session; 401 anywhere sends the user to login with the return path. Real Google sign-in blocked (R06).
- [ ] AI_USAGE_LOG.md updated

## Task A10: Live API integration
Status: BLOCKED (R08 no running backend; F07-01 to F07-05 for Bill To). 0 h planned. If unblocked, it replaces A14 time.

## Task A12: CI
Branch: ci/fe-a-a12-ci | Date: 27 Oct | Estimate: 0.5 h | Depends on: A11 | Status: not started
- [ ] A12.1 GitHub Actions: install, lint, typecheck, test, build, check-tokens. Sonar step only if access exists (cut item 4).

## Task A13: Docker and README
Branch: build/fe-a-a13-docker-docs | Date: 27 Oct | Estimate: 0.75 h (trimmed 23 Oct) | Depends on: A12 | Status: not started
- [ ] A13.1 Multi-stage Dockerfile + nginx (SPA fallback), `.dockerignore`. [ ] A13.2 README final. (A13.3 `docs/ux-rationale.md` dropped by the developer on 23 Oct to fit 12 h.)

## Task A14: Stabilize and release candidate
Branch: fix/fe-a-a14-stabilize-rc | Date: 27 Oct | Estimate: 1.0 h | Depends on: A13 | Status: not started
- [ ] A14.1 Review fixes. [ ] A14.2 Demo acceptance checklist and rehearsal script (MOCK/INTEGRATED stated honestly). [ ] A14.3 Propose the RC tag to the developer (Claude never tags).

## Phase log
| Task | Status | Notes |
|---|---|---|
| A1 | merged | |
| A2 | part 1 (A2.4) merged; part 2a (V3 findings) in review | A2.1-A2.3 replaced by A2R |
| A5 | merged | on provisional fixtures; re-key in A5R |
| A00 | merged | docs only |
| chore: ignore handoff package (G4) | merged | developer commit |
| chore: vite 8.3.5 | merged | audit fix, approved 23 Oct |
| docs: contract v1 | merged | Bishoy's v1 contract added; docs re-baselined; code follows in A2C |
| A2R | merged | client, mock adapter, status mapper, Vitest (39 tests) |
| A2C | merged | types, client lookups and mock on v1; 50 tests |
| A6R | ready for review | Biomodel 15 + Conversion 11 Connect controls; create/edit; 67 tests |
| A7R (+A9R), A8R, A5R, A11, A4, A12-A14 | not started | 16 h incl. A00; hours are written by the developer |
| A6-A10 (20 Oct) | superseded / A10 blocked | |
