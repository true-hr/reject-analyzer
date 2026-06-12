# Kakao Summary Shape and Consent RPC Draft

## 1. Status

DRAFT

## 2. Scope

This batch stabilizes the frontend contract for a normalized Kakao Alimtalk summary shape and documents the server-side SQL/RPC direction. It does not apply any database migration, query any database, call Kakao APIs, implement OAuth, or send Kakao/SMS/Push notifications.

## 3. Normalized summary shape

Long term, `get_current_person_notification_summary()` should return the existing arrays plus a normalized `kakao` object:

```json
{
  "kakao": {
    "identity": "missing|active|blocked|unknown",
    "contact": "missing|active|blocked|unknown",
    "consent": "missing|granted|revoked|unknown",
    "send_eligibility": "not_ready|ready|blocked|unknown"
  }
}
```

- `identity`: Kakao login/account identity readiness from active `account_identities.provider = 'kakao'`.
- `contact`: Kakao Alimtalk contact readiness from `contact_points.type = 'kakao_alimtalk'`.
- `consent`: Kakao Alimtalk reminder consent from `notification_consents.channel = 'kakao_alimtalk'` and `consent_type = 'reminder'`.
- `send_eligibility`: provider/template/capability readiness. This remains `not_ready` until a separate provider readiness contract exists.

The normalized object must not expose raw `provider_user_id`, `auth_user_id`, Kakao id, phone, email, destination hash, normalized destination, Web Push endpoint, `p256dh`, or auth secret.

## 4. Helper compatibility

- normalized object: `deriveKakaoAlimtalkState(row)` now uses `row.kakao` first when it is a plain object. It maps missing identity/contact/consent to `not_connected`, active identity without consent to `account_ready`, granted consent with `send_eligibility = 'not_ready'` to `consent_ready`, and granted consent with active contact plus `send_eligibility = 'ready'` to `send_ready`.
- array fallback: Existing `providers`, `contact_channels`, and `consents` inference remains in place when `row.kakao` is absent. This preserves current summary compatibility.
- privacy: The helper returns only UI state, label, description, disabled action label, and tone. It does not return raw identifiers or raw enum names.

## 5. Summary SQL draft

- added: No SQL draft migration was added in this batch.
- not added: `get_current_person_notification_summary()` was not patched in SQL.
- reason: The requested outcome can be stabilized safely by making the frontend helper compatible with the future `row.kakao` shape while preserving existing arrays. Adding SQL now would change a protected-adjacent database contract without disposable verification in the same task. The safer next step is a dedicated SQL draft/verification batch that updates the summary function and validates privacy exclusions.

Expected SQL direction for the next batch:

```sql
jsonb_build_object(
  'identity', ...,
  'contact', ...,
  'consent', ...,
  'send_eligibility', 'not_ready'
) as kakao
```

The summary must remain backward compatible and continue returning existing `providers`, `contact_channels`, and `consents` arrays.

## 6. Kakao consent RPC draft

- function: Future draft candidate is `public.upsert_current_person_kakao_alimtalk_consent(p_consent_status scheduler_consent_status default 'granted', p_copy_version text default 'kakao-alimtalk-consent-20260612', p_metadata jsonb default '{}'::jsonb)`.
- active Kakao identity requirement: The RPC should require `auth.uid()`, exactly one `current_person_ids()` result, and an active Kakao identity for that `person_id`. If no active Kakao identity exists, it should fail with `KAKAO_IDENTITY_REQUIRED`.
- privacy/security: The function should be `security definer`, set `search_path = public, pg_temp`, revoke execute from `public` and `anon`, grant execute to `authenticated`, avoid provider API calls, avoid live sends, avoid OAuth implementation, avoid raw base table client policies, and never return raw Kakao provider ids, auth user ids, destination hashes, or normalized destinations.
- apply status: Not implemented and not applied in this batch.

## 7. Test/build result

Planned validation:

- `git diff --check`
- `node src/components/reminder/__tests__/kakaoAlimtalkStateFormat.test.js`
- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- `npm run build`
- raw base table query grep over `src`

## 8. Data access guardrail

No client raw base table query was added. The frontend helper continues to consume summary rows only.

## 9. What was not done

- no DB apply
- no production/staging access
- no disposable apply/query
- no SQL Editor
- no env/secret changes
- no Kakao API call
- no Kakao send
- no SMS send
- no Push send
- no OAuth/account linking
- no account merge/backfill

## 10. Remaining gaps

- `get_current_person_notification_summary()` still needs a SQL draft that emits `kakao`.
- Dedicated Kakao Alimtalk consent RPC SQL still needs a draft and disposable verification.
- Provider send eligibility needs a separate schema/contract decision before `send_eligibility = 'ready'` can be produced by the server.

## 11. Next recommended step

Add a SQL draft for normalized `kakao` summary output, then verify it in a disposable project with privacy-focused catalog and RPC checks before considering staging or production.
