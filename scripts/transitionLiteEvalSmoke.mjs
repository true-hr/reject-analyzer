/**
 * transitionLiteEvalSmoke.mjs
 *
 * Transition Lite accuracy eval runner — risk / fit / explanation 종합 검증.
 *
 * 실행 방법:
 *   node ./scripts/transitionLiteEvalSmoke.mjs
 */

import { buildTransitionLiteResult } from "../src/lib/transitionLite/buildTransitionLiteResult.js";
import { classifyTransition } from "../src/lib/transitionLite/classifyTransition.js";

// ─── risk key constants ───────────────────────────────────────────────────────

const RISK_INDUSTRY_CONTEXT_SHIFT = "RISK_INDUSTRY_CONTEXT_SHIFT";
const RISK_JOB_EXPECTATION_SHIFT = "RISK_JOB_EXPECTATION_SHIFT";
const RISK_SCOPE_REINTERPRETATION = "RISK_SCOPE_REINTERPRETATION";
const RISK_EXECUTION_LINK_CHECK = "RISK_EXECUTION_LINK_CHECK";
const RISK_STRATEGIC_VIEW_CHECK = "RISK_STRATEGIC_VIEW_CHECK";
const RISK_RESPONSIBILITY_EXPANSION = "RISK_RESPONSIBILITY_EXPANSION";

const JOB_RISK_KEYS = [
  RISK_JOB_EXPECTATION_SHIFT,
  RISK_SCOPE_REINTERPRETATION,
  RISK_EXECUTION_LINK_CHECK,
  RISK_STRATEGIC_VIEW_CHECK,
  RISK_RESPONSIBILITY_EXPANSION,
];

const INDUSTRY_ROW_KEYS_REQUIRED = [
  "industry_customer_structure",
  "industry_buying_motion",
  "industry_decision_structure",
  "industry_operating_context",
];

const JOB_ROW_KEYS_REQUIRED = [
  "job_key_outputs",
  "job_scope",
  "job_core_role",
  "job_decision_criteria",
];

// ─── generic fallback patterns ────────────────────────────────────────────────

const GENERIC_PATTERNS = [
  "지원 직무 기준에 맞는 경험인지 확인",
  "새 업계에서 통할 경험인지 확인",
  "추가 확인이 필요합니다",
  "면접에서 설명이 중요합니다",
  "면접에서 설명",
  "확인이 필요",
  "기준에 맞는 경험",
];

// ─── fixtures ─────────────────────────────────────────────────────────────────
// 실존 canonical id만 사용. 추측 금지.

const FIXTURES = [
  {
    id: "eval-01-same-job-same-industry",
    label: "DevOps + B2B SaaS → DevOps + B2B SaaS (완전 동일 이동)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    expectedCategory: "same_job_same_industry",
    allowEmptyRiskKeys: true,  // same+same 조합은 risk 없음이 정상
    mustHaveRiskKeys: [],
    mustNotTop1RiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "all axes high (near 100 displayScore across all 5)",
    explanationExpectation: "empty or minimal — no transition gap to explain",
  },
  {
    id: "eval-02-same-job-adjacent-industry-high-overlap",
    label: "DevOps + B2B SaaS → DevOps + Enterprise Solution (인접 산업, 유사도 높음)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION",
    expectedCategory: "same_job_adjacent_industry_high_overlap",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    mustNotTop1RiskKeys: [],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "industryContext axis lower than same-industry baseline",
    explanationExpectation: "SaaS/엔터프라이즈 관련 구체 표현 포함",
  },
  {
    id: "eval-03-same-job-adjacent-industry-low-overlap",
    label: "QA + 전자/가전 → QA + 기계/장비 (같은 제조 섹터, 구조 차이 있음)",
    currentJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    currentIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
    targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    targetIndustryId: "IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT",
    expectedCategory: "same_job_adjacent_industry_low_overlap",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    mustNotTop1RiskKeys: [],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "industryContext axis noticeably below baseline",
    explanationExpectation: "제조/품질/산업 키워드 포함",
  },
  {
    id: "eval-04-same-job-cross-industry",
    label: "DevOps + B2B SaaS → DevOps + 공공기관 (직무 동일, 산업 대폭 이동)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION",
    expectedCategory: "same_job_cross_industry",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    mustNotTop1RiskKeys: [RISK_JOB_EXPECTATION_SHIFT],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "industryContext axis significantly lower than same-industry baseline",
    explanationExpectation: "공공/기관/IT인프라 관련 표현 포함",
  },
  {
    id: "eval-05-cross-job-same-industry",
    label: "서비스기획 + B2C → 백엔드개발 + B2C (직무 교차, 산업 동일)",
    currentJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedCategory: "cross_job_same_industry",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [],  // job risk (RISK_JOB_EXPECTATION_SHIFT or RISK_SCOPE_REINTERPRETATION) 기대
    mustNotTop1RiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "jobStructure axis lower; industryContext near baseline",
    explanationExpectation: "직무 전환/직무 기대 관련 표현 포함",
    crossJobExpected: true,
  },
  {
    id: "eval-06-cross-job-adjacent-industry",
    label: "제조QA + 전자/가전 → 기술지원/필드 + 기계/장비 (직무 교차 + 인접 산업)",
    currentJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    currentIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
    targetJobId: "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
    targetIndustryId: "IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT",
    expectedCategory: "cross_job_adjacent_industry",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [],  // job risk + industry risk 둘 다 기대하지만 순서는 불확정
    mustNotTop1RiskKeys: [],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "both jobStructure and industryContext axes lower than baseline",
    explanationExpectation: "제조/기술지원/현장 관련 표현 포함",
    crossJobExpected: true,
    crossIndustryExpected: true,
  },
  {
    id: "eval-07-cross-job-cross-industry",
    label: "채용 + HR서비스 → 대외협력 + 협회/단체 (직무 + 산업 동시 교차)",
    currentJobId: "JOB_HR_ORGANIZATION_RECRUITING",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
    targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_ASSOCIATION_ORGANIZATION",
    expectedCategory: "cross_job_cross_industry",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    mustNotTop1RiskKeys: [],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "both jobStructure and industryContext axes significantly lower",
    explanationExpectation: "채용/협회/대외 관련 표현 포함",
    crossJobExpected: true,
    crossIndustryExpected: true,
  },
  {
    id: "eval-08-same-family-responsibility-expansion",
    label: "CS운영 + 온라인커머스 → 운영기획 + 아웃소싱 (유사 직무군, 책임 범위 확장)",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    currentIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE",
    targetJobId: "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
    expectedCategory: "same_family_responsibility_expansion",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [],  // RISK_RESPONSIBILITY_EXPANSION 또는 RISK_SCOPE_REINTERPRETATION 기대
    mustNotTop1RiskKeys: [],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "responsibilityScope axis may vary; industryContext reflects transition",
    explanationExpectation: "운영기획/CS/책임 범위 관련 표현 포함",
    responsibilityExpected: "expansion",
  },
  {
    id: "eval-09-strategy-to-execution",
    label: "전략기획 + 컨설팅 → 서비스운영 + 아웃소싱 (전략→실행 축 이동)",
    currentJobId: "JOB_BUSINESS_STRATEGY",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    targetJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
    expectedCategory: "strategy_to_execution",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [],  // RISK_EXECUTION_LINK_CHECK 또는 RISK_SCOPE_REINTERPRETATION 기대
    mustNotTop1RiskKeys: [],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "roleCharacter axis reflects strategy→execution shift",
    explanationExpectation: "전략/실행/운영 관련 표현 포함",
    crossJobExpected: true,
    strategyExecutionExpected: "strategy_to_execution",
  },
  {
    id: "eval-10-full-cross-high-risk",
    label: "채용 + HR서비스 → 현장서비스 + 공공기관 (고위험 전체 교차)",
    currentJobId: "JOB_HR_ORGANIZATION_RECRUITING",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
    targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION",
    expectedCategory: "full_cross_high_risk",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    mustNotTop1RiskKeys: [],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "most axes significantly lower than baseline",
    explanationExpectation: "공공/채용/현장 관련 표현 포함",
    crossJobExpected: true,
    crossIndustryExpected: true,
  },
  {
    id: "eval-11-execution-to-strategy",
    label: "서비스운영 + 컨설팅리서치 → 전략기획 + 컨설팅리서치 (실행→전략 축 이동)",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    targetJobId: "JOB_BUSINESS_STRATEGY",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    expectedCategory: "execution_to_strategy",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [],  // RISK_STRATEGIC_VIEW_CHECK 또는 RISK_SCOPE_REINTERPRETATION 기대
    mustNotTop1RiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],  // same industry → industry risk top1 아님
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "roleCharacter axis reflects execution→strategy shift; industryContext stable",
    explanationExpectation: "전략/기획/실행/운영 관련 표현 포함",
    crossJobExpected: true,
    strategyExecutionExpected: "execution_to_strategy",
  },
  {
    id: "eval-12-full-cross-b2b-stakeholder",
    label: "B2B영업 + 엔터프라이즈솔루션 → 컨설팅 + 컨설팅리서치 (full cross, B2B 이해관계자 유사)",
    currentJobId: "JOB_SALES_B2B_SALES",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION",
    targetJobId: "JOB_RESEARCH_PROFESSIONAL_CONSULTING",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    expectedCategory: "full_cross_similar_stakeholder",
    allowEmptyRiskKeys: false,
    mustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    mustNotTop1RiskKeys: [],
    requiredJobRows: JOB_ROW_KEYS_REQUIRED,
    requiredIndustryRows: INDUSTRY_ROW_KEYS_REQUIRED,
    radarExpectation: "jobStructure drops; customerType relatively stable (both B2B enterprise context)",
    explanationExpectation: "영업/컨설팅/B2B 관련 표현 포함",
    crossJobExpected: true,
    crossIndustryExpected: true,
  },
];

// ─── VM extraction helpers ────────────────────────────────────────────────────
// NOTE: comparison rows are in topRisks[i].comparisonTable, NOT in a sections array.

function extractFromVM(vm) {
  const topRisks = Array.isArray(vm?.topRisks) ? vm.topRisks : [];
  const selectedRiskKeys = topRisks.map((r) => r?.key).filter(Boolean);
  const topRiskKey = topRisks[0]?.key ?? null;
  const topRiskHeadline = topRisks[0]?.title ?? null;

  const industryRiskObj = topRisks.find((r) => r?.key === RISK_INDUSTRY_CONTEXT_SHIFT);
  // comparisonTable shape is { title, columns, rows: [] } — not a plain array
  const industryCompTable = industryRiskObj?.comparisonTable;
  const industryRows = Array.isArray(industryCompTable?.rows) ? industryCompTable.rows
    : Array.isArray(industryCompTable) ? industryCompTable : [];

  const jobRiskObj = topRisks.find(
    (r) => r?.key === RISK_JOB_EXPECTATION_SHIFT || r?.key === RISK_SCOPE_REINTERPRETATION
  );
  const jobCompTable = jobRiskObj?.comparisonTable;
  const jobRows = Array.isArray(jobCompTable?.rows) ? jobCompTable.rows
    : Array.isArray(jobCompTable) ? jobCompTable : [];

  const explanation = Array.isArray(vm?.whyThisRead) ? vm.whyThisRead.filter(Boolean) : [];

  return { selectedRiskKeys, topRiskKey, topRiskHeadline, industryRows, jobRows, explanation };
}

function hasFitScore(row) {
  const s = row?.fitScore;
  return typeof s === "number" && Number.isFinite(s) && s >= 1 && s <= 5;
}

function isFitScoreValidInt(row) {
  const s = row?.fitScore;
  if (!Number.isFinite(s)) return false;
  return Number.isInteger(s) && s >= 1 && s <= 5;
}

function detectGenericFallback(texts) {
  if (!texts || texts.length === 0) return { isGeneric: false, matches: [] };
  const combined = texts.join(" ").toLowerCase();
  const matches = GENERIC_PATTERNS.filter((p) => combined.includes(p.toLowerCase()));
  return { isGeneric: matches.length > 0, matches };
}

function hasSpecificToken(texts, fixture) {
  // Check if explanation references job/industry labels or structural keywords
  const combined = texts.join(" ").toLowerCase();
  const structKeywords = ["고객", "구매", "의사결정", "운영", "책임", "산출물", "역할", "맥락", "전환"];
  return structKeywords.some((kw) => combined.includes(kw));
}

// ─── runner ───────────────────────────────────────────────────────────────────

function runCase(fixture) {
  const { currentJobId, currentIndustryId, targetJobId, targetIndustryId } = fixture;

  let vm = null;
  let classification = null;
  let err = null;

  try {
    classification = classifyTransition({ currentJobId, targetJobId, currentIndustryId, targetIndustryId });
    vm = buildTransitionLiteResult({ currentJobId, currentIndustryId, targetJobId, targetIndustryId });
  } catch (e) {
    err = e;
  }

  const { selectedRiskKeys, topRiskKey, topRiskHeadline, industryRows, jobRows, explanation } =
    extractFromVM(vm);

  const industryRowKeys = industryRows.map((r) => r?.rowKey).filter(Boolean);
  const jobRowKeys = jobRows.map((r) => r?.rowKey).filter(Boolean);

  const industryFitScorePresence = Object.fromEntries(
    INDUSTRY_ROW_KEYS_REQUIRED.map((k) => {
      const row = industryRows.find((r) => r?.rowKey === k);
      return [k, row ? hasFitScore(row) : false];
    })
  );
  const jobFitScorePresence = Object.fromEntries(
    JOB_ROW_KEYS_REQUIRED.map((k) => {
      const row = jobRows.find((r) => r?.rowKey === k);
      return [k, row ? hasFitScore(row) : false];
    })
  );

  const isCrossIndustry =
    classification?.industryDistance === "cross" || classification?.industryDistance === "adjacent";
  const isCrossJob = classification?.jobDistance === "cross" || classification?.jobDistance === "adjacent";

  const genericCheck = detectGenericFallback(explanation);
  const hasSpecific = hasSpecificToken(explanation, fixture);
  const explanationSummaryPresent = explanation.length > 0;

  // ── FAIL判定 ──────────────────────────────────────────────────────────────
  const failures = [];
  const warnings = [];

  if (err) {
    failures.push(`EXCEPTION: ${err.message}`);
    return buildResult(fixture, classification, { selectedRiskKeys, topRiskKey, topRiskHeadline, industryRows, industryRowKeys, jobRows, jobRowKeys, industryFitScorePresence, jobFitScorePresence, explanation, explanationSummaryPresent }, failures, warnings);
  }

  if (!fixture.allowEmptyRiskKeys && selectedRiskKeys.length === 0) {
    failures.push("selectedRiskKeys 비어 있음");
  }

  if (!fixture.allowEmptyRiskKeys && !topRiskKey) {
    failures.push("topRiskKey 없음");
  }

  if (!fixture.allowEmptyRiskKeys && !topRiskHeadline) {
    failures.push("topRiskHeadline 없음");
  }

  // industry rows: only required if RISK_INDUSTRY_CONTEXT_SHIFT is selected
  if (selectedRiskKeys.includes(RISK_INDUSTRY_CONTEXT_SHIFT)) {
    const missingIndustryRows = INDUSTRY_ROW_KEYS_REQUIRED.filter((k) => !industryRowKeys.includes(k));
    if (missingIndustryRows.length > 0) {
      failures.push(`industry 필수 행 누락: ${missingIndustryRows.join(", ")}`);
    }
    const missingIndustryFit = INDUSTRY_ROW_KEYS_REQUIRED.filter((k) => !industryFitScorePresence[k]);
    if (missingIndustryFit.length > 0) {
      failures.push(`industry row fitScore 누락: ${missingIndustryFit.join(", ")}`);
    }
    const invalidFit = industryRows.filter((r) => r?.fitScore !== undefined && !isFitScoreValidInt(r));
    if (invalidFit.length > 0) {
      failures.push(`industry row fitScore 1~5 정수 아님: ${invalidFit.map((r) => `${r.rowKey}=${r.fitScore}`).join(", ")}`);
    }
  }

  // job rows: only required if job risk is selected
  const hasJobRiskInVM = selectedRiskKeys.some((k) => k === RISK_JOB_EXPECTATION_SHIFT || k === RISK_SCOPE_REINTERPRETATION);
  if (hasJobRiskInVM) {
    const missingJobRows = JOB_ROW_KEYS_REQUIRED.filter((k) => !jobRowKeys.includes(k));
    if (missingJobRows.length > 0) {
      failures.push(`job 필수 행 누락: ${missingJobRows.join(", ")}`);
    }
    const missingJobFit = JOB_ROW_KEYS_REQUIRED.filter((k) => !jobFitScorePresence[k]);
    if (missingJobFit.length > 0) {
      failures.push(`job row fitScore 누락: ${missingJobFit.join(", ")}`);
    }
    const invalidJobFit = jobRows.filter((r) => r?.fitScore !== undefined && !isFitScoreValidInt(r));
    if (invalidJobFit.length > 0) {
      failures.push(`job row fitScore 1~5 정수 아님: ${invalidJobFit.map((r) => `${r.rowKey}=${r.fitScore}`).join(", ")}`);
    }
  }

  // cross industry FAIL: RISK_INDUSTRY_CONTEXT_SHIFT must be present
  if (isCrossIndustry && !selectedRiskKeys.includes(RISK_INDUSTRY_CONTEXT_SHIFT)) {
    failures.push(`cross/adjacent industry인데 RISK_INDUSTRY_CONTEXT_SHIFT 없음 (industryDistance=${classification?.industryDistance})`);
  }

  // cross job FAIL: at least one job risk must be present
  if (fixture.crossJobExpected && isCrossJob && !selectedRiskKeys.some((k) => JOB_RISK_KEYS.includes(k))) {
    failures.push(`cross/adjacent job인데 job expectation/scope/responsibility 계열 risk 전혀 없음 (jobDistance=${classification?.jobDistance})`);
  }

  // mustHaveRiskKeys
  for (const key of fixture.mustHaveRiskKeys ?? []) {
    if (!selectedRiskKeys.includes(key)) {
      failures.push(`mustHaveRiskKey 누락: ${key}`);
    }
  }

  // mustNotTop1RiskKeys
  for (const key of fixture.mustNotTop1RiskKeys ?? []) {
    if (topRiskKey === key) {
      failures.push(`mustNotTop1 위반: ${key}가 top1으로 표면화`);
    }
  }

  // strategy/execution shift check
  if (fixture.strategyExecutionExpected && classification) {
    const stratExecRisks = [RISK_STRATEGIC_VIEW_CHECK, RISK_EXECUTION_LINK_CHECK, RISK_SCOPE_REINTERPRETATION];
    if (!selectedRiskKeys.some((k) => stratExecRisks.includes(k))) {
      failures.push(`strategyExecutionExpected=${fixture.strategyExecutionExpected}인데 전략/실행 계열 risk 없음 (기대: STRATEGIC_VIEW/EXECUTION_LINK/SCOPE 중 하나)`);
    }
  }

  // responsibility expansion check
  if (fixture.responsibilityExpected === "expansion" && classification) {
    const respRisks = [RISK_RESPONSIBILITY_EXPANSION, RISK_SCOPE_REINTERPRETATION];
    if (!selectedRiskKeys.some((k) => respRisks.includes(k))) {
      failures.push(`responsibilityExpected=expansion인데 책임/범위 확장 계열 risk 없음 (기대: RESPONSIBILITY_EXPANSION/SCOPE_REINTERPRETATION 중 하나)`);
    }
  }

  // explanation generic fallback (WARN unless no specific token AND generic patterns found)
  if (explanationSummaryPresent && genericCheck.isGeneric && !hasSpecific) {
    failures.push(`explanation generic fallback 의심: "${genericCheck.matches[0]}"`);
  } else if (explanationSummaryPresent && genericCheck.isGeneric) {
    warnings.push(`explanation generic 패턴 포함 (but specific token도 존재): "${genericCheck.matches[0]}"`);
  }

  return buildResult(fixture, classification, { selectedRiskKeys, topRiskKey, topRiskHeadline, industryRows, industryRowKeys, jobRows, jobRowKeys, industryFitScorePresence, jobFitScorePresence, explanation, explanationSummaryPresent }, failures, warnings);
}

function buildResult(fixture, classification, data, failures, warnings) {
  return {
    id: fixture.id,
    label: fixture.label,
    expectedCategory: fixture.expectedCategory,
    pass: failures.length === 0,
    failures,
    warnings,
    classification: classification
      ? {
          jobDistance: classification.jobDistance,
          industryDistance: classification.industryDistance,
          roleWeightShift: classification.roleWeightShift,
          responsibilityShift: classification.responsibilityShift,
        }
      : null,
    ...data,
  };
}

// ─── summary stats ────────────────────────────────────────────────────────────

function buildSummary(results) {
  const total = results.length;
  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.filter((r) => !r.pass).length;
  const warnCount = results.filter((r) => r.warnings.length > 0).length;

  const allFailures = results.flatMap((r) => r.failures);
  const allWarnings = results.flatMap((r) => r.warnings);

  const riskFailures = allFailures.filter((f) => f.includes("RISK") || f.includes("risk"));
  const fitFailures = allFailures.filter((f) => f.includes("fitScore") || f.includes("fit"));
  const rowFailures = allFailures.filter((f) => f.includes("행 누락") || f.includes("rowKey"));
  const explanationFailures = allFailures.filter((f) => f.includes("explanation") || f.includes("generic"));

  // most frequent failing risk key
  const riskKeyMentions = {};
  for (const f of allFailures) {
    for (const key of Object.values({
      RISK_INDUSTRY_CONTEXT_SHIFT,
      RISK_JOB_EXPECTATION_SHIFT,
      RISK_SCOPE_REINTERPRETATION,
      RISK_EXECUTION_LINK_CHECK,
      RISK_STRATEGIC_VIEW_CHECK,
      RISK_RESPONSIBILITY_EXPANSION,
    })) {
      if (f.includes(key)) riskKeyMentions[key] = (riskKeyMentions[key] ?? 0) + 1;
    }
  }
  const topFailingRisk =
    Object.entries(riskKeyMentions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  // most frequent missing row key
  const rowKeyMentions = {};
  for (const f of allFailures.concat(allWarnings)) {
    const matches = f.match(/\w+_(?:customer_structure|buying_motion|decision_structure|operating_context|key_outputs|scope|core_role|decision_criteria)/g) ?? [];
    for (const m of matches) rowKeyMentions[m] = (rowKeyMentions[m] ?? 0) + 1;
  }
  const topMissingRow = Object.entries(rowKeyMentions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  // top repeated generic headlines
  const topRiskHeadlines = results.map((r) => r.topRiskHeadline).filter(Boolean);
  const headlineCounts = {};
  for (const h of topRiskHeadlines) headlineCounts[h] = (headlineCounts[h] ?? 0) + 1;
  const topGenericHeadlineCount = Object.values(headlineCounts).filter((c) => c > 1).length;

  // monotonicity check: eval-01 (same) ≤ eval-02 (adjacent) ≤ eval-04 (cross) in risk count
  let monotonicityFailureCount = 0;
  const monoPairs = [
    { lessId: "eval-01-same-job-same-industry", moreId: "eval-02-same-job-adjacent-industry-high-overlap" },
    { lessId: "eval-02-same-job-adjacent-industry-high-overlap", moreId: "eval-04-same-job-cross-industry" },
  ];
  for (const { lessId, moreId } of monoPairs) {
    const lessR = results.find((r) => r.id === lessId);
    const moreR = results.find((r) => r.id === moreId);
    if (lessR && moreR && lessR.selectedRiskKeys.length > moreR.selectedRiskKeys.length) {
      monotonicityFailureCount++;
    }
  }

  // extreme score bias: rows where all collected fitScores are 1 or all are 5 (3+ samples)
  const rowScoreMap = {};
  for (const r of results) {
    for (const row of r.industryRows.concat(r.jobRows)) {
      if (!row?.rowKey || !Number.isFinite(row?.fitScore)) continue;
      if (!rowScoreMap[row.rowKey]) rowScoreMap[row.rowKey] = [];
      rowScoreMap[row.rowKey].push(row.fitScore);
    }
  }
  let extremeScoreBiasCount = 0;
  for (const scores of Object.values(rowScoreMap)) {
    if (scores.length >= 3 && (scores.every((s) => s === 1) || scores.every((s) => s === 5))) {
      extremeScoreBiasCount++;
    }
  }

  // strategy/execution and responsibility failure counts
  const stratExecFailures = allFailures.filter((f) => f.includes("strategyExecutionExpected") || f.includes("전략/실행 계열"));
  const respCheckFailures = allFailures.filter((f) => f.includes("responsibilityExpected") || f.includes("책임/범위 확장 계열"));
  const axisDominanceFailures = allWarnings.filter((f) => f.includes("흔들림") || f.includes("dominant"));

  return {
    total,
    passCount,
    failCount,
    warnCount,
    riskFailureCount: riskFailures.length,
    fitFailureCount: fitFailures.length,
    rowFailureCount: rowFailures.length,
    explanationFailureCount: explanationFailures.length,
    monotonicityFailureCount,
    axisDominanceFailureCount: axisDominanceFailures.length,
    responsibilityCheckFailureCount: respCheckFailures.length,
    strategyExecutionFailureCount: stratExecFailures.length,
    extremeScoreBiasCount,
    repeatedHeadlineRecurrenceCount: topGenericHeadlineCount,
    mostFrequentFailingRiskKey: topFailingRisk,
    mostFrequentMissingRowKey: topMissingRow,
    radarNote: "see transitionLiteRadarEval.mjs for axis values",
  };
}

// ─── main ─────────────────────────────────────────────────────────────────────

const results = FIXTURES.map(runCase);

console.log("\n=== Transition Lite Accuracy Eval ===\n");

for (const r of results) {
  const status = r.pass ? (r.warnings.length > 0 ? "WARN" : "PASS") : "FAIL";
  console.log(`[${status}] ${r.id}`);
  console.log(`       ${r.label}`);
  console.log(
    `  ① current→target: ${r.classification?.jobDistance ?? "?"} job / ${r.classification?.industryDistance ?? "?"} industry`
  );
  console.log(`  ② selectedRiskKeys: [${r.selectedRiskKeys.join(", ") || "(none)"}]`);
  console.log(`  ③ topRiskKey: ${r.topRiskKey ?? "(none)"}`);
  console.log(`  ④ topRiskHeadline: ${r.topRiskHeadline ? `"${r.topRiskHeadline}"` : "(none)"}`);
  console.log(`  ⑤ jobRowKeys: [${r.jobRowKeys.join(", ") || "(none)"}]`);
  console.log(`  ⑥ industryRowKeys: [${r.industryRowKeys.join(", ") || "(none)"}]`);
  const jobFitStr = Object.entries(r.jobFitScorePresence)
    .map(([k, v]) => `${k.replace("job_", "")}=${v ? "Y" : "N"}`)
    .join(" | ");
  console.log(`  ⑦ jobRow fitScore: ${jobFitStr}`);
  const indFitStr = Object.entries(r.industryFitScorePresence)
    .map(([k, v]) => `${k.replace("industry_", "")}=${v ? "Y" : "N"}`)
    .join(" | ");
  console.log(`  ⑧ industryRow fitScore: ${indFitStr}`);
  console.log(`  ⑨ explanation present: ${r.explanationSummaryPresent} (${r.explanation.length} items)`);
  if (r.failures.length > 0) {
    for (const f of r.failures) console.log(`  ✗ FAIL: ${f}`);
  }
  if (r.warnings.length > 0) {
    for (const w of r.warnings) console.log(`  ⚠ WARN: ${w}`);
  }
  if (r.pass && r.warnings.length === 0) console.log("  ✓ all checks passed");
  console.log();
}

const summary = buildSummary(results);
console.log("=== Summary ===");
console.log(`total cases      : ${summary.total}`);
console.log(`pass             : ${summary.passCount}`);
console.log(`fail             : ${summary.failCount}`);
console.log(`warn             : ${summary.warnCount}`);
console.log(`risk failures    : ${summary.riskFailureCount}`);
console.log(`fit failures     : ${summary.fitFailureCount}`);
console.log(`row failures     : ${summary.rowFailureCount}`);
console.log(`expl failures    : ${summary.explanationFailureCount}`);
console.log(`monotonicity fail: ${summary.monotonicityFailureCount}`);
console.log(`axis dom fail    : ${summary.axisDominanceFailureCount}`);
console.log(`resp check fail  : ${summary.responsibilityCheckFailureCount}`);
console.log(`strat/exec fail  : ${summary.strategyExecutionFailureCount}`);
console.log(`extreme bias     : ${summary.extremeScoreBiasCount}`);
console.log(`repeated headline: ${summary.repeatedHeadlineRecurrenceCount}`);
console.log(`top failing risk : ${summary.mostFrequentFailingRiskKey}`);
console.log(`top missing row  : ${summary.mostFrequentMissingRowKey}`);
console.log(`radar            : ${summary.radarNote}`);
console.log();

if (summary.failCount > 0) {
  process.exit(1);
}
