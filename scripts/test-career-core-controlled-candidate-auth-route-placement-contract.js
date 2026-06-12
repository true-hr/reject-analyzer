import assert from "node:assert/strict";
import { controlledCandidateAuthRoutePlacementContractCases } from "../src/lib/career-core/__fixtures__/controlledCandidateAuthRoutePlacementContractCases.js";

const FORBIDDEN_FIXTURE_FIELDS = new Set([
  "caseId",
  "expectedRegex",
  "fixtureRegex",
]);

const REQUIRED_CASE_IDS = new Set([
  "auth_route_requires_session",
  "auth_route_accepts_session_user_id",
  "auth_route_accepts_session_user_object_id",
  "ownership_rejects_work_record_other_user",
  "ownership_rejects_resume_profile_other_user",
  "ownership_rejects_manual_candidate_other_user",
  "persisted_resource_id_requires_ownership_helper",
  "read_only_preview_forbids_writes",
]);

const REQUIRED_FORBIDDEN_WRITES = new Set([
  "writeToDatabase",
  "writeToSupabase",
  "manualConfirmationSave",
  "previewResultSave",
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

function findCase(id) {
  const item = controlledCandidateAuthRoutePlacementContractCases.find((candidate) => candidate.id === id);
  assert.ok(item, `fixture includes ${id}`);
  return item;
}

function assertNoForbiddenFixtureFields(item) {
  walk(item, (key) => {
    assert.ok(!FORBIDDEN_FIXTURE_FIELDS.has(key), `${item.id} must not use forbidden fixture field ${key}`);
  });
}

function assertNoSrcApiRouteImplementationExpectation(item) {
  walk(item.expected, (key, value, path) => {
    const location = [...path, key].join(".");
    assert.notEqual(value, "src/api", `${item.id} must not imply src/api route implementation at ${location}`);
    assert.notEqual(value, "src/api/**", `${item.id} must not imply src/api route implementation at ${location}`);
    assert.notEqual(value, "/api/career-core/controlled-candidates/preview", `${item.id} must not claim public route implementation at ${location}`);
    assert.notEqual(key, "srcApiRoute", `${item.id} must not include srcApiRoute expectation`);
    assert.notEqual(key, "apiRouteFile", `${item.id} must not include apiRouteFile expectation`);
  });
}

function assertPublicRouteGate(item) {
  if (item.expected.shouldCreatePublicRoute !== true) return;

  const preconditions = item.expected.implementationPreconditions ?? {};
  assert.equal(preconditions.routePlacementConfirmed, true, `${item.id} route placement must be confirmed before route creation`);
  assert.equal(preconditions.authSessionHelperConfirmed, true, `${item.id} auth/session helper must be confirmed before route creation`);
  assert.equal(preconditions.ownershipReadHelperConfirmed, true, `${item.id} ownership helper must be confirmed before route creation`);
}

function assertForbiddenResource(item) {
  assert.equal(item.expected.ok, false, `${item.id} must fail`);
  assert.equal(item.expected.errorCode, "FORBIDDEN_RESOURCE", `${item.id} must use FORBIDDEN_RESOURCE`);
  assert.equal(item.expected.shouldCreatePublicRoute, false, `${item.id} must not create public route`);
}

assert.ok(Array.isArray(controlledCandidateAuthRoutePlacementContractCases), "fixture exports cases array");
assert.ok(controlledCandidateAuthRoutePlacementContractCases.length >= 8, "fixture includes at least 8 cases");

const seenIds = new Set();
for (const item of controlledCandidateAuthRoutePlacementContractCases) {
  assert.ok(item.id, "case has id");
  assert.equal(seenIds.has(item.id), false, `duplicate case id ${item.id}`);
  seenIds.add(item.id);
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);
  assert.ok(item.input.request && typeof item.input.request === "object", `${item.id} has request input`);
  assert.equal(typeof item.expected.shouldCreatePublicRoute, "boolean", `${item.id} declares public route creation gate`);
  assertNoForbiddenFixtureFields(item);
  assertNoSrcApiRouteImplementationExpectation(item);
  assertPublicRouteGate(item);
}

for (const id of REQUIRED_CASE_IDS) {
  assert.ok(seenIds.has(id), `fixture includes required case ${id}`);
}

const noSessionCase = findCase("auth_route_requires_session");
assert.equal(noSessionCase.input.request.session, null, "sessionless case has null session");
assert.equal(noSessionCase.expected.ok, false, "sessionless case fails");
assert.equal(noSessionCase.expected.errorCode, "UNAUTHENTICATED", "sessionless case uses UNAUTHENTICATED");
assert.equal(noSessionCase.expected.error.code, "UNAUTHENTICATED", "sessionless error contract code");
assert.equal(noSessionCase.expected.error.message, "Authentication is required.", "sessionless error contract message");
assert.deepEqual(noSessionCase.expected.error.details, [], "sessionless error details array");
assert.equal(noSessionCase.expected.shouldCreatePublicRoute, false, "sessionless route creation blocked");

const sessionUserIdCase = findCase("auth_route_accepts_session_user_id");
assert.equal(sessionUserIdCase.input.request.session.userId, "user-1", "session.userId case input present");
assert.equal(sessionUserIdCase.expected.authPreconditionMet, true, "session.userId satisfies auth precondition");
assert.equal(sessionUserIdCase.expected.sessionUserIdSource, "session.userId", "session.userId source fixed");

const sessionUserObjectCase = findCase("auth_route_accepts_session_user_object_id");
assert.equal(sessionUserObjectCase.input.request.session.user.id, "user-1", "session.user.id case input present");
assert.equal(sessionUserObjectCase.expected.authPreconditionMet, true, "session.user.id satisfies auth precondition");
assert.equal(sessionUserObjectCase.expected.sessionUserIdSource, "session.user.id", "session.user.id source fixed");

const workRecordOtherUserCase = findCase("ownership_rejects_work_record_other_user");
assert.notEqual(
  workRecordOtherUserCase.input.request.session.userId,
  workRecordOtherUserCase.input.request.workRecords[0].userId,
  "work record owner differs from session user"
);
assertForbiddenResource(workRecordOtherUserCase);

const resumeProfileOtherUserCase = findCase("ownership_rejects_resume_profile_other_user");
assert.notEqual(
  resumeProfileOtherUserCase.input.request.session.userId,
  resumeProfileOtherUserCase.input.request.resumeProfile.userId,
  "resume profile owner differs from session user"
);
assertForbiddenResource(resumeProfileOtherUserCase);

const manualCandidateOtherUserCase = findCase("ownership_rejects_manual_candidate_other_user");
assert.notEqual(
  manualCandidateOtherUserCase.input.request.session.userId,
  manualCandidateOtherUserCase.input.request.manualConfirmedCandidates.userId,
  "manual candidate owner differs from session user"
);
assertForbiddenResource(manualCandidateOtherUserCase);

const persistedIdCase = findCase("persisted_resource_id_requires_ownership_helper");
assert.ok(persistedIdCase.input.request.resumeProfileId, "persisted id case has resumeProfileId");
assert.ok(Array.isArray(persistedIdCase.input.request.workRecordIds), "persisted id case has workRecordIds");
assert.equal(persistedIdCase.expected.ownershipHelperRequired, true, "persisted ids require ownership helper");
assert.equal(persistedIdCase.expected.implementationBlocked, true, "persisted ids block implementation without helper");
assert.equal(persistedIdCase.expected.idBasedFetchAllowedInThisBatch, false, "id-based fetch not implemented in this batch");
assert.equal(persistedIdCase.expected.errorCode, "FORBIDDEN_RESOURCE", "persisted id helper absence maps to FORBIDDEN_RESOURCE");

const readOnlyCase = findCase("read_only_preview_forbids_writes");
assert.equal(readOnlyCase.expected.readOnlyPreview, true, "read-only preview case marked read-only");
assert.ok(Array.isArray(readOnlyCase.expected.allowedReads), "read-only case includes allowed reads");
assert.ok(Array.isArray(readOnlyCase.expected.forbiddenWrites), "read-only case includes forbidden writes");
const forbiddenWrites = new Set(readOnlyCase.expected.forbiddenWrites);
for (const write of REQUIRED_FORBIDDEN_WRITES) {
  assert.ok(forbiddenWrites.has(write), `read-only case forbids ${write}`);
}

console.log("PASS career-core controlled candidate auth route placement contract deterministic checks");
