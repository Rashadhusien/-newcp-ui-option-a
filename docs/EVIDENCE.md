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
