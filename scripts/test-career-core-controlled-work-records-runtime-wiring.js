import assert from "node:assert/strict";
import {
  buildCareerProfileFromWorkRecords,
  createEmptyCareerProfile,
} from "../src/lib/career-core/index.js";
import { controlledWorkRecordsRuntimeWiringCases } from "../src/lib/career-core/__fixtures__/controlledWorkRecordsRuntimeWiringCases.js";

const STRENGTH_EVIDENCE_LEVELS = new Set(["explicit_ownership", "explicit_judgment", "explicit_impact"]);
const BLOCKED_EVIDENCE_LEVELS = new Set(["inferred_weak_activity", "contradicted_ownership", "missing_context"]);

function labels(items = []) {
  return items.map((item) => item.label ?? item.signal).filter(Boolean);
}

function controlledItems(items = []) {
  return items.filter((item) => item.controlledWorkRecordSignalCandidate === true);
}

function controlledLabels(items = []) {
  return labels(controlledItems(items));
}

function assertIncludesAll(actual, expected = [], context) {
  for (const item of expected) {
    assert.ok(actual.includes(item), `${context} includes ${item}`);
  }
}

function assertExcludesAll(actual, expected = [], context) {
  for (const item of expected) {
    assert.ok(!actual.includes(item), `${context} excludes ${item}`);
  }
}

function evidenceLevels(signal) {
  return Array.isArray(signal.evidenceLevels) ? signal.evidenceLevels : [signal.evidenceLevel].filter(Boolean);
}

function assertControlledStrengthGuardrails(profile, context) {
  for (const signal of controlledItems(profile.signals.strengthSignals)) {
    const levels = evidenceLevels(signal);
    assert.ok(levels.some((level) => STRENGTH_EVIDENCE_LEVELS.has(level)), `${context} ${signal.label} explicit strength evidence`);
    assert.ok(levels.every((level) => !BLOCKED_EVIDENCE_LEVELS.has(level)), `${context} ${signal.label} no blocked strength evidence`);
    assert.ok(Array.isArray(signal.sourceTraces), `${context} ${signal.label} sourceTraces array`);
    assert.ok(signal.sourceTraces.length > 0, `${context} ${signal.label} sourceTraces present`);

    for (const trace of signal.sourceTraces) {
      assert.ok(String(trace.sourceText ?? "").trim(), `${context} ${signal.label} sourceText present`);
      assert.ok(String(trace.sourceRecordId ?? "").trim(), `${context} ${signal.label} sourceRecordId present`);
      assert.ok(
        String(trace.recordDate ?? trace.createdAt ?? "").trim(),
        `${context} ${signal.label} recordDate or createdAt present`
      );
    }
  }
}

function assertControlledRiskGuardrails(profile, context) {
  for (const signal of controlledItems(profile.signals.riskSignals)) {
    const levels = evidenceLevels(signal);
    assert.ok(
      levels.some((level) => BLOCKED_EVIDENCE_LEVELS.has(level)),
      `${context} ${signal.label} risk uses weak, contradicted, or missing-context evidence`
    );
    assert.ok(
      signal.reasonCode || signal.evidenceText || signal.sourceTraces?.some((trace) => trace.sourceText),
      `${context} ${signal.label} risk reason, evidence, or source`
    );
  }
}

function assertMissingEvidenceGuardrails(profile, context) {
  assert.ok(
    !Object.prototype.hasOwnProperty.call(profile.signals, "missingEvidence"),
    `${context} missingEvidence not in signals schema`
  );

  for (const missing of profile.meta.controlledWorkRecordSignalCandidates?.missingEvidence ?? []) {
    assert.ok(missing.clarificationQuestion, `${context} ${missing.signal} clarificationQuestion`);
  }
}

const emptySchema = createEmptyCareerProfile();
const defaultCase = controlledWorkRecordsRuntimeWiringCases.find((item) => item.id === "default_disabled_no_change");
const baseline = buildCareerProfileFromWorkRecords(defaultCase.workRecords);
const disabledWithOptions = buildCareerProfileFromWorkRecords(defaultCase.workRecords, defaultCase.options);
const explicitDisabled = buildCareerProfileFromWorkRecords(defaultCase.workRecords, {
  enableControlledWorkRecordSignals: false,
});

assert.deepEqual(disabledWithOptions, baseline, "default options preserve baseline profile");
assert.deepEqual(explicitDisabled, baseline, "explicit false preserves baseline profile");
assert.equal(controlledItems(baseline.signals.strengthSignals).length, 0, "default controlled strength absent");
assert.equal(controlledItems(baseline.signals.riskSignals).length, 0, "default controlled risk absent");
assert.equal(baseline.meta.controlledWorkRecordSignalCandidates, undefined, "default controlled metadata absent");

for (const item of controlledWorkRecordsRuntimeWiringCases.filter((entry) => entry.options.enableControlledWorkRecordSignals === true)) {
  const actual = buildCareerProfileFromWorkRecords(item.workRecords, item.options);
  const strengthLabels = controlledLabels(actual.signals.strengthSignals);
  const riskLabels = controlledLabels(actual.signals.riskSignals);
  const missingLabels = labels(actual.meta.controlledWorkRecordSignalCandidates?.missingEvidence);

  assert.ok(actual.meta.controlledWorkRecordSignalCandidates, `${item.id} opt-in controlled metadata present`);
  assert.equal(
    actual.meta.controlledWorkRecordSignalCandidates.appliedToCareerProfile,
    false,
    `${item.id} metadata remains read-only candidate`
  );
  assert.equal(
    actual.meta.controlledWorkRecordSignalCandidates.integrationStatus,
    "read_only_candidate",
    `${item.id} integration status`
  );

  assertIncludesAll(strengthLabels, item.expected.controlledStrengthIncludes, `${item.id} controlled strength`);
  assertExcludesAll(strengthLabels, item.expected.controlledStrengthExcludes, `${item.id} controlled strength`);
  assertIncludesAll(riskLabels, item.expected.controlledRiskIncludes, `${item.id} controlled risk`);
  assertIncludesAll(missingLabels, item.expected.missingIncludes, `${item.id} missingEvidence`);

  assertControlledStrengthGuardrails(actual, item.id);
  assertControlledRiskGuardrails(actual, item.id);
  assertMissingEvidenceGuardrails(actual, item.id);
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(emptySchema).sort(), `${item.id} top-level schema unchanged`);
  assert.deepEqual(Object.keys(actual.signals).sort(), Object.keys(emptySchema.signals).sort(), `${item.id} signals schema unchanged`);
}

console.log("PASS career-core controlled work records runtime wiring deterministic checks");
