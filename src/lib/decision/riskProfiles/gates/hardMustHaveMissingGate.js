// src/lib/decision/riskProfiles/gates/hardMustHaveMissingGate.js

export const hardMustHaveMissingGate = {
  id: "GATE__HARD_MUST_HAVE_MISSING",
  group: "gates",
  layer: "gate",
  priority: 99,
  severityBase: 5,
  tags: ["gate", "mustHave"],

  when: () => false,
  score: () => 0.95,

  explain: () => ({
    title: "필수 요건 미충족",
    why: [
      "JD에 명시된 필수 요건(Must-have) 중 일부가 이력서/경험에서 확인되지 않습니다."
    ],
    fix: [
      "필수 요건에 해당하는 구체적 사례/성과를 이력서에 명확히 기재",
      "필수 요건이 더 적합한 포지션으로 전략 조정"
    ],
    evidenceKeys: [],
    notes: [],
  }),

  suppressIf: [],
};
