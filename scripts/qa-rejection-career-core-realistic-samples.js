import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildRejectionCareerCoreSignal } from "../src/lib/preciseAnalysis/buildRejectionCareerCoreSignal.js";
import {
  REJECTION_CAREER_CORE_REALISTIC_QA_CURRENT_DATE,
  rejectionCareerCoreRealisticQaCases,
} from "../src/lib/preciseAnalysis/__fixtures__/rejectionCareerCoreRealisticQaCases.js";

const uiSource = fs.readFileSync(path.join(process.cwd(), "src/components/input/PreciseAnalysisFlow.jsx"), "utf8");
const hasMonthBucketCopyPolish =
  /개월 수는 정밀한 기간 산정이 아닌 항목 기준 참고값입니다/.test(uiSource) &&
  /중복 기간이나 세부 기여도는 별도 보정하지 않습니다/.test(uiSource);

function bucket(signal, key) {
  return Number(signal?.monthBuckets?.[key] || 0);
}

function targetRole(signal) {
  return signal?.target?.roleFamily || "";
}

function targetIndustry(signal) {
  return signal?.target?.industryDomain || "";
}

function buildSignal(testCase) {
  return buildRejectionCareerCoreSignal({
    resumeProfile: testCase.resumeProfile,
    jdText: testCase.jdText,
    targetRole: testCase.targetRole,
    targetCompany: testCase.targetCompany,
    targetIndustry: testCase.targetIndustry,
    currentDate: REJECTION_CAREER_CORE_REALISTIC_QA_CURRENT_DATE,
  });
}

function judge(testCase, signal) {
  const issues = [];
  const status = signal.status;
  const role = targetRole(signal);
  const industry = targetIndustry(signal);
  const direct = bucket(signal, "direct");
  const adjacent = bucket(signal, "adjacent");
  const transferable = bucket(signal, "transferable");
  const unrelated = bucket(signal, "unrelated");
  const unknown = bucket(signal, "unknown");

  if (testCase.expected === "ready" && status !== "ready") {
    issues.push("expected_ready_but_skipped");
  }
  if (testCase.expected === "skipped" && status !== "skipped") {
    issues.push("expected_skipped_but_ready");
  }
  if (testCase.expected === "ready_preferred" && status !== "ready") {
    issues.push("korean_only_inference_gap");
  }
  if (testCase.expected === "inference_gap_check" && status !== "ready") {
    issues.push("korean_only_inference_gap");
  }
  if (testCase.id === "real-002-pm-saas-bio-quality" && status === "ready" && direct > 0) {
    issues.push("cross_domain_direct_months");
  }
  if (testCase.id === "real-007-operations-cs-process" && status === "ready" && role === "product_planning_pm") {
    issues.push("operations_over_inferred_as_pm");
  }
  if (testCase.id === "real-007-operations-cs-process" && status === "ready" && role === "production_quality") {
    issues.push("operations_quality_word_over_inferred_as_production_quality");
  }
  if (testCase.id === "real-010-long-jd-pm-saas" && status === "ready" && direct > 24 && unrelated === 0) {
    issues.push("long_jd_may_overstate_direct_relevance");
  }
  if (testCase.id === "real-013-short-tenures-marketing" && status === "ready" && direct + adjacent + transferable > 0 && !hasMonthBucketCopyPolish) {
    issues.push("month_bucket_may_read_too_precise_for_short_tenures");
  }
  if (testCase.id === "real-014-same-industry-different-role" && status === "ready" && direct > 0 && adjacent + transferable + unrelated === 0) {
    issues.push("same_industry_different_role_direct_dominates");
  }
  if (testCase.id === "real-015-same-role-different-industry" && status === "ready" && direct > 0 && adjacent + transferable + unrelated === 0) {
    issues.push("same_role_different_industry_direct_dominates");
  }
  if (status === "ready" && role === "product_planning_pm" && !/pm|product|saas|roadmap|requirements|제품|기획|로드맵|요구사항/i.test(testCase.jdText)) {
    issues.push("pm_saas_over_inference_check");
  }
  if (status === "ready" && direct + adjacent + transferable + unrelated + unknown === 0) {
    issues.push("ready_without_month_buckets");
  }

  const qaStatus = issues.some((issue) => issue.startsWith("expected_")) ? "FAIL" : issues.length ? "REVIEW" : "PASS";

  return {
    case: testCase.id,
    title: testCase.title,
    resumeType: testCase.resumeType,
    jdType: testCase.jdType,
    expected: testCase.expected,
    actualStatus: status,
    reason: signal.reason || "",
    targetRole: role,
    targetIndustry: industry,
    primaryFit: signal.primaryFitLevel,
    directMonths: direct,
    adjacentMonths: adjacent,
    transferableMonths: transferable,
    unrelatedMonths: unrelated,
    unknownMonths: unknown,
    qaStatus,
    issues: issues.join(", "),
    expectedNote: testCase.expectedNote,
  };
}

assert.ok(rejectionCareerCoreRealisticQaCases.length >= 10, "At least 10 realistic QA cases are required");

const rows = rejectionCareerCoreRealisticQaCases.map((testCase) => judge(testCase, buildSignal(testCase)));
const readyCount = rows.filter((row) => row.actualStatus === "ready").length;
const skippedCount = rows.filter((row) => row.actualStatus === "skipped").length;
const passCount = rows.filter((row) => row.qaStatus === "PASS").length;
const reviewCount = rows.filter((row) => row.qaStatus === "REVIEW").length;
const failCount = rows.filter((row) => row.qaStatus === "FAIL").length;
const koreanOnlyRows = rows.filter((row) => /Korean-only/.test(row.jdType));
const koreanOnlyReady = koreanOnlyRows.filter((row) => row.actualStatus === "ready").length;
const koreanOnlySkipped = koreanOnlyRows.filter((row) => row.actualStatus === "skipped").length;

console.table(rows.map((row) => ({
  case: row.case,
  expected: row.expected,
  status: row.actualStatus,
  targetRole: row.targetRole,
  targetIndustry: row.targetIndustry,
  primary: row.primaryFit,
  direct: row.directMonths,
  adjacent: row.adjacentMonths,
  transferable: row.transferableMonths,
  unrelated: row.unrelatedMonths,
  unknown: row.unknownMonths,
  qa: row.qaStatus,
  issues: row.issues,
})));

console.log(JSON.stringify({
  total: rows.length,
  ready: readyCount,
  skipped: skippedCount,
  pass: passCount,
  review: reviewCount,
  fail: failCount,
  koreanOnly: {
    total: koreanOnlyRows.length,
    ready: koreanOnlyReady,
    skipped: koreanOnlySkipped,
  },
}, null, 2));

assert.equal(failCount, 0, "Realistic QA produced FAIL cases");
assert.ok(readyCount > 0, "Expected at least one ready signal");
assert.ok(skippedCount > 0, "Expected at least one skipped signal for conservative coverage");

console.log("PASS rejection Career Core realistic samples QA checks");
