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
