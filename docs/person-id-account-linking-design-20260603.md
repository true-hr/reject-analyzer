# PASSMAP person_id Account Linking Design

## 1. Purpose

This document defines the baseline design for using `person_id` as PASSMAP's real person-level identifier.

Supabase Auth `auth.users.id` identifies a login account and session. Google, Kakao, and Naver login can each create a different `auth.users.id`, even when the user is the same real person from the product perspective.

PASSMAP needs a separate `person_id` because long-term product state should be owned by the person, not by one provider login account. Notification rules, notification contacts, consent state, account linking state, and future scheduler v2 delivery ownership should converge on `person_id`.

This document is a design baseline only. It is not a DB migration, Supabase Auth configuration change, account-linking implementation, provider integration, data backfill, cron change, or production change.

## 2. Current Problem

The same PASSMAP user can sign in through multiple providers:

- Google login creates or uses one Supabase Auth user id.
- Kakao login can create or use a different Supabase Auth user id.
- Naver login can create or use a different Supabase Auth user id.

Supabase Auth can therefore see these as different `auth.users.id` rows. PASSMAP, however, needs the person's records, notification contacts, consents, reminder rules, and account-linking settings to be managed as one product account when the user explicitly links those provider accounts.

Without a person-level identity layer:

- records can appear fragmented by login provider;
- notification contacts can be duplicated or isolated;
- consent can be interpreted inconsistently;
- scheduler v2 can evaluate reminders for the wrong account scope;
- existing Web Push subscriptions can be incorrectly treated as transferable when they are actually tied to a browser/device and auth context.

## 3. Non-goals

This document does not include:

- DB apply;
- migration execution;
- Supabase Auth provider configuration changes;
- Kakao login implementation;
- Naver login implementation;
- automatic account merge implementation;
- existing subscription transfer;
- existing user data mutation or backfill;
- Edge Function changes;
- frontend implementation;
- production changes.

## 4. Core Principles

- Do not automatically merge by email, name, or phone number.
- Do not automatically merge provider accounts.
- Do not link accounts without explicit user consent.
- Do not arbitrarily transfer existing push subscriptions.
- Treat `auth.users.id` as a login session and provider-auth identifier.
- Treat `person_id` as PASSMAP's internal real person identifier.
- Long-term notification contacts, notification consents, and reminder rules should be `person_id`-based.
- Provider email, provider phone, and provider display name are evidence fields, not automatic merge keys.
- Contact verification and provider account linking are separate flows.
- Existing `user_id`-based data remains unchanged until a protected migration/backfill plan is approved.

## 5. Schema Draft

This section is a schema draft, not SQL. It intentionally does not define migrations, indexes, RLS policies, triggers, or constraints.

### persons

Purpose: PASSMAP person-level root.

Candidate fields:

- `id`
- `primary_user_id`
- `display_name`
- `primary_email`
- `primary_phone`
- `created_at`
- `updated_at`

Notes:

- `primary_user_id` points to the current primary Supabase Auth user candidate.
- `primary_email` and `primary_phone` are display/contact candidates, not merge keys by themselves.
- Deletion, anonymization, and withdrawal behavior need a separate privacy review.

### linked_auth_users

Purpose: links one or more provider auth users to one PASSMAP person.

Candidate fields:

- `id`
- `person_id`
- `auth_user_id`
- `provider`
- `provider_email`
- `provider_phone`
- `is_primary`
- `linked_at`

Provider candidates:

- `google`
- `kakao`
- `naver`
- `email`
- `unknown`

Notes:

- One `auth_user_id` should not be active under multiple `person_id` values.
- Already-linked provider accounts require conflict handling, not automatic merge.
- Provider email and phone are useful for display and review, but must not become automatic merge keys.
- Linking should record who approved the link and from which UX surface in a later implementation design.

### notification_contacts

Purpose: person-owned notification destination candidates.

Candidate fields:

- `id`
- `person_id`
- `channel`
- `destination`
- `destination_hash` or `masked_destination`
- `is_verified`
- `is_primary`
- `verified_at`
- `created_at`
- `updated_at`

Channel candidates:

- `kakao`
- `sms`
- `email`
- `web_push`

Notes:

- `destination` can be a phone number, email address, provider-specific destination, or push reference candidate.
- Raw destination storage, hashing, masking, and retention need privacy review.
- A verified phone number does not automatically link Kakao or Naver accounts.
- For Web Push, the destination should likely reference a subscription or mapping instead of copying raw endpoint details into a person-level contact row.

### person_consents or notification_consents

Purpose: person-owned consent state for service notifications, channel-specific delivery, and related notices.

Candidate fields:

- `id`
- `person_id`
- `consent_type`
- `status`
- `agreed_at`
- `revoked_at`
- `source`
- `created_at`
- `updated_at`

Consent type candidates:

- `service_notification`
- `experience_recall_reminder`
- `kakao_alimtalk`
- `sms_notification`
- `sms_fallback`
- `email_notification`
- `web_push_device`
- `marketing_notification`
- `privacy_processing_delegation_notice`

Notes:

- Marketing consent must remain separate from service notification consent.
- SMS fallback consent must be checked separately from primary Kakao consent.
- Consent withdrawal must stop future delivery decisions for the affected channel/type.

### reminder_rules_v2

Purpose: person-owned reminder rule definition for scheduler v2.

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
- `created_at`
- `updated_at`

Notes:

- `reminder_rules_v2` decides when and what to remind.
- Channel priority, destination lookup, and consent checks stay outside the rule table.
- Notification destination should come from `notification_contacts`.
- Consent should come from `person_consents` or `notification_consents`.
- The existing weekly cron and scheduler v2 must not both be live without an approved cutover plan.

## 6. Account Linking UX Draft

Example copy:

```text
현재 Google로 로그인 중입니다. Kakao/Naver 계정을 연결하면 같은 PASSMAP 계정으로 기록과 알림을 함께 관리할 수 있습니다.
```

CTA candidates:

- `카카오 계정 연결`
- `네이버 계정 연결`
- `휴대폰 번호 인증`

UX requirements:

- Before linking, clearly explain what account will be connected.
- Before linking, clearly explain which records, notification settings, contacts, and consent states will be managed under the same `person_id`.
- Do not imply that phone verification is the same as Kakao or Naver account linking.
- Do not merge accounts just because provider email, name, or phone appears similar.
- After linking, show which provider accounts are connected to the current `person_id`.
- Account unlinking, withdrawal, and conflict resolution require separate design.

## 7. Existing Data Transition Strategy

Existing `user_id`-based data should not be changed immediately.

Recommended staged strategy:

1. Define the `persons` creation strategy.
2. Define the `linked_auth_users` backfill strategy for existing auth users.
3. Identify candidate transitions for `reminder_preferences`, `reminder_rules`, and `push_subscriptions` toward `person_id`.
4. Keep existing weekly cron and new scheduler v2 from being live at the same time.
5. Review RLS, rollback, privacy impact, and data impact before any migration.

Important constraints:

- No existing user data should be moved in this documentation task.
- No existing subscription should be transferred in this documentation task.
- Backfill requires a separate Protected DB task.
- Rollback must define how to return to `user_id`-based behavior if person mapping fails.

## 8. Notification Structure Connection

Long-term notification ownership should be person-based:

- `notification_contacts` is `person_id`-based.
- `notification_consents` or `person_consents` is `person_id`-based.
- `reminder_rules_v2` is `person_id`-based.
- Kakao, SMS, Web Push, and Email are channel candidates attached to a person's verified contacts and consents.

Web Push needs special treatment:

- A push subscription is device/browser-specific.
- Existing push subscriptions are currently tied to auth/user context.
- Future mapping may need `person_id + auth_user_id + endpoint` or a separate subscription ownership bridge.
- Existing subscription ownership must not be moved automatically.

Scheduler v2 relation:

- Scheduler v2 should evaluate due rules by `person_id`.
- Scheduler v2 should read notification contacts by `person_id` and channel.
- Scheduler v2 should check consent by `person_id` and consent type.
- Scheduler v2 must remain dry-run only until DB/RLS/provider/cutover conditions are approved.

## 9. Risk Areas

- False positive automatic merge.
- Same email can belong to different people or contexts.
- Provider email can be missing, unverified, hidden, or later changed.
- Phone numbers can be reused.
- Provider display names are not identity proof.
- Account unlinking, withdrawal, and consent revocation can change ownership assumptions.
- RLS complexity increases when one person has multiple auth users.
- Existing `user_id`-based data and future `person_id`-based data can coexist temporarily.
- Existing Web Push subscription ownership can be mishandled during transition.
- A compromised session could attempt to link an attacker's provider account to another person's `person_id`.

## 10. Live Application Preconditions

Before live application, all of the following must be complete:

- schema and RLS review;
- migration rollback plan;
- existing data backfill plan;
- account-linking UX approval;
- consent and withdrawal UX approval;
- privacy processing scope review;
- staging verification;
- Protected DB task approval;
- Supabase production change approval.

Additional notification-specific preconditions:

- contact verification policy approval;
- provider credential and sender policy approval for Kakao/SMS;
- existing weekly cron and scheduler v2 cutover approval;
- Web Push subscription ownership transition review.

## 11. Next Steps

Possible follow-up PRs:

- `person_id` schema draft PR;
- RLS and rollback review document;
- `reminder_rules_v2` `person_id` transition design;
- account-linking UI design;
- `notification_contacts` and consent model detail;
- Web Push subscription ownership bridge design.

## 12. Guardrails

This document does not authorize:

- DB or SQL changes;
- Supabase Auth setting changes;
- env or secret usage;
- provider API or SDK usage;
- production setting changes;
- actual account linking;
- existing user data migration;
- existing subscription transfer;
- Supabase deploy;
- cron changes;
- actual message sending.
