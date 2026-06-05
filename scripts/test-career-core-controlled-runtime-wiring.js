import assert from "node:assert/strict";
import {
  buildCareerProfileFromResumeProfile,
  buildControlledCareerProfileSignals,
  createEmptyCareerProfile,
} from "../src/lib/career-core/index.js";
import { controlledRuntimeWiringCases } from "../src/lib/career-core/__fixtures__/controlledRuntimeWiringCases.js";

function labels(items = []) {
  return items.map((item) => item.label ?? item.signal).filter(Boolean);
}

function controlledLabels(items = []) {
  return labels(items.filter((item) => item.controlledSignalCandidate === true));
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

const defaultCase = controlledRuntimeWiringCases.find((item) => item.id === "default_disabled_no_change");
const baseline = buildCareerProfileFromResumeProfile(defaultCase.resumeProfile);
const disabledWithOptions = buildCareerProfileFromResumeProfile(defaultCase.resumeProfile, defaultCase.options);
const explicitDisabled = buildCareerProfileFromResumeProfile(defaultCase.resumeProfile, {
  ...defaultCase.options,
  enableControlledOwnershipSignals: false,
});

assert.deepEqual(disabledWithOptions, baseline, "default disabled preserves baseline profile");
assert.deepEqual(explicitDisabled, baseline, "explicit false preserves baseline profile");

for (const item of controlledRuntimeWiringCases) {
  const actual = buildCareerProfileFromResumeProfile(item.resumeProfile, item.options);
  const strengthLabels = controlledLabels(actual.signals.strengthSignals);
  const riskLabels = controlledLabels(actual.signals.riskSignals);
  const missingLabels = labels(actual.meta.controlledSignalCandidates?.missingEvidence);

  assertIncludesAll(strengthLabels, item.expected.controlledStrengthIncludes, `${item.id} controlled strength`);
  assertExcludesAll(strengthLabels, item.expected.controlledStrengthExcludes, `${item.id} controlled strength`);
  assertIncludesAll(riskLabels, item.expected.controlledRiskIncludes, `${item.id} controlled risk`);
  assertIncludesAll(missingLabels, item.expected.missingIncludes, `${item.id} missingEvidence`);

  for (const signal of actual.signals.strengthSignals.filter((entry) => entry.controlledSignalCandidate)) {
    assert.ok(["explicit", "inferred_strong"].includes(signal.evidenceConfidence), `${item.id} strength confidence`);
    assert.ok(signal.sourceTraces.length >= 1, `${item.id} strength sourceTraces`);
    assert.ok(signal.sourceTraces.every((trace) => String(trace.sourceText ?? "").trim()), `${item.id} strength sourceText`);
  }

  for (const missing of actual.meta.controlledSignalCandidates?.missingEvidence ?? []) {
    assert.ok(missing.clarificationQuestion, `${item.id} missingEvidence clarificationQuestion`);
  }
}

const weakCase = controlledRuntimeWiringCases.find((item) => item.id === "opt_in_weak_signal_to_risk_only");
const weakControlledOutput = buildControlledCareerProfileSignals(
  weakCase.resumeProfile,
  weakCase.options.controlledOwnershipSignalOptions
);
assert.ok(
  !weakControlledOutput.candidateStrengthSignals.some((signal) => ["inferred_weak", "absent"].includes(signal.evidenceConfidence)),
  "weak and absent controlled output never become strength candidates"
);

const contradictedCase = controlledRuntimeWiringCases.find((item) => item.id === "opt_in_contradicted_signal_blocked");
const contradictedControlledOutput = buildControlledCareerProfileSignals(
  contradictedCase.resumeProfile,
  contradictedCase.options.controlledOwnershipSignalOptions
);
assert.ok(
  !contradictedControlledOutput.candidateStrengthSignals.some((signal) => signal.evidenceConfidence === "contradicted"),
  "contradicted controlled output never becomes strength candidate"
);

const sourceMissingCase = controlledRuntimeWiringCases.find((item) => item.id === "opt_in_source_missing_strength_blocked");
const sourceMissingProfile = buildCareerProfileFromResumeProfile(sourceMissingCase.resumeProfile, sourceMissingCase.options);
assert.ok(
  !controlledLabels(sourceMissingProfile.signals.strengthSignals).includes("cross_functional_collaboration"),
  "source-less strength candidate is blocked at runtime wiring"
);

const emptySchema = createEmptyCareerProfile();
const optInProfile = buildCareerProfileFromResumeProfile(
  controlledRuntimeWiringCases.find((item) => item.id === "opt_in_explicit_pm_strength_added").resumeProfile,
  controlledRuntimeWiringCases.find((item) => item.id === "opt_in_explicit_pm_strength_added").options
);
assert.deepEqual(Object.keys(optInProfile).sort(), Object.keys(emptySchema).sort(), "CareerProfile top-level schema keys unchanged");
assert.deepEqual(Object.keys(optInProfile.signals).sort(), Object.keys(emptySchema.signals).sort(), "CareerProfile signals schema keys unchanged");

console.log("PASS career-core controlled runtime wiring deterministic checks");
