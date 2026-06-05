import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { profileIntegrationContractCases } from "../src/lib/career-core/__fixtures__/profileIntegrationContractCases.js";

const DOC_PATH = new URL("../docs/career-core-profile-integration-contract-20260605.md", import.meta.url);
const doc = readFileSync(DOC_PATH, "utf8");

const REQUIRED_DOC_TERMS = [
  "read_only_candidate",
  "eligible_for_profile_mapping",
  "blocked_by_weak_evidence",
  "blocked_by_contradiction",
  "missing_required_evidence",
  "evidenceConfidence",
  "sourceTraces",
  "sourceText",
  "canApplyToCareerProfile",
  "appliedToCareerProfile: false",
  "inferred_weak",
  "contradicted",
  "absent",
  "caseId",
  "fixture-sentence-only",
];

function signalsOf(items = []) {
  return items.map((item) => item.signal);
}

function hasValidSourceTraces(item) {
  return Array.isArray(item.sourceTraces)
    && item.sourceTraces.length > 0
    && item.sourceTraces.every((trace) => String(trace.sourceText ?? "").trim());
}

function isEligibleStrength(item, output) {
  return ["explicit", "inferred_strong"].includes(item.evidenceConfidence)
    && hasValidSourceTraces(item)
    && item.canApplyToCareerProfile === true
    && !signalsOf(output.contradictedSignals).includes(item.signal)
    && output.appliedToCareerProfile === false;
}

for (const term of REQUIRED_DOC_TERMS) {
  assert.ok(doc.includes(term), `contract doc includes ${term}`);
}

for (const item of profileIntegrationContractCases) {
  const output = item.controlledOutput;
  const expected = item.expected;
  const eligibleStrengthSignals = output.candidateStrengthSignals
    .filter((signal) => isEligibleStrength(signal, output))
    .map((signal) => signal.signal);
  const blockedStrengthSignals = output.candidateStrengthSignals
    .filter((signal) => !isEligibleStrength(signal, output))
    .map((signal) => signal.signal);
  const riskSignals = signalsOf(output.candidateRiskSignals);
  const missingSignals = signalsOf(output.missingEvidence);

  assert.equal(output.appliedToCareerProfile, false, `${item.id} stays read-only`);
  assert.equal(output.integrationStatus, "read_only_candidate", `${item.id} integrationStatus`);

  for (const signal of expected.eligibleStrengthSignals ?? []) {
    assert.ok(eligibleStrengthSignals.includes(signal), `${item.id} eligible strength includes ${signal}`);
  }

  for (const signal of expected.forbiddenStrengthSignals ?? []) {
    assert.ok(!eligibleStrengthSignals.includes(signal), `${item.id} forbidden strength excludes ${signal}`);
  }

  for (const signal of expected.blockedStrengthSignals ?? []) {
    assert.ok(blockedStrengthSignals.includes(signal), `${item.id} blocked strength includes ${signal}`);
  }

  for (const signal of output.candidateStrengthSignals) {
    if (eligibleStrengthSignals.includes(signal.signal)) {
      assert.ok(hasValidSourceTraces(signal), `${item.id} ${signal.signal} eligible sourceTraces`);
      assert.ok(["explicit", "inferred_strong"].includes(signal.evidenceConfidence), `${item.id} ${signal.signal} eligible confidence`);
    }
    assert.notEqual(signal.evidenceConfidence, "inferred_weak", `${item.id} no weak strength`);
    assert.notEqual(signal.evidenceConfidence, "contradicted", `${item.id} no contradicted strength`);
    assert.notEqual(signal.evidenceConfidence, "absent", `${item.id} no absent strength`);
  }

  for (const risk of output.candidateRiskSignals) {
    assert.ok(risk.reasonCode, `${item.id} ${risk.signal} risk reasonCode`);
    if (risk.sourceTraces?.length) {
      assert.ok(risk.sourceTraces.every((trace) => String(trace.sourceText ?? "").trim()), `${item.id} ${risk.signal} risk source preserved`);
    }
  }

  for (const missing of output.missingEvidence) {
    assert.ok(missing.reasonCode, `${item.id} ${missing.signal} missing reasonCode`);
    assert.ok(missing.clarificationQuestion, `${item.id} ${missing.signal} clarificationQuestion`);
  }

  for (const signal of expected.riskSignals ?? []) {
    assert.ok(riskSignals.includes(signal), `${item.id} risk includes ${signal}`);
  }

  for (const signal of expected.missingIncludes ?? []) {
    assert.ok(missingSignals.includes(signal), `${item.id} missing includes ${signal}`);
  }
}

console.log("PASS career-core profile integration contract deterministic checks");
