# PASSMAP Scheduler v2 Dry-run Response Contract

## 1. Purpose

This document defines the scheduler v2 dry-run response contract after the provider dry-run adapter implementation.

It documents response shape and safety semantics only. It is not provider live approval, Supabase deploy approval, DB apply approval, cron approval, or actual message sending approval.

## 2. Response Safety Baseline

Scheduler v2 remains mock/fixture-based for dry-run and inspect-only evaluation.

The response must preserve these safety guarantees:

- `live` mode is rejected.
- `providerCalls` remains `0`.
- `messagesSent` remains `0`.
- `ledgerWrites` remains `0`.
- `provider.called` remains `false`.
- `provider.messageId` remains `null`.
- `provider.rawStored` remains `false`.
- No provider credential, env, secret, DB write, cron, or production setting is required.

Top-level counters represent actual side effects only. A provider dry-run result can describe what would have happened in an approved live path, but it must not increment actual side-effect counters.

## 3. Result Shape

Each dry-run result keeps the existing mock provider metadata and may include an optional `providerDryRun` extension.

```ts
type ResultJson = {
  mode: "dry_run" | "inspect_only";
  runId: string;
  localSlotKey: string;
  rule: {
    id: string;
    personId: string;
    reminderKind: "experience_recall";
    cadence: "daily" | "weekdays" | "weekly" | "custom_days";
    timeLocal: string;
    timezone: string;
  };
  channel: {
    name: "kakao_alimtalk" | "sms" | "email" | "web_push";
    priority: number;
    contactId: string | null;
    consentTypesChecked: string[];
  };
  decision: {
    status: DecisionStatus;
    reason: string;
    inspectedStatus?: DecisionStatus;
  };
  provider: {
    name: "mock";
    called: false;
    messageId: null;
    rawStored: false;
  };
  providerDryRun?: {
    primary: ProviderDryRunResult;
    fallback?: ProviderDryRunResult | null;
  };
  fallback: {
    evaluated: boolean;
    attempted: false;
    wouldRun: boolean;
    channel: "kakao_alimtalk" | "sms" | "email" | "web_push" | null;
    reason: string | null;
  };
  ledger: {
    writeLedger: false;
    claimKey: string;
    duplicateFound: boolean;
  };
};
```

`providerDryRun` is optional for backward compatibility. Consumers must continue to accept results that do not include it.

## 4. ProviderDryRunResult Shape

```ts
type ProviderDryRunResult = {
  provider: "mock" | "kakao_alimtalk" | "sms" | "email" | "web_push";
  dryRun: true;
  wouldCallProvider: boolean;
  called: false;
  wouldSend: boolean;
  wouldFail: boolean;
  failureCode:
    | "CONTACT_MISSING"
    | "CONTACT_UNVERIFIED"
    | "CONSENT_MISSING"
    | "CONSENT_REVOKED"
    | "TEMPLATE_MISSING"
    | "PROVIDER_NOT_READY"
    | "SIMULATED_PRIMARY_FAILURE"
    | null;
  failureReason: string | null;
  messageId: null;
  rawStored: false;
  costEstimated: number | null;
  warnings: string[];
};
```

Dry-run fixed fields:

- `called` is always `false`.
- `messageId` is always `null`.
- `rawStored` is always `false`.
- `dryRun` is always `true`.

`wouldCallProvider` is metadata. It means the provider would have been called if this exact path were allowed in an approved live mode. It is not an actual provider call and must not affect `providerCalls`.

## 5. Primary Kakao Alimtalk Dry-run

`providerDryRun.primary` can contain a Kakao Alimtalk dry-run result when the primary channel is `kakao_alimtalk` and the scheduler-side eligibility checks have passed.

Kakao dry-run can return:

- `wouldSend: true` when contact, consent, template, and provider readiness are eligible.
- `wouldFail: true` with `TEMPLATE_MISSING` when `templateKey` is missing.
- `wouldFail: true` with `PROVIDER_NOT_READY` when provider readiness is false.
- `wouldFail: true` with `SIMULATED_PRIMARY_FAILURE` when the fixture simulates primary provider failure.

Kakao dry-run never calls the Kakao API, never loads provider credentials, never stores raw provider payloads, and never sends a message.

## 6. SMS Fallback Dry-run

`providerDryRun.fallback` can contain an SMS fallback dry-run result when primary Kakao has a dry-run failure or simulated failure and `fallbackToChannel` is `sms`.

SMS fallback behavior:

- SMS fallback is only considered after primary Kakao dry-run failure or simulated failure.
- If SMS contact is missing or unverified, fallback is skipped.
- If SMS consent is missing or revoked, fallback is skipped.
- If SMS provider readiness is false, fallback is skipped.
- If SMS is eligible, the final decision can become `fallback_would_run`.

SMS fallback dry-run never calls an SMS API, never loads provider credentials, never stores raw provider payloads, and never sends a message.

## 7. Decision Mapping

Provider dry-run outcomes map to decision statuses as follows:

| Case | Decision status |
| --- | --- |
| Kakao dry-run `wouldSend: true` | `would_send` |
| Kakao dry-run `wouldFail: true` and SMS eligible | `fallback_would_run` |
| Kakao dry-run `wouldFail: true` and SMS ineligible | `fallback_would_skip` |
| Kakao `templateKey` missing without eligible fallback | `fallback_would_skip` |
| Kakao provider readiness false | `would_skip_provider_not_ready` |
| Duplicate claim | `would_skip_duplicate_claim` |
| Consent revoked | `would_skip_consent_revoked` |

`fallback_would_run` means SMS would be the fallback candidate in an approved live path. It does not mean SMS was sent.

`fallback_would_skip` means primary Kakao dry-run failed and no eligible SMS fallback could run.

## 8. Scheduler-side Skips

Scheduler-side skips must not create a provider adapter candidate and must not include `providerDryRun`.

These cases are scheduler-side skips:

- disabled rule
- deleted rule
- not-due rule
- contact missing
- contact unverified
- consent missing
- consent revoked
- duplicate claim

For these cases, the scheduler decides before provider dry-run evaluation. This keeps provider dry-run output focused on provider-path metadata only.

## 9. Side-effect Counters

Top-level counters continue to count actual side effects:

- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

`wouldCallProvider: true` does not increment `providerCalls`.

`wouldSend: true` does not increment `messagesSent`.

`ledger.writeLedger` remains `false`, and duplicate claim checks in fixtures do not write ledger rows.

## 10. Live Mode

`live` mode remains rejected.

Expected live-mode error behavior:

- HTTP status remains `403`.
- `error` remains `LIVE_MODE_REJECTED`.
- `providerCalls`, `messagesSent`, and `ledgerWrites` remain `0`.

This response contract update does not authorize live mode, provider credentials, provider SDKs, Supabase deploy, cron changes, DB changes, or production changes.

## 11. Guardrails

This document update is documentation only.

It does not authorize:

- Kakao Alimtalk API calls
- SMS API calls
- provider SDK installation
- env or secret usage
- DB or SQL changes
- Supabase deploy
- cron changes
- production setting changes
- actual message sending
