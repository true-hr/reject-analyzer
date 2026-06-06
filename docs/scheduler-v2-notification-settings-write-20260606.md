# Scheduler v2 Notification Settings Write Path

## 1. Status

DRAFT_IMPLEMENTED

## 2. Scope

- Adds a scheduler v2 reminder-rule write RPC draft.
- Adds a frontend RPC-only repository wrapper.
- Wires a minimal scheduler v2 save action into `ReminderSettingsPanel`.
- Keeps existing weekly reminder and Web Push controls separate.

## 3. SQL draft

- migration: `supabase/migrations/20260606115936_scheduler_v2_notification_settings_write_functions.sql`
- function: `public.upsert_current_person_reminder_rule(...)`
- security: `security definer`, `search_path = public, pg_temp`, requires `auth.uid()`, resolves membership only through `current_person_ids()`
- grants: revokes from `public` and `anon`; grants execute to `authenticated`
- direct table policies: no raw authenticated client base-table policy added

## 4. Frontend repository

- file: `src/lib/schedulerV2NotificationSettingsRepository.js`
- RPC: `upsert_current_person_reminder_rule`
- raw table query: none; wrapper calls `supabaseClient.rpc(...)` only

## 5. UI integration

- location: `src/components/reminder/ReminderSettingsPanel.jsx`, scheduler v2 summary preview section
- save action: separate `Scheduler v2 save` button calls the write RPC with the current weekly reminder draft
- loading/success/error: separate scheduler v2 save status and message; existing weekly reminder/Web Push state remains separate
- summary reload: not wired in this draft; users can refresh/reopen after the RPC is deployed and verified

## 6. Test/build result

- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSettingsRepository.test.js`: PASS
- `npm run build`: PASS with existing Vite warnings for mixed JSON import attributes, dynamic/static imports sharing chunks, and chunks larger than 500 kB
- raw base table query grep: PASS, no guarded `.from(...)` matches in `src`
- SQL safety grep: PASS, no `provider_user_id = auth.uid`, `authenticated_read_own`, or authenticated policy creation in this migration

## 7. What was not done

- no production/staging apply
- no SQL Editor
- no env/secret changes
- no provider/live send
- no cron change
- no account merge/backfill
- no raw base table client policy

## 8. Remaining gaps

- RPC draft still needs disposable/local DB apply verification before any shared environment rollout.
- The write function intentionally raises `AMBIGUOUS_PERSON` when multiple active persons are linked to the current user.
- The write function intentionally raises `AMBIGUOUS_REMINDER_RULE` when multiple active non-deleted rules exist for the same person/reminder kind.
- Omitted channels are left untouched; provided channels are upserted by `(rule_id, channel)`.

## 9. Next recommended step

Apply this migration only to an approved disposable/non-production database, verify the RPC with an authenticated disposable session, then decide whether channel replacement semantics should disable omitted channels or continue preserving them.
