import assert from "node:assert/strict";
import { classifyEmploymentType } from "../src/lib/career-core/index.js";
import { employmentTypeMatrix } from "../src/lib/career-core/__fixtures__/employmentTypeMatrix.js";
import { expectedEmploymentProfiles } from "../src/lib/career-core/__fixtures__/expectedEmploymentProfiles.js";

for (const item of employmentTypeMatrix) {
  const expectedProfile = expectedEmploymentProfiles[item.id];
  assert.ok(expectedProfile, `${item.id} expected profile exists`);
  assert.equal(
    item.normalizedEmploymentType,
    expectedProfile.normalizedEmploymentType,
    `${item.id} fixture and expected profile normalized type`
  );

  for (const label of item.inputLabels) {
    const actual = classifyEmploymentType(label);
    assert.equal(
      actual.normalizedEmploymentType,
      item.normalizedEmploymentType,
      `${item.id} label ${label}`
    );
    assert.equal(actual.confidence, "high", `${item.id} label ${label} confidence`);
    assert.deepEqual(actual.warnings, [], `${item.id} label ${label} warnings`);
  }
}

assert.deepEqual(classifyEmploymentType(""), {
  raw: "",
  normalizedEmploymentType: "unknown",
  confidence: "low",
  matchedLabel: null,
  warnings: ["missing_employment_type"],
});

assert.deepEqual(classifyEmploymentType("분류불가 고용형태"), {
  raw: "분류불가 고용형태",
  normalizedEmploymentType: "unknown",
  confidence: "low",
  matchedLabel: null,
  warnings: ["unknown_employment_type"],
});

console.log("PASS career-core employment type classifier deterministic checks");
