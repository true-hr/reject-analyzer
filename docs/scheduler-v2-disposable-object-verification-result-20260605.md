# Scheduler v2 Disposable Object Verification Result

## Purpose

This document records the object-level verification result for the scheduler v2 notification schema migration applied to the disposable Supabase project.

The target was the disposable project `passmap-scheduler-v2-disposable-20260605` only. Production, staging, the existing `reject analyzer` project, Vercel, env/secrets, providers, Edge Functions, and frontend files were not changed.

## Prior documents

- PR #803 plan document: `docs/scheduler-v2-disposable-object-verification-plan-20260605.md`
- PR #803 merge commit: `497b1d70fd095a6794087e0e93a09df0a02f669a`
- PR #801 apply result document: `docs/scheduler-v2-disposable-schema-apply-verification-result-20260605.md`
- Migration draft: `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`

## Target project confirmation

| Field | Observation |
| --- | --- |
| Project name | `passmap-scheduler-v2-disposable-20260605` |
| Region | `Northeast Asia (Seoul)` / `ap-northeast-2` |
| Project ref masked | `rk...hu` |
| Org/team masked | `nv...mk` |
| Existing `reject analyzer` masked ref | `pq...sk` |
| Disposable ref differs from existing project ref | Yes |
| Linked project | Disposable project, masked `rk...hu` |
| Full ref/key/password/token recorded | No |

`supabase migration list --linked` showed Local and Remote both at `20260604000000`.

## Password handling

`NO_PASSWORD_REQUIRED`

DB password was not required for the successful object-level catalog checks, which were executed through the Supabase connector against the disposable project only.

- DB password was not recorded in chat, this document, command arguments, env vars, files, or logs.
- Claude/Codex did not generate, enter, store, print, or record the DB password.
- No service role key, anon key, access token, provider secret, or full project ref is recorded here.

## Verification summary

### Enum/type verification

| Field | Result |
| --- | --- |
| Expected enum/type count | 14 |
| Found required enum/type count | 14 |
| Missing enum/type list | none |
| Extra `scheduler_%` enum/type list | none |

Required enum/types verified:

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

### Table verification

| Field | Result |
| --- | --- |
| Expected table count | 10 |
| Found required table count | 10 |
| Missing table list | none |

Required tables verified:

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

### Columns / pk / fk / unique/index

| Check | Result |
| --- | --- |
| Expected required columns | 98 |
| Found required columns | 98 |
| Missing required columns | none |
| Primary key constraints on required tables | 10 |
| Foreign key constraints on required tables | 15 |
| Expected named indexes from migration draft | 24 |
| Found named indexes | 24 |
| Missing named indexes | none |
| Unique/index candidates found | 5 |
| Delivery claim idempotency indexes | 2 |

Delivery claim idempotency checks found:

- `notification_delivery_claims_claim_key_key`
- `notification_delivery_claims_rule_channel_slot_key`

### Web Push data minimization

`web_push_subscription_owners` is centered on `endpoint_hash`.

No raw Web Push subscription detail columns were found on `web_push_subscription_owners`:

- `endpoint`: not found
- `p256dh`: not found
- `auth`: not found

This confirms the object shape does not store raw endpoint/p256dh/auth values in the scheduler v2 ownership table. No real user data query was performed.

### RLS / policy / trigger / function / backfill

| Check | Result |
| --- | --- |
| Required tables with RLS enabled | 10 |
| Required tables with RLS enabled list | `account_identities`, `contact_points`, `contact_verifications`, `notification_consents`, `notification_delivery_claims`, `notification_delivery_logs`, `persons`, `reminder_channels`, `reminder_rules`, `web_push_subscription_owners` |
| RLS policy count on required tables | 0 |
| User trigger count on required tables | 0 |
| `scheduler_%` function count in `public` | 0 |
| Backfill object/procedure observed | No |

The local migration draft does not contain `ALTER TABLE`, `ENABLE ROW LEVEL SECURITY`, or `CREATE POLICY` text. However, the disposable DB catalog shows RLS enabled on all 10 required tables and no policies. This batch does not attribute the source of that RLS state. Because the plan expected confirmation that RLS was not enabled by this migration, this result is marked `PARTIAL_VERIFIED` rather than `OBJECT_VERIFIED`.

No data-level backfill check was performed, and no real user data was queried. Object-level checks found no scheduler v2 triggers or functions and no raw subscription detail columns in `web_push_subscription_owners`.

## Result status

`PARTIAL_VERIFIED`

Required enum/type, table, column, PK, FK, named index, delivery claim idempotency, Web Push endpoint-hash shape, no-policy, no-trigger, and no-function checks were verified.

The result is partial because RLS is enabled on all 10 required tables in the disposable DB catalog, while the migration draft does not include RLS enable SQL and the plan expected RLS not to be enabled by this migration. This requires follow-up before any RLS SQL draft or staging plan.

## Not done in this batch

- production/staging DB 접근 없음.
- 기존 `reject analyzer` project 변경 없음.
- Supabase SQL Editor 사용 없음.
- DB write query 없음.
- RLS SQL 작성 없음.
- migration 수정/생성 없음.
- env/secret 변경 없음.
- DB password 기록 없음.
- service role/anon key 저장 없음.
- Edge Function 수정 없음.
- frontend 수정 없음.
- provider/live 발송 없음.
- cron/production 설정 없음.

## Next steps

1. Review this object-level verification result.
2. Investigate why RLS is enabled on the disposable scheduler v2 tables before drafting RLS SQL.
3. RLS SQL migration draft, only after the RLS source/status is understood.
4. Disposable RLS apply verification.
5. staging apply plan.
6. staging apply verification.
7. production apply plan.
8. production explicit approval.
9. production apply.
