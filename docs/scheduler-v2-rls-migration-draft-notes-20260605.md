# Scheduler v2 RLS Migration Draft Notes

## Purpose

This document explains the scheduler v2 RLS migration draft in `supabase/migrations/20260605000000_scheduler_v2_rls_policies.sql`.

This migration is a draft. Do not apply it to disposable, staging, or production until separate review and explicit approval.

## Expected state

- Scheduler v2 notification tables are sensitive-data tables.
- Expected state is RLS enabled.
- Do not depend on the disposable DB `ensure_rls` event trigger or `public.rls_auto_enable`.
- RLS enablement and RLS policies must be explicit migration-managed state.
- RLS enabled with zero policies is not ready for client use.

## Deferred client access decision

- `BASE_TABLE_CLIENT_READ_POLICIES_DEFERRED`
- `AUTH_USER_ID_IDENTITY_LINK_CONTRACT_CONFIRMED`
- `HELPER_FUNCTIONS_DRAFTED`
- `MASKED_SUMMARY_FUNCTION_DRAFTED`
- `NO_EXECUTABLE_AUTHENTICATED_BASE_TABLE_POLICY_IN_THIS_DRAFT`

Reason:

- PR #812 selected the explicit `account_identities.auth_user_id` contract.
- PR #814 added `account_identities.auth_user_id` to the scheduler v2 schema draft.
- PR #820 verified the disposable schema-only apply after reset/reapply.
- PR #821 defined the helper/view design used by this SQL draft.
- `account_identities.provider_user_id = auth.uid()::text` is rejected as a membership predicate.
- Raw base table reads still risk exposing provider, contact, Web Push, delivery, or internal state.

## Service role and client boundary

Service role:

- Service role can manage all 10 scheduler v2 tables.
- The draft includes executable `service_role_manage_*` policies for all 10 tables.
- Supabase service_role usually bypasses RLS, so these policies are partly documentary unless forced RLS is introduced.

Authenticated client:

- No executable authenticated base table policy is included in this draft.
- Direct client table read is deferred.
- `current_person_ids()` and `is_member_of_person(person_id uuid)` are drafted with `account_identities.auth_user_id = auth.uid()`.
- `get_current_person_notification_summary()` is drafted as the initial masked client read surface.
- Client write policies are deferred.
- Raw email, phone, provider user id, full destination, raw endpoint, `p256dh`, and auth values must not be exposed.

## Service role only tables

These tables remain service role only in the draft:

- `contact_verifications`
- `notification_delivery_claims`
- `notification_delivery_logs`

Reason:

- Verification, delivery idempotency, and audit data should be handled by server-side workflows.
- Direct client access is unnecessary or risky.

## Client read-summary direction

Client read-summary candidates:

- `persons`
- `account_identities`
- `contact_points`
- `notification_consents`
- `reminder_rules`
- `reminder_channels`
- `web_push_subscription_owners`

The draft does not create direct authenticated read policies for these tables.
The draft instead exposes a masked summary function candidate:

- `get_current_person_notification_summary()`

The client read-summary path requires follow-up design for:

- SQL review of helper function ownership and `search_path`
- masked summary field review
- direct table grant avoidance
- disposable RLS apply verification after explicit approval

## Helper function draft

These are created as SQL draft candidates:

- `current_person_ids()`
- `is_member_of_person(person_id uuid)`

Membership predicate:

- `account_identities.auth_user_id = auth.uid()`
- `account_identities.status = 'active'`
- `account_identities.unlinked_at is null`
- `persons.status = 'active'`

Explicitly not used:

- `account_identities.provider_user_id = auth.uid()::text`
- provider email
- phone
- display name
- contact destination
- Web Push endpoint or endpoint hash

The helper functions use `security definer`, fixed `search_path`, explicit public revoke, and authenticated execute grants. Disposable apply is still not performed in this PR.

## Masked summary function draft

This draft creates:

- `get_current_person_notification_summary()`

The function uses `current_person_ids()` for membership filtering and returns coarse JSON summaries for:

- providers
- contact channels
- consents
- reminder rules/channels
- Web Push ownership status counts

It must not expose raw email, raw phone, raw `provider_user_id`, raw `auth_user_id`, raw endpoint, `p256dh`, auth secret, full destination, delivery claim details, or delivery log details.

## Next steps

1. Review this RLS helper/summary SQL draft.
2. Confirm no authenticated base table direct read policy is included.
3. Request explicit approval for disposable RLS apply verification.
4. Apply pending RLS draft to disposable only after approval.
5. Run disposable object-level and behavior-level verification.

Disposable RLS apply verification is explicitly out of scope for this draft PR.

## Not done in this batch

- No disposable apply.
- No staging apply.
- No production apply.
- No Supabase SQL Editor usage.
- No `supabase db push`.
- No DB query execution.
- No DB password input, storage, output, or recording.
- No service role or anon key storage.
- No env/secret changes.
- No Edge Function changes.
- No frontend changes.
- No provider/live sending.
- No cron/production settings changes.
