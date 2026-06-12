import assert from "node:assert/strict";
import { controlledCandidateRouteAuthDiscoveryCases } from "../src/lib/career-core/__fixtures__/controlledCandidateRouteAuthDiscoveryCases.js";

const FORBIDDEN_FIXTURE_FIELDS = new Set([
  "caseId",
  "expectedRegex",
  "fixtureRegex",
]);

const REQUIRED_CASE_IDS = new Set([
  "route_surface_existing_api_found",
  "route_surface_missing_public_api",
  "auth_helper_found",
  "auth_helper_missing",
  "ownership_read_pattern_found",
  "ownership_helper_missing_for_persisted_ids",
  "guard_blocks_route_surface",
  "ready_for_public_route_only_when_all_gates_pass",
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
  const item = controlledCandidateRouteAuthDiscoveryCases.find((candidate) => candidate.id === id);
  assert.ok(item, `fixture includes ${id}`);
  return item;
}

function assertNoForbiddenFixtureFields(item) {
  walk(item, (key) => {
    assert.ok(!FORBIDDEN_FIXTURE_FIELDS.has(key), `${item.id} must not use forbidden fixture field ${key}`);
  });
}

function assertNoRouteImplementationExpectation(item) {
  walk(item.expected, (key, value, path) => {
    const location = [...path, key].join(".");
    assert.notEqual(key, "routeFile", `${item.id} must not require an actual route file at ${location}`);
    assert.notEqual(key, "apiRouteFile", `${item.id} must not require an actual api route file at ${location}`);
    assert.notEqual(key, "srcApiRoute", `${item.id} must not require src/api implementation at ${location}`);

    if (typeof value !== "string") return;
    assert.ok(!/^src\/api\//.test(value), `${item.id} must not require src/api implementation at ${location}`);
    assert.ok(!/^api\/.*\.(js|ts|jsx|tsx)$/.test(value), `${item.id} must not require an actual api route file at ${location}`);
    assert.ok(!/^pages\/api\//.test(value), `${item.id} must not require pages/api implementation at ${location}`);
    assert.ok(!/^app\/api\//.test(value), `${item.id} must not require app/api implementation at ${location}`);
    assert.ok(!/^supabase\/functions\//.test(value), `${item.id} must not require Supabase function implementation at ${location}`);
  });
}

function assertReadyCase(item) {
  if (item.expected.shouldImplementNow !== true) return;

  assert.equal(item.expected.routeReady, true, `${item.id} routeReady must be true`);
  assert.equal(item.expected.authReady, true, `${item.id} authReady must be true`);
  assert.equal(item.expected.ownershipReady, true, `${item.id} ownershipReady must be true`);
  assert.equal(item.expected.guardReady, true, `${item.id} guardReady must be true`);
  assert.equal(item.input.writesAllowedForPreview, false, `${item.id} preview writes must be forbidden`);
  assert.equal(item.input.candidateOnlyResponseMaintained, true, `${item.id} candidate-only response must be maintained`);
}

assert.ok(Array.isArray(controlledCandidateRouteAuthDiscoveryCases), "fixture exports cases array");
assert.ok(controlledCandidateRouteAuthDiscoveryCases.length >= 8, "fixture includes at least 8 cases");

const seenIds = new Set();
for (const item of controlledCandidateRouteAuthDiscoveryCases) {
  assert.ok(item.id, "case has id");
  assert.equal(seenIds.has(item.id), false, `duplicate case id ${item.id}`);
  seenIds.add(item.id);
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);
  assert.equal(typeof item.expected.shouldImplementNow, "boolean", `${item.id} declares shouldImplementNow`);
  assertNoForbiddenFixtureFields(item);
  assertNoRouteImplementationExpectation(item);
  assertReadyCase(item);
}

for (const id of REQUIRED_CASE_IDS) {
  assert.ok(seenIds.has(id), `fixture includes required case ${id}`);
}

const existingApiCase = findCase("route_surface_existing_api_found");
assert.equal(existingApiCase.input.surface, "api/**", "existing API case uses root api surface");
assert.equal(existingApiCase.input.exists, true, "existing API surface exists");
assert.equal(existingApiCase.input.usedForRuntime, true, "existing API surface is runtime-used");
assert.equal(existingApiCase.expected.requiresAuthDiscovery, true, "existing API route requires auth discovery");

const missingPublicApiCase = findCase("route_surface_missing_public_api");
assert.equal(missingPublicApiCase.input.exists, false, "missing public API case has no surface");
assert.equal(missingPublicApiCase.expected.shouldImplementNow, false, "missing route surface blocks implementation");

const authFoundCase = findCase("auth_helper_found");
assert.equal(authFoundCase.expected.authReady, true, "auth helper found is authReady");
assert.ok(authFoundCase.input.helpers.includes("verifySupabaseAccessToken"), "auth helper includes server token verification");

const authMissingCase = findCase("auth_helper_missing");
assert.equal(authMissingCase.expected.authReady, false, "missing auth helper is not authReady");
assert.equal(authMissingCase.expected.shouldImplementNow, false, "missing auth helper blocks implementation");

const ownershipFoundCase = findCase("ownership_read_pattern_found");
assert.equal(ownershipFoundCase.expected.ownershipReady, true, "ownership read pattern found is ownershipReady");
assert.equal(ownershipFoundCase.expected.readOnlyOnly, true, "ownership pattern is read-only for preview");
assert.equal(ownershipFoundCase.input.writesAllowedForPreview, false, "writes forbidden for preview");

const ownershipMissingCase = findCase("ownership_helper_missing_for_persisted_ids");
assert.equal(ownershipMissingCase.expected.ownershipReady, false, "missing persisted id ownership helper is not ownershipReady");
assert.equal(ownershipMissingCase.expected.requiresOwnershipHelper, true, "persisted ids require ownership helper");
assert.equal(ownershipMissingCase.expected.shouldImplementNow, false, "missing ownership helper blocks implementation");

const guardCase = findCase("guard_blocks_route_surface");
assert.equal(guardCase.input.protectedByGuard, true, "guard blocks route surface");
assert.equal(guardCase.input.allowRuntimeCanPermitRoute, false, "--allow-runtime cannot permit route surface");
assert.equal(guardCase.expected.requiresGuardUpdate, true, "guard-blocked route requires guard update");
assert.equal(guardCase.expected.shouldImplementNow, false, "guard block prevents implementation");

const readyCase = findCase("ready_for_public_route_only_when_all_gates_pass");
assert.equal(readyCase.expected.shouldImplementNow, true, "ready case can implement only when all gates pass");
assertReadyCase(readyCase);

console.log("PASS career-core controlled candidate route auth discovery deterministic checks");
