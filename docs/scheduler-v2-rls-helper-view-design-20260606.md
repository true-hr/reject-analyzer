# Scheduler v2 RLS Helper/View Design

## 1. Status

DESIGN_DRAFT

## 2. Why this document exists

Scheduler v2 now has an explicit identity-link contract for mapping Supabase Auth users to PASSMAP persons. The next SQL draft needs helper, masked summary, and client policy boundaries that use that contract without exposing raw identity, contact, or delivery data.

This document defines the design criteria only. It does not create migration SQL, helper functions, views, grants, policies, or DB changes.

This design has a corresponding SQL draft in `supabase/migrations/20260605000000_scheduler_v2_rls_policies.sql` after the auth helper/summary update.

## 3. Current verified baseline

- PR #812 selected Option B: use explicit `account_identities.auth_user_id`.
- PR #814 added `account_identities.auth_user_id` to the scheduler v2 source schema and clarified that `provider_user_id` is provider-specific.
- PR #820 verified the disposable project after schema-only reset/reapply.
- Disposable verification confirmed:
  - `account_identities.auth_user_id` exists.
  - `account_identities.auth_user_id` references `auth.users(id)`.
  - active `account_identities_active_auth_user_id_key` exists.
  - active `account_identities_active_provider_user_id_key` exists.
  - `provider_user_id` remains present and is not treated as `auth.uid()`.
  - `20260605000000_scheduler_v2_rls_policies.sql` remains pending.
  - RLS is currently disabled on all 10 scheduler v2 tables after schema-only apply.
  - no helper function, masked view/function, or client policy has been applied.

## 4. Identity-link contract

Authoritative contract:

```txt
Supabase Auth user id = account_identities.auth_user_id
Provider-specific subject/id = account_identities.provider_user_id
PASSMAP person root = persons.id
```

Membership must use `account_identities.auth_user_id = auth.uid()`.

Membership must not use:

- `provider_user_id = auth.uid()::text`
- provider email
- provider phone
- display name
- contact destination
- Web Push endpoint or endpoint hash

Only active, non-unlinked account identities connected to active persons should count for client membership.

## 5. Helper design

### 5.1 `current_person_ids()`

Goal: return the set of `person_id` values available to the currently authenticated Supabase user.

Predicate design:

- If `auth.uid()` is null, return an empty set.
- Join `account_identities` to `persons`.
- Match `account_identities.auth_user_id = auth.uid()`.
- Require `account_identities.status = 'active'`.
- Require `account_identities.unlinked_at is null`.
- Require `persons.status = 'active'`.
- Return only `account_identities.person_id`.
- Do not use `provider_user_id = auth.uid()::text`.
- Do not use provider email, phone, display name, or contact destination.
- Treat `conflict`, `unlinked`, disabled, and merged states as non-member by default.

Security mode:

- Prefer `security invoker` if the helper can run without reading through recursive table policies.
- If table policies would block the helper from reading `account_identities` or `persons`, use a narrowly scoped `security definer` function.
- If `security definer` is used, fix `search_path` to trusted schemas only, for example `public, pg_temp` or stricter after review.
- The function owner must be a controlled DB owner role, not a broad application client role.
- Grant execute only to roles that need it, likely `authenticated` plus service-side roles as needed.
- Revoke public execute if default grants would expose it.

RLS recursion:

- Avoid policies on `account_identities` that call helpers which read `account_identities` through the same policy path.
- For direct table policies, prefer `is_member_of_person(<table>.person_id)` on person-scoped tables.
- For `account_identities` itself, prefer masked summary access rather than raw direct read to avoid recursive membership checks and raw provider exposure.

### 5.2 `is_member_of_person(person_id uuid)`

Goal: return whether the given `person_id` belongs to the currently authenticated user through an active identity link.

Predicate design:

- Null input returns false.
- It may call `current_person_ids()` or use the same predicate inline.
- True only when the requested person id is in the current active person set.
- Require active identity and active person.
- `unlinked`, `conflict`, disabled, and merged states return false by default.
- Do not use provider id, email, phone, name, contact destination, or Web Push data for membership.

Security mode:

- Match the security mode chosen for `current_person_ids()`.
- If `security definer` is used, fix `search_path`, tightly control owner, and grant execute explicitly.
- Keep the function stable in behavior and free of writes.

## 6. Masked summary view/function design

Goal: let authenticated clients read the minimum notification settings state without raw table access.

Preferred candidate:

- `get_current_person_notification_summary()`

Alternative candidate:

- `scheduler_current_person_notification_summary`

Prefer a function over a view if membership filtering, masking, or current-user device context is easier to express safely. If a view is used, review `security_invoker` behavior and direct grants carefully because views can bypass RLS if designed incorrectly.

Allowed summary information:

- `person_id`
- person status
- linked provider names only, for example `google`, `kakao`, `naver`, `email`
- contact channel status summary, for example `email active`, `sms disabled`, `kakao_alimtalk unverified`
- consent status summary by channel/type
- reminder rule summary, for example enabled state, cadence, local time, timezone, and reminder kind
- web push current-device summary, for example whether the current browser/device has active ownership after a separate current-device proof design

Never expose:

- raw email
- raw phone
- raw `provider_user_id`
- raw `auth_user_id`
- raw endpoint
- `p256dh`
- `auth` secret
- full destination
- delivery claim details
- delivery log details
- service/internal failure metadata not needed for user settings UI

Design notes:

- A summary function should filter rows through `current_person_ids()` or equivalent `auth_user_id` membership.
- Provider identity summary should expose provider labels and link status only.
- Contact summary should expose channel and coarse status, not destination.
- Web Push summary should avoid endpoint hash unless a later UX requires a masked current-device indicator and that indicator is reviewed separately.

## 7. Client direct table policy direction

Initial direction is conservative: prefer masked summary function/view over direct base table reads.

- `persons`: avoid direct client read at first. Use summary function/view.
- `account_identities`: avoid raw direct client read. Expose provider summary only.
- `contact_points`: avoid raw direct client read. Expose masked channel summary only.
- `contact_verifications`: service role only.
- `notification_consents`: expose masked/read summary only.
- `reminder_rules`: future own-person read/write may be considered when notification settings UI needs it.
- `reminder_channels`: future own-rule read/write may be considered with reminder rule ownership checks.
- `web_push_subscription_owners`: expose current-device summary only; do not expose endpoint-related raw data.
- `notification_delivery_claims`: service role only.
- `notification_delivery_logs`: service role only.

Any future direct write policy must be reviewed separately from read summary access.

## 8. Service-role-only tables

These should remain service role only in the initial client access design:

- `contact_verifications`
- `notification_delivery_claims`
- `notification_delivery_logs`

Rationale:

- contact verification state is server-managed evidence;
- delivery claims are idempotency control records;
- delivery logs are audit/internal outcome records;
- direct client access is unnecessary and risks exposing operational or sensitive data.

Service role policies may document intended server management, but teams must remember Supabase service role usually bypasses RLS unless forced RLS behavior is introduced.

## 9. Future SQL draft boundary

The next SQL draft PR may include candidates for:

- explicit RLS enablement for scheduler v2 tables;
- service role manage-all policies for the 10 scheduler v2 tables;
- `current_person_ids()` helper candidate;
- `is_member_of_person(person_id uuid)` helper candidate;
- masked summary function/view candidate;
- authenticated client read-summary access through the masked summary surface;
- no raw authenticated base-table read unless explicitly justified in that PR.

The next SQL draft PR should not combine:

- account merge/backfill;
- provider integration;
- Edge Function changes;
- frontend changes;
- live send behavior;
- cron setup;
- production/staging apply.

## 10. Risk checklist

- Wrong identity predicate risk: using `provider_user_id = auth.uid()::text` could expose the wrong `person_id`.
- security definer search_path risk: a helper with broad `search_path` can execute unexpected objects.
- RLS recursion risk: policies on `account_identities` can recursively invoke helpers that read `account_identities`.
- Overexposed raw contact/provider data risk: raw email, phone, provider subject, `auth_user_id`, endpoint, `p256dh`, and auth secret must stay out of client summaries.
- Service role bypass misunderstanding: service role policies are not a substitute for understanding bypass behavior.
- Migration apply ordering risk: schema migration, RLS enablement, helper creation, grants, and summary access must be sequenced intentionally.
- Disposable/staging/production drift risk: disposable state after PR #820 is schema-only with RLS disabled; future RLS apply verification must explicitly confirm target project and migration state.

## 11. Non-goals

- No DB apply.
- No disposable/staging/production apply.
- No SQL migration changes.
- No helper function execution SQL.
- No client policy execution SQL.
- No DB query.
- No SQL Editor usage.
- No env/secret changes.
- No Edge Function changes.
- No frontend changes.
- No provider/live sending.
- No cron changes.
- No account merge/backfill.

## 12. Next recommended step

Create a separate RLS SQL draft PR that implements only the reviewed helper, masked summary, grant, and client read-summary candidates. After that draft is reviewed, request explicit approval for disposable RLS apply verification.
