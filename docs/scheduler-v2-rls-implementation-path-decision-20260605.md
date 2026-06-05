# Scheduler v2 RLS Implementation Path Decision

## Purpose

This document decides the next implementation path for scheduler v2 notification schema RLS work.

Goals:

- Decide whether to continue Docker recovery.
- Decide whether a disposable Supabase project verification path is needed.
- Decide when RLS SQL draft work should start.
- Define the minimum verification steps required before production/staging apply.
- Keep PASSMAP notification, login, and scheduler v2 work from drifting into local development environment repair.

## Current status

Completed:

- Scheduler v2 dry-run fixture and integration matrix work.
- DB schema design document.
- Notification schema migration draft.
- Migration review checklist.
- RLS policy design document.
- Local DB apply test plan.
- Supabase CLI diagnosis and recovery.
- Local DB apply retry result document.
- RLS read-only policy draft design.

BLOCKED:

- Local DB apply test is `BLOCKED` by Docker daemon availability.
- Docker Desktop/Linux engine recovery has not been done.

Not done yet:

- Actual Supabase DB apply.
- RLS SQL migration.
- RLS policy apply.
- Edge Function DB read implementation.
- Frontend notification settings UI v2.
- Kakao/SMS provider integration.
- Cron/live transition.
- Production deploy.

## Option A. Recover Docker and verify local apply

Content:

- Recover Docker Desktop / Linux engine.
- Restore local Supabase.
- Retry local apply in this order: `supabase status` -> `supabase start` -> `supabase db reset`.

Pros:

- Safest way to verify migration syntax and schema creation locally.
- Fully separated from production/staging.
- Enables repeated local validation for later RLS SQL.

Cons:

- The current bottleneck moves from PASSMAP product work to the local PC development environment.
- Docker Desktop/WSL2 issues can take substantial time.
- The workstream can keep expanding into environment repair.

Decision:

- Needed long-term, but not recommended as the immediate next mainline task.
- Split into a separate development environment maintenance task.

## Option B. Disposable Supabase project apply verification

Content:

- Create a one-time Supabase project completely separated from production/staging.
- Verify migration apply without real user data, provider secrets, or Vercel env linkage.
- Delete the project or block access after verification.

Pros:

- Bypasses the current Docker blocker.
- Verifies schema apply in a real Supabase remote environment.
- Relatively safe if strictly separated from production/staging.

Cons:

- Guardrails are more complex than local verification because it is still a remote project.
- Project ref, env, secrets, and data separation must be checked carefully.
- Accidentally connecting to production/staging would be high risk.
- Supabase cost/project management can become a concern.

Decision:

- Most realistic apply verification alternative if Docker recovery should not continue now.
- Do not create or apply immediately.
- First write a disposable project setup plan document.

## Option C. Defer local apply and write RLS SQL draft from documents first

Content:

- Write an RLS SQL migration draft from the existing schema draft and RLS policy design documents.
- Do not apply it to any DB.
- Leave local/disposable verification for later.

Pros:

- Keeps PASSMAP mainline moving quickly.
- Makes RLS implementation concrete.
- Avoids being blocked by Docker.

Cons:

- The schema migration has not yet been DB-verified.
- RLS SQL would also be written without execution verification, increasing error risk.
- Helper function/view and SECURITY DEFINER details carry real DB risk before verification.

Decision:

- Possible, but going directly to full RLS SQL is risky.
- If used, it should be limited to an `RLS SQL draft skeleton`.
- Actual policy SQL should wait until disposable or local apply verification passes.

## Recommended decision

Recommended path:

1. Exclude Docker recovery from the current mainline.
2. Keep local DB apply test in `BLOCKED` status for now.
3. Make the next task a Disposable Supabase project setup plan document.
4. Do not create or apply to a disposable project in that planning PR.
5. Run disposable project apply verification as a separate QA Batch after the setup plan.
6. Move to RLS SQL migration draft only after apply verification passes.
7. Keep RLS SQL draft as draft-only until production/staging apply approval exists.

Recommended flow:

```txt
RLS implementation path decision
-> Disposable Supabase project setup plan
-> Disposable project migration apply verification
-> RLS SQL migration draft
-> Disposable/local RLS apply verification
-> staging
-> production last
```

## Not doing immediately

- Do not keep digging into Docker recovery in the scheduler v2 mainline.
- Do not write RLS SQL immediately.
- Do not apply to production/staging DB.
- Do not create a disposable project in this PR.
- Do not use Supabase SQL Editor.
- Do not move to Edge Function DB read implementation.
- Do not move to frontend notification settings UI.

## Next PR candidates

### Recommended next PR

`docs: add scheduler v2 disposable supabase project setup plan`

Expected file:

- `docs/scheduler-v2-disposable-supabase-project-setup-plan-20260605.md`

Goal:

- Document disposable Supabase project creation, separation, verification, and deletion criteria.
- Define a checklist proving complete separation from production/staging.
- Prohibit real data, env, and provider secret import.
- Define preflight steps before migration apply verification.

### Later PR candidates

- `qa: add scheduler v2 disposable schema apply result`
- `db: add scheduler v2 rls enable draft`
- `docs: add scheduler v2 rls apply verification plan`

## Decision criteria

Move to Disposable Supabase project setup plan when:

- Docker recovery is intentionally deferred.
- A project fully separated from production/staging can be created.
- Real user data will not be imported.
- Provider/live secrets will not be connected.
- Vercel production env will not be connected.
- Project ref will be explicitly recorded before any migration apply.

Move to RLS SQL draft when:

- Schema migration applies successfully in a disposable or local DB.
- Enum/table/index/constraint verification is complete.
- Destructive behavior absence is confirmed.
- Privacy model verification is complete.
- RLS read-only policy draft is merged to main.

Move to production/staging apply only when:

- Local/disposable apply verification has passed.
- RLS SQL draft verification has passed.
- Rollback/disable plan exists.
- Staging verification has passed.
- Live provider/cron paths remain separated.
- The user gives explicit approval.

## Out of scope

- RLS SQL writing.
- Migration file creation.
- Migration file changes.
- Supabase DB apply.
- Local DB apply retry.
- Docker recovery.
- Disposable Supabase project creation.
- Supabase SQL Editor execution.
- Edge Function changes.
- Frontend changes.
- Provider/live sending.
- Cron, env, or production configuration.
- Account linking implementation.
- Contact verification implementation.
- Consent endpoint implementation.
- Reminder settings UI implementation.
- Web Push registration API implementation.
- Production deploy.
