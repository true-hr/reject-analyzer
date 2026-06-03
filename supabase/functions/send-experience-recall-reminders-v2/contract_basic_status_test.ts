import { assert, assertEquals } from "jsr:@std/assert@1";

import { evaluateSchedulerDryRun, type DecisionStatus, type ResultJson } from "./contract.ts";

type SuccessBody = {
  ok: true;
  evaluatedRules: number;
  results: ResultJson[];
};

function successBody(body: unknown): SuccessBody {
  const value = body as SuccessBody;
  assertEquals(value.ok, true);
  return value;
}

function evaluateSingleRule(ruleId: string): ResultJson {
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
  return body.results[0];
}

Deno.test("basic fixture status cases remain stable", () => {
  const cases: Array<{ ruleId: string; status: DecisionStatus; reasonIncludes: string }> = [
    {
      ruleId: "rule_not_due_1700",
      status: "would_skip_not_due",
      reasonIncludes: "outside the current local slot",
    },
    {
      ruleId: "rule_disabled_1800",
      status: "would_skip_disabled_rule",
      reasonIncludes: "disabled",
    },
    {
      ruleId: "rule_contact_missing_1800",
      status: "would_skip_contact_missing",
      reasonIncludes: "contact is missing",
    },
    {
      ruleId: "rule_contact_unverified_1800",
      status: "would_skip_contact_unverified",
      reasonIncludes: "contact is unverified",
    },
    {
      ruleId: "rule_consent_missing_1800",
      status: "would_skip_consent_missing",
      reasonIncludes: "consent is missing",
    },
    {
      ruleId: "rule_consent_revoked_1800",
      status: "would_skip_consent_revoked",
      reasonIncludes: "consent is revoked",
    },
    {
      ruleId: "rule_kakao_provider_not_ready_1800",
      status: "would_skip_provider_not_ready",
      reasonIncludes: "provider is not ready",
    },
  ];

  for (const { ruleId, status, reasonIncludes } of cases) {
    const result = evaluateSingleRule(ruleId);
    assertEquals(result.decision.status, status);
    assert(result.decision.reason.includes(reasonIncludes));
    assertEquals(result.ledger.writeLedger, false);
  }
});

Deno.test("unknown target person returns an empty fixture set", () => {
  const response = evaluateSchedulerDryRun({
    mode: "dry_run",
    now: "2026-06-03T09:00:00.000Z",
    timezone: "Asia/Seoul",
    targetPersonId: "person_missing_fixture",
  });
  assertEquals(response.status, 200);

  const body = successBody(response.body);
  assertEquals(body.evaluatedRules, 0);
  assertEquals(body.results.length, 0);
});
