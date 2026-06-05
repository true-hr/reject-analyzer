# Scheduler v2 RLS Expected State Decision

## Purpose

This document records the RLS expected-state decision for the scheduler v2 notification schema.

This is a decision document only. It does not write RLS SQL, create policies, enable or disable RLS, run DB queries, apply migrations, or change project/application settings.

## Prior documents

- PR #807 RLS state diagnosis document: `docs/scheduler-v2-disposable-rls-state-diagnosis-20260605.md`
- PR #807 merge commit: `504becfdb9b5f7a8f297d16ccf5340e3d0d15570`
- PR #805 object verification document: `docs/scheduler-v2-disposable-object-verification-result-20260605.md`
- PR #801 schema apply verification document: `docs/scheduler-v2-disposable-schema-apply-verification-result-20260605.md`

## Confirmed facts

From the prior merged documents:

- Object-level verification result: `PARTIAL_VERIFIED`.
- Required scheduler v2 table count: 10.
- RLS enabled table count: 10.
- RLS policy count: 0.
- The migration draft does not contain RLS enable SQL or policy SQL.
- The disposable DB has an `ensure_rls` event trigger and `public.rls_auto_enable` function.
- RLS state diagnosis result: `RLS_ENABLED_BY_PRIOR_ACTION`.

Read-only project visibility still showed both the existing `reject analyzer` project and the disposable project. Refs are recorded only as masked comparison context:

- Existing `reject analyzer` masked ref: `pq...sk`.
- Disposable project masked ref: `rk...hu`.
- Org/team masked: `nv...mk`.

No full project ref, key, token, DB password, service role key, anon key, provider secret, or real user data is recorded here.

## Core decisions

`RLS_EXPECTED_ENABLED`

Scheduler v2 notification schema tables are treated as sensitive-data tables. The expected state for staging and production is RLS enabled.

`DO_NOT_DEPEND_ON_ENSURE_RLS_TRIGGER`

Staging and production must not depend on the disposable DB's `ensure_rls` event trigger or `public.rls_auto_enable` behavior. That behavior is interpreted as disposable DB prior action or safety automation, not as the scheduler v2 migration contract.

`REQUIRE_EXPLICIT_RLS_ENABLE_MIGRATION`

RLS enabled state must be represented by explicit migration SQL in the scheduler v2 RLS migration path.

`REQUIRE_EXPLICIT_RLS_POLICY_MIGRATION`

RLS policies must be represented by explicit migration SQL in the scheduler v2 RLS migration path.

`POLICY_ZERO_IS_NOT_READY_FOR_CLIENT_USE`

RLS enabled with zero policies is not considered ready for client use. It can block anon/authenticated client access and must be handled before staging or production application.

## Table classification criteria

### Service role only candidates

- `contact_verifications`
- `notification_delivery_claims`
- `notification_delivery_logs`

Reasoning:

- These tables are verification, delivery, and audit surfaces.
- Direct client access is unnecessary or risky.
- They should be handled through service role or server-side workflows.

### Client read-summary candidates

- `persons`
- `account_identities`
- `contact_points`
- `notification_consents`
- `reminder_rules`
- `reminder_channels`
- `web_push_subscription_owners`

Constraints:

- Do not expose raw email, phone, provider user id, full destination, raw endpoint, `p256dh`, or auth values to clients.
- Prefer masked summary views or helper functions for client-readable state.
- Client write access is deferred.
- Initial policies should start from minimal read-only summary access.

## RLS policy draft direction

The next RLS SQL draft should use these boundaries:

- Service role can manage all scheduler v2 notification schema objects.
- Authenticated clients can read only rows connected to their own `person_id`.
- Contact, destination, and provider identity surfaces should prefer masked summary views or helper functions.
- Delivery claims and delivery logs should be service role only.
- Contact verifications should be service role only.
- Reminder settings should start as client read-only summary access; writes should be deferred to a separate endpoint or service-role workflow.
- Web Push ownership should remain separated from raw subscription details, and clients should only see a constrained current-device summary.

This section is not SQL. It is policy direction for the next draft PR.

## Next PR scope

The next PR is an RLS SQL migration draft only. It must not apply the migration.

Next PR goals:

- RLS enable SQL draft.
- RLS policy SQL draft.
- Helper function/view candidate draft.
- Service role and client read boundary definition.
- Disposable apply remains a separate PR and requires separate approval.

## Not done in this batch

- RLS SQL 작성 없음.
- RLS policy 작성 없음.
- RLS enable/disable 없음.
- DB query 실행 없음.
- DB write query 없음.
- Supabase SQL Editor 사용 없음.
- migration 수정/생성 없음.
- production/staging DB 접근 없음.
- 기존 `reject analyzer` project 변경 없음.
- env/secret 변경 없음.
- DB password 기록 없음.
- service role/anon key 저장 없음.
- Edge Function 수정 없음.
- frontend 수정 없음.
- provider/live 발송 없음.
- cron/production 설정 없음.

## Next steps

1. PR merge.
2. RLS SQL migration draft.
3. RLS SQL draft review.
4. disposable RLS apply verification approval.
5. disposable RLS apply verification.
6. staging apply plan.
7. staging apply verification.
8. production plan.
9. production explicit approval.
