# Kakao Account Linking Entrypoint Verification - 2026-06-12

## Scope

- Branch: `feat/kakao-account-linking-entrypoint-20260612`
- PR: `feat: add kakao account linking entrypoint`
- Change class: Implementation Batch / Kakao account linking entrypoint + identity sync RPC draft

## Implemented Surface

- Added a logged-in settings entrypoint for starting Kakao account linking.
- Kept normal Kakao sign-in on the existing OAuth sign-in helper and added a separate manual identity-linking helper.
- Added a draft RPC migration named `sync_current_person_auth_identities()`.
- The frontend calls session refresh, identity sync RPC, and notification summary reload after the OAuth return signal.

## Kakao Login / Linking / Alimtalk Separation

- Normal Kakao login remains separate from manual Kakao account linking.
- Kakao account linking does not call contact or consent write RPCs.
- Kakao account linking does not mark Kakao Alimtalk reminder consent as granted.
- Existing Kakao Alimtalk ready state continues to depend on identity, contact, consent, and channel capability summary state.

## Draft RPC Verification Notes

- RPC name: `sync_current_person_auth_identities()`.
- Execution is intended for authenticated users only.
- Current person resolution uses `current_person_ids()` membership from the signed-in auth user.
- The RPC fails when the current person cannot be resolved to exactly one person.
- Provider subject, provider email snapshot, and provider name are not supplied by the client.
- The RPC reads linked Supabase Auth identities server-side.
- If the same provider identity is already linked to another person, the RPC raises `IDENTITY_ALREADY_LINKED_TO_DIFFERENT_PERSON`.
- The RPC returns provider-level status only and does not return provider subject, full identifiers, contacts, or push secrets.
- No authenticated direct base table policy is added for `account_identities`.

## Disposable Verification

- Approval phrase received for disposable-only migration apply and verification.
- Target disposable project: `rkfq...fbhu` (`passmap-scheduler-v2-disposable-20260605`).
- Production-like project observed separately: `pqne...azsk` (`reject analyzer`).
- The target disposable project ref is different from the production-like project ref.
- Migration apply result: PASS. Remote migration history contains `20260612150653`.
- A SQL issue was found during disposable verification: the draft RPC must read Supabase Auth provider subject from `auth.identities.provider_id`, not `auth.identities.id`.
- The target migration was minimally corrected and the corrected SQL was re-run on the disposable project for verification.
- No production/staging DB apply/query/reset was performed.

## Disposable Verification Results

- `sync_current_person_auth_identities()` authenticated execute: PASS.
- `sync_current_person_auth_identities()` anon execute denied: PASS.
- No current person raises `CURRENT_PERSON_NOT_FOUND`: PASS.
- Multiple current persons raise `CURRENT_PERSON_AMBIGUOUS`: PASS.
- Linked Kakao auth identity syncs to one active Kakao account identity for the current person: PASS.
- `current_person_ids()` returns distinct person membership when multiple active provider rows point to the same person: PASS.
- Kakao identity sync does not grant Kakao Alimtalk reminder consent: PASS.
- Identity-only state remains not ready: PASS.
- Identity plus contact plus consent without capability remains not ready: PASS.
- Identity plus contact plus consent plus ready capability becomes ready: PASS.
- Same provider identity already linked to another person raises `IDENTITY_ALREADY_LINKED_TO_DIFFERENT_PERSON`: PASS.
- No authenticated direct RLS policy was added for `account_identities`: PASS.
- No authenticated direct RLS policy was added for `notification_channel_capabilities`: PASS.
- RPC output returns provider/status only: PASS.
- Summary check did not expose provider subject or destination hash fixture values: PASS.
- Disposable fixture cleanup: PASS. Fixture users, persons, auth identities, and account identities were removed; prior channel capability state was restored.

## Local Validation Results

- `git diff --check`: PASS.
- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS.
- `node src/components/reminder/__tests__/kakaoAlimtalkStateFormat.test.js`: PASS.
- Raw base table query grep in `src`: PASS, no matches.
- Identity/merge safety grep: existing guardrail documentation and earlier migration warning comments matched; no new executable unsafe membership predicate or authenticated base table policy was added.
- `npm run build`: PASS in the implementation/build correction step before disposable DB verification. Build was not re-run during disposable-only verification because no source/frontend files changed.

## Required Verification Cases

1. No Kakao linked identity: expected summary remains missing/not connected until a provider identity exists.
2. Kakao linked identity exists: draft RPC is designed to upsert an active Kakao identity for the current person.
3. Consent separation: identity sync does not grant Kakao Alimtalk consent.
4. Send readiness: Kakao send ready still requires identity, contact, consent, and capability readiness.
5. Cross-person conflict: draft RPC raises an explicit conflict error instead of moving accounts between people.
6. Client raw table access: frontend uses RPC/summary calls and does not query `account_identities` directly.
7. Privacy: provider subject, full identifiers, contact values, and push secrets are not surfaced in UI, summary, or this document.

## Guardrails

- No production/staging DB access.
- No SQL Editor.
- No env/secret changes.
- No live Kakao/SMS/Push send implementation.
- No account merge/backfill.
- No contact/name-only account joining.
- No raw base table client queries.
- No Alimtalk consent grant from account linking.

## Final Status

- `DRAFT_IMPLEMENTATION_COMPLETE`
- `DISPOSABLE_DB_VERIFICATION_COMPLETE`
- `NO_PRODUCTION_OR_STAGING_DB_ACCESS`
