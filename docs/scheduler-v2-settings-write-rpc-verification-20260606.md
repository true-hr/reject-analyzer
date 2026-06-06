# Scheduler v2 Settings Write RPC Verification

## 1. Status

PARTIAL_VERIFIED

## 2. Target

- Project: `passmap-scheduler-v2-disposable-20260605`
- Masked ref: `rkfq...fbhu`
- Confirmed disposable only: yes
- Production/staging touched: no

## 3. Migration state

- Before: `20260604000000` and `20260605000000` were applied; `20260606115936` was pending.
- Applied: `20260606115936_scheduler_v2_notification_settings_write_functions.sql` applied with `supabase db push` on the linked disposable project.
- After: migration apply command completed successfully; a follow-up `supabase migration list` timed out, so the remote migration table after-state was not re-read.

## 4. Function verification

- function exists: yes, catalog query returned `upsert_current_person_reminder_rule(scheduler_reminder_kind,scheduler_reminder_cadence,integer[],time without time zone,text,boolean,jsonb)`
- security definer: yes
- search_path: `public, pg_temp`
- public execute: not re-verified after apply because subsequent linked catalog queries timed out
- anon execute: revoked, catalog query returned `false`
- authenticated execute: granted, catalog query returned `true`

## 5. Policy/RLS boundary

- RLS enabled: not re-verified in this run because linked catalog queries timed out after initial function/grant checks
- service role policies: present; catalog query returned only `service_role_manage_*` policies for the scheduler v2 base tables
- authenticated base table read/write policies: no authenticated policies were returned in the policy listing
- authenticated_read_own: not re-verified by count because linked catalog queries timed out

## 6. Authenticated RPC save verification

- Path used: not completed
- Payload: intended payload was the requested weekly `experience_recall` payload with `web_push` channel
- RPC result: not completed
- reminder_rules result: not completed
- reminder_channels result: not completed
- summary reflection: not completed

Reason: no existing authenticated disposable session was available, and creating a new auth user was out of scope without stopping first. After migration apply, subsequent linked database queries also timed out repeatedly, so verification stopped rather than looping.

## 7. Failure/safety checks

- unauthenticated/anon execute: anon execute verified as `false`
- multiple active person behavior: SQL draft documents and raises `AMBIGUOUS_PERSON`; not exercised with data
- multiple active non-deleted rule behavior: SQL draft documents and raises `AMBIGUOUS_REMINDER_RULE`; not exercised with data
- safety predicate: source migration uses `current_person_ids()` and does not use `provider_user_id = auth.uid()`

## 8. Patch summary

- No SQL or repository patch was applied.
- Verification result was documented as partial because linked catalog/RPC queries timed out after the migration apply and initial function/grant checks.

## 9. Test/build result

- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSettingsRepository.test.js`: PASS
- `npm run build`: PASS with existing Vite warnings for mixed JSON import attributes, dynamic/static imports sharing chunks, and chunks larger than 500 kB

## 10. Data access guardrail

- raw scheduler v2 base table client query grep: PASS, no guarded `.from(...)` matches in `src`
- RPC/reference grep: PASS, expected RPC wrapper/function references found
- SQL safety grep: the full migration grep matched existing warning comments in earlier migrations; the new write RPC migration has no executable `provider_user_id = auth.uid`, `authenticated_read_own`, or authenticated policy creation pattern

## 11. Secrets handling

No DB password, service role key, anon key, or access token was printed, stored, or documented.

## 12. What was not done

- no production/staging apply
- no SQL Editor
- no env/secret changes
- no provider/live send
- no cron change
- no account merge/backfill
- no raw base table client policy

## 13. Remaining gaps

- Re-run linked migration list after Supabase linked query responsiveness recovers.
- Re-run RLS enabled count and `authenticated_read_own` count.
- Verify public execute privilege explicitly.
- Use an existing disposable authenticated session to call the RPC and verify `reminder_rules`, `reminder_channels`, repeated upsert behavior, and summary reflection.

## 14. Next recommended step

Use the already-linked disposable project and an existing disposable authenticated session to complete the RPC save verification once linked database queries are responding reliably.
