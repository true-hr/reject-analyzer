import assert from "node:assert/strict";
import { controlledCandidateApiResponseContractCases } from "../src/lib/career-core/__fixtures__/controlledCandidateApiResponseContractCases.js";

const FORBIDDEN_FIXTURE_FIELDS = new Set([
  "case" + "Id",
  "expected" + "Regex",
  "fixture" + "Regex",
]);

const FORBIDDEN_FINAL_FIELDS = [
  "final" + "Strengths",
  "confirmed" + "Skills",
  "verified" + "Strengths",
];

const FINAL_APPLY_INPUTS = new Set([
  "applyToCareerProfile",
  "publishToCompany",
  "exposeAsFinal",
  "updateCareerProfile",
]);

const STORAGE_WRITE_INPUTS = new Set([
  "writeToDatabase",
  "writeToSupabase",
]);

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

function findCase(id) {
  const item = controlledCandidateApiResponseContractCases.find((candidate) => candidate.id === id);
  assert.ok(item, `fixture includes ${id}`);
  return item;
}

function labelsOf(item) {
  return new Set(asArray(item.expected.response?.controlledCandidateResult?.exposureLabels));
}

function assertNoForbiddenFixtureFields(item) {
  walk(item, (key) => {
    assert.ok(!FORBIDDEN_FIXTURE_FIELDS.has(key), `${item.id} must not use forbidden fixture field ${key}`);
  });
}

function assertNoForbiddenFinalFields(item) {
  walk(item.expected.response, (key) => {
    assert.ok(!FORBIDDEN_FINAL_FIELDS.includes(key), `${item.id} must not expose forbidden final field ${key}`);
  });
}

function hasTrueInput(item, keys) {
  let found = false;
  walk(item.input.request, (key, value) => {
    if (keys.has(key) && value === true) found = true;
  });
  return found;
}

function assertSuccessShape(item) {
  const response = item.expected.response;
  const result = response.controlledCandidateResult;

  assert.equal(item.expected.ok, true, `${item.id} expected ok true`);
  assert.equal(response.ok, true, `${item.id} response ok true`);
  assert.equal(item.expected.mode, "preview_only", `${item.id} expected mode preview_only`);
  assert.equal(response.mode, "preview_only", `${item.id} response mode preview_only`);
  assert.ok(response.careerProfile, `${item.id} includes careerProfile sibling`);
  assert.ok(result, `${item.id} includes controlledCandidateResult sibling`);
  assert.equal(result.status, "candidate_only", `${item.id} controlledCandidateResult.status candidate_only`);
  assert.equal(result.appliedToCareerProfile, false, `${item.id} appliedToCareerProfile false`);
  assert.equal(result.mergeStatus, "read_only_candidate", `${item.id} mergeStatus read_only_candidate`);
  assert.equal(result.exposureMeta.candidateOnly, true, `${item.id} candidateOnly meta true`);
  assert.equal(result.exposureMeta.finalDisplayAllowed, false, `${item.id} finalDisplayAllowed false`);
  assert.notEqual(result.shouldExposeAsFinal, true, `${item.id} shouldExposeAsFinal must not be true`);
  assert.ok(Array.isArray(response.warnings), `${item.id} warnings array`);
  assertNoForbiddenFinalFields(item);
}

function assertFailureShape(item) {
  const response = item.expected.response;

  assert.equal(item.expected.ok, false, `${item.id} expected ok false`);
  assert.equal(response.ok, false, `${item.id} response ok false`);
  assert.ok(response.error, `${item.id} has error`);
  assert.ok(response.error.code, `${item.id} has error.code`);
  assert.ok(typeof response.error.message === "string", `${item.id} has error.message`);
  assert.ok(Array.isArray(response.error.details), `${item.id} has error.details array`);
}

assert.ok(Array.isArray(controlledCandidateApiResponseContractCases), "fixture exports cases array");
assert.ok(controlledCandidateApiResponseContractCases.length >= 8, "fixture includes at least 8 cases");

for (const item of controlledCandidateApiResponseContractCases) {
  assert.ok(item.id, "case has id");
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.input.request && typeof item.input.request === "object", `${item.id} has request input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);
  assert.ok(item.expected.response && typeof item.expected.response === "object", `${item.id} has expected response`);
  assertNoForbiddenFixtureFields(item);

  if (item.expected.ok) {
    assertSuccessShape(item);
  } else {
    assertFailureShape(item);
  }

  if (hasTrueInput(item, FINAL_APPLY_INPUTS)) {
    assert.equal(item.expected.ok, false, `${item.id} final apply input must fail`);
    assert.equal(item.expected.response.error.code, "FORBIDDEN_FINAL_APPLY", `${item.id} final apply error code`);
  }

  if (hasTrueInput(item, STORAGE_WRITE_INPUTS)) {
    assert.equal(item.expected.ok, false, `${item.id} storage write input must fail`);
    assert.ok(
      ["INVALID_INPUT", "FORBIDDEN_STORAGE_WRITE"].includes(item.expected.response.error.code),
      `${item.id} storage write error code`
    );
  }
}

const successCase = findCase("api_preview_success_candidate_only");
assert.equal(successCase.expected.response.ok, true, "success response ok true");
assert.equal(successCase.expected.response.mode, "preview_only", "success mode preview_only");
assert.equal(successCase.expected.response.controlledCandidateResult.status, "candidate_only", "success status candidate_only");
assert.equal(successCase.expected.response.controlledCandidateResult.appliedToCareerProfile, false, "success not applied");

const applyCase = findCase("api_preview_reject_apply_to_career_profile");
assert.equal(applyCase.input.request.options.applyToCareerProfile, true, "apply rejection input present");
assert.equal(applyCase.expected.response.error.code, "FORBIDDEN_FINAL_APPLY", "apply rejection uses FORBIDDEN_FINAL_APPLY");

const dbCase = findCase("api_preview_reject_db_write");
assert.equal(dbCase.input.request.options.writeToDatabase, true, "DB write rejection input present");
assert.ok(["INVALID_INPUT", "FORBIDDEN_STORAGE_WRITE"].includes(dbCase.expected.response.error.code), "DB write rejected");

const unauthenticatedCase = findCase("api_preview_unauthenticated");
assert.equal(unauthenticatedCase.input.session, null, "unauthenticated case has no session");
assert.equal(unauthenticatedCase.expected.response.error.code, "UNAUTHENTICATED", "unauthenticated error code");

const forbiddenResourceCase = findCase("api_preview_forbidden_resource");
assert.notEqual(forbiddenResourceCase.input.session.userId, forbiddenResourceCase.input.request.resumeProfile.ownerUserId, "forbidden resource owner mismatch");
assert.equal(forbiddenResourceCase.expected.response.error.code, "FORBIDDEN_RESOURCE", "forbidden resource error code");

const conflictCase = findCase("api_preview_conflict_response");
assert.ok(labelsOf(conflictCase).has("conflict_detected"), "conflict response includes conflict_detected");
assert.equal(conflictCase.expected.response.controlledCandidateResult.exposureMeta.finalDisplayAllowed, false, "conflict final display blocked");

const missingCase = findCase("api_preview_missing_evidence_response");
assert.ok(labelsOf(missingCase).has("missing_evidence"), "missing response includes missing_evidence");
assert.ok(
  missingCase.expected.response.controlledCandidateResult.mergedMissingEvidence.every((item) => item.clarificationQuestion),
  "missing evidence preserves clarificationQuestion"
);

const forbiddenFinalCase = findCase("api_preview_forbid_final_fields");
for (const field of forbiddenFinalCase.expected.forbiddenFields) {
  let found = false;
  walk(forbiddenFinalCase.expected.response, (key) => {
    if (key === field) found = true;
  });
  assert.equal(found, false, `forbid final fields response omits ${field}`);
}
assert.deepEqual(
  forbiddenFinalCase.expected.response.careerProfile.signals.strengthSignals,
  [],
  "forbid final fields response does not auto merge into careerProfile.signals"
);

console.log("PASS career-core controlled candidate API response contract deterministic checks");
