import assert from "node:assert/strict";
import { buildDateEmploymentTimeline } from "../src/lib/career-core/index.js";
import { dateEmploymentCombinedCases } from "../src/lib/career-core/__fixtures__/dateEmploymentCombinedCases.js";
import { expectedDateEmploymentProfiles } from "../src/lib/career-core/__fixtures__/expectedDateEmploymentProfiles.js";

function findCase(id) {
  const item = dateEmploymentCombinedCases.find((candidate) => candidate.id === id);
  assert.ok(item, `${id} fixture exists`);
  const expected = expectedDateEmploymentProfiles[id];
  assert.ok(expected, `${id} expected profile exists`);
  return { item, expected };
}

function assertTimelineMatchesExpected(id) {
  const { item, expected } = findCase(id);
  const actual = buildDateEmploymentTimeline(item.resumeInput);

  assert.equal(actual.summary.totalCalendarMonths, expected.totalCalendarMonths, `${id} totalCalendarMonths`);
  assert.equal(actual.summary.hasGap, expected.hasGap, `${id} hasGap`);
  assert.equal(actual.summary.shortTenureCount, expected.shortTenureCount, `${id} shortTenureCount`);
  assert.equal(actual.summary.currentEmploymentType, expected.currentEmploymentType, `${id} currentEmploymentType`);
  assert.equal(actual.summary.primaryRoleFamily, expected.primaryRoleFamily, `${id} primaryRoleFamily`);
  assert.equal(actual.summary.weightedExperienceMonths, "not_calculated", `${id} weightedExperienceMonths not calculated`);
  assert.equal(actual.mappedToAnalyzeCareerTimeline, false, `${id} mappedToAnalyzeCareerTimeline`);
  assert.equal(actual.mappedToCareerProfile, false, `${id} mappedToCareerProfile`);
  assert.equal(actual.employmentTimeline.length, expected.employmentTimeline.length, `${id} timeline length`);

  if (Object.prototype.hasOwnProperty.call(expected, "gapMonths")) {
    assert.equal(actual.summary.gapMonths, expected.gapMonths, `${id} gapMonths`);
  }

  for (const [index, expectedInterval] of expected.employmentTimeline.entries()) {
    const actualInterval = actual.employmentTimeline[index];
    assert.equal(
      actualInterval.normalizedEmploymentType,
      expectedInterval.employmentType,
      `${id} interval ${index} employmentType`
    );
    assert.equal(actualInterval.durationMonths, expectedInterval.durationMonths, `${id} interval ${index} duration`);
    assert.equal(actualInterval.experienceWeight, expectedInterval.experienceWeight, `${id} interval ${index} weight`);
    assert.equal(
      actualInterval.shortTenureApplicable,
      expectedInterval.shortTenureApplicable,
      `${id} interval ${index} shortTenureApplicable`
    );
    if (Object.prototype.hasOwnProperty.call(expectedInterval, "countsAsExperience")) {
      assert.equal(actualInterval.countsAsExperience, expectedInterval.countsAsExperience, `${id} interval ${index} countsAsExperience`);
    }
    if (Object.prototype.hasOwnProperty.call(expectedInterval, "countsAsGap")) {
      assert.equal(actualInterval.countsAsGap, expectedInterval.countsAsGap, `${id} interval ${index} countsAsGap`);
    }
    if (expectedInterval.overlapsWith) {
      assert.deepEqual(actualInterval.overlapsWith, expectedInterval.overlapsWith, `${id} interval ${index} overlapsWith`);
    }
  }

  for (const expectedWarning of expected.expectedWarnings ?? []) {
    assert.ok(
      actual.warnings.some((warning) => warning.warning === expectedWarning),
      `${id} expected warning ${expectedWarning}`
    );
  }
}

for (const item of dateEmploymentCombinedCases) {
  assertTimelineMatchesExpected(item.id);
}

console.log("PASS career-core combined employment timeline deterministic checks");
