# PASSMAP Scheduler v2 Provider Dry-run Adapter Design

## 1. Purpose

This document defines the design baseline for the PASSMAP scheduler v2 provider dry-run adapter.

It is not:

- a real provider integration document
- a Kakao Alimtalk or SMS real-send approval
- a Supabase deploy approval
- a DB apply approval
- a cron cutover approval

The goal is to describe how scheduler v2 can evaluate provider behavior in dry-run mode while preserving the current no-side-effect contract.

## 2. Current State

- Scheduler v2 is fixture-based dry-run only.
- `contract.ts` owns decision, status, fallback, and safety evaluation logic.
- Current provider output is mock metadata only.
- Local serve QA is deferred because Docker Desktop readiness is not yet confirmed.
- GitHub Actions Deno check/test has passed for the scheduler v2 contract test PR.
- `live` mode remains rejected.
- `providerCalls`, `messagesSent`, and `ledgerWrites` remain `0` for actual side effects.

## 3. Non-goals

This design does not include:

- real Kakao Alimtalk API calls
- real SMS API calls
- real Email or Web Push sending
- provider SDK installation
- provider credential, env, or secret additions
- DB reads or writes
- ledger writes
- cron connection
- production deploy

## 4. Adapter Target Channels

Initial dry-run adapter documentation targets:

- Kakao Alimtalk primary adapter
- SMS fallback adapter

Lower-priority future targets:

- Email
- Web Push

## 5. Common ProviderDryRunAdapter Interface

The following types are documentation-only examples. This PR does not add code.

```ts
type ProviderDryRunRequest = {
  mode: "dry_run" | "inspect_only";
  runId: string;
  localSlotKey: string;
  personId: string;
  ruleId: string;
  channel: "kakao_alimtalk" | "sms" | "email" | "web_push";
  contact: {
    contactId: string | null;
    normalizedAddress: string | null;
    verified: boolean;
  };
  consent: {
    requiredTypes: string[];
    status: "granted" | "missing" | "revoked";
  };
  message: {
    templateKey: string;
    title: string;
    body: string;
    url?: string;
  };
  fallback?: {
    fallbackToChannel: string | null;
    reason: string | null;
  };
};
```

```ts
type ProviderDryRunResult = {
  provider: "mock" | "kakao_alimtalk" | "sms" | "email" | "web_push";
  dryRun: true;
  wouldCallProvider: boolean;
  called: false;
  wouldSend: boolean;
  wouldFail: boolean;
  failureCode: string | null;
  failureReason: string | null;
  messageId: null;
  rawStored: false;
  costEstimated: number | null;
  warnings: string[];
};
```

Interface rules:

- `mode` must be `dry_run` or `inspect_only`.
- `called` must always be `false` before live approval.
- `messageId` must always be `null` in dry-run.
- `rawStored` must always be `false` in dry-run.
- `wouldCallProvider` means "this would have called a provider in an approved live path"; it is not an actual call.
- Adapter output must not require env, secrets, provider credentials, or DB access.

## 6. Kakao Alimtalk Dry-run Adapter Rules

Kakao Alimtalk is the primary adapter target.

Rules:

- If contact is missing, return `wouldSend: false`.
- If contact is unverified, return `wouldSend: false`.
- If consent is missing, return `wouldSend: false`.
- If consent is revoked, return `wouldSend: false`.
- If `templateKey` is missing, return `wouldFail: true`.
- If provider readiness is false, return `wouldFail: true`.
- In dry-run, `called` must remain `false`.
- In dry-run, `messageId` must remain `null`.
- In dry-run, `rawStored` must remain `false`.
- Real Kakao API calls are prohibited.
- Env/secret values are not required.
- No cost is incurred.

Suggested failure codes for dry-run documentation:

- `CONTACT_MISSING`
- `CONTACT_UNVERIFIED`
- `CONSENT_MISSING`
- `CONSENT_REVOKED`
- `TEMPLATE_MISSING`
- `PROVIDER_NOT_READY`

## 7. SMS Fallback Dry-run Adapter Rules

SMS is the initial fallback adapter target.

Rules:

- SMS fallback is only a candidate when primary Kakao has a dry-run failure or simulated failure.
- If SMS contact is missing or unverified, fallback is skipped.
- If SMS consent is missing or revoked, fallback is skipped.
- If SMS provider readiness is false, fallback is skipped.
- If all fallback checks pass, final decision can map to `fallback_would_run`.
- In dry-run, no SMS is sent.
- In dry-run, `called` must remain `false`.
- In dry-run, `messageId` must remain `null`.
- No cost is incurred.

Fallback skip reasons should stay distinct from primary provider failure reasons so operators can see whether fallback was unavailable because of contact, consent, provider readiness, or duplicate state.

## 8. Fallback Decision Contract

Fallback evaluation should include:

- primary channel decision
- primary provider dry-run result
- fallback candidate channel
- fallback eligibility
- final `decision.status` mapping

Decision mapping:

| Case | Final status |
| --- | --- |
| Kakao `wouldSend: true` | `would_send` |
| Kakao `wouldFail: true` and SMS eligible | `fallback_would_run` |
| Kakao `wouldFail: true` and SMS ineligible | `fallback_would_skip` |
| duplicate claim | `would_skip_duplicate_claim` |
| consent revoked | `would_skip_consent_revoked` |

Important guard:

- `would_skip_duplicate_claim` must not create a provider adapter candidate.
- `would_skip_consent_revoked` must not create a provider adapter candidate.
- Contact missing, contact unverified, consent missing, consent revoked, disabled rule, deleted rule, not-due rule, and duplicate claim are scheduler-side skips, not provider failures.

## 9. Side-effect Counters Policy

Dry-run counters represent actual side effects only:

- `providerCalls` must remain `0`.
- `messagesSent` must remain `0`.
- `ledgerWrites` must remain `0`.

`wouldCallProvider` is adapter metadata. It only means the provider would have been called in an approved live path. It must not increment `providerCalls`.

Until live approval:

- `called` is always `false`.
- `messageId` is always `null`.
- `rawStored` is always `false`.
- no provider credential is loaded.
- no provider endpoint is called.

## 10. Result JSON Extension Direction

Future implementation can extend each result without breaking the existing response contract:

```ts
providerDryRun?: {
  primary: ProviderDryRunResult;
  fallback?: ProviderDryRunResult | null;
};
```

This PR does not modify code. Field additions belong in a separate implementation PR.

Compatibility requirements for a later implementation PR:

- Preserve existing `provider` metadata until callers are updated.
- Preserve top-level counters.
- Preserve existing `decision.status` values.
- Keep `providerDryRun` optional during rollout.
- Keep live mode rejected.

## 11. Live Transition Conditions

Real provider adapter or live mode work must not start until all of these are complete:

- DB schema/RLS has been applied and verified.
- `notification_contacts` and consent records have been verified.
- Provider credentials are stored safely through an approved secret process.
- Kakao templates are approved and registered.
- Cost and quota policy is documented.
- Retry and duplicate ledger policy is finalized.
- Staging dry-run results pass.
- Protected Supabase deploy is approved.
- Cron cutover is approved.

Passing provider dry-run design review is not live approval.

## 12. Stop Conditions

Stop immediately if any of the following becomes necessary:

- provider API key
- service role key
- env/secret
- DB migration
- Supabase deploy
- live mode allowance
- actual sending
- cron
- production setting

## 13. Next Step Candidates

Possible next work items:

- A. provider dry-run adapter implementation PR
- B. DB migration promotion review
- C. local serve QA retry
- D. protected deploy plan

Recommended order:

- Retry local serve QA after Docker Desktop is ready.
- Provider dry-run adapter implementation can proceed as a code change only if it still performs no real provider calls.
- DB/provider/live work remains on hold until separate Protected approvals are granted.

## 14. Guardrails

This document does not authorize:

- Kakao/SMS/Email/Web Push sending
- provider SDK installation
- provider credential use
- env/secret creation or modification
- DB apply
- Supabase deploy
- cron creation or modification
- production setting changes
