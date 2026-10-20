# PLAN: New CP frontend, UI Option A

Status: working plan, 20 Oct 2026. Sources: Aya's kickoff email (19 Oct) and the team package (execution plan, repository standards, API guardrails, demo scope, acceptance checklist, task-breakdown template). Anything not traceable to those is marked `[NEEDS VERIFICATION]`.

## 1. Context
- Customer: 3D Diagnostix (dental, AI-assisted platform). Project: **New CP**, a rebuild of the legacy CP (Case Portal) web app.
- Milestone: **CEO demo on Thu 29 Oct 2026**, rehearsal Wed 28 Oct. Dev days: 20, 21, 22, 25, 26, 27 Oct.
- Developer: Rashad, frontend intern, **4 h/day x 6 days = 24 h**. Mentor and reviewer: Aya Adel. Backend contract author: Bishoy. Option B (a second, independent UI) is built by Abdo (full-stack intern).
- Two UIs, one backend: Option A (this repo) and Option B must differ in UX, share no component library, and consume the same API. Option B may be at most one gate behind Option A.

## 2. Architecture
```
Browser (React + MUI, this repo)  --HTTPS-->  Express + TypeScript + Drizzle + Zod  -->  PostgreSQL V3
        Google login  ---------------------->  session/token validated by the backend
```
- The frontend never talks to the database and never holds tenant logic. Tenant isolation, authorization, RLS and PHI protection are backend responsibilities. The UI reflects them (403, cross-tenant denied).
- **Contract-first**: `newcp-api/openapi/newcp.openapi.yaml` (OpenAPI 3.0.3, written by Bishoy) defines endpoints and shapes. The frontend starts on mocks shaped from the contract and must prove the live API before the freeze.
- Reporting view in V3: `reporting.v_order_items` (one row per service instance, status per service line). Patient identity is hidden; only the patient code is shown.

## 3. Demo scope (what Option A must show)
1. Google login; every route protected; logout.
2. Combined Models/Conversion report, counted by service **instance** (not by order), with filters, sort, paging.
3. Models: create, edit, reopen, status transition, history.
4. Conversion: create, edit, reopen, status transition, history.
5. Invalid input leaves no partial record and shows an actionable error.
6. Two same-type instances in one order are independent: distinct IDs, separate history.
7. Attachments are display-only.
8. Unauthorized or cross-tenant access is denied with a clear state.
9. Loading, empty and error states on every screen; responsive desktop, tablet, mobile.

Out of scope: new-order wizard, export, S3 upload, email, teeth chart, billing, Grafana link (add only if Aya requires it, about 0.5 h).

## 4. Statuses and fields (provisional)
Models: Awaiting Models, On its way, In Progress, Done. Conversion: No Scans, In Progress, Download. Initial status and permitted next steps are `[NEEDS VERIFICATION]` (open question Q2). Models fields in the mockups (option, arch, quantity, due date, priority, instructions) and Conversion fields (type, arch, custom options, due date, priority, instructions) are assumptions until the contract confirms them (Q1). All of them live in `src/shared/status/` and the form schemas so a change is a small edit.
Known error cases the UI must handle: validation failure, prohibited status transition, invoiced service (price/payer locked), record locked by another user, 403/cross-tenant, 5xx.

## 5. Gates and calendar (24 h)
| Gate | Date | Tasks | What is demonstrated |
|---|---|---|---|
| D1 | Tue 20 Oct | A1, A2, A3 | repo builds, folder layout, question list for the OpenAPI draft |
| D2 | Wed 21 Oct | A4, A5 | login guard and the combined report on mocks, all states, responsive |
| D3 | Thu 22 Oct | A6, A7 | Models create/edit/reopen/transition/history end to end (live API if ready) |
| D4 | Sun 25 Oct | A8, A9 | Conversion plus duplicate instances on the real API, denied states |
| D5 | Mon 26 Oct | A10, A11, A12 | integration complete, tests green, CI and Sonar, then freeze |
| D6 | Tue 27 Oct | A13, A14 | Docker run, README on a clean clone, release candidate |
Open: the freeze is 27 Oct in the guide but end of 26 Oct in the plan (Q6); a 7th day is not confirmed.

## 6. What we reuse (read-only sources, copy files out)
`sources/mui` = the Enterprise Dashboard POC (base): `app/` (providers, router, AuthBoundary), `theme/`, `components/{basic,composite,data-display,feedback,layout}` (AppButton, AppTextField, AppSelect, StatusBadge, ConfirmDialog, FormDialog, ResponsiveDataTable, TableToolbar, TablePager, ActivityFeed, EmptyState, ErrorState, LoadingState, ToastProvider, AppShell, Sidebar, Header, SkipLink), `domain/status.ts`, `hooks/useTableControls.ts`, `features/auth/LoginPage.tsx`, `features/orders/*` as layout inspiration.
`sources/poc-mui` = the CP-pages POC (parts only): `components/form/{ServiceFormHost,fields,ErrorSummary,FormSection,LeavePageDialog}`, `hooks/useDirtyGuard.ts`, `components/Timeline.tsx`, `components/ActionPanel.tsx`, `components/ResponsiveTable/*`, `services/api.ts` interface pattern, `services/latency.ts`, `scripts/check-tokens.mjs`, `scripts/contrast.mjs`.
Do not reuse: seed data, billing/clinics/doctors/patients/documents/notifications/scan-center/workflow-board/change-requests/dashboard/showcase features, teeth chart, kanban, charts, support widget, Kendo-copy rules, and the POC rules "no tests" and "mock only".
A Claude Design mockup of the demo screens exists (concept only, built on provisional statuses). It is a visual reference for layout and states, never a specification.

## 7. Deviations from the standard (to be approved by Aya)
1. Base is the `mui` POC; form parts come from `poc-mui`.
2. The POCs defer or forbid tests; this repo adds Vitest + React Testing Library (+ vitest-axe if approved) at A11.
3. `domain/`, `data/` and seed JSON are replaced by `shared/status/`, `shared/api/` and `mocks/`.
4. The POC rule "mock data only" is replaced by "mock first, live API from D3/D4".

## 8. Risks
R1 no buffer in 24 h (cut order: tablet polish, dark-mode checks, history pagination; the core flow is never cut). R2 contract or live API late or changing (mock-first, one API client file, test the live switch at D3). R3 provisional statuses and fields hit the forms (one mapping file, confirm by 21 Oct).

## 9. Open questions
Q1 exact Models/Conversion fields and options. Q2 initial status and permitted transitions. Q3 Google login to user/tenant mapping and the token/session the API expects. Q4 availability of the contract and endpoints per gate. Q5 who seeds demo data, including the duplicate-instances order. Q6 freeze date and a 7th day. Q7 approval of Vitest, React Testing Library and optionally vitest-axe.
