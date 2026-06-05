# Scheduler v2 Disposable Schema Apply Preflight

## Purpose

This document records the Phase 1 preflight result before any disposable Supabase project schema apply verification for the scheduler v2 notification schema migration draft.

This PR does not create a disposable Supabase project, apply migrations, run SQL, use Supabase SQL Editor, or access production/staging databases.

## Prior document

- PR #789 setup plan: `docs/scheduler-v2-disposable-supabase-project-setup-plan-20260605.md`
- Merge commit: `7e9fe510930d08e0a6c965db648dc16ae3bc6e78`

## Current status

`READY_FOR_USER_APPROVAL`

Reason:

- Supabase CLI is installed and responds.
- Supabase project listing is available from the current CLI session.
- No disposable project was created.
- No migration apply or SQL execution was performed.
- The next step requires explicit user approval for project creation, project name/region, project ref confirmation, and later schema apply verification.

## Queried information

Only read-only commands were executed.

| Command | Result summary | Notes |
| --- | --- | --- |
| `git status --short --branch` | Clean worktree before document creation | No branch changes before the new document |
| `git diff --name-status origin/main...HEAD` | Empty before document creation | No pending branch diff |
| `supabase --version` | `2.105.0` | CLI responds |
| `supabase projects list` | Project list query succeeded | One project was visible; full org/project refs are intentionally not recorded |

Masked project listing observation:

- Visible project count: 1
- Visible project name: `reject analyzer`
- Visible region: `Northeast Asia (Seoul)`
- Visible project ref: masked as `pq...sk`
- Visible org id: masked as `nv...mk`
- Linked project: none shown
- CLI message: `Cannot find project ref. Have you run supabase link?`

Interpretation:

- Supabase CLI login/session appears available enough for project listing.
- Project creation permission was not tested because project creation is prohibited in this PR.
- Team/org selection and billing/cost confirmation still require user approval.
- The visible existing project must be treated as non-disposable unless the user explicitly proves otherwise. It must not be used for this verification.

No secret, DB password, service role key, anon key, provider secret, access token, or full project ref was recorded.

## Production/staging separation plan

Before creating any disposable project, identify production/staging safely:

- Ask the user to confirm the production project ref out of band.
- Ask the user to confirm the staging project ref out of band, if staging exists.
- Record only masked refs in public documentation unless full ref recording is explicitly approved.
- Compare the new disposable project ref against both production and staging refs.
- Treat any existing project with real app data, auth users, provider secrets, Vercel env linkage, or live callbacks as non-disposable.
- Do not use the visible existing `reject analyzer` project for scheduler v2 disposable verification unless it is separately proven to be disposable and empty.

Disposable project separation criteria:

- Different project ref from production.
- Different project ref from staging.
- No Vercel production env connection.
- No app env connection.
- No provider/live secrets.
- No real user data.
- No live cron/callback/webhook integration.

## Recommended project name and region

Recommended project name:

- `passmap-scheduler-v2-disposable-20260605`

Region guidance:

- `Northeast Asia (Seoul)` is acceptable for management consistency because the visible existing project uses that region.
- A different region is also acceptable for migration syntax/schema verification.
- Region choice should be based on cost, quota, and management convenience.
- The project ref must be different from production/staging regardless of region.

## Required user approvals

The user must explicitly approve:

- Disposable Supabase project creation.
- Project name.
- Region.
- Billing/cost impact.
- Team/org selection if the account has more than one org.
- Project deletion or access block method after verification.
- Project ref confirmation after creation.
- Schema apply verification against that specific disposable project.

Approval text before project creation:

```txt
Disposable Supabase project 생성 승인합니다.
Project name: passmap-scheduler-v2-disposable-20260605
Region: <선택 region>
Production/staging과 분리된 project ref 확인 후 schema apply verification을 진행하세요.
```

Required confirmation after project creation:

```txt
Disposable project ref가 production/staging과 다름을 확인했습니다.
이 disposable project에 scheduler v2 notification schema migration apply verification을 진행해도 됩니다.
```

Without both approvals, Phase 2 must not start.

## Forbidden connections

Before and after project creation, do not connect:

- Vercel production env.
- App env.
- Provider/live secret.
- Production/staging DB URL.
- Service role key in local repo `.env`.
- Real user data import.
- Live cron.
- Real callback/webhook URL.

## Next apply verification steps

After explicit user approval in a future PR:

- Create the disposable project.
- Record the project ref, with masking in public docs unless full ref recording is approved.
- Confirm the project ref differs from production/staging.
- Confirm the DB is empty.
- Confirm no real data/env/secrets exist.
- Confirm no Vercel/app/provider/live integration exists.
- Apply `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`.
- Verify enum/table/index/constraint creation.
- Verify destructive behavior absence.
- Verify privacy model assumptions.
- Write the apply result document.
- Delete the project or block access.

## Not done in this document

- No project creation.
- No migration apply.
- No SQL execution.
- No production/staging access.
- No secret/env storage.

## Out of scope

- Disposable Supabase project creation.
- Migration apply.
- RLS SQL writing.
- Migration file creation.
- Migration file changes.
- Supabase SQL Editor execution.
- Production/staging DB access.
- Remote DB apply.
- Local DB apply retry.
- Docker recovery.
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
