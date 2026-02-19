// src/lib/decision/riskProfiles/ownershipLeadership/ownershipRatioRisk.js
// 오너십 표현(강한 동사) 비율이 낮고, 참여/지원/보조 중심으로 읽히는 리스크
// - structuralPatterns의 LOW_OWNERSHIP_VERB_RATIO 플래그를 riskProfile로 승격 :contentReference[oaicite:2]{index=2}
// - 기본 임계값: OWNERSHIP_STRONG_MIN=2, OWNERSHIP_RATIO_LOW=0.6 :contentReference[oaicite:3]{index=3}
// - score 수식은 structuralPatterns와 동일하게 유지 :contentReference[oaicite:4]{index=4}

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

function _calcRatio(strong, weak) {
  const s = safeNum(strong, 0) ?? 0;
  const w = safeNum(weak, 0) ?? 0;
  const denom = s + w;
  if (denom <= 0) return null;
  return s / denom;
}

export const ownershipRatioRisk = {
  id: "OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO",
  group: "ownershipLeadership",
  layer: "hireability",
  priority: 86,
  severityBase: 4,
  tags: ["ownership", "leadership", "responsibility"],

  // 트리거:
  // 1) structuralPatterns 플래그가 있으면 true
  // 2) 플래그가 없어도 metrics로 동일 조건을 재현(보조 트리거)
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_OWNERSHIP_VERB_RATIO");
    if (flag) return true;

    const strong = safeNum(metrics.ownershipStrongCount, null);
    const weak = safeNum(metrics.ownershipWeakCount, null);
    if (strong == null || weak == null) return false;

    const ratio = _calcRatio(strong, weak);
    if (ratio == null) return false; // denom=0이면 structuralPatterns도 스킵(오탐방지) :contentReference[oaicite:5]{index=5}

    const minStrong = 2; // THRESH.OWNERSHIP_STRONG_MIN default :contentReference[oaicite:6]{index=6}
    const minRatio = 0.6; // THRESH.OWNERSHIP_RATIO_LOW default :contentReference[oaicite:7]{index=7}

    return strong >= minStrong && ratio < minRatio;
  },

  // score: 0~1
  // - flag.score가 있으면 그대로 사용
  // - 없으면 structuralPatterns와 동일 수식 적용 :contentReference[oaicite:8]{index=8}
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_OWNERSHIP_VERB_RATIO");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const strong = safeNum(metrics.ownershipStrongCount, null);
    const weak = safeNum(metrics.ownershipWeakCount, null);
    if (strong == null || weak == null) return 0;

    const ratio = _calcRatio(strong, weak);
    if (ratio == null) return 0;

    const minRatio = 0.6;
    const raw = (minRatio - ratio) / minRatio + 0.4;
    return _clamp01(raw);
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "LOW_OWNERSHIP_VERB_RATIO");

    const detail = isObj(flag?.detail) ? flag.detail : {};

    const strong =
      safeNum(detail.strong, null) ??
      safeNum(metrics.ownershipStrongCount, null) ??
      0;

    const weak =
      safeNum(detail.weak, null) ??
      safeNum(metrics.ownershipWeakCount, null) ??
      0;

    const ratio =
      safeNum(detail.ratio, null) ??
      _calcRatio(strong, weak);

    const minStrong = safeNum(detail.minStrong, null) ?? 2;
    const minRatio = safeNum(detail.minRatio, null) ?? 0.6;

    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    const why = [];
    why.push("이력서 문장들이 ‘내가 결정/주도했다’보다 ‘참여/지원/보조했다’로 읽힐 가능성이 큽니다.");
    if (ratio != null) {
      why.push(
        `오너십 강동사 비율이 낮습니다. (strong ${strong}, weak ${weak}, ratio ${Math.round(ratio * 100)}%)`
      );
      why.push(
        `기준: strong ≥ ${minStrong}, ratio < ${Math.round(minRatio * 100)}%`
      );
    }

    if (evidence.length) {
      why.push(`근거 스니펫(일부): ${evidence.slice(0, 3).join(" / ")}`);
    }

    const fix = [
      "각 bullet을 ‘내가 결정한 것(Decision) / 내가 책임진 범위(Scope) / 내가 만든 결과(Impact)’ 3요소로 재작성하세요.",
      "‘지원/협업’은 지우지 말고, 문장 앞쪽을 ‘주도/설계/정의/리드’로 바꾸고 뒤에 ‘유관부서 협업으로 실행’ 형태로 붙이세요.",
      "오너십 강동사를 강제로 늘리기보다 ‘내가 무엇의 오너였는지(지표/모듈/프로세스/예산)’를 명사로 고정해 반복 노출시키세요.",
    ];

    const notes = [];
    notes.push(`ownershipStrongCount: ${strong}`);
    notes.push(`ownershipWeakCount: ${weak}`);
    if (ratio != null) notes.push(`ratio strong/(strong+weak): ${Math.round(ratio * 1000) / 10}%`);
    notes.push(`threshold minStrong=${minStrong}, minRatio=${minRatio}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["ownershipStrongCount", "ownershipWeakCount"];

    const title = flag?.title
      ? `오너십 리스크: ${safeStr(flag.title)}`
      : "오너십 표현이 약하고 참여/지원 중심 리스크";

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
