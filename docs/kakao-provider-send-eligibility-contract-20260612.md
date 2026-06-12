# Kakao Provider Send Eligibility Contract

## 1. Status

DRAFT

This document defines the server-side contract for when Kakao Alimtalk reminder delivery can be considered send-ready. It does not apply a database migration, query any database, call Kakao APIs, send messages, or implement provider integration.

## 2. Product decision

- Kakao Alimtalk role: Kakao Alimtalk is the preferred out-of-app reminder channel once account identity, Alimtalk contact, user consent, and provider readiness are all satisfied.
- Device notification role: Device notifications remain the immediate device-local or browser push path and are independent from Kakao provider readiness.
- SMS fallback role: SMS remains a fallback or separate contact channel. SMS readiness must not imply Kakao Alimtalk readiness.

Kakao login, Kakao Alimtalk contact, Kakao Alimtalk consent, and Kakao provider send eligibility are separate signals. A user can be `consent_ready` without being live-send-ready.

## 3. send_eligibility states

- not_ready: Default state. Identity, contact, or consent may be partially ready, but provider delivery requirements are not fully satisfied. Example: a Kakao account is linked, but no approved Alimtalk reminder template or active provider capability is available.
- ready: Active Kakao identity, active Kakao Alimtalk contact, granted reminder consent, an approved usable reminder template, an active provider account/channel capability, and no delivery policy block all exist.
- blocked: A blocking signal exists. Examples include account unlinked/conflict, contact disabled/revoked, consent revoked, provider account disabled, template rejected/disabled, channel capability blocked, or compliance/policy block.
- unknown: Provider readiness cannot be determined. Examples include inconsistent state, missing provider readiness metadata after a migration/version change, or a signal that cannot be mapped to `ready`, `not_ready`, or `blocked`.

## 4. Required signals for ready

- identity: `account_identities` has an active Kakao identity for the current person, with `provider = 'kakao'`, `status = 'active'`, and no unlink marker.
- contact: `contact_points` has an active Kakao Alimtalk contact for the current person, with `type = 'kakao_alimtalk'` and `status = 'active'`.
- consent: `notification_consents` has granted reminder consent for the current person, with `channel = 'kakao_alimtalk'`, `consent_type = 'reminder'`, and `status = 'granted'`.
- provider account: A future provider account signal says the Kakao Alimtalk provider account/channel is active and not blocked.
- template: A future template signal says an approved Kakao Alimtalk template is available for reminder sends.
- channel capability: A future channel capability signal says `channel = 'kakao_alimtalk'` and `capability = 'reminder_send'` are ready.

Identity, contact, and consent alone must never make `send_eligibility = 'ready'`. Provider/template/capability readiness must also be present.

## 5. Candidate schema

- notification_provider_accounts: Stores provider account or channel readiness for Kakao Alimtalk delivery.
  - Candidate columns: `id`, `provider = 'kakao_alimtalk'`, `status = 'active|disabled|blocked'`, `sender_key_hash`, `profile_key_hash`, `metadata`, `created_at`, `updated_at`.
  - Rules: Do not store raw sender keys, profile keys, provider tokens, or API keys in a general database table. Secrets should live in Supabase secrets, environment configuration, or a provider vault.
- notification_templates: Stores provider template readiness.
  - Candidate columns: `id`, `provider = 'kakao_alimtalk'`, `template_code`, `template_kind = 'reminder|setting_notice|etc'`, `status = 'approved|pending|rejected|disabled'`, `locale`, `metadata`, `created_at`, `updated_at`.
  - Rules: Template code may be stored if it is not a secret, but summary output should not expose template internals to the client.
- notification_channel_capabilities: Stores coarse channel capability decisions used by summary/RPC reads.
  - Candidate columns: `channel = 'kakao_alimtalk'`, `capability = 'reminder_send'`, `status = 'ready|not_ready|blocked'`, `reason`, `metadata`, `updated_at`.
  - Rules: This table should expose a coarse readiness decision, not raw provider account or template secrets.

## 6. Recommended first implementation

Use `notification_channel_capabilities` as the first draft implementation.

Reasoning:

- Provider account and template shape may change depending on the Kakao Business or Alimtalk provider integration selected later.
- The current UI and summary contract only need a coarse `send_eligibility` value.
- A capability table hides provider-specific details behind a stable readiness signal.
- Provider account and template tables can be added later and used to derive or update the capability row.

The first draft should model only the coarse capability:

```txt
channel = kakao_alimtalk
capability = reminder_send
status = ready|not_ready|blocked
reason = provider_not_configured|template_missing|template_pending|template_rejected|provider_disabled|policy_block|unknown
```

## 7. Summary function contract

Future `get_current_person_notification_summary()` Kakao calculation:

```txt
if blocked signal exists:
  send_eligibility = blocked
else if identity active
  and contact active
  and consent granted
  and channel capability ready:
  send_eligibility = ready
else if required signals are missing or incomplete:
  send_eligibility = not_ready
else:
  send_eligibility = unknown
```

Blocked signals should include:

- Kakao identity unlinked/conflict
- Kakao Alimtalk contact disabled/revoked
- Kakao Alimtalk reminder consent revoked
- provider account disabled/blocked
- reminder template rejected/disabled
- channel capability blocked
- compliance or policy block

Current behavior remains unchanged until the capability signal exists: `send_eligibility = 'not_ready'`.

## 8. Privacy/security rules

- Do not store raw provider secrets in public or general application tables.
- Do not expose sender key, profile key, provider token, API key, or webhook secret.
- Do not expose Kakao provider subject.
- Do not expose `provider_user_id`.
- Do not expose `auth_user_id`.
- Do not expose `destination_hash` or `value_normalized`.
- Summary output should return only coarse readiness states.
- Clients must not query provider readiness base tables directly.
- Provider readiness changes should be service role/admin operations or protected RPCs only.
- No raw base table client policies should be added for provider readiness tables.

## 9. What this batch does not implement

- no DB apply
- no production/staging access
- no disposable DB query
- no SQL migration
- no env/secret changes
- no Kakao API call
- no Kakao send
- no SMS send
- no Push send
- no OAuth/account linking
- no account merge/backfill

## 10. Recommended next implementation batch

- Add a draft migration for `notification_channel_capabilities` only, after explicit DB-apply approval.
- Keep default Kakao `send_eligibility = 'not_ready'` until a ready capability row exists.
- Patch `get_current_person_notification_summary()` to read the coarse capability signal without exposing provider internals.
- Add catalog/privacy tests that confirm raw provider account, template, and secret data are not returned.
- Verify only on a disposable project before any staging or production promotion discussion.

## 11. Open questions

- Should capability readiness be global, per tenant, per provider account, or per person?
- Should approved templates be required per reminder kind, locale, or message copy version?
- Should `blocked` include temporary provider outage states, or should those be represented as `unknown`/`not_ready` with a reason?
- Which admin workflow owns capability updates after provider account/template changes?
- Should the summary return only `send_eligibility`, or later include a coarse non-secret `send_reason`?
