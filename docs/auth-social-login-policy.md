# PASSMAP Social Login Account Policy

> Last updated: 2026-05-20  
> Status: Current — UX warning only (localStorage hint)  
> Protected area: Auth / Supabase identity — any DB-level changes require explicit approval

---

## 1. Current Policy

### Provider-level Account Separation

PASSMAP uses Supabase Auth with three social providers:

| Provider | Supabase signInWithOAuth provider string | Source |
|---|---|---|
| Google | `"google"` | `src/lib/auth.js:27` |
| Kakao | `"kakao"` | `src/lib/auth.js:43` |
| Naver | `"custom:naver"` | `src/lib/auth.js:59` |

**Supabase's default behavior (automatic identity linking: OFF):**  
Each social provider creates a separate `auth.users` row, even if the email address is the same.  
A user who logs in with Google and later logs in with Kakao using the same email address will receive a **different `auth.users.id`**, and will see a completely empty account.

This has been confirmed in `auth.identities`: a case where the same email existed under both Google and Kakao with different `user_id` values was identified.

### Current UX Mitigation

Two warnings are currently in place in the login modal (`src/App.jsx:10094–10120`):

1. **General provider separation notice** (added in PR #460):  
   > "Google·카카오·네이버는 각각 별도 계정으로 관리됩니다. 처음 가입하신 소셜 계정으로 로그인해 주세요. 다른 방식으로 로그인하면 기존 기록이 보이지 않을 수 있습니다."

2. **localStorage-based last provider hint** (added in PR #462):  
   When a provider button is clicked, the value is written to `localStorage` under key `passmap:lastSocialLoginProvider` (`"google"` | `"kakao"` | `"naver"`).  
   On the next modal open, if a value is present, the modal displays:  
   > "이 브라우저에서 이전에 {Google/카카오/네이버}로 로그인하신 적이 있습니다. 기존 기록을 보려면 같은 방식으로 로그인해 주세요."

   **Important**: This is a client-side browser hint only. It does not query the server and does not reflect the actual signup provider. It only records the last button clicked in this browser.

---

## 2. User Data Impact

All user-facing tables use `user_id uuid REFERENCES auth.users(id)` as the ownership key, enforced by RLS with `auth.uid() = user_id`.

If a user logs in with a different provider and receives a different `auth.users.id`, they will see **no data** from the original account for:

| Table | RLS condition |
|---|---|
| `work_records` | `auth.uid() = user_id` |
| `resume_profiles` | `auth.uid() = user_id` |
| `resume_sentences` | `auth.uid() = user_id` |
| `raw_sources` | `auth.uid() = user_id` |
| `experience_cards` | `auth.uid() = user_id` |
| `user_career_settings` | `auth.uid() = user_id` |
| `reminder_preferences` | `auth.uid() = user_id` |
| `push_subscriptions` | `auth.uid() = user_id` |
| `analysis_inputs` / `analysis_runs` | `auth.uid()::text = user_id` (TEXT type, legacy) |

---

## 3. What Is NOT Implemented (Do Not Add Without Approval)

The following have been considered and explicitly deferred:

| Feature | Reason deferred |
|---|---|
| `auth.identities` direct query | `auth` schema not accessible to anon/user RLS; requires service role |
| Email-based provider lookup API | Email enumeration risk; PIPA review required; rate-limiting needed |
| Automatic account merge | All FK tables use `ON DELETE CASCADE` — merging requires data migration; high risk of data loss |
| `profiles.last_login_provider` DB column | `public.profiles` is currently completely unused (no reads or writes in app code); first write needs staging validation |
| `linkIdentity` / account merge RPC | Requires Supabase identity linking feature; complex rollback; out of scope |

---

## 4. Backlog — Future Candidates

These are not scheduled but may be revisited:

### A. `profiles.last_login_provider` (DB-level last provider)

- Add column: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_provider text;`
- Write on `onAuthStateChange` SIGNED_IN: `supabase.from("profiles").upsert({ id, last_login_provider, updated_at })`
- Normalize `"custom:naver"` → `"naver"` before storing
- **Prerequisite**: Confirm `app_metadata.provider` reflects current session provider (not just primary), validate in staging
- **Risk**: `public.profiles` has no `set_updated_at()` trigger; `updated_at` must be passed explicitly from app layer
- **Note**: This still records "last login provider", not "original signup provider"

### B. `user_auth_preferences` table (alternative to profiles)

- Separate table: `user_id uuid PK → auth.users(id)`, `last_login_provider text`, `updated_at timestamptz`
- Cleaner separation of concerns than adding to `profiles`
- Follows `user_career_settings` pattern (`supabase/sql/20260519_user_career_settings.sql`)

### C. Provider lookup Edge Function / API

- Accept an email, return which provider(s) are registered under that email
- Must use Supabase service role to query `auth.identities`
- Requires: rate-limiting, anonymous response design (avoid exact provider enumeration), PIPA legal review
- High complexity; implement only if user-facing account recovery flow is built

### D. Manual merge procedure (customer support)

- Service-role SQL procedure to migrate all rows from `user_id_B` → `user_id_A` across all tables
- Requires: transactional migration RPC, staging test, backup
- Low priority; only needed if user reports lost data after provider switch

---

## 5. Risk Reference

| Risk | Detail |
|---|---|
| Email enumeration | Provider lookup API exposes whether an email is registered — rate-limit + anonymous response required |
| Personal data exposure | Any cross-user identity lookup must comply with PIPA |
| Naver email unavailability | `custom:naver` may return `null` email if user did not consent to email sharing |
| `custom:naver` normalization | Must store as `"naver"`, not `"custom:naver"`, for UI display consistency |
| `ON DELETE CASCADE` merge risk | Merging accounts by deleting one `auth.users` row cascades deletes to all child tables — irreversible without backup |
| last_login vs first_signup confusion | `last_login_provider` tells you how the user last logged in, not how they originally signed up — must not be used for account recovery decisions |
| `app_metadata.provider` ambiguity | Supabase may return primary provider, not current-session provider — actual behavior must be validated before DB storage |

---

## 6. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-20 | Added login modal provider separation warning | Cheapest fix; no DB/auth changes |
| 2026-05-20 | Added localStorage last-provider hint | Client-only hint; no server risk |
| 2026-05-20 | Deferred `profiles.last_login_provider` | `profiles` table is completely unused in app code; first write needs staging validation |
| 2026-05-20 | Deferred email-based provider lookup | Email enumeration risk; PIPA review pending |
| 2026-05-20 | Deferred account merge/linking | `ON DELETE CASCADE` risk; high complexity |

---

## 7. Related Files

| File | Role |
|---|---|
| `src/lib/auth.js` | OAuth signIn calls; provider strings per provider |
| `src/lib/supabaseClient.js` | PKCE flow config; no identity linking |
| `src/App.jsx:5427,5455,5708` | Reads `app_metadata.provider` into auth state |
| `src/App.jsx:10094–10120` | Login modal with separation warning and localStorage hint |
| `src/App.jsx:1007–1013` | `safeReadLastSocialLoginProvider` / `safeWriteLastSocialLoginProvider` |
| `supabase/sql/20260428_passmap_work_records.sql:13–36` | `public.profiles` table definition and RLS |
| `supabase/sql/20260514_analysis_tables_rls.sql` | RLS for `analysis_inputs` / `analysis_runs` (TEXT user_id) |
