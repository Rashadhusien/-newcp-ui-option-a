# CLAUDE.md: New CP Option A (React + TS + MUI)
Owner: Rashad (FE intern). Mentor/reviewer: Aya Adel. Contract author: Bishoy. Option B: Abdo (separate UI, same API).

## Authority (highest first)
1. AI Development Handoff Package v0.9.2.2 in `docs/newcp-ai/` (v0.9.1 baseline + v0.9.2 overlays): policy/
   (APPROVED_QB8_QB15_DECISIONS, CURRENT_V3_DATABASE_STATUS, IS_BILLABLE_AND_BILL_TO_DECISION,
   V092_IMPLEMENTATION_ROLLOUT_AND_DB_SAFETY), tasks/04 + 07 + 06, F07 contract and client.
   IAM overlay v0.9.7 (26 Oct; v0.9.3-v0.9.6 superseded): policy/IAM_APPROVED_BUSINESS_SPEC_v1.2,
   references/iam/ (TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1 sections B, D, G, H; API_ERROR_CONTRACT;
   ROLE_CAPABILITY_MATRIX; TENANT_OCT_DEMO_ACCEPTANCE_TESTS). The service OpenAPI is unchanged by it (D-50).
   API contract (28 Oct, D-79): the backend's canonical `docs/openapi/newcp.openapi.yaml` supersedes the package's
   F07 OpenAPI; the backend answers of 28 Oct are in docs/DEVIATIONS.md.
   v0.9.8 REVIEW (28 Oct, D-85; `local_docs/NewCP_Approved_Developer_Handoff_v0.9.8_REVIEW_2026-10-28/`, folder
   `2026-10-28_DASHBOARD_IAM_API_UPDATES/`): OD-01..OD-24 Orders Dashboard decisions, answers register, 22-column
   map. The Orders Dashboard is DESIGN-ONLY (labelled mock, no dashboard API calls). Its proposed endpoints
   (`02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml`) and the merged `03_...REVIEW.yaml` are NOT the contract.
   Open backend blockers and questions: docs/BACKEND_BLOCKERS.md.
2. Explicit New CP decisions > evidenced legacy rules (Connect create, CP clerk edit) > developer proposals.
3. This file, then docs/PLAN.md and TASKS.md. Where they disagree with 1, 1 wins; log it in docs/DEVIATIONS.md.
V0.7 files are archival. V0.6 form specs are the source for form controls.
The package is a local, git-ignored copy under `docs/newcp-ai/payload/` (G4 decided, D-32; the v0.9 copy is kept in
`payload-v0.9/`); package paths below are relative to `payload/`.

## Working rules
- Never start a task before the developer writes `start A<NN>`. One task = one branch = one commit = one PR.
- Read-only git plus one `git switch -c <branch>` per task. The developer commits, pushes and merges.
- Never run SQL, ETL, migrations, drizzle-kit, remote/ssh, or the package's source scripts.
- Mock data only (synthetic UUIDs, invented names). No real patient, doctor, clinic or customer data. No secrets anywhere.
- If something needed doesn't exist (endpoint, field, approval), stop and say exactly what is missing.
- Unknown = `[NEEDS VERIFICATION]` + an entry in docs/DEVIATIONS.md. Never guess a status, field, role, price or rule.
- Business evidence labels: NEWCP_CONFIRMED, LEGACY_UI_OBSERVED, LEGACY_CP_OBSERVED, V3_DDL_VERIFIED, CANDIDATE_UNVERIFIED, DEMO_ONLY_APPROVED, BLOCKED.

## Scope
Internal clerk flow for existing orders: Biomodel ("Models") and Conversion services. Create, edit, status
(workflow transitions), per-instance history, service-level Bill To, instance-aware report. Implant Analog
Model is reference only. Two same-type services in one order are independent: distinct UUIDs, edits,
status, history, payer and report rows. Never a type-level identifier.

## Contract and API
- Contract (28 Oct, D-79): the backend's canonical `docs/openapi/newcp.openapi.yaml` (backend repo
  `swd-3ddx/newcp-api`, `openapi/newcp.openapi.yaml`; 18 operations, `NOT_FINAL`, live behaviour unverified) + typed
  client. It replaces the package reference and Bishoy's v1 draft for all API work; the test server serves the same
  file (`http://10.20.25.147:3001/docs`, company VPN). Never invent an endpoint, field or error code.
- One shared client in `src/shared/api/` (types follow the canonical contract). Auth (in the contract, Q-B27):
  Google Identity Services gives a Google ID token -> `POST /api/v1/auth/login` `{ "idToken": ... }` -> either
  `AUTHORIZED` with `token` + `expiresAt`, or `PENDING_ACCESS` with no token -> `Authorization: Bearer <token>` on
  every request; `POST /api/v1/auth/logout` on sign-out. The token is held in memory only (no localStorage,
  sessionStorage or cookie written by the UI); a reload signs in again (silently through Google One Tap when the
  user's Google session allows it). Session limits (Q-B29, approved): 30 minutes idle with a warning 2 minutes before,
  8 hours after sign-in, or the server's `expiresAt`, whichever comes first (A36). Never send the
  Google ID token to any other endpoint. Auth, IAM and session questions go to Hesham.
- Errors: auth errors use `{error:{code,message,...}}`, other errors the flat `Problem` `{code,message,requestId,details}`
  (the test server answers 401 with the flat shape); accept both (Q-B22).
- Concurrency (Q-B8): keep the item ETag; send `If-Match` on every PATCH and transition. 412 = changed by someone
  else: keep the user's edits and offer a reload. 428 = precondition missing (a bug). 409 = workflow/financial conflict.
- Feature adapter: `src/features/services/data/serviceApi.ts`, with a mock and a real implementation behind one interface.
- `VITE_USE_MOCKS=true` uses the mock adapter (contract-shaped data and Problem errors: 400/401/403/404/409/422/5xx).
- Mocks stay until a real API is demonstrated. The UI shows an evidence label: MOCK or INTEGRATED.
- Frontend validation only for usability; server errors are always shown (422 field details, 409 conflict, 403 read-only).

## Forms
- Generate ALL controls from `references/v06/form_biomodel.json` (28) and `form_conversion.json` (21), including
  conditional and nested ones, plus CP staff fields (Redo, status, pending, pending reason, cost, zero-charge
  reason/detail, rush, currency, Bill To, internal comment).
- Enforce only validators the source actually attached (02_Validation_Rule_Matrix: UI-attached).
  DEFINED_NOT_ATTACHED rules are not enforced; display-only warnings stay warnings.
- Answers follow the canonical contract (Q-B16 answered): `fieldCode` + `optionCodes: string[]` for choice fields
  (single select = one item, cleared = `[]`) or `value` (string | number | boolean, real JSON types, dates as
  `YYYY-MM-DD`) for every other field; never both, never the removed carriers (`optionCode`, `valueText`, ...: 400).
  PATCH `answers` replaces the whole set. One conversion function maps form values to the wire format. File and
  tooth-chart answers have no confirmed payload: do not invent one. Field types are the 8 canonical types (Q-B11).
- Staff fields (PATCH): Redo, redo-of, notes, pending reason, quantity (> 0, decimals allowed; demo default 1, Q-B13),
  Billable Yes/No (`canEditBillability`, Q-B14), unit price override (`canEditPrice`, Q-B10), zero-charge reason/note
  (a zero final total needs a reason: 422 `ZERO_CHARGE_REASON_REQUIRED` on `zeroChargeReasonCode`), Bill To (mock).
  Read-only, labelled: currency, rush. Hold type/reason are set only by the On Hold transition.
- Do not copy legacy hard-coded prices or one-service-per-type limits.

## Status
- Statuses come from the API: `status` string + `available-transitions` (transitionId, label). Never hard-code
  status IDs or legacy numeric codes; never PATCH a status directly.
- On Hold (Q-B9): a transition into `on_hold` opens a dialog that requires hold type (customer/internal) and one
  reason from `GET /catalog/hold-reasons?holdType=`; type and reason travel in the SAME transition request. Reasons
  are synthetic and must be labelled "Demo only".
- `src/shared/status/status.ts` only maps an API value to chip label/icon/tone, with a neutral fallback.
  Status is never shown by colour alone.

## Session and access (IAM v0.9.7)
- Google is authentication only; no Google Groups. Authorization is server-side (PostgreSQL IAM + Casbin).
- One read-only session context call on app load and after a 403: `GET /api/v1/auth/me` (in the contract, Q-B20)
  returns `email`, `userUuid`, `tenantSlug`, `roleCodes`, `capabilities`, `isPendingAccess`; it is mapped once into
  the app's session context (the tenant badge shows `tenantSlug`, no tenant label exists). Capability codes still
  need Hesham's confirmation against the IAM matrix.
- AUTHORIZED: workspace with a read-only tenant badge; no tenant selector. PENDING (or 403 `ACCESS_NOT_ASSIGNED` /
  `TENANT_NOT_ASSIGNED`): Pending Access page with no features. 401 `AUTHENTICATION_REQUIRED`: back to sign-in,
  keeping only a safe in-app return path. Other 403: access denied. 404: generic "not available", no existence leak.
- Never send `tenantId` or `X-Tenant-Id`; no default or fallback tenant anywhere in config; the tenant label comes
  only from the context.
- Capability flags are display-only (hide/disable actions); the server decides and its 403 is always shown. Codes
  follow ROLE_CAPABILITY_MATRIX (approved by Hesham as the `/auth/me` codes, Q-B20, 28 Oct). G11 confirmed (v0.9.8, OD-01..03): FINANCE and QC
  see all tenant-authorized order/service details; FINANCE also makes the approved financial edits; QC is read-only
  apart from audit actions (D-87). All five roles view reports; export only FINANCE/QC/ADMIN, and there is no export
  endpoint, so no export control (D-54).
- Sign-in page (A25): one primary action, "Sign in with Google". No email, password, "forgot password", "remember
  workstation" or role selector; the frontend never selects or infers a role, tenant or capability. States: Google
  loading, Google failure, authorized, Pending Access ("Your account is authenticated, but access has not been
  assigned yet."), session expired / 401, access denied / 403.
- Mock mode only: the mock identity picker (CS, OPS, ADMIN, FINANCE, QC, PENDING) simulates what the server would
  answer; it is never rendered with mocks off and is not a token (G18: keep it for the demo?).

## Bill To (F07)
- Per service: Doctor or Scanning Center from `GET /orders/{orderUuid}/eligible-billed-parties`.
- Send `billedToContactUuid` for ONE service on create/patch. Never send billedPartyOrigin or tenantId.
  Never copy an order-level Bill To.
- Honour `canEditBilledParty`; render 403/409/422. Never show success unless the API persisted it.
- F07 is reported COMPLETE by the Technical Lead (v0.9.8, 28 Oct): Bill To is no longer a design blocker, but the
  deployed runtime is still unverified. Until a live call on the test server shows the payer endpoint and PATCH work
  (A31), the real adapter keeps Bill To BLOCKED; it is shown as INTEGRATED only after that executed check.
- Billable and Bill To are independent: changing one never changes the other.

## Stack (pinned; every dependency approved)
React + TS strict + Vite, React Router, react-hook-form + zod, MUI (@mui/material, @mui/x-date-pickers,
@mui/icons-material), dayjs, @fontsource. No second UI kit, no state library. R14 (Tailwind vs MUI) is OPEN
until Aya's ADR.
Commands: dev, lint, typecheck, build, check-tokens, test, verify (lint + typecheck + build + check-tokens + test).
Vitest + jsdom + RTL approved (G1); `test` is part of `verify`.

## Folder structure
src/app, src/features/{auth,orders,services,reporting,settings}, src/shared/{api,components,hooks,lib,status},
src/mocks, src/theme. Features import @/shared/*; no cross-feature internals. Pages default-export + lazy;
everything else named exports.

## Tokens
No colour literals (hex, rgb(), hsl(), named colours) outside `src/theme/tokens.ts`. Components use theme/palette
references; JS-held colours come from the theme. Sizes, spacing, radius, elevation, motion and z-index come from
tokens too. `check-tokens` enforces it. `sx` in features is for layout only.

## Code
No `any` (use `unknown` + narrowing); no non-null `!` without a comment; no `@ts-ignore`; no `!important`; no
`console.log` left in code. Files: components `PascalCase.tsx`, hooks `useThing.ts`, utilities `camelCase.ts`;
one component per file; props typed as `<Component>Props`. Forms: react-hook-form + zod, an error summary on
failed submit, a dirty guard on long forms. Icons: `@mui/icons-material`, sizes 16/20/24.

## Accessibility and responsive
Every control has a visible label or `aria-label`; error text linked with `aria-describedby`; focus always visible;
dialogs trap focus and restore it; tables have headers (`scope`); status never by colour alone (icon + label);
touch targets >= 40 px under 768; respect `prefers-reduced-motion`. Verify at 390, 768, 1024, 1440; no horizontal
page scroll (tables become cards on phones); light and dark both checked.

## Tests and evidence
- **New tests are deferred (27 Oct, developer decision, D-66):** tasks A17 to A23 add no new Vitest tests; they are
  written in A24 after those pages are finished. The existing suite still runs in `npm run verify` and must stay
  green: a task that breaks an existing test fixes or updates it. Browser checks stay required for every task.
- Report PASS/FAIL/NOT RUN/BLOCKED honestly. Never claim live, E2E or integration PASS that wasn't executed.

## End of task
npm run verify -> update docs/EVIDENCE.md, DEVIATIONS.md, TASKS.md status, AI_USAGE_LOG.md ->
save `.handoff/task-A<NN>-commit.txt` -> handoff block -> STOP. Git details: `GIT_WORKFLOW.md`.
