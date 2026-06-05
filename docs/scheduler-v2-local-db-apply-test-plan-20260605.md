# Scheduler v2 Local DB Apply Test Plan

## Purpose

This document defines the safe procedure for testing the scheduler v2 notification schema migration draft in a local or disposable database before applying it to a real Supabase database.

Goals:

- Find SQL syntax errors in the migration draft before production.
- Confirm enum, type, table, index, and constraint creation.
- Check possible naming collisions with the existing schema.
- Reconfirm that the migration has no destructive behavior.
- Confirm that schema apply is possible before writing RLS SQL.
- Verify only in an environment separated from production and staging databases.

## Migration under test

Target file:

- `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`

This file must not be modified by this documentation task.

Creation candidates to verify:

Enum/type:

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

## Allowed test environments

Only the following environments are allowed.

### Option A. Supabase local development DB

- Docker-based local Supabase database.
- Not linked to production or staging projects.
- Disposable environment where local reset is allowed.

### Option B. Disposable Supabase project

- Newly created Supabase project used only for this test.
- Data, env, secrets, auth, and storage are separated from production and staging.
- Project can be deleted after the test.

### Option C. Plain local Postgres

- Acceptable for SQL syntax, type creation, and table creation checks.
- May not validate all Supabase-specific behavior.
- Local Supabase should be preferred if the migration depends on Supabase-specific features.

## Forbidden test environments

Do not run this migration apply test against:

- Production Supabase project.
- Staging Supabase project.
- Any remote DB with existing users.
- Any DB connected to Vercel production.
- Any DB containing real auth users, push subscriptions, or reminder preference data.
- Supabase SQL Editor connected directly to production or staging.

## Preflight safety checklist

Before any test:

- Check the current Supabase project link state.
- Confirm `.env`, secrets, and project ref values do not point to production or staging.
- Confirm the environment is local with `supabase status` or an equivalent command.
- Confirm the CLI context is not connected to a remote DB.
- Write down the production and staging project refs, then confirm the test target is different.
- Confirm `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql` has not been modified.
- Run `git status --short` and verify that only intended documentation work is present.

Stop immediately if a production or staging project ref appears in the test target.

## Local Supabase test procedure

This section documents the procedure only. This PR does not execute it.

Example procedure:

```bash
supabase status
supabase start
supabase db reset
```

Rules:

- These commands are allowed only for a local Supabase DB.
- Do not run them against a linked remote project.
- Stop immediately if a production or staging project ref appears.

Enum/type verification query:

```sql
select typname
from pg_type
where typname like 'scheduler_%'
order by typname;
```

Table verification query:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'persons',
    'account_identities',
    'contact_points',
    'contact_verifications',
    'notification_consents',
    'reminder_rules',
    'reminder_channels',
    'web_push_subscription_owners',
    'notification_delivery_claims',
    'notification_delivery_logs'
  )
order by tablename;
```

Index and constraint verification query:

```sql
select
  c.relname as table_name,
  con.conname as constraint_name,
  con.contype as constraint_type
from pg_constraint con
join pg_class c on c.oid = con.conrelid
where c.relname in (
  'persons',
  'account_identities',
  'contact_points',
  'contact_verifications',
  'notification_consents',
  'reminder_rules',
  'reminder_channels',
  'web_push_subscription_owners',
  'notification_delivery_claims',
  'notification_delivery_logs'
)
order by c.relname, con.conname;
```

```sql
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'persons',
    'account_identities',
    'contact_points',
    'contact_verifications',
    'notification_consents',
    'reminder_rules',
    'reminder_channels',
    'web_push_subscription_owners',
    'notification_delivery_claims',
    'notification_delivery_logs'
  )
order by tablename, indexname;
```

## Disposable Supabase project test procedure

This section documents the procedure only. This PR does not execute it.

Procedure:

- Create a project used only for this migration apply test.
- Confirm its project ref is different from production and staging.
- Confirm the database is empty or disposable before migration apply.
- Apply the migration draft only after the project ref and environment isolation are verified.
- Confirm enum, table, index, and constraint creation after apply.
- Delete the project or block access after the test is complete.

Rules:

- Do not import production data.
- Do not import real user data.
- Do not connect live provider secrets.
- Do not connect Vercel production env.

## Verification items

### SQL syntax

- Migration parses and executes successfully.
- Enum/type creation order is valid.
- Table creation order is valid.

### Naming collision

- New table and type names do not collide with existing names.
- The design still avoids a strong foreign key from the new schema to existing `push_subscriptions`.

### Constraints and indexes

Verify unique constraint candidates including:

- `claim_key`.
- `(rule_id, channel, local_slot_key)`.

Verify index candidates including:

- Web Push ownership endpoint hash lookup.
- Person lookup.
- Contact lookup.
- Consent lookup.
- Reminder lookup.

### Destructive behavior

Confirm the migration does not include:

- Existing table drop.
- Existing column drop.
- Existing enum alteration.
- Existing data migration or backfill.
- Trigger or function creation.
- RLS enable.

### Privacy model

Confirm:

- Raw Web Push `endpoint`, `p256dh`, and `auth` values are not copied into new person or contact tables.
- Phone, email, and Kakao contacts remain separate from consent state.
- Delivery claim/log tables are not designed as general client-visible surfaces.

## Failure handling

- If a syntax error is found, create a separate migration draft fix PR.
- If a naming collision is found, create a separate schema naming review document or migration patch PR.
- If possible destructive behavior is found, stop immediately.
- If there is any chance the target is production or staging, stop immediately.
- If RLS is needed, do not write it in this PR.
- If an Edge Function change is needed, do not write it in this PR.

## Pass criteria

The plan passes when:

- The local/disposable DB migration apply procedure is clear.
- Production and staging misapply guardrails are clear.
- Enum, type, table, index, and constraint verification queries are documented.
- Destructive behavior checks are documented.
- The plan is sufficient as a pre-RLS SQL step.
- This PR adds only this documentation file.

## Out of scope

- Migration file changes.
- SQL patch writing.
- RLS SQL writing.
- Supabase DB apply execution.
- Production or staging DB access.
- Supabase SQL Editor execution.
- Edge Function changes.
- Frontend changes.
- Provider/live sending.
- Cron, env, or production configuration.
- Real user data import.
- Backfill.
- Account merge.
- Web Push subscription migration.
