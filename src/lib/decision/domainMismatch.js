// src/lib/decision/domainMismatch.js
// PASSMAP Domain Role Mismatch Detector v1
// rule-based, append-only — no ML, no ontology expansion

// ─────────────────────────────────────────────────────────────
// Family keyword map (v1 — minimum viable 2 families)
// ─────────────────────────────────────────────────────────────
const DOMAIN_FAMILY_MAP = {
  procurement_scm: [
    "strategic sourcing", "sourcing", "procurement", "purchasing", "buyer",
    "vendor", "supplier", "supply chain", "scm", "cost reduction",
    "contract negotiation", "sap", "erp", "global supplier",
    "전략 소싱", "소싱", "구매", "바이어", "벤더", "공급업체", "공급망",
    "원가 절감", "계약 협상", "글로벌 공급업체", "전략소싱",
  ],
  product_service_planning: [
    "service planning", "product planning", "feature planning",
    "feature improvement", "user analysis", "retention", "conversion",
    "customer requirement", "launch", "roadmap", "pm",
    "서비스 기획", "서비스기획", "제품 기획", "기능 기획", "기능 개선",
    "사용자 분석", "유지율", "전환율", "고객 요구사항", "출시", "로드맵",
  ],
};

const FAMILY_LABEL = {
  procurement_scm: "구매/전략소싱/SCM",
  product_service_planning: "서비스기획/프로덕트기획",
};

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────
function _norm(text) {
  return String(text || "").toLowerCase().replace(/[\s\-_/]+/g, " ");
}

function _detectFamily(text) {
  const norm = _norm(text);
  let bestFamily = null;
  let bestCount = 0;
  const matchedByFamily = {};

  for (const [family, keywords] of Object.entries(DOMAIN_FAMILY_MAP)) {
    const hits = keywords.filter((kw) => norm.includes(_norm(kw)));
    matchedByFamily[family] = hits;
    if (hits.length > bestCount) {
      bestCount = hits.length;
      bestFamily = family;
    }
  }

  return {
    family: bestCount > 0 ? bestFamily : null,
    keywords: bestCount > 0 ? matchedByFamily[bestFamily] : [],
  };
}

function _calcSimilarity(jdResult, resumeResult) {
  // same family → base score
  if (jdResult.family && jdResult.family === resumeResult.family) return 0.7;
  // different or null → overlap ratio
  const jdSet = new Set(jdResult.keywords.map((k) => _norm(k)));
  const rsSet = new Set(resumeResult.keywords.map((k) => _norm(k)));
  let overlap = 0;
  for (const kw of jdSet) { if (rsSet.has(kw)) overlap++; }
  const denom = Math.max(jdSet.size, rsSet.size, 1);
  return overlap / denom;
}

// ─────────────────────────────────────────────────────────────
// Public: buildDomainComparison
// ─────────────────────────────────────────────────────────────
export function buildDomainComparison(jdText, resumeText) {
  try {
    const jd = _detectFamily(jdText);
    const resume = _detectFamily(resumeText);
    const jdSet = new Set(jd.keywords.map((k) => _norm(k)));
    const rsSet = new Set(resume.keywords.map((k) => _norm(k)));
    const overlapKeywords = [...jdSet].filter((k) => rsSet.has(k));
    const similarityScore = _calcSimilarity(jd, resume);
    const threshold = 0.25;
    const mismatchLikely = Boolean(
      jd.family &&
      resume.family &&
      jd.family !== resume.family &&
      similarityScore < threshold
    );
    return { jd, resume, similarityScore, overlapKeywords, threshold, mismatchLikely };
  } catch {
    return {
      jd: { family: null, keywords: [] },
      resume: { family: null, keywords: [] },
      similarityScore: 0,
      overlapKeywords: [],
      threshold: 0.25,
      mismatchLikely: false,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Public: buildDomainMismatchRisk
// ─────────────────────────────────────────────────────────────
export function buildDomainMismatchRisk(domainComparison) {
  if (!domainComparison?.mismatchLikely) return null;
  const jdFamily = String(domainComparison.jd?.family || "unknown");
  const rsFamily = String(domainComparison.resume?.family || "unknown");
  const jdLabel = FAMILY_LABEL[jdFamily] || jdFamily;
  const rsLabel = FAMILY_LABEL[rsFamily] || rsFamily;
  return {
    id: "DOMAIN_ROLE_MISMATCH",
    group: "gates",
    layer: "gate",
    score: 0.88,
    priority: 89,
    severityTier: "S",
    gateTriggered: true,
    evidence: {
      jdFamily,
      resumeFamily: rsFamily,
      similarityScore: domainComparison.similarityScore,
      overlapKeywords: domainComparison.overlapKeywords,
    },
    detail: {
      jdKeywords: domainComparison.jd?.keywords || [],
      resumeKeywords: domainComparison.resume?.keywords || [],
    },
    explain: {
      signal: "직무 도메인 불일치",
      userReason: `이력서의 직무 도메인(${rsLabel})과 JD가 요구하는 도메인(${jdLabel})이 다른 것으로 분석됩니다.`,
      evidence: [`JD 도메인: ${jdLabel}`, `이력서 도메인: ${rsLabel}`],
    },
    // ✅ PATCH R36 (append-only): 전환 부담 + JD 핵심 업무 직접성 부족 설명 강화
    interviewerView: `채용 담당자는 ${jdLabel} 직무의 핵심 업무 경험을 우선 확인합니다. 이력서가 ${rsLabel} 중심으로 서술되어 있어 JD 요구 업무와의 직접 연결 근거가 약하게 읽힐 수 있습니다.`,
    interviewPrepHint: `${rsLabel} 경험 중 ${jdLabel} 업무 맥락(예: 협상, 원가/성과 관리, 공급망 조율, 벤더 관계 등)과 연결되는 장면을 구체적으로 드러내세요. 직무 전환 이유와 연결 논리를 프로필 첫 문단에 명시하면 판단에 도움이 됩니다.`,
    transitionBurden: (() => {
      const sim = Number(domainComparison.similarityScore || 0);
      if (sim < 0.1) return `${rsLabel}에서 ${jdLabel}로의 전환은 업무 구조 차이가 커 직무 적응 부담이 높은 포지션입니다.`;
      return `${rsLabel}에서 ${jdLabel}로의 직무 전환 시 추가 적응 기간이 필요한 구조입니다.`;
    })(),
  };
}
