# Scheduler v2 Disposable Supabase Project Setup Plan

## Purpose

This document defines the setup plan for a disposable Supabase project used to verify the scheduler v2 notification schema migration draft.

Goals:

- Provide a safe alternate verification path around the Docker local blocker.
- Ensure the disposable Supabase project is completely separated from production/staging.
- Define preflight criteria before migration apply verification.
- Prohibit real data, env, provider secret, and Vercel production linkage.
- Define project deletion or access block criteria after testing.

This document is planning only. It does not create a project, apply a migration, run SQL, or use Supabase SQL Editor.

## Current background

- Local DB apply test is `BLOCKED` by Docker daemon availability.
- Docker recovery is deferred from the scheduler v2 mainline.
- PR #787 decided the recommended path is a disposable Supabase project setup plan.
- RLS SQL draft should start only after schema apply verification.
- Production/staging apply is still prohibited.

## Disposable project definition

A Disposable Supabase project is:

- A temporary project created only for scheduler v2 schema apply verification.
- A project with a project ref completely different from production/staging.
- A project with no real user data.
- A project with no provider secrets.
- A project not connected to Vercel production env.
- A project that will be deleted or access-blocked after testing.

Not a disposable project:

- Production project.
- Staging project.
- Project connected to Vercel production.
- Project with real auth users.
- Project with push subscription or reminder data.
- Project with provider/live secrets.
- Project with imported operating data.

## Pre-creation checklist

Before creating the disposable project:

- Confirm the production project ref.
- Confirm the staging project ref.
- Confirm the new disposable project ref will differ from production/staging.
- Include `disposable`, `scheduler-v2`, and the date in the project name.
- Region can match production, but the project ref must be different.
- Confirm billing/cost impact.
- Confirm team/org permissions.
- Record that the project purpose is schema apply verification.
- The creator must record the project ref and creation time.
- Do not copy production/staging env values.
- Do not copy production/staging DB URLs.
- Do not connect service role key or anon key to any app/Vercel environment.

## Forbidden data and settings

Never put these in the disposable project:

- Production user data.
- Staging user data.
- `auth.users` real data.
- `push_subscriptions` real data.
- `reminder_preferences` real data.
- `work_records` real data.
- AI inbox real data.
- Provider secrets.
- Kakao/SMS/Email live credentials.
- VAPID private key.
- Vercel production env.
- Service role key stored in local repo `.env`.
- Real webhook URL.
- Production callback URL.
- Live cron settings.

## Allowed data and settings

Only these are allowed:

- Empty DB.
- Schema created by migration apply verification.
- Synthetic test row, only after separate approval.
- Fake email, phone, or provider ID.
- Local-only scratch note.
- Project ref record, excluding secrets.
- SQL query result summary, excluding key/token/password values.

## Post-creation preflight

After the project is created in a later task, verify:

- Disposable project ref.
- It differs from production project ref.
- It differs from staging project ref.
- No linked app/Vercel project.
- No auth users.
- No storage bucket, or empty storage only.
- No Edge Function, or only default state.
- No secrets, or test-only secrets.
- No cron/scheduler.
- No provider integration.
- No real user data.
- Billing/cost state is understood.

## Migration apply verification preflight

Before any disposable migration apply verification PR, confirm:

- Target migration is `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`.
- Apply target project ref is the disposable project.
- Apply target project ref differs from production/staging project refs.
- Supabase SQL Editor is prohibited.
- Use only CLI or a documented apply path.
- Check whether a dry-run command is available.
- Record the current DB object list before migration apply.
- Plan enum/table/index/constraint verification queries after apply.
- Plan destructive behavior absence checks after apply.
- Plan project deletion or access block after apply verification.

## Verification scope

Future disposable apply verification should check:

- Migration syntax.
- Enum/type creation.
- Ten table creation.
- Primary key, foreign key, and unique constraints.
- `claim_key` unique constraint/index.
- `(rule_id, channel, local_slot_key)` unique constraint/index.
- `endpoint_hash` index.
- Person/contact/consent/reminder lookup indexes.
- No destructive behavior.
- No copy of Web Push raw endpoint, `p256dh`, or `auth`.
- Contact and consent remain separated.
- Delivery claim/log structure exists.
- No RLS enable.
- No trigger/function creation.

## Deletion / access block plan

After testing:

- Prefer deleting the project after the verification result document is written.
- If deletion is not possible, block access or archive the project.
- Revoke service role and anon keys.
- Delete any locally stored keys if they were created.
- Reconfirm it was never connected to Vercel/app environments.
- Record project ref and deletion/block time.
- Confirm whether any cost was incurred.

## Result categories

Future apply verification should use one of:

- `PASS`: migration apply and major schema verification completed in disposable project.
- `PARTIAL`: migration applied, but some verification query or deletion/access block check is incomplete.
- `FAIL`: migration apply failed or schema verification failed.
- `BLOCKED`: apply was not run because of project separation, permission, cost, or safety issue.

## Next PR

Recommended next PR:

`qa: add scheduler v2 disposable schema apply result`

Expected file:

- `docs/scheduler-v2-disposable-schema-apply-result-20260605.md`

This PR should run only after the user explicitly approves disposable project creation and project ref confirmation.

## Out of scope

- Disposable Supabase project creation.
- Migration apply.
- RLS SQL writing.
- Migration file creation.
- Migration file changes.
- Supabase SQL Editor execution.
- Production/staging DB access.
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
