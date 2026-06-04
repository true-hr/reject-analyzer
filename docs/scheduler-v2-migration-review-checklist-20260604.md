# Scheduler v2 Migration Review Checklist

## Purpose

This document defines the pre-apply review criteria for `20260604000000_scheduler_v2_notification_schema.sql`.

The goals are:

- Confirm that the migration draft has no destructive changes.
- Check possible conflicts with existing tables.
- Check possible enum/type name conflicts.
- Review unique and index design.
- Confirm that the `person_id`, account identity, contact, consent, Web Push ownership, and delivery claim structure matches the scheduler v2 design baseline.
- Define when RLS, triggers, functions, backfill, and rollout work must be split into separate PRs.

## Required Checks Before Apply

- Does the production or staging DB already have tables with the same names?
- Does the production or staging DB already have enum/type names with the same names?
- Could the `persons` table name conflict with an existing service domain?
- Does `account_identities` avoid strong coupling to Supabase Auth?
- Does `contact_points` avoid storing Web Push endpoints?
- Does `web_push_subscription_owners` avoid storing raw endpoint, `p256dh`, or `auth` values?
- Is `notification_delivery_claims.claim_key` unique enough for duplicate-send prevention?
- Does the `(rule_id, channel, local_slot_key)` unique index conflict with cadence or local timezone policy?
- Is it still correct not to add an FK to the existing `push_subscriptions` table in this draft?
- Does production apply require a separate decision because this draft has no RLS?
- Is it acceptable for the application to expose currently unused tables after migration apply?

## Intentionally Excluded From This Migration Draft

- RLS policy.
- Trigger/function.
- Automatic `updated_at` refresh trigger.
- Existing user/auth backfill.
- Existing `push_subscriptions` backfill.
- Provider raw response storage policy.
- Edge Function DB read.
- Live scheduler.
- Cron.
- Production apply.

## Table Review Points

### `persons`

Review:

- Is there any risk that this will be misunderstood as 1:1 with `auth.users`?
- Is the `merged_into_person_id` self-reference appropriate?
- Are scheduler skip policies for `disabled` and `merged` person statuses clear?

### `account_identities`

Review:

- Is the active unique index on `(provider, provider_user_id)` appropriate?
- Does the structure avoid encouraging automatic merge by email?
- Can it represent provider unlink and conflict states?

### `contact_points`

Review:

- Does it store only phone, email, and Kakao alimtalk notification targets?
- Does it match the design that separates Web Push endpoints?
- Should duplicate phone/email allow or block policy be defined separately?

### `contact_verifications`

Review:

- Are contact verification state and notification consent state separated?
- Can latest verified state be resolved in the app/function layer?

### `notification_consents`

Review:

- Can service, marketing, and consulting consent be separated by `consent_type`?
- Is the channel-level consent and nullable `contact_point_id` design appropriate?
- Can revoked consent history be preserved?

### `reminder_rules`

Review:

- Is `person_id` the correct scope?
- Does `days_of_week` array validation need a separate rule?
- Is timezone validation better handled in the app/function layer than in DB constraints?
- Is the relationship between soft delete and `is_enabled` clear?

### `reminder_channels`

Review:

- Does the `rule_id + channel` unique index intentionally prevent multiple settings for the same channel?
- Should `fallback_to_channel` be prevented from pointing to itself?
- Does priority duplication need a separate policy?

### `web_push_subscription_owners`

Review:

- Is active `endpoint_hash` uniqueness safe?
- Does it match the policy that `stale`, `conflict`, and `revoked` ownership are excluded from send candidates?
- Is it safe at this stage to avoid an FK to existing `push_subscriptions`?
- Should the reason for nullable `auth_user_id` be documented more explicitly?

### `notification_delivery_claims`

Review:

- Is it clear that claim insert must happen before provider call?
- Are unique `claim_key` and `(rule_id, channel, local_slot_key)` redundant or intentionally complementary?
- Should retry and failure status transitions be documented separately?

### `notification_delivery_logs`

Review:

- Are `provider_message_id` and `raw_stored` enough for audit needs?
- Is it correct to split raw provider response storage policy into a separate document or PR?
- Does the schema reflect the minimum personal/sensitive information storage principle?

## Recommended Steps Before Supabase Apply

1. Migration draft review.
2. DB table, enum, and index name conflict check.
3. RLS policy design document.
4. Migration apply test in local Supabase or a disposable DB.
5. Separate review for rollback/drop script.
6. Staging DB apply.
7. Staging read-only query QA.
8. Edge Function DB read skeleton.
9. Dry-run DB read QA.
10. Live provider and cron as the final stage.

## Next PR Separation Criteria

- RLS policy PR is separate.
- `updated_at` trigger/function PR is separate.
- Existing data backfill PR is separate.
- Edge Function DB read PR is separate.
- Provider integration PR is separate.
- Cron/live transition PR is separate.

## Out of scope

- SQL changes.
- Migration additions or edits.
- Supabase DB apply.
- RLS authoring.
- Trigger/function authoring.
- Edge Function changes.
- Frontend changes.
- Service worker changes.
- Provider integration.
- Real notification sending.
- Cron configuration.
- Production deploy.
- Backfill execution.
