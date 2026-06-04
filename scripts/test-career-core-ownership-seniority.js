import assert from "node:assert/strict";
import { classifyOwnershipSeniority } from "../src/lib/career-core/index.js";
import { ownershipSeniorityCases } from "../src/lib/career-core/__fixtures__/ownershipSeniorityCases.js";
import { expectedOwnershipSeniorityProfiles } from "../src/lib/career-core/__fixtures__/expectedOwnershipSeniorityProfiles.js";

for (const item of ownershipSeniorityCases) {
  const expected = expectedOwnershipSeniorityProfiles[item.id];
  assert.ok(expected, `${item.id} expected profile exists`);

  const actual = classifyOwnershipSeniority(item.resumeInput);

  assert.equal(actual.artifactType, expected.artifactType, `${item.id} artifactType`);
  assert.equal(actual.roleFamily, expected.roleFamily, `${item.id} roleFamily`);
  assert.equal(actual.seniorityLevel, expected.seniorityLevel, `${item.id} seniorityLevel`);
  assert.equal(actual.ownershipLevel, expected.ownershipLevel, `${item.id} ownershipLevel`);
  assert.equal(actual.judgmentLevel, expected.judgmentLevel, `${item.id} judgmentLevel`);
  assert.equal(actual.domainDepth, expected.domainDepth, `${item.id} domainDepth`);
  assert.equal(actual.evidenceLevel, expected.evidenceLevel, `${item.id} evidenceLevel`);
  assert.deepEqual(actual.shouldNotInfer, expected.shouldNotInfer, `${item.id} shouldNotInfer`);
  assert.deepEqual(actual.strengthSignals, expected.strengthSignals, `${item.id} strengthSignals`);
  assert.deepEqual(actual.riskSignals, expected.riskSignals, `${item.id} riskSignals`);
  assert.equal(actual.explanationBoundary, expected.explanationBoundary, `${item.id} explanationBoundary`);
  assert.equal(actual.confidence, expected.confidence, `${item.id} confidence`);
  assert.equal(actual.appliedToCareerProfile, false, `${item.id} appliedToCareerProfile`);
  assert.ok(actual.evidence, `${item.id} evidence exists`);
}

const ambiguous = classifyOwnershipSeniority({
  roleTitle: "사무보조",
  artifact: "엑셀 자료 정리",
  description: ["엑셀로 자료를 정리", "요청받은 파일을 취합"],
});

assert.equal(ambiguous.roleFamily, "unknown_admin_support", "ambiguous roleFamily");
assert.equal(ambiguous.evidenceLevel, "inferred_weak", "ambiguous evidenceLevel");
assert.ok(ambiguous.shouldNotInfer.includes("accounting_finance"), "ambiguous should not infer accounting");
assert.ok(ambiguous.shouldNotInfer.includes("senior_ownership"), "ambiguous should not infer senior ownership");
assert.equal(ambiguous.confidence, "low", "ambiguous confidence");

console.log("PASS career-core ownership seniority deterministic checks");
