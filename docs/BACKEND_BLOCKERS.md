# Backend blockers and open questions (New CP FE Option A)

Updated 28 Oct 2026 from the canonical `docs/openapi/newcp.openapi.yaml`, the v0.9.8 REVIEW answers
(`04_RASHAD_ALL_QUESTIONS_ANSWERS.md`) and a read-only check of the test server. Answered items are not listed.

## Blockers (stop real integration)

| ID | Owner | What is missing | Until then |
|---|---|---|---|
| Q-B28 | Hesham | Client ID received 28 Oct (test web client); allowed JavaScript origin is `http://localhost:3000` (developer, 28 Oct), so the dev server now runs on 3000. Still needed: the demo origin, if the demo is not run locally. | The Google button renders on port 3000; a real sign-in is not yet proven. |
| Q-B37 | Hesham | A real Google sign-in on `http://localhost:3000` (28 Oct): Google returned an ID token, but `POST /api/v1/auth/login` answered 401 `AUTHENTICATION_REQUIRED` "Authentication required". Which Google client ID (token audience) does the test backend verify, and is the developer's account allowed? Please check the server log for that request. | Real sign-in blocked; the app shows Access denied. |
| Q-B31 | Hesham | CORS: the test server sends no `Access-Control-Allow-*` headers. Needed only for a deployed demo origin. | Dev proxy for `/api` (`npm run dev:integration`); not a blocker for local work. |
| Q-B33 | Hesham / backend | Test Google accounts (one per role) and order UUIDs that have Biomodel and Conversion items. | Live service calls (A31) cannot be run. |
| Q-B24 | Backend API owner | Create order endpoint and schema (adding a service to an existing order is not a replacement). | Add order stays MOCK. |
| Q-B25 | Business / PHI | Which patient fields may be shown and sent. | Synthetic patient data only. |
| Q-B5 | Backend API owner | Real tenant catalog UUIDs and field/option codes for Biomodel and Conversion. | Mock catalog; codes are never hard-coded. |

## Design-only (no integration assigned now)

| ID | Note |
|---|---|
| Q-B26, Q-B3 | Orders Dashboard (All orders): proposed `GET /orders`, `/orders/{uuid}`, `/orders/dashboard-summary`, `/orders/filter-options`, `/orders/{uuid}/dashboard-services` are review drafts only. The UI is built on labelled mock data. |
| OD-19, OD-24 | Meaning of the Received, Sent and Update columns is not approved. Shown as "Not available". |
| OD-21, OD-22 | Archive date and Charged time have no verified source (`TimeBilled`, `dateUpd` not migrated). Shown as "Not available". |
| Q-B23 | Export is allowed for FINANCE, QC, ADMIN, but no export endpoint exists. No export control. |

## Open questions (work continues meanwhile)

| ID | Owner | Question | Meanwhile |
|---|---|---|---|
| Q-B29 | Hesham | Session after reload, refresh or re-auth, idle (30 min) and max (8 h) limits. | Token in memory; a reload signs in again. |
| Q-B22 | Hesham | Final 401/403 code list, including tenant errors. Seen live: auth endpoints `{error:{code,message,requestId}}` with `AUTHENTICATION_REQUIRED` (401) and `VALIDATION_ERROR` (400). | Accept both error shapes; route on status. |
| Q-B20 | Hesham | Canonical capability codes behind `/auth/me` (matrix codes are `CANDIDATE_UNVERIFIED`). | Mock uses the matrix codes. |
| Q-B35 | Hesham / Lead | G11 says FINANCE and QC see all order and service details, but the role matrix (unchanged since v0.9.7) still gives them report capabilities only. Which capabilities will `/auth/me` return for them? | Mock FINANCE/QC get read access to orders and services (D-87). |
| Q-B36 | Backend API owner | The review YAML (`03_...REVIEW.yaml`) still lists `optionCode`/`valueText`/... on `FormAnswer`; the canonical file and the live server removed them. Confirm the canonical file wins. | We send only `value` / `optionCodes`, which both accept. |
| Q-B7 | Backend API owner | Final error codes for financial lock, invoiced line, ineligible payer, prohibited transition. | Show the server message and code. |
| Q-B19 | Backend API owner | ETag exposed to the browser and revision update after PATCH/transition. | Read `ServiceItem.etag` as fallback. |
| Q-B16 | Backend API owner | Wire payload for `file` and `tooth_chart` answers. | Not sent. |
| Q-B30 | Backend API owner | Original contract price or an `isPriceOverridden` flag. | Overrides are not shown or counted. |
| Q-B6 | Backend API owner | Display names for history actors. | Short user ids. |
| Q-B1 | Backend API owner | Canonical labels for `ServiceItem.status`. | Neutral fallback label. |
| Q-B2 | Backend API owner | Rush field and whether currency is editable. | Read-only / not available. |
| F07 runtime | Backend / DB | F07 is reported complete; the deployed payer endpoint and PATCH are not yet checked live. | Bill To stays MOCK until A31 runs it. |
| G14, G2/R14, G7 | Lead / repo owner | Visual reference, MUI ADR, integration branch and `local_docs` history. | No change. |
