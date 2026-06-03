import { assert, assertEquals } from "jsr:@std/assert@1";

import { evaluateSchedulerDryRun, type DecisionStatus, type ResultJson } from "./contract.ts";

type SuccessBody = {
  ok: true;
  evaluatedRules: number;
  providerCalls: number;
  messagesSent: number;
  ledgerWrites: number;
  warnings: string[];
  safety: {
    fixtureOnly: boolean;
    liveModeRejected: boolean;
  };
  results: ResultJson[];
};

type ErrorBody = {
  ok: false;
  error: string;
  providerCalls: number;
  messagesSent: number;
  ledgerWrites: number;
};

function successBody(body: unknown): SuccessBody {
  const value = body as SuccessBody;
  assertEquals(value.ok, true);
  return value;
}

function errorBody(body: unknown): ErrorBody {
  const value = body as ErrorBody;
  assertEquals(value.ok, false);
  return value;
}

function assertNoSideEffects(body: { providerCalls: number; messagesSent: number; ledgerWrites: number }) {
  assertEquals(body.providerCalls, 0);
  assertEquals(body.messagesSent, 0);
  assertEquals(body.ledgerWrites, 0);
}

function resultByRuleId(results: ResultJson[], ruleId: string): ResultJson {
  const result = results.find((item) => item.rule.id === ruleId);
  assert(result, `missing result for ${ruleId}`);
  return result;
}

Deno.test("default dry_run keeps safety counters at zero", () => {
  const result = evaluateSchedulerDryRun({});
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  assertNoSideEffects(body);
  assertEquals(body.safety.fixtureOnly, true);
  assertEquals(body.safety.liveModeRejected, true);
});

Deno.test("live mode is rejected", () => {
  const result = evaluateSchedulerDryRun({ mode: "live" });
  assertEquals(result.status, 403);

  const body = errorBody(result.body);
  assertEquals(body.error, "LIVE_MODE_REJECTED");
  assertNoSideEffects(body);
});

Deno.test("invalid mode is rejected", () => {
  const result = evaluateSchedulerDryRun({ mode: "preview" });
  assertEquals(result.status, 400);

  const body = errorBody(result.body);
  assertEquals(body.error, "INVALID_MODE");
});

Deno.test("invalid now is rejected", () => {
  const result = evaluateSchedulerDryRun({ mode: "dry_run", now: "not-a-date" });
  assertEquals(result.status, 400);

  const body = errorBody(result.body);
  assertEquals(body.error, "INVALID_NOW");
});

Deno.test("invalid timezone is rejected", () => {
  const result = evaluateSchedulerDryRun({ mode: "dry_run", timezone: "Invalid/Timezone" });
  assertEquals(result.status, 400);

  const body = errorBody(result.body);
  assertEquals(body.error, "INVALID_TIMEZONE");
});

Deno.test("writeLedger true is forced false", () => {
  const result = evaluateSchedulerDryRun({ mode: "dry_run", writeLedger: true });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  assertNoSideEffects(body);
  assert(body.warnings.some((warning) => warning.includes("writeLedger=true was forced to false")));
  assert(body.results.every((item) => item.ledger.writeLedger === false));
});

Deno.test("18:00 KST fixture matrix core decisions match contract", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    timezone: "Asia/Seoul",
    lookbackMinutes: 15,
    limit: 100,
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  const expected: Record<string, DecisionStatus> = {
    rule_daily_1800: "would_send",
    rule_not_due_1700: "would_skip_not_due",
    rule_disabled_1800: "would_skip_disabled_rule",
    rule_deleted_1800: "would_skip_deleted_rule",
    rule_contact_missing_1800: "would_skip_contact_missing",
    rule_contact_unverified_1800: "would_skip_contact_unverified",
    rule_consent_missing_1800: "would_skip_consent_missing",
    rule_consent_revoked_1800: "would_skip_consent_revoked",
    rule_kakao_provider_not_ready_1800: "would_skip_provider_not_ready",
    rule_kakao_template_missing_1800: "fallback_would_skip",
    rule_kakao_sms_fallback_1800: "fallback_would_run",
    rule_kakao_sms_fallback_skip_1800: "fallback_would_skip",
    rule_duplicate_claim_1800: "would_skip_duplicate_claim",
  };

  for (const [ruleId, status] of Object.entries(expected)) {
    assertEquals(resultByRuleId(body.results, ruleId).decision.status, status);
  }
  assertNoSideEffects(body);
});

Deno.test("kakao dry-run wouldSend keeps provider call mocked", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetRuleId: "rule_daily_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  const providerDryRun = body.results[0].providerDryRun;
  assert(providerDryRun);
  assertEquals(providerDryRun.primary.provider, "kakao_alimtalk");
  assertEquals(providerDryRun.primary.wouldCallProvider, true);
  assertEquals(providerDryRun.primary.wouldSend, true);
  assertEquals(providerDryRun.primary.wouldFail, false);
  assertEquals(providerDryRun.primary.called, false);
  assertEquals(providerDryRun.primary.messageId, null);
  assertEquals(providerDryRun.primary.rawStored, false);
  assertNoSideEffects(body);
});

Deno.test("kakao template missing is a dry-run provider failure", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetRuleId: "rule_kakao_template_missing_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  const providerDryRun = body.results[0].providerDryRun;
  assert(providerDryRun);
  assertEquals(providerDryRun.primary.wouldFail, true);
  assertEquals(providerDryRun.primary.failureCode, "TEMPLATE_MISSING");
  assertEquals(providerDryRun.primary.called, false);
  assertEquals(providerDryRun.primary.messageId, null);
  assertEquals(providerDryRun.primary.rawStored, false);
  assertNoSideEffects(body);
});

Deno.test("kakao provider readiness false is a dry-run provider failure", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetRuleId: "rule_kakao_provider_not_ready_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  const providerDryRun = body.results[0].providerDryRun;
  assert(providerDryRun);
  assertEquals(providerDryRun.primary.wouldFail, true);
  assertEquals(providerDryRun.primary.failureCode, "PROVIDER_NOT_READY");
  assertEquals(providerDryRun.primary.called, false);
  assertNoSideEffects(body);
});

Deno.test("kakao dry-run failure with eligible sms returns fallback_would_run", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetRuleId: "rule_kakao_sms_fallback_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  const ruleResult = body.results[0];
  assertEquals(ruleResult.decision.status, "fallback_would_run");
  assert(ruleResult.providerDryRun);
  assertEquals(ruleResult.providerDryRun.primary.wouldFail, true);
  assertEquals(ruleResult.providerDryRun.primary.failureCode, "SIMULATED_PRIMARY_FAILURE");
  assertEquals(ruleResult.providerDryRun.fallback?.provider, "sms");
  assertEquals(ruleResult.providerDryRun.fallback?.wouldSend, true);
  assertEquals(ruleResult.providerDryRun.fallback?.called, false);
  assertEquals(ruleResult.providerDryRun.fallback?.messageId, null);
  assertEquals(ruleResult.providerDryRun.fallback?.rawStored, false);
  assertNoSideEffects(body);
});

Deno.test("kakao dry-run failure with ineligible sms returns fallback_would_skip", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetRuleId: "rule_kakao_sms_fallback_skip_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  const ruleResult = body.results[0];
  assertEquals(ruleResult.decision.status, "fallback_would_skip");
  assert(ruleResult.providerDryRun);
  assertEquals(ruleResult.providerDryRun.primary.wouldFail, true);
  assertEquals(ruleResult.providerDryRun.fallback?.provider, "sms");
  assertEquals(ruleResult.providerDryRun.fallback?.wouldSend, false);
  assertEquals(ruleResult.providerDryRun.fallback?.failureCode, "CONSENT_MISSING");
  assertEquals(ruleResult.providerDryRun.fallback?.called, false);
  assertNoSideEffects(body);
});

Deno.test("duplicate claim does not create providerDryRun", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetRuleId: "rule_duplicate_claim_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  assertEquals(body.results[0].decision.status, "would_skip_duplicate_claim");
  assertEquals(body.results[0].providerDryRun, undefined);
  assertNoSideEffects(body);
});

Deno.test("consent revoked does not create providerDryRun", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetRuleId: "rule_consent_revoked_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  assertEquals(body.results[0].decision.status, "would_skip_consent_revoked");
  assertEquals(body.results[0].providerDryRun, undefined);
  assertNoSideEffects(body);
});

Deno.test("inspect_only preserves inspectedStatus", () => {
  const result = evaluateSchedulerDryRun({
    mode: "inspect_only",
    now: "2026-06-03T09:00:00.000Z",
    timezone: "Asia/Seoul",
    targetRuleId: "rule_duplicate_claim_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  assertEquals(body.results.length, 1);
  assertEquals(body.results[0].decision.status, "inspect_only");
  assertEquals(body.results[0].decision.inspectedStatus, "would_skip_duplicate_claim");
  assertNoSideEffects(body);
});

Deno.test("targetRuleId filter returns one matching fixture", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetRuleId: "rule_kakao_sms_fallback_1800",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  assertEquals(body.evaluatedRules, 1);
  assertEquals(body.results[0].rule.id, "rule_kakao_sms_fallback_1800");
  assertEquals(body.results[0].decision.status, "fallback_would_run");
});

Deno.test("targetPersonId filter returns one matching fixture", () => {
  const result = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    targetPersonId: "person_demo_12",
  });
  assertEquals(result.status, 200);

  const body = successBody(result.body);
  assertEquals(body.evaluatedRules, 1);
  assertEquals(body.results[0].rule.personId, "person_demo_12");
  assertEquals(body.results[0].decision.status, "fallback_would_run");
});
