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

Deno.test("active Web Push current-device candidate remains eligible", () => {
  const { result } = evaluateSingleRule("rule_web_push_active_1800");

  assertEquals(result.decision.status, "would_send");
  assert(result.webPush);
  assertEquals(result.webPush.permission, "granted");
  assertEquals(result.webPush.ownershipStatus, "active");
  assertEquals(result.webPush.registrationComplete, true);
  assertEquals(result.webPush.wouldSkip, false);
  assertEquals(result.webPush.reason, null);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
});

Deno.test("Web Push browser permission missing skips without side effects", () => {
  const { result } = evaluateSingleRule("rule_web_push_permission_missing_1800");

  assertEquals(result.decision.status, "would_skip_web_push_permission");
  assert(result.decision.reason.includes("permission"));
  assert(result.webPush);
  assertEquals(result.webPush.permission, "denied");
  assertEquals(result.webPush.ownershipStatus, "active");
  assertEquals(result.webPush.registrationComplete, true);
  assertEquals(result.webPush.wouldSkip, true);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
});

Deno.test("Web Push registration incomplete skips without side effects", () => {
  const { result } = evaluateSingleRule("rule_web_push_registration_incomplete_1800");

  assertEquals(result.decision.status, "would_skip_web_push_registration");
  assert(result.decision.reason.includes("registration"));
  assert(result.webPush);
  assertEquals(result.webPush.permission, "granted");
  assertEquals(result.webPush.ownershipStatus, "active");
  assertEquals(result.webPush.registrationComplete, false);
  assertEquals(result.webPush.wouldSkip, true);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
});

Deno.test("Web Push ownership conflict skips without side effects", () => {
  const { result } = evaluateSingleRule("rule_web_push_ownership_conflict_1800");

  assertEquals(result.decision.status, "would_skip_web_push_ownership");
  assert(result.decision.reason.includes("ownership"));
  assert(result.webPush);
  assertEquals(result.webPush.permission, "granted");
  assertEquals(result.webPush.ownershipStatus, "conflict");
  assertEquals(result.webPush.registrationComplete, true);
  assertEquals(result.webPush.wouldSkip, true);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
});

Deno.test("Web Push permission default skips without side effects", () => {
  const { result } = evaluateSingleRule("rule_web_push_permission_default_1800");

  assertEquals(result.decision.status, "would_skip_web_push_permission");
  assert(result.decision.reason.includes("permission"));
  assert(result.webPush);
  assertEquals(result.webPush.permission, "default");
  assertEquals(result.webPush.ownershipStatus, "active");
  assertEquals(result.webPush.registrationComplete, true);
  assertEquals(result.webPush.wouldSkip, true);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
});

Deno.test("Web Push ownership stale skips without side effects", () => {
  const { result } = evaluateSingleRule("rule_web_push_ownership_stale_1800");

  assertEquals(result.decision.status, "would_skip_web_push_ownership");
  assert(result.decision.reason.includes("ownership"));
  assert(result.webPush);
  assertEquals(result.webPush.permission, "granted");
  assertEquals(result.webPush.ownershipStatus, "stale");
  assertEquals(result.webPush.registrationComplete, true);
  assertEquals(result.webPush.wouldSkip, true);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
});

Deno.test("Web Push ownership revoked skips without side effects", () => {
  const { result } = evaluateSingleRule("rule_web_push_ownership_revoked_1800");

  assertEquals(result.decision.status, "would_skip_web_push_ownership");
  assert(result.decision.reason.includes("ownership"));
  assert(result.webPush);
  assertEquals(result.webPush.permission, "granted");
  assertEquals(result.webPush.ownershipStatus, "revoked");
  assertEquals(result.webPush.registrationComplete, true);
  assertEquals(result.webPush.wouldSkip, true);
  assertEquals(result.providerDryRun, undefined);
  assertEquals(result.provider.called, false);
  assertEquals(result.provider.messageId, null);
  assertEquals(result.provider.rawStored, false);
  assertEquals(result.ledger.writeLedger, false);
});
