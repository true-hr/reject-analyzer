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

    // [PATCH] rewrite explain text (quality) - keep arrays for UI
    const why = [
      "정량 근거(%, 금액, 규모, 시간, 건수, 전/후)가 거의 없어 면접관이 ‘성과’가 아니라 ‘업무 나열’로 판단할 가능성이 큽니다.",
      "서류 단계에서는 ‘무엇을 했다’보다 ‘무엇이 얼마나 좋아졌는지’가 합격 신호인데, 숫자/비교가 없으면 보수적으로 컷되는 경우가 많습니다.",
    ];

    // [PATCH] actions: practical templates (App.jsx expects actions-like list)
    const actions = [
      "각 프로젝트/경험 bullet마다 ‘전/후(Before/After)’를 1개씩만이라도 넣으세요. (예: 처리시간 3분→1분, 오류율 5%→2%)",
      "정량이 민감하면 정확한 수치 대신 범위/규모로 표현하세요. (예: 약 10~20% 개선, 월 수천 건 규모, N배 수준)",
      "대체 지표로 바꾸세요: 리드타임(일), 처리량(건/일), 전환율(%), 비용(원), 장애/오류율(%), CS/클레임(건).",
      "숫자에 ‘내 역할’을 붙이세요: 내가 설계/실행/리딩한 부분 → 어떤 지표가 얼마나 변했는지.",
      "JD의 KPI 1~2개를 골라 그 KPI 기준으로 성과 문장을 재작성하세요. (채용팀은 JD 기준으로 읽습니다)",
    ];

    // [PATCH] counterExamples: realistic exceptions
    const counterExamples = [
      "보안/규제로 수치 공개가 어렵다면, 수치 대신 ‘검증 방식(로그/테스트/리뷰/감사)’과 ‘개선 방향(증감)’을 제시하면 완화됩니다.",
      "R&D/기획처럼 성과가 지연되는 직무라면, 중간 산출물(의사결정, 리스크 감소, 품질지표, 승인/채택)로 대체해도 됩니다.",
      "조직/환경 영향이 커서 개인 공이 애매하다면, ‘내 기여 범위’와 ‘내가 통제한 지표’를 분리해 쓰면 신뢰도가 올라갑니다.",
    ];

    const notes = [];
    notes.push(`numbersCount: ${n}`);
    notes.push(`minNumbersCount: ${min}`);
    if (flag?.title) notes.push(`patternTitle: ${safeStr(flag.title)}`);

    const evidenceKeys = ["numbersCount"];

    // [PATCH] stabilize title string (avoid broken/garbled literals)
    const title = flag?.title
      ? `정량 성과 리스크: ${safeStr(flag.title)}`
      : "정량 성과 리스크: 정량 근거(숫자) 부족";

    return {
      title,
      why,

      // [PATCH] new keys (preferred)
      actions,
      counterExamples,

      // [PATCH] backward-compat aliases (append-only)
      fix: actions,
      action: actions,
      counterexamples: counterExamples,
      counterExample: counterExamples,
      counterexample: counterExamples,
      counter: counterExamples,

      evidenceKeys,
      notes,
    };
  },

  suppressIf: [],
};
