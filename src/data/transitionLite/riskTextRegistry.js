function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

export const TRANSITION_LITE_RISK_TEXT_REGISTRY = {
  RISK_INDUSTRY_CONTEXT_SHIFT: {
    label: "새 업계에서 통할 경험인지 확인",
    shortTitle: "업계 전환 적응 확인",
    title: "새 업계에서 통할 경험인지 확인",
    bodyDefault:
      "기존 경험이 아예 무의미해지는 것은 아니지만, 업계가 바뀌면 같은 일도 고객, 시장, 운영 방식이 달라 다른 맥락에서 이해될 수 있습니다.",
    bodyWeak:
      "완전히 낯선 업계로 가는 건 아니더라도, 새 업계 기준에서 내 경험을 다시 연결해 설명할 필요가 생길 수 있습니다.",
    bodyVariants: {
      adjacentIndustry:
        "완전히 다른 업계는 아니지만, 새 업계가 다루는 고객과 운영 방식에서 차이가 있을 수 있습니다. 기존 경험이 그 차이를 넘어 연결된다는 것을 구체적으로 보여줄 수 있는지가 중요해집니다.",
      crossIndustry:
        "업계가 바뀌면 같은 역할도 고객 구조, 의사결정 방식, 운영 문법이 달라집니다. 기존 경험이 새 맥락에서 유효하다는 것을 구체적으로 연결해 보여줄 수 있어야 합니다.",
      crossIndustryB2B:
        "B2B 업계는 고객사 의사결정 구조와 이해관계자 설득 방식이 핵심입니다. 새 업계의 구매 논리와 영업·운영 방식에 기존 경험을 연결해 설명할 수 있는지 확인하게 됩니다.",
      crossIndustryB2C:
        "소비자 접점 업계는 실행 속도와 채널별 메시지 정합성이 중요합니다. 새 업계 고객의 반응 패턴과 실행 리듬에 맞춰 기존 경험을 재연결할 수 있는지가 평가 포인트가 됩니다.",
    },
  },
  RISK_JOB_EXPECTATION_SHIFT: {
    label: "지원 직무 기준에 맞는 경험인지 확인",
    shortTitle: "직무 기준 적합성 확인",
    title: "지원 직무 기준에 맞는 경험인지 확인",
    bodyDefault:
      "비슷해 보이는 경력이라도 지원 직무가 기대하는 역할과 결과물이 다르면, 기존 경험을 그 기준에 맞게 설명할 수 있는지가 중요해질 수 있습니다.",
    bodyWeak:
      "겹치는 경험은 있지만, 지원 직무가 중요하게 보는 역할 기준에 맞춰 경험을 다시 정리해 보여줄 필요가 생길 수 있습니다.",
  },
  RISK_EXECUTION_LINK_CHECK: {
    label: "실행 단계까지 해본 경험인지 확인",
    shortTitle: "실행 경험 연결 확인",
    title: "실행 단계까지 해본 경험인지 확인",
    bodyDefault:
      "기획이나 방향 설정 경험이 있어도, 지원 역할이 실행에 더 가까우면 실제 운영과 조율까지 이어진 경험을 함께 보게 될 수 있습니다.",
    bodyWeak:
      "기존 경험이 연결될 수는 있지만, 실행 단계에서 어떤 식으로 움직였는지를 조금 더 분명히 설명할 필요가 생길 수 있습니다.",
  },
  RISK_STRATEGIC_VIEW_CHECK: {
    label: "운영 경험을 더 큰 그림으로 설명할 수 있는지 확인",
    shortTitle: "큰 그림 설명 가능성 확인",
    title: "운영 경험을 더 큰 그림으로 설명할 수 있는지 확인",
    bodyDefault:
      "운영 경험 자체는 분명한 강점이지만, 지원 역할이 더 넓은 판단과 우선순위 설정을 요구하면 그 경험을 큰 그림 관점에서 설명할 수 있는지도 함께 보게 될 수 있습니다.",
    bodyWeak:
      "실무 경험은 충분히 연결될 수 있지만, 더 상위 관점의 판단 경험은 추가로 확인하려는 흐름이 생길 수 있습니다.",
    bodyVariants: {
      adjacentJob:
        "직무는 겹치는 영역이 있지만, 지원 역할이 기대하는 판단의 층위가 다를 수 있습니다. 운영 경험을 더 넓은 맥락의 결정 언어로 재구성해 설명할 수 있는지가 중요합니다.",
      crossJob:
        "직무 전환 폭이 있는 만큼, 운영 경험을 그대로 꺼내기보다 새 역할이 요구하는 판단 구조 위에서 재배치해 보여줘야 합니다.",
      executionToStrategy:
        "실행 경험은 강점이지만, 전략 기획 역할은 그 경험을 우선순위 판단과 방향 설정 언어로 재번역하는 역량을 봅니다. 운영 경험의 깊이를 큰 그림 언어로 전환해 설명할 수 있어야 합니다.",
    },
  },
  RISK_RESPONSIBILITY_EXPANSION: {
    label: "업무보다 책임 범위가 더 커지는 변화",
    shortTitle: "책임 범위 변화 확인",
    title: "업무보다 책임 범위가 더 커지는 변화",
    bodyDefault:
      "하는 일이 아주 다르지 않더라도, 책임지는 범위가 넓어지면 업무 경험보다 판단 폭과 조율 수준을 어떻게 보여주는지가 중요해질 수 있습니다.",
    bodyWeak:
      "큰 단절은 아니더라도, 이전보다 조금 더 넓은 책임 범위를 맡는 변화로 읽힐 수 있습니다.",
  },
  RISK_SCOPE_REINTERPRETATION: {
    label: "유사해 보이는 직무의 실제 차이",
    shortTitle: "비슷한 직무의 차이 확인",
    title: "유사해 보이는 직무의 실제 차이",
    bodyDefault:
      "겉으로 보기엔 비슷한 직무 이동이어도, 실제로는 기대하는 역할 범위와 관여 깊이가 달라 같은 경험이 다르게 읽힐 수 있습니다.",
    bodyWeak:
      "완전히 다른 직무는 아니더라도, 실제 역할 범위는 생각보다 다르게 해석될 수 있습니다.",
  },
};

export function getTransitionLiteRiskText(riskKey, variant = "default", bodyVariantKey = null) {
  const entry = TRANSITION_LITE_RISK_TEXT_REGISTRY[toStr(riskKey)];
  if (!entry) return null;

  const bodyDefault = toStr(entry.bodyDefault);
  const bodyWeak = toStr(entry.bodyWeak);
  const baseBody = variant === "weak"
    ? (bodyWeak || bodyDefault)
    : (bodyDefault || bodyWeak);

  const variantBody = bodyVariantKey
    ? toStr(entry.bodyVariants?.[bodyVariantKey]) || null
    : null;

  return {
    ...entry,
    body: variantBody || baseBody,
  };
}
