# PASSMAP Scheduler v2 Local Serve Dry-run QA Runbook

## 1. Purpose

This document is the runbook for validating the PASSMAP scheduler v2 dry-run skeleton through local serve.

This is not an execution report. It defines pre-run checks, safe procedure, success criteria, stop conditions, and result recording for a future local mock/fixture QA session.

This runbook is not:

- a Supabase deploy approval
- a DB apply approval
- a provider integration approval
- a cron cutover approval

## 2. Current State Summary

Expected state before this runbook is executed:

- Scheduler v2 is mock/fixture dry-run only.
- Pure evaluation logic is split into `supabase/functions/send-experience-recall-reminders-v2/contract.ts`.
- Deno contract tests exist in `supabase/functions/send-experience-recall-reminders-v2/contract_test.ts`.
- GitHub Actions runs both Deno check and Deno test for scheduler v2 dry-run contract coverage.
- There has been no Supabase deploy for scheduler v2.
- There has been no DB apply for scheduler v2.
- There has been no provider call integration for scheduler v2.
- There has been no Kakao/SMS/Email/Web Push message sending for scheduler v2.
- There has been no cron connection for scheduler v2.

Before using this runbook, confirm PR #715 or its equivalent contract-test PR is merged into the target branch. If `contract.ts` or `contract_test.ts` is missing from the target branch, stop and return to the contract-test PR instead of running local serve QA.

## 3. Local Serve Prerequisites

Check these items before any local serve attempt. This documentation task does not install or run any of them.

- [ ] Node/npm installation status is known.
- [ ] Deno installation status is known.
- [ ] Supabase CLI installation status is known.
- [ ] Docker Desktop installation and running status are known.
- [ ] Repository is updated to latest `main`.
- [ ] `git status --short --branch` has been reviewed.
- [ ] Existing dirty worktree changes are classified and not mixed with scheduler v2 QA.
- [ ] Whether Supabase login is required for local serve has been separately confirmed; do not assume login is required for this mock/fixture endpoint.
- [ ] No real project ref is used.
- [ ] No production token is used.
- [ ] No service role key is used.
- [ ] `.env` is not created or modified.
- [ ] No production Supabase project is linked or targeted.

## 4. Absolute Prohibited Line

Do not perform any of the following during local serve dry-run QA:

- `supabase functions deploy`
- `supabase db push`
- `supabase migration up`
- remote DB apply
- Supabase SQL Editor execution
- provider API calls
- Kakao/SMS/Email/Web Push real sending
- env/secret add or edit
- service role key usage
- cron create or edit
- Vercel/Supabase production setting changes
- direct push to `main`
- force push

## 5. Local Serve Safety Principles

- Local serve is only for mock/fixture dry-run endpoint verification.
- `live` mode must return HTTP 403.
- `providerCalls`, `messagesSent`, and `ledgerWrites` must be `0` in every response.
- `writeLedger=true` must be forced to false.
- The function must work without real DB, real provider, real cron, or real env/secret.
- If local serve fails, return to a code-fix PR. Do not bypass the failure by deploying.

## 6. Recommended Local Serve Command Example

Example only. Do not run this command as part of this documentation task.

```bash
supabase functions serve send-experience-recall-reminders-v2 --no-verify-jwt
```

Required notes for any future execution:

- This command is an example for local mock/fixture QA only.
- Do not connect it to a real production project ref.
- Stop if env/secret is required.
- Stop if there is any DB/provider access trace.

## 7. Local Endpoint Placeholder

Use the local placeholder endpoint only:

```text
http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2
```

Do not use:

- a deployed endpoint
- a production URL
- an auth token
- a production project value

## 8. Manual Curl QA Scenarios

These commands are examples for a future local serve session. Do not run them as part of this documentation task.

In every scenario, `providerCalls`, `messagesSent`, and `ledgerWrites` must be `0`.

### GET Health

Purpose: confirm the local endpoint is serving the mock fixture skeleton.

```bash
curl -i 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2'
```

Expected HTTP status: `200`

Expected core fields:

- `ok: true`
- `mode: mock_fixture_dry_run_only`
- `liveMode: rejected`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### OPTIONS Preflight

Purpose: confirm CORS preflight is handled without invoking evaluation logic.

```bash
curl -i -X OPTIONS 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2'
```

Expected HTTP status: `204`

Expected core fields:

- No response body required.
- CORS headers are present.
- No provider/message/ledger side effect.

### Default POST Dry-run

Purpose: confirm default request evaluates fixtures in `dry_run` mode.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected HTTP status: `200`

Expected core fields:

- `ok: true`
- `mode: dry_run`
- `results` array exists
- `safety.fixtureOnly: true`
- `safety.liveModeRejected: true`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Explicit 18:00 KST Dry-run

Purpose: confirm the fixture matrix matches the response contract for the 18:00 Asia/Seoul slot.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "timezone": "Asia/Seoul",
    "lookbackMinutes": 15,
    "limit": 100
  }'
```

Expected HTTP status: `200`

Expected core fields:

- `rule_daily_1800` -> `would_send`
- `rule_not_due_1700` -> `would_skip_not_due`
- `rule_disabled_1800` -> `would_skip_disabled_rule`
- `rule_deleted_1800` -> `would_skip_deleted_rule`
- `rule_contact_missing_1800` -> `would_skip_contact_missing`
- `rule_contact_unverified_1800` -> `would_skip_contact_unverified`
- `rule_consent_missing_1800` -> `would_skip_consent_missing`
- `rule_consent_revoked_1800` -> `would_skip_consent_revoked`
- `rule_kakao_provider_not_ready_1800` -> `would_skip_provider_not_ready`
- `rule_kakao_sms_fallback_1800` -> `fallback_would_run`
- `rule_kakao_sms_fallback_skip_1800` -> `fallback_would_skip`
- `rule_duplicate_claim_1800` -> `would_skip_duplicate_claim`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Inspect Only

Purpose: confirm inspect-only mode suppresses final dry-run decision status while preserving `inspectedStatus`.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "inspect_only",
    "now": "2026-06-03T09:00:00.000Z",
    "timezone": "Asia/Seoul",
    "targetRuleId": "rule_duplicate_claim_1800"
  }'
```

Expected HTTP status: `200`

Expected core fields:

- `ok: true`
- `mode: inspect_only`
- `evaluatedRules: 1`
- `results[0].decision.status: inspect_only`
- `results[0].decision.inspectedStatus: would_skip_duplicate_claim`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Live Rejected

Purpose: confirm live mode remains blocked.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "live"
  }'
```

Expected HTTP status: `403`

Expected core fields:

- `ok: false`
- `error: LIVE_MODE_REJECTED`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Invalid Mode

Purpose: confirm unsupported mode is rejected.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "preview"
  }'
```

Expected HTTP status: `400`

Expected core fields:

- `ok: false`
- `error: INVALID_MODE`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Invalid Now

Purpose: confirm invalid timestamp is rejected.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "not-a-date"
  }'
```

Expected HTTP status: `400`

Expected core fields:

- `ok: false`
- `error: INVALID_NOW`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Invalid Timezone

Purpose: confirm invalid IANA timezone is rejected.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "timezone": "Invalid/Timezone"
  }'
```

Expected HTTP status: `400`

Expected core fields:

- `ok: false`
- `error: INVALID_TIMEZONE`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Write Ledger Forced False

Purpose: confirm `writeLedger=true` cannot produce ledger writes.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "writeLedger": true
  }'
```

Expected HTTP status: `200`

Expected core fields:

- `ok: true`
- `warnings` includes `writeLedger=true was forced to false`
- every `results[].ledger.writeLedger` is `false`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Target Rule Fallback

Purpose: confirm fallback would-run fixture can be isolated by rule id.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "targetRuleId": "rule_kakao_sms_fallback_1800"
  }'
```

Expected HTTP status: `200`

Expected core fields:

- `evaluatedRules: 1`
- `results[0].rule.id: rule_kakao_sms_fallback_1800`
- `results[0].decision.status: fallback_would_run`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Target Rule Duplicate Claim

Purpose: confirm duplicate claim fixture can be isolated by rule id.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "targetRuleId": "rule_duplicate_claim_1800"
  }'
```

Expected HTTP status: `200`

Expected core fields:

- `evaluatedRules: 1`
- `results[0].rule.id: rule_duplicate_claim_1800`
- `results[0].decision.status: would_skip_duplicate_claim`
- `results[0].ledger.duplicateFound: true`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### Target Person Fallback

Purpose: confirm fallback would-run fixture can be isolated by person id.

```bash
curl -i -X POST 'http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "targetPersonId": "person_demo_12"
  }'
```

Expected HTTP status: `200`

Expected core fields:

- `evaluatedRules: 1`
- `results[0].rule.personId: person_demo_12`
- `results[0].decision.status: fallback_would_run`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

## 9. Success Criteria

- [ ] GET returns `ok: true` and `mode: mock_fixture_dry_run_only`.
- [ ] Default POST returns `ok: true`.
- [ ] 18:00 KST fixture matrix matches the response contract.
- [ ] `live` mode returns HTTP 403 `LIVE_MODE_REJECTED`.
- [ ] Invalid mode returns HTTP 400 `INVALID_MODE`.
- [ ] Invalid now returns HTTP 400 `INVALID_NOW`.
- [ ] Invalid timezone returns HTTP 400 `INVALID_TIMEZONE`.
- [ ] `writeLedger=true` response includes the forced-false warning.
- [ ] `providerCalls`, `messagesSent`, and `ledgerWrites` are always `0`.
- [ ] No env/secret is required.
- [ ] No DB/provider/cron access is observed.
- [ ] Local serve is stopped after QA.
- [ ] Worktree is clean after local serve QA.

## 10. Stop Conditions

Stop immediately if any of the following happens:

- env/secret is required
- service role key is required
- remote Supabase connection is required
- provider credential is required
- actual message sending becomes possible
- DB read/write is attempted
- cron-related command is required
- local serve references a production endpoint
- Deno test passes but local serve response differs from the contract
- existing dirty worktree must be touched

## 11. QA Result Recording Template

| Scenario | Command | Expected status | Actual status | Expected counters | Actual counters | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET health |  | 200 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| OPTIONS preflight |  | 204 |  | no side effect |  |  |  |
| default POST dry_run |  | 200 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| explicit 18:00 KST dry_run |  | 200 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| inspect_only |  | 200 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| live rejected |  | 403 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| invalid mode |  | 400 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| invalid now |  | 400 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| invalid timezone |  | 400 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| writeLedger forced false |  | 200 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| targetRuleId fallback |  | 200 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| targetRuleId duplicate claim |  | 200 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |
| targetPersonId fallback |  | 200 |  | providerCalls/messagesSent/ledgerWrites = 0 |  |  |  |

## 12. Next Stage Entry Conditions

Do not deploy immediately after local serve QA passes. Passing local serve QA only allows consideration of separate next-stage work.

Each next stage requires a separate PR and approval:

- A. local serve QA result documentation PR
- B. provider dry-run adapter design document
- C. DB migration promotion review
- D. Protected Supabase deploy plan

## 13. Final Caution

- This runbook is not a Supabase deploy approval.
- This runbook is not a DB apply approval.
- This runbook is not a Kakao/SMS provider integration approval.
- This runbook is not a cron live cutover approval.
- Actual deploy, DB, provider, and cron work are Protected tasks and require separate explicit approval.
