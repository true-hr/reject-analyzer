# PASSMAP reminder_rules_v2 person_id Design

## 1. Purpose

This document defines the design baseline for rebuilding PASSMAP reminder rules around `person_id`.

The existing `user_id`-based `reminder_rules` candidate should not be applied directly to production because PASSMAP's long-term owner model is a real person, not a single provider login account. Google, Kakao, and Naver sign-in can create different Supabase Auth `auth.users.id` values for the same person. After account linking, the user's reminder rules must continue to belong to the same PASSMAP person.

`reminder_rules_v2` should therefore be designed around `person_id`, the internal PASSMAP person identifier. This keeps notification rules stable across linked provider accounts and aligns scheduler v2 with notification contacts, consent state, and delivery ledger ownership.

This document is a design baseline only. It is not a DB migration, SQL apply, RLS implementation, Edge Function change, scheduler live cutover, cron change, provider integration, or production change.

## 2. Current State

- The PR #679 `reminder_rules`, `reminder_rule_deliveries`, and scheduler draft are preparation material, not an operating production apply target.
- The existing `supabase/sql/20260531_reminder_rules.sql` candidate is `user_id`-based and explicitly protected from DB apply without approval.
- Scheduler v2 currently runs as a dry-run/mock contract evaluator.
- Scheduler v2 fixtures already use `personId` in result JSON.
- The provider dry-run adapter has been implemented for Kakao Alimtalk primary and SMS fallback metadata.
- The dry-run response contract documents optional `providerDryRun`.
- `live` mode remains rejected.
- Actual DB apply, provider calls, ledger writes, cron cutover, and production scheduler live operation remain prohibited.

## 3. Non-goals

This document does not include:

- DB migration authoring;
- SQL apply;
- RLS implementation;
- Edge Function modification;
- frontend notification UI implementation;
- existing weekly cron changes;
- new scheduler cron creation;
- real Kakao, SMS, Web Push, or Email sending;
- production changes.

## 4. Core Design Principles

- The long-term owner of a reminder rule is `person_id`, not `auth.users.id`.
- `auth.users.id` identifies a login account and provider-auth session.
- `person_id` identifies the real PASSMAP person.
- Multiple auth users can be linked under one `person_id`.
- Reminder rule timing is separate from notification channel selection.
- Reminder rules are separate from notification contacts and consent.
- Existing `user_id`-based data remains unchanged until an approved migration/backfill plan exists.
- The existing weekly cron and scheduler v2 must not both run live at the same time.
- Scheduler v2 must keep dry-run behavior until DB, RLS, provider, and cutover approvals are complete.

## 5. reminder_rules_v2 Schema Draft

This is a schema draft, not SQL.

Purpose: define when and what to remind for one PASSMAP person.

Candidate fields:

- `id`
- `person_id`
- `reminder_kind`
- `cadence`
- `days_of_week`
- `time_local`
- `timezone`
- `label`
- `is_enabled`
- `skip_policy`
- `created_at`
- `updated_at`
- `deleted_at`

`reminder_kind` candidates:

- `experience_recall`
- `weekly_summary`
- `future_custom`

`cadence` candidates:

- `daily`
- `weekdays`
- `weekly`
- `custom_days`

`skip_policy` candidates:

- `none`
- `skip_if_record_exists_today`
- `skip_if_weekly_record_exists`

Notes:

- `person_id` is the owner key.
- `reminder_rules_v2` should not store destination addresses, phone numbers, provider ids, or consent state.
- `timezone` must be stored per rule.
- `deleted_at` is a soft-delete candidate so scheduler v2 can ignore deleted rules without hard deletion.
- The default `skip_policy` should be `none` for v1.

## 6. reminder_rule_channels Schema Draft

This is a schema draft, not SQL.

Purpose: separate reminder rule timing from actual delivery channel ordering.

Candidate fields:

- `id`
- `reminder_rule_id`
- `channel`
- `priority`
- `is_enabled`
- `fallback_role`
- `created_at`
- `updated_at`

`channel` candidates:

- `kakao_alimtalk`
- `sms`
- `email`
- `web_push`

`fallback_role` candidates:

- `primary`
- `fallback`
- `optional`

Example:

- Rule: every day at 18:00 before leaving work, remind the user to record experience.
- Primary channel: `kakao_alimtalk`.
- Fallback channel: `sms`.
- Optional channel: `web_push`.

Notes:

- Channel rows define preference and fallback intent only.
- Actual destination lookup must happen through `notification_contacts`.
- Actual consent checks must happen through `person_consents` or `notification_consents`.
- The scheduler must process enabled channels in priority order.
- A fallback channel is not sent at the same time as the primary channel.

## 7. reminder_deliveries_v2 Schema Draft

This is a schema draft, not SQL.

Purpose: candidate delivery ledger for duplicate prevention and result recording after live approval.

Candidate fields:

- `id`
- `person_id`
- `reminder_rule_id`
- `local_slot_key`
- `channel`
- `status`
- `provider`
- `provider_message_id`
- `result_json`
- `created_at`
- `updated_at`

`status` candidates:

- `claimed`
- `dry_run_would_send`
- `fallback_would_run`
- `fallback_would_skip`
- `sent`
- `failed`
- `skipped`

Important constraints:

- Dry-run must not write ledger rows.
- Actual delivery writes remain prohibited until live approval.
- Duplicate claim policy needs separate RLS and unique-index review.
- The unique key should protect against duplicate sends for the same person, rule, channel, and local slot.
- `result_json` can preserve scheduler decisions, provider dry-run metadata, provider result metadata, fallback reason, and skip reason.
- Provider raw response storage needs privacy and retention review before live use.

## 8. Relationship to Contacts and Consents

The person-based notification model separates four responsibilities:

- `reminder_rules_v2`: when and what to remind.
- `reminder_rule_channels`: which channel order to try.
- `notification_contacts`: where to send.
- `person_consents` or `notification_consents`: whether sending is allowed.

Scheduler v2 must combine these by `person_id`:

1. Find due `reminder_rules_v2` rows for a person.
2. Load enabled `reminder_rule_channels` in priority order.
3. Look up a verified `notification_contacts` destination for the person's channel.
4. Check required consent types for the person and channel.
5. In dry-run, return `would_send`, `would_skip_*`, `fallback_would_run`, or `fallback_would_skip` without side effects.
6. In live mode, proceed only after DB/RLS/provider/cron approvals are complete.

## 9. Record Guard Policy

Recommended v1 policy: no record guard.

Rationale:

- Users can configure multiple reminders.
- If the system silently suppresses a reminder because a record already exists, behavior becomes hard to predict.
- For MVP, if a user-configured reminder is due and allowed, sending is more intuitive.
- Record-guard behavior should be a user-visible option, not an implicit backend rule.

Future `skip_policy` candidates:

- `skip_if_record_exists_today`
- `skip_if_weekly_record_exists`
- `skip_if_ai_inbox_has_candidate_today`

Each future policy requires UI copy, scheduler behavior, analytics, and user expectation review.

## 10. Cadence Policy

`daily`:

- eligible every local day at `time_local`.

`weekdays`:

- eligible Monday through Friday at `time_local`.

`weekly`:

- eligible on one configured weekday at `time_local`.

`custom_days`:

- eligible when the local weekday is included in `days_of_week`.

Notes:

- `timezone` must be stored per rule.
- UTC conversion should happen at scheduler execution time.
- Scheduler should calculate a stable `local_slot_key`.
- DST and timezone rule changes need separate review.
- The lookback window must avoid missing due rules without creating duplicate sends.

## 11. Existing user_id Data Transition Strategy

Stage 1:

- Keep current `user_id`-based `reminder_preferences` and `reminder_rules` candidates as-is.
- Do not DB apply the existing `user_id`-based candidate.

Stage 2:

- Finalize `person_id` and `linked_auth_users` design.

Stage 3:

- Review creating a default person row for each existing auth user.

Stage 4:

- Review a backfill strategy for existing weekly `reminder_preferences` into `person_id`-based rules.

Stage 5:

- Write a `reminder_rules_v2` migration draft.

Stage 6:

- Promote only after RLS, rollback, privacy, data impact, and Protected DB review.

Constraints:

- No existing data is moved in this documentation task.
- No existing subscription is transferred in this documentation task.
- No cron is changed in this documentation task.
- No scheduler live mode is enabled in this documentation task.

## 12. Connection to Scheduler v2 Dry-run

The current scheduler v2 contract already models fixture rules with `personId`.

Dry-run contract alignment:

- `providerDryRun` is optional metadata for Kakao/SMS dry-run evaluation.
- Dry-run side-effect counters remain zero.
- `providerCalls`, `messagesSent`, and `ledgerWrites` remain `0`.
- `live` mode remains rejected.
- Actual DB-based due rule lookup is not implemented yet.

Before scheduler v2 DB-query implementation, PASSMAP needs:

- approved `person_id` schema direction;
- approved `reminder_rules_v2` schema/RLS direction;
- approved contacts and consent schema direction;
- backfill and rollback plans;
- a clear dry-run DB query implementation scope.

## 13. Risk Areas

- Mixed `user_id` and `person_id` ownership during transition.
- Duplicate reminder creation when the same person logs in with multiple providers.
- Duplicate sending if the existing weekly cron and scheduler v2 are both live.
- Incorrect Web Push endpoint ownership transfer.
- Missing consent-revoked checks.
- Incorrect duplicate-ledger unique key design.
- Timezone or lookback-window errors.
- Soft-deleted rules accidentally evaluated.
- RLS complexity from `linked_auth_users` ownership predicates.
- Provider dry-run metadata being mistaken for live approval.

## 14. Live Application Preconditions

Live application requires all of the following:

- `person_id` schema finalized.
- `linked_auth_users` schema finalized.
- `notification_contacts` and consent schema finalized.
- `reminder_rules_v2` schema and RLS reviewed.
- `reminder_deliveries_v2` unique key and rollback reviewed.
- Existing data backfill plan completed.
- Existing weekly cron off plan completed.
- Scheduler v2 cron on plan completed.
- Staging dry-run PASS.
- Protected DB approval.
- Supabase production change approval.
- Provider live approval.
- Cost and quota policy finalized.

Without these approvals, scheduler v2 remains dry-run/mock only.

## 15. Next Steps

Possible next work items:

- `reminder_rules_v2` SQL draft PR.
- `reminder_deliveries_v2` unique key and RLS review document.
- `notification_contacts` and consent detail design.
- Scheduler v2 DB-query dry-run implementation.
- Account-linking UI design.
- Notification settings UI v2 design.

## 16. Guardrails

This document does not authorize:

- DB or SQL changes;
- Edge Function changes;
- frontend changes;
- env or secret usage;
- Supabase deploy;
- cron changes;
- production changes;
- provider API calls;
- provider SDK installation;
- Kakao, SMS, Web Push, or Email sending;
- existing data backfill;
- existing subscription transfer.
