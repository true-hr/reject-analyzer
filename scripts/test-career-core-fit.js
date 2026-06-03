import assert from "node:assert/strict";
import {
  buildCareerFitSummary,
  buildCareerProfileFromResumeProfile,
  scoreCareerIndustryFit,
  scoreCareerRoleFit,
} from "../src/lib/career-core/index.js";

const fixedNow = "2026-06-01T00:00:00.000Z";
const target = {
  roleFamily: "product_planning_pm",
  industryDomain: "b2b_saas",
  targetRoleText: "Product Manager",
  targetIndustryText: "B2B SaaS",
};

const resumeProfileLike = {
  schemaVersion: "passmap.resumeProfile.v1",
  experiences: [
    {
      id: "exp-pm-saas",
      company: "B2B SaaS Platform",
      title: "Product Manager",
      startDate: "2025-01",
      endDate: "2025-12",
      bullets: [
        {
          text: "Owned product roadmap, requirements, activation dashboard, and B2B SaaS onboarding metrics.",
          evidenceType: "metric",
        },
      ],
    },
    {
      id: "exp-ops",
      company: "Operations Co",
      title: "Operations Manager",
      startDate: "2024-01",
      endDate: "2024-12",
      bullets: [
        {
          text: "Built SOP automation and improved settlement process quality.",
          evidenceType: "strong",
        },
      ],
    },
    {
      id: "exp-bio",
      company: "Bio Pharma GMP Lab",
      title: "Production Quality Specialist",
      startDate: "2023-01",
      endDate: "2023-12",
      bullets: [
        {
          text: "Managed GMP manufacturing and pharmaceutical quality process control.",
          evidenceType: "strong",
        },
      ],
    },
    {
      id: "exp-data",
      company: "Analytics Team",
      title: "Data Analyst",
      startDate: "2022-01",
      endDate: "2022-12",
      bullets: [
        {
          text: "Built SQL dashboard reports and improved operational decision metrics.",
          evidenceType: "metric",
        },
      ],
    },
    {
      id: "exp-career",
      company: "Career Education",
      title: "Content Marketing Manager",
      startDate: "2021-01",
      endDate: "2021-12",
      bullets: [
        {
          text: "Created resume review and interview coaching campaigns for career education users.",
          evidenceType: "strong",
        },
      ],
    },
    {
      id: "exp-empty",
      company: "Local Office",
      title: "Associate",
      startDate: "2020-01",
      endDate: "2020-12",
      bullets: [],
    },
  ],
};

const careerProfile = buildCareerProfileFromResumeProfile(resumeProfileLike, { currentDate: fixedNow });
const roleFit = scoreCareerRoleFit({
  careerProfile,
  targetRoleFamily: target.roleFamily,
  targetRoleText: target.targetRoleText,
});
const industryFit = scoreCareerIndustryFit({
  careerProfile,
  targetIndustryDomain: target.industryDomain,
  targetIndustryText: target.targetIndustryText,
});
const fitSummary = buildCareerFitSummary(careerProfile, target);

function fitById(result, id) {
  return result.experienceFits.find((fit) => fit.experienceId === id);
}

assert.equal(fitById(roleFit, "exp-pm-saas").roleFitLevel, "direct");
assert.equal(fitById(industryFit, "exp-pm-saas").industryFitLevel, "direct");
assert.equal(fitById(fitSummary, "exp-pm-saas").overallFitLevel, "direct");

assert.equal(fitById(roleFit, "exp-ops").roleFitLevel, "adjacent");
assert.ok(["adjacent", "transferable"].includes(fitById(fitSummary, "exp-ops").overallFitLevel));

assert.notEqual(fitById(roleFit, "exp-bio").roleFitLevel, "direct");
assert.notEqual(fitById(industryFit, "exp-bio").industryFitLevel, "direct");

assert.ok(["adjacent", "transferable"].includes(fitById(roleFit, "exp-data").roleFitLevel));
assert.ok(["adjacent", "transferable"].includes(fitById(fitSummary, "exp-data").overallFitLevel));

assert.ok(["adjacent", "transferable"].includes(fitById(industryFit, "exp-career").industryFitLevel));
assert.ok(["adjacent", "transferable"].includes(fitById(fitSummary, "exp-career").overallFitLevel));

assert.equal(fitById(roleFit, "exp-empty").roleFitLevel, "unknown");
assert.equal(fitById(industryFit, "exp-empty").industryFitLevel, "unknown");
assert.equal(fitById(fitSummary, "exp-empty").overallFitLevel, "unknown");

assert.equal(fitSummary.summary.directlyRelevantMonths, 12);
assert.equal(fitSummary.summary.adjacentRelevantMonths, 12);
assert.equal(fitSummary.summary.transferableMonths, 36);
assert.equal(fitSummary.summary.unrelatedMonths, 0);
assert.equal(fitSummary.summary.unknownMonths, 12);
assert.equal(fitSummary.summary.totalClassifiedMonths, 72);
assert.equal(fitSummary.summary.directExperienceCount, 1);
assert.equal(fitSummary.summary.adjacentExperienceCount, 1);
assert.equal(fitSummary.summary.transferableExperienceCount, 3);
assert.equal(fitSummary.summary.unrelatedExperienceCount, 0);
assert.equal(fitSummary.summary.unknownExperienceCount, 1);
assert.equal(fitSummary.summary.classificationBasis, "experience_duration_sum");
assert.ok(fitSummary.warnings.includes("classificationBasis: experience_duration_sum"));

const careerProfileWithFit = buildCareerProfileFromResumeProfile(resumeProfileLike, {
  currentDate: fixedNow,
  target,
});

assert.ok(careerProfileWithFit.fit);
assert.equal(careerProfileWithFit.fit.summary.totalClassifiedMonths, 72);
assert.equal(careerProfileWithFit.fit.target.roleFamily, "product_planning_pm");
assert.equal(careerProfile.fit, null);

console.log("PASS career-core fit deterministic checks");
