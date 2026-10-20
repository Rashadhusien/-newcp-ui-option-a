# Git workflow: New CP frontend, Option A

One task = one branch = one commit = one PR. The developer commits and pushes. The assistant never runs `add, commit, push, pull, fetch, merge, rebase, reset, restore, checkout, stash, tag, clean, config` or any force option, and never commits to `main` or the integration branch. Read-only git is fine. Release-candidate tags are proposed by the developer to Aya; the assistant never tags.

## Branches
- `main`: protected; receives the integration branch only at the end, from the developer.
- Integration branch: `develop` **[NEEDS VERIFICATION: confirm the real name with Aya]**. Every task branch is created from it.
- Task branches: `<type>/fe-a-aNN-<slug>`. Exact names are in `TASKS.md`.
- Base: the integration branch. If the previous task's PR is not merged yet, stack: create the new branch from the previous task branch and state "stacked on <branch>" in the handoff.

## Commit format
Types: `feat fix docs style refactor perf build ci chore revert test`. (Unlike the earlier POC, `test` is allowed here because New CP requires tests.)
Subject: imperative, <= 72 characters, e.g. `feat(auth): add Google login and protected routes`.
Body: one bullet per subtask id (`- A4.2 route guard`).
Footer:
```
Refs: New CP, FE Option A, A<NN>
AI-Assisted: Claude Code
```

## Start-of-task protocol (assistant)
1. Wait for `start A<NN>`.
2. Read-only checks: `git rev-parse --is-inside-work-tree`, `git branch --show-current`, `git status --porcelain`. Stop and tell the developer if not a repo, the tree is dirty, or the branch is unexpected.
3. Run exactly ONE mutating git command: `git switch -c <branch from TASKS.md>`.
4. Work only on that task; update `AI_USAGE_LOG.md` after each subtask group.

## End-of-task protocol (assistant)
1. Run `npm run verify`; fix until green or report the failure verbatim.
2. Save the commit message to `.handoff/task-A<NN>-commit.txt`.
3. Print the handoff block: branch, base, verify result, commit message, the developer's commands, PR title, 3-line PR description, manual checks. Then STOP.
Developer commands (from the repo root):
```bash
git add -A
git commit -F .handoff/task-A<NN>-commit.txt
git push -u origin <branch>
```
`.handoff/` is git-ignored, so the message file is not committed.

## `.gitignore` (the developer applies it)
```
node_modules/
dist/
coverage/
.env*
!.env.example
.handoff/
*.log
```

## PR template
```
Title: <commit subject>
Task: A<NN>: <title>   Base: <integration branch>
## Summary (3 lines)
## Subtasks: A<NN>.1 ... A<NN>.n
## How to check: <routes, modes, widths>
## Checklist
- [ ] npm run verify green   - [ ] light + dark   - [ ] 390/768/1024/1440, no horizontal scroll
- [ ] keyboard pass          - [ ] no colour literals  - [ ] AI_USAGE_LOG, DEVIATIONS, EVIDENCE updated
- [ ] no real data, no secrets, no unapproved dependency
```

## Server-side protections (set by the team on the remote)
Protect `main` and the integration branch: no direct push, no force push, PR required, at least 1 approval (Aya), CI green once added (A12). Secret scanning on; no `.env*` file other than `.env.example` may ever appear in history.
