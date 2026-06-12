# Kakao/SMS Contact Consent Write Path

## 1. Status

DRAFT_IMPLEMENTED

## 2. Scope

- Adds an authenticated person-scoped contact/consent write RPC draft.
- Adds frontend repository helpers for SMS, Kakao Alimtalk, and email contact consent payloads.
- Wires SMS phone/contact consent preparation into `ReminderSettingsPanel`.
- Keeps Kakao Alimtalk at a ready-state only; no provider send or OAuth/account linking.

## 3. SQL draft

- migration: `supabase/migrations/20260612082650_scheduler_v2_contact_consent_write_functions.sql`
- function: `public.upsert_current_person_contact_consent(...)`
- security: `security definer`, `search_path = public, pg_temp`, `auth.uid()` required, exactly one `current_person_ids()` result required.
- grants: revoked from `public` and `anon`; granted to `authenticated`.
- privacy handling: stores SHA-256 destination hash in `value_normalized`/`destination_hash`, stores masked destination separately, and returns only masked destination plus ids/status.

## 4. Frontend repository

- file: `src/lib/schedulerV2ContactConsentRepository.js`
- RPC: `upsert_current_person_contact_consent`
- raw table query: not used; repository only calls `supabase.rpc(...)`.

## 5. UI integration

- location: `src/components/reminder/ReminderSettingsPanel.jsx`
- SMS: phone input and `휴대폰 정보 저장` button call the RPC wrapper.
- Kakao: ready-state block only; no account linking or provider send.
- Email: repository builder only; no UI path in this batch.
- loading/success/error: SMS save uses local saving/saved/error state and does not print raw phone values.

## 6. Test/build result

- `git diff --check`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSettingsRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2ContactConsentRepository.test.js`: PASS
- `npm run build`: PASS with existing Vite warnings for import attributes, dynamic/static imports, and large chunks.
- raw base table query grep: PASS, no forbidden `.from('...')` client calls found.
- SQL safety grep: PASS for new migration; matches are existing warning comments that prohibit `provider_user_id = auth.uid()`.
- privacy grep: no console output added in changed UI/repository files; command still reports pre-existing logs/tests elsewhere under `src/lib`.

## 7. Data access guardrail

- No raw scheduler v2 base table client policies were added.
- Client code does not call `.from('contact_points')`, `.from('notification_consents')`, `.from('contact_verifications')`, or `.from('reminder_channels')`.
- Membership resolution remains based on `current_person_ids()` and `account_identities.auth_user_id = auth.uid()` through the existing helper.

## 8. What was not done

- no production/staging apply
- no SQL Editor
- no env/secret changes
- no provider/live send
- no SMS send
- no Kakao send
- no phone verification send
- no OAuth/account linking
- no account merge/backfill
- no raw base table client policy

## 9. Remaining gaps

- The current contact status enum has no `unverified` value, so saved SMS contact points use existing `active` status while verification remains out of scope.
- Kakao Alimtalk uses a pending placeholder destination until real account linking/provider identity is designed.
- No summary reload callback is wired after SMS save in this batch.

## 10. Next recommended step

Add a reviewed phone verification flow that creates service-role-only verification records and upgrades UI state without exposing raw phone destinations in summary reads.
