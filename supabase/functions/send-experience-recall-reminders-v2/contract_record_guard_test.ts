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

Deno.test("today record guard fixture skips an otherwise eligible rule", () => {
  const { result } = evaluateSingleRule("rule_record_guard_today_exists_1800");

  assertEquals(result.decision.status, "would_skip_record_guard");
  assert(result.decision.reason.includes("existing record today"));
  assertEquals(result.recordGuard.skipPolicy, "skip_if_today_record_exists");
  assertEquals(result.recordGuard.todayRecordExists, true);
  assertEquals(result.recordGuard.weeklyRecordExists, false);
  assertEquals(result.recordGuard.unknown, false);
  assertEquals(result.recordGuard.wouldSkip, true);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.ledger.writeLedger, false);
});

Deno.test("weekly record guard fixture skips an otherwise eligible weekly rule", () => {
  const { result } = evaluateSingleRule("rule_record_guard_weekly_exists_1800");

  assertEquals(result.decision.status, "would_skip_record_guard");
  assert(result.decision.reason.includes("existing record this week"));
  assertEquals(result.recordGuard.skipPolicy, "skip_if_weekly_record_exists");
  assertEquals(result.recordGuard.todayRecordExists, false);
  assertEquals(result.recordGuard.weeklyRecordExists, true);
  assertEquals(result.recordGuard.unknown, false);
  assertEquals(result.recordGuard.wouldSkip, true);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.ledger.writeLedger, false);
});

Deno.test("always_send policy exposes unknown guard state without skipping", () => {
  const { result } = evaluateSingleRule("rule_record_guard_always_send_unknown_1800");

  assertEquals(result.decision.status, "would_send");
  assertEquals(result.recordGuard.skipPolicy, "always_send");
  assertEquals(result.recordGuard.todayRecordExists, false);
  assertEquals(result.recordGuard.weeklyRecordExists, false);
  assertEquals(result.recordGuard.unknown, true);
  assertEquals(result.recordGuard.wouldSkip, false);
  assert(result.recordGuard.reason?.includes("unknown"));
  assertEquals(result.ledger.writeLedger, false);
});
