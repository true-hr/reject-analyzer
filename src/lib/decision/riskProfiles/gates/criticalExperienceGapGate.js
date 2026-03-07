// src/lib/decision/riskProfiles/gates/criticalExperienceGapGate.js
// CRITICAL_EXPERIENCE_GAP gate
// - JD 필수/핵심경험이 "명확히" 비어있다고 판단될 때(서류에서 바로 컷되는 케이스)

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeStr(v) {
  try { return (v ?? "").toString(); }
  catch { return ""; }
}

function _getStructural(ctx) {
  const structural = isObj(ctx?.structural) ? ctx.structural : null;

  return {
    flags: structural?.flags || ctx?.flags || [],
    metrics: structural?.metrics || ctx?.metrics || {},
  };
}

function _findFlag(flags, id) {
  if (!Array.isArray(flags)) return null;

  for (const f of flags) {
    if (!f) continue;
    if (safeStr(f.id) === id) return f;
  }
  return null;
}

function _hasAnyFlag(flags, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return false;
  for (const id of ids) {
    if (_findFlag(flags, id)) return true;
  }
  return false;
}

export const criticalExperienceGapGate = {
  id: "GATE__CRITICAL_EXPERIENCE_GAP",
  group: "gates",
  layer: "gate",

  // gate 중 최상위급
  priority: 99,
  severityBase: 5,

  tags: ["gate", "experience", "critical"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // structural analyzer / keyword layer에서 여러 이름으로 올라올 수 있어서 넓게 흡수
    const hit =
      _hasAnyFlag(flags, [
        "CRITICAL_EXPERIENCE_GAP",
        "CRITICAL_EXPERIENCE_GAP_FAIL",
        "CRITICAL_EXPERIENCE_GAP_GATE",
        "CRITICAL_GAP",
        "MUST_HAVE_EXPERIENCE_MISSING",
      ]);

    if (hit) return true;

    // metrics 기반 fallback
    if (metrics?.criticalExperienceGap === true) return true;
    if (metrics?.criticalExperienceGapFail === true) return true;
    if (metrics?.mustHaveExperienceMissing === true) return true;

    return false;
  },

  score: () => 0.97,

  // [PATCH] Explanation Bridge v1 — ctx에서 evidenceFit 접근 (append-only, fallback 유지)
  explain: (ctx) => {
    const ef = (ctx && ctx.evidenceFit && typeof ctx.evidenceFit === "object") ? ctx.evidenceFit : null;
    const efAvailable = ef && ef.status !== "unavailable";

    // why: evidenceFit이 있으면 수치 기반으로 보강, 없으면 기존 텍스트 유지
    const why = efAvailable
      ? (() => {
          const lines = [
            "서류 단계는 '강점 평균'이 아니라 '핵심요건 충족 여부'로 먼저 걸러집니다.",
          ];
          const score = Number.isFinite(ef.overallScore) ? ef.overallScore : null;
          const level = typeof ef.level === "string" ? ef.level : null;
          if (score !== null && level) {
            lines.push(`JD 핵심요건 대비 이력서 근거 적합도: ${level} (종합 ${score}/100). 핵심 항목 증거 부족으로 서류 컷 가능성이 높습니다.`);
          } else {
            lines.push("필수 경험이 명확히 비어있다고 보이면, 면접까지 갈 확률이 급격히 떨어집니다.");
          }
          // 누락 항목 목록/coverage detail은 ROLE_SKILL__MUST_HAVE_MISSING이 전담
          return lines;
        })()
      : [
          "서류 단계는 '강점 평균'이 아니라 '핵심요건 충족 여부'로 먼저 걸러집니다.",
          "필수 경험이 명확히 비어있다고 보이면, 면접까지 갈 확률이 급격히 떨어집니다.",
        ];

    return {
      title: "핵심 경험이 부족하면 서류에서 즉시 컷될 가능성",
      why,
      action: [
        "이력서 상단에 '필수 경험'을 한 줄로 먼저 명시(프로젝트/기간/역할).",
        "JD 핵심 요구사항을 '경험 단위'로 매칭(무엇을/어떻게/얼마나/결과).",
        "만약 직접 경험이 없다면: 유사 경험(대체 경험)을 근거와 함께 명확히 제시.",
      ],
      counter: [
        "포지션이 주니어/포텐셜 채용이거나, 회사가 교육/전환을 명시한 경우 예외가 생깁니다.",
        "프로젝트/성과로 대체가능한 수준의 유사 경험이 충분하면 완화될 수 있습니다.",
      ],
    };
  },
};
