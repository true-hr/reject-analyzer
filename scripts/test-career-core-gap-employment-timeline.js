import assert from "node:assert/strict";
import { mapGapEmploymentTimeline } from "../src/lib/career-core/index.js";
import { dateEmploymentCombinedCases } from "../src/lib/career-core/__fixtures__/dateEmploymentCombinedCases.js";
import { expectedDateEmploymentProfiles } from "../src/lib/career-core/__fixtures__/expectedDateEmploymentProfiles.js";

function findCase(id) {
  const item = dateEmploymentCombinedCases.find((candidate) => candidate.id === id);
  assert.ok(item, `${id} fixture exists`);
  const expected = expectedDateEmploymentProfiles[id];
  assert.ok(expected, `${id} expected profile exists`);
  return { item, expected };
}

function assertCommonMapping(result, expected, context) {
  assert.equal(result.mappedToAnalyzeCareerTimeline, false, `${context} mappedToAnalyzeCareerTimeline`);
  assert.equal(result.mappedToCareerProfile, false, `${context} mappedToCareerProfile`);
  assert.equal(result.summary.totalCalendarMonthsFromIntervals, expected.totalCalendarMonths, `${context} totalCalendarMonths`);
  assert.equal(result.summary.hasExplicitGap, Boolean(expected.hasGap), `${context} hasExplicitGap`);
  assert.ok(Array.isArray(result.employmentTimeline), `${context} employmentTimeline array`);
  assert.ok(Array.isArray(result.warnings), `${context} warnings array`);
}

{
  const { item, expected } = findCase("combined_04_gap_contract_fulltime");
  const result = mapGapEmploymentTimeline(item.resumeInput);
  assertCommonMapping(result, expected, item.id);
  assert.equal(result.summary.gapMonths, 17, `${item.id} gapMonths`);
  assert.equal(result.summary.experienceMonths, 42, `${item.id} experienceMonths`);
  assert.equal(result.explicitGapIntervals.length, 1, `${item.id} explicit gap count`);

  const gap = result.explicitGapIntervals[0];
  assert.equal(gap.normalizedEmploymentType, "gap", `${item.id} gap type`);
  assert.equal(gap.metadataVariant, "career_gap", `${item.id} gap variant`);
  assert.equal(gap.timelineKind, "gap", `${item.id} timelineKind`);
  assert.equal(gap.durationMonths, 17, `${item.id} gap duration`);
  assert.equal(gap.gapMonths, 17, `${item.id} interval gapMonths`);
  assert.equal(gap.experienceMonths, 0, `${item.id} gap experienceMonths`);
  assert.equal(gap.countsAsGap, true, `${item.id} countsAsGap`);
  assert.equal(gap.countsAsExperience, false, `${item.id} countsAsExperience`);
  assert.equal(gap.shortTenureRisk, false, `${item.id} shortTenureRisk`);
  assert.equal(gap.mappedToTimeline, false, `${item.id} mappedToTimeline`);
  assert.equal(gap.mappedToCareerProfile, false, `${item.id} mappedToCareerProfile`);
  assert.ok(gap.warnings.includes("gap_not_counted_as_experience"), `${item.id} gap warning`);
}

{
  const { item, expected } = findCase("combined_03_bootcamp_to_fulltime");
  const result = mapGapEmploymentTimeline(item.resumeInput);
  assertCommonMapping(result, expected, item.id);
  assert.equal(result.summary.gapMonths, 0, `${item.id} gapMonths`);
  assert.equal(result.summary.experienceMonths, 36, `${item.id} experienceMonths`);
  assert.equal(result.explicitGapIntervals.length, 0, `${item.id} explicit gap count`);

  const training = result.employmentTimeline[0];
  assert.equal(training.normalizedEmploymentType, "training", `${item.id} training type`);
  assert.equal(training.metadataVariant, "bootcamp", `${item.id} bootcamp variant`);
  assert.equal(training.countsAsExperience, false, `${item.id} training not experience`);
  assert.equal(training.countsAsGap, false, `${item.id} training not gap`);
  assert.equal(training.experienceMonths, 0, `${item.id} training experienceMonths`);
  assert.equal(training.gapMonths, 0, `${item.id} training gapMonths`);
}

{
  const { item, expected } = findCase("combined_05_military_activity_fulltime");
  const result = mapGapEmploymentTimeline(item.resumeInput);
  assertCommonMapping(result, expected, item.id);
  assert.equal(result.summary.gapMonths, 0, `${item.id} gapMonths`);
  assert.equal(result.summary.experienceMonths, 48, `${item.id} experienceMonths`);
  assert.equal(result.explicitGapIntervals.length, 0, `${item.id} explicit gap count`);

  const military = result.employmentTimeline[0];
  assert.equal(military.normalizedEmploymentType, "military_service", `${item.id} military type`);
  assert.equal(military.countsAsGap, false, `${item.id} military not gap`);
  assert.equal(military.countsAsExperience, false, `${item.id} military not experience`);
  assert.equal(military.shortTenureRisk, false, `${item.id} military shortTenureRisk`);
}

{
  const result = mapGapEmploymentTimeline({
    company: "테스트",
    roles: [
      {
        title: "진로탐색",
        period: "2019.08 ~ 2020.01 진로탐색",
        employmentType: "진로탐색",
      },
      {
        title: "정규직",
        period: "2020.02 ~ 2020.07",
        employmentType: "정규직",
      },
    ],
  });

  assert.equal(result.summary.hasExplicitGap, true, "career exploration hasExplicitGap");
  assert.equal(result.summary.gapMonths, 6, "career exploration gapMonths");
  assert.equal(result.summary.experienceMonths, 6, "career exploration experienceMonths");
  assert.equal(result.explicitGapIntervals[0].metadataVariant, "career_exploration", "career exploration variant");
  assert.equal(result.explicitGapIntervals[0].countsAsSignal, "contextual", "career exploration contextual signal");
}

console.log("PASS career-core gap employment timeline mapping deterministic checks");
