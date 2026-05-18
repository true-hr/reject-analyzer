/**
 * QA script: newgrad job-industry bridge payload builder.
 * Run: node scripts/qa-newgrad-job-industry-bridge-payload.mjs
 */

import { buildNewgradTransitionLiteResult } from "../src/lib/transitionLite/buildNewgradTransitionLiteResult.js";
import { buildNewgradJobIndustryBridgePayload } from "../src/lib/transitionLite/buildNewgradJobIndustryBridgePayload.js";

const EXPECTED_VERSION = "newgrad_job_industry_bridge_payload_v1";
const EXPECTED_GUARD_FLAGS = [
  "noScoreChange",
  "noBandChange",
  "noExperienceGeneration",
  "noAdmissionConclusion",
  "axis1MajorToJobOnly",
  "noUiAutoApply",
];

const QA_CASES = [
  {
    caseId: "CIRCUIT_BATTERY_EE",
    caseName: "circuit design x chemical/materials/battery x electrical engineering",
    targetJobId: "JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN",
    targetIndustryId: "IND_MANUFACTURING_CHEMICAL_MATERIALS_BATTERY",
    major: "electrical engineering",
    projects: ["BMS board design project", "power circuit validation"],
    internships: ["battery module circuit test intern"],
    certifications: ["electronics engineer"],
    strengths: ["structured debugging", "measurement discipline"],
    domainInterestEvidence: ["battery BMS teardown and trend review"],
    expectSpecializationFound: true,
  },
  {
    caseId: "SERVICE_PLANNING_B2B_SAAS",
    caseName: "service planning x B2B SaaS x business",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    major: "business administration",
    projects: ["SaaS onboarding funnel improvement"],
    internships: ["B2B SaaS customer success assistant"],
    certifications: [],
    strengths: ["customer problem framing"],
    domainInterestEvidence: ["PLG metric case notes"],
  },
  {
    caseId: "DATA_FINANCE_STAT",
    caseName: "data analysis x finance x statistics",
    targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    targetIndustryId: "IND_FINANCE_INSURANCE_FINTECH_SECURITIES_ASSET_MANAGEMENT",
    major: "statistics",
    projects: ["credit risk feature analysis with Python"],
    internships: [],
    certifications: ["ADsP", "SQLD"],
    strengths: ["quantitative reasoning"],
    domainInterestEvidence: ["finance data governance study"],
  },
  {
    caseId: "CONTENT_MARKETING_INSURANCE",
    caseName: "content marketing x insurance",
    targetJobId: "JOB_MARKETING_CONTENT_MARKETING",
    targetIndustryId: "IND_FINANCE_INSURANCE_FINTECH_INSURANCE",
    major: "media communication",
    projects: ["insurance product explainer content"],
    internships: [],
    certifications: [],
    strengths: ["clear writing"],
    domainInterestEvidence: ["insurance consumer education content review"],
  },
  {
    caseId: "SALES_MANAGEMENT_PHARMA",
    caseName: "sales management x pharma",
    targetJobId: "JOB_SALES_B2B_SALES",
    targetIndustryId: "IND_HEALTHCARE_PHARMA_BIO_PHARMACEUTICALS",
    major: "business administration",
    projects: ["pharma account segmentation analysis"],
    internships: ["pharma sales support intern"],
    certifications: [],
    strengths: ["relationship management", "structured follow-up"],
    domainInterestEvidence: ["HCP engagement regulation notes"],
  },
];

function makeInput(testCase) {
  return {
    targetJobId: testCase.targetJobId,
    targetIndustryId: testCase.targetIndustryId,
    major: testCase.major,
    projects: testCase.projects,
    internships: testCase.internships,
    certifications: testCase.certifications,
    extracurriculars: [],
    contractExperiences: [],
    domainInterestEvidence: testCase.domainInterestEvidence,
    strengths: testCase.strengths,
    workStyleNotes: "prefers structured execution and evidence-based decisions",
  };
}

function assertGuardFlags(payload, errors) {
  for (const flag of EXPECTED_GUARD_FLAGS) {
    if (payload.guardContext?.[flag] !== true) {
      errors.push(`guardContext.${flag} is not true`);
    }
  }
}

function checkAxis1Phrase(payload, warnings) {
  // Check for Axis1 content contamination (not just guard flag names like axis1MajorToJobOnly)
  const text = JSON.stringify(payload);
  const blocked = ["jobStructure", "major_to_job_only", "전공과 직무", "전공-직무 연결"];
  const hits = blocked.filter((keyword) => text.includes(keyword));
  if (hits.length) warnings.push(`possible Axis1 contamination in payload: ${hits.join(", ")}`);
}

function checkCase(testCase) {
  const errors = [];
  const warnings = [];
  const input = makeInput(testCase);
  const resultVm = buildNewgradTransitionLiteResult(input);
  const payload = buildNewgradJobIndustryBridgePayload(resultVm, input);
  const vmPayload = resultVm?.jobIndustryBridgePayload;

  if (payload.version !== EXPECTED_VERSION) errors.push(`version mismatch: ${payload.version}`);
  if (!["ready", "skipped"].includes(payload.status)) errors.push(`unexpected status: ${payload.status}`);
  if (!vmPayload) errors.push("resultVm.jobIndustryBridgePayload missing");
  if (vmPayload?.version !== EXPECTED_VERSION) errors.push("wired payload version mismatch");

  if (payload.status === "skipped") {
    warnings.push(`skipped: ${payload.skipReason || "no reason"}`);
    return { testCase, payload, errors, warnings };
  }

  if (!payload.target?.jobId && !payload.target?.jobLabel) errors.push("target job missing");
  if (!payload.target?.industryId && !payload.target?.industryLabel) errors.push("target industry missing");

  const rows = payload.axisTargets?.industryContext?.currentRows;
  if (!Array.isArray(rows) || rows.length < 1) errors.push("industryContext currentRows missing");
  else if (rows.length < 3) warnings.push(`industryContext currentRows ${rows.length}/3`);

  if (!payload.axisTargets?.responsibilityScope) errors.push("responsibilityScope missing");
  assertGuardFlags(payload, errors);
  checkAxis1Phrase(payload, warnings);

  if (payload.deterministicBridge?.existingSpecializationFound !== true && testCase.expectSpecializationFound) {
    warnings.push("expected specialization registry hit, got false");
  }

  return { testCase, payload, errors, warnings };
}

const results = QA_CASES.map((testCase) => {
  try {
    return checkCase(testCase);
  } catch (error) {
    return { testCase, payload: null, errors: [`exception: ${error.message}`], warnings: [] };
  }
});

let passCount = 0;
let warnCount = 0;
let failCount = 0;

console.log("Newgrad Job-Industry Bridge Payload QA");

for (const result of results) {
  const verdict = result.errors.length ? "FAIL" : result.warnings.length ? "WARN" : "PASS";
  if (verdict === "PASS") passCount += 1;
  if (verdict === "WARN") warnCount += 1;
  if (verdict === "FAIL") failCount += 1;

  const payload = result.payload;
  const rows = payload?.axisTargets?.industryContext?.currentRows ?? [];
  console.log(`\n[${verdict}] ${result.testCase.caseId} - ${result.testCase.caseName}`);
  console.log(`  status: ${payload?.status || "missing"}`);
  if (payload?.status === "ready") {
    console.log(`  target: ${payload.target.jobId || payload.target.jobLabel} x ${payload.target.industryId || payload.target.industryLabel}`);
    console.log(`  rows: ${rows.length}`);
    console.log(`  responsibilityScope: ${payload.axisTargets?.responsibilityScope ? "present" : "missing"}`);
    console.log(`  specializationFound: ${payload.deterministicBridge?.existingSpecializationFound}`);
  }
  for (const error of result.errors) console.log(`  FAIL: ${error}`);
  for (const warning of result.warnings) console.log(`  WARN: ${warning}`);
}

console.log(`\nSummary: PASS ${passCount} / WARN ${warnCount} / FAIL ${failCount}`);

if (failCount > 0) process.exit(1);
