// src/lib/decision/riskProfiles/impactEvidence/impactVerbRisk.js
// 성과/임팩트 동사(개선/증가/최적화/향상 등) 부족 리스크
// - structuralPatterns: LOW_IMPACT_VERB_PATTERN :contentReference[oaicite:3]{index=3}

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

function _uniq(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const s = safeStr(x).trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export const impactVerbRisk = {
  id: "IMPACT__LOW_IMPACT_VERBS",
  group: "impactEvidence",
  layer: "hireability",
  priority: 88,
  severityBase: 4,
  tags: ["impactEvidence", "impactVerbs"],

  when: (ctx) => {
    if (typeof ctx?.__hasRisk === "function" && ctx.__hasRisk("RISK__EXECUTION_IMPACT_GAP")) {
      return false;
    }
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_IMPACT_VERB_PATTERN");
    if (flag) return true;

    const cnt = safeNum(metrics.impactVerbCount, null);
    if (cnt == null) return false;

    const min = safeNum(metrics.minImpactVerbs, null) ?? 2; // THRESH.MIN_IMPACT_VERBS 기본 2 :contentReference[oaicite:4]{index=4}
    return cnt < min;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_IMPACT_VERB_PATTERN");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const cnt = safeNum(metrics.impactVerbCount, null);
    if (cnt == null) return 0;

    const min = safeNum(metrics.minImpactVerbs, null) ?? 2;
    // 부족할수록 높게
    // cnt=0 -> 0.85, cnt=1 -> 0.65, cnt=2 -> 0.25
    if (cnt <= 0) return 0.85;
    if (cnt < min) return 0.65;
    return 0.25;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_IMPACT_VERB_PATTERN");
    const detail = isObj(flag?.detail) ? flag.detail : {};
    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    const cnt =
      safeNum(detail.impactVerbCount, null) ??
      safeNum(metrics.impactVerbCount, null) ??
      0;

    const min =
      safeNum(detail.minImpactVerbs, null) ??
      safeNum(metrics.minImpactVerbs, null) ??
      2;

    const hits = _uniq(detail.hits || metrics.impactVerbHits || []);

    const why = [
      "문장들이 ‘무엇을 했다(업무 수행)’ 중심으로 읽히고, ‘무엇이 좋아졌다(임팩트)’ 신호가 약합니다.",
      "서류에서는 성과동사(개선/증가/최적화/향상/절감/단축 등)가 ‘결과가 있었다’는 빠른 힌트로 작동합니다.",
    ];

    if (hits.length) {
      why.push(`감지된 성과동사(일부): ${hits.slice(0, 12).join(", ")}`);
    } else {
      why.push("성과동사(개선/증가/최적화/향상/절감/단축 등)가 거의 감지되지 않습니다.");
    }

    const fix = [
      "각 bullet을 ‘행동(내가 한 일) + 성과동사(좋아진 방향) + 지표(숫자)’ 구조로 재작성하세요.",
      "숫자가 없다면 ‘Before→After’라도 만드세요. (예: 3일→1일, 오류 5%→2%, 월 10건→30건)",
      "성과동사는 억지로 넣지 말고, 실제로 바뀐 지표/품질/속도/비용/전환을 먼저 정한 뒤 그에 맞는 동사를 선택하세요.",
    ];
    // [PATCH] richer actions/templates (UI prefers actions/action)
    const actions = [
      "각 bullet을 ‘문제/목표 → 내 행동(주도/설계/결정) → 결과(변화)’로 재작성하세요. (결과는 정량/정성/근거 중 1개라도)",
      "동사를 ‘지원/수행/관리’에서 ‘개선/단축/절감/증가/자동화/표준화/안정화/최적화’처럼 ‘변화’를 담는 동사로 바꾸세요.",
      "템플릿을 그대로 쓰세요: ‘[내 역할] X를 Y해서 Z를 (n%/n일/n건) 개선’ / ‘A를 자동화해 B를 감소’",
      "정량이 없으면 정성+근거로 대체: 승인/채택, 운영 반영, 재사용, 장애 감소, QA/버그 감소, 리스크 제거, 고객 이슈 감소.",
      "팀/조직 성과라면 내 기여를 분리: ‘내가 오너로 만든 산출물/결정 포인트/담당 범위’를 명시하세요.",
    ];

    // [PATCH] realistic counters/exceptions
    const counterExamples = [
      "운영/유지보수처럼 ‘변화’보다 ‘안정성’이 중요한 업무는 동사가 약해 보일 수 있습니다. 대신 장애/재발/MTTR/가용성 같은 운영 지표나 예방 성과로 표현하면 완화됩니다.",
      "보안/정책상 수치 공개가 어렵다면, 수치 대신 검증 방식(로그/테스트/리뷰/감사)과 변화 방향(증가/감소)을 제시하면 충분합니다.",
      "리드가 아니었던 경우에도 ‘내가 바꾼 부분(예: 자동화/가이드/테스트)’을 산출물로 남기면 임팩트 신호로 읽힙니다.",
    ];
    const notes = [];
    notes.push(`impactVerbCount: ${cnt} (min ${min})`);
    if (hits.length) notes.push(`impactVerbHits(sample): ${hits.slice(0, 12).join(", ")}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["impactVerbCount", "impactVerbHits"];

    const title = flag?.title
      ? `임팩트 동사 리스크: ${safeStr(flag.title)}`
      : "성과/임팩트 동사 부족 리스크";

    return {
      title,
      why,

      // [PATCH] preferred keys for UI/report
      actions,
      counterExamples,

      // [PATCH] backward-compat aliases (append-only)
      fix,
      action: actions,
      counter: counterExamples,
      counterexample: counterExamples,
      counterExample: counterExamples,
      counterexamples: counterExamples,

      evidenceKeys,
      notes,
    };
  },

  suppressIf: [],
};
