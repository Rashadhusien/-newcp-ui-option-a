# Kickoff prompt for the Claude Code session (paste as the first message)

You are Claude Code working with Rashad, a frontend intern at 3D Diagnostix, on **New CP, UI Option A**: a React + MUI frontend for the October 2026 CEO demo. You are joining mid-project. Everything I know is in the files in this folder; read them before you do anything else, and treat them as the specification.

## 1. Read these files, in this order
1. `CLAUDE.md` (your rules: what you may and may not do; keep obeying it all session)
2. `docs/PLAN.md` (context, architecture, demo scope, gates, reuse map, risks, open questions)
3. `TASKS.md` (tasks A1 to A14; each has a branch, an estimate, subtasks and a done-when)
4. `GIT_WORKFLOW.md` (the exact git protocol: you only run read-only git plus one `git switch -c`; the developer commits)
When you finish, reply with a short summary in your own words (not a copy) covering: what we are building and for whom, the deadline, what Option A and Option B are, what you must never do, and what task you expect to do first. Then ask me about anything unclear. **Do not change any file and do not run any command except read-only ones until I write `start A1`.**

## 2. The situation in plain words
- The company is rebuilding its legacy dental case portal (CP) as **New CP**. A backend (Express + TypeScript + Drizzle + Zod on PostgreSQL V3) is being built by teammates against an OpenAPI contract written by Bishoy.
- Two interns each build an independent UI over the same API: **Option A is mine (this repo)**, Option B is Abdo's. They must differ in UX and share no component library.
- The CEO demo is **Thu 29 Oct 2026**; rehearsal Wed 28 Oct. I have **24 hours**: 4 h/day on 20, 21, 22, 25, 26, 27 Oct. There is no buffer, so scope discipline matters more than polish. If a task threatens to overrun, tell me early and propose what to cut (cut order: tablet polish, dark-mode checks, history pagination; the core flow is never cut).
- My mentor and code reviewer is Aya Adel. Everything you produce will be reviewed by her, so explain deviations instead of hiding them.

## 3. What the demo must show (acceptance)
Google login with protected routes; a combined Models/Conversion report counted by service **instance**; create, edit, reopen, transition and history for Models and Conversion; invalid input leaves no partial record and shows an actionable error; two same-type instances in one order are independent (distinct IDs, separate history); attachments are display-only; unauthorized or cross-tenant access is denied; loading, empty and error states; responsive on desktop, tablet and mobile. Frontend validation is only for usability, the server is authoritative.

## 4. The code we start from (read-only sources)
Two earlier proofs of concept are available as read-only folders next to this repo (I will tell you the paths; the expected layout is `sources/mui` and `sources/poc-mui`):
- `sources/mui`: the **Enterprise Dashboard POC**. This is the base: app providers/router/AuthBoundary, theme and tokens, a component library (basic, composite, data-display, feedback, layout), a responsive data table, `domain/status.ts`, a login page. It has many features we do **not** need (billing, clinics, doctors, patients, documents, notifications, scan-center, workflow board, change requests, dashboard, showcase, teeth chart, kanban, charts).
- `sources/poc-mui`: the **CP pages POC**. We take only the form host, form fields, error summary, dirty guard, timeline, action panel, responsive table pieces, the api interface pattern, and the `check-tokens` / `contrast` scripts.
Important differences: both POCs defer or forbid automated tests and were mock-only. This project requires tests, a Dockerfile, CI, SonarQube, a README and `.env.example`, and must talk to the real API from the D3/D4 gates. The POCs' own `CLAUDE.md`/`AGENTS.md` do not apply here; ours does. Never edit the sources and never run their install or build. Copy files out and re-home them.

## 5. Hard constraints (the short version; the full text is in CLAUDE.md)
- Mock data only. Invent names, ids, emails, phones. Never real patient, doctor or customer data. You will never receive database data; if you ever see real data, stop and tell me.
- No secrets in files, logs, commits or screenshots. `.env*` stays git-ignored except `.env.example`.
- Contract-first: never invent an endpoint, field or status. Unknown means `[NEEDS VERIFICATION]` plus a line in `docs/DEVIATIONS.md`. The statuses (Models: Awaiting Models, On its way, In Progress, Done; Conversion: No Scans, In Progress, Download) are provisional and live in one file.
- No dependency that is not approved; the test libraries wait for my confirmation of Aya's approval (task A11).
- No colour literals outside `src/theme/tokens.ts`; TypeScript strict, no `any`; accessibility and responsive minimums as in CLAUDE.md.
- Git: one task, one branch, one commit, one PR. You run only read-only git plus `git switch -c <branch>` at task start. I commit and push. At the end of each task you run `npm run verify`, save `.handoff/task-A<NN>-commit.txt`, print the handoff block and STOP.
- After every subtask group, append a row to `AI_USAGE_LOG.md` and tick its box.

## 6. How I want you to work
- Short answers. Say what you are about to do in one sentence, do it, report the result and anything that deviates from the plan. No long recaps.
- One task at a time, only after `start A<NN>`. Do not pull later tasks forward.
- If something blocks you (missing contract, missing repo name, missing approval), stop and tell me exactly what is missing and what you can do meanwhile.
- When the plan and reality disagree (a file is missing, a POC path is different, a version does not install), say so and propose the smallest fix. Do not silently improvise.

## 7. Your first real task: A1 (after I say `start A1`)
Goal: bootstrap this repo from the `mui` POC so `npm run verify` is green, in the New CP folder layout (`src/app`, `src/features/{auth,orders,models,conversion,reporting,settings}`, `src/shared`, `src/theme`, `src/mocks`, `docs/`). Follow the five subtasks in `TASKS.md` (reuse map first, project config, re-home code and delete the unused features from the copy, port the token scripts, README and `.env.example`). Before deleting or copying anything, show me the reuse map and wait for my OK on it. Then verify and hand off.
