import assert from "node:assert/strict";
import { controlledCandidateExposureContractCases } from "../src/lib/career-core/__fixtures__/controlledCandidateExposureContractCases.js";

const ALLOWED_STATUSES = new Set([
  "candidate_only",
  "needs_review",
  "conflict_detected",
  "missing_evidence",
  "invalid_source",
]);

const FORBIDDEN_FIXTURE_FIELDS = new Set([
  "caseId",
  "expectedRegex",
  "fixtureRegex",
]);

const FINAL_FORBIDDEN_TERMS = [
  "final",
  "confirmed",
  "verified",
  "확정",
  "최종",
  "검증 완료",
];

function walk(value, visitor, path = []) {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, [...path, index]));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    visitor(key, child, path);
    walk(child, visitor, [...path, key]);
  }
}

function findCase(id) {
  const item = controlledCandidateExposureContractCases.find((candidate) => candidate.id === id);
  assert.ok(item, `fixture includes ${id}`);
  return item;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function labelsOf(item) {
  return new Set(asArray(item.expected.requiredLabels));
}

function hasFinalForbiddenTerm(item) {
  const labels = asArray(item.expected.forbiddenLabels).map((label) => String(label).toLowerCase());
  return FINAL_FORBIDDEN_TERMS.some((term) => labels.some((label) => label.includes(term.toLowerCase())));
}

function assertNoForbiddenFixtureFields(item) {
  walk(item, (key) => {
    assert.ok(!FORBIDDEN_FIXTURE_FIELDS.has(key), `${item.id} must not use ${key}`);
  });
}

function assertNeverFinalExposure(item) {
  assert.notEqual(item.expected.shouldExposeAsFinal, true, `${item.id} must not expose as final`);
  walk(item, (key, value, path) => {
    if (key === "appliedToCareerProfile" || key === "applyToCareerProfile") {
      assert.notEqual(value, true, `${item.id} ${[...path, key].join(".")} must not be true`);
    }
  });
}

function assertClarificationQuestions(items, context) {
  assert.ok(items.length > 0, `${context} has items`);
  for (const item of items) {
    assert.ok(String(item.clarificationQuestion ?? "").trim(), `${context} ${item.signal ?? "item"} has clarificationQuestion`);
  }
}

assert.ok(Array.isArray(controlledCandidateExposureContractCases), "fixture exports cases array");
assert.ok(controlledCandidateExposureContractCases.length >= 8, "fixture includes at least 8 cases");

for (const item of controlledCandidateExposureContractCases) {
  assert.ok(item.id, "case has id");
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);
  assertNoForbiddenFixtureFields(item);
  assertNeverFinalExposure(item);

  assert.ok(ALLOWED_STATUSES.has(item.expected.status), `${item.id} has allowed status`);
  assert.ok(asArray(item.expected.requiredLabels).length > 0, `${item.id} has requiredLabels`);
  assert.ok(asArray(item.expected.forbiddenLabels).length > 0, `${item.id} has forbiddenLabels`);
  assert.ok(hasFinalForbiddenTerm(item), `${item.id} forbiddenLabels include final/confirmed/verified family`);
}

const candidateOnlyCase = findCase("expose_candidate_only_strength");
assert.equal(candidateOnlyCase.expected.status, "candidate_only", "candidate-only strength status");
assert.ok(labelsOf(candidateOnlyCase).has("manual_confirmation_required"), "candidate-only requires manual confirmation label");
assert.equal(candidateOnlyCase.expected.shouldExposeAsFinal, false, "candidate-only not final");

const sourceBackedCase = findCase("expose_source_backed_manual_pending");
assert.ok(labelsOf(sourceBackedCase).has("source_backed"), "source-backed label required");
assert.ok(labelsOf(sourceBackedCase).has("needs_review"), "source-backed needs review");
assert.ok(sourceBackedCase.input.controlledCandidateResult.mergedStrengthSignals[0].sourceTraces.length > 0, "source-backed preserves sourceTrace");
assert.ok(sourceBackedCase.expected.forbiddenCopy.length > 0, "source-backed has forbidden final copy");

const contradictedCase = findCase("expose_contradicted_signal_conflict");
assert.equal(contradictedCase.expected.status, "conflict_detected", "contradicted status");
assert.ok(labelsOf(contradictedCase).has("conflict_detected"), "contradicted requires conflict_detected");
assertClarificationQuestions(contradictedCase.input.controlledCandidateResult.contradictedSignals, "contradictedSignals");
assertClarificationQuestions(contradictedCase.input.controlledCandidateResult.mergedRiskSignals, "riskSignals");

const missingCase = findCase("expose_missing_evidence_as_question");
assert.equal(missingCase.expected.status, "missing_evidence", "missing evidence status");
assert.ok(labelsOf(missingCase).has("missing_evidence"), "missing evidence label");
assertClarificationQuestions(missingCase.input.controlledCandidateResult.mergedMissingEvidence, "mergedMissingEvidence");
assert.equal(missingCase.expected.displayTone, "additional_confirmation_needed", "missing evidence is additional confirmation");

const invalidCase = findCase("expose_invalid_source_blocked");
assert.equal(invalidCase.expected.status, "invalid_source", "invalid source status");
assert.ok(labelsOf(invalidCase).has("invalid_source"), "invalid source label");
assert.ok(invalidCase.input.controlledCandidateResult.invalidCandidates.length > 0, "invalid candidates present");
assert.equal(invalidCase.expected.shouldExposeStrengthCandidate, false, "invalid source blocks strength exposure");

const manualCase = findCase("expose_manual_confirmed_still_candidate");
assert.equal(manualCase.expected.status, "candidate_only", "manual confirmed still candidate");
assert.equal(manualCase.expected.shouldApplyToCareerProfile, false, "manual confirmed does not apply");
assert.equal(manualCase.expected.shouldPreserveSourceTrace, true, "manual confirmed preserves source trace");
assert.equal(manualCase.expected.currentBatchScopeOnly, true, "manual final apply block is scoped to current batch");
assert.equal(
  manualCase.expected.finalApplyMayBeDefinedInFutureWhenContractsComplete,
  true,
  "manual final apply can be defined in a future complete contract"
);
assert.ok(manualCase.input.controlledCandidateResult.mergedStrengthSignals[0].sourceTraces.length >= 2, "manual case preserves manual and source traces");

const apiSiblingCase = findCase("expose_api_response_sibling_result");
assert.ok(apiSiblingCase.input.apiResponseShape.careerProfile, "API shape has careerProfile");
assert.ok(apiSiblingCase.input.apiResponseShape.controlledCandidateResult, "API shape has controlledCandidateResult sibling");
assert.equal(apiSiblingCase.expected.requiresSiblingControlledCandidateResult, true, "API requires sibling controlledCandidateResult");
assert.equal(apiSiblingCase.expected.shouldAutoMergeIntoCareerProfileSignals, false, "API forbids careerProfile.signals auto merge");
assert.deepEqual(apiSiblingCase.input.apiResponseShape.careerProfile.signals.strengthSignals, [], "API does not auto merge into strengthSignals");

const uiCopyCase = findCase("expose_forbid_final_strength_copy");
assert.ok(Array.isArray(uiCopyCase.expected.forbiddenCopy), "UI copy case has forbiddenCopy");
assert.ok(uiCopyCase.expected.forbiddenCopy.length >= 5, "UI copy case includes forbidden copy list");
assert.ok(uiCopyCase.expected.forbiddenCopy.some((copy) => copy.includes("확정")), "UI copy forbids 확정 family");
assert.ok(uiCopyCase.expected.forbiddenCopy.some((copy) => copy.includes("최종")), "UI copy forbids 최종 family");
assert.ok(uiCopyCase.expected.forbiddenCopy.some((copy) => copy.includes("검증 완료")), "UI copy forbids 검증 완료 family");

console.log("PASS career-core controlled candidate exposure contract deterministic checks");
