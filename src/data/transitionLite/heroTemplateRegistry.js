export const TRANSITION_LITE_HERO_TEMPLATE_REGISTRY = {
  HERO_JOB_SAME_INDUSTRY_SAME: {
    title: "직무와 업계 모두 비교적 가까운 전환",
    summary: "직무 축은 비교적 가깝습니다. 업계 축은 비교적 유사합니다.",
  },
  HERO_JOB_SAME_INDUSTRY_ADJACENT: {
    title: "직무는 가깝고 업계는 일부 인접한 전환",
    summary: "직무 축은 비교적 가깝습니다. 업계 축에는 일부 인접성이 있습니다.",
  },
  HERO_JOB_SAME_INDUSTRY_CROSS: {
    title: "직무는 가깝고 업계는 맥락 적응이 필요한 전환",
    summary: "직무 축은 비교적 가깝습니다. 업계 축은 새 맥락 적응이 필요한 이동입니다.",
  },
  HERO_JOB_ADJACENT_INDUSTRY_SAME: {
    title: "직무는 인접하고 업계는 유사한 전환",
    summary: "직무 축은 인접 전환으로 읽힙니다. 업계 축은 비교적 유사합니다.",
  },
  HERO_JOB_ADJACENT_INDUSTRY_ADJACENT: {
    title: "직무와 업계 모두 일부 인접성이 있는 전환",
    summary: "직무 축은 인접 전환으로 읽힙니다. 업계 축에는 일부 인접성이 있습니다.",
  },
  HERO_JOB_ADJACENT_INDUSTRY_CROSS: {
    title: "직무는 인접하고 업계는 맥락 적응이 필요한 전환",
    summary: "직무 축은 인접 전환으로 읽힙니다. 업계 축은 새 맥락 적응이 필요한 이동입니다.",
  },
  HERO_JOB_CROSS_INDUSTRY_SAME: {
    title: "직무 차이는 크고 업계는 유사한 전환",
    summary: "직무 축은 성격 차이가 있는 전환으로 읽힙니다. 업계 축은 비교적 유사합니다.",
  },
  HERO_JOB_CROSS_INDUSTRY_ADJACENT: {
    title: "직무 차이는 크고 업계는 일부 인접한 전환",
    summary: "직무 축은 성격 차이가 있는 전환으로 읽힙니다. 업계 축에는 일부 인접성이 있습니다.",
  },
  HERO_JOB_CROSS_INDUSTRY_CROSS: {
    title: "직무와 업계 모두 적응이 필요한 전환",
    summary: "직무 축은 성격 차이가 있는 전환으로 읽힙니다. 업계 축은 새 맥락 적응이 필요한 이동입니다.",
  },
};

export function getTransitionLiteHeroTemplate(templateKey) {
  return TRANSITION_LITE_HERO_TEMPLATE_REGISTRY[templateKey] || null;
}
