# Scheduler v2 Disposable RLS Apply Verification Result

## 1. Status

APPLIED_VERIFIED

## 2. Target

- Project name: passmap-scheduler-v2-disposable-20260605
- Masked project ref: rkfq...fbhu
- Confirmed disposable only: yes
- Production/staging touched: no

## 3. Migration state

- Before: `20260604000000` remote applied; `20260605000000` remote pending.
- Applied: `20260605000000_scheduler_v2_rls_policies.sql`.
- After: `20260604000000` and `20260605000000` remote applied.

## 4. RLS table state

- Expected enabled tables:
  - `persons`
  - `account_identities`
  - `contact_points`
  - `contact_verifications`
  - `notification_consents`
  - `reminder_rules`
  - `reminder_channels`
  - `web_push_subscription_owners`
  - `notification_delivery_claims`
  - `notification_delivery_logs`
- Enabled count: 10
- Disabled count: 0
- Result: all 10 scheduler v2 tables have RLS enabled.

## 5. Policy verification

- service role manage policy count: 10
- authenticated base table direct policy count: 0
- authenticated_read_own policy count: 0
- Result: service role manage policies exist for all 10 scheduler v2 tables, and no authenticated base table direct read policy was observed.

## 6. Function verification

### 6.1 current_person_ids()

- Exists: yes
- Language: `sql`
- Volatility: stable (`provolatile = 's'`)
- Security mode: `security definer`
- Fixed search_path: `search_path=public, pg_temp`
- Public execute: revoked
- Authenticated execute: granted

### 6.2 is_member_of_person(uuid)

- Exists: yes
- Signature: `is_member_of_person(target_person_id uuid)`
- Language: `sql`
- Volatility: stable (`provolatile = 's'`)
- Security mode: `security definer`
- Fixed search_path: `search_path=public, pg_temp`
- Public execute: revoked
- Authenticated execute: granted

### 6.3 get_current_person_notification_summary()

- Exists: yes
- Language: `sql`
- Volatility: stable (`provolatile = 's'`)
- Security mode: `security definer`
- Fixed search_path: `search_path=public, pg_temp`
- Public execute: revoked
- Authenticated execute: granted
- Return columns:
  - `person_id uuid`
  - `person_status text`
  - `providers jsonb`
  - `contact_channels jsonb`
  - `consents jsonb`
  - `reminder_rules jsonb`
  - `web_push jsonb`

## 7. Predicate safety

- auth_user_id = auth.uid membership: verified in `current_person_ids()`.
- provider_user_id = auth.uid executable predicate: not observed.
- non-membership fields excluded: provider email, phone, display name, contact destination, Web Push endpoint/hash, and delivery data were not observed as membership predicates.

## 8. Masked summary safety

- raw email exposed: no
- raw phone exposed: no
- raw provider_user_id exposed: no
- raw auth_user_id exposed: no
- raw endpoint/p256dh/auth exposed: no
- delivery claim/log exposed: no

## 9. Minimal behavior/catalog verification

- Migration list confirmed `20260605000000` changed from pending to applied.
- Catalog verification confirmed all 10 expected scheduler v2 tables have RLS enabled.
- Catalog verification confirmed 10 `service_role_manage_*` policies.
- Catalog verification confirmed zero authenticated direct base table read policies.
- Catalog verification confirmed zero `authenticated_read_own` policies.
- Catalog verification confirmed helper and summary function execute grants for `authenticated`.
- Catalog verification confirmed public execute was revoked from helper and summary functions.
- No user data insertion, auth account creation, account linking, backfill, live provider call, or client REST call was performed.

## 10. Secrets handling

No DB password, service role key, anon key, or access token was printed, stored, or documented.

## 11. Production/staging safety

Production/staging were not touched.

## 12. Remaining gaps

- Behavior verification was limited to catalog-level checks.
- No real authenticated user session, REST request, or client integration flow was exercised.
- Future client integration should separately verify the masked summary function through the intended client path.

## 13. Next recommended step

Review this disposable RLS apply result, then design the next client integration or behavior-level verification task without opening raw base table direct read policies.
