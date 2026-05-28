# PASSMAP Agent Rules

## Mission
This repository uses AI coding agents in a controlled patch workflow.
The primary goal is operational stability, minimal-risk implementation, and precise patch execution.

## Agent Operating Mode
Default to DIRECT PATCH MODE.

That means:
- do not ask for permission if the change is clearly within the allowed scope
- make the safest minimal patch directly
- avoid unnecessary clarification
- optimize for execution speed without violating repository rules

## Repository Patch Policy
Agents may proceed without asking when all conditions below are satisfied:
- the change is limited in scope
- maximum 3 files are modified
- the patch is append-only or minimal in-place
- no file deletion is involved
- no broad refactor is involved
- no public contract/API is changed

## Allowed Actions
- helper addition
- guard/condition reinforcement
- local state/data propagation
- local UI rendering fixes
- local parser/extractor fixes
- exact-anchor insertion or replacement
- narrowly scoped bug fixes
- temporary debug instrumentation for swallowed runtime errors

## Disallowed Without Explicit Instruction
- deleting files
- moving files
- renaming functions/classes/modules
- changing external interfaces
- large refactors
- mixing unrelated fixes in one task
- rewriting entire files when a local patch is possible

## Preferred Patch Style
- exact-anchor based
- smallest viable delta
- preserve file structure
- preserve naming conventions
- preserve existing comments/order unless change is necessary
- backward compatible by default

## Escalation Rule
Ask only if one of the following is unavoidable:
- more than 3 files required
- structural redesign required
- interface/contract change required
- deletion required
- request is ambiguous at target-file level
- repository rule conflict exists

When escalation is necessary:
- ask once
- ask at the current task-scope level instead of per-command when the risk profile is the same
- do not ask multiple optional questions
- prefer reusable `prefix_rule` approval for routine validation, dependency inspection, feature-branch git operations, and read-only CLI investigation inside the current task scope
- request the broadest practical reusable prefix for repeated in-scope safe commands so equivalent commands do not keep stopping the task
- keep destructive commands, production mutation, secrets, environment variables, database schema/RLS/auth changes, and direct pushes to protected branches as explicit-confirmation items

## Reporting Format
Preferred response format:

1. 수정 분류
2. 수정 파일
3. exact anchor
4. 변경 전 / 후 요약
5. 패치 코드
6. 검증 방법

## PASSMAP Collaboration Contract
- ChatGPT designs
- implementation agent executes
- do not challenge the design unless it is technically impossible or contradicts repository rules
- if multiple safe implementations are possible, choose the most conservative one

## High-Risk Files
Extra caution:
- `src/App.jsx`
- `src/lib/analyzer.js`
- `src/lib/decision/index.js`

In these files:
- patch locally
- do not reorganize broadly
- do not mix cleanup with bug fixing

## Debug Rule
If diagnosing a silent failure on a user-facing path:
- add a single minimal debug snapshot
- avoid log spam
- document whether removal is required afterward

## Completion and Blocked Reporting Rules

### Direct execution, not permission waiting
- If the task is within allowed scope, proceed without asking for confirmation.
- Do not ask for confirmation for routine read, search, edit, build, test, lint, `git status`, `git diff`, `git log`, local QA, or read-only GitHub/Vercel/Supabase inspection.
- Do not stop merely because a read-only investigation touches Protected files or deployment-related files.
- Stop before writing to Protected surfaces.

### No silent abort
- Never end a task with only "aborted", "interrupted", "still working", or no final report.
- If a command or tool is interrupted, report the last completed step, the interruption point, and the next safe action.
- A partial report is mandatory when full completion is not possible.

### Blocked-state reporting
Stop and report instead of looping when:
- login, session, or user click is required
- Chrome extension UI, browser profile, or local logged-in state is required
- production deploy, redeploy, or delete is required
- Vercel env or settings changes are required
- Supabase env or secrets changes are required
- DB migration or destructive data change is required
- cron registration is required
- auth, payment, or privacy structure changes are required
- files outside the allowed scope must be modified
- the same error repeats 2 times
- a required command is unavailable after one reasonable fallback
- there is insufficient evidence to patch safely
- the task scope becomes larger than requested

### Retry limit
- For non-destructive failures, retry at most 2 times.
- After 2 failed attempts, stop and report PARTIAL or FAIL.
- Do not keep re-running the same failing command without new information.
- Do not continue indefinitely to "finish somehow."

### Required final status
Every task must end with exactly one of:
- PASS
- PARTIAL
- FAIL

### Required final report format
Every final report must include:
- Branch
- Commit, if any
- Files changed
- Commands run
- Verification result
- What was completed
- What is blocked, if anything
- Whether the result is PASS, PARTIAL, or FAIL
- Exact next action for the user or next agent

### Manual E2E rule
- If an E2E step requires the user's logged-in browser session, existing production data, Chrome extension manual loading, or a real user click, do not pretend it was completed.
- Stop at that point and report "Manual user action required."
- Provide the exact click path and expected success/failure signs.

### Protected action reminder
Never perform the following without explicit user approval:
- production deploy, redeploy, or delete
- Vercel env or settings changes
- Supabase env or secrets changes
- DB migration or destructive data changes
- cron registration
- main direct push
- force push
- `reset --hard`
- `rm -rf`
- auth, payment, or privacy structure changes

### Dirty branch / unrelated change rule
- If the current branch has unrelated dirty files, do not blindly continue.
- Classify changes first.
- Preserve useful work with a patch backup if cleanup is needed.
- Never use `git add .` or `git add -A`.
- Stage only named files.

### PASSMAP-specific intent
- The user wants less approval waiting, not reckless execution.
- The user wants completed work or a useful PARTIAL report, not silent failure.
- When blocked, produce an actionable handoff.
