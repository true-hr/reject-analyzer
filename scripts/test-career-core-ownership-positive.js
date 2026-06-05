import assert from "node:assert/strict";
import { classifyOwnershipSeniority } from "../src/lib/career-core/index.js";
import { ownershipPositiveCases } from "../src/lib/career-core/__fixtures__/ownershipPositiveCases.js";
import { ownershipDomainPrecisionCases } from "../src/lib/career-core/__fixtures__/ownershipDomainPrecisionCases.js";

function assertEqualOrOneOf(actual, expected, expectedOneOf, context) {
  if (expectedOneOf) {
    assert.ok(expectedOneOf.includes(actual), `${context} oneOf ${expectedOneOf.join(", ")}`);
    return;
  }
  assert.equal(actual, expected, context);
}

function assertIncludesAll(actual, expected, context) {
  for (const item of expected ?? []) {
    assert.ok(actual.includes(item), `${context} includes ${item}`);
  }
}

function assertExcludesAll(actual, expected, context) {
  for (const item of expected ?? []) {
    assert.ok(!actual.includes(item), `${context} excludes ${item}`);
  }
}

for (const item of ownershipPositiveCases) {
  const actual = classifyOwnershipSeniority(item.resumeInput);
  const expected = item.expected;

  assertEqualOrOneOf(actual.roleFamily, expected.roleFamily, expected.roleFamilyOneOf, `${item.id} roleFamily`);
  assertEqualOrOneOf(actual.ownershipLevel, expected.ownershipLevel, expected.ownershipLevelOneOf, `${item.id} ownershipLevel`);
  assertEqualOrOneOf(actual.judgmentLevel, expected.judgmentLevel, expected.judgmentLevelOneOf, `${item.id} judgmentLevel`);
  assertEqualOrOneOf(actual.seniorityLevel, expected.seniorityLevel, expected.seniorityLevelOneOf, `${item.id} seniorityLevel`);
  if (expected.domainDepth) {
    assert.equal(actual.domainDepth, expected.domainDepth, `${item.id} domainDepth`);
  }
  if (expected.confidence) {
    assert.equal(actual.confidence, expected.confidence, `${item.id} confidence`);
  }
  assert.equal(actual.evidenceLevel, "explicit", `${item.id} evidenceLevel`);
  assertIncludesAll(actual.strengthSignals, expected.strengthSignalsIncludes, `${item.id} strengthSignals`);
  assertExcludesAll(actual.shouldNotInfer, expected.shouldNotInferExcludes, `${item.id} shouldNotInfer`);
  assert.equal(actual.appliedToCareerProfile, false, `${item.id} appliedToCareerProfile`);
}

for (const item of ownershipDomainPrecisionCases) {
  const actual = classifyOwnershipSeniority(item.resumeInput);

  assert.equal(actual.roleFamily, "unknown_admin_support", `${item.id} negative roleFamily preserved`);
  assert.equal(actual.evidenceLevel, "inferred_weak", `${item.id} negative evidenceLevel preserved`);
}

console.log("PASS career-core ownership positive deterministic checks");
