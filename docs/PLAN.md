# PLAN: New CP frontend, UI Option A

Status: re-baselined 23 Oct 2026 (A00) on the AI Development Handoff Package v0.9 (F07), which is now the highest authority for the contract, the form fields and the business rules (see `CLAUDE.md`, "Authority"). The 20 Oct plan is superseded where it disagrees; the superseded parts are logged in `docs/DEVIATIONS.md` (D-22 to D-27). Anything not traceable to a source is marked `[NEEDS VERIFICATION]`.

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
- The frontend never talks to the database and never holds tenant logic. Tenant isolation, authorization, RLS and PHI protection are backend responsibilities. The UI reflects them (401, 403, cross-tenant 404).
- **Contract:** `docs/openapi/newcp-v1.openapi.yaml` (Bishoy, OpenAPI 3.0.3, v1.0.0, 23 Oct; `x-contract-status` still `NOT_FINAL`). It supersedes the package's v0.9 F07 contract (D-33). Endpoints: catalog services, form schema, order services (list, create), service item (get, patch), available transitions, transition, history, eligible billed parties, and the new lookups for zero-charge reasons and hold reasons.
- **Data path:** pages -> `src/features/services/data/serviceApi.ts` (mock or real, one interface) -> `src/shared/api/` client. `VITE_USE_MOCKS=true` until a real backend is demonstrated. The UI shows MOCK or INTEGRATED.
- The v1 contract still has **no report endpoint and no order list, search or get** (G3, Q-B3): the report stays on mock data, labelled MOCK, and the demo order is a known synthetic UUID.

## 3. Demo scope (what Option A must show)
1. Login; every route protected; logout. Real Google sign-in is blocked on the auth adapter (R06); the token source and 401 handling are built.
2. Combined Models/Conversion report, counted by service **instance**, with filters, sort, paging (mock, labelled).
3. Biomodel ("Models") and Conversion services on an existing order: create, edit, reopen, status transition (from `available-transitions`), per-instance history.
4. All form controls: Biomodel 28, Conversion 21, including conditional and nested ones, plus CP staff fields (Redo, status, pending, pending reason, cost, zero-charge reason/detail, rush, currency, Bill To, internal comment).
5. Service-level **Bill To** (F07): Doctor or Scanning Center per service, from eligible billed parties, one service at a time; mock adapter now, real save disabled until the F07 gate.
6. Invalid input leaves no partial record and shows an actionable error (422 field details, 409 conflict, 403 read-only).
7. Two same-type services in one order are independent: distinct UUIDs and line numbers, separate edits, status, history, payer and report rows.
8. Unauthorized or cross-tenant access is denied with a clear state.
9. Loading, empty and error states on every screen; responsive desktop, tablet, mobile.

Out of scope: Implant Analog Model (reference only), new-order wizard, export, uploads, email, teeth chart, billing operations, Grafana link.

## 4. Statuses and fields (from the package)
- **Statuses** come from the API: the item's `status` string and `available-transitions` (`transitionId`, `fromCode`, `toCode`, `label`). No hard-coded status lists, IDs or legacy numeric codes. `src/shared/status/status.ts` only maps an API value to a chip label, icon and tone, with a neutral fallback. The provisional statuses of 20 Oct (Awaiting Models, No Scans, ...) are obsolete.
- **Fields** come from `references/v06/form_biomodel.json` (28) and `form_conversion.json` (21). Enforce only UI-attached validators from `02_Validation_Rule_Matrix.csv`. The provisional fields of 20 Oct (option, arch) are obsolete. Field codes in the API are unresolved (R02); the v0.6 field keys are used as provisional `fieldCode`s, labelled MOCK. Answers follow the v1 model `{ fieldCode, value?, optionCodes? }`.
- **Staff fields** the v1 PATCH accepts: Redo and redo-of, service notes, pending reason, quantity, billable, hold type and hold reason (from `/lookups/hold-reasons`), zero-charge reason (from `/lookups/zero-charge-reasons`) and note, Bill To. Not accepted, so read-only: unit price, currency, rush, service cost; shown from `ServiceItem` (`unitPrice`, `fieldsAmount`, `discountAmount`, `voucherAmount`, `lineTotal`, `currencyCode`) where present.
- Error cases the UI must handle: 400, 401, 403, 404 (incl. tenant-masked), 409 (conflict: lock, invoiced, payer after charge), 422 (validation, ineligible payer), 5xx, network. Body shape: `Problem {code, message, requestId?, details?}`.

## 5. Calendar (24 h)
Re-baselined again 23 Oct after Bishoy's v1 contract. Done: A1, A2.4, A5, V3 findings, Task 00, A00, A2R, vite bump, contract v1 docs (hours are written by the developer). Remaining dev days: 25, 26, 27 Oct = **12 h**. Remaining work: 14.5 h as planned before v1; **13.5 h** after folding A9R into A7R and reducing A5R, so **1.5 h over** (section 8).

| Day | Tasks | Hours | What is demonstrated |
|---|---|---|---|
| Sun 25 Oct | A2C, A6R | 1 + 3 = 4 | v1 client and mock; both forms with all controls on the mock |
| Mon 26 Oct | A7R (incl. A9R), A8R | 3 + 1 = 4 | instance detail with staff fields and lookups, transitions, history, independence, denied states, Bill To |
| Tue 27 Oct | A5R, A11, A4 (reduced), A12, A13 (trimmed), A14 | 0.5 + 2 + 0.5 + 0.5 + 0.75 + 1 = 5.25 | report re-key, tests, 401 handling, CI, Docker + README, release candidate |

A10 (live API) has 0 h: blocked by R08 (no running backend) and the F07 gate. If the backend appears, it replaces A14 time.

## 6. What we reused (read-only sources, copied out)
`sources/mui` (base: app, theme, components, table, status) and `sources/poc-mui` (token scripts; form host, fields, error summary, dirty guard, timeline and action panel still to be adapted in A6R/A7R). Full map: `docs/DEVIATIONS.md`, "Reuse map (A1)".

## 7. Deviations from the standard (to be approved by Aya)
1. Base is the `mui` POC with MUI; the package expects the Tailwind prototype unless an ADR approves MUI (R14, G2).
2. Tests: Vitest + React Testing Library (+ vitest-axe if approved), installed in A2R after G1, required from then on.
3. `domain/`, `data/` and seed JSON are replaced by `shared/status/`, `shared/api/`, `features/services/data/` and `mocks/`.
4. The report stays on mock data until a report endpoint exists (G3).
5. Staff money fields are read-only or mock-saved until the contract can PATCH them (G5).

## 8. Risks and cut order
R1 no buffer: 13.5 h of work in 12 h (Tuesday holds 5.5 h). **Applied now:** A9R folded into A7R (saves 0.5 h) and A5R reduced to 0.5 h. **Cut order for the remaining 1.5 h:** (1) dark-mode checks (0.5 h), (2) tablet polish (0.5 h), (3) the Sonar step (0.25 h), (4) history pagination (not planned). Cuts 1-3 recover about 1.25 h; the last 0.25 h is covered by trimming A13 to Dockerfile + README (no `docs/ux-rationale.md`), decided by the developer on 23 Oct. With all of these applied, the plan fits 12 h with no buffer. Money fields are read-only by contract now, so the old cut "mock-saving money fields" no longer applies. The core flow, the forms and Bill To on the mock are never cut.
R2 contract provisional and changing: one shared client, one adapter interface, typed from the OpenAPI.
R3 no backend (R08) and unresolved catalog/field/transition mappings (R01-R03): everything runs on the mock and is labelled MOCK; no INTEGRATED or PASS claims without executed evidence.
R4 R14 decided against MUI: the UI layer would need a rewrite; business logic, adapter and tests carry over.

## 9. Open questions
For Aya: G1 Vitest/RTL/jsdom (+ vitest-axe) approval; G2 R14 ADR and which repo is "Option A"; G3 report without an endpoint; G4 committing `docs/newcp-ai/` and moving it out of `payload/`; G5 settled by contract v1 (money fields read-only, D-35); G6 cut order (approved 23 Oct); G7 integration branch name and `local_docs` history clean-up.
For Bishoy (after v1): still open Q-B1 status label, Q-B2 (now only unit price, currency, rush, cost), Q-B3 report/list and order endpoints, Q-B5 field/option codes and catalog UUIDs, Q-B6 actor names, Q-B7 Problem codes; new Q-B8 to Q-B15 (concurrency, hold flow, zero-charge flow, field types and rule shapes, quantity decimals, isBillable meaning, contract status). Q-B4 answered by v1. Details: `docs/DEVIATIONS.md`, "Questions after contract v1".
