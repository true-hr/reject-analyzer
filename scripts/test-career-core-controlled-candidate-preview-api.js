import assert from "node:assert/strict";
import { handleControlledCandidatePreviewApiRequest } from "../src/lib/career-core/mapControlledCandidateExposureResponse.js";

const FORBIDDEN_RESPONSE_FIELDS = new Set([
  "final" + "Strengths",
  "confirmed" + "Skills",
  "verified" + "Strengths",
]);

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

function makeBuildStub(result, calls) {
  return (input) => {
    calls.push(input);
    return result;
  };
}

function assertNoForbiddenResponseFields(response, label) {
  walk(response, (key) => {
    assert.ok(!FORBIDDEN_RESPONSE_FIELDS.has(key), `${label} must not include ${key}`);
  });
}

function assertCandidateOnlySuccess(response) {
  const body = response.body;
  const result = body.controlledCandidateResult;

  assert.equal(response.status, 200, "success returns 200");
  assert.equal(body.ok, true, "success returns ok true");
  assert.equal(body.mode, "preview_only", "success mode is preview_only");
  assert.equal(result.status, "candidate_only", "controlledCandidateResult.status is candidate_only");
  assert.equal(result.appliedToCareerProfile, false, "appliedToCareerProfile is false");
  assert.equal(result.mergeStatus, "read_only_candidate", "mergeStatus is read_only_candidate");
  assert.equal(result.exposureMeta.finalDisplayAllowed, false, "finalDisplayAllowed is false");
  assert.equal(result.exposureMeta.candidateOnly, true, "candidateOnly meta is true");
  assert.ok(Array.isArray(body.warnings), "warnings is an array");
  assertNoForbiddenResponseFields(body, "success response");
}

const sourceTrace = {
  sourceType: "work_record_controlled_candidate",
  sourceField: "workRecords.content",
  sourceRecordId: "work-record-1",
  sourceText: "Grouped repeated VOC and proposed a response standard.",
};

const buildCalls = [];
const success = handleControlledCandidatePreviewApiRequest({
  method: "POST",
  session: { userId: "user-1" },
  body: {
    resumeProfile: {
      signals: {
        strengthSignals: [],
      },
    },
    workRecords: [{ id: "work-record-1", content: "VOC response standard" }],
    options: {
      includeResumeProfileCandidates: true,
      includeWorkRecordCandidates: true,
    },
  },
}, {
  buildMergedControlledCandidateResult: makeBuildStub({
    mergedStrengthSignals: [{
      signal: "customer_voc_structuring",
      evidenceLevel: "explicit_work_record",
      sourceTraces: [sourceTrace],
    }],
    mergedRiskSignals: [],
    mergedMissingEvidence: [],
    contradictedSignals: [],
    invalidCandidates: [],
    sourceSummary: {
      sourceTraceCount: 1,
      sourceBackedSignalCount: 1,
    },
  }, buildCalls),
  createCareerProfile: () => ({
    signals: {
      strengthSignals: [],
      riskSignals: [],
    },
  }),
});

assertCandidateOnlySuccess(success);
assert.equal(buildCalls.length, 1, "success calls candidate builder once");
assert.deepEqual(success.body.careerProfile.signals.strengthSignals, [], "careerProfile.signals is not auto-merged");
assert.equal(success.body.controlledCandidateResult.mergedStrengthSignals.length, 1, "candidate strength stays in controlledCandidateResult");

const getCalls = [];
const getResponse = handleControlledCandidatePreviewApiRequest({
  method: "GET",
  session: { userId: "user-1" },
  body: {},
}, {
  buildMergedControlledCandidateResult: makeBuildStub({}, getCalls),
});
assert.equal(getResponse.status, 405, "GET returns 405");
assert.equal(getResponse.body.error.code, "METHOD_NOT_ALLOWED", "GET returns METHOD_NOT_ALLOWED");
assert.equal(getCalls.length, 0, "GET does not call candidate builder");

const unauthenticatedCalls = [];
const unauthenticatedResponse = handleControlledCandidatePreviewApiRequest({
  method: "POST",
  session: null,
  body: {},
}, {
  buildMergedControlledCandidateResult: makeBuildStub({}, unauthenticatedCalls),
});
assert.equal(unauthenticatedResponse.status, 401, "missing session returns 401");
assert.equal(unauthenticatedResponse.body.error.code, "UNAUTHENTICATED", "missing session returns UNAUTHENTICATED");
assert.equal(unauthenticatedCalls.length, 0, "missing session does not call candidate builder");

const finalApplyCalls = [];
const finalApplyResponse = handleControlledCandidatePreviewApiRequest({
  method: "POST",
  session: { userId: "user-1" },
  body: {
    options: {
      applyToCareerProfile: true,
    },
  },
}, {
  buildMergedControlledCandidateResult: makeBuildStub({}, finalApplyCalls),
});
assert.equal(finalApplyResponse.status, 400, "applyToCareerProfile returns 400");
assert.equal(finalApplyResponse.body.error.code, "FORBIDDEN_FINAL_APPLY", "applyToCareerProfile returns FORBIDDEN_FINAL_APPLY");
assert.equal(finalApplyCalls.length, 0, "applyToCareerProfile does not call candidate builder");

for (const field of ["writeToDatabase", "writeToSupabase"]) {
  const storageCalls = [];
  const storageResponse = handleControlledCandidatePreviewApiRequest({
    method: "POST",
    session: { userId: "user-1" },
    body: {
      options: {
        [field]: true,
      },
    },
  }, {
    buildMergedControlledCandidateResult: makeBuildStub({}, storageCalls),
  });
  assert.equal(storageResponse.status, 400, `${field} returns 400`);
  assert.equal(storageResponse.body.error.code, "FORBIDDEN_STORAGE_WRITE", `${field} returns FORBIDDEN_STORAGE_WRITE`);
  assert.equal(storageCalls.length, 0, `${field} does not call candidate builder`);
}

for (const field of FORBIDDEN_RESPONSE_FIELDS) {
  const finalFieldResponse = handleControlledCandidatePreviewApiRequest({
    method: "POST",
    session: { userId: "user-1" },
    body: {
      [field]: [],
    },
  });
  assert.equal(finalFieldResponse.status, 400, `${field} input returns 400`);
  assert.equal(finalFieldResponse.body.error.code, "INVALID_INPUT", `${field} input returns INVALID_INPUT`);
}

console.log("PASS career-core controlled candidate preview API deterministic checks");
