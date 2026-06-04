import assert from "node:assert/strict";
import { classifyOwnershipSeniority } from "../src/lib/career-core/index.js";
import { ownershipSeniorityCases } from "../src/lib/career-core/__fixtures__/ownershipSeniorityCases.js";
import { expectedOwnershipSeniorityProfiles } from "../src/lib/career-core/__fixtures__/expectedOwnershipSeniorityProfiles.js";
import { ownershipDomainPrecisionCases } from "../src/lib/career-core/__fixtures__/ownershipDomainPrecisionCases.js";

function assertIncludesAll(actual, expected, context) {
  for (const item of expected ?? []) {
    assert.ok(actual.includes(item), `${context} includes ${item}`);
  }
}

for (const item of ownershipSeniorityCases) {
  const expected = expectedOwnershipSeniorityProfiles[item.id];
  assert.ok(expected, `${item.id} expected profile exists`);
  const actual = classifyOwnershipSeniority(item.resumeInput);

  assert.equal(actual.roleFamily, expected.roleFamily, `${item.id} roleFamily baseline preserved`);
  assert.equal(actual.ownershipLevel, expected.ownershipLevel, `${item.id} ownershipLevel baseline preserved`);
  assert.equal(actual.judgmentLevel, expected.judgmentLevel, `${item.id} judgmentLevel baseline preserved`);
  assert.equal(actual.seniorityLevel, expected.seniorityLevel, `${item.id} seniorityLevel baseline preserved`);
  assert.equal(actual.evidenceLevel, expected.evidenceLevel, `${item.id} evidenceLevel baseline preserved`);
  assert.deepEqual(actual.shouldNotInfer, expected.shouldNotInfer, `${item.id} shouldNotInfer baseline preserved`);
}

for (const item of ownershipDomainPrecisionCases) {
  const actual = classifyOwnershipSeniority(item.resumeInput);
  const expected = item.expected;

  assert.equal(actual.roleFamily, expected.roleFamily, `${item.id} roleFamily`);
  assert.equal(actual.ownershipLevel, expected.ownershipLevel, `${item.id} ownershipLevel`);
  assert.equal(actual.judgmentLevel, expected.judgmentLevel, `${item.id} judgmentLevel`);
  assert.equal(actual.seniorityLevel, expected.seniorityLevel, `${item.id} seniorityLevel`);
  assert.equal(actual.evidenceLevel, expected.evidenceLevel, `${item.id} evidenceLevel`);
  assertIncludesAll(actual.shouldNotInfer, expected.shouldNotInferIncludes, `${item.id} shouldNotInfer`);
  assert.equal(actual.appliedToCareerProfile, false, `${item.id} appliedToCareerProfile`);
}

console.log("PASS career-core ownership domain precision deterministic checks");
