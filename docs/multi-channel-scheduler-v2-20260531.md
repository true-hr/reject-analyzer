# PASSMAP Multi-channel Scheduler v2 Flow

## 1. Background

The current PASSMAP reminder flow is centered on Web Push and existing user_id-based reminder tables. Web Push should remain available as an auxiliary channel, but the long-term operating model is a person_id-based multi-channel flow combining Kakao Alimtalk, SMS fallback, Email, and Web Push.

The scheduler v2 design prepares the transition from user_id-centered reminders to person_id-centered reminders. It depends on the concepts from the merged notification and identity work:

- PR #682: Web Push remains the current operating channel; Kakao/SMS are not immediate integrations.
- PR #683: PASSMAP person ownership is based on person_id; provider account linking requires explicit user consent.
- PR #685: notification_contacts and person_consents are separate models.
- PR #687: person_id identity and notification contact SQL exists as draft-only storage.
- PR #689: reminder_rules_v2 SQL exists as draft-only storage.

The SQL from PR #687 and PR #689 is draft-only. It has not been applied to any remote database.

## 2. Scheduler v2 responsibilities

Scheduler v2 is responsible for:

- Querying due reminder_rules_v2 candidates.
- Evaluating notification targets by person_id.
- Processing reminder_rule_channels_v2 in priority order.
- Looking up notification_contacts for the selected person and channel.
- Checking person_consents before any send decision.
- Creating a delivery claim before provider execution.
- Branching between dry-run and live behavior.
- Recording per-channel results in reminder_deliveries_v2.
- Recording fallback decisions and fallback results.

## 3. Scheduler v2 non-goals

Scheduler v2 does not:

- Create person_id records or perform account linking.
- Verify notification contacts.
- Collect, update, or revoke consent.
- Configure Kakao/SMS providers.
- Turn off the existing weekly cron.
- Backfill existing user_id data.
- Apply DB migrations.

## 4. Processing flow

### 4.1 Due rules query

The scheduler queries reminder_rules_v2 rows where:

- is_enabled = true
- deleted_at is null

It then evaluates each candidate against cadence, days_of_week, time_local, and timezone to determine whether the rule belongs to the current local slot.

Example local slot key:

```text
2026-05-31T18:00@Asia/Seoul
```

### 4.2 Local slot calculation

For each rule, the scheduler calculates local date and local time using the rule timezone. Cadence handling:

- daily: eligible every local day.
- weekdays: eligible Monday through Friday in the rule timezone.
- weekly: eligible only when the current local day matches the single configured days_of_week value.
- custom_days: eligible when the current local day is included in days_of_week.

The scheduler run interval and lookback window are operational settings, not schema responsibilities. The calculated slot key is used with the delivery ledger to prevent duplicate sends for the same local slot.

### 4.3 Channel priority query

For each due rule, the scheduler queries reminder_rule_channels_v2 by rule_id and selects enabled channel rows. Channels are processed by ascending priority.

A configured fallback target, such as a future fallback_to_channel field or an enabled lower-priority fallback channel, is treated as a fallback candidate only. It is not sent at the same time as the primary channel.

### 4.4 Notification contact query

The scheduler queries notification_contacts by person_id and channel. The destination is never stored in reminder_rule_channels_v2. It is read only from notification_contacts.

Contact eligibility checks:

- Contact must not be disabled.
- Contact must match the requested channel.
- Contact must be verified, or verified_at must exist under the approved verification policy.
- If more than one verified contact exists, prefer is_primary = true.
- If no primary contact exists, choose the latest verified active contact.

The exact tie-break rule should be finalized before live implementation, but scheduler v2 must keep destination ownership inside notification_contacts.

### 4.5 Consent check

The scheduler checks person_consents by person_id and consent_type.

Common required consent candidates for experience reminders:

- service_notification
- experience_recall_reminder

Channel-specific consent candidates:

- web_push_device
- kakao_alimtalk
- sms_notification
- sms_fallback
- email_notification

marketing_notification is separate from service reminders and must not be treated as permission for service notification delivery.

If consent is missing, revoked, or expired, the scheduler records a skipped result. It does not call the provider.

### 4.6 Delivery claim

Before calling any provider, the scheduler creates a reminder_deliveries_v2 claim.

Unique key candidate:

- reminder_rule_id
- channel
- local_slot_key
- contact_id or contact snapshot key

If a claim already exists, the scheduler skips the attempt as a duplicate.

Creating the claim before provider execution prevents duplicate sends when scheduler workers overlap, retry, or run with a lookback window. The tradeoff is that a provider call failure after claim creation needs clear retry semantics so the ledger does not permanently block valid retries.

### 4.7 Dry-run handling

The default mode is dry-run.

Dry-run behavior:

- Do not call any real provider.
- Do not send Kakao Alimtalk.
- Do not send SMS.
- Do not send Web Push.
- Do not send Email.
- Record wouldSend, wouldSkip, and fallbackWouldRun decisions in result_json.

Dry-run verifies rule selection, channel priority, contact availability, consent checks, claim behavior, and fallback decisions without sending messages.

### 4.8 Live handling

Live mode requires explicit approval after all conditions are complete:

- DB migration apply completed.
- RLS verification completed.
- Contact verification UX completed.
- Consent and withdrawal UX completed.
- Provider credential/env approval completed.
- Kakao template approval completed.
- Sender number registration completed.
- Privacy processing delegation notice reviewed.
- Existing weekly cron cutover plan approved.
- Explicit production live approval completed.

Without these conditions, scheduler v2 must remain dry-run only.

### 4.9 Channel adapter handling

Web Push:

- Uses existing push_subscriptions as the current basis.
- Remains an auxiliary channel.
- Click behavior can be unstable across environments and should not be the only critical delivery path.

Kakao Alimtalk:

- Uses approved templates.
- The actual adapter is a future task.
- This document only drafts the scheduler-side call contract: channel, contact, consent result, template variables, mode, and idempotency key.

SMS:

- Candidate fallback after Kakao failure.
- Requires sender number registration and recipient consent.
- Must remain separate from advertising or marketing messages.

Email:

- Auxiliary channel.
- More suitable for summaries and reports than immediate reminders.

### 4.10 Fallback handling

Kakao Alimtalk failure may produce an SMS fallback candidate.

Fallback execution conditions:

- Primary channel provider failure occurred.
- Fallback channel is enabled.
- Fallback contact is verified.
- Fallback consent is granted.
- No duplicate delivery exists for the fallback slot.

Fallback non-execution reasons must also be recorded in result_json.

Missing contact or missing consent is not provider failure. Those cases should be separated from fallback conditions and recorded as skipped decisions.

### 4.11 result_json draft

```json
{
  "mode": "dry_run | live",
  "localSlotKey": "2026-05-31T18:00@Asia/Seoul",
  "rule": {
    "id": "...",
    "personId": "...",
    "reminderKind": "experience_recall",
    "cadence": "daily"
  },
  "channel": {
    "name": "kakao_alimtalk",
    "priority": 1,
    "contactId": "...",
    "consentTypesChecked": []
  },
  "decision": {
    "status": "would_send | sent | skipped | failed",
    "reason": "..."
  },
  "provider": {
    "name": "solapi | naver_sens | nhn_cloud | web_push | email",
    "messageId": null,
    "rawStored": false
  },
  "fallback": {
    "attempted": false,
    "channel": "sms",
    "reason": null
  }
}
```

Provider raw response storage requires privacy and log-retention approval before live use.

### 4.12 skip_policy and record guard

The default skip_policy is none.

Users can configure multiple reminders in a day. If the system silently blocks reminders because a record already exists, behavior becomes hard to predict.

Future option candidates:

- skip_if_record_exists_today
- skip_if_weekly_record_exists

Record guard is not required for v1 live. It remains a future option that requires UI copy, scheduler behavior, and user expectation review.

### 4.13 Existing weekly cron and cutover principles

This document does not turn off the existing weekly reminder flow.

The existing user_id-based weekly cron and scheduler v2 must not both be live at the same time. Cutover is a separate Protected task.

Before cutover, PASSMAP needs:

- person_id backfill strategy.
- Existing reminder_preferences migration strategy.
- Rollback plan.
- Duplicate prevention verification.

## 5. Guardrails

The following are explicitly forbidden in this documentation task:

- Supabase SQL Editor execution.
- Supabase CLI db push/apply.
- Remote DB apply.
- Existing data backfill.
- Edge Function implementation.
- Edge Function deploy.
- Kakao/SMS adapter implementation.
- Kakao/SMS API integration.
- SMS sending.
- KakaoTalk/Alimtalk sending.
- Cron changes.
- Vercel/Supabase deploy.
- Production setting changes.
- Deleting, modifying, or disabling the existing weekly reminder structure.

## 6. Next actions

1. Document reminder settings UI copy and UX.
2. Review Protected DB migration promotion conditions.
3. Finalize contact verification and consent withdrawal UX.
4. Plan scheduler v2 dry-run Edge Function implementation.
5. Compare providers and prepare Kakao/SMS PoC.
6. Proceed with DB apply, cron changes, or live sending only after separate explicit approval.
