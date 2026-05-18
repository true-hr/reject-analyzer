/**
 * QA script: AI reviewer payload builder 검증
 * Run: node scripts/qa-newgrad-report-ai-review-payload.mjs
 */

import { buildNewgradTransitionLiteResult } from "../src/lib/transitionLite/buildNewgradTransitionLiteResult.js";
import { buildNewgradReportAiReviewPayload } from "../src/lib/transitionLite/buildNewgradReportAiReviewPayload.js";

const EXPECTED_VERSION = "newgrad_report_ai_review_payload_v1";
const MAX_PAYLOAD_SIZE = 12000;

// ─────────────────────────────────────────────
// QA case inputs
// ─────────────────────────────────────────────
const QA_CASES = [
  {
    caseId: "CIRCUIT_CHEM_BATTERY",
    caseName: "회로설계 × 화학/소재/배터리",
    targetJobId: "JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN",
    targetIndustryId: "IND_MANUFACTURING_CHEMICAL_MATERIALS_BATTERY",
    major: "전자공학",
    projects: [
      "배터리 BMS 회로 설계 — 충방전 제어 로직 구현",
      "아날로그 필터 설계 실습 — 신호 처리 회로",
    ],
    internships: [
      "이차전지 제조사 회로설계 인턴 — 셀 특성 측정 및 회로도 검토",
    ],
    certifications: ["전기기사"],
    strengths: ["꼼꼼한 설계 검토", "논리적 사고"],
    workStyleNotes: "설계 전 요구사항을 먼저 정리하는 편",
    domainInterestEvidence: ["배터리 소재별 특성 스터디"],
  },
  {
    caseId: "SVC_B2BSAAS_BIZ",
    caseName: "서비스기획 × B2B SaaS × 경영학",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    major: "경영학",
    projects: [
      "SaaS 제품 온보딩 플로우 개선 기획 — 사용자 이탈 포인트 분석",
    ],
    internships: [
      "B2B SaaS 스타트업 기획 인턴 — 고객사 요구사항 정리, 기능 명세 작성",
    ],
    certifications: [],
    strengths: ["구조화 능력", "고객 관점"],
    workStyleNotes: "고객 문제에서 출발하는 기획을 선호",
    domainInterestEvidence: ["SaaS PLG 전략 스터디"],
  },
  {
    caseId: "DATA_FINANCE_STAT",
    caseName: "데이터분석 × 금융 × 통계학",
    targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    targetIndustryId: "IND_FINANCE_INSURANCE_FINTECH_SECURITIES_ASSET_MANAGEMENT",
    major: "통계학",
    projects: [
      "주식 포트폴리오 리스크 분석 — 분산투자 효과 시뮬레이션",
    ],
    internships: [],
    certifications: ["ADsP", "SQL 개발자"],
    strengths: ["데이터 기반 판단", "수치 해석"],
    workStyleNotes: "데이터 신뢰성을 먼저 확인하는 편",
    domainInterestEvidence: ["금융 데이터 분석 사례 스터디"],
  },
  {
    caseId: "SKIP_NO_TARGET",
    caseName: "target context 부족 케이스 (skipped 확인)",
    targetJobId: "",
    targetIndustryId: "",
    major: "경영학",
    projects: [],
    internships: [],
    certifications: [],
    strengths: [],
    workStyleNotes: "",
    domainInterestEvidence: [],
  },
];

// ─────────────────────────────────────────────
// Check helpers
// ─────────────────────────────────────────────
function check(label, pass, detail = "") {
  const icon = pass ? "✓" : "✗";
  const line = `  ${icon} ${label}${detail ? ` — ${detail}` : ""}`;
  return { pass, line };
}

function noFullAxisPack(payload) {
  const str = JSON.stringify(payload);
  // axisPack has 'axes' with 'explanation' and 'signals' — these should NOT appear in payload
  const hasAxes = str.includes('"explanation"') || str.includes('"signals"') || str.includes('"rawScore"');
  return !hasAxes;
}

function noRawLongText(payload) {
  const str = JSON.stringify(payload);
  // no field value over 300 chars (individual strings)
  const found = Object.values(payload).some((v) => typeof v === "string" && v.length > 300);
  // also scan nested
  const fullScan = (obj) => {
    for (const v of Object.values(obj || {})) {
      if (typeof v === "string" && v.length > 300) return true;
      if (v && typeof v === "object") { if (fullScan(v)) return true; }
    }
    return false;
  };
  return !fullScan(payload);
}

// ─────────────────────────────────────────────
// Run QA
// ─────────────────────────────────────────────
console.log("═══ AI Review Payload QA ═══\n");

let totalPass = 0;
let totalFail = 0;

for (const c of QA_CASES) {
  console.log(`── ${c.caseId}: ${c.caseName}`);

  let result = null;
  let error = null;
  try {
    result = buildNewgradTransitionLiteResult({
      targetJobId: c.targetJobId,
      targetIndustryId: c.targetIndustryId,
      major: c.major,
      projects: c.projects,
      internships: c.internships,
      certifications: c.certifications,
      strengths: c.strengths,
      workStyleNotes: c.workStyleNotes,
      domainInterestEvidence: c.domainInterestEvidence,
    });
  } catch (e) {
    error = e.message;
  }

  const isSkipCase = c.caseId === "SKIP_NO_TARGET";
  const payload = result?.aiReviewPayload ?? null;

  const checks = [];

  if (error) {
    checks.push(check("runtime error", false, error));
  } else if (isSkipCase) {
    // For skip case: either result is empty vm with skipped payload OR we call builder directly
    const directPayload = buildNewgradReportAiReviewPayload(null, {
      targetJobId: c.targetJobId,
      targetIndustryId: c.targetIndustryId,
    });
    checks.push(check("direct call skipped (null vm)", directPayload.status === "skipped", `status=${directPayload.status}`));
    checks.push(check("skipReason set", Boolean(directPayload.skipReason), directPayload.skipReason));

    // Also check payload via empty result
    const emptyPayload = buildNewgradReportAiReviewPayload({}, {});
    checks.push(check("empty vm → skipped", emptyPayload.status === "skipped", `reason=${emptyPayload.skipReason}`));
  } else {
    if (!payload) {
      checks.push(check("aiReviewPayload present", false, "payload is null"));
    } else {
      // Core checks
      checks.push(check("payload.version correct", payload.version === EXPECTED_VERSION, payload.version));
      checks.push(check("status === ready", payload.status === "ready", payload.status));
      checks.push(check("guardContext.noScoreChange", payload.guardContext?.noScoreChange === true));
      checks.push(check("guardContext.noBandChange", payload.guardContext?.noBandChange === true));
      checks.push(check("guardContext.axis1MajorToJobOnly", payload.guardContext?.axis1MajorToJobOnly === true));
      checks.push(check("axisSummary.jobStructure.guard", payload.axisSummary?.jobStructure?.guard === "major_to_job_only",
        payload.axisSummary?.jobStructure?.guard));

      // Size check
      const payloadStr = JSON.stringify(payload);
      const size = payloadStr.length;
      checks.push(check(`payload size ≤ ${MAX_PAYLOAD_SIZE}`, size <= MAX_PAYLOAD_SIZE, `${size} chars`));

      // Serializable
      let serializable = true;
      try { JSON.parse(payloadStr); } catch { serializable = false; }
      checks.push(check("JSON serializable", serializable));

      // No full axisPack
      checks.push(check("no full axisPack in payload", noFullAxisPack(payload)));

      // No raw long text
      checks.push(check("no raw long text (>300 chars)", noRawLongText(payload)));

      // target fields
      checks.push(check("target.jobLabel non-empty", Boolean(payload.target?.jobLabel), payload.target?.jobLabel));
      checks.push(check("target.industryLabel non-empty", Boolean(payload.target?.industryLabel), payload.target?.industryLabel));

      // inputSummary
      checks.push(check("inputSummary.major non-empty", Boolean(payload.inputSummary?.major), payload.inputSummary?.major));

      // axisSummary bands present
      const axisKeys = ["jobStructure", "industryContext", "responsibilityScope", "customerType", "roleCharacter"];
      const bandsPresent = axisKeys.every((k) => Boolean(payload.axisSummary?.[k]?.band));
      checks.push(check("all 5 axis bands present", bandsPresent, axisKeys.map((k) => `${k}=${payload.axisSummary?.[k]?.band}`).join(" ")));

      // currentDraft arrays
      checks.push(check("currentDraft.axisReadSummaryItems is array", Array.isArray(payload.currentDraft?.axisReadSummaryItems),
        `length=${payload.currentDraft?.axisReadSummaryItems?.length}`));
      checks.push(check("currentDraft.goalComparisonRows is array", Array.isArray(payload.currentDraft?.goalComparisonRows),
        `length=${payload.currentDraft?.goalComparisonRows?.length}`));
    }
  }

  let casePassed = 0;
  let caseFailed = 0;
  for (const c of checks) {
    console.log(c.line);
    if (c.pass) casePassed++; else caseFailed++;
  }
  totalPass += casePassed;
  totalFail += caseFailed;
  console.log(`  → ${casePassed} passed, ${caseFailed} failed\n`);
}

// ─────────────────────────────────────────────
// Sample payload print (first ready case)
// ─────────────────────────────────────────────
console.log("── Payload Sample (CIRCUIT_CHEM_BATTERY)");
try {
  const sampleResult = buildNewgradTransitionLiteResult({
    targetJobId: "JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN",
    targetIndustryId: "IND_MANUFACTURING_CHEMICAL_MATERIALS_BATTERY",
    major: "전자공학",
    projects: ["배터리 BMS 회로 설계 — 충방전 제어 로직 구현"],
    internships: ["이차전지 제조사 회로설계 인턴 — 셀 특성 측정"],
    certifications: ["전기기사"],
    strengths: ["꼼꼼한 설계 검토"],
    workStyleNotes: "설계 전 요구사항을 먼저 정리하는 편",
    domainInterestEvidence: [],
  });
  const sample = sampleResult?.aiReviewPayload;
  if (sample) {
    const str = JSON.stringify(sample, null, 2);
    console.log(`  size: ${JSON.stringify(sample).length} chars`);
    console.log(`  version: ${sample.version}`);
    console.log(`  status: ${sample.status}`);
    console.log(`  target: ${JSON.stringify(sample.target)}`);
    console.log(`  axisSummary.jobStructure: ${JSON.stringify(sample.axisSummary?.jobStructure)}`);
    console.log(`  currentDraft.axisReadSummaryItems count: ${sample.currentDraft?.axisReadSummaryItems?.length}`);
    console.log(`  currentDraft.goalComparisonRows count: ${sample.currentDraft?.goalComparisonRows?.length}`);
    console.log(`  guardContext: ${JSON.stringify(sample.guardContext)}`);
  } else {
    console.log("  payload is null — check VM output");
  }
} catch (e) {
  console.log(`  ERROR: ${e.message}`);
}

// ─────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────
console.log(`\n═══ QA Summary ═══`);
console.log(`PASS: ${totalPass} / FAIL: ${totalFail}`);
if (totalFail === 0) {
  console.log("All checks passed.");
} else {
  console.log("Some checks FAILED — review output above.");
  process.exit(1);
}
