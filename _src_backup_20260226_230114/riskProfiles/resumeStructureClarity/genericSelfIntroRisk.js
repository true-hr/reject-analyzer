// src/lib/decision/riskProfiles/resumeStructureClarity/genericSelfIntroRisk.js
function isObj(v){ return !!v && typeof v==="object" && !Array.isArray(v); }

export const genericSelfIntroRisk = {
  id: "RESUME_STRUCTURE__GENERIC_SELF_INTRO_RISK",
  group: "resumeStructureClarity",
  layer: "document",
  priority: 30,
  severityBase: 2,
  tags: ["structure"],

  when: (ctx) => {
    const structural = isObj(ctx?.structural) ? ctx.structural : null;
    const flags = structural?.flags || ctx?.flags || [];
    const metrics = structural?.metrics || ctx?.metrics || {};
    void flags; void metrics;
    return false; // stub disabled
  },

  score: () => 0.5,

  explain: () => ({
    title: "구조/표현 신호(스텁): genericSelfIntroRisk",
    why: ["현재는 누락 모듈 복구용 스텁입니다."],
    action: ["필요 시 flags/metrics 기반으로 로직을 채우세요."],
    counter: ["현재는 비활성(false)이라 평가에 영향 거의 없습니다."],
  }),
};
