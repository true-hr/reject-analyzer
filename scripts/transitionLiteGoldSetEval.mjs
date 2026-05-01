/**
 * transitionLiteGoldSetEval.mjs
 *
 * Transition Lite Gold Set runner.
 * 사람이 라벨링한 기대값과 실제 VM 결과를 비교한다.
 *
 * 실행 방법:
 *   node ./scripts/transitionLiteGoldSetEval.mjs
 *
 * 판정 규칙:
 *   FAIL  — risk correctness 실패 1개 이상 OR expectedLowFitRows score 위반
 *   WARN  — risk OK + axis/headline/why 경고 존재
 *   PASS  — 전체 통과
 */

import { buildTransitionLiteResult } from "../src/lib/transitionLite/buildTransitionLiteResult.js";
import { classifyTransition } from "../src/lib/transitionLite/classifyTransition.js";

// ─── risk key constants ───────────────────────────────────────────────────────

const RISK_INDUSTRY_CONTEXT_SHIFT   = "RISK_INDUSTRY_CONTEXT_SHIFT";
const RISK_JOB_EXPECTATION_SHIFT    = "RISK_JOB_EXPECTATION_SHIFT";
const RISK_SCOPE_REINTERPRETATION   = "RISK_SCOPE_REINTERPRETATION";
const RISK_EXECUTION_LINK_CHECK     = "RISK_EXECUTION_LINK_CHECK";
const RISK_STRATEGIC_VIEW_CHECK     = "RISK_STRATEGIC_VIEW_CHECK";
const RISK_RESPONSIBILITY_EXPANSION = "RISK_RESPONSIBILITY_EXPANSION";

// ─── axis constants ───────────────────────────────────────────────────────────

const AXIS_KEYS = [
  "jobStructure",
  "industryContext",
  "responsibilityScope",
  "customerType",
  "roleCharacter",
];

// ─── gold set fixtures ────────────────────────────────────────────────────────
// canonical id 실존 확인 완료. 추측 금지.
// expectedTopRiskKey: null → top risk 체크 건너뜀 (any or none acceptable)
// expectedDominantAxis: self-baseline(same+same) 대비 가장 크게 흔들린 축

const FIXTURES = [
  // ── 1. same job + same industry ───────────────────────────────────────────
  {
    id: "gold-01-same-same",
    label: "DevOps + B2B SaaS → DevOps + B2B SaaS (완전 동일 — gold baseline)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    expectedCategory: "same_job_same_industry",
    expectedTopRiskKey: null,
    expectedMustHaveRiskKeys: [],
    expectedMustNotTop1RiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT, RISK_JOB_EXPECTATION_SHIFT],
    expectedLowFitRows: [],
    expectedHighFitRows: [],
    expectedDominantAxis: null,
    expectedHeadlineTokens: [],
    expectedWhyTokens: [],
  },
  // ── 2. same job + adjacent industry (high overlap) ────────────────────────
  {
    id: "gold-02-same-adj-high",
    label: "DevOps + B2B SaaS → DevOps + 엔터프라이즈솔루션 (인접 산업, 유사도 높음)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION",
    expectedCategory: "same_job_adjacent_industry_high_overlap",
    expectedTopRiskKey: RISK_INDUSTRY_CONTEXT_SHIFT,
    expectedMustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    expectedMustNotTop1RiskKeys: [RISK_JOB_EXPECTATION_SHIFT],
    expectedLowFitRows: ["industry_decision_structure"],
    expectedHighFitRows: ["job_core_role"],
    expectedDominantAxis: "industryContext",
    expectedHeadlineTokens: ["엔터프라이즈", "SaaS", "산업"],
    expectedWhyTokens: ["의사결정", "고객", "산업"],
  },
  // ── 3. same job + adjacent industry (low overlap) ─────────────────────────
  {
    id: "gold-03-same-adj-low",
    label: "QA + 전자/가전 → QA + 기계/산업장비 (인접 제조, 구조 차이)",
    currentJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    currentIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
    targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    targetIndustryId: "IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT",
    expectedCategory: "same_job_adjacent_industry_low_overlap",
    expectedTopRiskKey: RISK_INDUSTRY_CONTEXT_SHIFT,
    expectedMustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    expectedMustNotTop1RiskKeys: [RISK_JOB_EXPECTATION_SHIFT],
    expectedLowFitRows: ["industry_customer_structure", "industry_decision_structure"],
    expectedHighFitRows: ["job_core_role"],
    expectedDominantAxis: "industryContext",
    expectedHeadlineTokens: ["제조", "산업", "가전", "기계"],
    expectedWhyTokens: ["고객", "품질", "산업"],
  },
  // ── 4. same job + cross industry ─────────────────────────────────────────
  {
    id: "gold-04-same-cross",
    label: "DevOps + B2B SaaS → DevOps + 공공기관 (직무 동일, 산업 대폭 이동)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION",
    expectedCategory: "same_job_cross_industry",
    expectedTopRiskKey: RISK_INDUSTRY_CONTEXT_SHIFT,
    expectedMustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    expectedMustNotTop1RiskKeys: [RISK_JOB_EXPECTATION_SHIFT],
    expectedLowFitRows: ["industry_customer_structure", "industry_decision_structure", "industry_operating_context"],
    expectedHighFitRows: ["job_core_role"],
    expectedDominantAxis: "industryContext",
    expectedHeadlineTokens: ["공공", "기관", "업계"],
    expectedWhyTokens: ["산업", "고객", "환경"],
  },
  // ── 5. cross job + same industry ─────────────────────────────────────────
  {
    id: "gold-05-cross-same",
    label: "서비스기획 + B2C → 백엔드개발 + B2C (직무 교차, 산업 동일)",
    currentJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedCategory: "cross_job_same_industry",
    expectedTopRiskKey: null,  // job risk expected but uncertain which tops
    expectedSecondaryRiskKeys: [RISK_JOB_EXPECTATION_SHIFT, RISK_SCOPE_REINTERPRETATION],
    expectedMustHaveRiskKeys: [],
    expectedMustNotTop1RiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    expectedLowFitRows: ["job_core_role", "job_key_outputs"],
    expectedHighFitRows: [],
    expectedDominantAxis: "jobStructure",
    expectedHeadlineTokens: ["직무", "전환", "기대"],
    expectedWhyTokens: ["역할", "직무", "산출물"],
  },
  // ── 6. cross job + adjacent industry ─────────────────────────────────────
  {
    id: "gold-06-cross-adj",
    label: "제조QA + 전자/가전 → 기술지원/필드 + 기계/장비 (직무 교차 + 인접 산업)",
    currentJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    currentIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
    targetJobId: "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
    targetIndustryId: "IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT",
    expectedCategory: "cross_job_adjacent_industry",
    expectedTopRiskKey: null,  // job or industry risk could top depending on classifier
    expectedMustHaveRiskKeys: [],
    expectedMustNotTop1RiskKeys: [],
    expectedLowFitRows: ["job_core_role"],
    expectedHighFitRows: [],
    expectedDominantAxis: "jobStructure",
    expectedHeadlineTokens: ["현장", "기술지원", "제조", "직무"],
    expectedWhyTokens: ["직무", "역할", "산업"],
  },
  // ── 7. cross job + cross industry ────────────────────────────────────────
  {
    id: "gold-07-cross-cross",
    label: "채용 + HR서비스 → 대외협력 + 협회/단체 (직무 + 산업 동시 교차)",
    currentJobId: "JOB_HR_ORGANIZATION_RECRUITING",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
    targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_ASSOCIATION_ORGANIZATION",
    expectedCategory: "cross_job_cross_industry",
    expectedTopRiskKey: RISK_INDUSTRY_CONTEXT_SHIFT,
    expectedMustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    expectedMustNotTop1RiskKeys: [],
    expectedLowFitRows: ["job_core_role", "industry_customer_structure", "industry_operating_context"],
    expectedHighFitRows: [],
    expectedDominantAxis: "industryContext",
    expectedHeadlineTokens: ["채용", "협회", "대외", "산업"],
    expectedWhyTokens: ["산업", "역할", "고객"],
  },
  // ── 8. same family + responsibility expansion ─────────────────────────────
  {
    id: "gold-08-resp-expansion",
    label: "CS운영 + 온라인커머스 → 운영기획 + 아웃소싱 (유사 직무군, 책임 범위 확장)",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    currentIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE",
    targetJobId: "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
    expectedCategory: "same_family_responsibility_expansion",
    expectedTopRiskKey: null,  // RISK_RESPONSIBILITY_EXPANSION or RISK_SCOPE_REINTERPRETATION
    expectedSecondaryRiskKeys: [RISK_RESPONSIBILITY_EXPANSION, RISK_SCOPE_REINTERPRETATION],
    expectedMustHaveRiskKeys: [],
    expectedMustNotTop1RiskKeys: [],
    expectedLowFitRows: [],
    expectedHighFitRows: [],
    expectedDominantAxis: "responsibilityScope",
    expectedHeadlineTokens: ["운영", "기획", "책임"],
    expectedWhyTokens: ["역할", "운영", "책임"],
  },
  // ── 9. strategy → execution ───────────────────────────────────────────────
  {
    id: "gold-09-strat-to-exec",
    label: "전략기획 + 컨설팅리서치 → 서비스운영 + 아웃소싱 (전략→실행 축 이동)",
    currentJobId: "JOB_BUSINESS_STRATEGY",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    targetJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
    expectedCategory: "strategy_to_execution",
    expectedTopRiskKey: null,  // RISK_EXECUTION_LINK_CHECK or RISK_SCOPE_REINTERPRETATION
    expectedSecondaryRiskKeys: [RISK_EXECUTION_LINK_CHECK, RISK_SCOPE_REINTERPRETATION],
    expectedMustHaveRiskKeys: [],
    expectedMustNotTop1RiskKeys: [],
    expectedLowFitRows: ["job_core_role"],
    expectedHighFitRows: [],
    expectedDominantAxis: "roleCharacter",
    expectedHeadlineTokens: ["전략", "실행", "운영"],
    expectedWhyTokens: ["역할", "실행", "기획"],
  },
  // ── 10. execution → strategy ─────────────────────────────────────────────
  {
    id: "gold-10-exec-to-strat",
    label: "서비스운영 + 컨설팅리서치 → 전략기획 + 컨설팅리서치 (실행→전략 축 이동)",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    targetJobId: "JOB_BUSINESS_STRATEGY",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    expectedCategory: "execution_to_strategy",
    expectedTopRiskKey: null,  // RISK_STRATEGIC_VIEW_CHECK or RISK_SCOPE_REINTERPRETATION
    expectedSecondaryRiskKeys: [RISK_STRATEGIC_VIEW_CHECK, RISK_SCOPE_REINTERPRETATION],
    expectedMustHaveRiskKeys: [],
    expectedMustNotTop1RiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    expectedLowFitRows: ["job_core_role"],
    expectedHighFitRows: [],
    expectedDominantAxis: "roleCharacter",
    expectedHeadlineTokens: ["전략", "기획", "실행"],
    expectedWhyTokens: ["역할", "전략", "방향"],
  },
  // ── 11. full cross high-risk ─────────────────────────────────────────────
  {
    id: "gold-11-full-cross-high-risk",
    label: "채용 + HR서비스 → 현장서비스지원 + 공공기관 (고위험 전체 교차)",
    currentJobId: "JOB_HR_ORGANIZATION_RECRUITING",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
    targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION",
    expectedCategory: "full_cross_high_risk",
    expectedTopRiskKey: RISK_INDUSTRY_CONTEXT_SHIFT,
    expectedMustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    expectedMustNotTop1RiskKeys: [],
    expectedLowFitRows: ["job_core_role", "industry_customer_structure", "industry_decision_structure", "industry_operating_context"],
    expectedHighFitRows: [],
    expectedDominantAxis: "industryContext",
    expectedHeadlineTokens: ["공공", "채용", "현장"],
    expectedWhyTokens: ["산업", "역할", "고객", "환경"],
  },
  // ── 12. full cross but stakeholder/customer structure partially similar ───
  {
    id: "gold-12-full-cross-similar-stakeholder",
    label: "B2B영업 + 엔터프라이즈솔루션 → 컨설팅 + 컨설팅리서치 (full cross, B2B이해관계자 유사)",
    currentJobId: "JOB_SALES_B2B_SALES",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION",
    targetJobId: "JOB_RESEARCH_PROFESSIONAL_CONSULTING",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    expectedCategory: "full_cross_similar_stakeholder",
    expectedTopRiskKey: RISK_INDUSTRY_CONTEXT_SHIFT,
    expectedMustHaveRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
    expectedMustNotTop1RiskKeys: [],
    expectedLowFitRows: ["job_core_role"],
    expectedHighFitRows: [],
    expectedDominantAxis: "jobStructure",
    expectedHeadlineTokens: ["컨설팅", "영업", "B2B"],
    expectedWhyTokens: ["고객", "역할", "직무"],
  },
];

// ─── extraction helpers ───────────────────────────────────────────────────────

function extractFromVM(vm) {
  const topRisks = Array.isArray(vm?.topRisks) ? vm.topRisks : [];
  const selectedRiskKeys = topRisks.map((r) => r?.key).filter(Boolean);
  const topRiskKey = topRisks[0]?.key ?? null;
  const topRiskHeadline = topRisks[0]?.title ?? null;

  // collect all rows from all risk comparison tables
  const allRows = [];
  for (const risk of topRisks) {
    const table = risk?.comparisonTable;
    const rows = Array.isArray(table?.rows) ? table.rows
      : Array.isArray(table) ? table : [];
    allRows.push(...rows);
  }

  const whyTexts = Array.isArray(vm?.whyThisRead) ? vm.whyThisRead.filter(Boolean) : [];

  return { selectedRiskKeys, topRiskKey, topRiskHeadline, allRows, whyTexts };
}

function extractAxisValues(vm) {
  const axes = vm?.axisPack?.axes;
  if (!axes) return null;
  return Object.fromEntries(
    AXIS_KEYS.map((k) => [k, { displayScore: axes[k]?.displayScore ?? null }])
  );
}

// Compute self-baseline (same+same) axis values for each fixture's current job/industry
function computeSelfBaseline(fixture) {
  try {
    const vm = buildTransitionLiteResult({
      currentJobId: fixture.currentJobId,
      currentIndustryId: fixture.currentIndustryId,
      targetJobId: fixture.currentJobId,
      targetIndustryId: fixture.currentIndustryId,
    });
    return extractAxisValues(vm);
  } catch (_e) {
    return null;
  }
}

function computeDominantAxis(axisValues, baselineAxisValues) {
  if (!axisValues || !baselineAxisValues) return null;
  let maxDelta = 3; // minimum threshold to count as dominant
  let dominant = null;
  for (const k of AXIS_KEYS) {
    const curr = axisValues[k]?.displayScore;
    const base = baselineAxisValues[k]?.displayScore;
    if (curr === null || curr === undefined || base === null || base === undefined) continue;
    const d = Math.abs(curr - base);
    if (d > maxDelta) {
      maxDelta = d;
      dominant = k;
    }
  }
  return dominant;
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

  if (err) {
    return buildCaseResult(fixture, null, null, null, [`EXCEPTION: ${err.message}`], []);
  }

  const { selectedRiskKeys, topRiskKey, topRiskHeadline, allRows, whyTexts } = extractFromVM(vm);
  const axisValues = extractAxisValues(vm);
  const selfBaseline = computeSelfBaseline(fixture);
  const actualDominantAxis = computeDominantAxis(axisValues, selfBaseline);

  // build row score map from all comparison table rows
  const rowScoreMap = {};
  for (const row of allRows) {
    if (row?.rowKey && Number.isFinite(row?.fitScore)) {
      rowScoreMap[row.rowKey] = row.fitScore;
    }
  }

  const failures = [];
  const warnings = [];

  // ── 1. risk correctness ──────────────────────────────────────────────────
  if (fixture.expectedTopRiskKey !== null && topRiskKey !== fixture.expectedTopRiskKey) {
    failures.push(`topRisk mismatch: expected=${fixture.expectedTopRiskKey} actual=${topRiskKey ?? "(none)"}`);
  }
  for (const k of fixture.expectedMustHaveRiskKeys ?? []) {
    if (!selectedRiskKeys.includes(k)) {
      failures.push(`mustHaveRisk missing: ${k}`);
    }
  }
  for (const k of fixture.expectedMustNotTop1RiskKeys ?? []) {
    if (topRiskKey === k) {
      failures.push(`mustNotTop1 violated: ${k} is top1`);
    }
  }

  // ── 2. fit row correctness ───────────────────────────────────────────────
  for (const rowKey of fixture.expectedLowFitRows ?? []) {
    const score = rowScoreMap[rowKey];
    if (score === undefined) {
      warnings.push(`expectedLowFitRow not in any comparisonTable: ${rowKey} (risk not selected?)`);
    } else if (score > 2) {
      failures.push(`expectedLowFitRow score too high: ${rowKey}=${score} (expected <=2)`);
    }
  }
  for (const rowKey of fixture.expectedHighFitRows ?? []) {
    const score = rowScoreMap[rowKey];
    if (score !== undefined && score < 3) {
      warnings.push(`expectedHighFitRow score too low: ${rowKey}=${score} (expected >=3)`);
    }
  }

  // ── 3. axis correctness ──────────────────────────────────────────────────
  if (fixture.expectedDominantAxis !== null) {
    if (actualDominantAxis !== fixture.expectedDominantAxis) {
      warnings.push(`dominantAxis mismatch: expected=${fixture.expectedDominantAxis} actual=${actualDominantAxis ?? "(none or <3pt change)"}`);
    }
  }

  // ── 4. headline token check ──────────────────────────────────────────────
  if ((fixture.expectedHeadlineTokens ?? []).length > 0) {
    const hl = (topRiskHeadline ?? "").toLowerCase();
    const matched = fixture.expectedHeadlineTokens.some((t) => hl.includes(t.toLowerCase()));
    if (!matched) {
      warnings.push(`headline token miss: none of [${fixture.expectedHeadlineTokens.join(", ")}] in "${topRiskHeadline ?? ""}"`);
    }
  }

  // ── 5. why token check ───────────────────────────────────────────────────
  if ((fixture.expectedWhyTokens ?? []).length > 0) {
    const whyCombined = whyTexts.join(" ").toLowerCase();
    const matched = fixture.expectedWhyTokens.some((t) => whyCombined.includes(t.toLowerCase()));
    if (!matched) {
      warnings.push(`why token miss: none of [${fixture.expectedWhyTokens.join(", ")}] in why texts (${whyTexts.length} items)`);
    }
  }

  return buildCaseResult(fixture, classification, {
    selectedRiskKeys, topRiskKey, topRiskHeadline, rowScoreMap, axisValues,
    actualDominantAxis, whyTexts,
  }, null, failures, warnings);
}

function buildCaseResult(fixture, classification, data, _unused, failures, warnings) {
  const pass = failures.length === 0;
  const verdict = pass ? (warnings.length > 0 ? "WARN" : "PASS") : "FAIL";
  const d = data ?? {};

  const actualLowFitRows = Object.entries(d.rowScoreMap ?? {})
    .filter(([, s]) => s <= 2)
    .map(([k]) => k);

  return {
    id: fixture.id,
    label: fixture.label,
    expectedCategory: fixture.expectedCategory,
    verdict,
    pass,
    failures,
    warnings,
    classification: classification
      ? { jobDistance: classification.jobDistance, industryDistance: classification.industryDistance }
      : null,
    expectedTopRiskKey: fixture.expectedTopRiskKey,
    actualTopRiskKey: d.topRiskKey ?? null,
    expectedMustHaveRiskKeys: fixture.expectedMustHaveRiskKeys ?? [],
    actualSelectedRiskKeys: d.selectedRiskKeys ?? [],
    expectedLowFitRows: fixture.expectedLowFitRows ?? [],
    actualLowFitRows,
    expectedDominantAxis: fixture.expectedDominantAxis,
    actualDominantAxis: d.actualDominantAxis ?? null,
    topRiskHeadline: d.topRiskHeadline ?? null,
    expectedHeadlineTokens: fixture.expectedHeadlineTokens ?? [],
    expectedWhyTokens: fixture.expectedWhyTokens ?? [],
    axisValues: d.axisValues ?? null,
  };
}

// ─── summary ─────────────────────────────────────────────────────────────────

function buildSummary(results) {
  const total = results.length;
  const passCount = results.filter((r) => r.verdict === "PASS").length;
  const warnCount = results.filter((r) => r.verdict === "WARN").length;
  const failCount = results.filter((r) => r.verdict === "FAIL").length;

  const allFailures = results.flatMap((r) => r.failures);
  const allWarnings = results.flatMap((r) => r.warnings);

  const topRiskMismatches = allFailures.filter((f) => f.includes("topRisk mismatch")).length;
  const mustHaveMisses    = allFailures.filter((f) => f.includes("mustHaveRisk missing")).length;
  const lowFitMismatches  = allFailures.filter((f) => f.includes("expectedLowFitRow score too high")).length;
  const dominantAxisMismatches = allWarnings.filter((w) => w.includes("dominantAxis mismatch")).length;
  const headlineMisses    = allWarnings.filter((w) => w.includes("headline token miss")).length;
  const whyMisses         = allWarnings.filter((w) => w.includes("why token miss")).length;

  // most frequently failed category
  const categoryFails = {};
  for (const r of results) {
    if (!r.pass) categoryFails[r.expectedCategory] = (categoryFails[r.expectedCategory] ?? 0) + 1;
  }
  const topFailCategory = Object.entries(categoryFails).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  // most frequently mismatched risk key
  const riskMentions = {};
  for (const f of allFailures) {
    const m1 = f.match(/expected=(\S+)/);
    if (m1 && m1[1] !== "null" && m1[1] !== "(none)") riskMentions[m1[1]] = (riskMentions[m1[1]] ?? 0) + 1;
    const m2 = f.match(/mustHaveRisk missing: (\S+)/);
    if (m2) riskMentions[m2[1]] = (riskMentions[m2[1]] ?? 0) + 1;
  }
  const topMismatchedRisk = Object.entries(riskMentions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  // most frequently mismatched row key
  const rowMentions = {};
  for (const f of [...allFailures, ...allWarnings]) {
    const m = f.match(/expectedLow(?:FitRow)[^:]*: (\w+)/);
    if (m) rowMentions[m[1]] = (rowMentions[m[1]] ?? 0) + 1;
  }
  const topMismatchedRow = Object.entries(rowMentions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  // most frequently mismatched axis
  const axisMentions = {};
  for (const w of allWarnings) {
    if (!w.includes("dominantAxis mismatch")) continue;
    const m = w.match(/expected=(\w+)/);
    if (m) axisMentions[m[1]] = (axisMentions[m[1]] ?? 0) + 1;
  }
  const topMismatchedAxis = Object.entries(axisMentions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  return {
    total, passCount, warnCount, failCount,
    topRiskMismatches, mustHaveMisses, lowFitMismatches, dominantAxisMismatches,
    headlineMisses, whyMisses,
    topFailCategory, topMismatchedRisk, topMismatchedRow, topMismatchedAxis,
  };
}

// ─── main ─────────────────────────────────────────────────────────────────────

const results = FIXTURES.map(runCase);

console.log("\n=== Transition Lite Gold Set Eval ===\n");

for (const r of results) {
  console.log(`[${r.verdict}] ${r.id}`);
  console.log(`       ${r.label}`);
  console.log(`  ① ${r.classification?.jobDistance ?? "?"} job / ${r.classification?.industryDistance ?? "?"} industry  (${r.expectedCategory})`);
  console.log(`  ② topRisk    expected=${r.expectedTopRiskKey ?? "(any)"}  actual=${r.actualTopRiskKey ?? "(none)"}`);
  console.log(`  ③ mustHave   expected=[${r.expectedMustHaveRiskKeys.join(", ") || "(none)"}]  actual=[${r.actualSelectedRiskKeys.join(", ") || "(none)"}]`);
  console.log(`  ④ lowFitRows expected=[${r.expectedLowFitRows.join(", ") || "(none)"}]  actualLow=[${r.actualLowFitRows.join(", ") || "(none)"}]`);
  console.log(`  ⑤ domAxis    expected=${r.expectedDominantAxis ?? "(skip)"}  actual=${r.actualDominantAxis ?? "(none)"}`);

  const headlineTag = r.expectedHeadlineTokens.length === 0
    ? "n/a"
    : r.warnings.some((w) => w.includes("headline token miss")) ? "miss" : "match";
  const whyTag = r.expectedWhyTokens.length === 0
    ? "n/a"
    : r.warnings.some((w) => w.includes("why token miss")) ? "miss" : "match";
  console.log(`  ⑥ headline=${headlineTag}  why=${whyTag}  headline="${r.topRiskHeadline ?? ""}"`);
  console.log(`  ⑦ verdict: ${r.verdict}`);

  for (const f of r.failures) console.log(`  ✗ ${f}`);
  for (const w of r.warnings) console.log(`  ⚠ ${w}`);
  if (r.verdict === "PASS") console.log("  ✓ all gold checks passed");
  console.log();
}

const s = buildSummary(results);
console.log("=== Gold Set Summary ===");
console.log(`total cases              : ${s.total}`);
console.log(`pass                     : ${s.passCount}`);
console.log(`warn                     : ${s.warnCount}`);
console.log(`fail                     : ${s.failCount}`);
console.log(`top risk mismatch        : ${s.topRiskMismatches}`);
console.log(`missing must-have risk   : ${s.mustHaveMisses}`);
console.log(`low-fit row mismatch     : ${s.lowFitMismatches}`);
console.log(`dominant axis mismatch   : ${s.dominantAxisMismatches}`);
console.log(`headline token miss      : ${s.headlineMisses}`);
console.log(`why token miss           : ${s.whyMisses}`);
console.log(`top fail category        : ${s.topFailCategory}`);
console.log(`top mismatched risk key  : ${s.topMismatchedRisk}`);
console.log(`top mismatched row key   : ${s.topMismatchedRow}`);
console.log(`top mismatched axis      : ${s.topMismatchedAxis}`);
console.log();

if (s.failCount > 0) {
  process.exit(1);
}
