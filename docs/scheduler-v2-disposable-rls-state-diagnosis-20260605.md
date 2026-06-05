# Scheduler v2 Disposable RLS State Diagnosis

## Purpose

This document records a read-only diagnosis of why the scheduler v2 required tables in the disposable Supabase DB have RLS enabled while policy count is 0.

This batch does not write RLS SQL, create policies, enable or disable RLS, apply migrations, or change any database/application settings.

## Prior documents

- PR #805 object verification result document: `docs/scheduler-v2-disposable-object-verification-result-20260605.md`
- PR #805 merge commit: `c7d22b562ab69aef56ee4058aee4b514ec34d1ef`
- PR #801 schema apply verification result document: `docs/scheduler-v2-disposable-schema-apply-verification-result-20260605.md`
- Migration draft: `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`

## Current confirmed state

| Field | Observation |
| --- | --- |
| Object-level result from PR #805 | `PARTIAL_VERIFIED` |
| Required scheduler v2 table count | 10 |
| RLS enabled table count | 10 |
| RLS policy count | 0 |
| Force RLS enabled table count | 0 |
| Trigger/function/backfill from PR #805 | No scheduler v2 user trigger/function/backfill observed |
| Enum/table/index/constraint status from PR #805 | Mostly verified |
| Target project | `passmap-scheduler-v2-disposable-20260605` |
| Target region | `Northeast Asia (Seoul)` / `ap-northeast-2` |
| Target masked ref | `rk...hu` |
| Existing `reject analyzer` masked ref | `pq...sk` |
| Org/team masked | `nv...mk` |

No full project ref, key, token, DB password, service role key, anon key, provider secret, or real user data is recorded here.

## Migration draft text check

Text search against `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql` found no matches for:

- `ENABLE ROW LEVEL SECURITY`
- `FORCE ROW LEVEL SECURITY`
- `CREATE POLICY`
- RLS-related `ALTER TABLE`

The migration draft text check therefore does not support `RLS_ENABLED_BY_MIGRATION`.

## DB catalog check

Read-only catalog checks were run against the disposable project only.

Required table RLS state:

| Table | RLS enabled | Force RLS |
| --- | --- | --- |
| `account_identities` | true | false |
| `contact_points` | true | false |
| `contact_verifications` | true | false |
| `notification_consents` | true | false |
| `notification_delivery_claims` | true | false |
| `notification_delivery_logs` | true | false |
| `persons` | true | false |
| `reminder_channels` | true | false |
| `reminder_rules` | true | false |
| `web_push_subscription_owners` | true | false |

Policy metadata:

| Field | Observation |
| --- | --- |
| Policy count on required tables | 0 |
| Policy names | none |

Non-secret owner/role metadata:

| Field | Observation |
| --- | --- |
| Distinct table owner for required tables | `postgres` |

Event trigger metadata:

| Field | Observation |
| --- | --- |
| Event trigger count | 7 |
| RLS-related event trigger observed | `ensure_rls` |
| `ensure_rls` event | `ddl_command_end` |
| `ensure_rls` enabled state | `O` |
| `ensure_rls` function | `public.rls_auto_enable` |

Catalog checks can show that `ensure_rls` exists and is enabled, but they do not prove who installed it or exactly when it was installed.

## Diagnosis result

`RLS_ENABLED_BY_PRIOR_ACTION`

Rationale:

- The scheduler v2 migration draft contains no RLS enable SQL and no policy SQL.
- The disposable DB catalog shows all 10 required scheduler v2 tables have RLS enabled.
- The disposable DB catalog shows policy count is 0.
- The disposable DB catalog shows an enabled `ddl_command_end` event trigger named `ensure_rls` calling `public.rls_auto_enable`.
- That event trigger is a plausible mechanism for automatic RLS enablement when tables were created by the migration.

This diagnosis does not identify whether the prior action was a Supabase platform/default/template mechanism, Dashboard-side one-click setup, or another earlier disposable DB action. It only establishes that the RLS enabled state is not explained by the scheduler v2 migration draft text itself and is plausibly explained by a pre-existing DB-level event trigger.

## Interpretation

When RLS is enabled and policy count is 0, client access through anon/authenticated paths is likely blocked by default.

This state must be handled intentionally before any staging or production application. It is not safe to assume the schema is ready for app use until RLS policy intent is explicitly designed and verified.

This batch does not write RLS SQL and does not enable, disable, or correct RLS state.

The next step should branch based on this diagnosis:

- If `ensure_rls` is intended for disposable DB safety, continue to an RLS policy draft that assumes RLS is enabled.
- If `ensure_rls` is not intended for staging/production, document the expected RLS state separately before staging planning.
- In either case, do not proceed directly to staging or production.

## Not done in this batch

- RLS SQL 작성 없음.
- RLS policy 작성 없음.
- RLS enable/disable 없음.
- DB write query 없음.
- Supabase SQL Editor 사용 없음.
- production/staging DB 접근 없음.
- 기존 `reject analyzer` project 변경 없음.
- migration 수정/생성 없음.
- env/secret 변경 없음.
- DB password 기록 없음.
- service role/anon key 저장 없음.
- Edge Function 수정 없음.
- frontend 수정 없음.
- provider/live 발송 없음.
- cron/production 설정 없음.

## Next steps

1. Review this RLS state diagnosis.
2. Decide whether the disposable DB `ensure_rls` behavior should be treated as intended baseline behavior or disposable-only safety automation.
3. If intended, write an RLS policy draft in a separate PR.
4. If not intended, write an RLS state correction or expected-state plan before staging.
5. Run disposable RLS apply verification only after a separate explicit approval.
6. Prepare staging apply plan only after disposable RLS behavior is understood.
7. Do not proceed to staging/production without RLS policy/state planning first.
