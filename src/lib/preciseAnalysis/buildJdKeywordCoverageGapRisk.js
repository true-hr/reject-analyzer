// src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js
// [PRECISE-RISK-V1] JD 키워드 반영 부족 엔진 — jd_keyword_coverage_gap
// 입력: buildJdResumeFit() 반환 fit object + parseWithAI() parsedResume + resume raw text
//
// keywordPolicyMode:
//   "keyword-check"      — domainKeywords 기준 실제 coverage 비교 수행
//   "insufficient-data"  — domainKeywords 없어 강한 판정 보류

import { createRiskResult } from "./createRiskResult.js";
import { TOOL_ALIASES } from "../decision/evidence/evidenceAliases.js";
import certRules from "../ontology/certs/cert_rules.v0.json";
import { classifyKeywordBuckets } from "./jdKeywordVocabulary.js";

const SUMMARY_TEXT = {
  high:   "JD에서 자주 등장하는 핵심 키워드가 이력서에서 충분히 확인되지 않습니다.",
  medium: "일부 JD 핵심 키워드가 이력서에 충분히 반영되지 않은 것으로 보입니다.",
  low:    "JD 키워드 반영은 일부 이뤄졌지만, 더 직접적으로 드러내면 좋습니다.",
  none:   "JD 주요 키워드가 이력서에 전반적으로 반영되어 있습니다.",
};

const DETAIL_TEXT = {
  high:
    "ATS와 서류 검토 단계에서는 JD에 반복적으로 등장하는 표현이 이력서에 직접 드러나는지가 중요합니다. 관련 경험이 있다면 JD의 용어에 맞춰 더 명확하게 표현하는 것이 좋습니다.",
  medium:
    "일부 핵심 키워드가 이력서에서 직접 확인되지 않습니다. 경험이 있다면 JD의 표현 방식을 참고해 이력서 문장을 더 맞춰보는 것이 좋습니다.",
  low:
    "키워드 반영은 일부 되어 있지만, 중요도가 높은 표현을 조금 더 직접적으로 넣으면 도움이 될 수 있습니다.",
  none:
    "JD의 핵심 키워드가 이력서에 일정 수준 이상 반영되어 있습니다.",
};

// ── 내부 helper ──────────────────────────────────────────────────────────────

/** 표기 흔들림 방어용 normalize (동의어/번역 없음) */
function _norm(s) {
  return String(s ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

// ── Alias bridge 자산 (즉시 활용) ────────────────────────────────────────────
// 출처: evidenceAliases.TOOL_ALIASES + cert_rules.jdSignalMapping
// TASK_ALIASES는 이번 라운드 제외 — 일반어 false positive 위험

/** TOOL_ALIASES를 정규화 alias 그룹 배열로 변환 */
const _TOOL_KW_GROUPS = Object.values(TOOL_ALIASES).map(
  (aliases) => aliases.map(_norm)
);

/** cert jdSignalMapping을 정규화 alias 그룹 배열로 변환 */
const _CERT_KW_GROUPS = certRules.jdSignalMapping.signals.map(
  (sig) => sig.keywords.map(_norm)
);

/**
 * Alias bridge: exact miss일 때만 개입.
 * 같은 alias group 내 다른 표현이 coverageNorm에 있으면 true 반환.
 * @param {string} kw           — 이미 normalize된 JD keyword
 * @param {string} coverageNorm — 이미 normalize된 이력서 전체 텍스트
 */
function _tryAliasMatch(kw, coverageNorm) {
  const ptBlock = _PT_ALIAS_BLOCK.get(kw) ?? null;
  // 1. Tool alias groups (TOOL_ALIASES — power bi/powerbi/pbi, excel/엑셀 등)
  for (const group of _TOOL_KW_GROUPS) {
    if (group.includes(kw)) {
      for (const alias of group) {
        if (alias !== kw && (!ptBlock || !ptBlock.has(alias)) && coverageNorm.includes(alias)) return true;
      }
    }
  }
  // 2. Cert alias groups (jdSignalMapping — SQLD/SQL 개발자, ADsP/ADSP 등)
  for (const group of _CERT_KW_GROUPS) {
    if (group.includes(kw)) {
      for (const alias of group) {
        if (alias !== kw && coverageNorm.includes(alias)) return true;
      }
    }
  }
  return false;
}
// ── End alias bridge ──────────────────────────────────────────────────────────

// ── Precision trap guard ──────────────────────────────────────────────────────
// substring 기반 과잉 매칭 방어. 짧은 고위험 keyword만 좁게 적용.
//
// _PT_BOUNDARY: 이 set의 keyword는 left-boundary 기준으로만 exact match 허용.
//   "sql" → "mysql"/"postgresql"/"nosql" substring 오탐 차단.
//   "sqld 보유"처럼 선두 위치(left char 없음)는 계속 통과.
//
// _PT_ALIAS_BLOCK: tool alias bridge에서도 연결 차단할 쌍.
//   sql ↔ mysql/mssql/postgresql: 동일 계열이지만 서로 다른 기술이므로 alias 불허.
const _PT_BOUNDARY = new Set(["sql", "ga", "bi", "hr"]);
const _PT_ALIAS_BLOCK = new Map([
  ["sql", new Set(["mysql", "mssql", "postgresql"])],
]);

/**
 * left-boundary exact match.
 * _PT_BOUNDARY에 있는 keyword는 앞 글자가 [a-z0-9]면 매칭 거부.
 * 그 외 keyword는 기존 includes() 그대로.
 */
function _leftBoundaryMatch(kw, coverageNorm) {
  if (!_PT_BOUNDARY.has(kw)) return coverageNorm.includes(kw);
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}`).test(coverageNorm);
}
// ── End precision trap guard ──────────────────────────────────────────────────

/**
 * parsedResume + resumeRawText에서 coverage 텍스트를 수집.
 * skills / summary / timeline bullets / raw text 순으로 합산.
 */
function _buildCoverageText(parsedResume, resumeRawText) {
  const parts = [];

  // skills
  if (Array.isArray(parsedResume?.skills)) {
    parts.push(...parsedResume.skills.filter((s) => s && typeof s === "string"));
  }
  // summary
  if (parsedResume?.summary && typeof parsedResume.summary === "string") {
    parts.push(parsedResume.summary);
  }
  // timeline bullets
  if (Array.isArray(parsedResume?.timeline)) {
    for (const item of parsedResume.timeline) {
      if (Array.isArray(item?.bullets)) {
        parts.push(...item.bullets.filter((b) => b && typeof b === "string"));
      }
    }
  }
  // raw resume text (fallback / supplement)
  if (resumeRawText && typeof resumeRawText === "string" && resumeRawText.trim()) {
    parts.push(resumeRawText);
  }

  return _norm(parts.join(" "));
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * JD 키워드 반영 부족 리스크 엔진.
 * @param {object|null|undefined} fit                      — buildJdResumeFit() 반환값
 * @param {object|null|undefined} parsedResume             — parseWithAI() 반환값
 * @param {string|null|undefined} resumeRawText            — 이력서 원문 텍스트
 * @param {object|null|undefined} jdRequirementDecomposition — P1-B 반환값 (optional)
 * @param {object|null|undefined} roleFitCareerMatch       — P1-C 반환값 (optional)
 * @returns {import("./createRiskResult.js").RiskResult}
 */
export function buildJdKeywordCoverageGapRisk(fit, parsedResume, resumeRawText, jdRequirementDecomposition = null, roleFitCareerMatch = null) {
  // ── domainKeywords 추출 & normalize ───────────────────────────────────────
  const rawKeywords = Array.isArray(fit?.jdModel?.domainKeywords)
    ? fit.jdModel.domainKeywords
    : [];

  // normalize + dedupe (순서 유지)
  const seen = new Set();
  const keywords = [];
  for (const kw of rawKeywords) {
    const n = _norm(kw);
    if (n && !seen.has(n)) {
      seen.add(n);
      keywords.push(n);
    }
  }

  const domainKeywordCount = keywords.length;

  // ── insufficient-data ─────────────────────────────────────────────────────
  if (domainKeywordCount === 0) {
    return createRiskResult({
      key:         "jd_keyword_coverage_gap",
      title:       "JD 키워드 반영 부족",
      category:    "important",
      severity:    "none",
      triggered:   false,
      summaryText: SUMMARY_TEXT.none,
      detailText:  DETAIL_TEXT.none,
      evidence:    ["JD 핵심 키워드: 0개"],
      raw: {
        domainKeywordCount:   0,
        matchedKeywordCount:  0,
        missingKeywordCount:  0,
        missingKeywords:      [],
        keywordCoverageRatio: 0,
        keywordPolicyMode:    "insufficient-data",
      },
    });
  }

  // ── coverage text 수집 ────────────────────────────────────────────────────
  const coverageNorm = _buildCoverageText(parsedResume, resumeRawText);

  // ── 키워드별 hit/miss 판정 (substring 포함 여부 + alias bridge) ────────────
  const exactMatched  = [];
  const aliasMatched  = [];
  const missing       = [];
  for (const kw of keywords) {
    if (_leftBoundaryMatch(kw, coverageNorm)) {
      // exact match (boundary guard 적용 — 고위험 짧은 keyword는 left-boundary 기준)
      exactMatched.push(kw);
    } else if (_tryAliasMatch(kw, coverageNorm)) {
      // alias bridge: exact miss이지만 동일 자산 그룹 내 동의 표현 확인
      aliasMatched.push(kw);
    } else {
      missing.push(kw);
    }
  }
  const matched = [...exactMatched, ...aliasMatched];

  const matchedKeywordCount  = matched.length;
  const missingKeywordCount  = missing.length;
  const keywordCoverageRatio = matchedKeywordCount / domainKeywordCount;
  const hasMixedKeywordProfile = matchedKeywordCount >= 1 && missingKeywordCount >= 1;

  // ── must.miss 보조 신호 ───────────────────────────────────────────────────
  const mustMissCount = Array.isArray(fit?.match?.must?.miss)
    ? fit.match.must.miss.length
    : 0;

  // ── severity 결정 (keyword-check) ─────────────────────────────────────────
  // Note: spec의 medium 조건 "OR missingKeywordCount >= 2"는
  //       QA-F(5개 중 3개 → low)와 충돌하므로 ratio 기준 우선 적용.
  //       고 신뢰 booster signal(missing>=3 AND mustMiss>=2)만 high 보조로 허용.
  let severity;
  if (keywordCoverageRatio < 0.3 || (missingKeywordCount >= 3 && mustMissCount >= 2)) {
    severity = "high";
  } else if (keywordCoverageRatio <= 0.5) {
    severity = "medium";
  } else if (keywordCoverageRatio < 0.8) {
    severity = "low";
  } else {
    severity = "none";
  }

  const triggered = severity !== "none";

  // ── evidence 구성 ─────────────────────────────────────────────────────────
  const evidence = [];
  evidence.push(`JD 핵심 키워드: ${domainKeywordCount}개`);
  evidence.push(`이력서에서 확인된 키워드: ${matchedKeywordCount}개`);
  if (missingKeywordCount > 0) {
    evidence.push(`직접 확인되지 않은 키워드: ${missing.join(", ")}`);
  }
  evidence.push(`키워드 반영률: 약 ${Math.round(keywordCoverageRatio * 100)}%`);
  if (aliasMatched.length > 0) {
    evidence.push("표기만 다른 동일 항목은 보정해 반영했습니다.");
    evidence.push("도구·자격증처럼 확인 가능한 항목은 영문/한글/축약 차이를 일부 정규화해 다시 확인했습니다.");
    evidence.push("다만 의미가 넓은 일반 업무 표현은 오탐을 막기 위해 보수적으로 제외했습니다.");
  } else {
    evidence.push("이번 결과는 이력서에서 직접 확인되는 표현 중심으로 정리했습니다.");
    evidence.push("의미가 넓게 퍼질 수 있는 일반 업무 표현은 오탐을 막기 위해 보수적으로 연결하지 않았습니다.");
  }
  if (hasMixedKeywordProfile) {
    evidence.push("관련 역량과 도구 경험은 확인되지만, 타깃 역할의 직접 수행 경험까지 바로 이어지는 근거는 아직 제한적입니다.");
    evidence.push("즉, 전이 가능한 강점은 보이지만 역할 브릿지는 추가 설명이 필요한 상태입니다.");
  }

  const raw = {
    domainKeywords:       keywords,
    matchedKeywords:      matched,
    aliasMatchedKeywords: aliasMatched,
    domainKeywordCount,
    matchedKeywordCount,
    missingKeywordCount,
    missingKeywords:      missing,
    keywordCoverageRatio,
    keywordPolicyMode:    "keyword-check",
  };

  // ── T1: bucket 분류 (additive) ────────────────────────────────────────────
  // matched/missing 키워드를 직무·산업 맥락 범주(coreTask/toolSkill/metricOutcome 등)로 묶어
  // 사용자가 "어떤 종류 표현이 부족한지"를 바로 볼 수 있도록 한다.
  // 기존 matched/missingKeywords 구조는 그대로 두고 신규 필드만 추가한다.
  const { keywordBuckets, strongestMissingBucket } = classifyKeywordBuckets({
    matched,
    missing,
  });
  raw.keywordBuckets = keywordBuckets;
  raw.strongestMissingBucket = strongestMissingBucket;

  // ── P1-B + P1-C: 보조 키워드 및 역할 언어 갭 신호 ────────────────────────
  if (jdRequirementDecomposition || roleFitCareerMatch) {
    // P1-B: 보조 키워드 수집 (deterministic 분모에 영향 없음)
    const _p1bTechKws    = Array.isArray(jdRequirementDecomposition?.requirementSummary?.keyTechKeywords)
      ? jdRequirementDecomposition.requirementSummary.keyTechKeywords : [];
    const _p1bDomainKws  = Array.isArray(jdRequirementDecomposition?.requirementSummary?.keyDomainKeywords)
      ? jdRequirementDecomposition.requirementSummary.keyDomainKeywords : [];

    // Normalize, dedupe, exclude already-seen deterministic keywords
    const _p1bSuppSeen = new Set();
    const _p1bSuppKws  = [];
    for (const kw of [..._p1bTechKws, ..._p1bDomainKws]) {
      const n = _norm(kw);
      if (n && !seen.has(n) && !_p1bSuppSeen.has(n)) {
        _p1bSuppSeen.add(n);
        _p1bSuppKws.push(n);
      }
    }

    // Run same coverage check on supplementary keywords
    const _p1bSuppMatched  = [];
    const _p1bSuppMissing  = [];
    for (const kw of _p1bSuppKws) {
      if (_leftBoundaryMatch(kw, coverageNorm) || _tryAliasMatch(kw, coverageNorm)) {
        _p1bSuppMatched.push(kw);
      } else {
        _p1bSuppMissing.push(kw);
      }
    }

    const _aiSupplementKeywordCount = _p1bSuppKws.length;
    const _aiSupplementMatchedCount = _p1bSuppMatched.length;
    const _aiSupplementMissingKws   = _p1bSuppMissing;

    if (_aiSupplementKeywordCount > 0) {
      evidence.push(`AI 보조 JD 키워드: ${_aiSupplementKeywordCount}개`);
      evidence.push(`AI 보조 JD 키워드 반영: ${_aiSupplementMatchedCount}개`);
      if (_aiSupplementMissingKws.length > 0) {
        const _showMissing = _aiSupplementMissingKws.slice(0, 5).join(", ");
        evidence.push(`AI 보조 키워드 미반영: ${_showMissing}`);
      }
    }

    // P1-C: role language / core task gap type count
    const _p1cMatches = Array.isArray(roleFitCareerMatch?.careerFitMatches)
      ? roleFitCareerMatch.careerFitMatches : [];
    const _aiWrongLanguageCount    = _p1cMatches.filter((m) =>
      Array.isArray(m?.gapTypes) && m.gapTypes.includes("wrong_language")
    ).length;
    const _aiMissingCoreTaskCount  = _p1cMatches.filter((m) =>
      Array.isArray(m?.gapTypes) && m.gapTypes.includes("missing_core_task")
    ).length;

    if (_aiWrongLanguageCount > 0 || _aiMissingCoreTaskCount > 0) {
      const _gapParts = [];
      if (_aiWrongLanguageCount > 0)   _gapParts.push(`역할 언어 불일치 ${_aiWrongLanguageCount}건`);
      if (_aiMissingCoreTaskCount > 0) _gapParts.push(`핵심 업무 미충족 ${_aiMissingCoreTaskCount}건`);
      evidence.push(`AI 분석 역할 언어·핵심업무 갭 신호: ${_gapParts.join(", ")}`);
    }

    raw.jdRequirementDecompositionApplied = true;
    raw.roleFitCareerMatchApplied         = true;
    raw.aiSupplementKeywordCount          = _aiSupplementKeywordCount;
    raw.aiSupplementMatchedCount          = _aiSupplementMatchedCount;
    raw.aiSupplementMissingKeywords       = _aiSupplementMissingKws;
    raw.aiWrongLanguageCount              = _aiWrongLanguageCount;
    raw.aiMissingCoreTaskCount            = _aiMissingCoreTaskCount;
  }

  // ── T1: bucket-aware 메시지 보강 ──────────────────────────────────────────
  // strongestMissingBucket이 있으면 어느 범주 표현이 약한지 한 줄로 짚어준다.
  // 단정/탈락 표현은 사용하지 않고, "보완 우선순위"/"가능성" 톤을 유지한다.
  let summaryText = SUMMARY_TEXT[severity] ?? SUMMARY_TEXT.none;
  let detailText  = DETAIL_TEXT[severity]  ?? DETAIL_TEXT.none;
  if (triggered && strongestMissingBucket) {
    const bucketLabel = strongestMissingBucket.label;
    summaryText = `JD가 요구하는 ${bucketLabel} 표현이 이력서에 충분히 드러나지 않습니다.`;
    detailText = `${bucketLabel} 범주에서 ${strongestMissingBucket.missingCount}개 키워드가 이력서에서 직접 확인되지 않았습니다. 관련 경험이 있다면 JD에서 쓰는 표현으로 이력서 문장을 다시 정리해보세요.`;
  }

  return createRiskResult({
    key:         "jd_keyword_coverage_gap",
    title:       "JD 키워드 반영 부족",
    category:    "important",
    severity,
    triggered,
    summaryText,
    detailText,
    evidence,
    raw,
  });
}
