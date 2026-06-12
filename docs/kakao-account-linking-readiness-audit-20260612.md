# Kakao Account Linking Readiness Audit

## 1. Status

READ_ONLY_AUDIT_COMPLETE

NOT_READY_FOR_IMPLEMENTATION_UNTIL_GPT_DESIGN

NO_DB_OR_AUTH_CHANGES_MADE

This audit is a read-only codebase inventory for Kakao OAuth account linking readiness. It does not design the product flow, change implementation, apply database changes, query remote databases, or modify auth behavior.

## 2. Auth And Login Files Observed

Supabase client initialization:

- `src/lib/supabaseClient.js`
  - Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  - Creates the Supabase client with persisted sessions, token refresh, URL session detection, PKCE flow, and a fixed storage key.
  - Returns `null` when required env values are missing.

Login helper entry points:

- `src/lib/auth.js`
  - `signInWithGoogle(options)`
  - `signInWithKakao(options)`
  - `signInWithNaver(options)`
  - `signOut()`
  - `getSession()`
  - `onAuthStateChange(callback)`
  - Computes redirect targets from the current browser URL unless an explicit redirect is provided.
  - Uses Supabase OAuth providers `google`, `kakao`, and `custom:naver`.

Primary app auth/session handling:

- `src/App.jsx`
  - Imports login helpers from `src/lib/auth.js`.
  - Handles initial session sync with `getSession()`.
  - Handles OAuth callback code exchange through `supabase.auth.exchangeCodeForSession(...)`.
  - Removes callback query parameters from browser history after successful exchange.
  - Subscribes to auth state changes through `onAuthStateChange(...)`.
  - Stores a local auth model with `loggedIn`, provider, name, and email.
  - Provides Google, Kakao, and Naver login button handlers.
  - Shows login copy that current social providers are managed as separate accounts and that using a different provider can hide prior records.

Other auth/session consumers:

- `src/pages/AdminAnalysisPage.jsx`
- `src/components/report/TransitionLiteResult.jsx`
- `src/components/report/ResumeRecommendationSheet.jsx`
- `src/components/mvp/PmMvpView.jsx`
- `src/components/mobile/MobileWeekStrip.jsx`
- `src/components/home/HomeDashboard.jsx`
- `src/components/home/CareerAssetMapMock.jsx`
- `src/components/chatgpt/ChatgptOAuthConsentPage.jsx`
- `src/lib/googleCalendarSync.js`
- `src/lib/mcp/mcpPairingClient.js`
- `src/lib/persistence/saveAnalysisRun.js`
- `src/lib/workTrace/saveWorkTraceCandidates.js`

Profile, person, and account-related repository/helper files observed:

- `src/lib/schedulerV2NotificationSummaryRepository.js`
- `src/lib/schedulerV2ContactConsentRepository.js`
- `src/lib/schedulerV2NotificationSettingsRepository.js`
- `src/lib/reminderPreferenceRepository.js`
- `src/lib/pushSubscriptionRepository.js`
- `src/lib/workRecordRepository.js`
- `src/lib/resumeProfileRepository.js`
- `src/lib/careerBaselineRepository.js`
- `src/lib/experience/aiInboxRepository.js`

## 3. Current `account_identities` Usage

Migration and function locations:

- `supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql`
  - Creates `persons`.
  - Creates `account_identities`.
  - `account_identities` links `person_id`, Supabase auth user id, provider, provider-specific subject, email snapshot, status, link time, unlink time, and timestamps.
  - Adds active uniqueness for the Supabase auth user id.
  - Adds active uniqueness for provider plus provider-specific subject.
  - Comments state that provider email, phone, and display name are not membership keys.

- `supabase/migrations/20260605000000_scheduler_v2_rls_policies.sql`
  - Enables RLS for scheduler v2 base tables.
  - Defines `public.current_person_ids()`.
  - `current_person_ids()` reads active `account_identities` rows, joins `persons`, and matches the explicit Supabase auth user column against the current auth session.
  - Defines `public.is_member_of_person(target_person_id uuid)`.
  - Adds service-role management policies for raw scheduler v2 tables.
  - Defers authenticated direct base-table read policies.
  - Adds a masked summary function rather than raw client reads.

- `supabase/migrations/20260606115936_scheduler_v2_notification_settings_write_functions.sql`
  - Uses `current_person_ids()` for the reminder rule write RPC.

- `supabase/migrations/20260612082650_scheduler_v2_contact_consent_write_functions.sql`
  - Uses `current_person_ids()` for the contact/consent write RPC.

- `supabase/migrations/20260612143000_kakao_summary_shape_consent_rpc.sql`
  - Reads `account_identities` in the notification summary function.
  - Uses active Kakao identity as part of the normalized Kakao summary state.
  - Adds a Kakao Alimtalk consent RPC draft path that requires exactly one current person and an active Kakao identity.

- `supabase/migrations/20260612133209_notification_channel_capabilities.sql`
  - Reads `account_identities` in the patched summary function.
  - Computes Kakao identity state from active, unlinked, and conflict identity rows.
  - Adds capability-gated `send_eligibility`.

Docs and tests observed:

- `docs/scheduler-v2-identity-link-contract-decision-20260606.md`
- `docs/scheduler-v2-rls-helper-view-design-20260606.md`
- `docs/scheduler-v2-rls-migration-draft-notes-20260605.md`
- `docs/kakao-account-linking-alimtalk-contract-20260612.md`
- `docs/kakao-summary-shape-consent-rpc-draft-20260612.md`
- `docs/kakao-sms-contact-consent-write-20260606.md`
- `docs/kakao-sms-contact-consent-disposable-verification-20260612.md`
- `docs/kakao-provider-send-eligibility-contract-20260612.md`
- `src/components/reminder/__tests__/kakaoAlimtalkStateFormat.test.js`
- `src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`

Observed membership shape:

- The current scheduler v2 helper model is person-rooted.
- `person_id` is the PASSMAP person root.
- Supabase Auth session ownership is mapped through `account_identities`.
- The explicit Supabase auth user column is the membership bridge to `auth.uid()`.
- Provider-specific subject values are treated as provider identifiers, not as Supabase session identifiers.
- Raw `account_identities` client read policies are intentionally deferred.
- Client-facing summary is coarse and excludes raw provider/contact/push internals.

## 4. Current Kakao State

Kakao login:

- `src/lib/auth.js` already has `signInWithKakao(...)`.
- `src/App.jsx` already has a Kakao login button and a `doKakaoLogin()` handler.
- Kakao login currently uses the same Supabase OAuth redirect style as Google and Naver.
- The app copy currently tells users that Google, Kakao, and Naver are separate login accounts.

Kakao Alimtalk consent and summary:

- `src/lib/schedulerV2ContactConsentRepository.js` includes `buildKakaoAlimtalkConsentPayload(...)`.
- That payload writes channel `kakao_alimtalk`, consent type `reminder`, and metadata marking provider linking as pending.
- `saveSchedulerV2ContactConsent(...)` writes through RPC, not direct table writes.
- `src/lib/schedulerV2NotificationSummaryRepository.js` reads `get_current_person_notification_summary`.
- `src/components/reminder/kakaoAlimtalkStateFormat.js` derives Kakao UI state from normalized `row.kakao` first, then from legacy summary arrays.
- `src/components/reminder/schedulerV2NotificationSummaryFormat.js` renders Kakao Alimtalk channel and account-linking cards from summary data.
- `src/components/reminder/ReminderSettingsPanel.jsx` shows Kakao Alimtalk readiness and account-linking sections, but actions are disabled or marked as preparation states.

Current separation:

- Kakao login exists as an auth provider entry point.
- Kakao Alimtalk consent exists as a scheduler v2 notification consent path.
- The current documents and code keep Kakao login separate from Kakao Alimtalk consent.
- The summary function uses Kakao identity, contact, consent, and capability state, but does not implement account linking.
- No live Kakao send path was observed in the audited files.

## 5. Candidate UX Insertion Points

Observed UI locations that already contain related structure:

- `src/App.jsx` login modal
  - Existing Google, Kakao, and Naver login buttons.
  - Current copy explicitly says providers are separate accounts.
  - Candidate only as a future entry point if GPT design requires a linking variant distinct from ordinary login.

- `src/App.jsx` desktop settings account section
  - Shows current logged-in user name, email, provider, and account status.
  - Candidate location for connected-provider status if a design later defines it.

- `src/App.jsx` desktop settings notification section
  - Expands `ReminderSettingsPanel`.
  - Candidate location because Kakao Alimtalk readiness is already displayed there.

- `src/components/reminder/ReminderSettingsPanel.jsx`
  - Already has notification channel, Kakao Alimtalk readiness, and account-linking card sections.
  - Existing action labels indicate preparation states.

- `src/components/mobile/MobileSettingsTab.jsx`
  - Contains a mobile account card and a mobile notification settings disclosure.
  - Imports and renders `ReminderSettingsPanel`.
  - Candidate location for mobile account-linking state if future design requires parity.

- `src/components/onboarding/*`
  - Existing onboarding components are present, including first-record onboarding and guided-tour flows.
  - Candidate only if GPT design chooses onboarding education; no current account-linking behavior was observed there.

## 6. Risk Areas Observed

Risk: confusing Supabase Auth user id with person ownership.

- Existing legacy tables and repositories still use `auth.uid()` with `user_id` ownership for non-scheduler-v2 surfaces.
- Scheduler v2 uses `person_id` through `current_person_ids()`.
- Kakao account linking must not assume the login account id is the same thing as the person root.

Risk: confusing provider subject with Supabase session id.

- `account_identities` stores both Supabase auth user identity and provider-specific subject identity.
- Existing migration comments explicitly reject using the provider-specific subject as the auth membership key.
- Future code must preserve that distinction.

Risk: using email or name as account-combination proof.

- Existing schema comments and docs say provider email, phone, and display name are review/display information only.
- Current app settings surfaces display name and email for the logged-in account, which can be useful UI context but must not become a silent link criterion.

Risk: linking without explicit user consent.

- Existing account-linking docs require explicit user consent.
- Current login copy says providers are separate accounts, so adding linking later will need distinct copy and confirmation.

Risk: moving existing subscriptions without verification.

- Existing Web Push docs warn that subscriptions are browser/device assets and must not be moved across person ownership automatically.
- `ReminderSettingsPanel` exposes current-device notification state and scheduler summary state in adjacent UI areas.

Risk: direct client access to scheduler v2 base tables.

- Current scheduler v2 repository files use RPC for summary and writes.
- RLS migrations intentionally keep raw base tables closed to authenticated clients.
- Future implementation should avoid adding direct client reads or writes to raw identity/contact/consent tables unless GPT design explicitly changes the boundary.

Risk: callback handling collision.

- `src/App.jsx` currently exchanges OAuth callback codes during initial session sync.
- ChatGPT OAuth consent route has special handling around callback state.
- Kakao account linking would need a clearly separated callback path or state model before implementation.

## 7. Decisions Needed From GPT Before Implementation

GPT design is still required for:

- Whether Kakao account linking reuses the existing Supabase Kakao login redirect or uses a distinct linking start route.
- How OAuth callback state is represented and separated from normal sign-in.
- Where the user starts linking and where the success or failure result is shown.
- What confirmation copy is required before linking.
- How to handle a Kakao identity already connected to the same person.
- How to handle a Kakao identity already connected to a different person.
- What unlink policy applies and whether the last login method can be unlinked.
- Whether audit logging is required for link, conflict, cancel, failure, and unlink attempts.
- Whether account-linking writes happen only through RPC or through a server endpoint.
- Which RLS/RPC boundary owns reading and writing identity rows.
- How staging or disposable verification should be performed.
- Whether any provider configuration, redirect URL, or callback allow-list change is needed.
- How the implementation avoids changing notification consent when only account linking occurs.
- How the implementation avoids moving existing device subscriptions without explicit verification.

## 8. Not Done In This Task

This task did not:

- Apply, query, or reset any production database.
- Apply, query, or reset any staging database.
- Apply, query, or reset any disposable database.
- Use SQL Editor.
- Change env values or secrets.
- Create or edit a DB migration.
- Implement Kakao OAuth account linking.
- Change auth callback behavior.
- Change frontend source files.
- Change tests.
- Change Edge Functions.
- Implement Kakao, SMS, or Push sending.
- Perform account merge or backfill.
- Add raw base table client policies.
- Expose raw email, phone, provider subject, token, secret, or full object identifiers.

## 9. Remaining Gaps

- GPT design is still required before implementation.
- There is no observed dedicated account-linking start RPC or server endpoint.
- There is no observed dedicated Kakao account-linking callback route.
- There is no observed account-linking audit log implementation.
- There is no observed unlink implementation.
- There is no observed staging or disposable verification plan for account linking.
- Existing UI contains candidate locations, but no account-linking CTA is enabled.

## 10. Final Judgment

READ_ONLY_AUDIT_COMPLETE

NOT_READY_FOR_IMPLEMENTATION_UNTIL_GPT_DESIGN

NO_DB_OR_AUTH_CHANGES_MADE
