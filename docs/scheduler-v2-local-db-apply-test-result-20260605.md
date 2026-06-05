# Scheduler v2 Local DB Apply Test Result

## Purpose

This document records the local-only apply verification result for the scheduler v2 notification schema migration draft.

Result status: `BLOCKED`

The migration was not applied because the Supabase CLI local status check failed before the environment could be confirmed as a safe local Supabase DB.

## Migration under test

- `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`

The migration file was not modified.

## Test environment

| Item | Result |
| --- | --- |
| OS | Microsoft Windows NT 10.0.19045.0 |
| Shell | Windows PowerShell 5.1.19041.6456 |
| Supabase CLI version | `2.104.0` |
| Supabase CLI path | `D:\tools\npm-global\supabase.exe` |
| Docker availability | `Docker version 29.5.2, build 79eb04c` |
| Local Supabase status | `BLOCKED`: `supabase status` could not run because `supabase-go` was missing |
| Remote/project ref exposure | No project ref was confirmed because `supabase status` failed before printing local status |
| Production/staging connection check | No production/staging DB was accessed; apply/reset was not run because local Supabase status could not be confirmed |

Safety decision:

- `supabase status` must confirm a local development environment before `supabase start` or `supabase db reset`.
- Because `supabase status` failed with a CLI binary error, local DB safety could not be proven.
- The apply test was stopped before any DB reset/apply command.

## Executed commands

Commands were run in order unless noted. Secret and env values were not printed or recorded.

```bash
git fetch origin main
git log --oneline --decorate -n 20 origin/main
git grep "Scheduler v2 Local DB Apply Test Plan" origin/main -- docs/scheduler-v2-local-db-apply-test-plan-20260605.md
git grep "Forbidden test environments" origin/main -- docs/scheduler-v2-local-db-apply-test-plan-20260605.md
git grep "20260604000000_scheduler_v2_notification_schema.sql" origin/main -- docs/scheduler-v2-local-db-apply-test-plan-20260605.md
git worktree add -b qa/scheduler-v2-local-db-apply-test-20260605 D:\패스맵\worktrees\scheduler-v2-local-db-apply-test-20260605 origin/main
git status --short --branch
git diff --name-status origin/main...HEAD
supabase --version
supabase status
docker --version
powershell version and OS version checks
Select-String destructive behavior check on supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql
Select-String privacy model check on supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql
Get-Command supabase
```

Commands intentionally not run:

```bash
supabase start
supabase db reset
supabase db push
supabase migration up
```

Reason:

- `supabase status` failed before local-only safety could be confirmed.
- Remote or linked-project risk could not be excluded through the required local status check.

## Apply result

`BLOCKED`

`supabase status` failed with this issue:

```text
Could not find the `supabase-go` binary.
```

The installed `supabase` command is a shim at `D:\tools\npm-global\supabase.exe`. It reported version `2.104.0`, but it could not locate the co-located `supabase-go` executable required for status/start/reset operations.

No local DB reset or migration apply was executed.

## Enum/type verification result

DB verification was not executed because the local Supabase environment could not be confirmed.

| Enum/type | Result |
| --- | --- |
| `scheduler_person_status` | `BLOCKED` |
| `scheduler_identity_provider` | `BLOCKED` |
| `scheduler_identity_status` | `BLOCKED` |
| `scheduler_contact_type` | `BLOCKED` |
| `scheduler_contact_status` | `BLOCKED` |
| `scheduler_verification_method` | `BLOCKED` |
| `scheduler_verification_status` | `BLOCKED` |
| `scheduler_notification_channel` | `BLOCKED` |
| `scheduler_consent_status` | `BLOCKED` |
| `scheduler_reminder_kind` | `BLOCKED` |
| `scheduler_reminder_cadence` | `BLOCKED` |
| `scheduler_skip_policy` | `BLOCKED` |
| `scheduler_web_push_ownership_status` | `BLOCKED` |
| `scheduler_delivery_claim_status` | `BLOCKED` |

## Table verification result

DB verification was not executed because the local Supabase environment could not be confirmed.

| Table | Result |
| --- | --- |
| `persons` | `BLOCKED` |
| `account_identities` | `BLOCKED` |
| `contact_points` | `BLOCKED` |
| `contact_verifications` | `BLOCKED` |
| `notification_consents` | `BLOCKED` |
| `reminder_rules` | `BLOCKED` |
| `reminder_channels` | `BLOCKED` |
| `web_push_subscription_owners` | `BLOCKED` |
| `notification_delivery_claims` | `BLOCKED` |
| `notification_delivery_logs` | `BLOCKED` |

## Constraint/index verification result

DB constraint/index queries were not executed because the local Supabase environment could not be confirmed.

Static migration review found the expected index references for key QA anchors:

| Item | Static result |
| --- | --- |
| `claim_key` | Present as `notification_delivery_claims_claim_key_key` unique index |
| `(rule_id, channel, local_slot_key)` | Present as `notification_delivery_claims_rule_channel_slot_key` unique index |
| `endpoint_hash` | Present as `web_push_subscription_owners_endpoint_hash_idx` and active unique endpoint hash index |
| Person lookup | Present in migration index definitions for relevant scheduler tables |
| Contact lookup | Present through `contact_points_person_id_idx` and contact type/value lookup |
| Consent lookup | Present through `notification_consents_person_id_idx` and consent channel/type indexes |
| Reminder lookup | Static DB query not executed; DB verification remains `BLOCKED` |

Because the migration was not applied, these static findings do not replace DB-level verification.

## Destructive behavior verification result

Static command:

```bash
Select-String -Path supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql -Pattern "drop table|drop column|alter type|delete from|truncate|create trigger|create function|enable row level security" -CaseSensitive:$false
```

Result:

- No destructive SQL statements were found.
- One non-destructive comment matched: `-- This draft intentionally does not create triggers or functions.`
- No `drop table`, `drop column`, `alter type`, `delete from`, `truncate`, `create trigger`, `create function`, or `enable row level security` statement was observed in the static check.

## Privacy model verification result

Static command:

```bash
Select-String -Path supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql -Pattern "endpoint|p256dh|auth|endpoint_hash|contact_points|notification_consents|notification_delivery_logs|notification_delivery_claims" -CaseSensitive:$false
```

Static findings:

- `contact_points` comment states Web Push endpoints do not belong there.
- `web_push_subscription_owners` includes `endpoint_hash`.
- The migration includes a comment stating only `endpoint_hash` is stored in `web_push_subscription_owners` and raw `endpoint`, `p256dh`, or `auth` values are not stored there.
- `notification_consents` is separate from `contact_points`.
- `notification_delivery_claims` and `notification_delivery_logs` exist as delivery/idempotency and audit tables, not as client exposure policy.

DB-level privacy verification remains `BLOCKED` because migration apply was not executed.

## Findings

| Type | Result |
| --- | --- |
| syntax error | `BLOCKED`: migration was not applied |
| naming collision | `BLOCKED`: DB apply was not executed |
| constraint/index missing | `BLOCKED`: DB queries were not executed |
| destructive risk | Static check found no destructive statement; DB apply not executed |
| privacy risk | Static check supports intended privacy model; DB apply not executed |
| environment blocked | Supabase CLI shim could not find `supabase-go` |

## Next actions

Because the result is `BLOCKED`:

- Prepare a working local Supabase CLI installation where `supabase status` can run.
- Re-run the local-only preflight from the test plan.
- Do not use production or staging as a substitute for local verification.
- Do not run `supabase start` or `supabase db reset` until `supabase status` can confirm local-only safety.
- If local Supabase remains unavailable, split disposable Supabase project setup into a separate task.

Production/staging apply is still prohibited.

## Out of scope

- Migration changes.
- SQL patch writing.
- RLS SQL writing.
- Production or staging DB apply.
- Supabase SQL Editor execution.
- Edge Function changes.
- Frontend changes.
- Provider/live sending.
- Cron, env, or production configuration.
- Real user data import.
- Backfill.
- Account merge.
- Web Push subscription migration.
