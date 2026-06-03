import assert from "node:assert/strict";
import { buildCareerProfileFromWorkRecords } from "../src/lib/career-core/index.js";

const fixedNow = "2026-06-01T00:00:00.000Z";
const target = {
  roleFamily: "product_planning_pm",
  industryDomain: "b2b_saas",
  targetRoleText: "Product Manager",
  targetIndustryText: "B2B SaaS",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function labels(signals) {
  return new Set((signals || []).map((signal) => signal.label));
}

function warningNames(profile) {
  return new Set((profile?.meta?.warnings || []).map((item) =>
    typeof item === "string" ? item : item?.warning
  ));
}

{
  const profile = buildCareerProfileFromWorkRecords(null, { currentDate: fixedNow });

  assert.equal(profile.meta.source, "work_records");
  assert.equal(profile.meta.adapterInputCount, 0);
  assert.equal(profile.meta.durationPrecision, "record_based_reference");
  assert.equal(profile.summary.experienceCount, 0);
  assert.equal(profile.timeline.length, 0);
  assert.equal(profile.fit, null);
}

{
  const records = [
    {
      id: "wr-top-level",
      title: "Product Manager roadmap and B2B SaaS onboarding",
      task: "Owned requirements and product roadmap",
      result: "Improved activation dashboard metrics",
      record_date: "2026-05-31",
      strength_tags: ["planning", "stakeholder coordination"],
      skill_tags: ["product manager", "b2b saas"],
    },
  ];

  const before = JSON.stringify(records);
  const profile = buildCareerProfileFromWorkRecords(records, { currentDate: fixedNow });

  assert.equal(JSON.stringify(records), before);
  assert.equal(profile.timeline.length, 1);
  assert.equal(profile.summary.totalExperienceMonths, 0);
  assert.ok(labels(profile.signals.roleFamilies).has("product_planning_pm"));
  assert.ok(labels(profile.signals.industryDomains).has("b2b_saas"));
  assert.ok(labels(profile.signals.strengthSignals).has("planning_strategy"));
  assert.ok(warningNames(profile).has("record_date_is_not_duration"));
  assert.ok(warningNames(profile).has("work_record_duration_unknown"));
}

{
  const records = [
    {
      id: "wr-accepted-candidates",
      title: "AI Inbox accepted experience",
      record_date: "2026-05-30",
      raw_payload: {
        summary: "Accepted candidate without raw source text",
        acceptedCandidates: [
          {
            title: "Operations process improvement for SaaS onboarding",
            role: "Operations lead",
            skills: ["SOP automation", "stakeholder coordination"],
            job_tags: ["operations", "data analytics"],
            industry_tags: ["B2B SaaS"],
            actions: ["Standardized onboarding process and dashboard review"],
            result: ["Reduced repeated manual checks"],
            suggestedResumeBullet: "Improved SaaS onboarding operations with SOP automation.",
            evidenceTexts: ["Standardized onboarding process and dashboard review"],
            confidenceLevel: "high",
            resumePotential: "medium",
          },
        ],
        assetSkills: ["process improvement"],
        assetJobTags: ["operations"],
      },
    },
  ];

  const profile = buildCareerProfileFromWorkRecords(records, { currentDate: fixedNow });
  assert.ok(labels(profile.signals.roleFamilies).has("operations"));
  assert.ok(labels(profile.signals.industryDomains).has("b2b_saas"));
  assert.ok(labels(profile.signals.strengthSignals).has("process_improvement"));
  assert.equal(profile.summary.totalExperienceMonths, 0);
}

{
  const records = [
    {
      id: "wr-browser-extension-shape",
      title: "Browser extension candidate",
      raw_payload: {
        acceptedCandidates: [
          {
            title: "Career education content marketing campaign",
            resultCandidate: "Created interview coaching campaign reports.",
            jobTags: ["content marketing", "campaign"],
            industryTags: ["career education", "interview coaching"],
            skills: ["marketing", "report"],
            confidenceLevel: "medium",
          },
        ],
      },
    },
  ];

  const profile = buildCareerProfileFromWorkRecords(records, { currentDate: fixedNow });
  assert.ok(labels(profile.signals.roleFamilies).has("marketing_growth"));
  assert.ok(labels(profile.signals.industryDomains).has("career_education"));
  assert.equal(profile.summary.totalExperienceMonths, 0);
}

{
  const records = [
    {
      id: "wr-record-date-only-fit",
      title: "Product Manager roadmap for B2B SaaS platform",
      task: "Product manager requirements and roadmap",
      result: "Improved enterprise SaaS onboarding metrics",
      record_date: "2026-05-29",
      strength_tags: ["planning", "metric based execution"],
      skill_tags: ["product manager", "b2b saas"],
    },
  ];

  const profile = buildCareerProfileFromWorkRecords(records, {
    currentDate: fixedNow,
    target,
  });

  assert.ok(profile.fit);
  assert.equal(profile.fit.summary.totalClassifiedMonths, 0);
  assert.equal(profile.fit.summary.directlyRelevantMonths, 0);
  assert.equal(profile.fit.summary.directExperienceCount, 1);
  assert.equal(profile.fit.experienceFits[0].overallFitLevel, "direct");
  assert.equal(profile.fit.experienceFits[0].durationMonths, 0);
  assert.ok(warningNames(profile).has("record_date_is_not_duration"));
}

{
  const records = [
    {
      id: "wr-no-raw-text",
      title: "SQL dashboard report for platform operations",
      task: "Built dashboard report",
      result: "Improved operations decision metrics",
      strength_tags: ["data analysis"],
      skill_tags: ["sql", "platform"],
      raw_payload: {
        summary: "No rawText field is needed",
        experienceSignals: [
          {
            label: "data analysis",
            evidenceText: "dashboard report metrics",
            suggestedResumeAngle: "metric based execution",
          },
        ],
      },
    },
  ];

  const profile = buildCareerProfileFromWorkRecords(records, { currentDate: fixedNow });
  assert.ok(labels(profile.signals.roleFamilies).has("data_analytics"));
  assert.ok(labels(profile.signals.industryDomains).has("b2b_saas"));
  assert.equal(profile.summary.totalExperienceMonths, 0);
}

console.log("PASS career-core work records adapter deterministic checks");
