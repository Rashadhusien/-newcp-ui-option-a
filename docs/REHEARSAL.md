# Rehearsal script: New CP UI Option A (28 Oct 2026)

Everything below runs on the **mock** (header badge: MOCK). Nothing is saved to a real API; say so at the start. The mock resets when the page is reloaded.

## Setup
1. `npm ci`, then `npm run dev` (port 5173). `.env` must not set `VITE_USE_MOCKS=false`.
2. Open `/login` in a fresh window. Light mode, browser at about 1440 px. Keep a phone width (390 px) ready for step 8.

## Script (about 10 minutes)
| # | Do | Point out | Evidence label |
|---|---|---|---|
| 1 | Sign-in page: show the mock identity list, pick **CS**, Sign in (mock). Lands on **Home** (A27). | Google sign-in is the server's job and is BLOCKED until the context endpoint and sign-in method are in the contract (Q-B20, Q-B21). The picker exists only in mock mode. A requested in-app page (return path) still wins over Home. | MOCK |
| 1a | **Home**: greeting, role chip, tenant badge, quick access cards; breadcrumb "Home". | Name, roles and tenant come from the session context; cards follow the role's capabilities (CS: Report, Orders, New Biomodel, New Conversion, Dashboard, Settings, Help). No counts on Home. | MOCK |
| 2 | Header. | MOCK badge; read-only tenant badge "Demo tenant (mock)"; no tenant selector anywhere. Account menu shows role CS and the tenant. | MOCK |
| 2a | **Dashboard** (sidebar, or the Home card). | KPI cards, status overview (icon + label + count + bar), services on hold, recent activity. Counted in the browser from the service mock (no dashboard endpoint, G3); "Price override: Not available" (no contract price in the API, Q-B30); hold type and reason not returned (Q-B18). Totals differ from the Report until the report is re-keyed (A5R). | MOCK |
| 3 | **Report**. Click a status count chip, then Clear all. | One row per service instance; two Models on one order are two rows. Report data is provisional (no report endpoint, G3). | MOCK |
| 4 | **Models** → New Biomodel on the demo order. Fill a few answers (digital Yes, brand, arches); submit once with both arches None to show the error summary; fix and create. | All Connect controls, conditional fields, attached validators only; a new instance gets its own line number even when the order already has a Biomodel. | MOCK |
| 5 | **Orders**: open **line 1**. Change unit price 20.00 → 18.00, Save staff fields. | Override kept; line total 18.00 USD; only changed fields sent, with the version (If-Match). | MOCK |
| 6 | Line 1: set price 0 and save without a reason. Then choose a zero-charge reason (mock list) and save. | Server rule: a zero total needs a reason (422 on the reason field); nothing is saved until it is given. | MOCK |
| 7 | Line 1: **Put on hold** → submit empty (errors) → Internal hold → "Demo only — Internal review" → Put on hold. Then Resume. | Type and reason travel with the status change in one request; reasons are synthetic. History shows each move. | MOCK |
| 8 | Back to Orders: open **line 2** (same type). | Its status and price did not change; its price is read-only (the service does not allow an override). Same at 390 px: no sideways scroll, dialog full screen. | MOCK |
| 9 | Account menu → Sign out → sign in as **FINANCE**. Home, then open `/models` by URL. | Home shows Report, Dashboard, Settings and Help only; Dashboard shows the figures without links; nav shows Home, Dashboard and Report; the service page answers "No access" (403), with no retry; the "Orders" breadcrumb is plain text. | MOCK |
| 10 | Sign out → sign in as **Pending access**. | Pending Access page: no workspace, no data. | MOCK |
| 11 | Optional: open `/models?fail=401`. | Any 401 returns to sign-in and keeps only an in-app return path. | MOCK |

## What NOT to claim
- No real API, Google sign-in, tenant isolation or database test has run (EVIDENCE: NOT RUN / BLOCKED).
- Bill To (A23) runs on the mock only and says BLOCKED with the real API (F07 columns absent).
- Not built: report export (no endpoint), CI, Docker.
- The Dashboard is a scope addition (D-77, G19); its figures are computed in the browser from mock data. Do not present them as a real report.
- Capability codes, error codes and the session context shape are proposals from the package (Q-B20, Q-B22).

## If something breaks
- Blank page or stuck loading: reload; the mock restarts clean.
- Signed out unexpectedly: the URL may carry `?fail=`; remove it.
- Two clerks / stale edit (412): cannot be shown live, because each tab has its own in-memory mock; it is covered by tests (EVIDENCE A2D, A7R).
