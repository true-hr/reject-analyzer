# PASSMAP Notification Contacts and Consents Design

## 1. Purpose

This document defines the baseline design for `person_id`-based notification contacts and consents in PASSMAP.

PASSMAP needs Kakao Alimtalk, SMS, Email, and Web Push delivery decisions to be based on the real PASSMAP person, not a single Supabase Auth login account. A user can sign in through Google, Kakao, Naver, or email under different `auth.users.id` values after account linking, but notification contact ownership and consent state must remain stable under one `person_id`.

The design separates channel destination from channel consent:

- `notification_contacts` answers where a channel can send.
- `person_consents` or `notification_consents` answers whether a channel is allowed to send.
- `reminder_rules_v2` answers when and what to remind.
- `reminder_rule_channels` answers which channel order to try.

Scheduler v2 must combine these by `person_id` before creating any send candidate. This avoids sending to a stale destination, sending without consent, treating marketing consent as service-notification consent, or treating one provider login account as the whole person.

This document is a design baseline only. It is not a DB migration, SQL apply, RLS implementation, Edge Function change, provider integration, cron change, or production change.

## 2. Current State

- Web Push test notification is possible, but it is not the primary operating channel for the long-term reminder flow.
- Kakao Alimtalk is the primary operating channel candidate.
- SMS is the fallback candidate after Kakao failure.
- Email is an auxiliary channel, more suitable for longer reports and summaries than immediate reminders.
- Scheduler v2 is still dry-run/mock.
- `providerDryRun` currently provides dry-run metadata for Kakao Alimtalk and SMS only.
- Scheduler v2 top-level side-effect counters remain `0` in dry-run.
- `live` mode remains rejected.
- Actual provider calls, DB writes, delivery ledger writes, cron cutover, and production sending remain prohibited.

## 3. Non-goals

This document does not include:

- DB migration authoring;
- SQL apply;
- RLS implementation;
- Edge Function modification;
- frontend notification settings UI implementation;
- Kakao/SMS provider integration;
- Email provider integration;
- Web Push live-send implementation;
- env or secret addition;
- real Kakao, SMS, Email, or Web Push sending;
- production changes.

## 4. Core Design Principles

- Notification contacts are owned by `person_id`.
- Notification consents are owned by `person_id`.
- Channel destination and channel consent are separate records.
- Marketing consent and service notification consent are separate.
- Kakao Alimtalk consent and SMS fallback consent are separate.
- Phone number verification is not the same as Kakao account linking.
- Kakao account linking is not the same as phone number verification.
- Web Push subscriptions are browser/device-specific and need a separate ownership model.
- Raw destination storage, masking, hashing, and retention require privacy review.
- If a consent is revoked, all later delivery candidates requiring that consent must skip immediately.
- Only verified contacts can become live-send candidates.
- Missing or unverified contacts can appear in dry-run only as skipped decisions.

## 5. notification_contacts Schema Draft

This is a schema draft, not SQL. It intentionally does not define migrations, indexes, RLS policies, triggers, constraints, or data backfill.

Purpose: person-owned notification destination candidates.

Candidate fields:

- `id`
- `person_id`
- `channel`
- `destination_type`
- `destination`
- `destination_hash`
- `masked_destination`
- `is_verified`
- `is_primary`
- `verification_method`
- `verified_at`
- `revoked_at`
- `created_at`
- `updated_at`

`channel` candidates:

- `kakao_alimtalk`
- `sms`
- `email`
- `web_push`

`destination_type` candidates:

- `phone`
- `email`
- `kakao_recipient_key`
- `web_push_subscription_ref`

`verification_method` candidates:

- `phone_otp`
- `email_link`
- `provider_link`
- `browser_permission`
- `imported`

Field notes:

- `destination` is the raw destination candidate and requires privacy review before live storage.
- `destination_hash` can support lookup or duplicate detection, but hash-only storage can still be re-identifiable for phone/email values.
- `masked_destination` is for display and logs where raw destination must not appear.
- `is_verified` and `verified_at` are required for live-send eligibility.
- `is_primary` is a channel-level preference hint when multiple verified contacts exist.
- `revoked_at` is a candidate for disabling a contact without hard deletion.
- `imported` is not recommended for MVP unless there is a separate consent, provenance, and verification review.

## 6. Channel Contact Meaning

### Kakao Alimtalk

- Destination is a verified phone number or a provider-specific recipient key candidate.
- Alimtalk live sending requires an approved template and sender/profile setup.
- Template approval must be complete before live mode.
- Phone number verification does not imply Kakao account linking.
- Kakao account linking does not imply a verified phone notification destination.
- A Kakao provider recipient key, if used, needs separate source, retention, and revocation review.
- Without approved template/profile/provider readiness, scheduler v2 must remain dry-run only.

### SMS

- Destination is a verified phone number.
- SMS fallback needs its own consent policy.
- SMS fallback consent must not be inferred from Kakao Alimtalk consent.
- Sender number, cost, quota, retry, and abuse policies are required before live use.
- SMS should be a fallback candidate after Kakao failure, not an automatic parallel send.

### Email

- Destination is an email address.
- Email is suitable for longer reports, digests, receipts, or summaries.
- Email is lower priority for immediate experience-recall reminders.
- Email verification should use an email link or an equivalent reviewed verification method.
- Provider email can change or be hidden, so provider email is evidence, not permanent identity proof.

### Web Push

- Destination should not copy the raw push endpoint directly into a person-level contact row.
- Recommended direction: store a subscription reference or a separate ownership bridge.
- Ownership needs review across `person_id`, `auth_user_id`, and endpoint/subscription identity.
- Browser permission and subscription validity must be checked at send time.
- Registration is per browser/device.
- Compatibility limitations must be documented for PC, Android, and iPhone environments.
- Existing Web Push subscriptions must not be transferred automatically during the `person_id` transition.

## 7. person_consents or notification_consents Schema Draft

This is a schema draft, not SQL. It intentionally does not define migrations, indexes, RLS policies, triggers, constraints, or data backfill.

Candidate table names:

- `person_consents`
- `notification_consents`

Recommendation:

- Start MVP with one table name, not both.
- `person_consents` is broader and can hold service notification, channel, marketing, consulting, and privacy notice consent states under `person_id`.
- `notification_consents` is narrower and clearer if the table will only ever govern notification delivery.
- Recommended baseline: `person_consents`, because PASSMAP already needs to keep notification consent separate from consulting connection consent and marketing consent while still using one person-owned consent evaluation model.

Candidate fields:

- `id`
- `person_id`
- `consent_type`
- `status`
- `agreed_at`
- `revoked_at`
- `source`
- `version`
- `created_at`
- `updated_at`

`status` candidates:

- `granted`
- `missing`
- `revoked`

`consent_type` candidates:

- `service_notification`
- `experience_recall_reminder`
- `kakao_alimtalk`
- `sms_notification`
- `sms_fallback`
- `email_notification`
- `web_push_device`
- `marketing_notification`
- `consulting_connection`
- `privacy_processing_delegation_notice`

Consent separation rules:

- Service notification, channel consent, marketing consent, and consulting connection consent must remain separate.
- `marketing_notification` must never be mixed with service notification consent.
- `consulting_connection` must remain separate from notification delivery consent.
- `privacy_processing_delegation_notice` can be tracked as a notice/consent candidate, but its legal semantics need review before implementation.

## 8. Consent Evaluation Policy

Scheduler v2 must evaluate consent before building a provider candidate.

Kakao reminder requires:

- `service_notification` = `granted`
- `experience_recall_reminder` = `granted`
- `kakao_alimtalk` = `granted`

SMS fallback requires:

- `service_notification` = `granted`
- `experience_recall_reminder` = `granted`
- `sms_fallback` = `granted`

Open SMS policy choice:

- Conservative MVP recommendation: require `sms_fallback` specifically for Kakao fallback.
- Alternative: allow `sms_notification` to cover fallback only if consent copy explicitly says SMS may be used for service-reminder fallback.
- Do not infer fallback permission from Kakao Alimtalk consent.

Email requires:

- `service_notification` = `granted`
- `email_notification` = `granted`

Web Push requires:

- `service_notification` = `granted`
- `web_push_device` = `granted`
- browser permission active
- subscription valid

Revocation policy:

- If a required consent is `revoked`, the channel must skip immediately.
- If SMS fallback consent is `revoked`, fallback must skip even when Kakao fails.
- If marketing consent is `revoked`, service notification eligibility must not be affected.
- If service notification consent is `revoked`, all service-reminder channels must skip.
- `missing` must be treated as not eligible for live sending.

Dry-run skip statuses should align with scheduler v2:

- missing contact: `would_skip_contact_missing`
- unverified contact: `would_skip_contact_unverified`
- missing consent: `would_skip_consent_missing`
- revoked consent: `would_skip_consent_revoked`

## 9. Consent Source and Version Policy

Consent records should store the source surface and copy/version used when the user agreed.

`source` candidates:

- `onboarding`
- `notification_settings`
- `account_linking`
- `phone_verification`
- `provider_linking`

`admin_import` is not recommended for MVP. If it is ever required, it needs separate legal, provenance, and audit review.

Version policy:

- Store a stable consent copy version in `version`.
- Record `agreed_at` when consent becomes granted.
- Record `revoked_at` when consent is withdrawn.
- Treat re-consent after revocation as a separate history question before implementation.
- MVP can store current state in `person_consents`, but full consent history or audit trail needs separate design.

## 10. Verification Policy

Supported verification methods:

- Phone: OTP verification.
- Email: email-link verification.
- Provider-specific recipient key: provider linking or provider verification flow after review.
- Web Push: browser permission plus valid subscription registration.

MVP recommendation:

- `imported` contacts should not be live-send candidates unless a separate verification/provenance policy is approved.
- Only verified contacts can be live-send candidates.
- Unverified contacts should produce `would_skip_contact_unverified` in dry-run.
- Missing contacts should produce `would_skip_contact_missing` in dry-run.
- Verification of a contact does not merge accounts and does not prove account-linking consent.

## 11. Privacy and Security Risks

Risk areas:

- Raw phone number or email storage can expose direct personal data.
- Hash-only phone/email values can still be vulnerable to dictionary or re-identification attacks.
- Masking policy is needed for UI, logs, exports, and support tools.
- Phone numbers can be recycled and later belong to another person.
- Provider email can be changed, hidden, missing, or unverified.
- Consent withdrawal can be missed if scheduler evaluation reads stale state.
- Account linking can be falsely inferred from contact verification.
- Web Push endpoints can expose subscription secrets or stable browser/device identifiers.
- Provider raw responses can contain personal data and should not be stored without retention review.
- Notification logs can accidentally include raw destinations, provider payloads, or message contents.

Required reviews before live use:

- raw destination storage policy;
- destination masking policy;
- destination hash and salt/pepper policy;
- data retention and deletion policy;
- log redaction policy;
- provider raw response storage policy;
- support/admin access policy;
- consent withdrawal propagation policy.

## 12. Scheduler v2 Connection

Scheduler v2 should connect these models in this order:

1. Query due `reminder_rules_v2` by `person_id`.
2. Check enabled `reminder_rule_channels` in priority order.
3. Query `notification_contacts` by `person_id` and channel.
4. Require verified, active contact eligibility.
5. Query `person_consents` or `notification_consents` by `person_id`.
6. Require service, reminder-kind, and channel-specific consent.
7. Build Kakao Alimtalk primary dry-run candidate.
8. If Kakao dry-run fails and fallback is configured, evaluate SMS fallback dry-run.
9. Return scheduler decision and optional `providerDryRun` metadata.
10. Keep top-level dry-run counters at `0`.

Dry-run safety:

- `providerCalls` remains `0`.
- `messagesSent` remains `0`.
- `ledgerWrites` remains `0`.
- `provider.called` remains `false`.
- `provider.messageId` remains `null`.
- `provider.rawStored` remains `false`.
- Provider calls and ledger writes do not happen before live approval.

Live-mode safety:

- `live` mode remains rejected until DB/RLS/provider/cron approvals are complete.
- Passing dry-run contract tests does not authorize live sends.
- Provider dry-run metadata does not authorize provider credential use.

## 13. Live Application Preconditions

Before live application, all of the following must be complete:

- `notification_contacts` schema review;
- `notification_contacts` RLS review;
- `person_consents` or `notification_consents` schema review;
- consent table RLS review;
- destination masking/hash policy;
- consent copy/version finalization;
- withdrawal UX finalization;
- phone verification UX finalization;
- email verification UX finalization;
- provider credential policy finalization;
- Kakao template approval;
- Kakao sender/profile approval;
- SMS sender number approval;
- SMS cost/quota policy;
- Web Push ownership bridge review;
- staging dry-run PASS;
- Protected DB approval;
- Supabase production change approval;
- provider live approval;
- cron cutover approval.

Without these approvals, scheduler v2 remains dry-run/mock only.

## 14. Next Steps

Possible follow-up PRs:

- `notification_contacts` and consent SQL draft PR.
- Consent copy and withdrawal UX document.
- Phone verification UX design.
- Email verification UX design.
- Web Push subscription ownership bridge design.
- Scheduler v2 DB-query dry-run implementation.
- Notification settings UI v2 design.

## 15. Guardrails

This document does not authorize:

- DB or SQL changes;
- Supabase SQL Editor execution;
- Supabase CLI db push/apply;
- DB migration or data backfill;
- RLS implementation;
- Edge Function changes;
- frontend changes;
- Supabase Auth setting changes;
- provider setting changes;
- env or secret usage;
- provider API calls;
- provider SDK installation;
- Kakao Alimtalk sending;
- SMS sending;
- Email sending;
- Web Push sending;
- Supabase deploy;
- cron changes;
- production changes.
