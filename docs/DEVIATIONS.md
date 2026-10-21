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
- **D-6 Versions are pinned exactly** (no `^`), using the versions installed in the mui POC lockfile, so that `npm install` reproduces the POC's build.

## Questions for Bishoy (A2)
None yet: the contract is not in `docs/openapi/`.
