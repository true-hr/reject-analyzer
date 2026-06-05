# Scheduler v2 Disposable Object Verification Plan

## Purpose

This document defines the safe plan for object-level verification of the scheduler v2 notification schema migration applied to the disposable Supabase project.

This batch does not run DB object verification. It only documents how to verify enum, table, index, and constraint existence safely in a later batch.

## Prior document

- PR #801 result document: `docs/scheduler-v2-disposable-schema-apply-verification-result-20260605.md`
- PR #801 merge commit: `ab70834c67049921075d631bb81753a031701ee8`
- Migration draft: `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`

## Current status

| Field | Status |
| --- | --- |
| Migration history verification | `APPLIED_VERIFIED` |
| Object-level verification | `NOT_PERFORMED` |
| Disposable project visibility | Visible in `supabase projects list` |
| Existing project masked ref | `pq...sk` |
| Disposable project masked ref | `rk...hu` |
| Org/team masked | `nv...mk` |

Object-level verification was not performed in PR #801 because a follow-up Supabase CLI check requested `SUPABASE_DB_PASSWORD`, and that batch prohibited DB password input, storage, output, or recording. No DB password was entered, stored, printed, or recorded.

The next step is not object-level verification execution. The next step is this plan: define a safe verification method that avoids recording full refs, keys, passwords, tokens, provider secrets, or real user data.

## Verification targets

Enums/types:

- `scheduler_person_status`
- `scheduler_identity_provider`
- `scheduler_identity_status`
- `scheduler_contact_type`
- `scheduler_contact_status`
- `scheduler_verification_method`
- `scheduler_verification_status`
- `scheduler_notification_channel`
- `scheduler_consent_status`
- `scheduler_reminder_kind`
- `scheduler_reminder_cadence`
- `scheduler_skip_policy`
- `scheduler_web_push_ownership_status`
- `scheduler_delivery_claim_status`

Tables:

- `persons`
- `account_identities`
- `contact_points`
- `contact_verifications`
- `notification_consents`
- `reminder_rules`
- `reminder_channels`
- `web_push_subscription_owners`
- `notification_delivery_claims`
- `notification_delivery_logs`

Key checks:

- Expected columns exist for each required table.
- Primary key and foreign key candidates match the migration intent.
- Unique and index candidates exist where required.
- Delivery claim idempotency unique/index checks exist for claim key and rule/channel/local-slot uniqueness.
- `web_push_subscription_owners` is centered on `endpoint_hash`, not raw endpoint, `p256dh`, or auth values.
- No triggers, functions, or backfill objects were introduced by this migration.
- RLS was not enabled by this migration.
- Existing `push_subscriptions` raw subscription details were not copied into the scheduler v2 ownership table.

## Safe verification options

### Option A. Supabase Dashboard Table Editor/Database UI read-only confirmation

Advantages:

- The user can inspect objects without sharing a DB password with Claude/Codex.
- Full project ref, keys, passwords, and tokens do not need to be pasted into chat or docs.

Disadvantages:

- The user must manually confirm the object list and evidence.
- The result depends on careful visual inspection rather than CLI output captured by the agent.

Notes:

- Do not share full refs, keys, passwords, tokens, provider secrets, or screenshots that reveal secrets.
- Claude/Codex should document only the user's masked confirmation result.

### Option B. Supabase CLI password prompt with non-recorded handling

Advantages:

- CLI-based verification can check catalog-level object existence more precisely.
- It can produce a repeatable result if command output contains only object names and non-secret metadata.

Disadvantages:

- DB password handling exists, even if the password is never recorded.
- The process must ensure the password is not placed in chat, docs, shell history, command arguments, environment variables, logs, or files.

Conditions:

- The password must be typed only into a secure interactive prompt by the user.
- Claude/Codex must not see, store, print, echo, or record the password.
- This plan does not execute the prompt or any DB query.

### Option C. No script file; next batch runs read-only psql/CLI checks only

Advantages:

- The verification checklist can be reviewed before execution.
- No SQL verification file is created in the repository.

Disadvantages:

- Password input method still needs explicit approval.
- The next batch must keep queries read-only and avoid writing any migration, RLS, config, env, or script file.

This plan does not execute any query.

### Option D. Supabase Management API/CLI metadata only

Advantages:

- It may avoid DB password handling.
- It may be enough for high-level project visibility and migration history checks.

Disadvantages:

- It is unclear whether enum, table, index, and constraint existence can be verified fully from management metadata alone.
- Tool support must be checked before execution.

This option should be treated as exploratory until tool support is confirmed.

## Recommended approach

1. First document the exact verification checklist and pseudo-query intent.
2. Confirm whether the user can enter the disposable DB password directly into an interactive prompt without Claude/Codex seeing or recording it.
3. If non-recorded password handling is feasible, run a separate disposable DB object-level verification batch using only read-only catalog checks.
4. If non-recorded password handling is not feasible, use Dashboard read-only inspection by the user and have Claude/Codex document only the masked result.
5. In every option, do not record full project refs, keys, passwords, tokens, provider secrets, or real user data.

## Next batch checklist draft

This section is a checklist and pseudo-query plan only. It is not an executable SQL file, and this batch does not run any DB query.

- Confirm target project:
  - Disposable project name is `passmap-scheduler-v2-disposable-20260605`.
  - Disposable masked ref remains `rk...hu`.
  - Existing `reject analyzer` masked ref remains different, `pq...sk`.
- Confirm enum count:
  - Expected scheduler v2 enum/type count is 14.
  - Required enum/type names match the list in this document.
- Confirm table count:
  - Expected scheduler v2 table count is 10.
  - Required table names match the list in this document.
- Confirm required columns:
  - For each required table, compare column names and nullable/default intent against the migration draft.
- Confirm primary key and foreign key candidates:
  - Each required table has the expected primary key candidate.
  - Person, contact, rule, claim, and log relationships match the migration draft.
- Confirm unique/index candidates:
  - Active identity uniqueness by provider and provider user id.
  - Active web push endpoint hash uniqueness.
  - Delivery claim uniqueness by claim key.
  - Delivery claim uniqueness by rule, channel, and local slot key.
  - Supporting lookup indexes for person, contact, rule, status, and created-at fields.
- Confirm RLS state:
  - RLS was not enabled by this migration.
  - No RLS policy was created by this migration.
- Confirm no trigger/function/backfill:
  - No scheduler v2 trigger was created.
  - No scheduler v2 database function was created.
  - No backfill was performed.
- Confirm data minimization:
  - `web_push_subscription_owners` contains `endpoint_hash` intent only.
  - No raw endpoint, `p256dh`, or auth subscription details were copied from existing `push_subscriptions`.

## Not done in this batch

- DB query 실행 없음.
- Supabase SQL Editor 사용 없음.
- production/staging DB 접근 없음.
- 기존 `reject analyzer` project 변경 없음.
- disposable project 설정 변경 없음.
- RLS SQL 작성 없음.
- migration 수정/생성 없음.
- env/secret 변경 없음.
- DB password 입력/저장/출력/기록 없음.
- service role/anon key 저장 없음.
- Edge Function 수정 없음.
- frontend 수정 없음.
- provider/live 발송 없음.
- cron/production 설정 없음.

## Next steps

1. PR merge.
2. Disposable DB object-level verification execution batch.
3. Object-level verification result document.
4. RLS SQL migration draft.
5. Disposable RLS apply verification.
6. staging apply plan.
