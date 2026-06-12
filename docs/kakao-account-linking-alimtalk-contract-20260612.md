# Kakao Account Linking Alimtalk Contract

## 1. Status

DRAFT

This document defines the server-side contract for Kakao account linking and Kakao Alimtalk consent readiness. It does not apply a migration, call Kakao APIs, send messages, or implement OAuth/account linking.

## 2. Product decision

- Kakao login: Kakao login is an identity signal only. It is stored as an active `account_identities` row with `provider = 'kakao'` and does not imply Kakao Alimtalk consent.
- Kakao Alimtalk consent: Alimtalk consent is a notification consent signal scoped to `person_id`, `channel = 'kakao_alimtalk'`, and `consent_type = 'reminder'`.
- Kakao Alimtalk contact: Alimtalk contact readiness is a contact signal scoped to `person_id` with `contact_points.type = 'kakao_alimtalk'`. Raw Kakao provider ids should not be stored or returned as user-facing destination values.
- Provider send eligibility: Send readiness is a separate provider/template/channel capability signal. It must not be inferred from Kakao login or consent alone.

## 3. State machine contract

- not_connected: No active Kakao identity, no active Kakao Alimtalk contact, and no granted Kakao Alimtalk reminder consent. Expected summary signal: `identity = missing`, `contact = missing`, `consent = missing`, `send_eligibility = not_ready`.
- account_ready: Active Kakao identity exists, but Kakao Alimtalk contact and reminder consent are not ready. Kakao login alone must not create or imply Alimtalk consent.
- consent_ready: Kakao Alimtalk reminder consent is granted, but contact readiness or provider send eligibility is still missing. This state is not the same as live send readiness.
- send_ready: Active Kakao identity, active Kakao Alimtalk contact, granted Kakao Alimtalk reminder consent, and a future provider/template/channel capability signal are all ready. The provider capability signal is a TODO and is not implemented in this batch.
- blocked: Kakao identity is unlinked or conflicted, Kakao contact is disabled or revoked, Kakao consent is revoked, or provider eligibility is blocked.
- unknown: Summary data is missing, malformed, or internally inconsistent.

## 4. Existing schema mapping

- account_identities: Stores identity linkage by `person_id`, `auth_user_id`, `provider`, `provider_user_id`, and `status`. Kakao login is represented by `provider = 'kakao'` and `status = 'active'`. Membership must be based on `account_identities.auth_user_id = auth.uid()`, not `provider_user_id = auth.uid()`, email, phone, display name, or contact destination.
- contact_points: Stores contact readiness. Kakao Alimtalk should use `type = 'kakao_alimtalk'`. `value_normalized` and `destination_hash` should be hash/tokenized stable references, not raw Kakao provider ids. `masked_destination` should be safe user-facing text. `metadata.provider_linking_pending` can be used by a future draft to mark placeholder readiness.
- notification_consents: Stores notification consent by `person_id`, `channel = 'kakao_alimtalk'`, `consent_type = 'reminder'`, `status`, `source`, `copy_version`, and `metadata`.
- summary function: `get_current_person_notification_summary()` currently returns coarse arrays such as `providers`, `contact_channels`, and `consents`. The Kakao state helper can infer from these arrays, but the server contract should keep the shape stable and privacy-safe.

Expected summary shape for inference:

```json
{
  "providers": [
    {"provider": "kakao", "status": "active"}
  ],
  "contact_channels": [
    {"channel": "kakao_alimtalk", "status": "active", "count": 1}
  ],
  "consents": [
    {"channel": "kakao_alimtalk", "consent_type": "reminder", "status": "granted"}
  ]
}
```

Optional future normalized signal:

```json
{
  "kakao": {
    "identity": "missing|active|blocked",
    "contact": "missing|active|blocked",
    "consent": "missing|granted|revoked",
    "send_eligibility": "not_ready|ready|blocked|unknown"
  }
}
```

## 5. RPC contract candidates

- upsert_current_person_kakao_alimtalk_consent: Future dedicated write RPC for Kakao Alimtalk consent preparation. It should be `security definer`, set `search_path = public, pg_temp`, require `auth.uid()`, require exactly one `current_person_ids()` result, and require an active Kakao identity before storing a granted Alimtalk consent. If no active Kakao identity exists, it should fail with `KAKAO_IDENTITY_REQUIRED`. Inputs can start with `p_consent_status scheduler_consent_status default 'granted'`, `p_copy_version text default 'kakao-alimtalk-consent-20260612'`, and `p_metadata jsonb default '{}'::jsonb`. It must not perform OAuth, call Kakao APIs, send Alimtalk, or return raw provider ids.
- get_current_person_notification_summary extension: Preferred read contract path. A later batch can extend or stabilize the existing summary function instead of adding a separate read RPC. The summary should continue to expose only coarse provider/contact/consent state and should not expose raw identifiers, hashes, endpoints, or secrets.

## 6. Privacy/security rules

- Use `account_identities.auth_user_id = auth.uid()` as the authenticated membership root.
- Do not use `provider_user_id = auth.uid()`.
- Do not auto-merge accounts by email, phone, display name, or Kakao profile fields.
- Kakao login is not Kakao Alimtalk consent.
- A dedicated Kakao Alimtalk consent RPC should require active Kakao identity before writing `status = 'granted'`; otherwise return `KAKAO_IDENTITY_REQUIRED`.
- Do not expose `provider_user_id`, `auth_user_id`, raw phone, raw email, raw Kakao id, `destination_hash`, `value_normalized`, Web Push endpoint, `p256dh`, or auth secret.
- Do not add raw base table client write policies. Client access should remain through RPCs and summary reads.
- Provider send eligibility must be a separate future signal and cannot be inferred from identity/contact/consent alone.

## 7. What this batch does not implement

- no DB apply
- no production/staging access
- no SQL Editor
- no env/secret changes
- no Kakao API call
- no Kakao send
- no SMS send
- no OAuth/account linking
- no account merge/backfill

## 8. Recommended next implementation batch

- Extend or stabilize `get_current_person_notification_summary()` so Kakao state machine inputs are explicit and privacy-safe.
- Add a draft `upsert_current_person_kakao_alimtalk_consent(...)` RPC with `KAKAO_IDENTITY_REQUIRED` when active Kakao identity is missing.
- Verify the draft only in a disposable project after explicit approval.
- Add contract tests for Kakao summary shape, privacy exclusions, and blocked/revoked state handling.
- Design provider send eligibility only after Kakao provider account/template readiness requirements are known.

## 9. Open questions

- Should `contact_points.type = 'kakao_alimtalk'` allow a placeholder row before a real provider tokenized reference exists?
- Should provider send eligibility live in `notification_channel_capabilities`, `notification_provider_accounts`, or a template-specific table?
- Should `send_ready` require approved templates per reminder category?
- Should the UI consume array inference long term, or should the summary function expose a normalized `kakao` object?
- Should pending Alimtalk interest before Kakao identity be stored at all, or remain UI-only until account linking is available?
