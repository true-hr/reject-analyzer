# Kakao Channel Capabilities Disposable Verification

## 1. Status

APPLIED_VERIFIED

## 2. Target

- Project: `passmap-scheduler-v2-disposable-20260605`
- Masked ref: `rkfq...fbhu`
- Confirmed disposable only: yes
- Production/staging touched: no

## 3. Migration state

- `20260604000000`: applied
- `20260605000000`: applied
- `20260606115936`: applied
- `20260612082650`: applied
- `20260612143000`: applied
- `20260612133209_notification_channel_capabilities.sql`: applied to disposable

Note: the CLI-generated migration timestamp was earlier than the current remote latest migration, so `supabase db push --linked --include-all` was used after dry-run confirmed the single pending migration.

## 4. Table / RLS / grants verification

- `public.notification_channel_capabilities` exists.
- RLS enabled: yes
- `public` direct select: revoked
- `anon` direct select: revoked and direct select denied
- `authenticated` direct select: revoked and direct select denied
- `service_role` select: available
- Policies: `service_role_manage_notification_channel_capabilities` only
- Authenticated base table policies: 0
- Table stores coarse readiness only: `channel`, `capability`, `status`, `reason`, `metadata`, timestamps
- Constraints verified by migration:
  - `capability in ('reminder_send')`
  - `status in ('ready', 'not_ready', 'blocked')`
  - `unique (channel, capability)`
  - `metadata` must be a JSON object

## 5. Summary function patch

- `public.get_current_person_notification_summary()` still returns the existing arrays:
  - `providers`
  - `contact_channels`
  - `consents`
  - `reminder_rules`
  - `web_push`
- Normalized `kakao` output remains present.
- `kakao.send_eligibility` now reads `notification_channel_capabilities` for `channel = 'kakao_alimtalk'` and `capability = 'reminder_send'`.
- Identity/contact/consent alone do not produce `ready`.
- Capability `reason` and `metadata` are not returned.
- Function verification:
  - language: `sql`
  - security definer: yes
  - search path: `public, pg_temp`
  - `public` execute: revoked
  - `anon` execute: revoked and denied
  - `authenticated` execute: granted

## 6. Capability state cases

Fixture:

- auth user masked: `c61a...2c83`
- person masked: `67fe...d83e`

Verified cases:

- no capability: `identity = active`, `contact = active`, `consent = granted`, `send_eligibility = not_ready`
- not_ready: `identity = active`, `contact = active`, `consent = granted`, `send_eligibility = not_ready`
- ready: `identity = active`, `contact = active`, `consent = granted`, `send_eligibility = ready`
- blocked: `identity = active`, `contact = active`, `consent = granted`, `send_eligibility = blocked`
- revoked consent: `identity = active`, `contact = active`, `consent = revoked`, `send_eligibility = blocked`

After verification, the fixture was restored to granted consent and the capability row was restored to `not_ready`.

## 7. Privacy checks

- Summary output did not expose capability `reason`.
- Summary output did not expose capability `metadata`.
- Summary output did not expose provider account details.
- Summary output did not expose template details.
- Summary output did not expose `provider_user_id`.
- Summary output did not expose `auth_user_id`.
- Summary output did not expose `destination_hash`.
- Summary output did not expose `value_normalized`.
- Summary output did not expose Web Push endpoint, `p256dh`, or auth secret.

## 8. Failure/safety checks

- `anon` direct table select denied.
- `authenticated` direct table select denied.
- `anon` summary function execute denied.
- `pg_policies` shows no authenticated base table policy for scheduler v2 tables, including `notification_channel_capabilities`.
- SQL safety grep found only existing warning comments and no unsafe implementation.
- No raw base table client policy was added.

## 9. Frontend helper compatibility

`deriveKakaoAlimtalkState(row)` compatibility verified:

- `send_eligibility = ready` -> `send_ready`
- `send_eligibility = blocked` -> `blocked`
- `send_eligibility = not_ready` -> `consent_ready` when identity/contact/consent are ready

Added a focused test for normalized `send_eligibility = blocked`.

## 10. Patch summary

- Added `public.notification_channel_capabilities`.
- Enabled RLS and added service-role-only management policy.
- Revoked direct table access from `public`, `anon`, and `authenticated`.
- Patched `get_current_person_notification_summary()` to compute Kakao `send_eligibility` from coarse capability readiness.
- Added frontend helper compatibility coverage for blocked send eligibility.

## 11. Test/build result

- `git diff --check`: pass
- `node src/components/reminder/__tests__/kakaoAlimtalkStateFormat.test.js`: pass
- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: pass
- `npm run build`: pass with existing Vite warnings
- raw base table query grep: no matches
- SQL safety grep: existing warning comments only; no unsafe policy or grant

`npm run build` initially failed because the fresh worktree had no `node_modules`. `npm ci --legacy-peer-deps` was used and did not change tracked files.

## 12. Data access guardrail

No client-side raw base table query was added. The raw query grep for scheduler v2 base tables and `notification_channel_capabilities` returned no matches.

## 13. Secrets handling

No DB password, service role key, anon key, access token, provider subject, raw Kakao id, raw phone, raw email, destination hash, value_normalized, Web Push endpoint, p256dh, auth secret, sender key, profile key, provider token, API key, or webhook secret was printed, stored, or documented.

## 14. What was not done

- no production/staging apply
- no SQL Editor
- no env/secret changes
- no Kakao API call
- no Kakao send
- no SMS send
- no Push send
- no OAuth/account linking
- no account merge/backfill
- no raw base table client policy

## 15. Remaining gaps

- Provider account and template tables are still not implemented.
- Capability update ownership/admin workflow is still a follow-up.
- Capability `reason` remains server-side only and is not exposed in summary.
- This migration was verified only on disposable.

## 16. Next recommended step

Review the disposable result and, if accepted, plan a separate promotion batch for staging/production with an explicit migration/apply approval and a provider readiness admin-write path.
