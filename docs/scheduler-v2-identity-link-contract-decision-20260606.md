# Scheduler v2 Identity-link Contract Decision

## 1. Status

DECISION_DRAFT

## 2. Why this document exists

PR #811 deferred authenticated client RLS policy/helper work for scheduler v2 because the auth-user-to-person membership predicate was not confirmed.

The unsafe candidate was:

```txt
account_identities.provider_user_id = auth.uid()::text
```

If that predicate is wrong, an authenticated client read policy could expose rows for the wrong `person_id`. This document records the read-only findings and the recommended identity-link contract before any RLS helper, client policy, migration, DB apply, account merge, or backfill work.

## 3. Current findings

### 3.1 Supabase auth user id usage

Existing PASSMAP storage generally uses Supabase Auth user id directly as the owner key.

- `supabase/sql/20260428_passmap_work_records.sql` defines `profiles.id uuid primary key references auth.users(id)` and protects it with `auth.uid() = id`.
- The same file defines `work_records.user_id`, `resume_sentences.user_id`, and `resume_profiles.user_id` as UUID columns referencing `auth.users(id)` and protects them with `auth.uid() = user_id`.
- `supabase/sql/20260511_push_subscriptions.sql` defines `push_subscriptions.user_id uuid not null references auth.users(id)` and protects select/insert/update/delete with `auth.uid() = user_id`.
- `supabase/sql/20260511_reminder_preferences.sql`, `supabase/sql/20260511_reminder_deliveries.sql`, `supabase/sql/20260515_experience_cards_schema.sql`, `supabase/sql/20260519_user_career_settings.sql`, and OAuth/MCP SQL files follow the same `user_id` as auth-user owner pattern.
- `docs/auth-social-login-policy.md` states that user-facing tables use `user_id uuid REFERENCES auth.users(id)` and RLS with `auth.uid() = user_id`, while legacy `analysis_inputs` / `analysis_runs` use text `user_id` with `auth.uid()::text = user_id`.
- `src/lib/pushSubscriptionRepository.js` writes `user_id: userId`; `src/lib/reminderPreferenceRepository.js` inserts `{ user_id: userId, ...payload }`.
- `supabase/functions/send-test-experience-recall-push/index.ts` validates the access token with `supabase.auth.getUser(token)` and then filters `push_subscriptions.user_id` by `user.id`.

Current code therefore treats Supabase Auth `auth.users.id` as a login-account/session owner. It does not currently treat it as the long-term PASSMAP person root.

### 3.2 Existing user_id meaning

Existing `user_id` columns are not an app-internal person id. They are Supabase Auth user ids.

Evidence:

- SQL columns repeatedly declare `user_id uuid ... references auth.users(id)`.
- RLS repeatedly uses `auth.uid() = user_id`.
- Client repositories pass the current session user id into `user_id` inserts/upserts.
- Edge Functions that receive a user token resolve `supabase.auth.getUser(token)` and compare table `user_id` to `user.id`.

The notable legacy exception is `analysis_inputs` / `analysis_runs`, where `user_id` is text and RLS compares `auth.uid()::text = user_id`; this is still Supabase Auth user id semantics, only stored as text.

### 3.3 Provider identity usage

Current provider login entry points are in `src/lib/auth.js`:

- Google calls `supabase.auth.signInWithOAuth({ provider: "google" })`.
- Kakao calls `supabase.auth.signInWithOAuth({ provider: "kakao" })`.
- Naver calls `supabase.auth.signInWithOAuth({ provider: "custom:naver" })`.

The app reads session/user state through `getSession()` and `onAuthStateChange()`. `src/App.jsx` stores UI auth state from `session.user.app_metadata.provider`, `session.user.user_metadata.name/full_name`, and `session.user.email`.

No read-only evidence was found that PASSMAP currently persists raw provider subject ids for Google, Kakao, or Naver in public application tables. `docs/auth-social-login-policy.md` says provider separation was confirmed in Supabase `auth.identities`, but direct `auth.identities` reads are deferred because they require service-role access and are not available to anon/user RLS.

Therefore `account_identities.provider_user_id` should be interpreted as a future provider-specific subject/id field, not as a confirmed copy of Supabase `auth.users.id`.

### 3.4 Existing person_id usage

`person_id` is currently a scheduler/account-linking design and draft-schema concept, not the existing production owner for user-facing records.

Relevant current/draft usage:

- `docs/person-id-account-linking-design-20260603.md` defines `person_id` as PASSMAP's real person-level identifier and states that `auth.users.id` identifies a login account/session.
- `supabase/sql/drafts/20260531_person_id_notification_contacts_draft.sql` drafts `persons` and `linked_auth_users` with explicit `linked_auth_users.auth_user_id`.
- `docs/scheduler-v2-db-schema-design-20260604.md` defines scheduler v2 `persons` and `account_identities`, but the design baseline lists only `provider_user_id` and `email` under `account_identities`; it does not define `auth_user_id`.
- `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql` creates `account_identities(person_id, provider, provider_user_id, email, status, linked_at, unlinked_at, ...)` and does not include `auth_user_id`.
- `supabase/migrations/20260605000000_scheduler_v2_rls_policies.sql` explicitly defers helper creation because `account_identities.provider_user_id = auth.uid()::text` is not confirmed and could grant access to the wrong `person_id`.

## 4. Decision

### Option A - Use `account_identities.provider_user_id = auth.uid()::text`

Rejected for this draft.

This is not safe because current code does not show that `provider_user_id` stores Supabase `auth.users.id`. The term also naturally means the provider-specific subject/id, while Supabase Auth `auth.users.id` is the platform login-account id.

### Option B - Add explicit `account_identities.auth_user_id`

Selected.

Scheduler v2 should separate Supabase Auth user id from provider-specific subject/id:

```txt
Supabase Auth user id = account_identities.auth_user_id
Provider-specific subject/id = account_identities.provider_user_id
PASSMAP person root = persons.id
```

This matches the safest existing design direction in the person-id/account-linking docs and prevents future RLS helpers from depending on an ambiguous provider identifier.

### Option C - Need more investigation

Not selected as the primary direction for the contract. More implementation work is still needed before DB changes, but the current read-only evidence is sufficient to reject Option A and choose the safer explicit `auth_user_id` contract.

## 5. Recommended contract

- `persons.id`: PASSMAP internal real-person root. It is not equal to Supabase `auth.users.id` and must not be derived automatically from email, phone, or name.
- `account_identities.person_id`: FK to `persons.id`. It links a login identity row to the PASSMAP person after explicit linking or approved initial creation logic.
- `account_identities.auth_user_id`: explicit UUID reference to Supabase `auth.users.id`. This is the only column RLS membership helpers should compare to `auth.uid()`.
- `account_identities.provider`: normalized login provider, for example `google`, `kakao`, `naver`, or `email`. Naver's Supabase provider string `custom:naver` should be normalized before storage if this table is populated.
- `account_identities.provider_user_id`: provider-specific subject/id from Google, Kakao, Naver, or email provider context. It must not be assumed to equal `auth.uid()::text`.
- `account_identities.provider_email`: provider-supplied email snapshot if available. It is an evidence/display/review field only, not an automatic merge key.
- `account_identities.status`: at minimum `active`, `unlinked`, and `conflict`. RLS helper membership should count only active rows.
- Primary identity 기준: primary identity is a product/account-linking decision, not proof of person identity by itself. Only one active primary identity per `person_id` should be allowed after schema review.
- Account linking 기준: linking requires explicit UX consent plus server-side validation that the current authenticated user controls the `auth_user_id` being linked and that the target provider identity is not already active under another `person_id`.

Server-side validation required before linking:

- Resolve the current user from the Supabase session/access token server-side.
- Insert/update `account_identities.auth_user_id` only from the server-validated `auth.uid()` / `user.id`, not from a client-supplied UUID.
- Verify provider, provider subject, and provider email/phone from trusted Supabase Auth identity data or an approved server-side provider callback, not from client form fields.
- Check that the same active `auth_user_id` is not already linked to another `person_id`.
- Check that the same active `(provider, provider_user_id)` is not already linked to another `person_id`.
- If a conflict exists, create or keep a `conflict` state and require review/explicit resolution, not automatic merge.

## 6. Non-goals

- DB migration 작성 안 함.
- RLS helper 작성 안 함.
- Client policy 작성 안 함.
- Account merge/backfill 안 함.
- Provider 연동 안 함.

## 7. Security rules

- 이메일/전화번호/이름만으로 automatic merge 금지.
- Provider account automatic merge 금지.
- Account linking은 명시 UX + server-side 검증 필요.
- Web Push subscription 자동 이전 금지.
- Raw provider id/client destination 노출 금지.
- RLS helper는 확정된 `auth_user_id` contract 기반이어야 함.
- Provider email, phone, and display name are evidence fields only.
- `provider_user_id = auth.uid()::text` must remain rejected/unconfirmed unless a later server-verified storage path proves it.

## 8. Impact on future RLS helper

Future RLS helper design should assume `account_identities.auth_user_id` is the authoritative membership link from Supabase Auth to PASSMAP person.

`current_person_ids()` predicate draft in prose:

- Read the current authenticated Supabase user id from `auth.uid()`.
- Return only `person_id` values from `account_identities` where:
  - `auth_user_id` equals the current auth uid;
  - `status` is `active`;
  - `unlinked_at` is null;
  - the linked `persons.status` is eligible for read, likely `active`.
- Do not use provider email, phone, display name, or `provider_user_id` for membership.

`is_member_of_person(person_id uuid)` predicate draft in prose:

- Return true only when the requested `person_id` exists in `current_person_ids()`.
- Treat null input as false.
- Treat merged, disabled, unlinked, and conflict identities as false unless a later reviewed policy intentionally exposes masked transition state.

RLS helper implementation is still out of scope for this document. Security definer ownership, search path, schema placement, grants, recursion risk, and masked summary views need separate review.

## 9. Follow-up work

1. Identity-link contract decision review
2. scheduler v2 account identity schema adjustment draft
3. helper function/view design
4. client read-summary policy draft
5. disposable RLS apply approval
6. disposable RLS apply verification
