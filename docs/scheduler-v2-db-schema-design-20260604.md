# Scheduler v2 DB Schema Design Baseline

## Purpose

This document is not a migration. It is the DB schema baseline for the scheduler v2 / notification system before moving from fixture-only dry-run contract tests to live DB reads.

The goals are:

- Organize notification targets and account links around `person_id`.
- Separate login identities from notification contact points.
- Separate contact verification from notification consent.
- Separate Web Push subscription ownership safely.
- Define the DB read model scheduler v2 needs before moving from dry-run fixtures to live-read behavior.
- Establish duplicate-send prevention and delivery audit baselines.

## Highest Priority Principles

- Do not automatically merge account/person records only because email, phone number, or name matches.
- Login account linking and notification receiving consent are separate.
- Contact verification and receiving consent are separate.
- Kakao login and Kakao alimtalk consent are separate.
- Web Push is not a contact point. It is a current browser/device subscription.
- Do not copy raw endpoint, `p256dh`, or `auth` values into person-level contacts.
- Web Push ownership with `conflict`, `stale`, or `revoked` status must be excluded from live send candidates.
- Dry-run must not create provider calls, message ids, or ledger writes.
- Delivery claim/idempotency must be verified before live mode is enabled.

## Candidate Tables

### `persons`

Role:

- PASSMAP internal root entity for a person.
- Parent owner for multiple login identities, contact points, and reminder rules.

Candidate columns:

- `id`
- `status`: `active | disabled | merged`
- `merged_into_person_id`
- `created_at`
- `updated_at`

Notes:

- Do not assume a 1:1 relationship with an auth user.
- Do not automatically merge persons.

### `account_identities`

Role:

- Links login methods such as Google, Kakao, Naver, and Email.
- A login identity is not notification consent.

Candidate columns:

- `id`
- `person_id`
- `provider`: `google | kakao | naver | email`
- `provider_user_id`
- `email`
- `linked_at`
- `unlinked_at`
- `status`: `active | unlinked | conflict`

Notes:

- Do not automatically merge persons only because email matches.
- Keep auth provider linking separate from contact verification.

### `contact_points`

Role:

- Stores notification-capable contact candidates.
- Covers phone, email, and Kakao alimtalk targets.

Candidate columns:

- `id`
- `person_id`
- `type`: `phone | email | kakao_alimtalk`
- `value_normalized`
- `status`: `active | disabled | revoked`
- `created_at`
- `updated_at`

Notes:

- Do not store Web Push endpoints here.
- Verification status belongs in a separate table.

### `contact_verifications`

Role:

- Tracks contact verification status history.

Candidate columns:

- `id`
- `contact_point_id`
- `method`: `sms_otp | email_link | kakao_check`
- `status`: `verified | failed | expired | revoked`
- `verified_at`
- `expires_at`
- `created_at`

Notes:

- Verified does not mean consented.

### `notification_consents`

Role:

- Tracks consent by notification type and channel.
- Records consent copy/version history.

Candidate columns:

- `id`
- `person_id`
- `contact_point_id`
- `consent_type`
- `channel`: `kakao_alimtalk | sms | email | web_push`
- `status`: `granted | revoked`
- `copy_version`
- `granted_at`
- `revoked_at`
- `source`

Notes:

- Separate marketing consent from service notification consent.
- Separate consulting connection consent as its own consent type.
- Separate Kakao login consent from Kakao alimtalk consent.

### `reminder_rules`

Role:

- Stores per-person reminder rules.
- Example: experience recall reminders for work record capture.

Candidate columns:

- `id`
- `person_id`
- `reminder_kind`: `experience_recall`
- `cadence`: `daily | weekdays | weekly | custom_days`
- `days_of_week`
- `time_local`
- `timezone`
- `is_enabled`
- `deleted_at`
- `skip_policy`: `always_send | skip_if_today_record_exists | skip_if_weekly_record_exists`
- `created_at`
- `updated_at`

Notes:

- Rules are person-scoped.
- Channel send candidates can be separated into a rule-channel table.

### `reminder_channels`

Role:

- Stores channel priority and fallback settings per reminder rule.

Candidate columns:

- `id`
- `rule_id`
- `channel`: `kakao_alimtalk | sms | email | web_push`
- `priority`
- `contact_point_id`
- `is_enabled`
- `fallback_to_channel`
- `created_at`
- `updated_at`

Notes:

- For Web Push, this may reference a subscription-owner bridge instead of `contact_point_id`.
- Fallback behavior must be sufficiently verified in dry-run before real sending.

### `push_subscriptions`

Role:

- Stores browser/device Web Push subscriptions.
- Assumes the existing table remains in place.

Candidate columns:

- `id`
- `auth_user_id`
- `endpoint`
- `endpoint_hash`
- `p256dh`
- `auth`
- `user_agent`
- `device_label`
- `last_seen_at`
- `revoked_at`
- `created_at`
- `updated_at`

Notes:

- Raw endpoint and keys are sensitive.
- Do not copy them into person-level contacts.

### `web_push_subscription_owners`

Role:

- Bridges `push_subscriptions` to `person_id`.
- Determines which person owns the current browser/device subscription.

Candidate columns:

- `id`
- `person_id`
- `auth_user_id`
- `subscription_id`
- `endpoint_hash`
- `ownership_status`: `active | stale | conflict | revoked`
- `registered_at`
- `last_confirmed_at`
- `revoked_at`
- `conflict_reason`
- `created_at`
- `updated_at`

Notes:

- Only `active` ownership is a live send candidate.
- Exclude `stale`, `conflict`, and `revoked` ownership.
- Do not automatically transfer Web Push subscriptions.
- Do not automatically transfer subscriptions during account merge.

### `notification_delivery_claims`

Role:

- Provides duplicate-send prevention and idempotency.
- Required before scheduler v2 live mode is enabled.

Candidate columns:

- `id`
- `rule_id`
- `person_id`
- `channel`
- `local_slot_key`
- `claim_key`
- `status`: `claimed | sent | skipped | failed`
- `claimed_at`
- `completed_at`

Notes:

- Unique key candidates:
  - `(rule_id, channel, local_slot_key)`
  - `claim_key`
- A provider call must not happen before the ledger/claim write is secured.

### `notification_delivery_logs`

Role:

- Audits real send, skip, and fallback outcomes.

Candidate columns:

- `id`
- `claim_id`
- `person_id`
- `rule_id`
- `channel`
- `decision_status`
- `provider`
- `provider_message_id`
- `failure_code`
- `failure_reason`
- `fallback_from_channel`
- `fallback_to_channel`
- `raw_stored`
- `sent_at`
- `created_at`

Notes:

- Provider raw response storage policy must be decided separately.
- Store the minimum necessary personal or sensitive information.

## Scheduler v2 Read Flow

1. Query due reminder rules.
2. Check person status.
3. Check reminder channel priority.
4. Check contact point.
5. Check contact verification.
6. Check consent.
7. Check provider readiness.
8. Check record guard.
9. Check Web Push ownership.
10. Check duplicate claim.
11. Create delivery claim.
12. Build provider candidate.
13. Generate live send or dry-run result.
14. Record delivery log.

## Dry-run to Live-read Checklist

- Does the DB read model map to the fixture contract decision statuses?
- Is live mode still rejected?
- Are provider calls `0` in dry-run?
- Is message id `null` in dry-run?
- Are ledger writes `0` in dry-run?
- Is the duplicate claim unique constraint candidate decided?
- Are consent revoked, contact unverified, person merged, and Web Push conflict cases excluded from send candidates?
- Is the timezone/local slot calculation standard decided?
- Is fallback evaluated only after provider failure?
- Is the SMS cost path blocked in dry-run?

## Suggested Migration Order

This is a plan only, not an execution step.

1. Read-only schema design review.
2. Migration draft PR.
3. Local migration test.
4. Minimize seed/test data.
5. Dry-run DB read function skeleton.
6. Scheduler v2 DB read-only QA.
7. Delivery claim/idempotency QA.
8. Provider integration in a separate PR.
9. Cron/live transition in the final PR.

## Out of scope

- Writing actual SQL.
- Creating Supabase migrations.
- Editing Edge Functions.
- Editing frontend code.
- Editing service worker code.
- Integrating providers.
- Sending real notifications.
- Configuring cron.
- Deploying production changes.
- Running account merge/backfill.
- Migrating personal information.
