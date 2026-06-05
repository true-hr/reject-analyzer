# Scheduler v2 RLS Read-only Policy Draft

## Purpose

This document defines the RLS enable/read-only policy draft design baseline for the scheduler v2 notification schema.

Goals:

- Define which tables should have RLS enabled.
- Define which tables should start as service role only.
- Define which tables can be considered for minimal client read-only policy.
- Keep most client write policy work as a later step.
- Make the `person_id`-based access principle concrete enough for a future RLS draft.
- Provide review criteria before writing an actual SQL migration.

## Current status

- The scheduler v2 RLS policy design document already exists.
- The local DB apply retry is currently `BLOCKED` by Docker daemon availability.
- Docker recovery is deferred.
- Production/staging DB apply is still prohibited.
- This document is RLS SQL planning, not SQL.
- The actual RLS migration must be written only in a separate PR.

## RLS application principles

- Every notification schema table is an RLS enable target by default.
- Tables that should not expose client access should start as service role only.
- Client read policy should be allowed only in the smallest useful scope.
- Client write policy should not be opened now.
- Client insert/update/delete policy should be designed later after server-side endpoints exist.
- `person_id` mapping should be determined through `account_identities`.
- RLS must not solve account merge.
- Account linking must be handled by a separate server-side flow.
- Delivery claim/log direct client access should be denied by default.
- Web Push raw subscription detail must not be exposed to clients.

## Table-by-table RLS enable/read-only policy draft

### `persons`

RLS enable:

- yes

Client read:

- Allow only the person row connected to the current auth user through `account_identities.auth_user_id`.

Client write:

- Deny insert/update/delete.
- Status and merge changes should be service role only.

Service role:

- Full access.

Policy intent:

- A user can read only their own person summary.
- Disabled/merged person handling remains a scheduler/service-layer decision.

### `account_identities`

RLS enable:

- yes

Client read:

- Allow only a limited summary of identities linked to the user's own person.
- Review whether raw provider identifiers such as `provider_user_id` require a masked view or excluded field.

Client write:

- Deny insert/update/delete.
- Account linking/unlinking must use a server-side flow.

Service role:

- Full access.

Policy intent:

- It can be acceptable to show whether Google/Kakao/Naver are linked to the same person.
- Sensitive provider identifiers should remain restricted.

### `contact_points`

RLS enable:

- yes

Client read:

- Allow only contact summary rows for the user's own person.
- Review whether phone/email values require masking or a separate summary view.

Client write:

- Deny direct insert/update/delete.
- Changes should happen through a contact verification server-side endpoint.

Service role:

- Full access.

Policy intent:

- A user can see their own contact state.
- Raw contact exposure should be minimized.
- Web Push endpoints do not belong in `contact_points`.

### `contact_verifications`

RLS enable:

- yes

Client read:

- Deny by default, or allow only a limited verification summary for contacts owned by the user's own person.

Client write:

- Deny direct insert/update/delete.
- Verification tokens/codes are service role only.

Service role:

- Full access.

Policy intent:

- Raw verification history, code, and token values must not be exposed.

### `notification_consents`

RLS enable:

- yes

Client read:

- Allow only consent status for the user's own person.

Client write:

- Deny direct insert/update/delete.
- Grant/revoke should be handled through a server-side endpoint.

Service role:

- Full access.

Policy intent:

- Marketing, service, consulting, and channel-specific consent should remain separated.
- Revoked history should not be deleted.

### `reminder_rules`

RLS enable:

- yes

Client read:

- Allow only reminder rules for the user's own person.

Client write:

- Deny direct insert/update/delete for now.
- If a notification settings UI is introduced later, consider limited writes only after server-side validation.

Service role:

- Full access.

Policy intent:

- A user can read only their own reminder rules.
- Disabled/deleted rules are excluded by the scheduler.

### `reminder_channels`

RLS enable:

- yes

Client read:

- Allow only channels linked to reminder rules owned by the user's own person.

Client write:

- Deny direct insert/update/delete for now.
- Channel/contact ownership validation must happen server-side before any write path exists.

Service role:

- Full access.

Policy intent:

- A user can see their own channel fallback structure.
- A user cannot access another person's contact/channel data.

### `web_push_subscription_owners`

RLS enable:

- yes

Client read:

- Allow only a limited ownership summary linked to the current auth user or linked person.
- Minimize `endpoint_hash` exposure.

Client write:

- Deny direct insert/update/delete.
- Changes should happen only through a current-device registration API or server-side flow.

Service role:

- Full access.

Policy intent:

- Limited state summary such as active/stale/conflict/revoked can be considered.
- Raw endpoint, `p256dh`, and `auth` must never be exposed.
- Subscription ownership must not be automatically transferred during account merge.

### `notification_delivery_claims`

RLS enable:

- yes

Client read:

- Deny by default.

Client write:

- Deny insert/update/delete.

Service role:

- Full access.

Policy intent:

- The service role creates idempotency claims before provider calls.
- A normal client must not create or read delivery claims.

### `notification_delivery_logs`

RLS enable:

- yes

Client read:

- Deny by default.
- If user-visible notification history is needed later, design a separate masked view.

Client write:

- Deny insert/update/delete.

Service role:

- Full access.

Policy intent:

- Provider message IDs and raw provider responses must not be exposed to clients.
- Notification history UI should be considered only through a separate read model/view.

## Read-only policy priority

### Phase 1. service role only

Start these tables as service role only:

- `contact_verifications`
- `notification_delivery_claims`
- `notification_delivery_logs`

### Phase 2. client read-only summary

Review minimal client read-only policy for:

- `persons`
- `account_identities`
- `contact_points`
- `notification_consents`
- `reminder_rules`
- `reminder_channels`
- `web_push_subscription_owners`

### Phase 3. client write is later

Do not open client write policy yet.

Review client writes only after later server-side endpoints exist for:

- contact verification
- consent grant/revoke
- reminder rule create/update/soft delete
- reminder channel enable/disable
- Web Push current-device registration/revoke

## Helper function/view candidates

Actual SQL is not written in this document. The future RLS migration may need to evaluate:

- `current_person_ids()` helper function
- `is_member_of_person(person_id)` helper function
- masked `account_identity_summary` view
- masked `contact_point_summary` view
- user-visible `notification_settings_summary` view
- user-visible `notification_history_summary` view

Review notes:

- Helper functions require careful review of SECURITY DEFINER usage.
- Helper functions should pin `search_path` if SECURITY DEFINER is used.
- Views should hide raw provider ID, phone/email, endpoint hash, provider message ID, and provider response data where possible.
- This document does not define function SQL or view SQL.

## Expected RLS migration draft order

1. Complete schema migration local/disposable apply verification.
2. Draft RLS enable migration.
3. Add service role only policies first.
4. Add minimal client read-only policies.
5. Review masked view/helper needs.
6. Test auth mapping in a local/disposable DB.
7. Verify in staging.
8. Apply to production last.
9. Keep client write policy as a later separate PR.

Current blocker:

- Local apply remains `BLOCKED` by Docker daemon availability.
- Actual RLS SQL writing should remain on hold until schema apply verification can proceed.

## RLS test scenarios

- Anonymous user cannot access any notification schema table.
- User A can read only their own person row.
- User A cannot read user B's person row.
- Google user A and Kakao user A can read the same reminder after linking to the same person.
- Unlinked Kakao user cannot read Google user's person data.
- User A can read their own consent status.
- User A cannot read user B's `contact_points`.
- User A cannot read or insert `notification_delivery_claims`.
- Scheduler service role can read due `reminder_rules`.
- Scheduler service role can insert `notification_delivery_claims`.
- `web_push_subscription_owners` conflict/revoked ownership is not exposed as a send candidate.
- Provider raw response is not readable by clients.

## Out of scope

- RLS SQL writing.
- Migration file creation.
- Migration file changes.
- Supabase DB apply.
- Local DB apply retry.
- Docker recovery.
- Disposable Supabase project creation.
- Supabase SQL Editor execution.
- Edge Function changes.
- Frontend changes.
- Provider/live sending.
- Cron, env, or production configuration.
- Account linking implementation.
- Contact verification implementation.
- Consent endpoint implementation.
- Reminder settings UI implementation.
- Web Push registration API implementation.
- Production deploy.
