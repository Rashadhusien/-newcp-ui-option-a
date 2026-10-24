# PLAN: New CP frontend, UI Option A

Status: re-baselined 23 Oct 2026 (A00) on the AI Development Handoff Package v0.9 (F07), and again on 24 Oct (A00b) on its v0.9.2.2 update (approved Q-B8 to Q-B15). The package is the highest authority for the contract, the form fields and the business rules (see `CLAUDE.md`, "Authority"). The 20 Oct plan is superseded where it disagrees; the superseded parts are logged in `docs/DEVIATIONS.md` (D-22 to D-27, D-40 to D-47). Anything not traceable to a source is marked `[NEEDS VERIFICATION]`.

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
- **Contract:** the package's `references/f07/integration/newcp-demo-f07.openapi.yaml` (v0.9.2-draft, `NOT_FINAL`). Q-B15 makes it the reference over Bishoy's `docs/openapi/newcp-v1.openapi.yaml` (v1.0.0), which the backend reconciles into one snapshot (D-40). Endpoints: catalog services, form schema, hold reasons (`/catalog/hold-reasons?holdType=`), order services (list, create), service item (get with ETag, patch with If-Match), available transitions, transition (If-Match; carries hold type/reason), history, eligible billed parties. No zero-charge reasons endpoint (Q-B17).
- **Database facts (24 Oct, Technical Lead):** current V3 has `orders.order_items.is_billable`; F07's `billed_to_contact_id` and `billed_party_origin` do NOT exist yet. Billable is real; Bill To stays MOCK and disabled outside the mock (D-44).
- **Data path:** pages -> `src/features/services/data/serviceApi.ts` (mock or real, one interface) -> `src/shared/api/` client. `VITE_USE_MOCKS=true` until a real backend is demonstrated. The UI shows MOCK or INTEGRATED.
- The reference contract still has **no report endpoint and no order list, search or get** (G3, Q-B3): the report stays on mock data, labelled MOCK, and the demo order is a known synthetic UUID.

## 3. Demo scope (what Option A must show)
1. Login; every route protected; logout. Real Google sign-in is blocked on the auth adapter (R06); the token source and 401 handling are built.
2. Combined Models/Conversion report, counted by service **instance**, with filters, sort, paging (mock, labelled).
3. Biomodel ("Models") and Conversion services on an existing order: create, edit, reopen, status transition (from `available-transitions`), per-instance history.
4. All form controls: Biomodel 28, Conversion 21, including conditional and nested ones, plus CP staff fields (Redo, status, pending, pending reason, unit price override, Billable Yes/No, quantity, zero-charge reason/detail, rush, currency, Bill To, internal comment).
5. Service-level **Bill To** (F07): Doctor or Scanning Center per service, from eligible billed parties, one service at a time; MOCK only (the DB columns don't exist yet), independent of Billable.
6. **Concurrency** (Q-B8): a stale edit (412) never overwrites someone else's change; the user keeps their edits and can reload.
7. **On Hold** (Q-B9): putting a service on hold asks for hold type and a "Demo only" reason in one step.
8. Invalid input leaves no partial record and shows an actionable error (422 field details, 409 conflict, 403 read-only).
9. Two same-type services in one order are independent: distinct UUIDs and line numbers, separate edits, status, history, payer and report rows.
10. Unauthorized or cross-tenant access is denied with a clear state.
11. Loading, empty and error states on every screen; responsive desktop, tablet, mobile.

Out of scope: Implant Analog Model (reference only), new-order wizard, export, uploads, email, teeth chart, billing operations, Grafana link.

## 4. Statuses and fields (from the package)
- **Statuses** come from the API: the item's `status` string and `available-transitions` (`transitionId`, `fromCode`, `toCode`, `label`). No hard-coded status lists, IDs or legacy numeric codes. `src/shared/status/status.ts` only maps an API value to a chip label, icon and tone, with a neutral fallback. The provisional statuses of 20 Oct (Awaiting Models, No Scans, ...) are obsolete.
- **Fields** come from `references/v06/form_biomodel.json` (28) and `form_conversion.json` (21). Enforce only UI-attached validators from `02_Validation_Rule_Matrix.csv`. The provisional fields of 20 Oct (option, arch) are obsolete. Field codes in the API are unresolved (R02); the v0.6 field keys are used as provisional `fieldCode`s, labelled MOCK. Answers follow the reference carriers (`optionCode`/`optionCodes`, `valueText`/`valueNumber`/`valueBoolean`/`valueDate`) after A2D; the code uses v1's `value`/`optionCodes` until then (D-41, Q-B16). Field types are the 8 canonical types (Q-B11); the generic evaluator for typed `conditionalRules` (Q-B12) is cut for the demo, local rules stay (D-46).
- **Staff fields** (PATCH, reference contract): Redo and redo-of, service notes, pending reason, quantity (> 0, decimals allowed, demo default 1), Billable (`canEditBillability`), unit price override (`canEditPrice`; an authorized override is kept, never re-priced), zero-charge reason/note (a zero final total needs a reason: 422 `ZERO_CHARGE_REASON_REQUIRED`), Bill To (mock). Read-only: currency, rush. Hold type/reason only through the On Hold transition.
- Error cases the UI must handle: 400, 401, 403, 404 (incl. tenant-masked), 409 (workflow/financial conflict: lock, invoiced, payer after charge), 412 (stale ETag), 428 (missing If-Match), 422 (validation, ineligible payer, zero-charge reason), 5xx, network. Body shape: `Problem {code, message, requestId?, details?}`.

## 5. Calendar (24 h)
Re-baselined 24 Oct (A00b) after package v0.9.2.2. Done: A1, A2.4, A5, V3 findings, Task 00, A00, A2R, vite bump, contract v1 docs, A2C, A6R (hours are written by the developer). Remaining dev days: 25, 26, 27 Oct = **12 h**. Remaining work: **12.0 h** with the typed-rules evaluator cut (13.0 h without the cut).

| Day | Tasks | Hours | What is demonstrated |
|---|---|---|---|
| Sun 25 Oct | A00b, A2D, A7R start | 0.25 + 1.5 + 2.25 = 4 | reference contract in client and mock (ETag, hold lookup, price, quantity); instance detail started |
| Mon 26 Oct | A7R finish, A8R, A11 start | 1.75 + 1 + 1.25 = 4 | staff fields (price, Billable, zero-charge, quantity), On Hold dialog, 412 banner, transitions, history, independence, denied states; Bill To on the mock |
| Tue 27 Oct | A11 finish, A5R, A4 (reduced), A12, A13 (trimmed), A14 | 0.75 + 0.5 + 0.5 + 0.5 + 0.75 + 1 = 4 | tests, report re-key, 401 handling, CI, Docker + README, release candidate |

A10 (live API) has 0 h: blocked by R08 (no running backend) and the F07 gate. If the backend appears, it replaces A14 time.

## 6. What we reused (read-only sources, copied out)
`sources/mui` (base: app, theme, components, table, status) and `sources/poc-mui` (token scripts; form host, fields, error summary, dirty guard, timeline and action panel still to be adapted in A6R/A7R). Full map: `docs/DEVIATIONS.md`, "Reuse map (A1)".

## 7. Deviations from the standard (to be approved by Aya)
1. Base is the `mui` POC with MUI; the package expects the Tailwind prototype unless an ADR approves MUI (R14, G2).
2. Tests: Vitest + React Testing Library (+ vitest-axe if approved), installed in A2R after G1, required from then on.
3. `domain/`, `data/` and seed JSON are replaced by `shared/status/`, `shared/api/`, `features/services/data/` and `mocks/`.
4. The report stays on mock data until a report endpoint exists (G3).
5. Unit price is editable for authorized clerks (Q-B10); currency and rush stay read-only.
6. Bill To is MOCK only until the DB owner applies and verifies F07 (D-44).

## 8. Risks and cut order
R1 no buffer: 12.0 h of work in 12 h. **Applied now (24 Oct):** the generic typed-rules evaluator is cut (1 h; local rules stay, D-46); A9R stays folded into A7R; A13 stays trimmed. **Cut order if we slip:** (1) dark-mode checks (0.5 h), (2) tablet polish (0.5 h), (3) the Sonar step (0.25 h), (4) A5R: leave the report as it is, labelled MOCK (0.5 h), (5) history pagination (not planned). Never cut: the core flow, the forms, the On Hold dialog, 412 handling, Bill To on the mock.
R2 contract provisional and changing (v0.9.2 vs Bishoy's v1, Q-B15/Q-B16): one shared client, one adapter interface, one answer-conversion function, typed from the reference OpenAPI.
R3 no backend (R08) and unresolved catalog/field/transition mappings (R01-R03): everything runs on the mock and is labelled MOCK; no INTEGRATED or PASS claims without executed evidence.
R4 R14 decided against MUI: the UI layer would need a rewrite; business logic, adapter and tests carry over.

## 9. Open questions
For Aya (still open): G2 R14 ADR and which repo is "Option A"; G7 integration branch name and `local_docs` history clean-up; new G8 (Q-B15 reverses D-33: confirm), G9 (mock contract price from the package example), G10 (keep local form rules, cut the typed-rules evaluator). G1, G3, G4, G5, G6 are settled.
For Bishoy (still open): Q-B1 status label, Q-B2 (only currency and rush now), Q-B3 report/list/order endpoints, Q-B5 field/option codes and catalog UUIDs, Q-B6 actor names, Q-B7 Problem codes other than `ZERO_CHARGE_REASON_REQUIRED`; new Q-B16 (answer wire format), Q-B17 (zero-charge reasons source), Q-B18 (hold/pending/redo display fields), Q-B19 (ETag exposed through CORS). Q-B4 and Q-B8 to Q-B15 are answered. Details: `docs/DEVIATIONS.md`, "Questions after package v0.9.2.2".
