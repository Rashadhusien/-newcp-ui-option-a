# DEVIATIONS: New CP frontend, UI Option A

Every deviation from `docs/PLAN.md`, `CLAUDE.md` or the New CP standard, with its reason. Items marked `[NEEDS VERIFICATION]` wait for an answer.

## Source locations
The POCs are not inside this repo as `sources/`. They are read from these folders, read-only:
- `sources/mui` = `E:\3ddx\Tasks\Implementaion Tasks\Task mui\mui`
- `sources/poc-mui` = `E:\3ddx\Tasks\Implementaion Tasks\Task mui\Task cp\poc\mui`

Their own `CLAUDE.md`, `AGENTS.md`, `TASKS.md`, `AI_USAGE_LOG.md`, `DEPENDENCIES.md`, `docs/`, `e2e/`, `evidence/` and `vercel.json` do not apply and are not copied.

## Reuse map (A1)
Legend: **copy** = copied as-is apart from import paths; **adapt** = copied, then trimmed or changed as noted; **write** = new file, POC used only as reference.

### Project config (A1.2)
| Source | Destination | Action | Why |
|---|---|---|---|
| mui `package.json` | `package.json` | adapt | Base versions, pinned to the exact versions in mui `package-lock.json`. Removed: `react-odontogram`, `@mui/x-charts` (teeth chart and charts are out of scope), `prettier` (no format script in CLAUDE.md), `@babel/core`, `@rolldown/plugin-babel`, `@types/babel__core` and `babel-plugin-react-compiler` (React Compiler is optional and not in the approved stack). Scripts per CLAUDE.md. `engines.node >=22.12.0` from poc-mui. |
| poc-mui `package.json` | `package.json` | adapt | `eslint-plugin-jsx-a11y 6.10.2`, required by CLAUDE.md. See D-1 for its ESLint version. |
| mui `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | same | copy | Strict mode, `@/` alias, `tsc -b`. |
| mui `vite.config.ts` | `vite.config.ts` | adapt | React Compiler babel plugin removed (see above). The `@/` alias is kept. |
| mui `eslint.config.js` | `eslint.config.js` | adapt | Adds `jsx-a11y` recommended rules and ignores `dist`, `node_modules` and `scripts/*.mjs`. |
| mui `index.html` | `index.html` | adapt | Title "New CP". Adds the pre-paint theme script (write: about 10 lines that set `data-mui-color-scheme` from localStorage or `prefers-color-scheme` before React mounts, so there is no light flash in dark mode). |
| mui `public/favicon.svg` | `public/favicon.svg` | copy | Tab icon. `icons.svg` and `_redirects` (Netlify) are not copied. |

### App, theme and shared code (A1.3)
| Source (mui unless noted) | Destination | Action | Why |
|---|---|---|---|
| `src/main.tsx` | `src/main.tsx` | copy | Entry point and font imports (Inter, Outfit and JetBrains Mono are all used by `typography.ts`). |
| `src/app/App.tsx`, `providers.tsx` | `src/app/` | copy | Theme, toast and router providers. |
| `src/app/router.tsx`, `routes.ts` | `src/app/` | adapt | Only login, the shell and one lazy placeholder page per feature (orders, models, conversion, reporting, settings), plus 404. All other routes are dropped. |
| `src/app/AuthBoundary.tsx` | `src/app/AuthBoundary.tsx` | copy | Route guard. A4 rewrites it for Google. |
| `src/app/auth.ts` | `src/shared/lib/session.ts` | adapt | Mock session placeholder until A4: one `newcp-auth` key and an invented demo user (`Demo User`, `demo.user@example.test`). Moved to `shared/` because `UserMenu` (shared) needs it, and shared code must not import a feature. |
| `src/features/auth/LoginPage.tsx` + `components/layout/AuthLayout.tsx` | `src/features/auth/LoginPage.tsx`, `src/shared/components/layout/AuthLayout.tsx` | adapt | Becomes a login placeholder: one "Sign in (mock)" button and no password field, because the real flow is Google (A4). `PasswordField`, `AppSwitch` and the prefilled demo account are not copied. The brand panel text ("3DDX Connect", "DentaLab", billing) is replaced with New CP text. |
| `src/features/errors/NotFoundPage.tsx` | `src/app/NotFoundPage.tsx` | copy | A1 keeps the 404 page. It lives in `app/` because there is no `errors` feature in the New CP layout (D-3). |
| `src/theme/tokens.ts`, `palette.ts`, `typography.ts`, `components/*`, `augment.d.ts` | `src/theme/` | copy | Tokens, light and dark `colorSchemes`, component overrides. |
| `src/theme/index.ts` | `src/theme/theme.ts` | copy | Renamed to match the CLAUDE.md folder layout. |
| `components/basic/AppButton, AppTextField, AppSelect, StatusBadge` + `index.ts` | `src/shared/components/basic/` | copy | Listed in PLAN §6. `AppTextField` loses its unused `autoFocus` prop (jsx-a11y `no-autofocus`). |
| `components/basic/ThemeModeSelect.tsx` | — | dropped | Copied, then deleted: the copied `Header` already has the Light/Dark/System menu, so this would be dead code. |
| `components/basic/ToneIcon.tsx` | `src/shared/components/basic/` | copy | Not in PLAN §6. Gives an icon per tone, so status is never shown by colour alone. |
| `components/composite/ConfirmDialog, FormDialog` + `index.ts` | `src/shared/components/composite/` | copy | Listed in PLAN §6. |
| `components/data-display/ResponsiveDataTable, TableToolbar, TablePager, ActivityFeed` | `src/shared/components/data-display/` | copy | Listed in PLAN §6. |
| `components/data-display/DetailList, useColumnLayout` | `src/shared/components/data-display/` | copy | Not in PLAN §6. `ResponsiveDataTable` imports them; `DetailList` is its phone card body. |
| `components/data-display/index.ts` | same folder | adapt | Exports only the files copied. |
| `components/feedback/EmptyState, ErrorState, LoadingState, ToastProvider, toast-context` + `index.ts` | `src/shared/components/feedback/` | copy / adapt index | Listed in PLAN §6 (`toast-context` belongs to `ToastProvider`). |
| `components/feedback/InlineAlert.tsx` | `src/shared/components/feedback/` | copy | Not in PLAN §6. 21 lines. Will show server errors inside forms (A6). |
| `components/layout/AppShell, Sidebar, Header, SkipLink` | `src/shared/components/layout/` | adapt | Listed in PLAN §6. Breadcrumbs, the data status bar, global search, notifications and the sidebar metric badges are removed, because they depend on the POC data store. |
| `components/layout/UserMenu.tsx` | `src/shared/components/layout/` | adapt | Not in PLAN §6. Needed for logout. Keeps only the current user name and Sign out. |
| `components/layout/PageHeader.tsx` | `src/shared/components/layout/` | copy | Not in PLAN §6. Used by the 404 page and every page title. |
| `components/layout/navigation.tsx` | `src/shared/components/layout/navigation.tsx` | adapt | Nav items for the five New CP features only. |
| `hooks/useTableControls.ts` | `src/shared/hooks/` | copy | Listed in PLAN §6. |
| `domain/rules/table.ts` | `src/shared/lib/table.ts` | copy | Not in PLAN §6. The table, pager and `useTableControls` import it (search, sort, paging). |
| `domain/formatters.ts` | `src/shared/lib/formatters.ts` | copy | Not in PLAN §6. Date and number formatting for the table and history. |
| `domain/status.ts` | `src/shared/status/status.ts` | adapt | Keeps the tone type and `getStatusPresentation`. All POC statuses are replaced by the provisional Models and Conversion statuses from PLAN §4. Their tones are `[NEEDS VERIFICATION]`. Icons and the full mapping come in A2.4 (D-2). |
| — | `src/features/{orders,models,conversion,reporting,settings}/<Name>Page.tsx` | write | Placeholder lazy pages, one per feature. |

### Scripts (A1.4)
| Source | Destination | Action | Why |
|---|---|---|---|
| poc-mui `scripts/check-tokens.mjs` | `scripts/check-tokens.mjs` | copy | Already allows only `src/theme/tokens.ts`. |
| poc-mui `scripts/contrast.mjs` | `scripts/contrast.mjs` | copy | WCAG contrast helper for token checks. |

### Not copied in A1 (later or never)
- **Deferred to A6/A7** (the poc-mui form pieces in PLAN §6): `components/form/{ServiceFormHost, fields, ErrorSummary, FormSection, LeavePageDialog}`, `hooks/useDirtyGuard.ts`, `components/Timeline.tsx`, `components/ActionPanel.tsx`. These depend on poc-mui's own theme (`cssVars`, `theme/theme`), `domain/types` and `date-fns`. They must be adapted to our theme and to dayjs when the forms are built, rather than copied now as dead code.
- **Deferred to A2/A5**: poc-mui `services/api.ts` (interface pattern only) and `services/latency.ts` go to A2. poc-mui `components/ResponsiveTable/*` and `hooks/useQueryState.ts` go to A5, only if mui `ResponsiveDataTable` is not enough. mui `features/orders/*` is layout inspiration only and is never copied.
- **Never**: seed JSON, `data/*`, `domain/*` except status, table and formatters, billing, cases, clinics, doctors, patients, documents, notifications, scan-center, workflow-board, change-requests, dashboard, showcase, reports (POC), settings (POC page), directory, teeth chart, kanban, charts, `components/business/*`, the support widget, poc-mui `check-data`/`check-ui`, and both POCs' "no tests" and "mock only" rules.

## Deviations
- **D-1 ESLint 9 instead of 10.** The mui POC uses `eslint 10.11.0` and `@eslint/js 10.0.1`, but `eslint-plugin-jsx-a11y 6.10.2` (the only approved version, from poc-mui) requires `eslint <= 9`. Proposal: use poc-mui's `eslint 9.39.5` and `@eslint/js 9.39.5`, which are already used in a source and need no new dependency or `--legacy-peer-deps`. Approved by the developer on 20 Oct. Note: `npm install` warns that `eslint@9.39.5` is no longer supported. Revisit when a jsx-a11y release supports ESLint 10.
- **D-2 Status tones are provisional.** PLAN §4 gives the status labels but not their tones. A1 assigns tones by position in the flow (see D-9) and marks them `[NEEDS VERIFICATION]` until Q2 is answered.
- **D-3 The 404 page lives in `src/app/`**, because the New CP feature list has no `errors` feature.
- **D-4 `PLAN.md` is at the repo root**, but CLAUDE.md expects `docs/PLAN.md`. Resolved: the developer moved it with `git mv PLAN.md docs/PLAN.md` on 20 Oct.
- **D-5 The integration branch name `develop` is unconfirmed** with Aya (GIT_WORKFLOW.md).
- **D-7 Named exports.** The POC default-exports every component. CLAUDE.md requires named exports except for pages, so all copied components, hooks and providers were converted to named exports, and barrels use `export *`. Pages (`LoginPage`, `NotFoundPage`, feature placeholders) stay default-exported and are loaded lazily through the router's `lazy` option.
- **D-8 Placeholder routes.** The `/reporting`, `/orders`, `/models`, `/conversion` and `/settings` paths are the frontend's own choice, not the contract's. `/` redirects to `/reporting`. The scope of the Settings feature is `[NEEDS VERIFICATION]`: PLAN §3 lists no settings screen.
- **D-9 Status tones** (refines D-2): Awaiting Models and No Scans = warning (waiting on input), On its way = info, In Progress = primary, Done and Download = success. All `[NEEDS VERIFICATION]` (Q2).
- **D-10 `.claude/launch.json`** was added so the assistant can run the dev server preview. It is dev tooling only. Decided 20 Oct: the developer adds `.claude/` to `.gitignore`, so it is not committed.
- **D-11 Status mapping before the contract (A2.4, 21 Oct).** The contract was late, so A2.4 was built from PLAN §4 alone. Statuses are keyed per service type (`models`, `conversion`) because "In Progress" exists in both. Each status has its own icon (Awaiting Models = hourglass, On its way = truck, In Progress = autorenew, Done = check, No Scans = cloud-off, Download = download). Still `[NEEDS VERIFICATION]`: the wire values (the API may send codes, not labels), the initial status, the permitted transitions (Q2), and whether the service-type names match the contract.
- **D-12 A2.1 to A2.3 blocked (21 Oct):** `docs/openapi/newcp.openapi.yaml` is not available yet. No client types, endpoints, error shapes or mocks were written, so nothing is invented. They resume when the draft arrives.
- **D-13 A5 pulled ahead of the contract (21 Oct, developer's decision).** The report runs on PROVISIONAL local fixtures (`features/reporting/fixtures.ts`, 14 invented rows; order ORD-2041 has two Models instances and one Conversion). The row type (`features/reporting/types.ts`) and columns come from TASKS A5.1, not the contract, so every field name and value set (arch `Upper`/`Lower`/`Both`, priority `Normal`/`Rush`, option text) is `[NEEDS VERIFICATION]`. Only `useReportRows.ts` reads the fixtures; when A2 resumes it switches to the typed client, the fixtures are deleted, and the row type is replaced by the contract type. The same hook supports `?fail=1` (error state) and `?empty=1` (empty state) for manual checks; this will move into the A2.3 failure injection. Also pending: whether the API paginates, sorts and filters server-side. A5 does all of it on the client.
- **D-14 Touch targets in the theme (A5).** Below 768 px, `Button`, `OutlinedInput` (text fields and selects), `PaginationItem` and clickable `Chip` get a 44 px minimum (`touchTargetTokens.coarseBelow`, `theme/components/touch.ts`). This was found at 390 px (pager 26 px, Details 27 px, search 37 px), and it applies app-wide. Desktop sizes are unchanged.
- **D-15 Branch base for A5.** The developer asked for A5 stacked on `feat/fe-a-a02-api-client-mocks`. At start `develop` was checked out at the same commit (`5751127`, A2 part 1, already on `origin/develop`), so A5 was branched from `develop`. The base content is identical. A2 part 2 (A2.1 to A2.3) is still open.
- **D-16 Branch for the V3 findings (22 Oct).** The findings below belong to A2.1, the question list for Bishoy. `feat/fe-a-a02-api-client-mocks` is still at `5751127` and lacks the A5 DEVIATIONS entries, so they are recorded on `docs/fe-a-a02-v3-findings` from `develop` as "A2 part 2a". A2.2 and A2.3 still wait for the contract.
- **D-17 Two status layers (source: V3 `BUSINESS_GUIDE` §12, `SCHEMA_ONBOARDING` `orders.order_items.status`, `workflow.workflow_states`).** Summary layer: every service line has one of 16 client-facing codes (`draft`, `submitted`, `pending_information`, `in_review`, `confirmed`, `in_design`, `awaiting_approval`, `in_production`, `quality_check`, `ready_to_ship`, `shipped`, `delivered`, `completed`, `on_hold`, `cancelled`, `not_indicated`). Detailed layer: a workflow state per service family, with a `code` (slug), a staff `name` and an optional `client_label`. Our PLAN §4 statuses are detailed states, quoted verbatim in V3 from the legacy portal's decoder:
  - Model registration (family `laser_scan`): 1 Awaiting Models, 2 **On its way to 3DDX** (PLAN shortens this to "On its way"), 3 In Progress, 4 Done.
  - Model registration, intra-oral variant (family `intraoral_scan`): 90 No Scans, 91 In Progress, 92 Done intra-oral. **Missing from `src/shared/status/status.ts`.**
  - 3D conversion (family `conversion`): 6 No Scans, 7 In Progress, 8 Download. Matches.
  - Every flow also has "from any state" Cancelled and On Hold states, which the ETL adds. Also missing from `status.ts`.
  Impact: `status.ts` keys statuses by display label. If the API sends state codes, the map must become code → label/icon/tone. Not changed until the contract answers B1 to B3.
- **D-18 Transitions are data (source: V3 `workflow.workflow_transitions`).** Each allowed move has a button label (`name`), an optional required capability, a guard condition and an optional auto-trigger; cancel and on-hold are allowed from any state. The database validator rejects any move without a matching row. Impact on A7: the UI shows only the moves the API returns for the item, labels buttons with the returned names, and never hard-codes a transition list. Answers part of Q2 if the contract exposes them (B2).
- **D-19 Report row vs `reporting.v_order_items` (source: V3 `SCHEMA_ONBOARDING`, `SAMPLE_QUERIES` Q30).** The view has one row per live order item, which confirms counting by instance (A5). Differences from the provisional row (D-13):
  - Order number is a number (`order_number bigint`), not `ORD-2041`. `order_reference` is client free text tagged PHI-RISK (often names the patient): **never show it**.
  - Service instance id: the public id is `order_items.uuid`; `line_number` (unique per order) can tell two same-type services apart (A9). The view exposes `order_item_id` and `line_number`, not the uuid.
  - Service type comes from `item_name` / `category_name` / `item_code`; there is no "models"/"conversion" column.
  - Priority is order-level, with values `normal`, `rush`, `express`, `fast_track` (we have `Normal`/`Rush` per row).
  - Due date: lines have `due_at` (from the workflow SLA), but **the view does not include it**. `surgery_date` is order-level and PHI-RISK.
  - Arch and option are **not columns**: they are form answers in `orders.order_item_field_values` (per field and option), so the API must join them or the report drops them.
  - Quantity is `numeric(10,3)` on the line (units or arches).
  - Present but not yet used: `item_status` (summary code), `is_invoiced`, `hold_type` (`customer`/`internal`), `client_name`, `scan_center_name`, `patient_code`, `is_redo`, `is_digital`.
- **D-20 Rules confirmed by V3 (no change needed).** Edit locks are per order, at most one active, with an expiry; edits by anyone else are rejected (our "locked by another user" error). Invoiced lines freeze price, quantity, currency and payer (our "invoiced" error). Status history is `orders.order_status_history` (from, to, who, acting role, note; append-only) plus the detailed `workflow.workflow_history` (A7 timeline). Patients appear only as `patient_code`; identity is behind logged access functions. Tenant isolation is fail-closed, so an empty result can mean a missing tenant on the backend, not missing data. Cases above orders and parent/child lines are new in V3 and outside the demo scope.
- **D-21 V3 docs were committed by mistake (22 Oct).** The V3 database docs (`local_docs/`, 11 files) went into the A5 commit `03bd2a0` and were pushed. They contain no patient data, emails or secrets, but they do contain internal security design and staff login names. The developer untracked them in `d025972`; `local_docs/` is in `.gitignore`. Whether to remove them from history (force-push) is open for Aya.
- **D-22 v0.9 handoff package adopted (23 Oct, A00).** The AI Development Handoff Package v0.9 (F07) is the highest authority for the contract, form fields and business rules; `CLAUDE.md` was merged with `templates/option-a/AGENTS.md` (approved text) and `AGENTS.md` points to it. The package was copied to `docs/newcp-ai/payload/` instead of `docs/newcp-ai/`, so the package's own paths (`docs/newcp-ai/policy/...`) are one level off; it stays untracked and unmoved until Aya decides G4.
- **D-23 Provisional statuses and fields are obsolete.** The PLAN §4 statuses (D-9, D-11, D-17: Awaiting Models, On its way, No Scans, Download ...) and the A5 row fields (D-13: option, arch, quantity, `ORD-` numbers, Normal/Rush priority) are replaced. Statuses come from the API (`status` + `available-transitions`); `status.ts` becomes a mapper in A2R. Fields come from `references/v06/form_biomodel.json` (28) and `form_conversion.json` (21). Field and option codes in the API are unresolved (R02): the v0.6 keys are provisional `fieldCode`s, labelled MOCK.
- **D-24 Contract gaps (F07 OpenAPI v0.9.0-draft).** (a) No report endpoint and no order list or search: the report stays on mock data, labelled MOCK (G3, Q-B3). (b) `PatchServiceItem` has no unit price, cost, rush, currency or zero-charge: those staff fields are read-only or mock-saved (G5, Q-B2). (c) `ServiceItem.status` is a bare string, no label (Q-B1). (d) `HistoryEvent` has only `actorUserUuid` (Q-B6). (e) The typed client's `edit()` omits `pendingReason` and `redoOfItemUuid`, which the PATCH schema allows (Q-B4). (f) The client returns `unknown[]` for catalog, transitions and history; A2R types them from the OpenAPI. (g) Problem `code` values are not enumerated (Q-B7).
- **D-25 R14: MUI vs Tailwind, and which repo is Option A.** The package's Option A is the Tailwind mock prototype `@3ddx/newcp-ui-option-a` (its baseline test log: `node --test`, `/data/*.json` mocks, "7 unit tests PASS"). This repo, `newcp-frontend-a`, is built with MUI from the mui POC. The package says to keep the prototype styles unless an ADR approves a change. Work continues on MUI pending Aya's written ADR (G2). R09's "7 tests pass" does not describe this repo.
- **D-26 Tests move forward.** The package requires unit/component tests now. Vitest + jsdom + React Testing Library are set up in A2R.4, only after the developer confirms Aya's approval (G1); `test` joins `verify` then. Browser tests wait for a runner.
- **D-27 Folder layout.** `src/features/services/` is added (package path `features/services/data/serviceApi.ts`); the Models and Conversion placeholder pages are folded into it in A6R/A7R. This overrides the earlier CLAUDE.md feature list (`models`, `conversion`).
- **D-28 A00 is stacked.** `develop` did not yet contain the V3 findings commit (`cd31751`, pushed, PR unmerged), so `docs/fe-a-a00-adopt-handoff-v09` was created from `docs/fe-a-a02-v3-findings` (GIT_WORKFLOW stacking rule).
- **D-29 ESLint ignores docs/ and local_docs/ (A00).** With the package present, `npm run lint` parsed its reference `.ts` files (`newcp-demo-client-f07.ts`, `v3-demo-f07.schema.ts`, v07 client and Drizzle) and failed: they are outside the TypeScript project. Both folders are reference-only, so `eslint.config.js` ignores `docs/**` and `local_docs/**`. A2R ports the client into `src/shared/api/`, where it is linted.
- **D-30 Test tooling (A2R, G1 approved 23 Oct).** Added as exact-pinned dev dependencies: `vitest 5.0.5` (supports Vite 8), `jsdom 30.1.3`, `@testing-library/react 16.3.3`, `@testing-library/jest-dom 7.0.1`, and `@testing-library/dom 10.4.2` (a required peer of `@testing-library/react`). `vitest-axe` was not added: the approval reply did not mention it. `npm run test` (`vitest run`) is now part of `verify`. Separately, `npm audit` reports advisories against the existing `vite 8.3.1` (dev server and launch-editor; fixed in 8.3.5, a patch release). Resolved 23 Oct: the developer approved the bump; `vite` is pinned to exactly `8.3.5` (separate chore PR), and `npm audit` reports 0 vulnerabilities.
- **D-31 Service adapter choices (A2R).** (a) The mock uses the V3 order-item summary vocabulary (`submitted`, `in_design`, ...) as status values and illustrative transitions; both are mock data, not the real workflow (R03, Q-B1). (b) `status.ts` labels and tones for those 16 values are CANDIDATE_UNVERIFIED display choices; unknown values render humanised with a neutral tone and a help icon. (c) The report keeps its 20 Oct fixture statuses until A5R, so they now show with the neutral fallback; its status filter and counts come from the data instead of a hard-coded list. (d) Mock Problem codes are `mock.*` until Q-B7. (e) With mocks off, the real adapter has no token source until A4 and rejects with 401; no INTEGRATED claim is possible before that. (f) Response bodies are trusted to match the contract at one boundary (`client.ts`); there is no runtime schema validation yet. (g) The PATCH type follows the OpenAPI (with `pendingReason`, `redoOfItemUuid`), not the narrower package client (Q-B4).
- **D-32 G4 decided (23 Oct).** The handoff package is not committed: it stays a local copy under `docs/newcp-ai/payload/`, ignored by `.gitignore` (`docs/newcp-ai`, developer commit `debcd69`). Package paths in CLAUDE.md, PLAN and TASKS are relative to that local copy.
- **D-6 Versions are pinned exactly** (no `^`), using the versions installed in the mui POC lockfile, so that `npm install` reproduces the POC's build.

## R01-R14 status for Option A (23 Oct, from `references/v07/01_GAPS_AND_DECISIONS.csv` and `policy/F07_RELEASE_GATES.csv`)
| R | Status for the frontend | How Option A handles it now |
|---|---|---|
| R01 catalog UUIDs | BLOCKED | Mock `sellableItemUuid` from the F07 synthetic fixtures |
| R02 field/option codes | BLOCKED | v0.6 field keys as provisional `fieldCode`s, labelled MOCK |
| R03 transitions | BLOCKED | Render `available-transitions` from the adapter; no hard-coded statuses |
| R04 Bill To | TARGET RESOLVED (F07); live write gated F07-01 to F07-05 | Doctor/Scanning Center selector on the mock, one service at a time; real save disabled |
| R05 pricing, zero-charge | BLOCKED + contract gap (D-24b) | Read-only or mock-saved, labelled |
| R06 auth, roles | BLOCKED | Mock session; honour `canEditBilledParty` and 403 as read-only |
| R07 dataset | BLOCKED | Package synthetic fixtures only |
| R08 backend | NOT AVAILABLE | Nothing labelled INTEGRATED |
| R09 Option A live API | NOT RUN | Refers to the Tailwind prototype (D-25) |
| R10 Option B | Not this repo | — |
| R11 idempotency | PROPOSED | New `Idempotency-Key` per intentional create |
| R12 uncertain validators | PARTLY DECIDED | Enforce VAL-CONV-001/002/004/005, VAL-BIO-001/002/003; VAL-CONV-003 warning only; VAL-NEST-001/002 not enforced |
| R13 history writer | Backend | Show the history endpoint as returned |
| R14 Tailwind vs MUI | OPEN | Continue on MUI pending the ADR (G2) |

## Questions for Bishoy (A2)
Asked before the contract arrived, from the V3 database docs (D-17 to D-20). Each answer decides a frontend change; until answered, the provisional choice stays.

| # | Question | Why we ask | Provisional choice until answered |
|---|---|---|---|
| B1 | Does the API return the detailed workflow state (code + label, maybe `client_label`) for a service line, the 16-value summary status, or both? | `status.ts` is keyed by labels (D-17). | Labels from PLAN §4. |
| B2 | Does the item endpoint return the allowed next transitions (target state, button name, whether the current user may perform it)? | A7 must show only allowed moves (D-18). | No transition UI until answered. |
| B3 | Which workflow families count as "Models" in the demo: `laser_scan`, `intraoral_scan`, or both? And are Cancelled / On Hold in scope? | The intra-oral variant and the any-state moves are missing from `status.ts` (D-17). | `laser_scan` labels only. |
| B4 | What is the public id of a service line in the API: `uuid`, `order_item_id`, or both? Is `line_number` exposed? | Two same-type instances must be told apart (A9). | Invented `SVC-xxxx` ids in fixtures. |
| B5 | Does the report endpoint expose the line's `due_at`? (`v_order_items` does not.) | The report has a Due date column and sorts by it. | Due date per row in fixtures. |
| B6 | Are arch and option returned as fields of the line, or must the UI read form answers? Which field codes? | They are not columns in V3 (D-19). | `Upper`/`Lower`/`Both` and free text in fixtures. |
| B7 | Priority: order-level `normal`/`rush`/`express`/`fast_track`, repeated on each report row? | Fixtures use `Normal`/`Rush` per row. | Per-row `Normal`/`Rush`. |
| B8 | Does the report endpoint page, sort and filter on the server (which parameters), or return everything? | A5 does all of it on the client (D-13). | Client-side. |
| B9 | What error shapes and codes do the lock, invoiced, prohibited-transition, validation, 403/cross-tenant and 5xx cases use? Does the lock error say who holds the lock and until when? | A2.2 error normalisation into one `ApiError`. | None written (D-12). |
| B10 | Is `order_reference` ever returned to the UI? | It is PHI-RISK free text (D-19); we will not show it either way. | Never displayed. |

## Questions after the v0.9 package (23 Oct)
B2, B4 and B9 above are answered by the F07 contract (`available-transitions`; `uuid` + `lineNumber`; `Problem {code, message, requestId, details}`). Still open from that list: B1 (now Q-B1), B3, B5, B6 (now Q-B5), B7, B8 (now Q-B3), B10.

For Aya:
| # | Question | Blocks |
|---|---|---|
| G1 | Approve Vitest + jsdom + React Testing Library (+ vitest-axe?) now. | A2R.4, A11 |
| G2 | Written ADR for R14 (MUI instead of the Tailwind prototype). Is this repo now "Option A"? | All UI work (risk) |
| G3 | No report endpoint or order list in the contract: may the report stay MOCK-labelled for the demo? | A5R |
| G4 | May `docs/newcp-ai/` (incl. F07 SQL, ETL and review files) be committed here, and moved out of `payload/`? | Package paths |
| G5 | Staff money fields (cost, rush, currency, zero-charge): read-only or mock-saved? | A7R |
| G6 | Cut order and the A9R-into-A7R rule. | Approved by the developer 23 Oct |
| G7 | Integration branch `develop` confirmed? Clean `local_docs` from history (D-21)? | Git hygiene |

For Bishoy:
| # | Question | Blocks |
|---|---|---|
| Q-B1 | Add a status label (or `client_label`) to `ServiceItem`, or confirm a code-to-label endpoint. | Status chips |
| Q-B2 | Add unit price, cost, rush, currency, zero-charge to `PatchServiceItem`, or confirm read-only. | A7R staff fields |
| Q-B3 | A report/list endpoint per service instance, with due date, priority and server paging/sort/filter. | A5R |
| Q-B4 | Align the client's `edit()` type with the PATCH schema (`pendingReason`, `redoOfItemUuid`). | A2R client |
| Q-B5 | Field/option codes for Biomodel and Conversion answers (R02) and the catalog UUIDs (R01). | Real create/edit |
| Q-B6 | Actor names (or a lookup) for history events. | A7R history |
| Q-B7 | Problem `code` values for lock, invoiced, ineligible payer, prohibited transition. | Error messages |
