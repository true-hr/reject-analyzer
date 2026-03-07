// src/lib/explain/explainRewrite.js
// Explain Rewrite Layer — 채용담당자 스타일 문장 override (append-only)
// 엔진 로직/scoring 영향 없음. render 직전 explain 텍스트만 교체.

export const EXPLAIN_REWRITE = {

  RISK__ROLE_LEVEL_MISMATCH: {
    why: [
      "지원 직무에서 기대하는 역할 수준과 이력서에 나타난 역할 범위가 완전히 일치하지 않을 수 있습니다. 채용 담당자는 지원자가 해당 레벨에서 바로 성과를 낼 수 있는지 먼저 확인합니다."
    ],
    action: [
      "이력서에서 프로젝트 리딩, 의사결정 참여, KPI 책임 경험 등을 더 명확하게 드러내는 것이 좋습니다."
    ],
    counter: [
      "면접에서는 어떤 상황에서 팀이나 프로젝트를 주도했는지 구체적인 사례로 설명하면 이 우려를 줄일 수 있습니다."
    ]
  },

  domainShiftRisk: {
    why: [
      "지원 직무와 이전 경험의 산업 또는 업무 영역이 다르면 채용 담당자는 초기 적응 비용을 고려해 보수적으로 판단할 수 있습니다."
    ],
    action: [
      "이력서에서 데이터 분석, 프로젝트 관리, 협업 경험 등 직무 공통 역량이 어떻게 활용될 수 있는지 연결해서 설명하는 것이 좋습니다."
    ],
    counter: [
      "면접에서는 기존 경험이 이 직무에서 어떻게 바로 활용될 수 있는지 사례 중심으로 설명하는 것이 중요합니다."
    ]
  },

  ROLE_SKILL__MUST_HAVE_MISSING: {
    why: [
      "채용 공고에서 명시된 필수 경험이나 기술이 이력서에서 명확하게 확인되지 않을 수 있습니다."
    ],
    action: [
      "이력서에서 해당 역량과 관련된 프로젝트나 업무 사례를 더 구체적으로 작성하는 것이 좋습니다."
    ],
    counter: [
      "면접에서는 해당 역량을 실제로 어떻게 활용했는지 구체적인 경험을 설명할 준비가 필요합니다."
    ]
  }

};

export function rewriteExplain(id, explain) {
  const r = EXPLAIN_REWRITE[id];
  if (!r) return explain;

  return {
    ...explain,
    why: r.why || explain.why,
    action: r.action || explain.action,
    counter: r.counter || explain.counter
  };
}
