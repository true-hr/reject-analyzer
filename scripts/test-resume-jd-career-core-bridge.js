import assert from "node:assert/strict";
import sampleResumeProfile from "../src/lib/resume/sampleResumeProfile.js";
import { buildCareerProfileFromResumeProfile } from "../src/lib/career-core/index.js";
import { buildCareerCoreTargetFromJdFit } from "../src/lib/resume/buildCareerCoreTargetFromJdFit.js";
import { buildResumeJdFit } from "../src/lib/resume/buildResumeJdFit.js";

const currentDate = "2026-06-01T00:00:00.000Z";

{
  const jdText = "Product Manager role for B2B SaaS platform. Own roadmap and requirements.";
  const fit = buildResumeJdFit({ profile: sampleResumeProfile, jdText });
  const target = buildCareerCoreTargetFromJdFit({
    fit,
    jdText,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
  });

  assert.equal(target.roleFamily, "product_planning_pm");
  assert.equal(target.industryDomain, "b2b_saas");
}

{
  const target = buildCareerCoreTargetFromJdFit({
    jdText: "GMP manufacturing quality specialist for bio pharma production process.",
    targetRole: "Production Quality",
    targetIndustry: "Bio Pharma",
  });

  assert.equal(target.roleFamily, "production_quality");
  assert.equal(target.industryDomain, "bio_pharma");
}

{
  const target = buildCareerCoreTargetFromJdFit({
    jdText: "Create resume, interview, recruiting, and career coaching content.",
    targetRole: "Content Marketing",
    targetIndustry: "Career Education",
  });

  assert.equal(target.roleFamily, "marketing_growth");
  assert.equal(target.industryDomain, "career_education");
}

{
  const target = buildCareerCoreTargetFromJdFit({
    jdText: "Flexible team member for a growing organization.",
    targetRole: "Associate",
    targetIndustry: "General",
  });

  assert.equal(target, null);
}

{
  const jdText = "Product Manager role for B2B SaaS platform. Own roadmap and requirements.";
  const fit = buildResumeJdFit({ profile: sampleResumeProfile, jdText });
  const target = buildCareerCoreTargetFromJdFit({
    fit,
    jdText,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
  });
  const careerProfile = buildCareerProfileFromResumeProfile(sampleResumeProfile, {
    currentDate,
    target,
  });

  assert.ok(careerProfile.fit);
  assert.equal(careerProfile.fit.target.roleFamily, "product_planning_pm");
  assert.equal(careerProfile.fit.target.industryDomain, "b2b_saas");
  assert.equal(typeof careerProfile.fit.summary.totalClassifiedMonths, "number");
}

console.log("PASS resume JD career core bridge deterministic checks");
