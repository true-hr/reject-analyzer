// src/lib/decision/riskProfiles/impactEvidence/quantifiedImpactRisk.js
// 정량 성과(숫자) 부족 리스크
// - structuralPatterns의 NO_QUANTIFIED_IMPACT 플래그를 riskProfile로 승격 :contentReference[oaicite:3]{index=3}
// - metrics.numbersCount 기반 :contentReference[oaicite:4]{index=4}
// - THRESH.MIN_NUMBERS_COUNT 기본 1 :contentReference[oaicite:5]{index=5}

function safeNum(v, fallback = null) {
  return Number.isFinite(v) ? v : fallback;
}

function safeStr(v, fallback = "") {
  try {
    return (v ?? "").toString();
  } catch {
    return fallback;
  }
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function _getStructural(ctx) {
  const c = isObj(ctx) ? ctx : {};
  const structural = isObj(c.structural) ? c.structural : null;

  const flags =
    (structural && Array.isArray(structural.flags) ? structural.flags : null) ||
    (Array.isArray(c.flags) ? c.flags : null) ||
    [];

  const metrics =
    (structural && isObj(structural.metrics) ? structural.metrics : null) ||
    (isObj(c.metrics) ? c.metrics : {}) ||
    {};

  return { flags, metrics };
}

function _findFlag(flags, id) {
  if (!Array.isArray(flags)) return null;
  for (const f of flags) {
    if (!f) continue;
    if (safeStr(f.id) === id) return f;
  }
  return null;
}

function _clamp01(x) {
  const n = safeNum(x, 0);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export const quantifiedImpactRisk = {
  id: "IMPACT__NO_QUANTIFIED_IMPACT",
  group: "impactEvidence",
  layer: "hireability",
  priority: 90,
  severityBase: 5,
  tags: ["impactEvidence", "quantified", "numbers"],

  // 트리거:
  // 1) structuralPatterns 플래그가 있으면 true
  // 2) 플래그가 없어도 metrics로 재현 (numbersCount < minNumbersCount)
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_QUANTIFIED_IMPACT");
    if (flag) return true;

    const n = safeNum(metrics.numbersCount, null);
    if (n == null) return false;

    const min = safeNum(metrics.minNumbersCount, null) ?? 1; // THRESH.MIN_NUMBERS_COUNT 기본 :contentReference[oaicite:6]{index=6}
    return n < min;
  },

  // score: 0~1
  // - structuralPatterns는 이 패턴을 score=0.8로 고정 :contentReference[oaicite:7]{index=7}
  // - flag.score가 있으면 그대로
  // - 없으면 numbersCount가 0일수록 높게
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_QUANTIFIED_IMPACT");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const n = safeNum(metrics.numbersCount, null);
    if (n == null) return 0;

    // 가장 흔한 케이스:
    // n=0 -> 0.85, n=1 -> 0.35 (이미 최소 충족이므로 보통 when=false겠지만 안전 처리), n>=2 -> 0.2
    if (n <= 0) return 0.85;
    if (n === 1) return 0.35;
    return 0.2;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "NO_QUANTIFIED_IMPACT");

    const detail = isObj(flag?.detail) ? flag.detail : {};

    const n =
      safeNum(detail.numbersCount, null) ??
      safeNum(metrics.numbersCount, null) ??
      0;

    const min =
      safeNum(detail.minNumbersCount, null) ??
      safeNum(metrics.minNumbersCount, null) ??
      1;

    const why = [
      "성과가 ‘잘했다/했다’로만 읽히고, 채용자가 판단할 수 있는 숫자 근거(%, 금액, 규모, 시간, 건수)가 거의 없습니다.",
      "서류에서는 ‘성과의 크기’보다 ‘성과가 실제로 있었는지’를 숫자로 빠르게 판별하는 경향이 강해서, 정량 근거가 없으면 불리합니다.",
    ];

    const fix = [
      "각 프로젝트/업무 bullet마다 숫자 1개만 강제로 붙이세요. (예: 전환율/매출/비용/처리시간/불량률/리드타임/CS건수 등)",
      "숫자가 바로 없으면 ‘Before→After’ 형태로라도 만드세요. (예: 3일→1일, 월 10건→30건, 오류 5%→2%)",
      "정확한 수치가 민감하면 범위/상대값도 가능합니다. (예: ‘약 20% 개선’, ‘월 수십 건’, ‘연간 수억 규모’)",
    ];

    const notes = [];
    notes.push(`numbersCount: ${n}`);
    notes.push(`minNumbersCount: ${min}`);
    if (flag?.title) notes.push(`patternTitle: ${safeStr(flag.title)}`);

    const evidenceKeys = ["numbersCount"];

    const title = flag?.title
      ? `정량 성과 리스크: ${safeStr(flag.title)}`
      : "정량 성과(숫자) 부족 리스크";

    return {
      title,
      why,
      fix,
      evidenceKeys,
      notes,
    };
  },

  suppressIf: [],
};
