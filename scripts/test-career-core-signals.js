import assert from "node:assert/strict";
import {
  analyzeCareerTimeline,
  buildCareerProfileFromResumeProfile,
  createCareerSignal,
  extractCareerSignalsFromResumeProfile,
  normalizeCareerSignals,
} from "../src/lib/career-core/index.js";

const fixedNow = "2026-06-01T00:00:00.000Z";

function labels(items) {
  return items.map((item) => item.label);
}

function hasLabel(items, label) {
  return labels(items).includes(label);
}

const resumeProfileLike = {
  schemaVersion: "passmap.resumeProfile.v1",
  headline: {
    targetTitle: "Product Manager",
    keywords: ["B2B SaaS", "career education"],
  },
  experiences: [
    {
      id: "exp-pm",
      company: "B2B SaaS Platform",
      title: "PM / 서비스기획",
      startDate: "2024-01",
      endDate: "2026-06",
      bullets: [
        {
          id: "bullet-roadmap",
          text: "Built product roadmap and 정리한 요구사항 for onboarding.",
          evidenceType: "metric",
        },
        {
          id: "bullet-metric",
          text: "Improved activation by 18% and reduced manual review time.",
          evidenceType: "metric",
        },
      ],
    },
    {
      id: "exp-ops",
      company: "Operations Co",
      title: "운영 매니저",
      startDate: "2023-01",
      endDate: "2023-06",
      bullets: [
        {
          id: "bullet-sop",
          text: "SOP 표준화 and automated settlement process.",
          evidenceType: "strong",
        },
      ],
    },
    {
      id: "exp-bio",
      company: "바이오 제약 GMP Lab",
      title: "생산 품질 담당",
      startDate: "2022-01",
      endDate: "bad-date",
      bullets: [
        {
          id: "bullet-gmp",
          text: "GMP manufacturing quality process control for 의약품.",
          evidenceType: "weak",
        },
      ],
    },
    {
      id: "exp-career",
      company: "Career Education",
      title: "콘텐츠 마케팅",
      startDate: "2021-01",
      endDate: "2021-12",
      bullets: [
        {
          id: "bullet-career",
          text: "Created resume, interview, 이력서 and 커리어 coaching content campaign.",
          evidenceType: "strong",
        },
      ],
    },
    {
      id: "exp-empty",
      company: "Beauty Cosmetics",
      title: "CRM 마케팅",
      startDate: "2020-01",
      endDate: "2020-12",
      bullets: [],
    },
  ],
  skills: {
    technical: ["SQL", "data analysis"],
    tools: ["Dashboard"],
    domain: ["GMP", "resume review"],
  },
};

const timeline = analyzeCareerTimeline(resumeProfileLike.experiences, { currentDate: fixedNow });
const signals = extractCareerSignalsFromResumeProfile(resumeProfileLike, timeline);

assert.ok(hasLabel(signals.roleFamilies, "product_planning_pm"));
assert.ok(hasLabel(signals.roleFamilies, "operations"));
assert.ok(hasLabel(signals.strengthSignals, "process_improvement"));
assert.ok(hasLabel(signals.industryDomains, "bio_pharma"));
assert.ok(hasLabel(signals.roleFamilies, "production_quality"));
assert.ok(hasLabel(signals.industryDomains, "career_education"));
assert.ok(hasLabel(signals.strengthSignals, "metric_based_execution"));
assert.ok(hasLabel(signals.riskSignals, "short_tenure"));
assert.ok(hasLabel(signals.riskSignals, "timeline_date_issue"));
assert.ok(hasLabel(signals.riskSignals, "weak_evidence"));
assert.ok(hasLabel(signals.riskSignals, "missing_experience_evidence"));
assert.ok(hasLabel(signals.skillSignals, "sql"));
assert.ok(hasLabel(signals.toolSignals, "dashboard"));

const pmTitleSignal = signals.roleFamilies.find((signal) =>
  signal.label === "product_planning_pm" &&
  signal.source.refId === "exp-pm" &&
  signal.source.field === "title"
);
assert.equal(pmTitleSignal.confidence, 0.75);
assert.equal(pmTitleSignal.weight, 1);

const metricBulletSignal = signals.strengthSignals.find((signal) =>
  signal.label === "metric_based_execution" &&
  signal.source.refId === "bullet-metric"
);
assert.equal(metricBulletSignal.weight, 0.8);

const shortTenureSignal = signals.riskSignals.find((signal) => signal.label === "short_tenure");
assert.equal(shortTenureSignal.confidence, 0.9);

{
  const duplicateSignals = normalizeCareerSignals([
    createCareerSignal({
      type: "role_family_hint",
      label: "product_planning_pm",
      source: { type: "experience", refId: "exp-1", field: "title" },
      evidenceText: "PM",
      confidence: 0.75,
      weight: 1,
    }),
    createCareerSignal({
      type: "role_family_hint",
      label: "Product_Planning_PM",
      source: { type: "experience", refId: "exp-1", field: "title" },
      evidenceText: "PM",
      confidence: 0.75,
      weight: 1,
    }),
  ]);

  assert.equal(duplicateSignals.length, 1);
}

{
  const careerProfile = buildCareerProfileFromResumeProfile(resumeProfileLike, { currentDate: fixedNow });

  assert.ok(careerProfile.signals.roleFamilies.length > 0);
  assert.ok(careerProfile.signals.industryDomains.length > 0);
  assert.ok(careerProfile.signals.strengthSignals.length > 0);
  assert.ok(careerProfile.signals.riskSignals.length > 0);
  assert.ok(careerProfile.signals.skillSignals.length > 0);
  assert.ok(careerProfile.signals.toolSignals.length > 0);
  assert.equal(careerProfile.meta.signalSummary.totalSignalCount > 0, true);
  assert.equal(careerProfile.summary.experienceCount, resumeProfileLike.experiences.length);
}

console.log("PASS career-core signal deterministic checks");
