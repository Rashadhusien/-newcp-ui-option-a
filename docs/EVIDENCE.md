# EVIDENCE: New CP frontend, UI Option A

Proof per task: the command or check, the result, and where to see it. Screenshots go in the PR, never with real data or secrets.

| Date | Task | Check | Result | Notes |
|---|---|---|---|---|
| 2026-10-20 | A1 | `npm run verify` (lint, typecheck, build, check-tokens) | pass | See the A1 handoff. |
| 2026-10-20 | A1 | Browser: `/login` shows the placeholder; Sign in (mock) goes to `/reporting` | pass | Dev server, 1024 px. |
| 2026-10-20 | A1 | Browser: signed out, `/models` redirects to `/login` | pass | Route guard. |
| 2026-10-20 | A1 | Browser: unknown route `/nope` shows "Page not found" in the shell | pass | |
| 2026-10-20 | A1 | Browser: Light chosen in the header menu persists (`mui-mode=light`) and survives reload without a dark flash | pass | Pre-paint script in `index.html`. Dark was the system default in the test. |
| 2026-10-20 | A1 | Browser: 390 px, nav becomes a drawer, `scrollWidth` = 390 (no horizontal scroll) | pass | 768 and 1440 not checked in A1 (placeholders only). |
| 2026-10-21 | A5 | `npm run verify` | pass | |
| 2026-10-21 | A5 | Report counts by instance: 14 fixture rows = 14 rows; ORD-2041 shows SVC-5001 and SVC-5002 (two Models) plus SVC-5003 (Conversion) | pass | 1440 px; fixtures are provisional (D-13). |
| 2026-10-21 | A5 | Count chip "Models, In Progress" sets `?type=models&status=In+Progress`, shows 2 rows, chip `aria-pressed=true`; Clear all empties the URL | pass | |
| 2026-10-21 | A5 | Sort by Order asc/desc and page 2 are in the URL (`?sort=order&dir=desc&page=2`); search `PT-0101` gives 3 rows and resets the page | pass | Headers are `th scope=col`, the sorted one has `aria-sort`. |
| 2026-10-21 | A5 | `?fail=1` shows the error with Retry (Retry shows the loading skeleton again); `?empty=1` shows "No services yet"; no-match search shows "Clear filters" | pass | |
| 2026-10-21 | A5 | No horizontal scroll at 390, 768, 1024, 1440 (`scrollWidth` <= width); 390 shows cards, 768 primary columns, 1024 + client/priority, 1440 + service ID/patient code | pass | |
| 2026-10-21 | A5 | At 390 px the fields, pager and buttons are 44 px tall | pass | Theme rule D-14. |
| 2026-10-21 | A5 | Status badge colours from tokens in light (`#E3F5EA`) and dark (translucent), icon + label in both | pass | |
| 2026-10-23 | A00 | `npm run verify` after the docs changes and the ESLint ignore for reference folders | pass | Docs only; first run failed on the package's reference .ts files (D-29). |
| 2026-10-23 | A2R | `npm run verify` (lint, typecheck, build, check-tokens, test) | pass | 6 test files, 39 tests (mock adapter, client, errors, config, status mapper, EvidenceBadge). |
| 2026-10-23 | A2R | Browser: header shows "MOCK" with icon and aria-label "Data source: MOCK. Mock data: nothing is saved…"; report renders 10 rows, no console errors | pass | 1024 px; report statuses use the neutral fallback until A5R (D-31c). |
| 2026-10-23 | A2R | Browser: 390 px, badge visible, `scrollWidth` 390 | pass | |
| 2026-10-23 | A2R | Real API adapter | NOT RUN | No backend (R08) and no token source until A4 (D-31e). |
| 2026-10-23 | chore vite | `npm audit` after pinning vite 8.3.5 | pass | 0 vulnerabilities (was: advisories against vite 8.3.1). |
| 2026-10-23 | chore vite | `npm run verify` on vite 8.3.5 | pass | Build on vite v8.3.5; 39 tests pass. |
| 2026-10-23 | chore vite | Dev server smoke: `/reporting` loads, MOCK badge, 10 rows, no console errors | pass | Port 5174 (5173 was busy). |
| 2026-10-23 | contract v1 | Structural diff v1 vs v0.9 F07 contract (operations, schemas, properties, required) with PyYAML | done | Results in DEVIATIONS D-33. |
| 2026-10-23 | contract v1 | `npm run verify` after the docs changes | pass | Docs only; code still on v0.9 types until A2C (D-34). |
| 2026-10-23 | A2C | `npm run verify` (lint, typecheck, build, check-tokens, test) | pass | 6 files, 50 tests: v1 lookups, defaults, answers, quantity, zero-charge, hold rules, `updatedAt`. |
| 2026-10-23 | A2C | Real API with v1 | NOT RUN | No backend (R08); no token until A4. |
| 2026-10-23 | A6R | `npm run verify` | pass | 8 files, 67 tests (form logic: field counts, attached validators only, conditions, resets, v1 answers, reopen round-trip; ServiceForm: summary focus, create + navigate, 422 on field, 409 above form). |
| 2026-10-23 | A6R | Browser, Biomodel create: both arches None blocked with summary (focused) and linked field error; digital Yes shows Digital delivery; software appears only with software file; brand B narrows models to brand B; create opens `/services/<uuid>/edit` line 4 with every value as entered and a toast | pass | Mock; 1024 px. |
| 2026-10-23 | A6R | Browser, Conversion: format 1-5 for Simplant, 8-9 and reset to 8 for coDiagnostiX, hidden for BSB; maxilla shows segmentation; model scan Yes shows and requires the intra-oral question; both-arches warning only while both None | pass | |
| 2026-10-23 | A6R | Browser: dirty guard (Stay keeps the form, Leave page navigates); edit save stays on page with toast; 390 px no horizontal scroll | pass | |
| 2026-10-23 | A6R | Real API create/edit | NOT RUN | No backend (R08); field codes unresolved (R02). |
| 2026-10-24 | A00b | `test_qb8_qb15_contract.py` (package offline check) | pass | 13 tests. |
| 2026-10-24 | A00b | `scripts/check_handoff.py` | pass | Handoff structure and F07 overlays present. |
| 2026-10-24 | A00b | `test_f07_contract.py`, `v07/tests/test_static_contract.py` | NOT RUN | Python `jsonschema` not installed; installing needs approval. |
| 2026-10-24 | A00b | Local package copy equals v0.9.2.2 (`diff -rq` empty, no stale files) | pass | Git-ignored; v0.9 kept in `payload-v0.9/`. |
| 2026-10-24 | A00b | `npm run verify` | pass | 67 tests; first run failed on a flaky A6R focus assertion (D-48), fixed; then 8/8 full-suite runs pass. |
| 2026-10-25 | A2D | `npm run verify` | pass | 9 files, 80 tests: client ETag/If-Match/412/428, hold lookup; mock acceptance cases from the v0.9.2 rollout guide (stale edit, missing If-Match, hold without type/reason, $20 -> $18 override kept, zero total needs a reason, Billable and Bill To independent, locks); adapter blocks Bill To and strips the payer with mocks off; form 412 banner keeps edits. |
| 2026-10-25 | A2D | Browser: two consecutive edit saves on a fixture service both succeed, no console errors | pass | Mock; shows the form uses the new version after each save. |
| 2026-10-25 | A2D | Real API with ETag/If-Match | NOT RUN | No backend (R08); no token until A4. |
| 2026-10-26 | A00c | Service OpenAPI YAML/JSON and typed client v0.9.7 vs local v0.9.2.2 copy (`cmp`, SHA-256) | pass | Identical; payload differs only by the IAM files and README. |
| 2026-10-26 | A00c | `npm run verify` | pass | Docs only; 9 files, 80 tests. |
| 2026-10-26 | A15 | `npm run verify` | pass | 12 files, 104 tests: both error envelopes and Pending codes; session context (signed out, mock, BLOCKED with real API, fixtures follow the matrix); access events; safe return path; mock access checks (401, ACCESS_NOT_ASSIGNED, PERMISSION_DENIED, per-field PATCH capabilities); no tenant in any header, query or body; AuthBoundary sign-in round trip, Pending Access, 401 -> sign-in, no picker with mocks off. |
| 2026-10-26 | A15 | Browser (mock): FINANCE sees Report and Settings only, `/models` shows "No access" without Retry; PENDING shows Access pending with no workspace; OPS sees the workspace and the badge "Active tenant: Demo tenant (mock) (read-only)"; `/models?fail=401` returns to sign-in and clears the identity; 375 px `scrollWidth` 375; no console errors | pass | Light/dark not re-checked (cut item 7). |
| 2026-10-26 | A15 | Real session context, Google sign-in, TEN-01..30 | NOT RUN / BLOCKED | No context endpoint in the contract (Q-B20), transport open (Q-B21), no backend (R08). |
| 2026-10-27 | A7R | `npm run verify` | pass | 13 files, 110 tests: staff patch only changed fields; On Hold needs type and reason, sent in one transition, twin instance unchanged; zero total 422 on the reason field and nothing saved; 412 keeps the value with Reload latest; price read-only where `canEditPrice` is false; FINANCE gets No access without Retry. |
| 2026-10-27 | A7R | Browser (mock, CS): `/orders` shows lines 1-3 with their own IDs and statuses; line 2 unit price read-only; line 1 price 20.00 -> 18.00 saved, line total 18.00 USD; 375 px `scrollWidth` 375; no console errors | pass | Dark mode not re-checked (cut item 7). |
| 2026-10-27 | A7R | Real API edit/transition/history | NOT RUN | No backend (R08); session BLOCKED (Q-B20, Q-B21). |
| 2026-10-27 | A14 | `npm run verify` on develop `bc9ef20` | pass | 13 files, 110 tests; build ok. |
| 2026-10-27 | A14 | Browser smoke, 1440 px (CS): `/reporting`, `/orders`, `/services/...14`, `/models` render with no horizontal scroll and no console errors | pass | Mock. |
| 2026-10-27 | A14 | Browser smoke, 390 px: `/orders` and `/services/...15` `scrollWidth` 390; no visible button under 40 px; On Hold dialog full screen, focus inside, Escape closes and returns focus to "Put on hold" | pass | Mock. |
| 2026-10-27 | A14 | Dark mode, 768 and 1024 px, real API, Google sign-in, TEN-01..30 | NOT RUN / BLOCKED | Cut item 7; no backend (R08); Q-B20/Q-B21. |
| 2026-10-27 | A16 | Script comparison of DS `tokens.json` with `src/theme/tokens.ts` | done | All 114 colour values equal; dark `shadow-sm`, spacing 20, two named slots missing; no motion/z-index in either (DESIGN_ALIGNMENT section 3). |
| 2026-10-27 | A16 | `npm run verify` | pass (flaky test noted) | First run: lint failed on `refrences/` (ignored, D-63). Then 13 files, 110 tests; the A7R On Hold test failed in 2 of ~14 full runs, passed 3/3 alone (D-63). |
| 2026-10-27 | A16a | `npm run verify` | pass | 13 files, 110 tests; check-tokens ok. |
| 2026-10-27 | A16a | Full test suite 10 runs after the On Hold test fix | pass | 10/10 (before: 2 failures in ~14 runs, D-63). |
| 2026-10-27 | A16a | Browser, service detail line 1: light and dark at 1440 and 390; no horizontal scroll; input min height 40 (1440) / 44 (390); dark `--mui-palette-primary-dark` = #93C5F5, primary button text #0A0F17; only Inter loaded (no Outfit); no console errors | pass | Screenshots in `.handoff/a16a-screens/` (git-ignored). |
| 2026-10-27 | A16b | `npm run verify` | pass | 14 files, 114 tests (PageHeader badge order, no badge on non-data pages, theme switch group and pressed state, compact names). |
| 2026-10-27 | A16b | Browser (mock, CS): 1440 light and dark: no menu button, MOCK only in the page header, tenant badge, segmented theme switch works (Dark persisted as `mui-mode=dark`); 800: rail + menu button, MOCK only in the page header, icon-only theme switch; 390: menu button opens the drawer, MOCK only in the header, no theme switch in the header, `scrollWidth` 390; no console errors | pass | Screenshots in `.handoff/a16b-screens/` (git-ignored). |
| 2026-10-27 | A17 | `npm run verify` | pass | 14 files, 114 tests (no new tests, D-66). |
| 2026-10-27 | A17 | Browser (mock, CS), 1440: sidebar hidden, `main` at x=0; hovering the menu button peeks the sidebar over the content (`main` stays at 0); click pins it (`main` at 260, label "Hide navigation", remembered); click again hides it (`main` 0). Support: empty submit shows "Choose a topic" / "Describe the problem"; filled submit shows "Not submitted" + not-connected alert, text kept; Escape closes and focuses the button. 375 dark: modal drawer, footer with version v0.1.0 and MOCK, no horizontal scroll; no console errors | pass | Screenshots in `.handoff/a17-screens/` (git-ignored). |
| 2026-10-27 | A25 | `npm run verify` | pass | 14 files, 114 tests (3 updated for the new sign-in; no new tests, D-66). |
| 2026-10-27 | A25 | Browser (mock), 1440 light/dark and 375: one "Sign in with Google (mock)" action, no email/password/workstation fields; loading (`aria-busy`); `?fail=google` -> "Google sign-in was cancelled or failed"; `?fail=403` -> "Access denied"; PENDING identity -> Access pending with "Your account is authenticated, but access has not been assigned yet."; CS -> workspace with tenant badge; `?fail=401` on a page -> back to sign-in with "Your session has ended"; 375 px no horizontal scroll, button 44 px; no console errors | pass | Screenshots in `.handoff/a25-screens/` (git-ignored). |
| 2026-10-27 | A25 | Real Google Identity Services + `POST /api/v1/auth/login` + Bearer calls | NOT RUN | No Google client ID (Q-B28), endpoint not in the OpenAPI (Q-B27), no backend (R08). |
