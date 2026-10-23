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
- **Contract:** `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml` (OpenAPI 3.0.3, v0.9.0-draft, PROVISIONAL) and the typed client `newcp-demo-client-f07.ts`. Endpoints: catalog services, form schema, order services (list, create), service item (get, patch), available transitions, transition, history, eligible billed parties.
- **Data path:** pages -> `src/features/services/data/serviceApi.ts` (mock or real, one interface) -> `src/shared/api/` client. `VITE_USE_MOCKS=true` until a real backend is demonstrated. The UI shows MOCK or INTEGRATED.
- The contract has **no report endpoint and no order list/search** (G3, Q-B3): the report stays on mock data, labelled MOCK.

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
- **Fields** come from `references/v06/form_biomodel.json` (28) and `form_conversion.json` (21). Enforce only UI-attached validators from `02_Validation_Rule_Matrix.csv`. The provisional fields of 20 Oct (option, arch, quantity) are obsolete. Field codes in the API are unresolved (R02); the v0.6 field keys are used as provisional `fieldCode`s, labelled MOCK.
- **Staff fields** without a PATCH property in the contract (cost, rush, currency, zero-charge) are shown read-only or mock-saved, labelled (G5, Q-B2).
- Error cases the UI must handle: 400, 401, 403, 404 (incl. tenant-masked), 409 (conflict: lock, invoiced, payer after charge), 422 (validation, ineligible payer), 5xx, network. Body shape: `Problem {code, message, requestId?, details?}`.

## 5. Calendar (24 h)
Spent: 20 Oct A1 + A2.4 (4 h); 21 Oct A5 (4 h); 22 Oct V3 findings + Task 00 preflight (about 2 h). Remaining: about 14 h. Planned work: 16 h, so about 2 h over (cut order in section 8).

| Day | Tasks | Hours | What is demonstrated |
|---|---|---|---|
| 23 Oct (remaining 22 Oct time) | A00, A2R start | 0.5 + 1.5 | merged rules, re-baselined plan; shared client and mock adapter |
| Sun 25 Oct | A2R finish, A6R, A7R start | 0.5 + 3 + 0.5 | both forms with all controls on the mock |
| Mon 26 Oct | A7R, A8R, A9R, A5R, A11 | 2 + 1 + 1 + 1 + 2 | instance detail, transitions, history, Bill To, independence, report re-key, tests |
| Tue 27 Oct | A4 (reduced), A12, A13, A14 | 0.5 + 0.5 + 1 + 1 | 401 handling, CI, Docker, release candidate |

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
R1 no buffer: 16 h planned in about 14 h. **Cut order:** (1) dark-mode checks, (2) mock-saving money fields (show read-only), (3) tablet polish, (4) the Sonar step, (5) history pagination (not planned). **If we slip, A9R merges into A7R.** The core flow, the forms and Bill To on the mock are never cut.
R2 contract provisional and changing: one shared client, one adapter interface, typed from the OpenAPI.
R3 no backend (R08) and unresolved catalog/field/transition mappings (R01-R03): everything runs on the mock and is labelled MOCK; no INTEGRATED or PASS claims without executed evidence.
R4 R14 decided against MUI: the UI layer would need a rewrite; business logic, adapter and tests carry over.

## 9. Open questions
For Aya: G1 Vitest/RTL/jsdom (+ vitest-axe) approval; G2 R14 ADR and which repo is "Option A"; G3 report without an endpoint; G4 committing `docs/newcp-ai/` and moving it out of `payload/`; G5 staff money fields read-only or mock-saved; G6 cut order (approved 23 Oct); G7 integration branch name and `local_docs` history clean-up.
For Bishoy: Q-B1 status label; Q-B2 PATCH for money fields; Q-B3 report/list endpoint (due date, priority, server paging); Q-B4 `edit()` type vs PATCH schema; Q-B5 field/option codes and catalog UUIDs; Q-B6 actor names in history; Q-B7 Problem codes. Details: `docs/DEVIATIONS.md`, "Questions".
