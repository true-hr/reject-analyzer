# Kakao Summary Consent RPC Disposable Verification

## 1. Status

PARTIAL_VERIFIED

The migration was applied and function/RPC behavior was verified on the disposable project. Status is partial because an early failed fixture attempt printed one full synthetic disposable auth user id in the CLI error output. The value is not repeated in this document and was not committed.

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
- `20260612143000_kakao_summary_shape_consent_rpc.sql`: applied to disposable

## 4. Summary function verification

- `public.get_current_person_notification_summary()` exists.
- Return shape now includes normalized `kakao jsonb`.
- Existing `providers`, `contact_channels`, `consents`, `reminder_rules`, and `web_push` arrays remain available.
- Function language: `sql`
- Security definer: yes
- Search path: `public, pg_temp`
- `public` execute: revoked
- `anon` execute: revoked
- `authenticated` execute: granted

## 5. Kakao consent RPC verification

- `public.upsert_current_person_kakao_alimtalk_consent(scheduler_consent_status, text, jsonb)` exists.
- Function language: `plpgsql`
- Security definer: yes
- Search path: `public, pg_temp`
- `public` execute: revoked
- `anon` execute: revoked
- `authenticated` execute: granted
- Active Kakao identity is required.
- Missing active Kakao identity returns `KAKAO_IDENTITY_REQUIRED`.
- Grant path stores a Kakao Alimtalk placeholder contact and reminder consent.
- Revoke path updates the same consent to `revoked`.

## 6. Fixture

- Created disposable-only synthetic fixtures.
- Kakao-active fixture auth user masked: `c61a...2c83`
- Kakao-active fixture person masked: `67fe...d83e`
- Provider subject, full auth user id, full person id, raw email, and hash values are not documented.

## 7. Summary state cases

- no Kakao identity: verified `identity = missing`, `contact = missing`, `consent = missing`, `send_eligibility = not_ready`
- active Kakao identity: verified `identity = active`, `contact = missing`, `consent = missing`, `send_eligibility = not_ready`
- consent granted: verified `identity = active`, `contact = active`, `consent = granted`, `send_eligibility = not_ready`
- consent revoked: verified `identity = active`, `contact = active`, `consent = revoked`, `send_eligibility = not_ready`

## 8. Failure/safety checks

- Active Kakao identity missing: `KAKAO_IDENTITY_REQUIRED`
- No linked person: `PERSON_NOT_FOUND`
- Auth missing: `AUTH_REQUIRED`
- Anon execute: denied by execute privilege check
- Multiple person behavior: not exercised in this disposable verification
- Raw authenticated base table policies: no authenticated policies found for scheduler v2 base tables

## 9. Privacy checks

- RPC return excluded `provider_user_id`.
- RPC return excluded `auth_user_id`.
- RPC return excluded `destination_hash`.
- RPC return excluded `value_normalized`.
- Summary output used normalized status values only.
- Contact row stored hashed placeholder reference, not raw provider subject.
- Contact metadata recorded `raw_destination_stored = false`.
- Contact metadata recorded `provider_user_id_stored = false`.
- Web Push endpoint, `p256dh`, and auth secret were not returned.

## 10. Frontend helper compatibility

The existing `deriveKakaoAlimtalkState(row)` test covers normalized `row.kakao` states:

- identity active + contact missing + consent missing -> `account_ready`
- identity active + contact active + consent granted + send not ready -> `consent_ready`
- consent revoked -> `blocked`

Array fallback remains covered by the existing helper tests.

## 11. Patch summary

- Added `20260612143000_kakao_summary_shape_consent_rpc.sql`.
- Recreated `get_current_person_notification_summary()` with backward-compatible arrays plus normalized `kakao`.
- Added `upsert_current_person_kakao_alimtalk_consent(...)` draft RPC.
- Did not change frontend helper code in this PR because PR #864 already added normalized shape compatibility.

## 12. Test/build result

- `git diff --check`: pass
- `node src/components/reminder/__tests__/kakaoAlimtalkStateFormat.test.js`: pass
- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: pass
- `npm run build`: pass with existing Vite warnings
- raw base table query grep: no matches
- SQL safety grep: existing warning comments only; no new unsafe policy or `provider_user_id = auth.uid()` implementation

## 13. Data access guardrail

No raw base table client policy was added. Client-side raw base table query grep returned no matches.

## 14. Secrets handling

No DB password, service role key, anon key, access token, provider subject, raw Kakao id, raw phone, raw email, destination hash, `value_normalized`, Web Push endpoint, `p256dh`, or auth secret was printed, stored, or documented.

Exception: one full synthetic disposable auth user id was printed by an early failed fixture attempt. It was not stored in a committed file and is not repeated here.

## 15. What was not done

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

## 16. Remaining gaps

- Multiple-person ambiguity behavior was not exercised with a dedicated fixture.
- Provider/template/capability readiness is still not modeled; `send_eligibility` remains `not_ready`.
- The placeholder destination copy is safe but should be localized before any product-facing use.

## 17. Next recommended step

Promote the summary/RPC contract into a reviewed non-disposable migration only after a separate staging/production promotion review, and keep provider eligibility as a separate follow-up contract.
