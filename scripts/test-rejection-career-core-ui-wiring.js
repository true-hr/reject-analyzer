import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CAREER_CORE_FIT_QA_CURRENT_DATE,
  careerCoreFitQaCases,
} from "../src/lib/career-core/__fixtures__/careerCoreFitQaCases.js";
import { buildRejectionCareerCoreSignal } from "../src/lib/preciseAnalysis/buildRejectionCareerCoreSignal.js";

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
const uiSource = fs.readFileSync(path.join(root, "src/components/input/PreciseAnalysisFlow.jsx"), "utf8");

function qaCase(id) {
  const found = careerCoreFitQaCases.find((item) => item.id === id);
  assert.ok(found, `Missing fixture: ${id}`);
  return found;
}

function shouldRenderCareerCoreBox(signal) {
  return Boolean(signal && signal.status === "ready");
}

function buildSignal(caseId, overrides = {}) {
  const source = qaCase(caseId);
  return buildRejectionCareerCoreSignal({
    resumeProfile: source.resumeProfile,
    currentDate: CAREER_CORE_FIT_QA_CURRENT_DATE,
    ...overrides,
  });
}

const readyOpsToPm = buildSignal("qa-fit-002-ops-to-pm", {
  jdText: "Product Manager for a B2B SaaS platform. Own roadmap, requirements, operations metrics, and process improvements.",
  targetRole: "Product Manager",
  targetIndustry: "B2B SaaS",
});
assert.equal(readyOpsToPm.status, "ready");
assert.equal(shouldRenderCareerCoreBox(readyOpsToPm), true);
assert.equal(readyOpsToPm.target.roleFamily, "product_planning_pm");
assert.equal(readyOpsToPm.target.industryDomain, "b2b_saas");
assert.ok(readyOpsToPm.monthBuckets.transferable + readyOpsToPm.monthBuckets.adjacent > 0);

const readyBioToPm = buildSignal("qa-fit-003-bio-quality-to-pm-saas", {
  jdText: "Product Manager for B2B SaaS platform roadmap and requirements.",
  targetRole: "Product Manager",
  targetIndustry: "B2B SaaS",
});
assert.equal(readyBioToPm.status, "ready");
assert.equal(shouldRenderCareerCoreBox(readyBioToPm), true);
assert.equal(readyBioToPm.monthBuckets.direct, 0);
assert.ok(readyBioToPm.monthBuckets.unrelated > 0);

const readyBioQuality = buildSignal("qa-fit-004-bio-quality-aligned", {
  jdText: "GMP manufacturing quality specialist for bio pharma production process.",
  targetRole: "Production Quality",
  targetIndustry: "Bio Pharma",
});
assert.equal(readyBioQuality.status, "ready");
assert.equal(shouldRenderCareerCoreBox(readyBioQuality), true);
assert.equal(readyBioQuality.target.roleFamily, "production_quality");
assert.ok(readyBioQuality.monthBuckets.direct > 0);

const skippedAmbiguousJd = buildSignal("qa-fit-001-pm-saas-aligned", {
  jdText: "Flexible team member for a growing organization.",
  targetRole: "Associate",
  targetIndustry: "General",
});
assert.equal(skippedAmbiguousJd.status, "skipped");
assert.equal(skippedAmbiguousJd.reason, "target_not_inferred");
assert.equal(shouldRenderCareerCoreBox(skippedAmbiguousJd), false);

const skippedNoProfile = buildRejectionCareerCoreSignal({
  jdText: "Product Manager for a B2B SaaS platform.",
  targetRole: "Product Manager",
  targetIndustry: "B2B SaaS",
  currentDate: CAREER_CORE_FIT_QA_CURRENT_DATE,
});
assert.equal(skippedNoProfile.status, "skipped");
assert.equal(skippedNoProfile.reason, "missing_resume_profile");
assert.equal(shouldRenderCareerCoreBox(skippedNoProfile), false);

assert.equal(shouldRenderCareerCoreBox(null), false);
assert.equal(shouldRenderCareerCoreBox(undefined), false);

assert.match(appSource, /buildRejectionCareerCoreSignal/);
assert.match(appSource, /careerCoreSignal:\s*__rejectionCareerCoreSignal/);
assert.match(appSource, /not used by rejection scoring/);
assert.match(uiSource, /RejectionCareerCoreSignalBox/);
assert.match(uiSource, /signal\.status !== "ready"/);
assert.match(uiSource, /Career Core v0 참고 신호/);
assert.match(uiSource, /직무\/산업 신호 기준의 보조 분류이며, 탈락 원인 확정이 아닌 참고용 해석입니다\./);
assert.match(uiSource, /경험 항목 기준 합산/);
assert.match(uiSource, /sm:grid-cols-5/);

console.table([
  {
    case: "PM/SaaS JD + operations/planning resume",
    status: readyOpsToPm.status,
    primary: readyOpsToPm.primaryFitLevel,
    render: shouldRenderCareerCoreBox(readyOpsToPm),
  },
  {
    case: "PM/SaaS JD + bio production quality resume",
    status: readyBioToPm.status,
    primary: readyBioToPm.primaryFitLevel,
    render: shouldRenderCareerCoreBox(readyBioToPm),
  },
  {
    case: "Bio/GMP quality JD + bio production quality resume",
    status: readyBioQuality.status,
    primary: readyBioQuality.primaryFitLevel,
    render: shouldRenderCareerCoreBox(readyBioQuality),
  },
  {
    case: "ambiguous JD",
    status: skippedAmbiguousJd.status,
    reason: skippedAmbiguousJd.reason,
    render: shouldRenderCareerCoreBox(skippedAmbiguousJd),
  },
  {
    case: "profile missing",
    status: skippedNoProfile.status,
    reason: skippedNoProfile.reason,
    render: shouldRenderCareerCoreBox(skippedNoProfile),
  },
  {
    case: "signal missing",
    status: "missing",
    render: shouldRenderCareerCoreBox(null),
  },
]);

console.log("PASS rejection Career Core UI wiring deterministic checks");
