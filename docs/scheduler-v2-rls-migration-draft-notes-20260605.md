# Scheduler v2 RLS Migration Draft Notes

## Purpose

This document explains the scheduler v2 RLS migration draft in `supabase/migrations/20260605000000_scheduler_v2_rls_policies.sql`.

This migration is a draft. apply 금지: do not apply it to disposable, staging, or production until separate review and explicit approval.

## Expected state

- Scheduler v2 notification tables are sensitive-data tables.
- Expected state is RLS enabled.
- Do not depend on the disposable DB `ensure_rls` event trigger or `public.rls_auto_enable`.
- RLS enablement and RLS policies must be explicit migration-managed state.
- RLS enabled with zero policies is not ready for client use.

## Service role and client boundary

Service role:

- Service role can manage all 10 scheduler v2 tables.
- The draft includes `service_role_manage_*` policies for all 10 tables.
- Supabase service_role usually bypasses RLS, so these policies are partly documentary unless forced RLS is introduced.

Authenticated client:

- Direct client access starts with minimal read-only policies.
- Client read access must be tied to a linked `person_id`.
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

The draft only gives direct authenticated read policies to:

- `persons`
- `notification_consents`
- `reminder_rules`
- `reminder_channels`

The other candidates need masked summary views or helper functions before direct client exposure.

## Helper function uncertainty

The draft includes:

- `current_person_ids()`
- `is_member_of_person(person_id uuid)`

TODO before apply:

- Confirm the authoritative auth-user-to-person link.
- The draft currently uses `account_identities.provider_user_id = auth.uid()::text` as a candidate link.
- The draft also considers `web_push_subscription_owners.auth_user_id = auth.uid()` for active web push ownership.
- If `provider_user_id` is not the Supabase auth user id, replace the helper predicate before any apply.
- Review `security definer` ownership, `search_path`, and execute grants before apply.

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

1. RLS SQL draft review.
2. Resolve helper identity-link TODOs.
3. Decide masked summary view/function shape.
4. Request separate disposable RLS apply verification approval.
5. Run disposable RLS apply verification in a separate PR after approval.
6. Prepare staging plan only after disposable RLS apply verification passes.

Disposable RLS apply verification is explicitly out of scope for this draft PR.

## Not done in this batch

- disposable apply 없음.
- staging apply 없음.
- production apply 없음.
- Supabase SQL Editor 사용 없음.
- `supabase db push` 없음.
- DB password 입력/저장/출력/기록 없음.
- service role/anon key 저장 없음.
- env/secret 변경 없음.
- Edge Function 수정 없음.
- frontend 수정 없음.
- provider/live 발송 없음.
- cron/production 설정 없음.
