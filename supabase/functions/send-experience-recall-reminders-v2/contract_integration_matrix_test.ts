import { assert, assertEquals } from "jsr:@std/assert@1";

import { evaluateSchedulerDryRun, type DecisionStatus, type ResultJson } from "./contract.ts";

type SuccessBody = {
  ok: true;
  evaluatedRules: number;
  wouldSend: number;
  wouldSkip: number;
  fallbackWouldRun: number;
  providerCalls: number;
  messagesSent: number;
  ledgerWrites: number;
  results: ResultJson[];
};

function successBody(body: unknown): SuccessBody {
  const value = body as SuccessBody;
  assertEquals(value.ok, true);
  return value;
}

function assertNoResponseSideEffects(body: SuccessBody) {
  assertEquals(body.providerCalls, 0);
  assertEquals(body.messagesSent, 0);
  assertEquals(body.ledgerWrites, 0);
}

function evaluateMatrix(): SuccessBody {
  const response = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    timezone: "Asia/Seoul",
    lookbackMinutes: 15,
    limit: 500,
  });
  assertEquals(response.status, 200);

  const body = successBody(response.body);
  assertNoResponseSideEffects(body);
  return body;
}

function evaluateSingleRule(
  ruleId: string,
  mode: "dry_run" | "inspect_only" = "dry_run",
): { body: SuccessBody; result: ResultJson } {
  const response = evaluateSchedulerDryRun({
    mode,
    now: "2026-06-03T09:00:00.000Z",
    timezone: "Asia/Seoul",
    targetRuleId: ruleId,
  });
  assertEquals(response.status, 200);

  const body = successBody(response.body);
  assertEquals(body.evaluatedRules, 1);
  assertEquals(body.results.length, 1);
  assertNoResponseSideEffects(body);
  return { body, result: body.results[0] };
}

function assertNoResultSideEffects(result: ResultJson) {
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
}

function assertProviderDryRunSideEffectsDisabled(result: ResultJson) {
  assert(result.providerDryRun);
  assertEquals(result.providerDryRun.primary.called, false);
  assertEquals(result.providerDryRun.primary.messageId, null);
  assertEquals(result.providerDryRun.primary.rawStored, false);
  assertEquals(result.providerDryRun.fallback?.called, false);
  assertEquals(result.providerDryRun.fallback?.messageId, null);
  assertEquals(result.providerDryRun.fallback?.rawStored, false);
}

Deno.test("18:00 KST integration matrix keeps representative decisions stable", () => {
  const expectedStatuses = new Map<string, DecisionStatus>([
    ["rule_daily_1800", "would_send"],
    ["rule_contact_missing_1800", "would_skip_contact_missing"],
    ["rule_contact_unverified_1800", "would_skip_contact_unverified"],
    ["rule_consent_missing_1800", "would_skip_consent_missing"],
    ["rule_consent_revoked_1800", "would_skip_consent_revoked"],
    ["rule_kakao_provider_not_ready_1800", "would_skip_provider_not_ready"],
    ["rule_record_guard_today_exists_1800", "would_skip_record_guard"],
    ["rule_record_guard_weekly_exists_1800", "would_skip_record_guard"],
    ["rule_web_push_permission_missing_1800", "would_skip_web_push_permission"],
    ["rule_web_push_registration_incomplete_1800", "would_skip_web_push_registration"],
    ["rule_web_push_ownership_conflict_1800", "would_skip_web_push_ownership"],
    ["rule_web_push_permission_default_1800", "would_skip_web_push_permission"],
    ["rule_web_push_ownership_stale_1800", "would_skip_web_push_ownership"],
    ["rule_web_push_ownership_revoked_1800", "would_skip_web_push_ownership"],
    ["rule_person_missing_1800", "would_skip_person_missing"],
    ["rule_person_disabled_1800", "would_skip_person_disabled"],
    ["rule_person_merged_1800", "would_skip_person_merged"],
    ["rule_duplicate_claim_1800", "would_skip_duplicate_claim"],
    ["rule_kakao_sms_fallback_1800", "fallback_would_run"],
    ["rule_kakao_sms_fallback_skip_1800", "fallback_would_skip"],
  ]);

  const body = evaluateMatrix();
  const resultsByRuleId = new Map(body.results.map((result) => [result.rule.id, result]));

  for (const [ruleId, expectedStatus] of expectedStatuses) {
    const result = resultsByRuleId.get(ruleId);
    assert(result, ruleId);
    assertEquals(result.decision.status, expectedStatus, ruleId);
    assertNoResultSideEffects(result);
  }
});

Deno.test("skip decisions do not create providerDryRun", () => {
  const cases: Array<{ ruleId: string; status: DecisionStatus }> = [
    { ruleId: "rule_person_missing_1800", status: "would_skip_person_missing" },
    { ruleId: "rule_person_disabled_1800", status: "would_skip_person_disabled" },
    { ruleId: "rule_person_merged_1800", status: "would_skip_person_merged" },
    { ruleId: "rule_record_guard_today_exists_1800", status: "would_skip_record_guard" },
    { ruleId: "rule_record_guard_weekly_exists_1800", status: "would_skip_record_guard" },
    { ruleId: "rule_web_push_permission_missing_1800", status: "would_skip_web_push_permission" },
    { ruleId: "rule_web_push_registration_incomplete_1800", status: "would_skip_web_push_registration" },
    { ruleId: "rule_web_push_ownership_conflict_1800", status: "would_skip_web_push_ownership" },
    { ruleId: "rule_web_push_permission_default_1800", status: "would_skip_web_push_permission" },
    { ruleId: "rule_web_push_ownership_stale_1800", status: "would_skip_web_push_ownership" },
    { ruleId: "rule_web_push_ownership_revoked_1800", status: "would_skip_web_push_ownership" },
    { ruleId: "rule_duplicate_claim_1800", status: "would_skip_duplicate_claim" },
  ];

  for (const testCase of cases) {
    const { result } = evaluateSingleRule(testCase.ruleId);

    assertEquals(result.decision.status, testCase.status, testCase.ruleId);
    assertEquals(result.providerDryRun, undefined, testCase.ruleId);
    assertNoResultSideEffects(result);
  }
});

Deno.test("fallback dry-run keeps side effects disabled", () => {
  const cases: Array<{ ruleId: string; status: DecisionStatus }> = [
    { ruleId: "rule_kakao_sms_fallback_1800", status: "fallback_would_run" },
    { ruleId: "rule_kakao_sms_fallback_skip_1800", status: "fallback_would_skip" },
  ];

  for (const testCase of cases) {
    const { result } = evaluateSingleRule(testCase.ruleId);

    assertEquals(result.decision.status, testCase.status, testCase.ruleId);
    assertProviderDryRunSideEffectsDisabled(result);
    assertNoResultSideEffects(result);
  }
});

Deno.test("inspect_only preserves inspected statuses for representative decisions", () => {
  const cases: Array<{ ruleId: string; inspectedStatus: DecisionStatus }> = [
    { ruleId: "rule_person_missing_1800", inspectedStatus: "would_skip_person_missing" },
    { ruleId: "rule_record_guard_today_exists_1800", inspectedStatus: "would_skip_record_guard" },
    { ruleId: "rule_web_push_permission_missing_1800", inspectedStatus: "would_skip_web_push_permission" },
    { ruleId: "rule_duplicate_claim_1800", inspectedStatus: "would_skip_duplicate_claim" },
    { ruleId: "rule_kakao_sms_fallback_1800", inspectedStatus: "fallback_would_run" },
  ];

  for (const testCase of cases) {
    const { result } = evaluateSingleRule(testCase.ruleId, "inspect_only");

    assertEquals(result.decision.status, "inspect_only", testCase.ruleId);
    assertEquals(result.decision.inspectedStatus, testCase.inspectedStatus, testCase.ruleId);
    assertNoResultSideEffects(result);
  }
});
