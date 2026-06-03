import assert from "node:assert/strict";
import {
  classifyEmploymentType,
  getEmploymentTypeMetadata,
} from "../src/lib/career-core/index.js";
import { employmentTypeMatrix } from "../src/lib/career-core/__fixtures__/employmentTypeMatrix.js";
import { expectedEmploymentProfiles } from "../src/lib/career-core/__fixtures__/expectedEmploymentProfiles.js";

const AMBIGUOUS_NORMALIZED_TYPES = new Set(["founder_or_self_employed", "gap"]);

function expectedRiskSignals(expectedProfile) {
  return expectedProfile.expectedCareerProfileImpact.riskSignals;
}

function assertMetadataMatchesExpected(metadata, item, expectedProfile, context) {
  assert.equal(metadata.normalizedEmploymentType, item.normalizedEmploymentType, `${context} normalized`);
  assert.equal(metadata.normalizedEmploymentType, expectedProfile.normalizedEmploymentType, `${context} expected normalized`);
  assert.equal(metadata.countsAsExperience, expectedProfile.countsAsExperience, `${context} countsAsExperience`);
  assert.equal(metadata.countsAsGap, expectedProfile.countsAsGap, `${context} countsAsGap`);
  assert.equal(metadata.countsAsSignal, expectedProfile.countsAsSignal, `${context} countsAsSignal`);
  assert.equal(metadata.experienceWeight, expectedProfile.experienceWeight, `${context} experienceWeight`);
  assert.equal(metadata.shortTenureApplicable, expectedProfile.shortTenureApplicable, `${context} shortTenureApplicable`);
  assert.deepEqual(metadata.riskSignalsPossible, expectedRiskSignals(expectedProfile), `${context} riskSignalsPossible`);
  assert.equal(metadata.metadataAppliedToTimeline, false, `${context} metadataAppliedToTimeline`);
  assert.equal(metadata.metadataAppliedToCareerProfile, false, `${context} metadataAppliedToCareerProfile`);
  assert.ok(Array.isArray(metadata.warnings), `${context} warnings array`);
}

for (const item of employmentTypeMatrix) {
  const expectedProfile = expectedEmploymentProfiles[item.id];
  assert.ok(expectedProfile, `${item.id} expected profile exists`);

  for (const label of item.inputLabels) {
    const classified = classifyEmploymentType(label);
    assert.equal(classified.normalizedEmploymentType, item.normalizedEmploymentType, `${item.id} classifier ${label}`);

    const metadataFromLabel = getEmploymentTypeMetadata(label);
    assertMetadataMatchesExpected(metadataFromLabel, item, expectedProfile, `${item.id} label ${label}`);

    const metadataFromObject = getEmploymentTypeMetadata(classified);
    assertMetadataMatchesExpected(metadataFromObject, item, expectedProfile, `${item.id} classifier object ${label}`);
  }
}

for (const item of employmentTypeMatrix) {
  const directInput = item.normalizedEmploymentType === "gap"
    ? { normalizedEmploymentType: item.normalizedEmploymentType }
    : item.normalizedEmploymentType;
  const metadata = getEmploymentTypeMetadata(directInput);
  assert.equal(metadata.normalizedEmploymentType, item.normalizedEmploymentType, `${item.id} direct normalized`);
  assert.equal(metadata.metadataAppliedToTimeline, false, `${item.id} direct metadataAppliedToTimeline`);
  assert.equal(metadata.metadataAppliedToCareerProfile, false, `${item.id} direct metadataAppliedToCareerProfile`);
  assert.ok(Array.isArray(metadata.warnings), `${item.id} direct warnings array`);

  if (AMBIGUOUS_NORMALIZED_TYPES.has(item.normalizedEmploymentType)) {
    assert.ok(
      metadata.warnings.includes("employment_metadata_variant_ambiguous"),
      `${item.id} direct ambiguous warning`
    );
  }
}

assert.deepEqual(getEmploymentTypeMetadata(""), {
  raw: "",
  normalizedEmploymentType: "unknown",
  metadataVariant: "unknown",
  countsAsExperience: "unknown",
  countsAsGap: "unknown",
  countsAsSignal: "unknown",
  experienceWeight: "unknown",
  shortTenureApplicable: "unknown",
  riskSignalsPossible: ["employment_type_missing"],
  metadataAppliedToTimeline: false,
  metadataAppliedToCareerProfile: false,
  warnings: ["missing_employment_type"],
});

assert.deepEqual(getEmploymentTypeMetadata("분류불가 고용형태"), {
  raw: "분류불가 고용형태",
  normalizedEmploymentType: "unknown",
  metadataVariant: "unknown",
  countsAsExperience: "unknown",
  countsAsGap: "unknown",
  countsAsSignal: "unknown",
  experienceWeight: "unknown",
  shortTenureApplicable: "unknown",
  riskSignalsPossible: ["employment_type_unknown"],
  metadataAppliedToTimeline: false,
  metadataAppliedToCareerProfile: false,
  warnings: ["unknown_employment_type"],
});

console.log("PASS career-core employment metadata deterministic checks");
