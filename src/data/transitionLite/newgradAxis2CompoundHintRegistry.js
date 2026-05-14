// newgradAxis2CompoundHintRegistry.js
// MVP Axis2 compound job × industry lift hints for newgrad transition-lite.
//
// Key format: `${subVertical}__${industryTagResolvedKey}`
//   - subVertical: from getJobOntologyItemById(targetJobId).subVertical
//   - industryTagResolvedKey: one of the 10 IND_* sector keys from resolveIndustryExperienceTagProfile
//
// This registry is NOT the same as newgradAxis2JobIndustrySpecializationRegistry.js.
// That file provides 9 deep-read text fields for Axis2 card 3 (archetypeKey × subVertical).
// This file provides a single `axis2LiftHint` string for Axis2 `liftOrLimit` copy-layer.
//
// Injection guard (in axisExplanationRegistry.js):
//   - Both subVertical and industryTagResolvedKey must resolve.
//   - alignedEvidenceCount >= 1.
//   - Replaces only the sector-level industryTagProfileBasis, not real gap/limit text
//     or industryGuide.lift overrides.
//
// Framing rule: write as "목표 맥락" (context to understand), not "당신의 경험" (evidence claim).

export const NEWGRAD_AXIS2_COMPOUND_HINT_REGISTRY = Object.freeze({

  SERVICE_PLANNING__IND_B2B_SAAS_IT_PLATFORM: Object.freeze({
    subVertical: "SERVICE_PLANNING",
    industryKey: "IND_B2B_SAAS_IT_PLATFORM",
    axis2LiftHint:
      "B2B SaaS 서비스기획에서는 온보딩·활성화·이탈 방지 흐름을 이해하고, 기능 우선순위와 구독 구조를 산업 맥락으로 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  SERVICE_PLANNING__IND_EDUCATION_EDTECH_LEARNING: Object.freeze({
    subVertical: "SERVICE_PLANNING",
    industryKey: "IND_EDUCATION_EDTECH_LEARNING",
    axis2LiftHint:
      "에듀테크 서비스기획에서는 학습 지속률·완강률·수강생 행동 데이터를 이해하고, 콘텐츠 흐름을 기획 맥락으로 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  PERFORMANCE_MARKETING__IND_COMMERCE_CONSUMER_RETAIL: Object.freeze({
    subVertical: "PERFORMANCE_MARKETING",
    industryKey: "IND_COMMERCE_CONSUMER_RETAIL",
    axis2LiftHint:
      "커머스 퍼포먼스마케팅에서는 전환율·CPC·LTV·재구매 지표를 채널별로 해석하고, 판매 흐름과 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  DATA_ANALYSIS__IND_HEALTHCARE_PHARMA_BIO: Object.freeze({
    subVertical: "DATA_ANALYSIS",
    industryKey: "IND_HEALTHCARE_PHARMA_BIO",
    axis2LiftHint:
      "헬스케어 데이터분석에서는 지표 해석뿐 아니라 안전성·오류 방향성·도메인 제약을 함께 고려하는 방식을 이해할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  B2B_SALES__IND_B2B_SAAS_IT_PLATFORM: Object.freeze({
    subVertical: "B2B_SALES",
    industryKey: "IND_B2B_SAAS_IT_PLATFORM",
    axis2LiftHint:
      "B2B SaaS 영업에서는 온보딩·활성화·갱신 리스크·계정 확장 맥락을 이해하고, 고객 여정과 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

});

export function getAxis2CompoundHint(subVertical, industryKey) {
  const safeSubVertical = typeof subVertical === "string" ? subVertical.trim() : "";
  const safeIndustryKey = typeof industryKey === "string" ? industryKey.trim() : "";
  if (!safeSubVertical || !safeIndustryKey) return null;
  return NEWGRAD_AXIS2_COMPOUND_HINT_REGISTRY[`${safeSubVertical}__${safeIndustryKey}`] ?? null;
}
