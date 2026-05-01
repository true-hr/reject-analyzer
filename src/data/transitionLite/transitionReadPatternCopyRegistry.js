function normalizePatternEntry(entry = {}) {
  return {
    key: typeof entry.key === "string" ? entry.key.trim() : "",
    group: entry.group === "support" ? "support" : "main",
    label: typeof entry.label === "string" ? entry.label.trim() : "",
    bodyLines: Array.isArray(entry.bodyLines)
      ? entry.bodyLines
          .map((line) => (typeof line === "string" ? line.trim() : String(line || "").trim()))
          .filter(Boolean)
      : [],
  };
}

export const TRANSITION_READ_PATTERN_COPY_REGISTRY = Object.freeze({
  mainPatterns: Object.freeze([
    normalizePatternEntry({
      key: "SAME_ROLE_EXACT",
      group: "main",
      label: "동일 직무 일치",
      bodyLines: [
        "<현재 직무>에서 <지원 직무>로 가는 건, 직무 기준으로 보면 큰 전환으로 보이지 않는 편입니다.",
        "해오던 일의 결이 크게 다르지 않고, 회사가 보는 기본 역량도 어느 정도 겹치기 때문입니다.",
        "그래서 면접관도 완전히 새로운 직무에 도전한다기보다는, 지금까지 이 일을 얼마나 깊게 해봤는지, 어느 수준까지 맡아봤는지부터 볼 가능성이 큽니다.",
        "다만 같은 직무명이라도 회사마다 기대하는 수준은 꽤 다를 수 있습니다.",
        "맡았던 범위, 만든 결과물의 수준, 산업 특성, 조직 규모 같은 차이는 따로 확인하려 할 수 있습니다.",
      ],
    }),
    normalizePatternEntry({
      key: "SAME_FAMILY_NEAR",
      group: "main",
      label: "동일 직군 근접 이동",
      bodyLines: [
        "<현재 직무>에서 <지원 직무>로 옮기는 건, 이름이 완전히 같지는 않아도 비교적 가까운 이동으로 읽힐 가능성이 큽니다.",
        "두 역할 모두 <공통 업무 성격>을 다루고, 실무에서 쓰는 기본 역량도 <공통 역량1>, <공통 역량2>처럼 겹치는 부분이 있기 때문입니다.",
        "그래서 <현재 직무>에서 해온 경험을 잘 설명하면, 면접관도 완전 새로운 직무라기보다 비슷한 축 안에서 옮겨가는 경우로 받아들일 수 있습니다.",
        "다만 가까워 보인다고 해서 자동으로 인정되는 건 아닙니다.",
        "면접관은 결국 <지원 직무>에서 실제로 어떤 결과를 내야 하는지, 그 방식까지 이해하고 있는지를 같이 보려 할 가능성이 큽니다.",
      ],
    }),
    normalizePatternEntry({
      key: "SAME_FAMILY_DIFFERENT_FOCUS",
      group: "main",
      label: "동일 직군 초점 차이",
      bodyLines: [
        "<현재 직무>와 <지원 직무>는 같은 직군 안에 있어서 처음엔 비슷해 보일 수 있습니다.",
        "하지만 실제로 들어가 보면, 더 중요하게 보는 일도 다르고 결과물도 다르게 읽히는 경우가 많습니다.",
        "그래서 면접관은 단순히 비슷한 키워드가 있는지만 보지 않고, 지금까지의 경험이 지원 직무의 핵심 포인트로 정말 이어지는지를 더 보려 할 가능성이 큽니다.",
        "즉 겉으로는 가까워 보여도, 안에서는 역할의 중심이 꽤 달라질 수 있는 이동입니다.",
        "그래서 비슷한 일 했습니다보다, 무엇이 같고 무엇이 다른지 알고 있다는 식으로 설명하는 게 더 자연스럽습니다.",
      ],
    }),
    normalizePatternEntry({
      key: "ADJACENT_FAMILY",
      group: "main",
      label: "인접 직군 이동",
      bodyLines: [
        "<현재 직무>에서 <지원 직무>로 가는 건, 완전히 생뚱맞은 이동은 아닙니다.",
        "이어지는 역량도 있고, 실무 감각이나 협업 방식이 도움이 될 수도 있습니다.",
        "다만 그렇다고 해서 기존 경험이 그대로 인정되는 건 아닐 가능성이 큽니다.",
        "직무의 최종 목적이나 평가 기준이 다르면, 같은 경험도 새롭게 해석될 수 있기 때문입니다.",
        "그래서 면접관은 무슨 일을 했는가 자체보다, 그 경험을 지원 직무 관점에서 얼마나 설득력 있게 설명하느냐를 더 보려 할 수 있습니다.",
      ],
    }),
    normalizePatternEntry({
      key: "CROSS_FAMILY",
      group: "main",
      label: "교차 직군 이동",
      bodyLines: [
        "<현재 직무>에서 <지원 직무>로의 이동은, 일반적으로는 꽤 큰 전환으로 읽힐 가능성이 큽니다.",
        "두 직무가 푸는 문제도 다르고, 만들어내는 결과물도 다르고, 평가받는 기준도 다를 수 있기 때문입니다.",
        "그래서 면접관은 관심이 있다는 말보다, 왜 이쪽으로 옮기려는지, 그리고 기존 경험 중 무엇이 실제로 이어질 수 있는지를 더 구체적으로 보려 할 가능성이 큽니다.",
        "이럴 때는 억지로 비슷하다고 포장하기보다, 이어지는 역량은 무엇이고 새롭게 채워야 할 부분은 무엇인지 솔직하게 설명하는 쪽이 더 자연스럽습니다.",
      ],
    }),
    normalizePatternEntry({
      key: "OPERATION_TO_PLAN",
      group: "main",
      label: "운영에서 기획",
      bodyLines: [
        "<현재 직무>에서 <지원 직무>로 옮길 때, 현장을 실제로 굴려본 경험은 분명 강점이 될 수 있습니다.",
        "운영을 해본 사람은 어떤 문제가 반복되는지, 어디서 병목이 생기는지 현실적으로 알고 있는 경우가 많기 때문입니다.",
        "다만 <지원 직무>에서는 단순히 실행을 잘한 것보다, 기준을 세우고 구조를 짜고 우선순위를 판단한 경험이 더 중요하게 보일 수 있습니다.",
        "그래서 면접관은 실무를 잘 돌린 사람인지, 아니면 실무를 보고 구조까지 만든 사람인지를 나눠서 보려 할 가능성이 큽니다.",
        "결국 이 전환에서는 운영 경험 자체보다, 그 경험을 얼마나 기획 관점까지 끌고 갔는지가 핵심입니다.",
      ],
    }),
    normalizePatternEntry({
      key: "PLAN_TO_OPERATION",
      group: "main",
      label: "기획에서 운영",
      bodyLines: [
        "<현재 직무>에서 <지원 직무>로 옮길 때, 전체 구조를 보고 방향을 잡아본 경험은 분명 장점이 될 수 있습니다.",
        "다만 운영 역할에서는 좋은 방향을 잡는 것만으로는 부족하고, 실제 현장에서 끝까지 굴리고 조율하고 책임지는 힘이 더 중요하게 읽힐 수 있습니다.",
        "그래서 면접관은 아이디어나 설계 경험보다, 직접 실행하면서 변수와 문제를 어떻게 다뤘는지를 더 먼저 보려 할 가능성이 큽니다.",
        "즉 이 전환은 생각해본 사람에서 끝나면 약하고, 실제로 움직여본 사람으로 연결돼야 설득력이 생깁니다.",
      ],
    }),
    normalizePatternEntry({
      key: "SELECTION_TO_DEVELOPMENT",
      group: "main",
      label: "채용에서 육성",
      bodyLines: [
        "<현재 직무>에서 <지원 직무>로 가는 건, 같은 HR 안에서의 이동이라 아주 낯선 전환은 아닙니다.",
        "다만 두 역할은 비슷해 보여도, 실제로 하는 일의 방향은 꽤 다를 수 있습니다.",
        "<현재 직무>가 맞는 사람을 선발하고 판단하는 쪽에 가깝다면, <지원 직무>는 사람이 성장하고 자리 잡고 성과를 내도록 돕는 구조를 만드는 쪽에 더 가깝습니다.",
        "그래서 면접관은 사람을 많이 봤다는 경험이 곧바로 육성 경험으로 이어진다고 보지 않을 가능성이 큽니다.",
        "결국 중요한 건 채용 경험이 있다는 사실 자체보다, 그 경험을 육성 관점으로 어떻게 연결해서 설명하느냐입니다.",
      ],
    }),
  ]),
  supportPatterns: Object.freeze([
    normalizePatternEntry({
      key: "DEVELOPMENT_TO_SELECTION",
      group: "support",
      label: "육성에서 채용",
      bodyLines: [
        "<현재 직무>에서 쌓은 경험이 사람을 성장시키고 돕는 쪽에 가까웠다면, <지원 직무>에서는 그와는 조금 다른 판단 기준이 요구될 수 있습니다.",
        "특히 채용은 사람을 오래 육성하는 시선보다, 짧은 시간 안에 적합도를 보고 판단하는 감각이 더 중요하게 읽힐 수 있습니다.",
        "그래서 면접관은 육성 경험이 있다는 점은 인정하더라도, 실제로 선발 기준을 잡고 후보를 가려내는 감각까지 갖추고 있는지는 따로 확인하려 할 가능성이 큽니다.",
      ],
    }),
    normalizePatternEntry({
      key: "OUTPUT_SIMILAR",
      group: "support",
      label: "산출물 유사",
      bodyLines: [
        "<현재 직무>와 <지원 직무>는 최종적으로 만들어내는 결과물의 성격이 어느 정도 닮아 있을 수 있습니다.",
        "그래서 기존 경험이 완전히 새롭게 보이기보다는, 표현 방식에 따라 비교적 자연스럽게 이어질 가능성도 있습니다.",
        "이런 경우에는 억지로 새로운 이야기로 만들기보다, 지금까지 해온 결과물을 지원 직무 언어로 잘 바꿔 설명하는 것이 더 중요할 수 있습니다.",
      ],
    }),
    normalizePatternEntry({
      key: "OUTPUT_DIFFERENT",
      group: "support",
      label: "산출물 차이",
      bodyLines: [
        "다만 <현재 직무>와 <지원 직무>는 최종적으로 기대되는 결과물이 꽤 다를 수 있습니다.",
        "그래서 얼핏 비슷해 보이는 경험이 있어도, 면접관은 정말 우리가 원하는 결과물을 만들어본 적이 있나?를 따로 볼 가능성이 큽니다.",
        "이 경우에는 과정이 비슷하다는 말보다, 지원 직무에서 원하는 결과를 얼마나 이해하고 있는지를 보여주는 게 더 중요합니다.",
      ],
    }),
    normalizePatternEntry({
      key: "STAKEHOLDER_SIMILAR",
      group: "support",
      label: "이해관계자 유사",
      bodyLines: [
        "두 직무가 주로 상대하는 사람이나 협업하는 대상이 크게 다르지 않다면, 커뮤니케이션 방식이나 조율 감각은 비교적 자연스럽게 이어질 수 있습니다.",
        "이런 점은 전환 장벽을 조금 낮춰주는 요소로 읽힐 수 있습니다.",
        "그래서 이 경우에는 새 직무가 완전히 낯선 환경처럼 보이기보다는, 기존 관계 조율 경험이 어느 정도 통할 수 있는 이동으로 설명할 수 있습니다.",
      ],
    }),
    normalizePatternEntry({
      key: "STAKEHOLDER_DIFFERENT",
      group: "support",
      label: "이해관계자 차이",
      bodyLines: [
        "반대로 <지원 직무>에서는 주로 상대해야 하는 사람과 조율 방식이 <현재 직무>와 꽤 다를 수 있습니다.",
        "그래서 면접관은 직무 내용만이 아니라, 새로운 이해관계자 구조 안에서 얼마나 빨리 적응할 수 있을지도 같이 보려 할 가능성이 큽니다.",
        "이럴 때는 업무 유사성만 강조하기보다, 새로운 사람들과 일하는 방식까지 준비돼 있다는 점을 보여주는 게 더 중요합니다.",
      ],
    }),
    normalizePatternEntry({
      key: "METRIC_SIMILAR",
      group: "support",
      label: "성과 지표 유사",
      bodyLines: [
        "<현재 직무>와 <지원 직무>가 중요하게 보는 성과 기준이 어느 정도 비슷하다면, 기존 성과를 비교적 자연스럽게 이어서 설명할 수 있습니다.",
        "이런 경우에는 완전히 새로운 논리를 만들기보다, 같은 성과를 어떤 포인트로 보여줄지만 조정하는 것이 더 효과적일 수 있습니다.",
        "즉 해온 일을 부정하기보다, 강조점을 조금 바꾸는 방식이 더 잘 먹힐 수 있습니다.",
      ],
    }),
    normalizePatternEntry({
      key: "METRIC_DIFFERENT",
      group: "support",
      label: "성과 지표 차이",
      bodyLines: [
        "다만 <현재 직무>에서 좋게 평가받았던 성과가 <지원 직무>에서는 그대로 강점으로 읽히지 않을 수도 있습니다.",
        "그래서 면접관은 같은 성과를 보더라도, 이게 우리 직무 기준에서도 의미 있는 결과인가?를 따로 보려 할 가능성이 큽니다.",
        "이런 경우에는 성과 자체를 나열하기보다, 그 성과가 새 직무 기준에서 어떤 가치로 연결되는지까지 설명하는 게 중요합니다.",
      ],
    }),
    normalizePatternEntry({
      key: "HORIZON_DIFFERENT",
      group: "support",
      label: "성과 시계 차이",
      bodyLines: [
        "<현재 직무>와 <지원 직무>는 결과가 보이는 속도 자체가 다를 수 있습니다.",
        "지금 하는 일이 비교적 짧은 주기로 성과가 보이는 역할이었다면, 지원 직무는 더 긴 호흡으로 구조를 만들고 효과를 보는 역할일 수도 있습니다.",
        "이런 차이는 일하는 방식이나 우선순위 판단에도 영향을 줄 수 있습니다.",
        "그래서 면접관도 빨리 결과 보는 일에 익숙한 사람인지, 아니면 시간이 걸리는 과정을 버티고 설계할 수 있는 사람인지를 함께 보려 할 수 있습니다.",
      ],
    }),
  ]),
});

export function getTransitionReadPatternCopyRegistry() {
  return TRANSITION_READ_PATTERN_COPY_REGISTRY;
}

export function getTransitionReadPatternCopy(patternKey) {
  const key = typeof patternKey === "string" ? patternKey.trim() : "";
  if (!key) return null;

  const patterns = [
    ...TRANSITION_READ_PATTERN_COPY_REGISTRY.mainPatterns,
    ...TRANSITION_READ_PATTERN_COPY_REGISTRY.supportPatterns,
  ];

  return patterns.find((pattern) => pattern.key === key) || null;
}
