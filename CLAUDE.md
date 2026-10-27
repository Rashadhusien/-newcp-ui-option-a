# CLAUDE.md: New CP Option A (React + TS + MUI)
Owner: Rashad (FE intern). Mentor/reviewer: Aya Adel. Contract author: Bishoy. Option B: Abdo (separate UI, same API).

## Authority (highest first)
1. AI Development Handoff Package v0.9.2.2 in `docs/newcp-ai/` (v0.9.1 baseline + v0.9.2 overlays): policy/
   (APPROVED_QB8_QB15_DECISIONS, CURRENT_V3_DATABASE_STATUS, IS_BILLABLE_AND_BILL_TO_DECISION,
   V092_IMPLEMENTATION_ROLLOUT_AND_DB_SAFETY), tasks/04 + 07 + 06, F07 contract and client.
   IAM overlay v0.9.7 (26 Oct; v0.9.3-v0.9.6 superseded): policy/IAM_APPROVED_BUSINESS_SPEC_v1.2,
   references/iam/ (TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1 sections B, D, G, H; API_ERROR_CONTRACT;
   ROLE_CAPABILITY_MATRIX; TENANT_OCT_DEMO_ACCEPTANCE_TESTS). The service OpenAPI is unchanged by it (D-50).
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
- Contract: `references/f07/integration/newcp-demo-f07.openapi.yaml` (v0.9.2-draft, `NOT_FINAL`) + typed client. Q-B15:
  the package reference wins over Bishoy's `docs/openapi/newcp-v1.openapi.yaml`, which stays a draft the backend
  reconciles into one snapshot (D-40). Never invent an endpoint, field or error code.
- One shared client in `src/shared/api/` (types follow the reference contract). Auth (backend team, 27 Oct, D-67;
  not yet in the OpenAPI, Q-B27): Google Identity Services gives a Google ID token -> `POST /api/v1/auth/login`
  `{ "idToken": ... }` -> New CP session token + expiry -> `Authorization: Bearer <session-token>` on every request.
  The session token is held in memory only (no localStorage, sessionStorage or cookie written by the UI); a reload
  signs in again. Never send the Google ID token to any other endpoint.
- Errors: accept both the OpenAPI Problem `{code,message,requestId,details}` and the IAM envelope
  `{error:{code,message,requestId,details}}` (Q-B22). Codes are the recommended IAM codes until the OpenAPI lists them.
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
- Answers follow the reference contract (v0.9.2: `optionCode`/`optionCodes`, `valueText`/`valueNumber`/`valueBoolean`/
  `valueDate`); one conversion function maps form values to the wire format, so a change after Bishoy's answer
  (Q-B16) stays local. Field types are the 8 canonical types (Q-B11); radio vs select is presentation only.
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
- One read-only session context call on app load and after a 403 (illustrative `GET /api/v1/session/context`, NOT in
  the OpenAPI, Q-B20): MOCK only; with mocks off it is BLOCKED like Bill To (D-51). It returns AUTHORIZED or PENDING,
  the active tenant label, roles and capability flags.
- AUTHORIZED: workspace with a read-only tenant badge; no tenant selector. PENDING (or 403 `ACCESS_NOT_ASSIGNED` /
  `TENANT_NOT_ASSIGNED`): Pending Access page with no features. 401 `AUTHENTICATION_REQUIRED`: back to sign-in,
  keeping only a safe in-app return path. Other 403: access denied. 404: generic "not available", no existence leak.
- Never send `tenantId` or `X-Tenant-Id`; no default or fallback tenant anywhere in config; the tenant label comes
  only from the context.
- Capability flags are display-only (hide/disable actions); the server decides and its 403 is always shown. Codes
  follow ROLE_CAPABILITY_MATRIX (`CANDIDATE_UNVERIFIED`, D-53). FINANCE and QC: reports only (G11 open). All five
  roles view reports; export only FINANCE/QC/ADMIN, and there is no export endpoint, so no export control (D-54).
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
- Current V3 has `is_billable` but NOT `billed_to_contact_id` / `billed_party_origin` (CURRENT_V3_DATABASE_STATUS):
  Bill To is MOCK only. With mocks off, the adapter never calls the payer endpoint or sends a payer, and the UI says
  BLOCKED; Bill To is never shown as INTEGRATED until the DB owner confirms F07 (F07-01..05).
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
