import { assert, assertEquals } from "jsr:@std/assert@1";

import { evaluateSchedulerDryRun, type DecisionStatus, type ResultJson } from "./contract.ts";

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

function assertPersonResult(
  result: ResultJson,
  status: NonNullable<ResultJson["personResolution"]>["status"],
  wouldSkip: boolean,
) {
  assert(result.personResolution);
  assertEquals(result.personResolution.status, status);
  assertEquals(result.personResolution.wouldSkip, wouldSkip);
}

function assertNoResultSideEffects(result: ResultJson) {
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
}

function assertSkippedPerson(
  ruleId: string,
  expectedStatus: DecisionStatus,
  personStatus: NonNullable<ResultJson["personResolution"]>["status"],
) {
  const { result } = evaluateSingleRule(ruleId);

  assertEquals(result.decision.status, expectedStatus);
  assertPersonResult(result, personStatus, true);
  assertEquals(result.providerDryRun, undefined);
  assertNoResultSideEffects(result);
}

Deno.test("active person candidate remains eligible", () => {
  const { result } = evaluateSingleRule("rule_person_active_1800");

  assertEquals(result.decision.status, "would_send");
  assertPersonResult(result, "active", false);
  assertNoResultSideEffects(result);
});

Deno.test("missing person skips without side effects", () => {
  assertSkippedPerson("rule_person_missing_1800", "would_skip_person_missing", "missing");
});

Deno.test("disabled person skips without side effects", () => {
  assertSkippedPerson("rule_person_disabled_1800", "would_skip_person_disabled", "disabled");
});

Deno.test("merged person skips without side effects", () => {
  assertSkippedPerson("rule_person_merged_1800", "would_skip_person_merged", "merged");
});
