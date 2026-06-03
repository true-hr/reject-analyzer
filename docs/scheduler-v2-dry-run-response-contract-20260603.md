# PASSMAP Scheduler v2 Dry-run Response Contract

## 1. Purpose

This document is the response contract baseline for the PASSMAP scheduler v2 dry-run skeleton.

It is not the live scheduler design document. It is a mock/fixture dry-run verification baseline for:

- code review of `supabase/functions/send-experience-recall-reminders-v2/index.ts`
- future local serve dry-run QA
- Supabase deploy review before any protected deploy step

The current skeleton is intentionally fixture-only. It exists to verify response shape, decision status coverage, safety counters, and side-effect guardrails before DB schema apply, provider integration, cron cutover, or production deployment.

## 2. Non-goals

The dry-run skeleton does not perform:

- DB read
- DB write
- provider call
- Kakao Alimtalk send
- SMS send
- Email send
- Web Push send
- env/secret lookup
- cron connection
- production change
- live mode execution

`live` mode must remain rejected until a separate protected approval covers DB apply, RLS, provider readiness, cron cutover, and production deployment.

## 3. Supported methods

| Method | Expected behavior |
| --- | --- |
| `GET` | Return health/info response for the mock fixture dry-run skeleton. |
| `POST` | Evaluate request body against in-file fixtures and return dry-run/inspect response. |
| `OPTIONS` | Return CORS preflight response. |
| Other methods | Return HTTP 405 with `METHOD_NOT_ALLOWED`. |

## 4. Supported modes

| Mode | Status | Expected behavior |
| --- | --- | --- |
| `dry_run` | Supported | Evaluate fixtures and return `would_send`, skip, duplicate, or fallback decisions. |
| `inspect_only` | Supported | Evaluate fixtures but return `decision.status: inspect_only` while preserving original status in `inspectedStatus`. |
| `live` | Rejected | Return HTTP 403 with `error: LIVE_MODE_REJECTED`. |
| Other values | Rejected | Return HTTP 400 with `error: INVALID_MODE`. |

## 5. Request contract

| Field | Type | Default | Clamp / validation | Safety behavior |
| --- | --- | --- | --- | --- |
| `mode` | string | `dry_run` | Must be `dry_run` or `inspect_only`; `live` is separately rejected. | No provider, message, or ledger side effect in any allowed mode. |
| `now` | ISO timestamp string | Current server time | Invalid date returns HTTP 400 `INVALID_NOW`. | Used only for fixture slot calculation. |
| `timezone` | string | `Asia/Seoul` | Must be valid IANA timezone; invalid value returns HTTP 400 `INVALID_TIMEZONE`. | Used for runId/local slot calculation only. |
| `lookbackMinutes` | number | `15` | Clamped to `0..120`. | Prevents unbounded fixture evaluation windows. |
| `limit` | number | `100` | Clamped to `1..500`. | Prevents unbounded fixture result size. |
| `targetPersonId` | string or null | `null` | Non-empty string is used as exact fixture filter. | Filter only; no authorization or DB lookup in skeleton. |
| `targetRuleId` | string or null | `null` | Non-empty string is used as exact fixture filter. | Filter only; no authorization or DB lookup in skeleton. |
| `writeLedger` | boolean | `false` | `true` is accepted but forced to `false`. | Must add warning and must not write ledger rows. |

Request error behavior:

- Invalid JSON returns HTTP 400 `INVALID_JSON`.
- Invalid `mode` returns HTTP 400 `INVALID_MODE`.
- `mode: live` returns HTTP 403 `LIVE_MODE_REJECTED`.
- Invalid `now` returns HTTP 400 `INVALID_NOW`.
- Invalid `timezone` returns HTTP 400 `INVALID_TIMEZONE`.

## 6. Response summary contract

Successful `GET`, `dry_run`, and `inspect_only` responses must keep all side-effect counters at zero.

Normal `POST` 200 response fields:

| Field | Meaning |
| --- | --- |
| `ok` | Boolean success marker. |
| `mode` | Normalized mode: `dry_run` or `inspect_only`. |
| `runId` | Deterministic-ish run id derived from local date/time for the request timezone. |
| `evaluatedRules` | Number of fixture rules evaluated after filters and limit. |
| `wouldSend` | Count of results whose final decision is `would_send`. |
| `wouldSkip` | Count of results whose final decision is `would_skip_*` or `fallback_would_skip`. |
| `fallbackWouldRun` | Count of results whose final decision is `fallback_would_run`. |
| `providerCalls` | Must always be `0`. |
| `messagesSent` | Must always be `0`. |
| `ledgerWrites` | Must always be `0`. |
| `warnings` | Array of request safety warnings, including `writeLedger=true` forced false. |
| `safety` | Explicit guardrail object. |
| `results` | Array of result item contracts. |

Invariant summary fields:

- `providerCalls` is always `0`.
- `messagesSent` is always `0`.
- `ledgerWrites` is always `0`.
- `safety.fixtureOnly` is `true`.
- `safety.providerCallsDisabled` is `true`.
- `safety.messageSendingDisabled` is `true`.
- `safety.ledgerWritesDisabled` is `true`.
- `safety.secretsRequired` is `false`.
- `safety.liveModeRejected` is `true`.

## 7. Result item contract

Each `results[]` item contains:

| Field | Meaning |
| --- | --- |
| `mode` | The normalized request mode for this evaluation. |
| `runId` | Same run id as the response summary. |
| `localSlotKey` | Local slot identifier in the form `YYYY-MM-DDTHH:mm@Timezone`. |
| `rule` | Fixture rule snapshot used for evaluation. |
| `channel` | Primary channel fixture snapshot used for evaluation. |
| `decision` | Decision status and reason. |
| `provider` | Mock provider metadata. Must show no provider call. |
| `fallback` | Fallback evaluation result. Must show no attempted fallback send. |
| `ledger` | Mock ledger/claim metadata. Must show no ledger write. |

`rule` fields:

- `id`: fixture rule id.
- `personId`: fixture person id.
- `reminderKind`: currently `experience_recall`.
- `cadence`: `daily`, `weekdays`, `weekly`, or `custom_days`.
- `timeLocal`: configured local HH:mm slot.
- `timezone`: rule timezone.

`channel` fields:

- `name`: primary channel name.
- `priority`: priority order for the rule fixture.
- `contactId`: fixture contact id or null.
- `consentTypesChecked`: consent types evaluated for this channel.

`decision` fields:

- `status`: final decision status.
- `reason`: human-readable reason for QA and logging review.
- `inspectedStatus`: present only in `inspect_only`, preserving the original dry-run status.

`provider` invariants:

- `name: mock`
- `called: false`
- `messageId: null`
- `rawStored: false`

`fallback` invariants:

- `evaluated: true`
- `attempted: false`
- `wouldRun`: true only for eligible fallback dry-run candidates.
- `channel`: fallback channel name or null.
- `reason`: fallback reason or null.

`ledger` invariants:

- `writeLedger: false`
- `claimKey`: mock claim key for rule/channel/local slot.
- `duplicateFound`: true only for duplicate claim fixture.

## 8. Decision status catalog

| Status | 발생 조건 | Expected reason direction | Side effects |
| --- | --- | --- | --- |
| `would_send` | Due fixture with verified contact, granted consent, ready provider, no duplicate, no simulated primary failure. | Due rule with verified contact and granted consent. | No provider call, no message send, no ledger write. |
| `would_skip_not_due` | Rule is outside current local slot lookback or day cadence does not match. | Outside current local slot lookback window. | No provider call, no message send, no ledger write. |
| `would_skip_disabled_rule` | Rule fixture has `isEnabled: false`. | Rule is disabled. | No provider call, no message send, no ledger write. |
| `would_skip_deleted_rule` | Rule fixture has `deletedAt`. | Rule is soft deleted. | No provider call, no message send, no ledger write. |
| `would_skip_contact_missing` | Primary channel contact is missing. | Channel contact is missing. | No provider call, no message send, no ledger write. |
| `would_skip_contact_unverified` | Primary channel contact is unverified. | Channel contact is unverified. | No provider call, no message send, no ledger write. |
| `would_skip_consent_missing` | Required consent is missing. | Required consent is missing. | No provider call, no message send, no ledger write. |
| `would_skip_consent_revoked` | Required consent is revoked. | Required consent is revoked. | No provider call, no message send, no ledger write. |
| `would_skip_provider_not_ready` | Provider readiness fixture is false. | Provider is not ready. | No provider call, no message send, no ledger write. |
| `would_skip_duplicate_claim` | Mock duplicate claim is present. | Existing claim for rule/channel/local slot. | No provider call, no message send, no ledger write. |
| `fallback_would_run` | Primary channel has simulated provider failure and fallback channel is eligible. | Primary Kakao candidate has simulated failure and SMS fallback is eligible. | No provider call, no message send, no ledger write. |
| `fallback_would_skip` | Primary channel has simulated provider failure but fallback contact/consent/provider is not eligible. | Fallback channel is configured but skipped with reason. | No provider call, no message send, no ledger write. |
| `inspect_only` | Request mode is `inspect_only`. | Prefixes original reason and stores original status in `inspectedStatus`. | No provider call, no message send, no ledger write. |

## 9. Fixture scenario matrix

Expected statuses below assume a future manual request using:

```json
{
  "mode": "dry_run",
  "now": "2026-06-03T09:00:00.000Z",
  "timezone": "Asia/Seoul",
  "lookbackMinutes": 15,
  "limit": 100,
  "writeLedger": false
}
```

That timestamp maps to the 18:00 Asia/Seoul slot on Wednesday, June 3, 2026.

| Fixture rule id | Purpose | Expected `decision.status` | Expected side effect counters |
| --- | --- | --- | --- |
| `rule_daily_1800` | daily due send candidate / Kakao would send | `would_send` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_weekdays_1800` | weekdays due send candidate | `would_send` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_custom_days_1800` | custom days due send candidate | `would_send` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_not_due_1700` | not due because local slot is 17:00, outside 15-minute lookback | `would_skip_not_due` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_disabled_1800` | disabled rule | `would_skip_disabled_rule` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_deleted_1800` | deleted rule | `would_skip_deleted_rule` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_contact_missing_1800` | missing contact | `would_skip_contact_missing` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_contact_unverified_1800` | unverified contact | `would_skip_contact_unverified` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_consent_missing_1800` | missing consent | `would_skip_consent_missing` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_consent_revoked_1800` | revoked consent | `would_skip_consent_revoked` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_kakao_provider_not_ready_1800` | provider not ready | `would_skip_provider_not_ready` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_kakao_sms_fallback_1800` | Kakao primary failure + SMS fallback would run | `fallback_would_run` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_kakao_sms_fallback_skip_1800` | Kakao primary failure + SMS fallback skip | `fallback_would_skip` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |
| `rule_duplicate_claim_1800` | duplicate claim | `would_skip_duplicate_claim` | `providerCalls=0`, `messagesSent=0`, `ledgerWrites=0` |

For `inspect_only`, the final `decision.status` should be `inspect_only` for each row, and the dry-run status above should be preserved in `decision.inspectedStatus`.

## 10. Recommended manual curl scenarios

These examples are for a future local serve or deployed dry-run endpoint only. Do not run them as part of this documentation task.

Use placeholders only. Do not include real Supabase project URLs, production tokens, API keys, or secrets.

```text
<DRY_RUN_ENDPOINT>
```

### GET health

```bash
curl -X GET '<DRY_RUN_ENDPOINT>'
```

### Default POST dry_run

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Explicit dry_run

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "timezone": "Asia/Seoul",
    "lookbackMinutes": 15,
    "limit": 100,
    "writeLedger": false
  }'
```

### inspect_only

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "inspect_only",
    "now": "2026-06-03T09:00:00.000Z",
    "timezone": "Asia/Seoul"
  }'
```

### live rejected

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "live"
  }'
```

### invalid mode

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "preview"
  }'
```

### invalid now

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "not-a-date"
  }'
```

### invalid timezone

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "timezone": "Invalid/Timezone"
  }'
```

### writeLedger forced false

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "writeLedger": true
  }'
```

### targetPersonId filter

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "targetPersonId": "person_demo_12"
  }'
```

### targetRuleId filter

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "targetRuleId": "rule_duplicate_claim_1800"
  }'
```

### fallback scenario

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "targetRuleId": "rule_kakao_sms_fallback_1800"
  }'
```

### duplicate claim scenario

```bash
curl -X POST '<DRY_RUN_ENDPOINT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "targetRuleId": "rule_duplicate_claim_1800"
  }'
```

## 11. Merge readiness checklist

Before moving to the next stage:

- [ ] Deno check CI success
- [ ] PR Validation success
- [ ] Function code side effects remain absent
- [ ] `providerCalls`, `messagesSent`, and `ledgerWrites` remain `0`
- [ ] `live` mode remains HTTP 403
- [ ] `writeLedger=true` remains forced to `false`
- [ ] Supabase deploy requires separate approval before execution
- [ ] DB apply requires separate approval before execution
- [ ] Cron/provider integration requires separate approval before execution

## 12. Guardrails

- This document is not a DB migration promotion basis.
- This document is not a Supabase deploy approval.
- This document is not a provider integration approval.
- This document is not a cron cutover approval.
- Future Edge Function code changes must happen in a separate PR.
- Future Supabase deploy is a Protected task and requires separate explicit approval.
- Future DB apply, RLS, backfill, cron, provider integration, and message sending are separate Protected tasks.
- This document must not be used to justify production behavior changes by itself.

Forbidden in this documentation task:

- Edge Function code changes
- Supabase functions serve
- Supabase functions deploy
- Supabase SQL Editor execution
- Supabase CLI db push/apply/reset
- remote DB apply
- existing data backfill
- provider API calls
- provider SDK installation
- env/secret changes
- API key issue/copy/storage
- message sending
- Web Push/SMS/Kakao/Email sending
- cron changes
- Vercel/Supabase deploy
- production setting changes
- React/UI implementation
- `src/App.jsx` changes
- dirty worktree cleanup/delete/modify
