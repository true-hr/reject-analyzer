// src/lib/decision/riskProfiles/gates/educationGateRisk.js
// EDUCATION_GATE_FAIL gate

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeStr(v) {
  try { return (v ?? "").toString(); }
  catch { return ""; }
}

function _getStructural(ctx) {

  const structural =
    isObj(ctx?.structural)
      ? ctx.structural
      : null;

  return {

    flags:
      structural?.flags ||
      ctx?.flags ||
      [],

    metrics:
      structural?.metrics ||
      ctx?.metrics ||
      {},

  };
}

function _findFlag(flags, id) {

  if (!Array.isArray(flags))
    return null;

  for (const f of flags) {

    if (!f) continue;

    if (safeStr(f.id) === id)
      return f;
  }

  return null;
}


export const educationGateRisk = {

  id: "GATE__EDUCATION_GATE_FAIL",

  group: "gates",

  layer: "gate",

  priority: 98,

  severityBase: 5,

  tags: ["gate", "education"],


  when: (ctx) => {

    const { flags, metrics } =
      _getStructural(ctx);

    const flag =
      _findFlag(flags, "EDUCATION_GATE_FAIL");

    if (flag)
      return true;

    return !!metrics.educationGateFail;
  },


  score: () => 0.95,


  explain: () => ({

    title: "학력 Gate 조건 미충족",

    why: [

      "해당 포지션은 학력 Gate가 적용되는 직무일 가능성이 높습니다.",

      "이 경우 서류 검토 이전 단계에서 필터링될 수 있습니다.",

    ],

    fix: [

      "학력 조건이 없는 기업 또는 직무로 전략 수정",

      "경력 기반 직무로 지원 방향 전환",

      "포트폴리오 중심 채용 회사로 타겟 변경",

    ],

    evidenceKeys: [],

    notes: [],

  }),

  suppressIf: [],

};
