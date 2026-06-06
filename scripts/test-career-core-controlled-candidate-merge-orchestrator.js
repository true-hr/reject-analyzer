import assert from "node:assert/strict";
import { buildCareerProfileFromResumeProfile } from "../src/lib/career-core/buildCareerProfileFromResumeProfile.js";
import { buildCareerProfileFromWorkRecords } from "../src/lib/career-core/buildCareerProfileFromWorkRecords.js";
import { buildMergedControlledCandidateResult } from "../src/lib/career-core/buildMergedControlledCandidateResult.js";
import { controlledCandidateMergeOrchestratorCases } from "../src/lib/career-core/__fixtures__/controlledCandidateMergeOrchestratorCases.js";

function findBySignal(items = [], signal) {
  return items.find((item) => item.signal === signal);
}

function signalsOf(items = []) {
  return items.map((item) => item.signal).filter(Boolean);
}

function assertIncludes(items, expected = [], context) {
  const actual = signalsOf(items);
  for (const signal of expected) {
    assert.ok(actual.includes(signal), `${context} includes ${signal}`);
  }
}

function assertExcludes(items, expected = [], context) {
  const actual = signalsOf(items);
  for (const signal of expected) {
    assert.ok(!actual.includes(signal), `${context} excludes ${signal}`);
  }
}

function assertSourceSummary(result, expected, context) {
  for (const [key, value] of Object.entries(expected ?? {})) {
    assert.equal(result.sourceSummary?.[key], value, `${context} sourceSummary.${key}`);
  }
}

function assertNoSourceType(result, sourceType, context) {
  const traces = [
    ...result.mergedStrengthSignals.flatMap((item) => item.sourceTraces ?? []),
    ...result.mergedRiskSignals.flatMap((item) => item.sourceTraces ?? []),
    ...result.mergedMissingEvidence.flatMap((item) => item.sourceTraces ?? []),
    ...result.contradictedSignals.flatMap((item) => item.sourceTraces ?? []),
  ];

  assert.ok(!traces.some((trace) => trace.sourceType === sourceType), `${context} has no ${sourceType} traces`);
}

function assertSourceBackedStrength(result, context) {
  for (const signal of result.mergedStrengthSignals) {
    assert.ok(Array.isArray(signal.sourceTraces) && signal.sourceTraces.length > 0, `${context} ${signal.signal} has sourceTraces`);
    for (const trace of signal.sourceTraces) {
      assert.ok(String(trace.sourceText ?? "").trim(), `${context} ${signal.signal} sourceText`);
      assert.ok(String(trace.sourceField ?? "").trim(), `${context} ${signal.signal} sourceField`);
      assert.ok(String(trace.sourceType ?? "").trim(), `${context} ${signal.signal} sourceType`);
      if (trace.sourceType === "work_record_controlled_candidate") {
        assert.ok(String(trace.sourceRecordId ?? "").trim(), `${context} ${signal.signal} workRecord sourceRecordId`);
      }
    }
  }
}

function assertMissingQuestions(result, context) {
  for (const missing of result.mergedMissingEvidence) {
    assert.ok(missing.clarificationQuestion, `${context} ${missing.signal} clarificationQuestion`);
  }
}

function assertBuilderDefaultInvariant(input, context) {
  if (input.resumeProfile) {
    const before = buildCareerProfileFromResumeProfile(input.resumeProfile);
    buildMergedControlledCandidateResult(input);
    const after = buildCareerProfileFromResumeProfile(input.resumeProfile);
    assert.deepEqual(after, before, `${context} ResumeProfile default builder invariant`);
  }

  if (Array.isArray(input.workRecords)) {
    const before = buildCareerProfileFromWorkRecords(input.workRecords);
    buildMergedControlledCandidateResult(input);
    const after = buildCareerProfileFromWorkRecords(input.workRecords);
    assert.deepEqual(after, before, `${context} WorkRecords default builder invariant`);
  }
}

assert.ok(Array.isArray(controlledCandidateMergeOrchestratorCases), "fixture exports cases array");
assert.ok(controlledCandidateMergeOrchestratorCases.length >= 5, "fixture includes at least 5 cases");

for (const item of controlledCandidateMergeOrchestratorCases) {
  assert.ok(item.id, "case has id");
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);

  const result = buildMergedControlledCandidateResult(item.input);
  assert.equal(result.mergeStatus, "read_only_candidate", `${item.id} mergeStatus`);
  assert.equal(result.appliedToCareerProfile, false, `${item.id} appliedToCareerProfile`);
  assert.ok(Array.isArray(result.mergedStrengthSignals), `${item.id} mergedStrengthSignals array`);
  assert.ok(Array.isArray(result.mergedRiskSignals), `${item.id} mergedRiskSignals array`);
  assert.ok(Array.isArray(result.mergedMissingEvidence), `${item.id} mergedMissingEvidence array`);
  assert.ok(Array.isArray(result.contradictedSignals), `${item.id} contradictedSignals array`);
  assert.ok(Array.isArray(result.invalidCandidates), `${item.id} invalidCandidates array`);

  assertIncludes(result.mergedStrengthSignals, item.expected.mergedStrengthIncludes, `${item.id} mergedStrengthSignals`);
  assertExcludes(result.mergedStrengthSignals, item.expected.mergedStrengthExcludes, `${item.id} mergedStrengthSignals`);
  assertIncludes(result.mergedMissingEvidence, item.expected.mergedMissingIncludes, `${item.id} mergedMissingEvidence`);
  assertIncludes(result.contradictedSignals, item.expected.contradictedIncludes, `${item.id} contradictedSignals`);
  assertIncludes(result.mergedRiskSignals, item.expected.relatedRiskIncludes, `${item.id} mergedRiskSignals`);
  assertSourceSummary(result, item.expected.sourceSummary, item.id);
  assertSourceBackedStrength(result, item.id);
  assertMissingQuestions(result, item.id);
  assertBuilderDefaultInvariant(item.input, item.id);

  if (item.id === "orchestrate_resume_only_controlled_candidates") {
    assertNoSourceType(result, "work_record_controlled_candidate", item.id);
  }

  if (item.id === "orchestrate_work_records_only_controlled_candidates") {
    assertNoSourceType(result, "resume_profile_controlled_candidate", item.id);
  }

  if (item.expected.dedupedSignal) {
    const matching = result.mergedStrengthSignals.filter((signal) => signal.signal === item.expected.dedupedSignal);
    assert.equal(matching.length, 1, `${item.id} same signal deduped`);
  }

  for (const [signal, count] of Object.entries(item.expected.minSourceTraceCountBySignal ?? {})) {
    const actual = findBySignal(result.mergedStrengthSignals, signal);
    assert.ok(actual, `${item.id} has ${signal}`);
    assert.ok((actual.sourceTraces?.length ?? 0) >= count, `${item.id} ${signal} preserves sourceTraces`);
  }

  if (item.expected.shouldBlockFinalApply != null) {
    assert.equal(result.shouldBlockFinalApply, item.expected.shouldBlockFinalApply, `${item.id} shouldBlockFinalApply`);
  }

  if (item.id === "orchestrate_contradicted_work_record_blocks_candidate") {
    assert.ok(
      result.shouldBlockFinalApply || result.contradictedSignals.length > 0 || result.mergedRiskSignals.length > 0,
      `${item.id} contradicted WorkRecord blocks or separates`
    );
    assert.ok(!findBySignal(result.mergedStrengthSignals, "prioritization"), `${item.id} contradicted prioritization not strength`);
  }

  if (item.expected.manualPrioritySignal) {
    const manual = findBySignal(result.mergedStrengthSignals, item.expected.manualPrioritySignal);
    assert.ok(manual, `${item.id} manual confirmed signal exists`);
    assert.equal(manual.evidenceLevel, "manual_user_confirmed_candidate", `${item.id} manual confirmed has highest priority`);
  }
}

console.log("PASS career-core controlled candidate merge orchestrator deterministic checks");
