# CLAUDE.md: New CP Option A (React + TS + MUI)
Owner: Rashad (FE intern). Mentor/reviewer: Aya Adel. Contract author: Bishoy. Option B: Abdo (separate UI, same API).

## Authority (highest first)
1. AI Development Handoff Package v0.9 (F07) in `docs/newcp-ai/`: policy/, tasks/04 + 07 + 06, F07 contract and client.
2. Explicit New CP decisions > evidenced legacy rules (Connect create, CP clerk edit) > developer proposals.
3. This file, then docs/PLAN.md and TASKS.md. Where they disagree with 1, 1 wins; log it in docs/DEVIATIONS.md.
V0.7 files are archival. V0.6 form specs are the source for form controls.
Until G4 is decided, the package sits untracked under `docs/newcp-ai/payload/`; package paths below are relative to that root.

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
- Contract: `docs/openapi/newcp-v1.openapi.yaml` (Bishoy, v1.0.0, 23 Oct; still `NOT_FINAL`). It supersedes the
  package's v0.9 F07 contract for endpoints and fields (D-33); the v0.9 file and typed client are archival.
  Never invent an endpoint, field or error code.
- One shared client in `src/shared/api/` (types follow the v1 contract; auth via token source; no token storage).
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
- Answers use the v1 model: `{ fieldCode, value?, optionCodes? }` (`optionCodes` for every choice field, `[]` when cleared).
- Staff fields the v1 PATCH accepts: Redo, redo-of, notes, pending reason, quantity, billable, hold type/reason
  (lookup), zero-charge reason (lookup)/note, Bill To. Fields it does not accept (unit price, currency, rush, cost)
  are read-only, labelled as such.
- Do not copy legacy hard-coded prices or one-service-per-type limits.

## Status
- Statuses come from the API: `status` string + `available-transitions` (transitionId, label). Never hard-code
  status IDs or legacy numeric codes; never PATCH a status directly.
- `src/shared/status/status.ts` only maps an API value to chip label/icon/tone, with a neutral fallback.
  Status is never shown by colour alone.

## Bill To (F07)
- Per service: Doctor or Scanning Center from `GET /orders/{orderUuid}/eligible-billed-parties`.
- Send `billedToContactUuid` for ONE service on create/patch. Never send billedPartyOrigin or tenantId.
  Never copy an order-level Bill To.
- Honour `canEditBilledParty`; render 403/409/422. Never show success unless the API persisted it.
- Real persistence stays disabled until the F07 gate is confirmed by the backend owner (F07-01..05).

## Stack (pinned; every dependency approved)
React + TS strict + Vite, React Router, react-hook-form + zod, MUI (@mui/material, @mui/x-date-pickers,
@mui/icons-material), dayjs, @fontsource. No second UI kit, no state library. R14 (Tailwind vs MUI) is OPEN
until Aya's ADR.
Commands: dev, lint, typecheck, build, check-tokens, test, verify (lint + typecheck + build + check-tokens + test).
`test` and its place in `verify` are added in A2R, after the developer confirms Aya's approval of Vitest (G1).

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
- Unit/component tests are required now (Vitest + RTL after approval). Browser tests when a runner exists.
- Report PASS/FAIL/NOT RUN/BLOCKED honestly. Never claim live, E2E or integration PASS that wasn't executed.

## End of task
npm run verify -> update docs/EVIDENCE.md, DEVIATIONS.md, TASKS.md status, AI_USAGE_LOG.md ->
save `.handoff/task-A<NN>-commit.txt` -> handoff block -> STOP. Git details: `GIT_WORKFLOW.md`.
