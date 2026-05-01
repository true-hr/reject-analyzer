/**
 * run-transition-lite-cases.mjs
 *
 * Transition Lite 엔진 8개 케이스 실행 runner
 * production 코드 수정 없이 read-only 실행만 수행한다.
 *
 * 실행 방법:
 *   node ./scripts/run-transition-lite-cases.mjs
 */

import { buildTransitionLiteResult } from "../src/lib/transitionLite/buildTransitionLiteResult.js";
import { classifyTransition } from "../src/lib/transitionLite/classifyTransition.js";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../artifacts");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "transition-lite-case-results.json");

// ─── fixtures ────────────────────────────────────────────────────────────────

const FIXTURES = [
  {
    id: "case-1-near-move-baseline",
    label: "완전 근접 이동 기준점",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION",
  },
  {
    id: "case-2-same-job-big-industry-shift",
    label: "같은 직무, 산업만 크게 바뀌는 케이스",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION",
  },
  {
    id: "case-3-adjacent-job-same-industry",
    label: "인접 직무, 같은 산업",
    currentJobId: "JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
  },
  {
    id: "case-4-adjacent-job-and-industry-shift",
    label: "인접 직무 + 산업도 변경",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    currentIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE",
    targetJobId: "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
  },
  {
    id: "case-5-similar-family-different-output-structure",
    label: "직무군은 비슷하지만 결과물 구조가 바뀌는 케이스",
    currentJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_BUSINESS_PLANNING",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
  },
  {
    id: "case-6-manufacturing-qa-to-field-engineer",
    label: "제조 현장 기반 → 기술지원 / 필드 계열",
    currentJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    currentIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
    targetJobId: "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
    targetIndustryId: "IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT",
  },
  {
    id: "case-7-professional-service-to-association-context",
    label: "전문서비스 → 협회/단체 특수 맥락",
    currentJobId: "JOB_HR_ORGANIZATION_RECRUITING",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
    targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_ASSOCIATION_ORGANIZATION",
  },
  {
    id: "case-8-current-problem-recheck",
    label: "현재 문제 케이스 재검증용",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
    targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_ASSOCIATION_ORGANIZATION",
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function normalizeForDuplicate(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function hasDuplicates(arr) {
  if (!Array.isArray(arr) || arr.length <= 1) return false;
  const seen = new Set();
  for (const item of arr) {
    const key = normalizeForDuplicate(
      typeof item === "object" && item !== null ? item.title ?? JSON.stringify(item) : item
    );
    if (!key) continue;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function isMeaningful(value) {
  if (Array.isArray(value)) return value.some((v) => isMeaningful(v));
  const text = String(value ?? "").trim();
  return text.length >= 5;
}

function extractInterviewerPoints(transitionReadBlock) {
  const cards = Array.isArray(transitionReadBlock?.cards) ? transitionReadBlock.cards : [];
  const points = [];
  for (const card of cards) {
    const candidates = [card?.summary, card?.body, card?.title, ...(Array.isArray(card?.bullets) ? card.bullets : [])];
    for (const c of candidates) {
      const text = String(c ?? "").trim();
      if (text.length >= 10) {
        points.push(text);
        break;
      }
    }
  }
  return points.slice(0, 5);
}

function buildCaseResult(fixture, report, classification) {
  const topRisks = Array.isArray(report?.topRisks)
    ? report.topRisks.slice(0, 3).map((r) => ({
        key: r?.key ?? null,
        title: r?.title ?? null,
        body: r?.body ?? null,
        comparisonTable: r?.comparisonTable ?? null,
      }))
    : [];

  const whyThisRead = Array.isArray(report?.whyThisRead)
    ? report.whyThisRead.slice(0, 5)
    : [];

  const interviewerPoints = extractInterviewerPoints(report?.transitionReadBlock);

  const targetJobRead = report?.targetJobRead
    ? {
        title: report.targetJobRead.title ?? null,
        summary: report.targetJobRead.summary ?? null,
        body: report.targetJobRead.body ?? null,
        bullets: Array.isArray(report.targetJobRead.bullets) ? report.targetJobRead.bullets : [],
      }
    : null;

  const targetIndustryRead = report?.targetIndustryRead
    ? {
        label: report.targetIndustryRead.label ?? null,
        title: report.targetIndustryRead.title ?? null,
        summary: report.targetIndustryRead.summary ?? null,
        bullets: Array.isArray(report.targetIndustryRead.bullets) ? report.targetIndustryRead.bullets : [],
      }
    : null;

  const industryTraitsAsset = report?.industryTraitsAsset
    ? {
        summaryTemplate: report.industryTraitsAsset.summaryTemplate ?? null,
        whyIndustryMatters: report.industryTraitsAsset.whyIndustryMatters ?? null,
        businessStructure: report.industryTraitsAsset.businessStructure ?? null,
        evaluationCriteria: report.industryTraitsAsset.evaluationCriteria ?? null,
      }
    : null;

  const quickChecks = {
    hasTopRisks: topRisks.length > 0,
    hasWhyThisRead: isMeaningful(whyThisRead),
    hasInterviewerPoints: isMeaningful(interviewerPoints),
    hasTargetJobRead: isMeaningful(targetJobRead?.title) || isMeaningful(targetJobRead?.summary),
    hasTargetIndustryRead: isMeaningful(targetIndustryRead?.label) || isMeaningful(targetIndustryRead?.summary),
    duplicateTopRiskTitles: hasDuplicates(topRisks),
    duplicateWhyLines: hasDuplicates(whyThisRead),
  };

  return {
    id: fixture.id,
    label: fixture.label,
    input: {
      currentJobId: fixture.currentJobId,
      currentIndustryId: fixture.currentIndustryId,
      targetJobId: fixture.targetJobId,
      targetIndustryId: fixture.targetIndustryId,
    },
    classification: {
      jobDistance: classification?.jobDistance ?? null,
      industryDistance: classification?.industryDistance ?? null,
      roleWeightShift: classification?.roleWeightShift ?? null,
      responsibilityShift: classification?.responsibilityShift ?? null,
    },
    report: {
      heroSummary: report?.heroSummary ?? null,
      topRisks,
      whyThisRead,
      whyThisReadSupportLine: report?.whyThisReadSupportLine ?? null,
      interviewerPoints,
      targetJobRead,
      targetIndustryRead,
      industryTraitsAsset,
    },
    quickChecks,
    errors: [],
  };
}

// ─── runner ───────────────────────────────────────────────────────────────────

function runCase(fixture) {
  const payload = {
    currentJobId: fixture.currentJobId,
    currentIndustryId: fixture.currentIndustryId,
    targetJobId: fixture.targetJobId,
    targetIndustryId: fixture.targetIndustryId,
  };

  let classification = null;
  let report = null;
  const errors = [];

  try {
    classification = classifyTransition(payload);
  } catch (err) {
    errors.push(`classifyTransition failed: ${err?.message ?? String(err)}`);
  }

  try {
    report = buildTransitionLiteResult(payload);
  } catch (err) {
    errors.push(`buildTransitionLiteResult failed: ${err?.message ?? String(err)}`);
  }

  const result = buildCaseResult(fixture, report ?? {}, classification ?? {});
  result.errors = errors;
  return result;
}

function formatOneLiner(result) {
  const c = result.classification;
  const topRiskTitle = result.report.topRisks?.[0]?.title ?? "(none)";
  const truncated = topRiskTitle.length > 20 ? topRiskTitle.slice(0, 20) + "…" : topRiskTitle;
  const errFlag = result.errors.length > 0 ? " | ERROR" : "";
  return `[${result.id}] OK | topRisk=${truncated} | jobDistance=${c.jobDistance} | industryDistance=${c.industryDistance}${errFlag}`;
}

function detectAnomalies(result) {
  const issues = [];
  if (!result.quickChecks.hasTopRisks) {
    issues.push("상위 리스크가 비어 있음");
  }
  if (!result.quickChecks.hasWhyThisRead) {
    issues.push("왜 이렇게 읽혔나가 비어 있음");
  }
  if (result.report.industryTraitsAsset === null) {
    issues.push("지원 산업 특징(industryTraitsAsset)이 null");
  }
  if (result.quickChecks.duplicateTopRiskTitles) {
    issues.push("topRisk 제목 중복 감지");
  }
  if (result.quickChecks.duplicateWhyLines) {
    issues.push("whyThisRead 중복 감지");
  }
  if (!result.quickChecks.hasTargetJobRead) {
    issues.push("targetJobRead 내용 없음");
  }
  if (!result.quickChecks.hasTargetIndustryRead) {
    issues.push("targetIndustryRead 내용 없음");
  }
  if (result.errors.length > 0) {
    issues.push(`실행 오류: ${result.errors.join(" / ")}`);
  }
  return issues;
}

// ─── main ─────────────────────────────────────────────────────────────────────

const results = [];
let successCount = 0;
let errorCount = 0;

for (const fixture of FIXTURES) {
  let result;
  try {
    result = runCase(fixture);
    if (result.errors.length > 0) {
      errorCount += 1;
    } else {
      successCount += 1;
    }
  } catch (fatalErr) {
    result = {
      id: fixture.id,
      label: fixture.label,
      input: {
        currentJobId: fixture.currentJobId,
        currentIndustryId: fixture.currentIndustryId,
        targetJobId: fixture.targetJobId,
        targetIndustryId: fixture.targetIndustryId,
      },
      classification: { jobDistance: null, industryDistance: null, roleWeightShift: null, responsibilityShift: null },
      report: { heroSummary: null, topRisks: [], whyThisRead: [], whyThisReadSupportLine: null, interviewerPoints: [], targetJobRead: null, targetIndustryRead: null, industryTraitsAsset: null },
      quickChecks: { hasTopRisks: false, hasWhyThisRead: false, hasInterviewerPoints: false, hasTargetJobRead: false, hasTargetIndustryRead: false, duplicateTopRiskTitles: false, duplicateWhyLines: false },
      errors: [`FATAL: ${fatalErr?.message ?? String(fatalErr)}`],
    };
    errorCount += 1;
  }

  console.log(formatOneLiner(result));
  results.push(result);
}

// 이상 징후 케이스 출력
const anomalyCases = results
  .map((r) => ({ id: r.id, label: r.label, issues: detectAnomalies(r) }))
  .filter((r) => r.issues.length > 0);

if (anomalyCases.length > 0) {
  console.log("\n⚠️  이상 징후 케이스:");
  for (const ac of anomalyCases) {
    console.log(`  [${ac.id}] ${ac.label}`);
    for (const issue of ac.issues) {
      console.log(`    - ${issue}`);
    }
  }
}

// 전체 요약
console.log(`\n─── 전체 요약 ───`);
console.log(`total cases : ${results.length}`);
console.log(`success     : ${successCount}`);
console.log(`error       : ${errorCount}`);
console.log(`output json : ${OUTPUT_FILE}`);

// JSON 저장
mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf-8");
