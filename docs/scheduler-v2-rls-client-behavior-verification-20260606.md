# Scheduler v2 RLS Client Behavior Verification

## 1. Status

PARTIAL

## 2. Baseline

- PR #824 merged: yes, `c3def2ef84de93c7e2899d19fd34cb57260fd025`
- Disposable RLS apply status: `20260604000000` and `20260605000000` applied on disposable project
- Summary function: `public.get_current_person_notification_summary()` exists

## 3. Catalog/behavior verification

- authenticated execute grant: yes for `get_current_person_notification_summary()`
- public execute revoked: yes
- authenticated base table direct policies: 0
- raw table read policy: no authenticated direct read policies observed for `persons`, `account_identities`, `contact_points`, `notification_consents`, `reminder_rules`, `reminder_channels`, or `web_push_subscription_owners`
- behavior test scope: catalog-level verification only; no real authenticated user session, client REST call, test data insert, account creation, or backfill was performed

Additional finding:

- `anon` execute grant was observed on `current_person_ids()`, `is_member_of_person(uuid)`, and `get_current_person_notification_summary()`.
- Because unauthenticated execution is not the intended client boundary, this verification is marked `PARTIAL` even though raw base table direct read policies remain closed.

Follow-up:

- `anon` execute grant was addressed by the follow-up migration draft/update in `20260605000000_scheduler_v2_rls_policies.sql`.
- Disposable verification result is recorded in `docs/scheduler-v2-anon-execute-revoke-verification-20260606.md`.

## 4. Client integration prep

- repository wrapper: `src/lib/schedulerV2NotificationSummaryRepository.js`
- RPC used: `.rpc('get_current_person_notification_summary')`
- raw base table query used: no
- UI connected: no

## 5. Test result

- Command: `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- Result: pass
- Coverage:
  - calls `rpc('get_current_person_notification_summary')`
  - returns data arrays
  - returns `[]` for null data
  - throws RPC errors
  - does not use raw base table `.from(...)` queries

## 6. What was not done

- no production/staging access
- no DB apply
- no test user creation
- no data insert/backfill
- no UI integration
- no provider/live send

## 7. Remaining gaps

- Review whether `anon` execute should be revoked from scheduler v2 helper and summary functions.
- After grant adjustment, rerun disposable catalog verification.
- Real authenticated client behavior still needs a separate session-based verification path.
- Future UI work should consume only the repository wrapper and should not add raw scheduler v2 base table queries.

## 8. Next recommended step

Create a narrowly scoped SQL draft to revoke `anon` execute from scheduler v2 helper and summary functions, then verify the disposable catalog state again before wiring the notification settings UI.
