# Scheduler v2 Disposable Reset/Reapply Verification Result

## 1. Status

APPLIED_VERIFIED

## 2. Target

- Project name: `passmap-scheduler-v2-disposable-20260605`
- Masked project ref: `rkfq...fbhu`
- Confirmed disposable only: yes
- Production/staging touched: no

## 3. Execution path

- Recreate or reset: reset existing disposable project
- Reason: project list showed a clearly named disposable project and a separate non-disposable project. Recreate would require new project DB password handling, so reset was the safer executable path under the guardrails.
- Migration applied: `20260604000000_scheduler_v2_notification_schema.sql`
- Apply result: remote reset/apply completed through `supabase db reset --linked --version 20260604000000 --no-seed --yes`

Post-apply migration history:

| Local | Remote | Status |
| --- | --- | --- |
| `20260604000000` | `20260604000000` | applied |
| `20260605000000` | empty | not applied |

## 4. Object-level verification

### 4.1 Types/enums

- Scheduler v2 enum/type count: 14

### 4.2 Tables

- Scheduler v2 table count: 10

### 4.3 account_identities auth link

- auth_user_id column: present
- auth_user_id FK to auth.users(id): present
- provider_user_id retained: present
- provider_user_id not treated as auth.uid: source migration comment states `provider_user_id` must not be used as `auth.uid()::text`

### 4.4 Indexes

- active auth_user_id unique index: present (`account_identities_active_auth_user_id_key`)
- active provider/provider_user_id unique index: present (`account_identities_active_provider_user_id_key`)
- delivery claim idempotency indexes: present
  - `notification_delivery_claims_claim_key_key`
  - `notification_delivery_claims_rule_channel_slot_key`

### 4.5 Web Push ownership

- endpoint_hash: present
- raw endpoint/p256dh/auth columns: absent

### 4.6 RLS / policies / functions / triggers

- RLS state: disabled on all 10 scheduler v2 tables after schema-only apply
- policy count: 0
- user trigger count: 0
- scheduler public function count: 0
- backfill object/procedure: 0

RLS disabled is expected for this reset/reapply batch because only `20260604000000` was applied. The RLS draft migration `20260605000000` remains unapplied and should be handled in a later explicitly approved RLS verification task.

## 5. Secrets handling

No DB password, service role key, anon key, or access token was printed, stored, or documented.

## 6. Production/staging safety

Production/staging were not touched.

The CLI project list showed a separate non-disposable project and a clearly named disposable project. The linked project was checked against the disposable project before reset/apply.

## 7. Remaining gaps

- No RLS apply verification was performed.
- No helper function/view verification was performed.
- No client policy verification was performed.
- `20260605000000_scheduler_v2_rls_policies.sql` remains pending on the disposable project.
- RLS is currently disabled on the scheduler v2 tables in the disposable project after schema-only reset/apply.

## 8. Next recommended step

Proceed to a separately reviewed scheduler v2 RLS helper/function/view design, then request explicit approval for disposable RLS apply verification when the helper/client policy draft is ready.
