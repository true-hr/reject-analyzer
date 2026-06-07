import assert from "node:assert/strict";
import { mapControlledCandidateExposureResponse } from "../src/lib/career-core/mapControlledCandidateExposureResponse.js";
import { controlledCandidateExposureResponseCases } from "../src/lib/career-core/__fixtures__/controlledCandidateExposureResponseCases.js";

const FORBIDDEN_FIXTURE_FIELDS = new Set([
  "case" + "Id",
  "expected" + "Regex",
  "fixture" + "Regex",
]);

const FORBIDDEN_COPY = [
  "final" + "Strengths",
  "confirmed" + "Skills",
  "verified" + "Strengths",
  "확정" + " 역량",
  "검증" + " 완료",
  "최종" + " 강점",
  "기업에 바로" + " 공개 가능",
];

const FORBIDDEN_FIELD_PARTS = [
  "final" + "Strength",
  "confirmed" + "Skill",
  "verified" + "Strength",
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

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

function stringify(value) {
  return JSON.stringify(value);
}

function labelsOf(response) {
  return new Set(asArray(response.controlledCandidateResult.exposureLabels));
}

function findCase(id) {
  const item = controlledCandidateExposureResponseCases.find((candidate) => candidate.id === id);
  assert.ok(item, `fixture includes ${id}`);
  return item;
}

function assertNoForbiddenFixtureFields(item) {
  walk(item, (key) => {
    assert.ok(!FORBIDDEN_FIXTURE_FIELDS.has(key), `${item.id} must not use forbidden fixture field ${key}`);
  });
}

function assertNoForbiddenGeneratedFields(response, id) {
  walk(response, (key) => {
    assert.ok(
      FORBIDDEN_FIELD_PARTS.every((part) => !key.includes(part)),
      `${id} must not generate forbidden final field ${key}`
    );
  });
}

function assertNoForbiddenCopy(response, id) {
  const output = stringify({
    status: response.controlledCandidateResult.status,
    displayLabel: response.controlledCandidateResult.displayLabel,
    exposureLabels: response.controlledCandidateResult.exposureLabels,
    mergedMissingEvidence: response.controlledCandidateResult.mergedMissingEvidence,
    exposureMeta: response.controlledCandidateResult.exposureMeta,
  });

  for (const copy of FORBIDDEN_COPY) {
    assert.ok(!output.includes(copy), `${id} must not generate forbidden copy: ${copy}`);
  }
}

function assertCandidateReadOnly(response, id) {
  const result = response.controlledCandidateResult;
  assert.equal(result.status, "candidate_only", `${id} marks controlled result as candidate-only`);
  assert.equal(result.appliedToCareerProfile, false, `${id} never applies candidate to CareerProfile`);
  assert.equal(result.mergeStatus, "read_only_candidate", `${id} uses read-only merge status`);
  assert.notEqual(result.shouldExposeAsFinal, true, `${id} must not expose as final`);
  assert.notEqual(result.finalDisplayAllowed, true, `${id} top-level finalDisplayAllowed must not be true`);
  assert.notEqual(result.exposureMeta.finalDisplayAllowed, true, `${id} meta finalDisplayAllowed must not be true`);
  assert.equal(result.exposureMeta.candidateOnly, true, `${id} meta keeps candidateOnly true`);
}

function assertCareerProfileNotMutated(item, response) {
  const inputProfile = item.input.careerProfile;
  const before = structuredClone(inputProfile);
  mapControlledCandidateExposureResponse(item.input);
  assert.deepEqual(inputProfile, before, `${item.id} does not mutate input careerProfile`);
  assert.deepEqual(response.careerProfile, before, `${item.id} preserves careerProfile shape`);
}

function assertNoAutoMerge(item, response) {
  const beforeStrengths = item.input.careerProfile?.signals?.strengthSignals ?? [];
  const afterStrengths = response.careerProfile?.signals?.strengthSignals ?? [];
  assert.deepEqual(afterStrengths, beforeStrengths, `${item.id} does not auto merge controlled candidates into careerProfile.signals`);
}

assert.ok(Array.isArray(controlledCandidateExposureResponseCases), "fixture exports cases array");
assert.ok(controlledCandidateExposureResponseCases.length >= 8, "fixture includes at least 8 cases");

for (const item of controlledCandidateExposureResponseCases) {
  assert.ok(item.id, "case has id");
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);
  assertNoForbiddenFixtureFields(item);

  const careerProfileBefore = structuredClone(item.input.careerProfile);
  const response = mapControlledCandidateExposureResponse(item.input);

  assert.ok(response.careerProfile, `${item.id} response has careerProfile sibling`);
  assert.ok(response.controlledCandidateResult, `${item.id} response has controlledCandidateResult sibling`);
  assert.deepEqual(item.input.careerProfile, careerProfileBefore, `${item.id} input careerProfile remains unchanged`);
  assertCandidateReadOnly(response, item.id);
  assertCareerProfileNotMutated(item, response);
  assertNoAutoMerge(item, response);
  assertNoForbiddenGeneratedFields(response.controlledCandidateResult, item.id);
  assertNoForbiddenCopy(response, item.id);

  for (const label of asArray(item.expected.requiredLabels)) {
    assert.ok(labelsOf(response).has(label), `${item.id} includes ${label} label`);
  }
}

const candidateOnlyCase = findCase("map_candidate_only_strength");
const candidateOnlyResponse = mapControlledCandidateExposureResponse(candidateOnlyCase.input);
assert.equal(candidateOnlyResponse.controlledCandidateResult.status, "candidate_only", "candidate strength remains candidate-only");
assert.equal(candidateOnlyResponse.controlledCandidateResult.exposureMeta.finalDisplayAllowed, false, "candidate strength final display blocked");
assert.ok(labelsOf(candidateOnlyResponse).has("source_backed"), "candidate strength is source-backed");
assert.ok(labelsOf(candidateOnlyResponse).has("manual_confirmation_required"), "candidate strength requires manual confirmation");

const conflictCase = findCase("map_conflict_detected");
const conflictResponse = mapControlledCandidateExposureResponse(conflictCase.input);
assert.ok(labelsOf(conflictResponse).has("conflict_detected"), "contradicted case includes conflict_detected");
assert.equal(conflictResponse.controlledCandidateResult.exposureMeta.finalDisplayAllowed, false, "conflict final display blocked");
assert.deepEqual(
  conflictResponse.controlledCandidateResult.contradictedSignals,
  conflictCase.input.controlledCandidateResult.contradictedSignals,
  "contradictedSignals are preserved"
);

const missingCase = findCase("map_missing_evidence");
const missingResponse = mapControlledCandidateExposureResponse(missingCase.input);
assert.ok(labelsOf(missingResponse).has("missing_evidence"), "missing evidence case includes missing_evidence");
assert.ok(
  missingResponse.controlledCandidateResult.mergedMissingEvidence.every((item) => item.clarificationQuestion),
  "missing evidence keeps clarificationQuestion"
);
assert.ok(
  missingResponse.controlledCandidateResult.mergedMissingEvidence.every((item) => item.displayGroup === "needs_clarification"),
  "missing evidence uses needs_clarification display group"
);
for (const tone of missingCase.expected.forbiddenTone) {
  assert.ok(!stringify(missingResponse.controlledCandidateResult.mergedMissingEvidence).includes(tone), `missing evidence avoids ${tone} tone`);
}

const invalidCase = findCase("map_invalid_source");
const invalidResponse = mapControlledCandidateExposureResponse(invalidCase.input);
assert.ok(labelsOf(invalidResponse).has("invalid_source"), "invalid candidate case includes invalid_source");
assert.equal(invalidResponse.controlledCandidateResult.mergedStrengthSignals.length, 0, "invalid candidates are not exposed as strengths");

const manualCase = findCase("map_manual_confirmed_still_candidate");
const manualResponse = mapControlledCandidateExposureResponse(manualCase.input);
assert.equal(manualResponse.controlledCandidateResult.status, "candidate_only", "manual-confirmed input still candidate-only");
assert.equal(manualResponse.controlledCandidateResult.exposureMeta.finalDisplayAllowed, false, "manual-confirmed input final display blocked");
assert.ok(
  manualResponse.controlledCandidateResult.mergedStrengthSignals[0].sourceTraces.length >= 2,
  "manual-confirmed input preserves sourceTrace"
);

const apiSiblingCase = findCase("map_api_sibling_shape");
const apiSiblingResponse = mapControlledCandidateExposureResponse(apiSiblingCase.input);
assert.ok(apiSiblingResponse.careerProfile, "API response has careerProfile sibling");
assert.ok(apiSiblingResponse.controlledCandidateResult, "API response has controlledCandidateResult sibling");
assert.deepEqual(apiSiblingResponse.careerProfile.signals.strengthSignals, [], "API sibling response does not auto merge strengths");

const forbiddenCopyCase = findCase("map_forbidden_copy_not_generated");
const forbiddenCopyResponse = mapControlledCandidateExposureResponse(forbiddenCopyCase.input);
for (const copy of forbiddenCopyCase.expected.forbiddenCopy) {
  assert.ok(!stringify(forbiddenCopyResponse.controlledCandidateResult).includes(copy), `mapper does not generate ${copy}`);
}

const emptyCase = findCase("map_empty_candidate_result");
const emptyBefore = structuredClone(emptyCase.input.careerProfile);
const emptyResponse = mapControlledCandidateExposureResponse(emptyCase.input);
assert.ok(emptyCase.expected.allowedStatuses.includes(emptyResponse.controlledCandidateResult.status), "empty candidate result has allowed status");
assert.equal(emptyResponse.controlledCandidateResult.appliedToCareerProfile, false, "empty candidate result is not applied");
assert.deepEqual(emptyCase.input.careerProfile, emptyBefore, "empty candidate result does not mutate careerProfile");

console.log("PASS career-core controlled candidate exposure response mapper deterministic checks");
