import assert from "node:assert/strict";
import { controlledCandidateMergePolicyCases } from "../src/lib/career-core/__fixtures__/controlledCandidateMergePolicyCases.js";

const PROHIBITED_FIELD_NAMES = new Set(["caseId", "expectedRegex", "fixtureRegex"]);
const WEAK_LEVELS = new Set(["weak_or_missing", "inferred_weak", "inferred_weak_activity", "missing_context"]);

function assertNoProhibitedFields(value, context) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProhibitedFields(item, `${context}[${index}]`));
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!PROHIBITED_FIELD_NAMES.has(key), `${context} does not use prohibited field ${key}`);
    assert.ok(!key.toLowerCase().includes("caseid"), `${context} does not imply caseId based runtime judgment`);
    assertNoProhibitedFields(nested, `${context}.${key}`);
  }
}

function arraysIn(value, key) {
  const out = [];

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (Array.isArray(node[key])) out.push(node[key]);
    Object.values(node).forEach(visit);
  }

  visit(value);
  return out;
}

function tracesOf(item) {
  return [
    ...(Array.isArray(item.sourceTraces) ? item.sourceTraces : []),
    ...(Array.isArray(item.supportingTraces) ? item.supportingTraces : []),
    ...(Array.isArray(item.relatedEvidence) ? item.relatedEvidence : []),
  ];
}

function expectedStrengthSignals(item) {
  return item.expected.mergedStrengthSignals ?? [];
}

function inputWeakSignals(item) {
  const risks = arraysIn(item.input, "riskSignals").flat();
  const missing = arraysIn(item.input, "missingEvidence").flat();
  return [...risks, ...missing].filter((signal) => WEAK_LEVELS.has(signal.evidenceLevel) || String(signal.reasonCode ?? "").includes("weak"));
}

function assertSourceBackedStrength(item) {
  for (const signal of expectedStrengthSignals(item)) {
    const traces = tracesOf(signal);
    assert.ok(traces.length > 0, `${item.id} expected strength has source traces`);
    assert.ok(traces.every((trace) => String(trace.sourceText ?? "").trim()), `${item.id} expected strength sourceText`);
    assert.ok(traces.every((trace) => String(trace.sourceRecordId ?? "").trim()), `${item.id} expected strength sourceRecordId`);
    assert.ok(traces.every((trace) => String(trace.sourceField ?? "").trim()), `${item.id} expected strength sourceField`);
  }
}

function assertWeakDoesNotMergeToStrength(item) {
  if (inputWeakSignals(item).length === 0) return;
  for (const signal of expectedStrengthSignals(item)) {
    assert.ok(
      !WEAK_LEVELS.has(signal.evidenceLevel),
      `${item.id} weak evidence does not become expected strength`
    );
  }
}

function assertMissingEvidenceQuestions(item) {
  for (const missing of item.expected.mergedMissingEvidence ?? []) {
    assert.ok(missing.clarificationQuestion, `${item.id} ${missing.signal} missingEvidence clarificationQuestion`);
  }
}

function assertSameSignalSourcePolicy(item) {
  if (!item.id.includes("same_signal") && !item.id.includes("multiple_sources")) return;
  const policy = String(item.expected.sourceTracePolicy ?? "");
  const traceSources = expectedStrengthSignals(item)
    .flatMap(tracesOf)
    .map((trace) => trace.sourceType)
    .filter(Boolean);
  assert.ok(new Set(traceSources).size >= 2 || /both|multiple|복수/i.test(policy), `${item.id} preserves multiple sources`);
}

function assertManualPriorityPolicy(item) {
  if (!item.id.includes("manual")) return;
  assert.ok(
    String(item.expected.priorityPolicy ?? "").includes("manual_user_confirmed_candidate"),
    `${item.id} manual priority policy is explicit`
  );
}

assert.ok(Array.isArray(controlledCandidateMergePolicyCases), "fixture exports cases array");
assert.ok(controlledCandidateMergePolicyCases.length >= 8, "fixture includes at least 8 merge policy cases");

for (const item of controlledCandidateMergePolicyCases) {
  assert.ok(item.id, "case has id");
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);
  assertNoProhibitedFields(item, item.id);

  assertSourceBackedStrength(item);
  assertWeakDoesNotMergeToStrength(item);
  assertMissingEvidenceQuestions(item);
  assertSameSignalSourcePolicy(item);
  assertManualPriorityPolicy(item);

  if (item.id.includes("contradicted")) {
    assert.equal(item.expected.shouldBlockFinalApply, true, `${item.id} contradicted case blocks final apply`);
    assert.ok((item.expected.mergedRiskSignals ?? []).length > 0, `${item.id} contradicted case has risk separation`);
    assert.ok((item.expected.mergedMissingEvidence ?? []).length > 0, `${item.id} contradicted case has clarification`);
  }

  if (item.id.includes("source_missing")) {
    assert.equal((item.expected.mergedStrengthSignals ?? []).length, 0, `${item.id} source-less strength does not merge`);
    assert.ok((item.expected.invalidCandidates ?? []).length > 0 || (item.expected.mergedRiskSignals ?? []).length > 0, `${item.id} invalid source is retained outside strength`);
  }
}

console.log("PASS career-core controlled candidate merge policy deterministic checks");
