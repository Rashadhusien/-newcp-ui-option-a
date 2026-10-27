# TASKS: New CP frontend, UI Option A

**Do not start any task until the developer says `start A<NN>`.** One task = one branch = one commit = one PR (see `GIT_WORKFLOW.md`). Base: `develop` (name to confirm, G7); stack on the previous branch while its PR is unmerged. Update `AI_USAGE_LOG.md` right after every subtask group.
Sources of truth (highest first): the v0.9.2.2 handoff package with the v0.9.7 IAM overlay in `docs/newcp-ai/payload/`, `CLAUDE.md`, `docs/PLAN.md`. Unknown means `[NEEDS VERIFICATION]`; log gaps in `docs/DEVIATIONS.md`.
Total: **24 h** (4 h/day, 20-27 Oct 2026). Re-baselined 23 Oct (A00), after Bishoy's v1 contract, and on 24 Oct (A00b) after package v0.9.2.2: 12.0 h of work for 12 h left (25-27 Oct) with the typed-rules evaluator cut. **Re-baselined 26 Oct (A00c) after the v0.9.7 IAM overlay: 4 h left (27 Oct) for A15, A7R-lite and A14-lite; A8R, A11, A4, A5R, A12 and A13 cut (PLAN section 8).** 27 Oct: the developer added A26 (0.5 h), A27 (1.0 h) and A28 (1.5 h, scope addition D-77).

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

## Task A00b: Adopt package v0.9.2.2 (docs only)
Branch: docs/fe-a-a00b-adopt-v0922 | Date: 24 Oct | Estimate: 0.25 h | Status: ready for review
- [x] A00b.1 Refresh the local, git-ignored package copy (`docs/newcp-ai/payload/` = v0.9.2.2; v0.9 kept in `payload-v0.9/`); run the offline checks.
- [x] A00b.2 CLAUDE.md, PLAN.md and this file: reference contract, ETag/If-Match, On Hold, price/Billable/zero-charge, quantity, Bill To MOCK only, 12 h plan.
- [x] A00b.3 DEVIATIONS D-40 to D-48; questions answered and new questions; flaky A6R focus test fixed (D-48).
- [x] AI_USAGE_LOG.md updated

## Task A2D: Move client and mock to the v0.9.2 reference contract
Branch: feat/fe-a-a2d-contract-v092 | Date: 25 Oct | Estimate: 1.5 h | Depends on: A00b | Status: ready for review
- [x] A2D.1 Types and client from the reference YAML: `item()` returns `{ data, etag }`; `edit()` and `transition()` take `ifMatch`; 412/428 as their own error kinds; `GET /catalog/hold-reasons?holdType=`; transition carries `holdType`/`holdReasonCode`; PATCH/create `unitPrice`; `canEditPrice`, `canEditBillability`, `etag`; canonical field types; answer carriers (Q-B16).
- [x] A2D.2 Mock: ETag per item, If-Match checks (412/428, plus `?fail=412`), On Hold only through a transition with type + reason, the four "Demo only" hold reasons from the package fixture, a labelled mock contract price (G9) and zero-total 422 `ZERO_CHARGE_REASON_REQUIRED`, quantity > 0 with decimals, Bill To endpoints never called with mocks off.
- [x] A2D.3 A6R form: answers through one conversion function in the reference format, canonical types, quantity 1 on create, edit with If-Match and a 412 banner that keeps the user's edits. Tests updated; `npm run verify`.
- [x] AI_USAGE_LOG.md updated

## Task A00c: Adopt the v0.9.7 IAM overlay (docs only)
Branch: docs/fe-a-a00c-adopt-v097-iam | Date: 26 Oct | Estimate: 0.25 h | Depends on: A2D | Status: ready for review
- [x] A00c.1 IAM files copied into the git-ignored package copy (v0.9.2.2 READMEs and manifest kept as `*_v0.9.2.2.*`); service OpenAPI and client confirmed byte-identical (D-50).
- [x] A00c.2 CLAUDE.md (authority, errors, "Session and access"), PLAN.md (4 h calendar, cut order), this file, DEVIATIONS D-50 to D-55 and new questions.
- [x] AI_USAGE_LOG.md updated

## Task A15: Session context, access states, IAM errors, capability gating (replaces A4)
Branch: feat/fe-a-a15-session-access | Date: 27 Oct | Estimate: 1.5 h | Depends on: A00c | Status: ready for review
- [x] A15.1 Errors: `asProblem` accepts the flat Problem and `{error:{...}}`; `ApiError` keeps `code`; kind `accessNotAssigned` for 403 `ACCESS_NOT_ASSIGNED`/`TENANT_NOT_ASSIGNED`; other 403 stay `forbidden`; 404 text generic (no existence leak).
- [x] A15.2 Session: `src/mocks/sessionFixtures.ts` (CS, OPS, ADMIN, FINANCE, QC, PENDING; synthetic UUIDs, tenant label "Demo tenant (mock)", capabilities from ROLE_CAPABILITY_MATRIX, CANDIDATE_UNVERIFIED); a session provider holding the context in memory, loaded on app start and refreshed after a 403; with mocks off the context is BLOCKED (endpoint not in the OpenAPI, Q-B20). Replaces the localStorage flag in `session.ts`.
- [x] A15.3 UI: AUTHORIZED -> workspace with a read-only tenant badge; PENDING -> Pending Access page with no features; 401 -> sign-in keeping only a safe in-app path; mock identity picker on the sign-in page only when evidence is MOCK.
- [x] A15.4 Gating and mock enforcement: `can(context, code)` for nav and actions (FINANCE/QC: Reporting only); the mock returns 403 `ACCESS_NOT_ASSIGNED` for PENDING and 403 `PERMISSION_DENIED` for actions the role lacks; no export control (D-54). Tests: both envelopes, Pending/denied routing, no `tenantId`/`X-Tenant-Id` ever sent, picker absent with mocks off.
- [x] AI_USAGE_LOG.md updated

## Task A7R: Service instance detail, staff fields, transitions, history, independence
Branch: feat/fe-a-a07r-instance-detail | Date: 27 Oct | Estimate: **1.75 h (A7R-lite, 26 Oct)**, was 4.0 h | Depends on: A15 | Status: ready for review
A7R-lite scope (26 Oct): A7R.1, A7R.2 without Redo, redo-of, pending reason and notes (cut item 3), A7R.3, A7R.4; actions hidden by capability; payer stays out (A8R cut).
- [x] A7R.1 Order services list: one row per instance with UUID (short) and line number; open one instance.
- [x] A7R.2 Staff fields via PATCH with If-Match: Redo and redo-of, service notes, pending reason, quantity (> 0, decimals), Billable Yes/No (`canEditBillability`), unit price override (`canEditPrice`; contract price shown first), zero-charge reason and note (422 on the field). Read-only and labelled: currency, rush, line total. 412 -> keep edits, offer reload.
- [x] A7R.3 Status: actions from `available-transitions` only (label from the API), with If-Match; a move into On Hold opens a dialog requiring hold type and a "Demo only" reason, sent in the same transition; 409/412/422 leave the status unchanged; history timeline from the history endpoint.
- [x] A7R.4 (was A9R) Two same-type instances stay independent (edit, transition, payer); 401 -> login, 403 -> read-only, tenant-masked 404 without data leakage.
- [x] AI_USAGE_LOG.md updated

## Task A8R: Service-level Bill To (F07, mock)
Branch: feat/fe-a-a08r-bill-to | Date: - | Estimate: 1.0 h | Depends on: A7R | Status: **cut 26 Oct** (cut item 1; first to restore; mock and adapter guard from A2D stay)
- [ ] A8R.1 Doctor/Scanning Center selector from `eligible-billed-parties`; `billedToContactUuid` for ONE service on create/patch; never send provenance or tenant; never copy an order-level Bill To.
- [ ] A8R.2 `canEditBilledParty` -> read-only with an explanation; 403/409/412/422 rendered; no success unless persisted. MOCK only: with mocks off the control shows BLOCKED (F07 columns absent in current V3) and nothing is sent. Billable and Bill To never change each other.
- [ ] AI_USAGE_LOG.md updated

## Task A9R: Same-type independence and denied states
Status: folded into A7R (A7R.4) on 23 Oct to fit 12 h; no separate branch.

## Task A5R: Report re-key
Branch: feat/fe-a-a05r-report-rekey | Date: - | Estimate: 0.5 h | Depends on: A2D | Status: **cut 26 Oct** (cut item 6; report stays labelled MOCK)
- [ ] A5R.1 Remove obsolete fields (option, arch, quantity, `ORD-` strings, provisional statuses); rows from the mock adapter's service items; status via the mapper; MOCK label; no report endpoint yet (G3).
- [ ] AI_USAGE_LOG.md updated

## Task A11: Tests
Branch: test/fe-a-a11-tests | Date: - | Estimate: 2.0 h | Depends on: A7R, A8R | Status: **cut 26 Oct** (cut item 2; tests are written inside A15 and A7R)
- [ ] A11.1 Component tests: form conditions and attached validators, 422 mapping, Bill To single-instance patch, two-instance independence, transitions from the API, error/empty/loading states, read-only on 403; v0.9.2.2 acceptance cases: 412 stale edit keeps edits, 428, On Hold without type/reason rejected, price override kept ($20 -> $18 mock), zero total needs a reason, Billable and Bill To independent (package fixture). Mock data only.
- [ ] AI_USAGE_LOG.md updated

## Task A4: Auth (reduced)
Branch: feat/fe-a-a04-auth-token | Date: - | Estimate: 0.5 h | Depends on: A2R | Status: **replaced 26 Oct by A15** (token vs cookie open, Q-B21)
- [ ] A4.1 Token source for the client from the session; 401 anywhere sends the user to login with the return path. Real Google sign-in blocked (R06).
- [ ] AI_USAGE_LOG.md updated

## Task A10: Live API integration
Status: BLOCKED (R08 no running backend; F07-01 to F07-05 for Bill To). 0 h planned. If unblocked, it replaces A14 time.

## Task A12: CI
Branch: ci/fe-a-a12-ci | Date: - | Estimate: 0.5 h | Depends on: A11 | Status: **cut 26 Oct** (cut item 5)
- [ ] A12.1 GitHub Actions: install, lint, typecheck, test, build, check-tokens. Sonar step only if access exists (cut item 4).

## Task A13: Docker and README
Branch: build/fe-a-a13-docker-docs | Date: - | Estimate: 0.75 h (trimmed 23 Oct) | Depends on: A12 | Status: **cut 26 Oct** (cut item 4)
- [ ] A13.1 Multi-stage Dockerfile + nginx (SPA fallback), `.dockerignore`. [ ] A13.2 README final. (A13.3 `docs/ux-rationale.md` dropped by the developer on 23 Oct to fit 12 h.)

## Task A14: Stabilize and release candidate
Branch: fix/fe-a-a14-stabilize-rc | Date: 27 Oct | Estimate: **0.5 h (A14-lite, 26 Oct)**, was 1.0 h | Depends on: A7R | Status: ready for review
A14-lite scope: `npm run verify`, browser smoke check at 390 and 1440 px (light), EVIDENCE, rehearsal script with each mock identity; A14.3 kept.
- [x] A14.1 Review fixes. [x] A14.2 Demo acceptance checklist and rehearsal script (MOCK/INTEGRATED stated honestly). [x] A14.3 Propose the RC tag to the developer (Claude never tags).

## Reference-pattern plan (A17 to A23, 27 Oct, developer request)
The developer asked to follow the two earlier POCs (`refrences/mui`, `refrences/1-mui`) page by page ("don't reinvent the wheel"): a Notion-style hidden sidebar, a global footer, a support button, an order-level Orders list with sub-services, an order details page, a create-order wizard with steps and teeth chart, reports with tabs (no Models/Conversion filter chips), settings like the POC, and coloured statuses. POC code may now be ported and adapted (D-65), in our stack and folders, mock data only. One task at a time; each waits for `start A<NN>`. The A16c stages are folded into these tasks.

## Task A17: Shell like the POC: hidden sidebar, footer, support button
Branch: feat/fe-a-a17-shell-footer-support | Estimate: 1.5 h | Depends on: A16b | Status: ready for review | Source: POC-2 `src/layout/useSidebarState.ts`, `AppShell.tsx`, `AppFooter.tsx`, `appInfo.ts`, `src/support/*`
- [x] A17.1 Sidebar hidden by default at every width (content full width). Menu button in the header: hovering it (or the left edge) shows the sidebar as an overlay (peek); clicking pins it and the content shrinks to make room (push, Notion-style); clicking again unpins and hides it. Escape and outside click close a peek. Phones: modal drawer. Pin state remembered per browser (convenience only).
- [x] A17.2 Global footer under every page: app name, version from `package.json`, data source (MOCK), in-app links (Report, Orders, Settings, Help). No invented external URL, address or contact.
- [x] A17.3 Support button fixed bottom-right: opens "Help and support" (topic, message, priority Standard/Urgent, status "Draft, not submitted"). No ticketing system: the form says nothing is sent or stored, never shows "Submitted", warns to leave out patient data. Dummy topics only.
- [x] Verify (existing tests green; no new tests, D-66); browser at 390/768/1024/1440, light and dark.

## Task A18: Reports like the POC, with coloured statuses
Branch: feat/fe-a-a18-reports-pattern | Estimate: 1.0 h | Depends on: A17 | Status: ready for review | Source: POC-1 `src/features/reports/ReportsPage.tsx`, POC-2 `src/pages/reports/*`
- [x] A18.1 Report page structure from the POC: summary cards on top, a tab bar of report pages, then the table. Replace the Models/Conversion status-chip rows; service type stays a column and a toolbar filter. No charts (`@mui/x-charts` not approved).
- [x] A18.2 Coloured statuses: report rows use the API status codes from the mock (`submitted`, `in_design`, `on_hold`, `completed`, ...) so `presentStatus` gives each its own tone and icon. This fixes "all statuses look the same": the old fixture labels fell back to neutral grey. Absorbs A5R.
- [x] Verify (no new tests, D-66); browser light and dark.

## Task A19: Orders list at order level with sub-services
Branch: feat/fe-a-a19-orders-list | Estimate: 1.5 h | Depends on: A17 | Status: ready for review | Source: POC-2 `src/pages/orders/FlowPage.tsx`, `FlowTable.tsx`, `FlowToolbar.tsx`, `ServiceLines.tsx`, `flowColumns.tsx`
- [x] A19.1 One row per order; expanding a row shows its services (one line per instance: type, status, line, quantity); a row opens the order details page. Toolbar, search, sort and paging like the POC.
- [x] A19.2 Data: a mock orders-list source behind the service adapter. Bishoy's `GET /orders` is not in the contract yet (Q-B3, Q-B26): the shape is PROPOSED and `[NEEDS VERIFICATION]`; with mocks off the list is BLOCKED and nothing is called. Synthetic orders only.
- [x] Verify (no new tests, D-66); browser incl. phone cards.

## Task A20: Order details page
Branch: feat/fe-a-a20-order-details | Estimate: 2.0 h | Depends on: A19 | Status: ready for review | Source: POC-2 `src/pages/orderDetails/*` (OrderSummary, ServiceInfo, ServiceAction, WorkflowSteps, InternalNotes)
- [x] A20.1 Order summary card, then one card per service instance with its status, transition buttons (from the API), staff fields and history: today's A7R detail content in the POC layout (A16c-1 folded in). On Hold dialog unchanged.
- [x] A20.2 Order header fields the contract lacks (order number, client, patient, due date) are mock-only and labelled (D-61).
- [x] Verify: the existing A7R tests keep passing (update them if the layout moves); no new tests (D-66).

## Task A21: Create order wizard (steps + teeth chart)
Branch: feat/fe-a-a21-create-order | Estimate: 3.0 h | Depends on: A20; Q-B24, Q-B25, G17 | Status: ready for review (mock only; Q-B24, Q-B25 open; G17 approved) | Source: POC-2 `src/pages/addCase/*`, `src/components/TeethChart*.tsx`, `teethModel.ts`
- [x] A21.1 Stepper like the POC: Patient, Services (Biomodel/Conversion), Service details (our A6R form specs), Teeth, Notes, Review; the Models and Conversion pages start this wizard.
- [x] A21.2 Teeth chart: the POC uses `react-odontogram` (not approved, G17). Without approval: a simple tooth-number grid in MUI.
- [x] A21.3 Create order is not in the contract (only "create a service on an existing order"): mock only, labelled, BLOCKED with mocks off, until Bishoy's endpoints and the new database fields are in the reference contract (Q-B24). Patient step: synthetic data only (Q-B25).
- [x] Verify (no new tests, D-66); browser check.

## Task A22: Settings like the POC
Branch: feat/fe-a-a22-settings | Estimate: 0.5 h | Depends on: A17 | Status: not started | Source: POC-1 `src/features/settings/SettingsPage.tsx` (SectionCard + SectionTabs)
- [ ] A22.1 POC layout with sections; only settings the app really has are interactive (theme, data source, about/version). Profile, notifications and password have no backend: left out or shown as "Not available in this demo".

## Task A25: Sign-in page per the backend Auth implementation
Branch: feat/fe-a-a25-google-auth | Estimate: 1.25 h | Depends on: A15 (session, IAM states) | Status: ready for review | Source: backend team request (27 Oct, D-67), IAM v0.9.7 tenant spec D1/D3
Scope: only the sign-in/auth entry and the session token wiring; the rest of the app unchanged.
- [x] A25.1 Sign-in page: keep the current look (brand panel, card, dark theme); one primary "Sign in with Google" button. Nothing else to enter: no email/workstation, password, forgot password, remember workstation token, or role selector (our page has none of the first four today; the role picker exists only in mock mode, G18).
- [x] A25.2 Flow: Google Identity Services (script loaded at runtime from Google, no npm package) -> Google ID token -> `POST /api/v1/auth/login` `{ idToken }` -> session token + expiry -> client `TokenSource` sends `Authorization: Bearer <session-token>`. Token in memory only; expiry ends the session (401 path). The Google client ID comes from `VITE_GOOGLE_CLIENT_ID` (public, not a secret; Q-B28); without it the button shows BLOCKED.
- [x] A25.3 After login the app reads its access from the server (session context, Q-B20) and never from the frontend: no tenant `1`, role names or permissions hard-coded.
- [x] A25.4 States on the page: Google loading, Google failure (retry), authorized (go to the requested page), Pending Access with the backend's sentence, session expired / 401 (back here, safe return path only), access denied / 403.
- [x] A25.5 Mock mode: "Sign in with Google" is simulated (no Google call, labelled MOCK); the identity picker stays mock-only unless G18 says remove it.
- [x] Verify (existing tests green; no new tests, D-66); browser: every state, light and dark, 390 and 1440.

## Task A24: Tests for A17 to A23 (deferred, D-66)
Branch: test/fe-a-a24-tests | Estimate: 2.0 h | Depends on: the A17 to A23 tasks that were built | Status: not started
- [ ] A24.1 Vitest + RTL for what A17 to A23 and A25 added (incl. the sign-in states and Bearer token use): sidebar peek/pin/push and drawer, footer links, support form (validation, "not submitted", no data sent), report tabs and status tones, orders list expand and BLOCKED with mocks off, order details (transitions, On Hold, staff fields, history), create-order wizard steps and mock-only create, settings.
- [ ] A24.2 Restore the rule "every task adds its own tests" in CLAUDE.md.

## Task A23: Carry-over: Bill To, form layout, Redo/pending/notes
Branch: feat/fe-a-a23-carry-over (name not in TASKS before; follows the convention) | Estimate: 2.25 h (A8R 1.0, labels-above form 0.75, Redo/pending/notes 0.5) | Depends on: A21 | Status: ready for review (Bill To MOCK only; Q-B18 open)
- [x] A23.1 Bill To (A8R.1, A8R.2): per-instance card from `eligible-billed-parties`, `billedToContactUuid` for ONE service on patch and on single-service create; `canEditBilledParty` and capability respected; 403/409/412/422 rendered; no success unless persisted; BLOCKED with mocks off; Billable and Bill To never change each other.
- [x] A23.2 Labels above fields in `AppTextField` and form-size `AppSelect` (DESIGN_ALIGNMENT item 11); toolbars unchanged.
- [x] A23.3 Staff fields Redo, redo-of, pending reason, service notes (PATCH, If-Match); redo-of and pending reason not returned by the API (Q-B18), labelled.
- [x] Verify (existing tests green; no new tests, D-66); browser check.

## Task A26: Breadcrumbs (shared, all authenticated pages)
Branch: feat/fe-a-a26-breadcrumbs | Estimate: 0.5 h | Depends on: A23 (develop) | Status: ready for review | Source: developer request 27 Oct (A26-A28 authorized together)
- [x] A26.1 Pure trail builder `src/shared/lib/breadcrumbs.ts` (labels from `ROUTE_LABELS` in `routes.ts`) and one `AppBreadcrumbs` rendered by `PageHeader`; pages pass hints the URL lacks (order, line, Models/Conversion).
- [x] A26.2 Trails: Home; Home > Report; Home > Orders > Order …<short id> > Service line <n> (> Edit form); Home > Models or Conversion > New service; Home > Settings. No full UUID, no patient or client name.
- [x] A26.3 MUI Breadcrumbs as `<nav aria-label="Breadcrumb">`, last crumb `aria-current="page"`, earlier crumbs router links, middle crumbs collapse under 640 px; crumbs the role cannot open are plain text.
- [x] A26.4 Vitest for the trail builder (5 tests).

## Task A27: Home (welcome) page
Branch: feat/fe-a-a27-home (stacked on A26) | Estimate: 1.0 h | Depends on: A26 | Status: ready for review | Source: developer request 27 Oct
- [x] A27.1 `/home` (lazy, default export): landing page after sign-in (safe return path still wins), first sidebar item, first breadcrumb; `/` and the 404 action go there.
- [x] A27.2 "Welcome, <displayName>", role chips and the read-only tenant badge, all from the session context.
- [x] A27.3 Quick access cards gated by `can(context, ...)`: Report, Orders, New Biomodel, New Conversion, Settings, Help and support (Dashboard follows in A28); grid 1/2/3 columns; whole card is the link (Help opens the support panel).
- [x] A27.4 MOCK badge in the PageHeader; no counts, no activity.
- [x] A27.5 Mock identity switch updates greeting, chips and cards.
- [x] A27.6 Component test: cards for CS, FINANCE, QC (3 tests).
- [x] A27.7 `docs/REHEARSAL.md`: sign-in lands on Home.

## Task A28: Dashboard page (scope addition, D-77)
Branch: feat/fe-a-a28-dashboard (stacked on A27) | Estimate: 1.5 h | Depends on: A27 | Status: ready for review (MOCK only; G19, Q-B30 open) | Source: developer request 27 Oct
- [x] A28.1 `/dashboard`, sidebar item under Home, Home card, breadcrumb Home > Dashboard.
- [x] A28.2 Figures computed in the browser by `dashboardSelectors` over `serviceApi.dashboardData()` (mock, `reports.view_all`); BLOCKED with the real API, nothing called.
- [x] A28.3 KPI cards: open, on hold, completed, price override ("Not available", Q-B30), zero-charge reason; each says how it is counted.
- [x] A28.4 Status overview: one row per API status (badge icon + label, count, LinearProgress); no chart library.
- [x] A28.5 Needs attention: services on hold (service, line, order short id; hold type and reason "not returned", Q-B18), linked only with `service.read`.
- [x] A28.6 Recent activity from history; actor as short id (Q-B6).
- [x] A28.7 All five roles; FINANCE and QC without links; no export.
- [x] A28.8 Loading skeletons, empty state, error with retry, BLOCKED; cards on phone; light and dark; reduced motion via the global rule.
- [x] A28.9 Test: dashboard counts equal the Report's counting for the same rows (2 tests); the Report summary cards now use the shared `statusFigures`.
- [x] A28.10 D-77, G19, Q-B30; PLAN and REHEARSAL updated.

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
| A6R | merged | Biomodel 15 + Conversion 11 Connect controls; create/edit; 67 tests |
| A00b | merged | package v0.9.2.2 adopted in docs; 12 h plan |
| A2D | merged | reference contract v0.9.2 in client, mock and form; 80 tests |
| A00c | merged | v0.9.7 IAM overlay in docs; 4 h plan |
| A15 | merged | session context, Pending Access, IAM errors, capability gating, mock access checks; 104 tests |
| A7R (lite) | merged | order services list, instance detail, staff fields with If-Match, transitions + On Hold dialog, history, denied states; 110 tests |
| A14-lite | merged; tag v0.1.0-rc.1 | verify, smoke 1440/390, rehearsal script `docs/REHEARSAL.md`; RC tag proposed |
| A16 (analysis) | merged | `docs/DESIGN_ALIGNMENT.md`: design gaps, token mapping, staged plan A16a/b/c (6.25 h); awaiting hours |
| A16a | merged | DS token alignment (darkHover, onFillDark, spacing 20, smDark, fieldHeight), Outfit import removed, D-59 to D-62, flaky On Hold test fixed (10/10) |
| A16b | merged | header/sidebar per DS, ThemeModeSwitch, MOCK badge in PageHeader, SectionCard, Settings page; 114 tests |
| A17 | merged | hidden sidebar (hover peek, click pin + push), footer, support button; no new tests (D-66) |
| A25 | merged | Google sign-in per the backend Auth (login call, Bearer token in memory, all sign-in states); IAM-TENANT-002 recorded (D-69); no new tests |
| A18 | merged | report like the POC: summary cards, report tabs, status overview; statuses re-keyed to API codes (coloured); no new tests |
| A19 | merged | orders list at order level with expandable services; mock only, BLOCKED with the real API; no new tests |
| A20 | merged | order details like the POC: summary, services list, selected service with staff fields, status, On Hold, history; no new tests |
| A21 | ready for review | create-order wizard (5 steps, react-odontogram teeth chart, per-instance details), mock only; no new tests |
| A23 | ready for review | Bill To card + create field (mock, BLOCKED real), labels above fields, Redo/redo-of/pending reason/notes; no new tests |
| A26 | ready for review | breadcrumbs on every page (pure trail builder + AppBreadcrumbs in PageHeader); 5 new tests |
| A27 | ready for review | Home landing page with greeting, roles, tenant and capability-gated cards; 3 new tests |
| A28 | ready for review | Dashboard (mock, computed in the browser, BLOCKED real), status counts shared with the Report; 2 new tests |
| A22 | planned 27 Oct | reference-pattern plan (shell, reports, orders, order details, create order, settings, carry-over) |
| A8R, A11, A5R, A4, A12, A13 | cut 26 Oct / A4 replaced by A15 | PLAN section 8, restore order |
| A6-A10 (20 Oct) | superseded / A10 blocked | |
