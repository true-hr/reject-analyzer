# Scheduler v2 RLS Policy Design

## Purpose

This document defines the RLS policy design baseline for the scheduler v2 notification schema before applying it to the real Supabase database.

Goals:

- Define user data access boundaries by `person_id`.
- Support a model where Google, Kakao, and Naver auth users can be linked to the same `person_id`.
- Separate login identity from notification contact details.
- Separate contact verification from notification consent.
- Protect Web Push subscription ownership safely.
- Separate scheduler Edge Function/service role access from normal client access.
- Provide review criteria before writing actual RLS SQL.

## Highest-priority principles

- Normal users can read only data connected to their own person.
- Normal users cannot read another person's contact, consent, reminder, or delivery log data.
- `account_identities` can expose only the user's own linking state, and must not expose another user's provider identity.
- Raw contact values such as phone and email must be minimally exposed.
- Web Push raw `endpoint`, `p256dh`, and `auth` values must not be exposed to normal clients.
- `web_push_subscription_owners` can expose only limited ownership state such as `active`, `stale`, `conflict`, or `revoked`.
- Delivery claim/log tables should be service role only by default.
- Scheduler live/dry-run Edge Functions should be reachable only through service role or server-side paths.
- RLS must not be used to solve automatic account/person merge.
- Account linking requires an explicit UX and server-side verification flow.

## Actors

### Anonymous user

Pre-login user.

- Default access to notification schema tables: none.
- Anonymous access should not reveal whether a person, contact, subscription, reminder, claim, or log exists.

### Authenticated user

Supabase auth user.

- Access should be limited to the `person_id` range connected through `account_identities.auth_user_id` or provider identity mapping.
- Access to contact, consent, reminder, and ownership data must be scoped through that person mapping.

### Linked person member

A user logged in with one of the Google, Kakao, or Naver auth identities connected to the same `person_id`.

- Can see reminder, contact, and consent settings for the same person.
- Sensitive values for other provider identities must remain limited.
- Linking state can be visible as a summary, but provider-specific raw identifiers should not be exposed.

### Scheduler service role

Server-side authority used by the scheduler Edge Function.

- Can read due rules.
- Can check contact, consent, and Web Push ownership state.
- Can create delivery claims before provider calls.
- Can write delivery logs after provider attempts.
- Can use live and dry-run paths only from trusted server-side execution.

### Admin/operator

Operational administrator.

- Direct access is not opened in the default RLS scope.
- If needed, admin access should be separated into explicit admin policies or Supabase dashboard operating procedures.

## Table-by-table RLS design criteria

### `persons`

Client read:

- Allow only the person connected to the current user.

Client insert:

- Do not allow direct client insert.
- Prefer server-side person creation.

Client update:

- Do not allow status or merge changes from the client.
- Display-level settings should be handled later in a separate future table if needed.

Client delete:

- Do not allow client delete.

Service role:

- Allow service role access.

Review points:

- `merged` and `disabled` persons must be skipped by the scheduler.
- Merge state changes require a separate server-side account linking flow.

### `account_identities`

Client read:

- Allow only a limited identity list for the current user's own person.
- Restrict full `provider_user_id` exposure.

Client insert/update/delete:

- Do not allow direct client writes.
- Use a server-side account linking flow.

Service role:

- Allow linking, unlinking, and conflict handling.

Review points:

- Do not auto-merge accounts by email or name only.
- Provider identity conflicts must be handled server-side.

### `contact_points`

Client read:

- Allow only contact points for the current user's own person.
- Review whether `value_normalized` needs masking before exposure.

Client insert/update:

- Do not allow direct client writes by default.
- Prefer server-side creation through a verification flow.

Client delete:

- Prefer `disabled` or `revoked` state changes over direct hard delete.

Service role:

- Allow service role access.

Review points:

- Do not store Web Push endpoints in `contact_points`.
- Phone, email, and Kakao contacts require separate checks for verification state and consent state.

### `contact_verifications`

Client read:

- Allow only verification summaries for contacts owned by the current user's own person.

Client insert/update:

- Keep verification creation and mutation server-side only.

Client delete:

- Do not allow client delete.

Service role:

- Allow service role access.

Review points:

- Raw verification tokens or codes must never be exposed.
- Latest verified status should be determined in the function layer.
- Expired and failed history exposure should be minimized.

### `notification_consents`

Client read:

- Allow current user's own consent state.

Client insert/update:

- Prefer grant/revoke through a server-side endpoint.

Client delete:

- Do not allow delete.
- Preserve consent history.

Service role:

- Allow service role access.

Review points:

- Separate marketing, service, and consulting consent.
- Preserve `copy_version`.
- Preserve revoked history.

### `reminder_rules`

Client read:

- Allow only reminder rules for the current user's own person.

Client insert/update:

- Allow only for the current user's own person if a client write path is introduced.
- Require server-side validation before relying on client writes.

Client delete:

- Do not use hard delete.
- Prefer `deleted_at` soft delete.

Service role:

- Allow service role access.

Review points:

- Validate `time_local`, `timezone`, and `days_of_week`.
- Scheduler must exclude disabled or soft-deleted rules.

### `reminder_channels`

Client read:

- Allow only channels belonging to reminder rules owned by the current user's own person.

Client insert/update:

- Allow only for the current user's own rule if a client write path is introduced.
- Validate channel ownership and contact ownership server-side.

Client delete:

- Prefer setting `is_enabled` to false over hard delete.

Service role:

- Allow service role access.

Review points:

- Prevent `fallback_to_channel` self-reference.
- Verify `contact_point_id` belongs to the current user's own person.

### `web_push_subscription_owners`

Client read:

- Allow only limited ownership summary for the current auth user or linked person.
- Minimize exposure of `endpoint_hash`.
- Expose state only as needed, such as `active`, `stale`, `conflict`, or `revoked`.

Client insert/update:

- Do not allow direct client writes.
- Use a current-device registration server-side/API flow.

Client delete:

- Prefer `revoked` state over direct delete.

Service role:

- Allow service role access.

Review points:

- Only `active` ownership can be a send candidate.
- `stale`, `conflict`, and `revoked` ownership must be excluded from sends.
- Do not automatically transfer subscriptions during account merge.
- Raw Web Push endpoint, `p256dh`, and `auth` values must not be exposed to normal clients.

### `notification_delivery_claims`

Client read:

- Deny by default.
- If a product history surface is later required, expose only a restricted summary through a separate reviewed path.

Client insert/update/delete:

- Do not allow client writes.

Service role:

- Allow service role access.

Review points:

- Claim insert must succeed before any provider call.
- Duplicate claims should be handled by unique constraints and service role flow.

### `notification_delivery_logs`

Client read:

- Deny by default.
- If user-visible notification history is needed, expose only a separate summary view for the current user's own person.

Client insert/update/delete:

- Do not allow client writes.

Service role:

- Allow service role access.

Review points:

- Do not expose provider message IDs or raw provider responses.
- Store the minimum necessary personal or sensitive data.

## Recommended RLS implementation order

This document does not write SQL. Future implementation should proceed in this order:

1. Complete schema migration draft review.
2. Test schema apply in a local or disposable database.
3. Draft an RLS enable migration.
4. Confirm service role paths.
5. Add minimal client read-only policies.
6. Add client write policies later, after server-side endpoints exist.
7. Start delivery claim/log tables as service role only.
8. Test auth user to person mapping in staging.
9. Prepare rollback or disable plan before production apply.

## Pre-application RLS test scenarios

- Anonymous user cannot access any notification schema table.
- Google login user A can read only person A data.
- Kakao login user A can read the same reminder rules after being linked to the same person.
- Naver login user B cannot read person A data.
- User A cannot read user B's `contact_points`.
- User A cannot directly insert into `notification_delivery_claims`.
- Scheduler service role can read due `reminder_rules`.
- Scheduler service role can insert into `notification_delivery_claims`.
- Revoked consent history is not deleted from the client-visible model.
- Web Push conflict ownership does not appear to the client as a send candidate.

## Out of scope

- RLS SQL writing.
- Migration file changes.
- Supabase DB apply.
- Policy apply.
- Auth provider linking implementation.
- Account merge or backfill.
- Edge Function changes.
- Frontend changes.
- Provider/live sending.
- Cron setup.
- Production deploy.
