import assert from "node:assert/strict";
import { buildControlledCareerProfileSignals } from "../src/lib/career-core/index.js";
import { controlledProfileSignalCases } from "../src/lib/career-core/__fixtures__/controlledProfileSignalCases.js";

function signalsOf(items = []) {
  return items.map((item) => item.signal);
}

function assertIncludesAll(actual, expected, context) {
  for (const item of expected ?? []) {
    assert.ok(actual.includes(item), `${context} includes ${item}`);
  }
}

function assertExcludesAll(actual, expected, context) {
  for (const item of expected ?? []) {
    assert.ok(!actual.includes(item), `${context} excludes ${item}`);
  }
}

function assertIncludesOneOf(actual, expected, context) {
  if (!expected?.length) return;
  assert.ok(expected.some((item) => actual.includes(item)), `${context} includes one of ${expected.join(", ")}`);
}

function assertStrengthIntegrity(actual, context) {
  for (const item of actual.candidateStrengthSignals) {
    assert.ok(["explicit", "inferred_strong"].includes(item.evidenceConfidence), `${context} ${item.signal} strong confidence`);
    assert.equal(item.canApplyToCareerProfile, true, `${context} ${item.signal} canApplyToCareerProfile`);
    assert.ok(item.sourceTraces.length > 0, `${context} ${item.signal} sourceTraces`);
    for (const trace of item.sourceTraces) {
      assert.ok(trace.sourceText, `${context} ${item.signal} sourceText`);
      assert.ok(trace.sourceField, `${context} ${item.signal} sourceField`);
      assert.ok(trace.reasonCode, `${context} ${item.signal} reasonCode`);
    }
  }
}

function assertRiskIntegrity(actual, context) {
  for (const item of actual.candidateRiskSignals) {
    assert.ok(item.reasonCode, `${context} ${item.signal} risk reasonCode`);
    assert.equal(item.canApplyToCareerProfile, false, `${context} ${item.signal} risk canApplyToCareerProfile`);
  }
}

function assertMissingIntegrity(actual, context) {
  for (const item of actual.missingEvidence) {
    assert.ok(item.reasonCode, `${context} ${item.signal} missing reasonCode`);
    assert.ok("clarificationQuestion" in item, `${context} ${item.signal} clarificationQuestion key`);
  }
}

for (const item of controlledProfileSignalCases) {
  const actual = buildControlledCareerProfileSignals(item.input, item.options ?? {});
  const expected = item.expected;
  const strengthSignals = signalsOf(actual.candidateStrengthSignals);
  const riskSignals = signalsOf(actual.candidateRiskSignals);
  const missingSignals = signalsOf(actual.missingEvidence);
  const contradictedSignals = signalsOf(actual.contradictedSignals);

  assert.equal(actual.integrationStatus, "read_only_candidate", `${item.id} integrationStatus`);
  assert.equal(actual.appliedToCareerProfile, false, `${item.id} appliedToCareerProfile`);
  assertStrengthIntegrity(actual, item.id);
  assertRiskIntegrity(actual, item.id);
  assertMissingIntegrity(actual, item.id);

  assertIncludesAll(strengthSignals, expected.strengthSignals, `${item.id} strengthSignals`);
  assertExcludesAll(strengthSignals, expected.strengthExcludes, `${item.id} strengthSignals`);
  assertIncludesAll(riskSignals, expected.riskSignalsIncludes, `${item.id} riskSignals`);
  assertIncludesOneOf(riskSignals, expected.riskSignalsIncludesOneOf, `${item.id} riskSignals`);
  assertIncludesAll(missingSignals, expected.missingSignals, `${item.id} missingEvidence`);
  assertIncludesOneOf(missingSignals, expected.missingIncludesOneOf, `${item.id} missingEvidence`);
  assertIncludesAll(contradictedSignals, expected.contradictedSignals, `${item.id} contradictedSignals`);
  assertIncludesOneOf(contradictedSignals, expected.contradictedOneOf, `${item.id} contradictedSignals`);

  if (expected.strengthSignalsMax != null) {
    assert.ok(strengthSignals.length <= expected.strengthSignalsMax, `${item.id} strengthSignalsMax`);
  }
  if (expected.riskSignalsMax != null) {
    assert.ok(riskSignals.length <= expected.riskSignalsMax, `${item.id} riskSignalsMax`);
  }
  if (expected.roleFamily) {
    for (const signal of actual.candidateStrengthSignals) {
      assert.equal(signal.roleFamily, expected.roleFamily, `${item.id} roleFamily`);
    }
  }
  if (expected.evidenceConfidence) {
    for (const signal of actual.candidateStrengthSignals) {
      assert.equal(signal.evidenceConfidence, expected.evidenceConfidence, `${item.id} evidenceConfidence`);
    }
  }
}

console.log("PASS career-core controlled profile signal deterministic checks");
