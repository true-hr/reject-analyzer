import { assert, assertEquals } from "jsr:@std/assert@1";

import { evaluateSchedulerDryRun, type ResultJson } from "./contract.ts";

type SuccessBody = {
  ok: true;
  evaluatedRules: number;
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

function assertNoSideEffects(body: SuccessBody) {
  assertEquals(body.providerCalls, 0);
  assertEquals(body.messagesSent, 0);
  assertEquals(body.ledgerWrites, 0);
}

function evaluateSingleRule(ruleId: string): { body: SuccessBody; result: ResultJson } {
  const response = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    timezone: "Asia/Seoul",
    targetRuleId: ruleId,
  });
  assertEquals(response.status, 200);

  const body = successBody(response.body);
  assertEquals(body.evaluatedRules, 1);
  assertEquals(body.results.length, 1);
  assertNoSideEffects(body);
  return { body, result: body.results[0] };
}

Deno.test("eligible fallback fixture returns fallback_would_run without side effects", () => {
  const { result } = evaluateSingleRule("rule_kakao_sms_fallback_1800");
  assertEquals(result.decision.status, "fallback_would_run");
  assertEquals(result.fallback.evaluated, true);
  assertEquals(result.fallback.attempted, false);
  assertEquals(result.fallback.wouldRun, true);
  assertEquals(result.fallback.channel, "sms");
  assert(result.providerDryRun);
  assertEquals(result.providerDryRun.primary.wouldFail, true);
  assertEquals(result.providerDryRun.primary.failureCode, "SIMULATED_PRIMARY_FAILURE");
  assertEquals(result.providerDryRun.primary.called, false);
  assertEquals(result.providerDryRun.primary.messageId, null);
  assertEquals(result.providerDryRun.primary.rawStored, false);
  assertEquals(result.providerDryRun.fallback?.provider, "sms");
  assertEquals(result.providerDryRun.fallback?.wouldSend, true);
  assertEquals(result.providerDryRun.fallback?.called, false);
  assertEquals(result.providerDryRun.fallback?.messageId, null);
  assertEquals(result.providerDryRun.fallback?.rawStored, false);
});

Deno.test("ineligible fallback fixture returns fallback_would_skip without side effects", () => {
  const { result } = evaluateSingleRule("rule_kakao_sms_fallback_skip_1800");
  assertEquals(result.decision.status, "fallback_would_skip");
  assertEquals(result.fallback.evaluated, true);
  assertEquals(result.fallback.attempted, false);
  assertEquals(result.fallback.wouldRun, false);
  assertEquals(result.fallback.channel, "sms");
  assert(result.providerDryRun);
  assertEquals(result.providerDryRun.primary.wouldFail, true);
  assertEquals(result.providerDryRun.primary.called, false);
  assertEquals(result.providerDryRun.primary.messageId, null);
  assertEquals(result.providerDryRun.primary.rawStored, false);
  assertEquals(result.providerDryRun.fallback?.provider, "sms");
  assertEquals(result.providerDryRun.fallback?.wouldSend, false);
  assertEquals(result.providerDryRun.fallback?.failureCode, "CONSENT_MISSING");
  assertEquals(result.providerDryRun.fallback?.called, false);
  assertEquals(result.providerDryRun.fallback?.messageId, null);
  assertEquals(result.providerDryRun.fallback?.rawStored, false);
});
