# Scheduler v2 Settings Write RPC Fixture Verification

## 1. Status

APPLIED_VERIFIED

## 2. Target disposable project

- Project: `passmap-scheduler-v2-disposable-20260605`
- Masked ref: `rkfq...fbhu`
- Disposable-only confirmation: yes
- Non-disposable project observed separately: `reject analyzer`
- Production/staging touched: no

## 3. Fixture

Created in the disposable project only:

- auth user: created, masked id `f826...c6df`
- person: created, masked id `640c...874a`
- account identity: created with `provider = email`, `status = active`, `unlinked_at is null`
- provider subject: provider-specific test subject, masked as `email-fixture-sub-...`
- membership predicate: `account_identities.auth_user_id = auth.uid()`
- rejected membership shape: `provider_user_id = auth.uid()` was not used

No fixture password, token, full id, service role key, anon key, or access token is documented.

## 4. Migration/catalog state

- `20260604000000`: applied
- `20260605000000`: applied
- `20260606115936`: applied
- `get_current_person_notification_summary()`: exists
- `upsert_current_person_reminder_rule(scheduler_reminder_kind,scheduler_reminder_cadence,integer[],time without time zone,text,boolean,jsonb)`: exists
- `public` execute: revoked for both summary and write RPC
- `anon` execute: revoked for both summary and write RPC
- `authenticated` execute: granted for both summary and write RPC
- raw authenticated base table policy count for guarded scheduler v2 tables: `0`

## 5. RPC save verification

Authenticated context was simulated with `role authenticated` and a JWT `sub` matching the fixture auth user.

Payload:

```json
{
  "p_reminder_kind": "experience_recall",
  "p_cadence": "weekly",
  "p_days_of_week": [1, 2, 3, 4, 5],
  "p_time_local": "18:00",
  "p_timezone": "Asia/Seoul",
  "p_is_enabled": true,
  "p_channels": [
    {"channel": "web_push", "priority": 1, "is_enabled": true}
  ]
}
```

Result:

- RPC success: yes
- returned rule id: yes, masked `018e...d08e`
- `reminder_rules` row created: yes
- `reminder_channels` `web_push` row created: yes
- channel count after first save: `1`

## 6. Repeated call verification

Second call changed:

- `p_time_local`: `19:00`
- `p_is_enabled`: `false`

Result:

- RPC success: yes
- same logical rule id: yes
- duplicate logical rule count: `1`
- channel count after second save: `1`
- final rule state: `weekly`, `[1,2,3,4,5]`, `19:00`, `Asia/Seoul`, `is_enabled = false`
- final channel state: `web_push`, `priority = 1`, `is_enabled = true`, `fallback_to_channel = null`

## 7. Summary reflection

`get_current_person_notification_summary()` was called under the same authenticated fixture context.

Result:

- summary returned one row: yes
- provider summary reflected: yes
- saved reminder rule reflected: yes
- channel summary reflected: yes
- raw email exposed: no
- raw provider_user_id exposed: no
- raw auth_user_id exposed: no
- raw web push endpoint/p256dh/auth fields exposed: no

## 8. Issues found and patch

Found issue:

- `upsert_current_person_reminder_rule(...)` failed during the `reminder_channels` upsert because the `returns table(rule_id ...)` output parameter made `on conflict (rule_id, channel)` ambiguous inside PL/pgSQL.

Patch:

```sql
#variable_conflict use_column
```

This was added immediately after the function body opening `as $$` in `supabase/migrations/20260606115936_scheduler_v2_notification_settings_write_functions.sql`.

Disposable DB apply:

- Re-ran the patched SQL file with `supabase db query --linked -f ...` against the disposable project only.
- No production/staging DB was queried or modified.

## 9. Test/build result

- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSettingsRepository.test.js`: PASS
- `npm run build`: PASS

Build warnings observed:

- existing mixed JSON import attribute warnings for cert rules JSON imports
- existing dynamic/static import chunking warnings
- existing chunk size warnings above 500 kB

The first `npm run build` attempt timed out at 120 seconds; rerun with a longer timeout completed successfully.

## 10. Raw base table query guardrail

- raw scheduler v2 base table client query grep in `src`: PASS, no guarded `.from(...)` matches
- SQL safety grep matched only existing warning comments:
  - `Do not use account_identities.provider_user_id = auth.uid()::text for membership.`
  - no `authenticated_read_own` policy was added
  - no `create policy ... authenticated` raw base table policy was added

## 11. Secrets handling

- No DB password was printed, stored, or documented.
- No service role key was printed, stored, or documented.
- No anon key was printed, stored, or documented.
- No access token was printed, stored, or documented.
- Fixture ids are recorded only in masked form.

## 12. Remaining gaps

- Disposable fixture rows remain in the disposable project for auditability.
- No production/staging promotion was attempted.

## 13. Next recommended step

Open a PR with the minimal PL/pgSQL ambiguity fix and this verification document, then review before any staging or production consideration.
