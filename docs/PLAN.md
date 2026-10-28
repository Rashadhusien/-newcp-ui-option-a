# PLAN: New CP frontend, UI Option A

Status: re-baselined 23 Oct 2026 (A00) on the AI Development Handoff Package v0.9 (F07), again on 24 Oct (A00b) on its v0.9.2.2 update (approved Q-B8 to Q-B15), and on 26 Oct (A00c) on the v0.9.7 IAM overlay (session context, access states, error codes, capabilities; service OpenAPI unchanged), with 4 h left (D-50 to D-55). The package is the highest authority for the contract, the form fields and the business rules (see `CLAUDE.md`, "Authority"). The 20 Oct plan is superseded where it disagrees; the superseded parts are logged in `docs/DEVIATIONS.md` (D-22 to D-27, D-40 to D-47). Anything not traceable to a source is marked `[NEEDS VERIFICATION]`.

## 1. Context
- Customer: 3D Diagnostix (dental, AI-assisted platform). Project: **New CP**, a rebuild of the legacy CP (Case Portal) web app.
- Milestone: **CEO demo on Thu 29 Oct 2026**, rehearsal Wed 28 Oct. Dev days: 20, 21, 22, 25, 26, 27 Oct.
- Developer: Rashad, frontend intern, **4 h/day x 6 days = 24 h**. Mentor and reviewer: Aya Adel. Backend contract author: Bishoy. Option B (a second, independent UI) is built by Abdo (full-stack intern).
- Two UIs, one backend: Option A (this repo) and Option B must differ in UX, share no component library, and consume the same API.
- **R14 (open):** the package's "Option A" is the Tailwind prototype `@3ddx/newcp-ui-option-a`; this repo (`newcp-frontend-a`) is built with MUI. Continuing with MUI needs Aya's written ADR (G2).

## 2. Architecture
```
Browser (React + MUI, this repo)  --HTTPS-->  Express + TypeScript + Drizzle + Zod  -->  PostgreSQL V3
        Google login  ---------------------->  token validated by the backend
```
- **Access (IAM v0.9.7):** Google authenticates only; PostgreSQL IAM + Casbin authorize on the server; one active tenant per session, resolved by the backend from an explicit grant. The UI reads a session context (AUTHORIZED / PENDING, tenant label, roles, capability flags; endpoint not in the OpenAPI, Q-B20, so MOCK only), never sends a tenant, and uses capabilities for display only. Transport (Bearer vs HttpOnly cookie) is open (Q-B21).
- The frontend never talks to the database and never holds tenant logic. Tenant isolation, authorization, RLS and PHI protection are backend responsibilities. The UI reflects them (401, 403, cross-tenant 404).
- **Contract:** the package's `references/f07/integration/newcp-demo-f07.openapi.yaml` (v0.9.2-draft, `NOT_FINAL`). Q-B15 makes it the reference over Bishoy's `docs/openapi/newcp-v1.openapi.yaml` (v1.0.0), which the backend reconciles into one snapshot (D-40). Endpoints: catalog services, form schema, hold reasons (`/catalog/hold-reasons?holdType=`), order services (list, create), service item (get with ETag, patch with If-Match), available transitions, transition (If-Match; carries hold type/reason), history, eligible billed parties. No zero-charge reasons endpoint (Q-B17).
- **Database facts (24 Oct, Technical Lead):** current V3 has `orders.order_items.is_billable`; F07's `billed_to_contact_id` and `billed_party_origin` do NOT exist yet. Billable is real; Bill To stays MOCK and disabled outside the mock (D-44).
- **Data path:** pages -> `src/features/services/data/serviceApi.ts` (mock or real, one interface) -> `src/shared/api/` client. `VITE_USE_MOCKS=true` until a real backend is demonstrated. The UI shows MOCK or INTEGRATED.
- The reference contract still has **no report endpoint and no order list, search or get** (G3, Q-B3): the report stays on mock data, labelled MOCK, and the demo order is a known synthetic UUID.

## 3. Demo scope (what Option A must show)
1. Login; every route protected; logout. Session context on load: AUTHORIZED shows the workspace with a read-only tenant badge; PENDING shows Pending Access; 401 returns to sign-in with a safe return path. In mock mode a mock identity picker (CS, OPS, ADMIN, FINANCE, QC, PENDING) shows the role differences. Real Google sign-in is backend-driven and blocked (R06, Q-B21).
2. Combined Models/Conversion report, counted by service **instance**, with filters, sort, paging (mock, labelled).
3. Biomodel ("Models") and Conversion services on an existing order: create, edit, reopen, status transition (from `available-transitions`), per-instance history.
4. All form controls: Biomodel 28, Conversion 21, including conditional and nested ones, plus CP staff fields (Redo, status, pending, pending reason, unit price override, Billable Yes/No, quantity, zero-charge reason/detail, rush, currency, Bill To, internal comment).
5. Service-level **Bill To** (F07): Doctor or Scanning Center per service, from eligible billed parties, one service at a time; MOCK only (the DB columns don't exist yet), independent of Billable.
6. **Concurrency** (Q-B8): a stale edit (412) never overwrites someone else's change; the user keeps their edits and can reload.
7. **On Hold** (Q-B9): putting a service on hold asks for hold type and a "Demo only" reason in one step.
8. Invalid input leaves no partial record and shows an actionable error (422 field details, 409 conflict, 403 read-only).
9. Two same-type services in one order are independent: distinct UUIDs and line numbers, separate edits, status, history, payer and report rows.
10. Unauthorized or cross-tenant access is denied with a clear state, using the IAM codes: `ACCESS_NOT_ASSIGNED`/`TENANT_NOT_ASSIGNED` -> Pending Access, other 403 -> access denied (context refreshed), 404 -> generic "not available". Actions the role lacks are hidden (FINANCE/QC: reports only, G11 open).
11. Loading, empty and error states on every screen; responsive desktop, tablet, mobile.

Out of scope: Implant Analog Model (reference only), new-order wizard, export, uploads, email, teeth chart, billing operations, Grafana link.

## 4. Statuses and fields (from the package)
- **Statuses** come from the API: the item's `status` string and `available-transitions` (`transitionId`, `fromCode`, `toCode`, `label`). No hard-coded status lists, IDs or legacy numeric codes. `src/shared/status/status.ts` only maps an API value to a chip label, icon and tone, with a neutral fallback. The provisional statuses of 20 Oct (Awaiting Models, No Scans, ...) are obsolete.
- **Fields** come from `references/v06/form_biomodel.json` (28) and `form_conversion.json` (21). Enforce only UI-attached validators from `02_Validation_Rule_Matrix.csv`. The provisional fields of 20 Oct (option, arch) are obsolete. Field codes in the API are unresolved (R02); the v0.6 field keys are used as provisional `fieldCode`s, labelled MOCK. Answers follow the reference carriers (`optionCode`/`optionCodes`, `valueText`/`valueNumber`/`valueBoolean`/`valueDate`) after A2D; the code uses v1's `value`/`optionCodes` until then (D-41, Q-B16). Field types are the 8 canonical types (Q-B11); the generic evaluator for typed `conditionalRules` (Q-B12) is cut for the demo, local rules stay (D-46).
- **Staff fields** (PATCH, reference contract): Redo and redo-of, service notes, pending reason, quantity (> 0, decimals allowed, demo default 1), Billable (`canEditBillability`), unit price override (`canEditPrice`; an authorized override is kept, never re-priced), zero-charge reason/note (a zero final total needs a reason: 422 `ZERO_CHARGE_REASON_REQUIRED`), Bill To (mock). Read-only: currency, rush. Hold type/reason only through the On Hold transition.
- Error cases the UI must handle: 400, 401, 403, 404 (incl. tenant-masked), 409 (workflow/financial conflict: lock, invoiced, payer after charge), 412 (stale ETag), 428 (missing If-Match), 422 (validation, ineligible payer, zero-charge reason), 5xx, network. Body shape: `Problem {code, message, requestId?, details?}`.

## 5. Calendar (24 h)
**Re-baselined 26 Oct (A00c), approved by the developer.** A2D was finished on 25 Oct; A7R did not start on 25/26 Oct. Left before the rehearsal: **Tue 27 Oct, 4 h**. Open work was 10.25 h + about 1.5 h of IAM work, so about 7.75 h is cut (section 8).

| Day | Tasks | Hours | What is demonstrated |
|---|---|---|---|
| Mon 26 Oct | A00c (docs only) | 0.25 | v0.9.7 IAM overlay adopted in docs; plan re-baselined |
| Tue 27 Oct | A15, A7R-lite, A14-lite | 1.5 + 1.75 + 0.5 = 3.75 | session context and access states with mock identities, IAM error codes, capability gating; instance detail with price, Billable, zero-charge and quantity (If-Match), transitions and the On Hold dialog, history, denied states, two same-type instances; verify, smoke check, rehearsal script |

The 25 Oct calendar below is kept for the record and superseded.

Re-baselined 24 Oct (A00b) after package v0.9.2.2. Done: A1, A2.4, A5, V3 findings, Task 00, A00, A2R, vite bump, contract v1 docs, A2C, A6R (hours are written by the developer). Remaining dev days: 25, 26, 27 Oct = **12 h**. Remaining work: **12.0 h** with the typed-rules evaluator cut (13.0 h without the cut).

| Day | Tasks | Hours | What is demonstrated |
|---|---|---|---|
| Sun 25 Oct | A00b, A2D, A7R start | 0.25 + 1.5 + 2.25 = 4 | reference contract in client and mock (ETag, hold lookup, price, quantity); instance detail started |
| Mon 26 Oct | A7R finish, A8R, A11 start | 1.75 + 1 + 1.25 = 4 | staff fields (price, Billable, zero-charge, quantity), On Hold dialog, 412 banner, transitions, history, independence, denied states; Bill To on the mock |
| Tue 27 Oct | A11 finish, A5R, A4 (reduced), A12, A13 (trimmed), A14 | 0.75 + 0.5 + 0.5 + 0.5 + 0.75 + 1 = 4 | tests, report re-key, 401 handling, CI, Docker + README, release candidate |

A10 (live API) has 0 h: blocked by R08 (no running backend) and the F07 gate. If the backend appears, it replaces A14 time.

## 5a. Reference-pattern plan (27 Oct, replaces the A16c stages)
The developer asked to follow the earlier POCs page by page (D-65). Time left before the 28 Oct 21:00 meeting: about 3 to 4 h (5 to 6 h given; A16a and A16b used about 2 h).

| Order | Task | Hours | Shows in the meeting |
|---|---|---|---|
| 1 | A17 shell: hidden sidebar (hover peek, click to pin and push), footer, support button | 1.5 | every page |
| 2 | A18 reports like the POC + coloured statuses | 1.0 | report |
| 3 | A19 orders list at order level with sub-services (mock; Bishoy's endpoint pending) | 1.5 | orders |
| 4 | A20 order details page | 2.0 | an order and its services |
| 5 | A21 create order wizard with teeth chart (blocked on Q-B24, Q-B25, G17) | 3.0 | new order |
| 6 | A22 settings like the POC | 0.5 | settings |
| 7 | A23 Bill To, form labels, Redo/pending/notes | 2.25 | service details |

| 8 | A24 tests for A17 to A23 and A25 (deferred, D-66) | 2.0 | none (quality) |
| 2 (proposed) | A25 sign-in per the backend Auth (Google button, `POST /auth/login`, Bearer) | 1.25 | sign-in |
| 9 | A26 breadcrumbs on every page | 0.5 | every page |
| 10 | A27 Home (welcome) page, landing after sign-in | 1.0 | sign-in, Home |
| 11 | A28 Dashboard (scope addition 27 Oct, D-77, G19; removed 28 Oct by A32, D-80) | 1.5 | none |

Total 15.0 h with A25, 18.0 h with A26 to A28 (added 27 Oct; the Dashboard is a scope addition, D-77). **No new tests until the pages are done (D-66):** A17 to A23 only keep the existing suite green; A24 writes the tests afterwards. **Fits before the meeting (about 4 h): A17 + A25 + A18 = 3.75 h** if A25 goes second (the backend team is waiting for it); A19 then moves after the meeting. Without A25: A17 + A18 + A19 = 4.0 h. Developer to choose. A20 next if time remains; A21 needs answers first. Today's service detail page and the Models/Conversion launchers keep working until A20/A21 replace them.

## 5b. Plan after the canonical contract (28 Oct)
The backend shared its canonical OpenAPI and a test server (D-79) and answered most open questions (DEVIATIONS, "Backend answers of 28 Oct"). The developer removed the Dashboard (D-80) and asked for a nested sidebar with legacy names (D-81), the 3DDX logo (D-82), tables like the references (D-83) and live endpoints.

| Order | Task | Hours | Blocked by |
|---|---|---|---|
| 1 | A32 remove the Dashboard | 0.5 | none |
| 2 | A29 migrate types, answers and mocks to the canonical contract | 2.0 | none |
| 3 | A30 real sign-in, `/auth/me`, logout, dev proxy | 1.5 | Q-B28 Google client ID + allowed origin (Hesham) for the live part |
| 4 | A33 nested sidebar, legacy labels, logo | 1.5 | Q-B34 remaining labels (defaults used meanwhile) |
| 5 | A34 Columns menu, service filter, order details gaps | 2.0 | none |
| 6 | A31 live service endpoints on the test server | 2.0 | A30; Q-B33 test accounts and order UUIDs; Q-B31 CORS (the proxy works around it) |
| 7 | A24 tests (updated scope) | 2.5 | after the above |

Total 12.0 h. Stays MOCK whatever we do: All orders (no `GET /orders`, Q-B26), Add order (no create order, Q-B24), the order header (Q-B32), Bill To (F07 unverified), report figures (no report endpoint, Q-B3). A29, A32, A33 and A34 need nothing from the backend and can start now; A30's live part and A31 wait for Hesham.

## 5c. Plan after v0.9.8 (28 Oct)
v0.9.8 (D-85) makes the Orders Dashboard design-only (D-86), confirms FINANCE/QC access (D-87) and reports IAM and F07 complete. Done since 5b: A32, A29.

| Order | Task | Hours | Blocked by |
|---|---|---|---|
| 1 | A30 real sign-in, `/auth/me`, logout, dev proxy | 1.5 | Q-B28 (live part) |
| 2 | A33 nested sidebar, legacy labels, logo | 1.5 | none |
| 3 | A35 FINANCE/QC order and service access | 1.0 | none (Q-B35 open) |
| 4 | A34 Orders Dashboard design + table columns | 3.5 | none (design-only) |
| 5 | A31 live service endpoints + Bill To runtime check | 2.0 | A30; Q-B33 |
| 6 | A24 tests | 2.5 | after the above |

Total 12.0 h. Open blockers and questions: `docs/BACKEND_BLOCKERS.md`.

## 6. What we reused (read-only sources, copied out)
`sources/mui` (base: app, theme, components, table, status) and `sources/poc-mui` (token scripts; form host, fields, error summary, dirty guard, timeline and action panel still to be adapted in A6R/A7R). Full map: `docs/DEVIATIONS.md`, "Reuse map (A1)".

## 7. Deviations from the standard (to be approved by Aya)
1. Base is the `mui` POC with MUI; the package expects the Tailwind prototype unless an ADR approves MUI (R14, G2).
2. Tests: Vitest + React Testing Library (+ vitest-axe if approved), installed in A2R after G1, required from then on.
3. `domain/`, `data/` and seed JSON are replaced by `shared/status/`, `shared/api/`, `features/services/data/` and `mocks/`.
4. The report stays on mock data until a report endpoint exists (G3).
5. Unit price is editable for authorized clerks (Q-B10); currency and rush stay read-only.
6. Bill To is MOCK only until the DB owner applies and verifies F07 (D-44); the canonical contract (D-79) keeps the F07 blocker.
7. The API reference is the backend's canonical OpenAPI (D-79), not the package F07 contract.

## 8. Risks and cut order
**R1 (26 Oct, A00c): applied cuts, in order; restored in the same order if hours appear:** (1) A8R Bill To UI (1 h; breaks the earlier "never cut Bill To" and the IAM live Bill To scenario M03/M04, accepted by the developer; mock and adapter guard stay), (2) A11 as its own task (2 h; only tests written inside each task), (3) A7R staff fields Redo, redo-of, pending reason and notes (0.5 h), (4) A13 Docker and README (0.75 h), (5) A12 CI (0.5 h), (6) A5R report re-key (0.5 h; report stays labelled MOCK), (7) dark-mode and tablet checks, the Sonar step, history pagination. A4 (0.5 h) is replaced by A15. Never cut: session/access states, the forms, the On Hold dialog, 412 handling, capability gating.
Earlier R1 (24 Oct, superseded): no buffer: 12.0 h of work in 12 h. **Applied now (24 Oct):** the generic typed-rules evaluator is cut (1 h; local rules stay, D-46); A9R stays folded into A7R; A13 stays trimmed. **Cut order if we slip:** (1) dark-mode checks (0.5 h), (2) tablet polish (0.5 h), (3) the Sonar step (0.25 h), (4) A5R: leave the report as it is, labelled MOCK (0.5 h), (5) history pagination (not planned). Never cut: the core flow, the forms, the On Hold dialog, 412 handling, Bill To on the mock.
R2 contract provisional and changing (v0.9.2 vs Bishoy's v1, Q-B15/Q-B16): one shared client, one adapter interface, one answer-conversion function, typed from the reference OpenAPI.
R3 no backend (R08) and unresolved catalog/field/transition mappings (R01-R03): everything runs on the mock and is labelled MOCK; no INTEGRATED or PASS claims without executed evidence.
R4 R14 decided against MUI: the UI layer would need a rewrite; business logic, adapter and tests carry over.

## 9. Open questions
New on 26 Oct (A00c): for Bishoy Q-B20 (session context endpoint and capability code format), Q-B21 (Bearer vs cookie, CSRF, sign-in and logout endpoints), Q-B22 (error envelope; `TENANT_NOT_ASSIGNED`, `WORKFLOW_CONFLICT` final?), Q-B23 (report export endpoint); for Aya G11 (where FINANCE edits price/Bill To/Billable; do FINANCE/QC get service pages), G12 (cut list vs live Bill To), G13 (mock identity picker for the rehearsal). G1 is closed.
For Aya (still open): G2 R14 ADR and which repo is "Option A"; G7 integration branch name and `local_docs` history clean-up; new G8 (Q-B15 reverses D-33: confirm), G9 (mock contract price from the package example), G10 (keep local form rules, cut the typed-rules evaluator). G1, G3, G4, G5, G6 are settled.
For Bishoy (still open): Q-B1 status label, Q-B2 (only currency and rush now), Q-B3 report/list/order endpoints, Q-B5 field/option codes and catalog UUIDs, Q-B6 actor names, Q-B7 Problem codes other than `ZERO_CHARGE_REASON_REQUIRED`; new Q-B16 (answer wire format), Q-B17 (zero-charge reasons source), Q-B18 (hold/pending/redo display fields), Q-B19 (ETag exposed through CORS). Q-B4 and Q-B8 to Q-B15 are answered. Details: `docs/DEVIATIONS.md`, "Questions after package v0.9.2.2".
