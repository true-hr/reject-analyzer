import assert from "node:assert/strict";
import {
  buildCareerProfileFromResumeProfile,
  createEmptyCareerProfile,
} from "../src/lib/career-core/index.js";
import { resumeProfileControlledRuntimeRegressionCases } from "../src/lib/career-core/__fixtures__/resumeProfileControlledRuntimeRegressionCases.js";

function labels(items = []) {
  return items.map((item) => item.label ?? item.signal).filter(Boolean);
}

function controlledItems(items = []) {
  return items.filter((item) => item.controlledSignalCandidate === true);
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

function assertNoControlledCandidates(profile, context) {
  assert.equal(controlledItems(profile.signals.strengthSignals).length, 0, `${context} default controlled strength absent`);
  assert.equal(controlledItems(profile.signals.riskSignals).length, 0, `${context} default controlled risk absent`);
  assert.equal(profile.meta.controlledSignalCandidates, undefined, `${context} default controlled metadata absent`);
}

function assertControlledStrengthGuardrails(profile, context) {
  for (const signal of controlledItems(profile.signals.strengthSignals)) {
    assert.ok(["explicit", "inferred_strong"].includes(signal.evidenceConfidence), `${context} ${signal.label} strength confidence`);
    assert.ok(Array.isArray(signal.sourceTraces), `${context} ${signal.label} sourceTraces array`);
    assert.ok(signal.sourceTraces.length > 0, `${context} ${signal.label} sourceTraces present`);
    assert.ok(signal.sourceTraces.every((trace) => String(trace.sourceText ?? "").trim()), `${context} ${signal.label} sourceText present`);
    assert.notEqual(signal.evidenceConfidence, "inferred_weak", `${context} ${signal.label} no weak strength`);
    assert.notEqual(signal.evidenceConfidence, "contradicted", `${context} ${signal.label} no contradicted strength`);
    assert.notEqual(signal.evidenceConfidence, "absent", `${context} ${signal.label} no absent strength`);
  }
}

function assertControlledRiskGuardrails(profile, context) {
  for (const signal of controlledItems(profile.signals.riskSignals)) {
    assert.ok(signal.reasonCode || signal.evidenceText, `${context} ${signal.label} risk reason or evidence`);
  }
}

function assertMissingEvidenceGuardrails(profile, context) {
  assert.ok(
    !Object.prototype.hasOwnProperty.call(profile.signals, "missingEvidence"),
    `${context} missingEvidence not in signals schema`
  );

  for (const missing of profile.meta.controlledSignalCandidates?.missingEvidence ?? []) {
    assert.ok(missing.clarificationQuestion, `${context} ${missing.signal} clarificationQuestion`);
  }
}

const emptySchema = createEmptyCareerProfile();

for (const item of resumeProfileControlledRuntimeRegressionCases) {
  const defaultProfile = buildCareerProfileFromResumeProfile(item.resumeProfile, {
    controlledOwnershipSignalOptions: item.controlledOwnershipSignalOptions,
  });
  const baselineProfile = buildCareerProfileFromResumeProfile(item.resumeProfile);
  const explicitDisabledProfile = buildCareerProfileFromResumeProfile(item.resumeProfile, {
    enableControlledOwnershipSignals: false,
    controlledOwnershipSignalOptions: item.controlledOwnershipSignalOptions,
  });

  assert.deepEqual(defaultProfile, baselineProfile, `${item.id} default options preserve baseline`);
  assert.deepEqual(explicitDisabledProfile, baselineProfile, `${item.id} explicit false preserves baseline`);
  assertNoControlledCandidates(defaultProfile, item.id);

  const optInProfile = buildCareerProfileFromResumeProfile(item.resumeProfile, {
    enableControlledOwnershipSignals: true,
    controlledOwnershipSignalOptions: item.controlledOwnershipSignalOptions,
  });
  const strengthLabels = controlledLabels(optInProfile.signals.strengthSignals);
  const riskLabels = controlledLabels(optInProfile.signals.riskSignals);
  const missingLabels = labels(optInProfile.meta.controlledSignalCandidates?.missingEvidence);

  assertIncludesAll(strengthLabels, item.expected.strengthIncludes, `${item.id} controlled strength`);
  assertExcludesAll(strengthLabels, item.expected.strengthExcludes, `${item.id} controlled strength`);
  assertIncludesAll(riskLabels, item.expected.riskIncludes, `${item.id} controlled risk`);
  assertIncludesAll(missingLabels, item.expected.missingIncludes, `${item.id} missingEvidence`);

  assertControlledStrengthGuardrails(optInProfile, item.id);
  assertControlledRiskGuardrails(optInProfile, item.id);
  assertMissingEvidenceGuardrails(optInProfile, item.id);
  assert.deepEqual(Object.keys(optInProfile).sort(), Object.keys(emptySchema).sort(), `${item.id} top-level schema unchanged`);
  assert.deepEqual(Object.keys(optInProfile.signals).sort(), Object.keys(emptySchema.signals).sort(), `${item.id} signals schema unchanged`);

  if ((item.expected.strengthIncludes ?? []).length || (item.expected.riskIncludes ?? []).length || (item.expected.missingIncludes ?? []).length) {
    assert.ok(optInProfile.meta.controlledSignalCandidates, `${item.id} opt-in controlled metadata present`);
  }
}

console.log("PASS career-core resume profile controlled runtime regression checks");
