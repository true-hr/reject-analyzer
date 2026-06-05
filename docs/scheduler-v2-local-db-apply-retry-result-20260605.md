# Scheduler v2 Local DB Apply Retry Result

## Purpose

This document records the local-only apply retry result for the scheduler v2 notification schema migration draft after Supabase CLI recovery.

Result status: `BLOCKED`

The retry stopped during preflight because Docker CLI was installed but the Docker daemon was not reachable. No Supabase local status/start/reset command was run after the Docker failure.

## Migration under test

- `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`

The migration file was not modified.

## Prior CLI recovery state

| Item | Result |
| --- | --- |
| PR #782 merge commit | `fc086101da83f2062eac25fa43795e834a4084ee` |
| Diagnosis document on `origin/main` | `docs/supabase-cli-local-diagnosis-20260605.md` confirmed |
| Recovery result | `PASS` |
| PowerShell `supabase` resolution | `D:\tools\npm-global\supabase.ps1` |
| `supabase --version` | `2.105.0` |
| `D:\tools\npm-global\supabase.cmd --version` | `2.105.0` |
| Internal `supabase-go.exe --version` | `2.105.0` |
| Old root `supabase.exe` | Still exists at `D:\tools\npm-global\supabase.exe`, but PowerShell did not resolve `supabase` to it |

CLI recovery preflight passed. The batch did not proceed to Supabase local commands because Docker daemon availability failed.

## Test environment

| Item | Result |
| --- | --- |
| OS | Microsoft Windows NT 10.0.19045.0 |
| Shell | Windows PowerShell 5.1.19041.6456 |
| Supabase CLI path | `D:\tools\npm-global\supabase.ps1` |
| Supabase CLI version | `2.105.0` |
| `supabase-go` confirmation | Internal package binary returned `2.105.0` |
| Docker CLI version | `Docker version 29.5.2, build 79eb04c` |
| Docker daemon status | `BLOCKED`: `docker info` failed to connect to Docker Desktop Linux engine |
| Local Supabase status | Not executed because Docker daemon preflight failed |
| Remote/project ref exposure | No Supabase status output was produced; no project ref was recorded |
| Production/staging connection check | No production/staging/remote DB access was performed |

Docker failure summary:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

No secret/env values, access tokens, DB passwords, service role keys, or anon keys were recorded.

## Executed commands

Commands were run in this order. DB apply/reset/start commands were not executed.

```powershell
git fetch origin main
git log --oneline --decorate -n 20 origin/main
git grep "Supabase CLI Local Diagnosis" origin/main -- docs/supabase-cli-local-diagnosis-20260605.md
git grep "Recovery result" origin/main -- docs/supabase-cli-local-diagnosis-20260605.md
git grep "PASS" origin/main -- docs/supabase-cli-local-diagnosis-20260605.md
git grep "supabase-go" origin/main -- docs/supabase-cli-local-diagnosis-20260605.md
git worktree add -b qa/scheduler-v2-local-db-apply-retry-20260605 D:\패스맵\worktrees\scheduler-v2-local-db-apply-retry-20260605 origin/main
git status --short --branch
git diff --name-status origin/main...HEAD
Get-Command supabase
Get-Command supabase.ps1
Get-Command supabase.cmd
Get-Command supabase.exe
supabase --version
& "D:\tools\npm-global\supabase.cmd" --version
& "D:\tools\npm-global\node_modules\supabase\node_modules\@supabase\cli-windows-x64\bin\supabase-go.exe" --version
docker --version
docker info
$PSVersionTable.PSVersion.ToString()
[System.Environment]::OSVersion.VersionString
Select-String destructive behavior check on supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql
Select-String privacy model check on supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql
```

Commands intentionally not run:

```powershell
supabase status
supabase start
supabase db reset
supabase db push
supabase migration up
```

Reason:

- Docker daemon was not reachable.
- Local Supabase status/start/reset require a working local Docker environment.
- Continuing would violate the local-only certainty guardrail.

## Apply result

`BLOCKED`

- Local DB reset/apply was not attempted.
- No migration syntax execution occurred.
- No local DB verification query was run.
- No production, staging, or remote Supabase DB was accessed.

## Enum/type verification result

DB verification was not executed because the retry stopped before `supabase status`.

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

DB verification was not executed because the retry stopped before `supabase status`.

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

DB constraint/index queries were not executed because the retry stopped before local DB startup.

Static migration review still shows the expected anchor definitions:

| Item | Static result |
| --- | --- |
| `claim_key` | Present as `notification_delivery_claims_claim_key_key` unique index |
| `(rule_id, channel, local_slot_key)` | Present as `notification_delivery_claims_rule_channel_slot_key` unique index |
| `endpoint_hash` | Present in `web_push_subscription_owners_endpoint_hash_idx` and active endpoint hash unique index |
| person lookup | Present through scheduler table person lookup indexes |
| contact lookup | Present through `contact_points_person_id_idx` and contact type/value lookup |
| consent lookup | Present through `notification_consents_person_id_idx` and channel/type indexes |
| reminder lookup | DB query not executed; remains `BLOCKED` |

Static findings do not replace DB-level verification.

## Destructive behavior verification result

Static command:

```powershell
Select-String -Path supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql -Pattern "drop table|drop column|alter type|delete from|truncate|create trigger|create function|enable row level security" -CaseSensitive:$false
```

Result:

- No destructive SQL statements were found.
- One non-destructive comment matched: `-- This draft intentionally does not create triggers or functions.`
- No `drop table`, `drop column`, `alter type`, `delete from`, `truncate`, `create trigger`, `create function`, or `enable row level security` statement was observed.

## Privacy model verification result

Static command:

```powershell
Select-String -Path supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql -Pattern "endpoint|p256dh|auth|endpoint_hash|contact_points|notification_consents|notification_delivery_logs|notification_delivery_claims" -CaseSensitive:$false
```

Result:

- The command produced the expected privacy anchors but timed out while printing the full match list.
- Confirmed anchors include `contact_points`, `notification_consents`, `endpoint_hash`, `notification_delivery_claims`, and `notification_delivery_logs`.
- `contact_points` comments state that Web Push endpoints do not belong there.
- `web_push_subscription_owners` uses `endpoint_hash`.
- Delivery claim/log tables are present as delivery/idempotency and audit structures, not as client exposure policy.
- DB-level privacy verification remains `BLOCKED` because local DB apply was not executed.

## Findings

| Type | Result |
| --- | --- |
| CLI issue | Resolved for PowerShell: npm wrapper and internal `supabase-go.exe` returned `2.105.0` |
| Docker issue | `BLOCKED`: Docker CLI exists but daemon connection failed |
| local status blocked | `supabase status` was not run because Docker daemon preflight failed |
| syntax error | `BLOCKED`: migration was not applied |
| naming collision | `BLOCKED`: DB apply was not executed |
| constraint/index missing | `BLOCKED`: DB queries were not executed |
| destructive risk | Static check found no destructive statement |
| privacy risk | Static check supports intended model; full DB verification remains blocked |

## Next actions

Because the result is `BLOCKED`:

- Start or repair Docker Desktop so `docker info` can connect to the Docker Desktop Linux engine.
- Re-run this local-only retry batch from preflight.
- Do not use production or staging as a substitute for local verification.
- Do not run `supabase start` or `supabase db reset` until Docker and local-only status are confirmed.
- If Docker remains unavailable, split disposable Supabase project setup into a separate explicitly approved QA path.

Production/staging apply is still prohibited.

## Out of scope

- Migration changes.
- SQL patch writing.
- RLS SQL writing.
- Production/staging DB apply.
- Remote DB apply.
- Supabase SQL Editor execution.
- Edge Function changes.
- Frontend changes.
- Provider/live sending.
- Cron, env, or production configuration.
- Real user data import.
- Backfill.
- Account merge.
- Web Push subscription migration.
