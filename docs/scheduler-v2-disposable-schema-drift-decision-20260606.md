# Scheduler v2 Disposable Schema Drift Decision

## 1. Status

DECISION_DRAFT

## 2. Why this document exists

PR #814 changed the source migration `20260604000000_scheduler_v2_notification_schema.sql` after an earlier disposable apply verification had already applied migration version `20260604000000` to the disposable Supabase project.

This creates a disposable-only schema drift risk before any future RLS apply/verification.

## 3. Current situation

- Production/staging DB apply: not performed.
- Disposable DB schema apply: previously performed for migration version `20260604000000`.
- Source migration after PR #814: includes `account_identities.auth_user_id`.
- Disposable DB likely state: older version of `20260604000000`, likely without `account_identities.auth_user_id`.
- Therefore object-level verification from before PR #814 should not be treated as fully current for `account_identities`.

## 4. Important distinction

Production/staging are not drifted because scheduler v2 schema has not been applied there.

Only the disposable verification project may be out of sync with the updated source migration.

## 5. Decision options

### Option A - Reset/recreate disposable project and apply current source migration from scratch

Pros:

- Cleanest verification.
- `20260604000000` source and disposable object state match.
- Best before RLS apply verification.

Cons:

- Requires explicit user approval.
- Requires disposable-only DB reset/recreate/apply.
- Previous disposable verification history becomes historical, not current.

### Option B - Add a new additive migration to patch disposable from old schema to new schema

Pros:

- Avoids reset.
- Preserves migration history.

Cons:

- Production/staging have not applied base schema yet, so an additive patch may create unnecessary complexity.
- Source-of-truth gets split between original draft and patch.
- May be confusing before production rollout.

### Option C - Do nothing and proceed to RLS helper design

Rejected for now.

Reason:

- RLS helper/client policy design depends on `account_identities.auth_user_id`.
- Disposable verification would be misleading if disposable DB lacks that column.

## 6. Recommended decision

Recommend Option A as the cleanest next verification path, but do not execute it in this PR.

The next apply-related step should be a separately approved disposable-only reset/recreate/apply verification plan.

## 7. Required guardrails for any future disposable reset/reapply

- Must be disposable project only.
- Must confirm project ref is not production/staging.
- Must require explicit user approval.
- Must not touch production/staging.
- Must not store or print DB password, service role key, anon key, or access token.
- Must not use SQL Editor.
- Must document whether reset/recreate was used.
- Must verify current `account_identities.auth_user_id` exists after apply.
- Must verify active `auth_user_id` and active `(provider, provider_user_id)` indexes exist.

## 8. Impact on next work

Before disposable RLS apply verification:

1. Review this drift decision
2. Create disposable reset/reapply verification plan
3. Get explicit user approval
4. Recreate/apply current scheduler v2 schema on disposable
5. Run object-level verification again
6. Then continue to helper function/view design and client read-summary policy draft

## 9. Non-goals

- No DB apply.
- No DB query.
- No Supabase CLI apply/reset/start.
- No SQL migration changes.
- No RLS helper creation.
- No client policy creation.
- No production/staging access.
