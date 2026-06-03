import assert from "node:assert/strict";
import {
  CAREER_CORE_FIT_QA_CURRENT_DATE,
  careerCoreFitQaCases,
} from "../src/lib/career-core/__fixtures__/careerCoreFitQaCases.js";
import { buildRejectionCareerCoreSignal } from "../src/lib/preciseAnalysis/buildRejectionCareerCoreSignal.js";

const currentDate = CAREER_CORE_FIT_QA_CURRENT_DATE;

function qaCase(id) {
  const found = careerCoreFitQaCases.find((item) => item.id === id);
  assert.ok(found, `Missing fixture: ${id}`);
  return found;
}

function summarize(caseId, expected, signal) {
  return {
    case: caseId,
    expected,
    status: signal.status,
    targetRole: signal.target?.roleFamily ?? "",
    targetIndustry: signal.target?.industryDomain ?? "",
    primaryFitLevel: signal.primaryFitLevel,
    direct: signal.monthBuckets.direct,
    adjacent: signal.monthBuckets.adjacent,
    transferable: signal.monthBuckets.transferable,
    unrelated: signal.monthBuckets.unrelated,
    unknown: signal.monthBuckets.unknown,
    total: signal.monthBuckets.total,
  };
}

function assertReadOnlySignal(signal) {
  assert.equal(signal.source, "career_core_v0");
  assert.equal("severity" in signal, false);
  assert.equal("triggered" in signal, false);
  assert.equal("riskScore" in signal, false);
  assert.match(signal.copy.caution, /참고/);
  assert.match(signal.copy.caution, /보조 분류/);
  assert.doesNotMatch(signal.copy.caution, /합격 가능성|최종 적격성|이것 때문에 떨어짐|확실히 맞음/);
}

const results = [];

{
  const source = qaCase("qa-fit-002-ops-to-pm");
  const signal = buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    jdText: "Product Manager for a B2B SaaS platform. Own roadmap, requirements, operations metrics, and process improvements.",
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "ready");
  assert.equal(signal.target.roleFamily, "product_planning_pm");
  assert.equal(signal.target.industryDomain, "b2b_saas");
  assert.ok(signal.monthBuckets.adjacent + signal.monthBuckets.transferable > 0);
  results.push(summarize("pm-saas-jd-ops-planning-resume", "ready adjacent/transferable signal", signal));
}

{
  const source = qaCase("qa-fit-003-bio-quality-to-pm-saas");
  const signal = buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    jdText: "Product Manager for B2B SaaS platform roadmap and requirements.",
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "ready");
  assert.equal(signal.target.roleFamily, "product_planning_pm");
  assert.equal(signal.target.industryDomain, "b2b_saas");
  assert.equal(signal.monthBuckets.direct, 0);
  results.push(summarize("pm-saas-jd-bio-quality-resume", "ready but not direct", signal));
}

{
  const source = qaCase("qa-fit-004-bio-quality-aligned");
  const signal = buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    jdText: "GMP manufacturing quality specialist for bio pharma production process.",
    targetRole: "Production Quality",
    targetIndustry: "Bio Pharma",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "ready");
  assert.equal(signal.target.roleFamily, "production_quality");
  assert.equal(signal.target.industryDomain, "bio_pharma");
  assert.ok(signal.monthBuckets.direct > 0);
  results.push(summarize("bio-gmp-quality-jd-bio-quality-resume", "ready direct signal", signal));
}

{
  const source = qaCase("qa-fit-005-career-content-education");
  const signal = buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    jdText: "Create resume, interview, recruiting, career coaching, and content marketing programs.",
    targetRole: "Content Marketing",
    targetIndustry: "Career Education",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "ready");
  assert.equal(signal.target.industryDomain, "career_education");
  results.push(summarize("career-education-jd-content-resume", "ready career education signal", signal));
}

{
  const source = qaCase("qa-fit-001-pm-saas-aligned");
  const signal = buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    jdText: "Flexible team member for a growing organization.",
    targetRole: "Associate",
    targetIndustry: "General",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "skipped");
  assert.equal(signal.reason, "target_not_inferred");
  assert.equal(signal.fit, null);
  results.push(summarize("ambiguous-jd", "skipped target_not_inferred", signal));
}

{
  const source = qaCase("qa-fit-001-pm-saas-aligned");
  const signal = buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    jdText: "",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "skipped");
  assert.equal(signal.reason, "target_not_inferred");
  results.push(summarize("missing-jd", "skipped target_not_inferred", signal));
}

{
  const signal = buildRejectionCareerCoreSignal({
    jdText: "Product Manager for B2B SaaS platform.",
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "skipped");
  assert.equal(signal.reason, "missing_resume_profile");
  results.push(summarize("missing-profile", "skipped missing_resume_profile", signal));
}

{
  const source = qaCase("qa-fit-001-pm-saas-aligned");
  const longJd = [
    "Product Manager for B2B SaaS platform.",
    "Own roadmap, requirements, onboarding metrics, enterprise stakeholder communication, and launch readiness.",
    "This text intentionally repeats responsibilities to simulate a long JD without changing inference scope.",
  ].join(" ".repeat(20));
  const signal = buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    jdText: longJd,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "ready");
  assert.equal(signal.target.roleFamily, "product_planning_pm");
  assert.equal(signal.target.industryDomain, "b2b_saas");
  results.push(summarize("long-jd", "ready conservative inference", signal));
}

{
  const source = qaCase("qa-fit-001-pm-saas-aligned");
  const signal = buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    jdText: "서비스기획 Product Manager 역할입니다. B2B SaaS platform roadmap와 requirements를 담당합니다.",
    targetRole: "서비스기획 Product Manager",
    targetIndustry: "B2B SaaS 플랫폼",
    currentDate,
  });

  assertReadOnlySignal(signal);
  assert.equal(signal.status, "ready");
  assert.equal(signal.target.roleFamily, "product_planning_pm");
  assert.equal(signal.target.industryDomain, "b2b_saas");
  results.push(summarize("korean-english-mixed-jd", "ready mixed-language inference", signal));
}

console.table(results);
console.log("PASS rejection Career Core read-only bridge deterministic checks");
