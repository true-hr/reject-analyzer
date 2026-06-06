import assert from "node:assert/strict";
import { mergeControlledCandidateSignals } from "../src/lib/career-core/mergeControlledCandidateSignals.js";
import { controlledCandidateMergeUtilityCases } from "../src/lib/career-core/__fixtures__/controlledCandidateMergeUtilityCases.js";

const WEAK_LEVELS = new Set(["inferred_weak", "inferred_weak_activity", "weak_or_missing", "missing_context", "absent"]);

function findBySignal(items = [], signal) {
  return items.find((item) => item.signal === signal);
}

function assertExpectedSignals(actualItems = [], expectedItems = [], context) {
  assert.equal(actualItems.length, expectedItems.length, `${context} count`);

  for (const expected of expectedItems) {
    const actual = findBySignal(actualItems, expected.signal);
    assert.ok(actual, `${context} includes ${expected.signal}`);
    if (expected.evidenceLevel) assert.equal(actual.evidenceLevel, expected.evidenceLevel, `${context} ${expected.signal} evidenceLevel`);
    if (expected.reasonCode) assert.equal(actual.reasonCode, expected.reasonCode, `${context} ${expected.signal} reasonCode`);
    if (expected.resolutionState) assert.equal(actual.resolutionState, expected.resolutionState, `${context} ${expected.signal} resolutionState`);
    if (expected.sourceTraceCount != null) assert.equal(actual.sourceTraces?.length ?? 0, expected.sourceTraceCount, `${context} ${expected.signal} sourceTraceCount`);
    if (expected.supportingTraceCount != null) assert.equal(actual.supportingTraces?.length ?? 0, expected.supportingTraceCount, `${context} ${expected.signal} supportingTraceCount`);
    if (expected.relatedQuestionCount != null) assert.equal(actual.relatedQuestions?.length ?? 0, expected.relatedQuestionCount, `${context} ${expected.signal} relatedQuestionCount`);
    if (expected.confidence != null) assert.equal(actual.confidence, expected.confidence, `${context} ${expected.signal} confidence`);
  }
}

function assertSourceBackedStrength(result, context) {
  for (const signal of result.mergedStrengthSignals) {
    assert.ok(Array.isArray(signal.sourceTraces) && signal.sourceTraces.length > 0, `${context} ${signal.signal} sourceTraces present`);
    for (const trace of signal.sourceTraces) {
      assert.ok(String(trace.sourceText ?? "").trim(), `${context} ${signal.signal} sourceText`);
      assert.ok(String(trace.sourceField ?? "").trim(), `${context} ${signal.signal} sourceField`);
      assert.ok(String(trace.sourceType ?? "").trim(), `${context} ${signal.signal} sourceType`);
      if (trace.sourceType === "work_record_controlled_candidate") {
        assert.ok(String(trace.sourceRecordId ?? "").trim(), `${context} ${signal.signal} workRecord sourceRecordId`);
      }
    }
    assert.ok(!WEAK_LEVELS.has(signal.evidenceLevel), `${context} ${signal.signal} weak evidence not strength`);
  }
}

function assertMissingQuestions(result, context) {
  for (const missing of result.mergedMissingEvidence) {
    assert.ok(missing.clarificationQuestion, `${context} ${missing.signal} clarificationQuestion`);
  }
}

assert.ok(Array.isArray(controlledCandidateMergeUtilityCases), "fixture exports cases array");
assert.ok(controlledCandidateMergeUtilityCases.length >= 8, "fixture includes at least 8 cases");

for (const item of controlledCandidateMergeUtilityCases) {
  assert.ok(item.id, "case has id");
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);

  const result = mergeControlledCandidateSignals(item.input);
  assert.equal(result.mergeStatus, "read_only_candidate", `${item.id} mergeStatus`);
  assert.equal(result.appliedToCareerProfile, false, `${item.id} appliedToCareerProfile`);
  assert.equal(result.shouldBlockFinalApply, item.expected.shouldBlockFinalApply, `${item.id} shouldBlockFinalApply`);

  assertExpectedSignals(result.mergedStrengthSignals, item.expected.mergedStrengthSignals, `${item.id} mergedStrengthSignals`);
  assertExpectedSignals(result.mergedRiskSignals, item.expected.mergedRiskSignals, `${item.id} mergedRiskSignals`);
  assertExpectedSignals(result.mergedMissingEvidence, item.expected.mergedMissingEvidence, `${item.id} mergedMissingEvidence`);
  assertExpectedSignals(result.contradictedSignals, item.expected.contradictedSignals, `${item.id} contradictedSignals`);
  assertExpectedSignals(result.invalidCandidates, item.expected.invalidCandidates, `${item.id} invalidCandidates`);

  assertSourceBackedStrength(result, item.id);
  assertMissingQuestions(result, item.id);

  if (item.id === "merge_same_signal_resume_and_workrecord") {
    assert.equal(result.mergedStrengthSignals.length, 1, `${item.id} same signal deduped`);
    assert.equal(result.mergedStrengthSignals[0].sourceTraces.length, 2, `${item.id} source traces preserved`);
  }

  if (item.id === "merge_workrecord_weak_does_not_upgrade") {
    assert.equal(result.mergedStrengthSignals.length, 0, `${item.id} weak does not upgrade`);
  }

  if (item.id === "merge_source_missing_strength_invalid") {
    assert.equal(result.mergedStrengthSignals.length, 0, `${item.id} source-less strength blocked`);
    assert.ok(result.invalidCandidates.some((candidate) => candidate.signal === "decision_support"), `${item.id} invalid candidate retained`);
  }

  if (item.id === "merge_manual_confirmed_overrides_candidate") {
    assert.equal(result.mergedStrengthSignals[0].evidenceLevel, "manual_user_confirmed_candidate", `${item.id} manual confirmed wins`);
    assert.ok(result.mergedRiskSignals[0].resolutionState, `${item.id} related risk preserved`);
  }

  if (item.id === "merge_contradicted_prioritization") {
    assert.ok(result.shouldBlockFinalApply || result.contradictedSignals.length || result.mergedRiskSignals.length, `${item.id} contradiction blocks or separates`);
  }
}

console.log("PASS career-core controlled candidate merge utility deterministic checks");
