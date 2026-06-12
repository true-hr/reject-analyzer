# Kakao Channel Capabilities Promotion Review

## 1. Scope

This document reviews whether the Kakao channel capability draft from PR #870 is ready to enter a non-disposable promotion review.

Final judgment:

- READY_FOR_PROMOTION_REVIEW
- NOT_APPROVED_FOR_PRODUCTION_APPLY

This is documentation only. It is not an approval to apply, query, reset, or deploy anything in staging or production.

## 2. Target Change Summary

Target PR:

- PR #870: `feat: add kakao channel capability draft`

Target migration:

- `supabase/migrations/20260612133209_notification_channel_capabilities.sql`

Merged change summary:

- Adds `public.notification_channel_capabilities` for coarse channel capability readiness.
- Stores only channel, capability, status, optional reason, metadata, and timestamps.
- Limits capability values to `reminder_send`.
- Limits status values to `ready`, `not_ready`, and `blocked`.
- Adds a unique constraint for channel plus capability.
- Enables RLS and keeps management restricted to the service role.
- Revokes direct table access from public web roles.
- Replaces `public.get_current_person_notification_summary()` so Kakao `send_eligibility` depends on coarse capability readiness.
- Keeps capability reason and metadata out of the summary response.
- Does not add provider account tables, template tables, live send logic, OAuth flow, account linking, or client direct raw base table policies.

## 3. Disposable Verification Summary

Disposable verification from PR #870 reported:

- Migration applied only to a disposable Supabase project.
- No production or staging project was touched.
- `notification_channel_capabilities` existed after disposable apply.
- RLS was enabled.
- Direct table select was revoked and denied for public web roles.
- The only capability table policy was the service-role management policy.
- No authenticated base table policy was added for scheduler v2 tables.
- The summary function remained security definer with `search_path = public, pg_temp`.
- Summary execution remained granted to authenticated callers.
- Summary output preserved the existing arrays and added normalized Kakao readiness behavior.
- Capability reason, capability metadata, raw provider subjects, raw contact values, hashes, and Web Push browser secrets were not exposed in summary output.
- Local helper and repository tests passed.
- Build passed with existing Vite warnings.
- Raw base table client query grep under `src` returned no matches.

Disposable verification is useful evidence, but it is not production or staging approval.

## 4. Promotion Preconditions

Before any non-disposable promotion is approved, confirm all items below:

- A human reviewer accepts PR #870's schema and summary function behavior as the intended production contract.
- The target environment migration ordering is checked without applying changes.
- The target environment already has the prerequisite scheduler v2 schema, enum, helper function, and summary function dependencies.
- The migration does not conflict with any pending or already-applied migration in the target environment.
- The table remains a coarse readiness control only.
- No actual Kakao, SMS, or Push sending path depends on this table as a send implementation.
- No provider account or template table expansion is bundled into the promotion.
- No OAuth, account linking, account merge, or backfill work is bundled into the promotion.
- A separate approval is recorded for staging apply.
- A separate approval is recorded for production apply.
- A rollback owner and decision point are assigned before staging apply.

## 5. RLS, Grants, And Client Query Guardrail

Promotion review must preserve these guardrails:

- RLS remains enabled on `public.notification_channel_capabilities`.
- Public web roles do not receive direct table access.
- Authenticated clients do not receive direct table policies for scheduler v2 raw base tables.
- Client code continues to use the summary RPC path rather than direct raw table queries.
- The capability table remains writable only through privileged server-side operations.
- Summary function execution remains limited to the intended authenticated path.
- The summary function keeps `security definer` and an explicit search path.
- Capability `reason` and `metadata` are not returned by the summary function.

Required checks before apply approval:

- Review the migration diff for any new direct grants to public web roles.
- Review RLS policies for any authenticated raw base table read policy.
- Review frontend source for direct client queries to scheduler v2 base tables.
- Review the summary response shape to ensure it remains coarse and non-identifying.

## 6. Kakao `send_eligibility` Rules

The promotion decision depends on preserving these rules:

- Identity, contact, and consent alone must never produce `ready`.
- `ready` requires active Kakao identity, active Kakao contact, granted reminder consent, and capability status `ready`.
- Missing capability produces `not_ready`.
- Capability status `not_ready` produces `not_ready`.
- Capability status `blocked` produces `blocked`.
- Blocked identity produces `blocked`.
- Blocked contact produces `blocked`.
- Revoked consent produces `blocked`.
- Missing identity, missing contact, or missing consent produces `not_ready`.
- Unknown future states must not silently become `ready`.

Expected behavior matrix:

| Identity | Contact | Consent | Capability | Expected |
| --- | --- | --- | --- | --- |
| active | active | granted | ready | ready |
| active | active | granted | missing | not_ready |
| active | active | granted | not_ready | not_ready |
| active | active | granted | blocked | blocked |
| active | active | revoked | ready | blocked |
| blocked | active | granted | ready | blocked |
| active | blocked | granted | ready | blocked |

## 7. Privacy And Security Checklist

Before any non-disposable apply approval, confirm:

- No database passwords, API tokens, webhook secrets, sender keys, profile keys, or provider tokens are printed or documented.
- No raw provider subject is stored in the capability table.
- No raw phone number, raw email, raw Kakao identifier, normalized contact value, destination hash, or Web Push browser secret is printed or documented.
- No full production or staging object identifiers are included in PR text, verification notes, logs, screenshots, or docs.
- Capability metadata remains non-secret and non-identifying.
- Summary output remains coarse and excludes capability reason and metadata.
- Summary output remains suitable for frontend state rendering only.
- Logs from any future staging or production review are masked before being added to documentation.

## 8. Rollback And Revert View

Rollback planning must be explicit before promotion:

- The schema addition is append-only, but the summary function replacement is behavior-changing.
- Reverting the promotion should restore the prior summary function behavior or apply a follow-up migration that removes capability gating.
- Dropping the capability table is a separate destructive decision and must not be bundled into an emergency revert without approval.
- If staging shows unexpected frontend behavior, prefer reverting the summary function behavior before considering table removal.
- Because the capability table stores coarse readiness only, emergency rollback should not require provider data cleanup.
- Any production rollback must be handled as a separate approved database operation.

## 9. Required Approvals Before Promotion

The following approvals are required before any non-disposable apply:

- Product or owner approval for changing Kakao readiness semantics.
- Engineering approval for the summary function contract.
- Security or data-review approval for privacy and RLS posture.
- Database migration approval for staging.
- Separate database migration approval for production.
- Explicit approval for any staging or production query used to verify the result.
- Explicit rollback plan approval.

Without those approvals, the correct status remains:

- READY_FOR_PROMOTION_REVIEW
- NOT_APPROVED_FOR_PRODUCTION_APPLY

## 10. Not Done In This Documentation Task

This task did not:

- Apply, query, or reset production databases.
- Apply, query, or reset staging databases.
- Apply, query, or reset disposable databases.
- Use SQL Editor.
- Change migrations.
- Change Edge Functions.
- Change GitHub workflows.
- Change environment variables or secrets.
- Implement Kakao, SMS, or Push sending.
- Implement OAuth or account linking.
- Implement account merge or backfill.
- Add raw base table client policies.
- Expand provider account or template table design.
- Change frontend source.
- Change tests.
- Change package files.
- Change service worker, provider send files, or cron configuration.

## 11. Remaining Gaps

- Non-disposable migration ordering still needs environment-specific review.
- Staging and production apply approvals are still missing.
- No staging or production verification has been performed.
- Capability update ownership and admin workflow remain follow-up work.
- Provider account and template implementation remain out of scope.
- Live Kakao sending remains out of scope.

## 12. Final Decision

READY_FOR_PROMOTION_REVIEW

NOT_APPROVED_FOR_PRODUCTION_APPLY
