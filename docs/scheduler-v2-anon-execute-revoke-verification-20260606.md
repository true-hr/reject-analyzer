# Scheduler v2 Anon Execute Revoke Verification

## 1. Status

APPLIED_VERIFIED

## 2. Target

- Project: passmap-scheduler-v2-disposable-20260605
- Masked ref: rkfq...fbhu
- Confirmed disposable only: yes
- Production/staging touched: no

## 3. Change

- Functions:
  - `public.current_person_ids()`
  - `public.is_member_of_person(uuid)`
  - `public.get_current_person_notification_summary()`
- anon execute: explicitly revoked in the SQL draft and corrected on the disposable project
- authenticated execute: retained
- public execute: remains revoked

## 4. Verification

- current_person_ids anon execute: false
- is_member_of_person anon execute: false
- get_current_person_notification_summary anon execute: false
- authenticated execute retained: true for all three functions
- base table authenticated direct policy count: 0

## 5. Execution path

- Option used: Option B - disposable-only manual grant correction via SQL execution
- Reason: `20260605000000` was already applied on disposable, so editing the source migration alone would not change the current disposable grant state. A reset/reapply was unnecessary for this narrow grant correction, and the target project was confirmed as disposable before execution.

## 6. Secrets handling

No DB password, service role key, anon key, or access token was printed, stored, or documented.

## 7. Remaining gaps

- Production/staging were not verified or modified.
- Future production rollout must include the updated migration source with explicit `anon` revokes before any production/staging apply approval.

## 8. Next recommended step

Review this PR, then continue scheduler v2 client integration using only the authenticated summary RPC path after merge.
