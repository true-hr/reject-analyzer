# Kakao/SMS Contact Consent Disposable Verification

## 1. Status

APPLIED_VERIFIED

## 2. Target

- Project: `passmap-scheduler-v2-disposable-20260605`
- Masked ref: `rkfq...fbhu`
- Confirmed disposable only: yes
- Production/staging touched: no

## 3. Migration state

- `20260604000000`: applied before this verification
- `20260605000000`: applied before this verification
- `20260606115936`: applied before this verification
- `20260612082650`: pending before verification, applied to disposable during this verification
- Post-apply migration list showed local and remote both at `20260612082650`

## 4. Function/grant/catalog verification

- `public.upsert_current_person_contact_consent(...)`: exists
- language: `plpgsql`
- security definer: yes
- search_path: `public, pg_temp`
- `public` execute: revoked
- `anon` execute: revoked
- `authenticated` execute: granted
- raw authenticated base table policy: not added; checked scheduler v2 contact/consent-related policies and only `service_role` management policies are present
- `contact_points` columns present: `destination_hash`, `masked_destination`, `is_primary`, `metadata`
- `notification_consents` columns present: `metadata`, `updated_at`

## 5. Fixture

- Reused existing disposable fixture.
- auth user masked: `f826...c6df`
- person masked: `640c...874a`
- account identity status: active
- membership predicate: `account_identities.auth_user_id = auth.uid()`
- Full auth user id, full person id, provider subject, token, password, and key values were not documented.

## 6. SMS RPC save verification

- Authenticated role context RPC call: PASS
- returned contact id present: yes
- returned consent id present: yes
- returned channel: `sms`
- returned contact_type: `phone`
- returned contact_status: `active`
- returned consent_type: `reminder`
- returned consent_status: `granted`
- returned masked destination: `*******5678`
- raw destination returned: no

## 7. DB row verification

### contact_points

- matching contact row count: 1
- person matched fixture: yes
- type: `phone`
- `value_normalized`: SHA-256 hash, not raw destination
- `destination_hash`: SHA-256 hash, not raw destination
- `masked_destination`: masked only, ending `5678`
- status: `active`
- is_primary: `true`
- metadata `raw_destination_stored`: `false`

### notification_consents

- matching consent row count: 1
- person matched fixture: yes
- linked to contact point: yes
- channel: `sms`
- consent_type: `reminder`
- status after initial save: `granted`
- source: `reminder_settings_panel`
- granted_at: present
- revoked_at after initial save: null
- metadata: present

## 8. Repeated call/idempotency verification

- Repeated call using the same logical phone destination in a different input format: PASS
- same contact id returned: yes
- same consent id returned: yes
- duplicate contact rows: no, count remained 1
- duplicate consent rows: no, count remained 1
- raw destination returned: no

## 9. Revoke path verification

- Revoke RPC call: PASS
- returned consent_status: `revoked`
- contact_status remained: `active`
- revoked_at: present
- granted_at retained: yes
- raw destination returned: no

## 10. Summary reflection

- `get_current_person_notification_summary()` call under authenticated fixture: PASS
- SMS contact reflected through contact summary as `phone` because `contact_points.type` is `phone`.
- SMS reminder consent reflected as `revoked` after the revoke-path check.
- raw destination exposed: no
- `destination_hash` / `value_normalized` exposed: no
- `auth_user_id` / `provider_user_id` exposed: no

## 11. Failure/safety checks

- anon execute denied: PASS, SQLSTATE `42501`
- authenticated call without auth uid: PASS, `AUTH_REQUIRED`, SQLSTATE `28000`
- authenticated call with no linked person: PASS, `PERSON_NOT_FOUND`, SQLSTATE `P0001`
- unsupported channel: PASS, `UNSUPPORTED_CONTACT_CHANNEL`, SQLSTATE `22023`
- multiple person behavior: not forced; current active auth-user uniqueness prevents creating that state without bypassing normal constraints.

## 12. Patch summary

No code or SQL patch was required. This PR is documentation only.

## 13. Test/build result

- `git diff --check`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSettingsRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2ContactConsentRepository.test.js`: PASS
- `npm run build`: PASS after one timeout retry with a longer limit; existing Vite warnings remained.
- raw base table query grep: PASS, no forbidden `.from('...')` client calls found.
- SQL safety grep: PASS for new work; matches were existing comments prohibiting `provider_user_id = auth.uid()`.
- privacy grep: no console output added by this documentation-only PR; command still reports pre-existing logs/tests elsewhere under `src/lib`.

## 14. Data access guardrail

- Client-side raw scheduler v2 base table query guardrail remains intact.
- No raw base table client policy was added.
- Disposable verification used catalog/read SQL and authenticated RPC execution only.

## 15. Secrets handling

No DB password, service role key, anon key, access token, full auth user id, full person id, or raw phone number was printed, stored, or documented in this file.

## 16. What was not done

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

## 17. Remaining gaps

- Summary contact channel currently appears as `phone`, not `sms`, because the summary groups `contact_points.type`; this was accepted as verified behavior and not patched in this PR.
- Revoke path leaves the disposable fixture's SMS reminder consent in `revoked` status after verification.
- Phone verification records remain out of scope.

## 18. Next recommended step

Add a small follow-up decision on whether summary contact channels should expose contact type (`phone`) or notification channel (`sms`) before any staging/production promotion.
