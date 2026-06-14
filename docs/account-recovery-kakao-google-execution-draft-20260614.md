# Account Recovery Kakao Google Execution Draft

Date: 2026-06-14

Status: draft only. Do not execute without explicit production approval.

Related plan: `docs/account-recovery-kakao-google-merge-plan-20260614.md`

## Purpose

This document is a production execution draft for safely moving PASSMAP data
owned by `source_candidate_4` into `target_google_link_target` and the target
scheduler v2 person.

The current recovery decision is `MERGE_BLOCKED_BY_AUTH_IDENTITY_RELEASE`.
The data transfer must be reviewed and approved separately from any Auth
identity release action.

## Confirmed Preconditions

- PR #891 has been merged into `main`.
- `source_candidate_4` is the Kakao direct-login source account.
- `target_google_link_target` is the Google login target account.
- Source PASSMAP user-scoped data: 86 rows.
- Target user-scoped data: 263 rows.
- Target scheduler v2 person-scoped data: 2 rows.
- Source Storage ownership: 0 rows and 0 objects.
- Target Storage ownership: 0 rows and 0 objects.
- Google login plus Kakao account linking currently fails with
  `identity_already_exists`.
- Source Auth user deletion is high risk until cascade safety is rechecked.

## Hard Execution Prohibitions

Until a separate production approval is granted:

- Do not run DML.
- Do not run DB migration or apply commands.
- Do not delete any Auth user.
- Do not unlink or release any Auth identity.
- Do not run account merge or backfill jobs.
- Do not use SQL Editor.
- Do not change provider, environment, or secret configuration.
- Do not send live Kakao, SMS, or push messages.
- Do not print raw user identifiers, provider subjects, contact values, tokens,
  or secrets in reports.
- Report source and target only by alias.

## Placeholder Binding Rules

All SQL below is draft SQL. It is intentionally written with placeholders.
No raw identifiers are allowed in this document.

Execution, if approved later, must bind these values outside the document:

| Placeholder | Meaning |
| --- | --- |
| `:source_auth_user_id` | Auth user UUID for `source_candidate_4` |
| `:target_auth_user_id` | Auth user UUID for `target_google_link_target` |
| `:source_person_id` | Scheduler v2 person UUID linked to source |
| `:target_person_id` | Scheduler v2 person UUID linked to target |
| `:source_auth_user_id_text` | Text form of source Auth user UUID for text-keyed tables |
| `:target_auth_user_id_text` | Text form of target Auth user UUID for text-keyed tables |

The placeholders must be resolved from a controlled alias map immediately before
approved execution. Do not paste raw values into tickets, docs, chat, logs, or
review comments.

## Before Snapshot Query Draft

Run only as read-only verification in an approved admin context. SQL Editor is
not allowed.

```sql
-- DRAFT ONLY. Read-only snapshot. Do not run without approval.
with params as (
  select
    :source_auth_user_id::uuid as source_user_id,
    :target_auth_user_id::uuid as target_user_id,
    :source_auth_user_id_text::text as source_user_id_text,
    :target_auth_user_id_text::text as target_user_id_text,
    :source_person_id::uuid as source_person_id,
    :target_person_id::uuid as target_person_id
),
user_counts as (
  select 'work_records' as table_name, 'source' as owner_alias, count(*)::bigint as row_count
  from public.work_records, params
  where user_id = params.source_user_id
  union all
  select 'work_records', 'target', count(*)::bigint
  from public.work_records, params
  where user_id = params.target_user_id
  union all
  select 'raw_sources', 'source', count(*)::bigint
  from public.raw_sources, params
  where user_id = params.source_user_id
  union all
  select 'raw_sources', 'target', count(*)::bigint
  from public.raw_sources, params
  where user_id = params.target_user_id
  union all
  select 'experience_cards', 'source', count(*)::bigint
  from public.experience_cards, params
  where user_id = params.source_user_id
  union all
  select 'experience_cards', 'target', count(*)::bigint
  from public.experience_cards, params
  where user_id = params.target_user_id
  union all
  select 'experience_evidence', 'source', count(*)::bigint
  from public.experience_evidence, params
  where user_id = params.source_user_id
  union all
  select 'experience_evidence', 'target', count(*)::bigint
  from public.experience_evidence, params
  where user_id = params.target_user_id
  union all
  select 'resume_profiles', 'source', count(*)::bigint
  from public.resume_profiles, params
  where user_id = params.source_user_id
  union all
  select 'resume_profiles', 'target', count(*)::bigint
  from public.resume_profiles, params
  where user_id = params.target_user_id
  union all
  select 'analysis_inputs', 'source', count(*)::bigint
  from public.analysis_inputs, params
  where user_id = params.source_user_id_text
  union all
  select 'analysis_inputs', 'target', count(*)::bigint
  from public.analysis_inputs, params
  where user_id = params.target_user_id_text
  union all
  select 'analysis_runs', 'source', count(*)::bigint
  from public.analysis_runs, params
  where user_id = params.source_user_id_text
  union all
  select 'analysis_runs', 'target', count(*)::bigint
  from public.analysis_runs, params
  where user_id = params.target_user_id_text
  union all
  select 'reminder_preferences', 'source', count(*)::bigint
  from public.reminder_preferences, params
  where user_id = params.source_user_id
  union all
  select 'reminder_preferences', 'target', count(*)::bigint
  from public.reminder_preferences, params
  where user_id = params.target_user_id
  union all
  select 'reminder_deliveries', 'source', count(*)::bigint
  from public.reminder_deliveries, params
  where user_id = params.source_user_id
  union all
  select 'reminder_deliveries', 'target', count(*)::bigint
  from public.reminder_deliveries, params
  where user_id = params.target_user_id
  union all
  select 'push_subscriptions', 'source', count(*)::bigint
  from public.push_subscriptions, params
  where user_id = params.source_user_id
  union all
  select 'push_subscriptions', 'target', count(*)::bigint
  from public.push_subscriptions, params
  where user_id = params.target_user_id
)
select *
from user_counts
order by table_name, owner_alias;
```

Expected before snapshot:

- Source user-scoped total remains 86.
- Target user-scoped total remains 263.
- Target person-scoped total remains 2.
- Storage ownership remains 0 for source and target.

### Overlap Count Snapshot

```sql
-- DRAFT ONLY. Read-only overlap snapshot. Do not run without approval.
with params as (
  select
    :source_auth_user_id::uuid as source_user_id,
    :target_auth_user_id::uuid as target_user_id
),
preference_overlap as (
  select count(*)::bigint as row_count
  from public.reminder_preferences source_row
  join public.reminder_preferences target_row
    on target_row.user_id = (select target_user_id from params)
   and target_row.reminder_type = source_row.reminder_type
  where source_row.user_id = (select source_user_id from params)
),
delivery_overlap as (
  select count(*)::bigint as row_count
  from public.reminder_deliveries source_row
  join public.reminder_deliveries target_row
    on target_row.user_id = (select target_user_id from params)
   and target_row.reminder_type = source_row.reminder_type
   and target_row.delivery_channel = source_row.delivery_channel
   and target_row.week_start_local = source_row.week_start_local
  where source_row.user_id = (select source_user_id from params)
),
push_endpoint_overlap as (
  select count(*)::bigint as row_count
  from public.push_subscriptions source_row
  join public.push_subscriptions target_row
    on target_row.endpoint = source_row.endpoint
   and target_row.user_id = (select target_user_id from params)
  where source_row.user_id = (select source_user_id from params)
)
select 'reminder_preferences_overlap' as check_name, row_count
from preference_overlap
union all
select 'reminder_deliveries_overlap', row_count
from delivery_overlap
union all
select 'push_subscriptions_endpoint_overlap', row_count
from push_endpoint_overlap;
```

Expected overlap snapshot:

- `reminder_preferences_overlap`: 1.
- `reminder_deliveries_overlap`: 3.
- `push_subscriptions_endpoint_overlap`: 0.

### Storage Ownership Snapshot

```sql
-- DRAFT ONLY. Read-only Storage ownership snapshot. Do not run without approval.
with params as (
  select
    :source_auth_user_id::uuid as source_user_id,
    :target_auth_user_id::uuid as target_user_id
)
select 'storage.objects' as table_name, 'source' as owner_alias, count(*)::bigint as row_count
from storage.objects, params
where owner = params.source_user_id
union all
select 'storage.objects', 'target', count(*)::bigint
from storage.objects, params
where owner = params.target_user_id;
```

Expected storage snapshot:

- Source Storage ownership count: 0.
- Target Storage ownership count: 0.

### Scheduler V2 Person And Account Identity Snapshot

Do not print provider subject, contact values, or raw identifiers. Report only
alias-level counts and status summaries.

```sql
-- DRAFT ONLY. Read-only scheduler v2 snapshot. Do not run without approval.
with params as (
  select
    :source_auth_user_id::uuid as source_user_id,
    :target_auth_user_id::uuid as target_user_id,
    :source_person_id::uuid as source_person_id,
    :target_person_id::uuid as target_person_id
),
identity_summary as (
  select
    case
      when ai.auth_user_id = params.source_user_id then 'source'
      when ai.auth_user_id = params.target_user_id then 'target'
      else 'unexpected'
    end as owner_alias,
    ai.provider::text as provider,
    ai.status::text as status,
    count(*)::bigint as row_count
  from public.account_identities ai
  cross join params
  where ai.auth_user_id in (params.source_user_id, params.target_user_id)
     or ai.person_id in (params.source_person_id, params.target_person_id)
  group by 1, 2, 3
),
person_summary as (
  select
    case
      when p.id = params.source_person_id then 'source_person'
      when p.id = params.target_person_id then 'target_person'
      else 'unexpected'
    end as person_alias,
    p.status::text as status,
    count(*)::bigint as row_count
  from public.persons p
  cross join params
  where p.id in (params.source_person_id, params.target_person_id)
  group by 1, 2
)
select 'account_identities' as object_name, owner_alias as alias, provider, status, row_count
from identity_summary
union all
select 'persons', person_alias, null, status, row_count
from person_summary
order by object_name, alias, provider, status;
```

Expected scheduler snapshot:

- Source and target each have one active account identity.
- Source and target each have one linked scheduler v2 person.
- Raw provider subject must not be copied or printed.

## Transfer Transaction Draft

This section is executable-shaped SQL for review only. Do not run it from this
document. Do not run it through SQL Editor. Do not convert it into a migration.

### Ordering Notes

- Use one transaction.
- Take an advisory lock scoped to this recovery operation.
- Recheck before counts inside the transaction.
- Move child rows and denormalized owner columns before relying on target reads.
- Preserve target duplicates in reminder tables.
- Move source non-duplicate rows only.
- Do not mutate scheduler v2 `account_identities` during the general data
  transfer.
- Do not copy raw provider subject from source to target.
- Triggers may update `updated_at`.
- RLS is enabled on the affected tables; execution requires an approved admin
  path that is not SQL Editor.

```sql
-- DRAFT ONLY. Do not execute without explicit production approval.
begin;

select pg_advisory_xact_lock(hashtext('account-recovery-kakao-google-20260614'));

with params as (
  select
    :source_auth_user_id::uuid as source_user_id,
    :target_auth_user_id::uuid as target_user_id,
    :source_auth_user_id_text::text as source_user_id_text,
    :target_auth_user_id_text::text as target_user_id_text
),
before_guard as (
  select
    (select count(*) from public.reminder_preferences rp, params p
      where rp.user_id = p.source_user_id) as source_preference_count,
    (select count(*) from public.reminder_deliveries rd, params p
      where rd.user_id = p.source_user_id) as source_delivery_count,
    (select count(*) from public.push_subscriptions ps, params p
      where ps.user_id = p.source_user_id) as source_push_count,
    (select count(*) from storage.objects so, params p
      where so.owner in (p.source_user_id, p.target_user_id)) as storage_owner_count
)
select *
from before_guard;

-- Abort manually if:
-- - source_preference_count is not 1
-- - source_delivery_count is not 5
-- - source_push_count is not 1
-- - storage_owner_count is not 0

with params as (
  select
    :source_auth_user_id::uuid as source_user_id,
    :target_auth_user_id::uuid as target_user_id,
    :source_auth_user_id_text::text as source_user_id_text,
    :target_auth_user_id_text::text as target_user_id_text
),
skipped_reminder_preferences as (
  select source_row.id
  from public.reminder_preferences source_row
  where source_row.user_id = (select source_user_id from params)
    and exists (
      select 1
      from public.reminder_preferences target_row
      where target_row.user_id = (select target_user_id from params)
        and target_row.reminder_type = source_row.reminder_type
    )
),
skipped_reminder_deliveries as (
  select source_row.id
  from public.reminder_deliveries source_row
  where source_row.user_id = (select source_user_id from params)
    and exists (
      select 1
      from public.reminder_deliveries target_row
      where target_row.user_id = (select target_user_id from params)
        and target_row.reminder_type = source_row.reminder_type
        and target_row.delivery_channel = source_row.delivery_channel
        and target_row.week_start_local = source_row.week_start_local
    )
),
updated_work_records as (
  update public.work_records row_to_move
     set user_id = (select target_user_id from params)
   where row_to_move.user_id = (select source_user_id from params)
  returning id
),
updated_raw_sources as (
  update public.raw_sources row_to_move
     set user_id = (select target_user_id from params)
   where row_to_move.user_id = (select source_user_id from params)
  returning id
),
updated_experience_cards as (
  update public.experience_cards row_to_move
     set user_id = (select target_user_id from params)
   where row_to_move.user_id = (select source_user_id from params)
  returning id
),
updated_experience_evidence as (
  update public.experience_evidence row_to_move
     set user_id = (select target_user_id from params)
   where row_to_move.user_id = (select source_user_id from params)
  returning id
),
updated_resume_profiles as (
  update public.resume_profiles row_to_move
     set user_id = (select target_user_id from params)
   where row_to_move.user_id = (select source_user_id from params)
  returning id
),
updated_analysis_inputs as (
  update public.analysis_inputs row_to_move
     set user_id = (select target_user_id_text from params)
   where row_to_move.user_id = (select source_user_id_text from params)
  returning id
),
updated_analysis_runs as (
  update public.analysis_runs row_to_move
     set user_id = (select target_user_id_text from params)
   where row_to_move.user_id = (select source_user_id_text from params)
  returning id
),
updated_reminder_preferences as (
  update public.reminder_preferences row_to_move
     set user_id = (select target_user_id from params)
   where row_to_move.user_id = (select source_user_id from params)
     and not exists (
       select 1
       from skipped_reminder_preferences skipped
       where skipped.id = row_to_move.id
     )
  returning id
),
updated_reminder_deliveries as (
  update public.reminder_deliveries row_to_move
     set user_id = (select target_user_id from params)
   where row_to_move.user_id = (select source_user_id from params)
     and not exists (
       select 1
       from skipped_reminder_deliveries skipped
       where skipped.id = row_to_move.id
     )
  returning id
),
updated_push_subscriptions as (
  update public.push_subscriptions row_to_move
     set user_id = (select target_user_id from params)
   where row_to_move.user_id = (select source_user_id from params)
     and not exists (
       select 1
       from public.push_subscriptions target_row
       where target_row.user_id = (select target_user_id from params)
         and target_row.endpoint = row_to_move.endpoint
     )
  returning id
)
select 'work_records' as table_name, count(*)::bigint as moved_count from updated_work_records
union all
select 'raw_sources', count(*)::bigint from updated_raw_sources
union all
select 'experience_cards', count(*)::bigint from updated_experience_cards
union all
select 'experience_evidence', count(*)::bigint from updated_experience_evidence
union all
select 'resume_profiles', count(*)::bigint from updated_resume_profiles
union all
select 'analysis_inputs', count(*)::bigint from updated_analysis_inputs
union all
select 'analysis_runs', count(*)::bigint from updated_analysis_runs
union all
select 'reminder_preferences_moved', count(*)::bigint from updated_reminder_preferences
union all
select 'reminder_deliveries_moved', count(*)::bigint from updated_reminder_deliveries
union all
select 'push_subscriptions_moved', count(*)::bigint from updated_push_subscriptions;

-- Stop here for review while still inside the transaction.
-- Run the after verification draft in the same transaction.
-- Commit only if every expected count matches.
-- rollback;
-- commit;
```

## Overlap Handling Draft

### `reminder_preferences`

Policy:

- Keep the target row.
- Do not transfer the source duplicate row.
- Preserve the source duplicate in the snapshot/report.
- Expected skipped source duplicate count: 1.

Rationale:

- `reminder_preferences` is unique by `(user_id, reminder_type)`.
- The target setting reflects the currently active Google account state.
- Reassigning the source duplicate would create a unique conflict.

### `reminder_deliveries`

Policy:

- Keep target delivery rows.
- Do not transfer source duplicate delivery rows.
- Transfer only source non-duplicate delivery rows.
- Expected skipped source duplicate count: 3.

Rationale:

- `reminder_deliveries` is unique by
  `(user_id, reminder_type, delivery_channel, week_start_local)`.
- Target delivery history should remain authoritative for duplicate slots.
- Non-duplicate source history can move to the target account.

### `push_subscriptions`

Policy:

- If endpoint overlap remains 0, source push rows are transfer candidates.
- If endpoint overlap becomes non-zero, abort and re-decide.
- Do not send live push messages as part of this recovery.

## After Verification Query Draft

Run inside the same transaction before commit, then again after commit if the
transaction is approved and completed.

```sql
-- DRAFT ONLY. Read-only verification. Do not run without approval.
with params as (
  select
    :source_auth_user_id::uuid as source_user_id,
    :target_auth_user_id::uuid as target_user_id,
    :source_auth_user_id_text::text as source_user_id_text,
    :target_auth_user_id_text::text as target_user_id_text,
    :source_person_id::uuid as source_person_id,
    :target_person_id::uuid as target_person_id
),
source_remaining as (
  select 'work_records' as table_name, count(*)::bigint as row_count
  from public.work_records, params
  where user_id = params.source_user_id
  union all
  select 'raw_sources', count(*)::bigint
  from public.raw_sources, params
  where user_id = params.source_user_id
  union all
  select 'experience_cards', count(*)::bigint
  from public.experience_cards, params
  where user_id = params.source_user_id
  union all
  select 'experience_evidence', count(*)::bigint
  from public.experience_evidence, params
  where user_id = params.source_user_id
  union all
  select 'resume_profiles', count(*)::bigint
  from public.resume_profiles, params
  where user_id = params.source_user_id
  union all
  select 'analysis_inputs', count(*)::bigint
  from public.analysis_inputs, params
  where user_id = params.source_user_id_text
  union all
  select 'analysis_runs', count(*)::bigint
  from public.analysis_runs, params
  where user_id = params.source_user_id_text
  union all
  select 'reminder_preferences', count(*)::bigint
  from public.reminder_preferences, params
  where user_id = params.source_user_id
  union all
  select 'reminder_deliveries', count(*)::bigint
  from public.reminder_deliveries, params
  where user_id = params.source_user_id
  union all
  select 'push_subscriptions', count(*)::bigint
  from public.push_subscriptions, params
  where user_id = params.source_user_id
),
target_counts as (
  select 'work_records' as table_name, count(*)::bigint as row_count
  from public.work_records, params
  where user_id = params.target_user_id
  union all
  select 'raw_sources', count(*)::bigint
  from public.raw_sources, params
  where user_id = params.target_user_id
  union all
  select 'experience_cards', count(*)::bigint
  from public.experience_cards, params
  where user_id = params.target_user_id
  union all
  select 'experience_evidence', count(*)::bigint
  from public.experience_evidence, params
  where user_id = params.target_user_id
  union all
  select 'resume_profiles', count(*)::bigint
  from public.resume_profiles, params
  where user_id = params.target_user_id
  union all
  select 'analysis_inputs', count(*)::bigint
  from public.analysis_inputs, params
  where user_id = params.target_user_id_text
  union all
  select 'analysis_runs', count(*)::bigint
  from public.analysis_runs, params
  where user_id = params.target_user_id_text
  union all
  select 'reminder_preferences', count(*)::bigint
  from public.reminder_preferences, params
  where user_id = params.target_user_id
  union all
  select 'reminder_deliveries', count(*)::bigint
  from public.reminder_deliveries, params
  where user_id = params.target_user_id
  union all
  select 'push_subscriptions', count(*)::bigint
  from public.push_subscriptions, params
  where user_id = params.target_user_id
),
skipped_overlap as (
  select 'reminder_preferences_skipped' as check_name, count(*)::bigint as row_count
  from public.reminder_preferences source_row
  join public.reminder_preferences target_row
    on target_row.user_id = (select target_user_id from params)
   and target_row.reminder_type = source_row.reminder_type
  where source_row.user_id = (select source_user_id from params)
  union all
  select 'reminder_deliveries_skipped', count(*)::bigint
  from public.reminder_deliveries source_row
  join public.reminder_deliveries target_row
    on target_row.user_id = (select target_user_id from params)
   and target_row.reminder_type = source_row.reminder_type
   and target_row.delivery_channel = source_row.delivery_channel
   and target_row.week_start_local = source_row.week_start_local
  where source_row.user_id = (select source_user_id from params)
),
scheduler_summary as (
  select 'account_identities_active' as check_name, count(*)::bigint as row_count
  from public.account_identities, params
  where person_id = params.target_person_id
    and auth_user_id = params.target_user_id
    and status = 'active'
  union all
  select 'target_person_active', count(*)::bigint
  from public.persons, params
  where id = params.target_person_id
    and status = 'active'
)
select 'source_remaining' as section, table_name as name, row_count
from source_remaining
union all
select 'target_counts', table_name, row_count
from target_counts
union all
select 'skipped_overlap', check_name, row_count
from skipped_overlap
union all
select 'scheduler_summary', check_name, row_count
from scheduler_summary
order by section, name;
```

Expected after verification:

- Source remaining rows are limited to intentionally skipped duplicate
  `reminder_preferences` and `reminder_deliveries` rows, unless a table was
  explicitly approved to remain untouched.
- Target total equals before target count plus moved source rows, excluding
  skipped duplicate rows.
- `reminder_preferences_skipped` remains 1.
- `reminder_deliveries_skipped` remains 3.
- Push subscription source remaining count is 0 if endpoint overlap remains 0.
- Target scheduler v2 person remains active.
- Target Google account identity remains active.
- No Kakao identity is manually inserted or copied to target.

## Rollback And Abort Conditions

Abort before commit if any of these occur:

- Before count mismatch against the PR #891 plan.
- Unique conflict on any target table.
- Unexpected target duplicate in reminder preferences, reminder deliveries, or
  push subscription endpoints.
- Source rows are not transferred as expected.
- Source rows disappear instead of moving or remaining as approved skipped
  duplicates.
- Storage ownership count is not 0.
- Scheduler v2 source or target person state differs from the before snapshot.
- Any query would require printing raw identifiers or contact values to debug.
- Auth identity release path is unavailable or unclear.
- The operation requires SQL Editor, migration/apply, or provider configuration
  changes.

Rollback command, if still inside the transaction:

```sql
-- DRAFT ONLY. Use only inside the approved transaction context.
rollback;
```

If the transaction has already committed, stop. Do not run compensating DML
without a new reviewed rollback plan.

## Auth Identity Release Decision Gate

The general data transfer does not release the Kakao Auth identity.

Decision gate before identity release:

- Confirm whether Admin or Dashboard identity release is available without
  deleting the source Auth user.
- Prefer releasing the source Kakao Auth identity over deleting the source Auth
  user.
- Treat source Auth user deletion as the last candidate only.
- Before any source deletion candidate, recheck all public rows and cascade
  safety.
- Confirm source Storage ownership is still 0.
- Confirm target data transfer and skipped-overlap report have been archived.
- Confirm no source scheduler v2 identity cleanup is bundled with the general
  data transfer.

Recommended identity path:

1. Complete approved source general data transfer.
2. Confirm the source Kakao Auth identity release mechanism.
3. Retry Kakao `linkIdentity` while logged in as the target Google account.
4. Run `sync_current_person_auth_identities()` from the target session.
5. Verify target scheduler v2 person has the Kakao identity summary.
6. Keep source scheduler v2 person/account identity cleanup as a separate
   reviewed step.

## Final E2E Plan

Manual E2E must be performed only after approved data transfer and separately
approved Auth identity release.

1. Log in with Google as `target_google_link_target`.
2. Retry Kakao `linkIdentity`.
3. Complete the OAuth return path.
4. Confirm `sync_current_person_auth_identities()` runs for the target session.
5. Reload the account summary.
6. Confirm Kakao identity appears active in the target summary.
7. Confirm Alimtalk consent is not automatically granted.
8. Confirm `send_eligibility = not_ready`.
9. Confirm no live Kakao, SMS, or push message was sent by the test.

## Explicit Production Execution Approval Text

Use this exact approval sentence only after review is complete:

> source_candidate_4의 PASSMAP 데이터를 target_google_link_target으로 이전하고, reminder_preferences/reminder_deliveries 중복 row는 target 유지 및 source duplicate skip 정책으로 처리한 뒤, 별도 승인된 Auth identity release 절차를 진행하는 것을 승인합니다.

## Unresolved Decisions

- Which approved admin channel will execute the transaction, since SQL Editor is
  prohibited.
- Whether Auth identity release is available through Admin or Dashboard without
  deleting the source Auth user.
- Whether skipped source duplicate reminder rows should remain indefinitely,
  be reported only, or be cleaned up in a separate approved step.
- Whether source scheduler v2 person/account identity cleanup is needed after
  target identity linking succeeds.
- Who owns final manual E2E sign-off after the OAuth return path.

## Non-Execution Checklist

- This document is not a migration.
- This document does not execute SQL.
- This document does not contain raw identifier literals.
- This document does not change provider, environment, or secret settings.
- This document does not authorize live notification sends.
