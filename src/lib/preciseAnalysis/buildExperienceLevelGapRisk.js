// src/lib/preciseAnalysis/buildExperienceLevelGapRisk.js
// [PRECISE-RISK-V1] 연차/레벨 불일치 엔진 — experience_level_gap
// 입력: buildJdResumeFit() 반환 fit object
//
// experiencePolicyMode:
//   "range-check"        — 연차 비교에 필요한 최소 데이터 있음, 실제 비교 수행
//   "insufficient-data"  — JD 연차 또는 resume 기간 정보 부족, 보수 처리

import { createRiskResult } from "./createRiskResult.js";

const SUMMARY_TEXT = {
  critical: "이력서에서 확인되는 경력 기간이 JD 요구 연차에 상당히 미치지 않을 수 있습니다.",
  high:     "이력서의 경력 기간이 JD 요구 연차보다 짧을 가능성이 있습니다.",
  medium:   "JD가 기대하는 연차 범위와 현재 이력서 경력 기간이 다소 차이 날 수 있습니다.",
  none:     "JD의 연차 요건 대비 명확한 불일치는 확인되지 않았습니다.",
};

const DETAIL_TEXT = {
  critical:
    "JD에서 요구하는 최소 연차에 비해, 이력서에서 직접 확인되는 경력 기간이 상당히 부족할 수 있습니다. 재직 기간이 누락된 경력이 있다면 명시적으로 보완하는 것이 필요합니다.",
  high:
    "JD의 연차 요건과 이력서상 경력 기간 사이에 차이가 있을 수 있습니다. 실제 관련 경력이 더 있다면 기간과 역할을 더 분명하게 드러내는 것이 좋습니다.",
  medium:
    "이력서상 경력 기간이 JD가 기대하는 범위보다 다소 길거나 짧게 읽힐 수 있습니다. 지원 포지션의 기대 seniority와 연결되도록 경력 요약을 정리해보는 것이 좋습니다.",
  none:
    "연차 기준에서 큰 결격 사유는 확인되지 않았습니다.",
};

// ── 내부 helper ──────────────────────────────────────────────────────────────

/**
 * "YYYY-MM" 문자열 → 총 월 수 정수 (year*12 + month-1).
 * 파싱 실패 시 null 반환.
 */
function _parseYm(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const y  = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  if (mo < 1 || mo > 12) return null;
  return y * 12 + (mo - 1);
}

/**
 * 비중복 월 합산 (interval merge 알고리즘).
 * intervals: [[startM, endM], ...] — 각 값은 _parseYm 결과 (정수, 포함 경계)
 */
function _mergeAndCountMonths(intervals) {
  if (!intervals.length) return 0;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let total    = 0;
  let curStart = sorted[0][0];
  let curEnd   = sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    if (s <= curEnd) {
      // 중복 구간 — 끝을 연장
      if (e > curEnd) curEnd = e;
    } else {
      total += curEnd - curStart + 1;
      curStart = s;
      curEnd   = e;
    }
  }
  total += curEnd - curStart + 1;
  return total;
}

const FUNCTION_BUCKETS = [
  "online_advertising",  // append Round 2-B: must precede sales to win on ad-domain JDs
  "sales",
  "marketing",
  "operations",
  "consulting",
  "project_management",
  "data_analytics",
  "software_ai",
  "research_rnd",
  "engineering",
  "customer_success",
  "product_planning",
  "hr",
  "finance",
  "general_business",
  "procurement",         // append Round 2-B: resume primaryFunction can now be procurement
  "unknown",
];

const TARGET_FUNCTION_RULES = {
  sales: /(sales|sales representative|account manager|business development|field sales|영업|거래처|매출)/i,
  marketing: /(marketing|crm|campaign|brand|마케팅|브랜드|캠페인)/i,
  operations: /(operations?|clinical operations|service operations|운영|운영관리)/i,
  consulting: /(consulting|consultant|제안|컨설팅|proposal)/i,
  project_management: /(\bpm\b|project manager|project management|project lead|프로젝트 관리|프로젝트 리드)/i,
  data_analytics: /(data analysis|data analytics|analytics|데이터 분석|분석|sql|bi\b|tableau|power bi)/i,
  software_ai: /(ai|machine learning|deep learning|software|개발|python|tensorflow|keras|streamlit|docker)/i,
  research_rnd: /(research|r&d|연구|연구소|효능평가|기전 연구|실험)/i,
  engineering: /(engineering|engineer|설계|cad|구조|mechanical)/i,
  customer_success: /(customer success|고객 성공|고객지원|고객 응대|cs\b|support)/i,
  product_planning: /(product planning|service planning|product strategy|기획|상품기획|서비스 기획)/i,
  hr: /(\bhr\b|recruiting|채용|인사|조직개발)/i,
  finance: /(finance|accounting|fp&a|재무|회계|세무|예산)/i,
  general_business: /(business|사업|경영|strategy|전략|planning)/i,
  // append Round 2-B: online advertising / media — specific enough to avoid false-positive on generic marketing/sales JDs
  online_advertising: /(온라인\s*광고|디지털\s*광고|광고\s*운영|광고\s*상품|광고\s*상품개발|광고\s*솔루션|광고\s*플랫폼|광고대행사|랩사|언론매체|플랫폼\s*광고|광고\s*마케팅|ad\s*operat|ad\s*product|ad\s*platform|digital\s*advert|media\s*sales)/i,
  // append Round 2-B: procurement — for JDs that explicitly require procurement experience
  procurement: /(procurement|purchasing|sourcing|구매|조달|소싱|발주|협력사|공급사|벤더|공급업체|구매관리|구매기획|구매전략|supply\s*chain|\bscm\b|\bcpsm\b)/i,
};

const ADJACENT_FUNCTIONS = {
  sales: ["marketing", "customer_success", "general_business"],
  marketing: ["sales", "data_analytics", "product_planning", "general_business"],
  operations: ["project_management", "customer_success", "general_business"],
  consulting: ["project_management", "data_analytics", "general_business"],
  project_management: ["operations", "consulting", "data_analytics", "software_ai", "product_planning"],
  data_analytics: ["project_management", "marketing", "software_ai", "consulting"],
  software_ai: ["data_analytics", "engineering", "project_management", "research_rnd"],
  research_rnd: ["software_ai", "engineering", "operations"],
  engineering: ["software_ai", "research_rnd", "project_management"],
  customer_success: ["sales", "operations", "general_business"],
  product_planning: ["marketing", "project_management", "general_business"],
  hr: ["general_business"],
  finance: ["general_business"],
  general_business: ["sales", "marketing", "operations", "consulting", "product_planning", "finance", "hr"],
  // append Round 2-B: procurement is adjacent to operations/finance/general_business only
  // NOT adjacent to marketing or online_advertising — direct experience not interchangeable
  procurement: ["operations", "finance", "general_business"],
  // append Round 2-B: online_advertising is adjacent to marketing/data_analytics/operations
  online_advertising: ["marketing", "data_analytics", "operations"],
};

function _collectStringsDeep(value, acc = []) {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) _collectStringsDeep(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) _collectStringsDeep(item, acc);
  }
  return acc;
}

function _inferTargetFunctionFromFit(fit) {
  const hintText = _collectStringsDeep([
    fit?.jdModel,
    fit?.jd?.mustItems,
    fit?.jd?.prefItems,
    fit?.jd?.mustTextSample,
    fit?.jd?.prefTextSample,
    fit?.jd?.structured,
    fit?.meta?.inputs?.jdSample,
  ]).join(" ");
  const ranked = FUNCTION_BUCKETS
    .filter((bucket) => bucket !== "unknown")
    .map((bucket) => [bucket, TARGET_FUNCTION_RULES[bucket]?.test(hintText) ? 1 : 0])
    .filter(([, score]) => score > 0);
  return {
    hintText,
    targetFunctionHint: ranked[0]?.[0] ?? "unknown",
  };
}

function _isAdjacentFunction(primaryFunction, targetFunction, secondaryFunctions = []) {
  if (!primaryFunction || !targetFunction || primaryFunction === "unknown" || targetFunction === "unknown") {
    return false;
  }
  if (secondaryFunctions.includes(targetFunction)) return true;
  return Boolean(
    ADJACENT_FUNCTIONS[primaryFunction]?.includes(targetFunction) ||
    ADJACENT_FUNCTIONS[targetFunction]?.includes(primaryFunction)
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 연차/레벨 불일치 리스크 엔진.
 * @param {object|null|undefined} fit — buildJdResumeFit() 반환값
 * @returns {import("./createRiskResult.js").RiskResult}
 */
export function buildExperienceLevelGapRisk(fit, roleFitCareerMatch = null) {
  // ── 입력 추출 ──────────────────────────────────────────────────────────────
  const expYears      = fit?.jdModel?.experienceYears ?? null;
  const yearsRequiredMin = (expYears && typeof expYears.min === "number") ? expYears.min : null;
  const yearsRequiredMax = (expYears && typeof expYears.max === "number") ? expYears.max : null;
  const durationPack = fit?.resume?.structured?.experienceDurationPack ?? null;
  const functionPack = durationPack?.functionExperiencePack ?? null;
  const { targetFunctionHint, hintText: targetFunctionHintText } = _inferTargetFunctionFromFit(fit);

  const rawPeriods = Array.isArray(fit?.resume?.structured?.employmentPeriods)
    ? fit.resume.structured.employmentPeriods
    : [];

  // ── 기간 파싱 & 구간 분류 ─────────────────────────────────────────────────
  const countedPeriods = [];
  const skippedPeriods = [];
  const intervals      = [];

  for (const p of rawPeriods) {
    const fromM = _parseYm(p?.from);
    const toM   = _parseYm(p?.to);
    if (fromM === null || toM === null) {
      skippedPeriods.push(p);
      continue;
    }
    if (fromM > toM) {
      // 역전 구간 — 기간 산정 제외
      skippedPeriods.push(p);
      continue;
    }
    countedPeriods.push(p);
    intervals.push([fromM, toM]);
  }

  // ── 총 경력 계산 ──────────────────────────────────────────────────────────
  const fallbackTotalCareerMonths = _mergeAndCountMonths(intervals);
  const totalCareerMonths = Number.isFinite(durationPack?.uniqueTotalMonths)
    ? Math.max(0, Number(durationPack.uniqueTotalMonths))
    : fallbackTotalCareerMonths;
  const rawTotalCareerMonths = Number.isFinite(durationPack?.rawTotalMonths)
    ? Math.max(0, Number(durationPack.rawTotalMonths))
    : fallbackTotalCareerMonths;
  const countedPeriodCount = Number.isFinite(durationPack?.parsedRowCount)
    ? Number(durationPack.parsedRowCount)
    : countedPeriods.length;
  const skippedPeriodCount = Number.isFinite(durationPack?.unparsedRowCount)
    ? Number(durationPack.unparsedRowCount)
    : skippedPeriods.length;
  // 소수점 1자리 반올림
  const totalCareerYears  = Math.round((totalCareerMonths / 12) * 10) / 10;
  const yearsRequiredMinMonths = yearsRequiredMin !== null ? yearsRequiredMin * 12 : null;
  const yearsRequiredMaxMonths = yearsRequiredMax !== null ? yearsRequiredMax * 12 : null;
  const primaryFunction = functionPack?.primaryFunction ?? "unknown";
  const dominantRecentFunction = functionPack?.dominantRecentFunction ?? "unknown";
  const secondaryFunctions = Array.isArray(functionPack?.secondaryFunctions) ? functionPack.secondaryFunctions : [];
  const functionMismatch = Boolean(
    functionPack &&
    targetFunctionHint !== "unknown" &&
    primaryFunction !== "unknown" &&
    primaryFunction !== targetFunctionHint
  );
  const adjacentFunctionSupport = Boolean(
    functionMismatch && _isAdjacentFunction(primaryFunction, targetFunctionHint, secondaryFunctions)
  );
  const careerDurationSufficient = yearsRequiredMinMonths !== null
    ? totalCareerMonths >= yearsRequiredMinMonths
    : totalCareerMonths >= 12;

  // ── fitUnderstandingPack.comparisonPack 추출 — append-only Round 4-A ──────
  const comparisonPack    = fit?.fitUnderstandingPack?.comparisonPack ?? null;
  const _cpFunctionFit    = comparisonPack?.functionFit    ?? null;
  const _cpCareerLevelFit = comparisonPack?.careerLevelFit ?? null;
  const _cpDirectnessTrig = (
    _cpFunctionFit  === "mismatch" &&
    _cpCareerLevelFit === "sufficient_but_different_field"
  );

  // ── policyMode 및 severity 결정 ───────────────────────────────────────────
  let experiencePolicyMode;
  let severity;
  let triggered;

  if (yearsRequiredMin === null || countedPeriodCount === 0) {
    // 비교에 필요한 최소 데이터 부족 → 강한 판정 금지
    experiencePolicyMode = "insufficient-data";
    severity             = "none";
    triggered            = false;
  } else {
    experiencePolicyMode = "range-check";

    if (totalCareerMonths < Math.max(0, yearsRequiredMinMonths - 24)) {
      severity = "critical";
    } else if (totalCareerMonths < yearsRequiredMinMonths) {
      severity = "high";
    } else if (yearsRequiredMaxMonths !== null && totalCareerMonths > yearsRequiredMaxMonths + 36) {
      // 과잉경력(overqualified) — medium까지만
      severity = "medium";
    } else {
      severity = "none";
    }
    triggered = severity !== "none";
  }

  // ── comparisonPack 기반 직무 직접성 override — append-only Round 4-A ──────
  let _titleOverride       = null;
  let _summaryTextOverride = null;
  let _detailTextOverride  = null;
  if (_cpDirectnessTrig) {
    triggered            = true;
    severity             = "high";
    _titleOverride       = comparisonPack?.userFacingRiskLabel || "지원 직무와 직접적으로 연결되는 경험이 부족함";
    _summaryTextOverride = "경력 연차 자체는 부족해 보이지 않지만, 지원 직무와 직접적으로 연결되는 경험이 부족하게 보일 수 있습니다.";
    _detailTextOverride  = "경력 연차 자체는 부족해 보이지 않습니다. 현재 이력서의 경력 기능축이 JD가 요구하는 직무 경험과 차이가 있습니다. 직무 전환 시 JD 핵심 업무와의 연결 근거를 이력서에서 명시적으로 드러내는 것이 필요합니다.";
  }

  // ── evidence 구성 ─────────────────────────────────────────────────────────
  const evidence = [];
  if (yearsRequiredMin !== null) {
    evidence.push(`JD 요구 연차: 최소 ${yearsRequiredMin}년`);
  }
  if (countedPeriodCount > 0) {
    evidence.push(`이력서에서 확인된 총 경력: 약 ${totalCareerYears}년`);
    evidence.push(`경력 산정에 반영된 재직 구간: ${countedPeriodCount}건`);
    if (durationPack) {
      evidence.push("경력 기간은 개별 이력의 근무기간을 월 단위로 정규화해 합산했습니다.");
      if (rawTotalCareerMonths !== totalCareerMonths) {
        evidence.push("중복 기간이 있는 경우 총 경력은 보수적으로 조정해 반영했습니다.");
      }
    }
  }
  if (skippedPeriodCount > 0) {
    evidence.push(`기간 확인이 어려워 제외된 재직 구간: ${skippedPeriodCount}건`);
  }
  if (careerDurationSufficient && functionMismatch) {
    evidence.push("총 경력 기간은 충분하지만, 최근 경력과 누적 경력 기준으로 보면 주력 기능은 타깃 역할과 일부 차이가 있습니다.");
    evidence.push("즉, 연차 자체보다 어떤 기능 축에서 경험을 쌓아왔는지가 더 중요하게 읽히는 상태입니다.");
  }
  if (adjacentFunctionSupport) {
    evidence.push("직접 동일 역할 경험은 제한적이지만, 인접한 기능에서 쌓은 경험이 있어 전환 가능성 자체는 남아 있습니다.");
    evidence.push("다만 이 경험이 타깃 역할에서 어떻게 쓰였는지를 추가로 연결해야 설득력이 높아집니다.");
  }
  if (
    primaryFunction === "sales" &&
    Number(functionPack?.functionWeightedTotals?.marketing || 0) > 0
  ) {
    evidence.push("초기 경력에는 마케팅 비중이 있었지만, 최근 누적 경력은 영업 기능에 더 많이 쌓여 있어 현재는 영업 축 강점이 더 강하게 읽힙니다.");
  }
  if (primaryFunction === "research_rnd" && functionMismatch) {
    evidence.push("문서화와 정확성, 연구 수행 경험은 강하지만, 현재까지의 누적 기능은 연구 중심으로 읽혀 타깃 역할의 직접 수행 경험과는 구분됩니다.");
  }

  // ── comparisonPack 기반 evidence — append-only Round 4-A ─────────────────
  if (_cpDirectnessTrig) {
    evidence.push("경력 연차 자체는 부족해 보이지 않지만, 지원 직무와 직접적으로 연결되는 경험이 부족하게 보일 수 있습니다.");
    const _cpMissing = Array.isArray(comparisonPack?.missingDirectEvidence)
      ? comparisonPack.missingDirectEvidence
      : [];
    if (_cpMissing.length > 0) {
      evidence.push(`JD에서 중요하게 보는 직접 경험: ${_cpMissing.slice(0, 3).join(", ")}`);
    }
    const _cpSignals = Array.isArray(comparisonPack?.transferableSignals)
      ? comparisonPack.transferableSignals
      : [];
    for (const sig of _cpSignals.slice(0, 2)) {
      const _sigText = sig?.caution
        || (sig?.resumeSignal ? `${sig.resumeSignal}은(는) 연결해서 설명할 수는 있지만, 연결되는 정도가 부족합니다.` : null);
      if (_sigText) evidence.push(_sigText);
    }
  }

  // ── P1-C: roleFitCareerMatch effectiveCareerSummary — append-only P2-1 ──────
  let _p1cExpApplied = false;
  let _p1cExpECS = null;
  const _ecs = roleFitCareerMatch?.effectiveCareerSummary ?? null;
  if (_ecs && typeof _ecs === "object") {
    const _roleRelevantMonths = typeof _ecs.roleRelevantMonths === "number" ? Math.max(0, _ecs.roleRelevantMonths) : null;
    const _stronglyMonths     = typeof _ecs.stronglyRelevantMonths === "number" ? Math.max(0, _ecs.stronglyRelevantMonths) : null;
    const _partiallyMonths    = typeof _ecs.partiallyRelevantMonths === "number" ? Math.max(0, _ecs.partiallyRelevantMonths) : null;
    if (_roleRelevantMonths !== null) {
      _p1cExpApplied = true;
      _p1cExpECS = _ecs;
      const _roleRelevantYears = Math.round((_roleRelevantMonths / 12) * 10) / 10;

      // evidence: role-relevant vs total breakdown
      if (totalCareerMonths > 0 && _roleRelevantMonths < totalCareerMonths) {
        evidence.push(`지원 직무 기준 유효 경력: 약 ${_roleRelevantYears}년 (총 경력 ${totalCareerYears}년 중)`);
        if (_stronglyMonths !== null && _stronglyMonths > 0) {
          const _stronglyYears = Math.round((_stronglyMonths / 12) * 10) / 10;
          evidence.push(`지원 직무와 직접 연결되는 경력: 약 ${_stronglyYears}년`);
        }
        if (_partiallyMonths !== null && _partiallyMonths > 0) {
          const _partiallyYears = Math.round((_partiallyMonths / 12) * 10) / 10;
          evidence.push(`일부 연결 가능한 인접 경력: 약 ${_partiallyYears}년`);
        }
        evidence.push("총 경력과 지원 직무 기준 유효 경력을 구분해 보면, 지원 직무와 직접 연결되는 경력은 더 짧게 읽힐 수 있습니다.");
      }

      // severity escalation: only if not already critical/high, and JD minimum exists
      // Do not escalate to critical from P1-C alone
      if (
        yearsRequiredMinMonths !== null &&
        _roleRelevantMonths < yearsRequiredMinMonths &&
        (severity === "none" || severity === "medium")
      ) {
        const _shortfallMonths = yearsRequiredMinMonths - _roleRelevantMonths;
        if (_shortfallMonths >= 6) {
          severity = "high";
          triggered = true;
        } else if (_shortfallMonths >= 1) {
          if (severity === "none") {
            severity = "medium";
            triggered = true;
          }
        }
      }
    }
  }
  // ── End P1-C ──────────────────────────────────────────────────────────────────

  const raw = {
    yearsRequiredMin,
    yearsRequiredMax,
    totalCareerMonths,
    rawTotalCareerMonths,
    totalCareerYears,
    countedPeriodCount,
    skippedPeriodCount,
    durationPack,
    functionPack,
    targetFunctionHint,
    targetFunctionHintText,
    primaryFunction,
    dominantRecentFunction,
    secondaryFunctions,
    functionMismatch,
    adjacentFunctionSupport,
    countedPeriods,
    skippedPeriods,
    experiencePolicyMode,
  };

  // append-only Round 4-A: fitUnderstandingPack 적용 여부 기록
  if (_cpDirectnessTrig) {
    raw.fitUnderstandingApplied  = true;
    raw.comparisonFunctionFit    = _cpFunctionFit;
    raw.comparisonCareerLevelFit = _cpCareerLevelFit;
    raw.comparisonRiskLabel      = comparisonPack?.userFacingRiskLabel ?? null;
  }

  // append-only P2-1: P1-C role-fit context
  if (_p1cExpApplied) {
    raw.roleFitCareerMatchApplied    = true;
    raw.roleFitEffectiveCareerSummary = _p1cExpECS;
  }

  return createRiskResult({
    key:         "experience_level_gap",
    title:       _titleOverride ?? "연차·레벨 불일치",
    category:    "fatal",
    severity,
    triggered,
    summaryText: _summaryTextOverride ?? (SUMMARY_TEXT[severity] ?? SUMMARY_TEXT.none),
    detailText:  _detailTextOverride  ?? (DETAIL_TEXT[severity]  ?? DETAIL_TEXT.none),
    evidence,
    raw,
  });
}
