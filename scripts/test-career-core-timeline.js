import assert from "node:assert/strict";
import {
  CAREER_PROFILE_SCHEMA_VERSION,
  analyzeCareerTimeline,
  buildCareerProfileFromResumeProfile,
  createEmptyCareerProfile,
  normalizeCareerProfile,
} from "../src/lib/career-core/index.js";

const fixedNow = "2026-06-01T00:00:00.000Z";

{
  const result = analyzeCareerTimeline([
    { id: "a", company: "A", title: "One", startDate: "2017-01", endDate: "2018-12" },
    { id: "b", company: "B", title: "Two", startDate: "2019-01", endDate: "2021-12" },
    { id: "c", company: "C", title: "Three", startDate: "2022-01", endDate: "2023-12" },
  ], { currentDate: fixedNow });

  assert.equal(result.summary.totalExperienceMonths, 84);
  assert.equal(result.summary.uniqueExperienceMonths, 84);
  assert.equal(result.summary.overlapMonths, 0);
  assert.equal(result.summary.experienceCount, 3);
}

{
  const result = analyzeCareerTimeline([
    { id: "current", company: "Now Co", title: "Lead", startDate: "2024-01", endDate: "present" },
    { id: "current-ko", company: "Ko Co", title: "PM", startDate: "2026-01", endDate: "현재" },
    { id: "null-end", company: "Null Co", title: "Ops", startDate: "2026-03", endDate: null },
  ], { currentDate: fixedNow });

  assert.equal(result.timeline[0].endMonth, "2026-06");
  assert.equal(result.timeline[0].durationMonths, 30);
  assert.equal(result.timeline[0].isCurrent, true);
  assert.equal(result.timeline[1].durationMonths, 6);
  assert.equal(result.timeline[2].durationMonths, 4);
  assert.equal(result.summary.currentRoleMonths, 40);
}

{
  const result = analyzeCareerTimeline([
    { id: "a", startDate: "2020-01", endDate: "2020-12" },
    { id: "b", startDate: "2020-07", endDate: "2021-06" },
  ], { currentDate: fixedNow });

  assert.equal(result.summary.totalExperienceMonths, 24);
  assert.equal(result.summary.uniqueExperienceMonths, 18);
  assert.equal(result.summary.overlapMonths, 6);
}

{
  const result = analyzeCareerTimeline([
    { id: "a", startDate: "2020-01", endDate: "2020-03" },
    { id: "b", startDate: "2020-06", endDate: "2020-08" },
  ], { currentDate: fixedNow });

  assert.equal(result.summary.gapMonths, 2);
  assert.deepEqual(result.gaps, [
    { startMonth: "2020-04", endMonth: "2020-05", durationMonths: 2 },
  ]);
}

{
  const result = analyzeCareerTimeline([
    { id: "short", startDate: "2025-01", endDate: "2025-06" },
    { id: "long", startDate: "2025-07", endDate: "2026-06" },
  ], { currentDate: fixedNow });

  assert.equal(result.timeline[0].isShortTenure, true);
  assert.equal(result.timeline[1].isShortTenure, false);
  assert.equal(result.summary.shortTenureCount, 1);
}

{
  const result = analyzeCareerTimeline([
    { id: "bad-start", startDate: "not-a-date", endDate: "2024-12" },
    { id: "bad-end", startDate: "2024-01", endDate: "2024-13" },
    { id: "reverse", startDate: "2025-12", endDate: "2025-01" },
  ], { currentDate: fixedNow });

  assert.ok(result.timeline[0].warnings.some((warning) => warning.startsWith("start_invalid_date")));
  assert.ok(result.timeline[1].warnings.some((warning) => warning.startsWith("end_invalid_date")));
  assert.ok(result.timeline[2].warnings.includes("end_before_start"));
  assert.equal(result.summary.totalExperienceMonths, 0);
}

{
  const resumeProfileLike = {
    schemaVersion: "passmap.resumeProfile.v1",
    experiences: [
      { id: "resume-1", company: "Resume Co", title: "Analyst", startDate: "2021-03", endDate: "2023-02" },
      { id: "resume-2", company: "Current Co", title: "PM", startDate: "2024-01", endDate: "present" },
    ],
  };

  const careerProfile = buildCareerProfileFromResumeProfile(resumeProfileLike, { currentDate: fixedNow });

  assert.equal(careerProfile.schemaVersion, CAREER_PROFILE_SCHEMA_VERSION);
  assert.equal(careerProfile.timeline.length, 2);
  assert.equal(careerProfile.summary.totalExperienceMonths, 54);
  assert.deepEqual(careerProfile.signals.roleFamilies, []);
  assert.deepEqual(careerProfile.signals.industryDomains, []);
  assert.deepEqual(careerProfile.signals.strengthSignals, []);
  assert.deepEqual(careerProfile.signals.riskSignals, []);
  assert.equal(careerProfile.meta.source, "resume_profile");
  assert.equal(careerProfile.meta.resumeProfileSchemaVersion, "passmap.resumeProfile.v1");
}

{
  const empty = createEmptyCareerProfile();
  const normalized = normalizeCareerProfile({ summary: { totalExperienceMonths: 12 } });

  assert.equal(empty.schemaVersion, CAREER_PROFILE_SCHEMA_VERSION);
  assert.equal(normalized.summary.totalExperienceMonths, 12);
  assert.equal(normalized.summary.uniqueExperienceMonths, 0);
}

console.log("PASS career-core timeline deterministic checks");
