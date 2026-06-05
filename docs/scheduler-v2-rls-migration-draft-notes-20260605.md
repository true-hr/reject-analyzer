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

- `CLIENT_READ_POLICIES_DEFERRED`
- `IDENTITY_LINK_CONTRACT_NOT_CONFIRMED`
- `NO_EXECUTABLE_AUTHENTICATED_CLIENT_POLICY_IN_THIS_DRAFT`
- `HELPER_FUNCTIONS_DEFERRED_TO_SEPARATE_REVIEW`

Reason:

- The authoritative auth-user-to-person link has not been confirmed.
- `account_identities.provider_user_id = auth.uid()::text` remains only a candidate predicate.
- A wrong membership predicate could open client read access to the wrong `person_id`.
- Security definer helper functions need separate review before any executable SQL is added.

## Service role and client boundary

Service role:

- Service role can manage all 10 scheduler v2 tables.
- The draft includes executable `service_role_manage_*` policies for all 10 tables.
- Supabase service_role usually bypasses RLS, so these policies are partly documentary unless forced RLS is introduced.

Authenticated client:

- No executable authenticated client policy is included in this draft.
- Direct client table read is deferred until the identity-link contract is decided.
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

The client read-summary path requires follow-up design for:

- authoritative identity-link contract
- helper function ownership and search path
- masked summary views or helper functions
- direct table grants and view security mode

## Helper function candidates left for follow-up

These are not created in this migration draft:

- `current_person_ids()`
- `is_member_of_person(person_id uuid)`

TODO before any executable helper SQL:

- Confirm the authoritative auth-user-to-person link.
- Decide whether `account_identities.provider_user_id` is allowed to match `auth.uid()::text`.
- Decide whether `web_push_subscription_owners.auth_user_id = auth.uid()` belongs in membership logic.
- Review security definer ownership, `search_path`, exposed-schema placement, and execute grants.

## View/function candidates left for follow-up

These are not created in this migration draft:

- `account_identity_summary`
- `contact_point_summary`
- `notification_settings_summary`
- `notification_history_summary`

Reason:

- Masking rules need a separate contract.
- Direct table grants and view security mode need review.
- Views can bypass RLS unless designed carefully, so they should not be rushed.

## Next steps

1. PR #811 merge.
2. Identity-link contract decision.
3. Helper function/view design.
4. Client read-summary policy draft.
5. Disposable RLS apply approval.
6. Disposable RLS apply verification.

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
