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

Deno.test("provider ready candidate exposes dry-run metadata only", () => {
  const { result } = evaluateSingleRule("rule_daily_1800");
  assertEquals(result.decision.status, "would_send");
  assert(result.providerDryRun);
  assertEquals(result.providerDryRun.primary.provider, "kakao_alimtalk");
  assertEquals(result.providerDryRun.primary.wouldCallProvider, true);
  assertEquals(result.providerDryRun.primary.wouldSend, true);
  assertEquals(result.providerDryRun.primary.wouldFail, false);
  assertEquals(result.providerDryRun.primary.called, false);
  assertEquals(result.providerDryRun.primary.messageId, null);
  assertEquals(result.providerDryRun.primary.rawStored, false);
});

Deno.test("provider not ready candidate exposes provider failure without live side effects", () => {
  const { result } = evaluateSingleRule("rule_kakao_provider_not_ready_1800");
  assertEquals(result.decision.status, "would_skip_provider_not_ready");
  assert(result.providerDryRun);
  assertEquals(result.providerDryRun.primary.wouldFail, true);
  assertEquals(result.providerDryRun.primary.failureCode, "PROVIDER_NOT_READY");
  assertEquals(result.providerDryRun.primary.called, false);
  assertEquals(result.providerDryRun.primary.messageId, null);
  assertEquals(result.providerDryRun.primary.rawStored, false);
});

Deno.test("missing template candidate exposes template failure without live side effects", () => {
  const { result } = evaluateSingleRule("rule_kakao_template_missing_1800");
  assertEquals(result.decision.status, "fallback_would_skip");
  assert(result.providerDryRun);
  assertEquals(result.providerDryRun.primary.wouldFail, true);
  assertEquals(result.providerDryRun.primary.failureCode, "TEMPLATE_MISSING");
  assertEquals(result.providerDryRun.primary.called, false);
  assertEquals(result.providerDryRun.primary.messageId, null);
  assertEquals(result.providerDryRun.primary.rawStored, false);
});

Deno.test("duplicate claim does not create provider dry-run metadata", () => {
  const { result } = evaluateSingleRule("rule_duplicate_claim_1800");
  assertEquals(result.decision.status, "would_skip_duplicate_claim");
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.duplicateFound, true);
});

Deno.test("revoked consent does not create provider dry-run metadata", () => {
  const { result } = evaluateSingleRule("rule_consent_revoked_1800");
  assertEquals(result.decision.status, "would_skip_consent_revoked");
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
});
