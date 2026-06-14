# Account Recovery Plan: Kakao to Google Merge

Date: 2026-06-14
Status: Plan only. No DB write, auth deletion, identity unlink, provider setting change, or live message send has been executed.

## 1. Background

Kakao OAuth and `linkIdentity` can start successfully, and the Kakao OAuth screen is displayed. The failure happens at OAuth return with:

- `error_code=identity_already_exists`
- `error_description=Identity is already linked to another user`

Read-only correlation confirmed that the conflicting Kakao identity belongs to `source_candidate_4`, not to the current Google account. `source_candidate_4` is a real Kakao direct-login account with PASSMAP data, so it must not be treated as a disposable test account.

The current Google account is `target_google_link_target`. It has its own scheduler v2 person/account identity state. The recovery goal is to preserve source data, move ownership into the target account/person where appropriate, then release the Kakao Auth identity from the source account so Kakao can be linked to the target account.

## 2. Alias Definitions

| Alias | Meaning | Provider role |
| --- | --- | --- |
| `source_candidate_4` | Existing Kakao direct-login auth user that currently owns the conflicting Kakao identity | Kakao |
| `target_google_link_target` | Current Google login auth user that attempted Kakao account linking | Google |
| `source_person` | Scheduler v2 person currently linked to `source_candidate_4` | Source scheduler v2 owner |
| `target_person` | Scheduler v2 person currently linked to `target_google_link_target` | Target scheduler v2 owner |

No raw auth user id, person id, provider subject, email, phone, token, or secret is required for this plan.

## 3. Current Data Snapshot

### Source Counts

`source_candidate_4` has 86 user-scoped PASSMAP rows.

| Table | Count |
| --- | ---: |
| `work_records` | 15 |
| `raw_sources` | 2 |
| `experience_cards` | 5 |
| `experience_evidence` | 6 |
| `resume_profiles` | 1 |
| `reminder_preferences` | 1 |
| `reminder_deliveries` | 5 |
| `push_subscriptions` | 1 |
| `analysis_inputs` | 25 |
| `analysis_runs` | 25 |

Scheduler v2 state:

| Item | Count |
| --- | ---: |
| `account_identities` | 1 |
| Active `account_identities` | 1 |
| Linked persons | 1 |
| Kakao scheduler identity rows | 1 |
| Google scheduler identity rows | 0 |

### Target Counts

`target_google_link_target` has 263 user-scoped PASSMAP rows and 2 person-scoped scheduler v2 rows.

| Table | Count |
| --- | ---: |
| `work_records` | 87 |
| `raw_sources` | 13 |
| `experience_cards` | 13 |
| `experience_evidence` | 48 |
| `notion_connections` | 1 |
| `google_calendar_connections` | 1 |
| `reminder_preferences` | 1 |
| `reminder_deliveries` | 3 |
| `push_subscriptions` | 1 |
| `user_mcp_pairings` | 5 |
| `chatgpt_oauth_authorization_codes` | 3 |
| `chatgpt_oauth_access_tokens` | 3 |
| `analysis_inputs` | 42 |
| `analysis_runs` | 42 |
| `contact_points` | 1 |
| `notification_consents` | 1 |

Scheduler v2 state:

| Item | Count |
| --- | ---: |
| `account_identities` | 1 |
| Active `account_identities` | 1 |
| Linked persons | 1 |
| Google scheduler identity rows | 1 |
| Kakao scheduler identity rows | 0 |

## 4. Merge Principles

- Preserve data before changing identity state.
- Run data transfer verification before any auth identity release.
- Do not delete `source_candidate_4` until source public rows are 0 or explicitly expected to remain.
- Treat Kakao login as account identity only.
- Kakao login is not Alimtalk consent.
- Do not auto-grant Alimtalk consent.
- Do not send live Kakao, SMS, or Push during recovery.
- Keep source/target references alias-only in planning and reports.
- Run recovery as a controlled one-time operation after explicit approval.

## 5. Source to Target Transfer Scope

Transfer planning covers:

- `work_records`
- `raw_sources`
- `experience_cards`
- `experience_evidence`
- `resume_profiles`
- `reminder_preferences`
- `reminder_deliveries`
- `push_subscriptions`
- `analysis_inputs`
- `analysis_runs`
- scheduler v2 `account_identities`

Out of current scope unless later approved:

- target-only `notion_connections`
- target-only `google_calendar_connections`
- target-only ChatGPT OAuth tables
- target person contact/consent rows
- any Auth schema mutation

## 6. Table Transfer Draft

This section describes intended update categories only. It is not an executable SQL script.

| Table | Ownership column | Transfer draft | FK/order notes | RLS/trigger notes |
| --- | --- | --- | --- | --- |
| `work_records` | `user_id` | Reassign source rows to target auth user. | Do before or together with dependent `raw_sources` / `experience_cards` references. Existing row ids should remain stable. | RLS enabled. No user trigger observed. |
| `raw_sources` | `user_id` | Reassign source rows to target auth user. | Has optional FK to `work_records`; preserve `work_record_id`. | RLS enabled. Update trigger observed. |
| `experience_cards` | `user_id` | Reassign source rows to target auth user. | Has optional FKs to `work_records` and `raw_sources`; preserve references. | RLS enabled. Update trigger observed. |
| `experience_evidence` | `user_id` | Reassign source rows to target auth user. | Depends on `experience_cards`; preserve card/source references. | RLS enabled. No user trigger observed. |
| `resume_profiles` | `user_id` | Reassign source rows to target auth user. | No observed source/target unique overlap metadata beyond primary key. | RLS enabled. No user trigger observed. |
| `reminder_preferences` | `user_id` | Do not blindly reassign. Resolve 1 unique overlap first. | Unique key includes user and reminder type. | RLS enabled. Update trigger observed. |
| `reminder_deliveries` | `user_id` | Do not blindly reassign duplicates. Resolve 3 unique overlaps first. | Unique key includes user, reminder type, delivery channel, and week slot. | RLS enabled. Update trigger observed. |
| `push_subscriptions` | `user_id` | Reassign source row if endpoint overlap remains 0. | Endpoint is globally unique. Recheck before execution. | RLS enabled. Update trigger observed. |
| `analysis_inputs` | `user_id` text | Reassign source rows to target auth user string. | `analysis_runs.input_id` depends on these rows. Keep ids stable. | RLS enabled. No user trigger observed. |
| `analysis_runs` | `user_id` text | Reassign source rows to target auth user string. | Preserve `input_id` references. | RLS enabled. No user trigger observed. |
| `account_identities` | `auth_user_id`, `person_id` | Move scheduler Kakao identity row from source auth/person to target auth/person only after policy is approved. | Active `(auth_user_id, provider)` and active `(provider, provider_user_id)` unique indexes exist. | RLS enabled. Do not treat this as Supabase Auth identity release. |

Recommended FK order for data rows:

1. Snapshot all source and target counts.
2. Resolve overlap policy for `reminder_preferences` and `reminder_deliveries`.
3. Update root owner rows with stable ids: `work_records`, `analysis_inputs`.
4. Update dependent rows: `raw_sources`, `experience_cards`, `experience_evidence`, `analysis_runs`.
5. Update standalone user-owned rows: `resume_profiles`, non-overlap `push_subscriptions`.
6. Apply approved overlap handling for reminders.
7. Move scheduler v2 `account_identities` only when source data verification passes.

## 7. Unique Overlap Policy Draft

### `reminder_preferences`

Observed overlap: 1 row.

Draft policy:

- Keep target preference.
- Do not blindly transfer source preference.
- Candidate handling for source preference:
  - skip transfer, or
  - archive as an audit-only record if a product archive table exists, or
  - manually compare and update target only after explicit product approval.
- Execution is forbidden until this policy is explicitly selected.

### `reminder_deliveries`

Observed overlap: 3 rows.

Draft policy:

- Keep target existing delivery rows.
- Treat source duplicate delivery rows as historical duplicates.
- Candidate handling for source duplicates:
  - skip transfer, or
  - archive if a non-sending audit archive path exists.
- Do not create duplicate delivery records.
- Execution is forbidden until this policy is explicitly selected.

### Other Unique Checks

Observed overlaps:

- `push_subscriptions` endpoint overlap: 0
- `google_calendar_connections` target user overlap from source: 0
- `notion_connections` workspace overlap from source: 0
- scheduler `account_identities` provider-user overlap against target: 0

These counts must be rechecked immediately before execution.

## 8. Auth Identity Release Candidate Comparison

Supabase documentation basis:

- Manual identity linking is supported through `linkIdentity()` when manual linking is enabled.
- User-driven `unlinkIdentity()` is documented for a logged-in user after fetching identities, but it requires the user to have at least two linked identities.
- The current source account is a Kakao direct-login account. If it has only one Auth identity, user-driven unlink is not a valid standalone release path until a second safe identity exists.

### Candidate A: Data Transfer, Then Delete Source Auth User

Purpose: deleting source auth user may release the Kakao Auth identity.

Risks:

- High cascade risk because many public tables reference `auth.users` with `ON DELETE CASCADE`.
- Existing source sessions/JWTs may remain valid until expiry unless session handling is addressed.
- Supabase documentation notes that deleting an Auth user does not automatically sign out that user; existing JWTs remain valid until expiration.
- Supabase documentation also warns that Auth user deletion is blocked when the user owns Supabase Storage objects.
- Irreversible if performed before source data transfer is fully verified.

Required permissions:

- Supabase Auth admin privilege.
- Production DB write privilege for pre-delete verification.

Verification conditions:

- Source public user-scoped rows are 0 or intentionally retained.
- Source scheduler `account_identities` state is expected.
- Storage ownership check passes immediately before deletion.
- Kakao linkIdentity from target is ready to retry.
- Source active sessions and JWT residual risk are explicitly accepted or mitigated.

### Candidate B: Supabase Admin Identity Unlink/Release

Purpose: release only the Kakao Auth identity from source without deleting the source auth user.

Risks:

- Requires confirming Supabase supports the specific identity release operation for this project state.
- Incorrect unlink can lock out the Kakao account if source has no other login method.
- Still requires data transfer verification first.
- Official client documentation covers user-session `unlinkIdentity()` behavior. Admin/Dashboard identity release must be confirmed in the actual project UI/API before relying on it.

Required permissions:

- Supabase Auth admin privilege.
- Ability to inspect supported identity admin API behavior safely.

Verification conditions:

- Source has a safe remaining access path or explicit decision that it no longer needs one.
- Kakao identity is no longer attached to source after release.
- Target `linkIdentity` succeeds afterward.

### Candidate C: User-Driven Source Backup Identity, Then Unlink

Purpose: add a secondary identity to source first, then release Kakao using a user-driven or admin-assisted flow.

Risks:

- Requires user interaction and careful session handling.
- May not be available depending on Supabase identity management behavior.
- Longer operational path with more manual steps.

Required permissions:

- User access to source account.
- Possibly Supabase Auth admin support depending on unlink method.

Verification conditions:

- Source can still log in after Kakao release.
- Target can link Kakao.
- No Alimtalk consent is granted as a side effect.

Current recommendation: Candidate B is the preferred recovery path if the Dashboard/Admin API can release the source Kakao identity without deleting the source auth user. Candidate A should remain last resort because of cascade and JWT/session residual risk.

## 9. Source Auth User Deletion Cascade Safety Checklist

Before considering source auth deletion:

- Confirm all source public user-scoped rows are 0 or intentionally retained.
- Confirm `source_person` rows are either moved, preserved by policy, or intentionally left.
- Confirm Storage ownership and object metadata are checked.
- Confirm active sessions/JWT residual risk is understood.
- Confirm no live Kakao/SMS/Push send is triggered.
- Confirm target account can retry Kakao `linkIdentity`.
- Confirm final count snapshot is captured.
- Confirm rollback limits are understood before deletion.
- Confirm existing source sessions/JWTs are handled. Deleting the user does not immediately invalidate already issued JWTs; they remain valid until expiration unless session/token handling is separately addressed.

Known cascade risk:

Public tables with `auth.users` FK `ON DELETE CASCADE` include `account_identities`, `work_records`, `raw_sources`, `experience_cards`, `experience_evidence`, `external_record_links`, `resume_profiles`, `resume_sentences`, `reminder_preferences`, `reminder_deliveries`, `push_subscriptions`, `notion_connections`, `google_calendar_connections`, ChatGPT OAuth tables, and related user settings tables.

Storage ownership read-only check on 2026-06-14:

| Alias | Storage object count | Bucket count |
| --- | ---: | ---: |
| `source_candidate_4` | 0 | 0 |
| `target_google_link_target` | 0 | 0 |

This reduces the specific Storage-deletion blocker risk for the audited moment, but the check must be repeated immediately before any auth deletion.

## 10. Dry-Run Verification Plan

### Before Count

Capture source and target counts for every transfer table:

- Source expected user-scoped total: 86
- Target expected user-scoped total before transfer: 263
- Target expected person-scoped total before transfer: 2

### Expected After Count

Naive target expected count would be 349 user-scoped rows. This must be adjusted for overlap policy:

- `reminder_preferences`: 1 source row overlaps. If skipped, target does not increase for this table.
- `reminder_deliveries`: 3 source rows overlap. If skipped, target increases by source non-overlap delivery rows only.

Expected source count after data transfer:

- 0 source user-scoped rows for transferred tables, except explicitly skipped/archived overlap rows if policy leaves them behind.
- 0 source active scheduler identity rows if scheduler identity is moved.

### Rollback Possibility

Rollback is feasible only before auth identity release or auth user deletion. After identity release or deletion, rollback requires a separate Auth recovery plan and may not be fully reversible.

Dry-run should produce:

- source before counts
- target before counts
- expected target after counts
- expected source after counts
- overlap rows count by table
- rows intentionally skipped or archived
- final invariant checklist
- storage ownership count by alias
- source active session count or an explicit statement that session/JWT invalidation is handled by expiry only

## 11. Proposed Execution Steps

No step below is approved for execution by this document.

1. Snapshot source and target counts.
2. Confirm disposable/staging rehearsal possibility.
3. Draft one-time transaction SQL using aliases resolved inside a protected admin session.
4. Finalize overlap policy for `reminder_preferences` and `reminder_deliveries`.
5. Obtain explicit approval.
6. Execute data transfer in one transaction.
7. Verify source/target counts and source remaining rows.
8. Recheck Storage ownership and session/JWT risk.
9. Perform source Auth identity release using approved candidate A, B, or C.
10. Retry Kakao `linkIdentity` from the Google target account.
11. Confirm `sync_current_person_auth_identities` behavior after link.
12. Reload account summary and scheduler summary.
13. Confirm Kakao identity is active on target.
14. Confirm Alimtalk consent was not auto-granted.
15. Confirm send eligibility remains `not_ready` until real consent and channel readiness are separately established.

## 12. Required Approval Text

Use this exact approval text before any write action:

> source_candidate_4의 PASSMAP 데이터를 target_google_link_target으로 이전하고, 중복 preference/delivery 처리 정책을 적용한 뒤, Kakao Auth identity release 절차를 진행하는 것을 승인합니다.

## 13. Absolute Prohibitions Before Approval

- No DML before approval.
- No auth user deletion before approval.
- No identity unlink or release before approval.
- No source data loss.
- No raw identifier exposure.
- No DB migration/apply.
- No SQL Editor execution.
- No provider/env/secret setting change.
- No live Kakao/SMS/Push send.
- No Alimtalk consent auto-grant.

## 14. Read-Only Basis

This plan is based on read-only audit results:

- `source_candidate_4` is the actual Kakao direct-login conflict account.
- `source_candidate_4` owns 86 PASSMAP rows.
- `target_google_link_target` owns 263 user-scoped rows and 2 person-scoped scheduler rows.
- `source_candidate_4` and `target_google_link_target` each have exactly one scheduler v2 account identity and one linked person.
- Unique overlap exists in `reminder_preferences` and `reminder_deliveries`.
- Source auth deletion has high cascade risk through public FKs.

No raw auth user id, person id, provider subject, email, phone, token, or secret is included in this document.
