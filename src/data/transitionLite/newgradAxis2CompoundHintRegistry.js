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

  PERFORMANCE_MARKETING__IND_FINANCE_FINTECH_INSURANCE: Object.freeze({
    subVertical: "PERFORMANCE_MARKETING",
    industryKey: "IND_FINANCE_FINTECH_INSURANCE",
    axis2LiftHint:
      "금융·핀테크 퍼포먼스마케팅에서는 전환 효율뿐 아니라 신뢰 기반 채널 전략, 금융 상품 구조와 규제 민감도를 마케팅 맥락으로 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  PERFORMANCE_MARKETING__IND_B2B_SAAS_IT_PLATFORM: Object.freeze({
    subVertical: "PERFORMANCE_MARKETING",
    industryKey: "IND_B2B_SAAS_IT_PLATFORM",
    axis2LiftHint:
      "B2B SaaS 퍼포먼스마케팅에서는 리드 볼륨보다 리드 품질·MQL·영업 파이프라인 기여를 채널별로 해석하고, 구독 전환 맥락과 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  SERVICE_PLANNING__IND_COMMERCE_CONSUMER_RETAIL: Object.freeze({
    subVertical: "SERVICE_PLANNING",
    industryKey: "IND_COMMERCE_CONSUMER_RETAIL",
    axis2LiftHint:
      "커머스 서비스기획에서는 장바구니·결제 흐름, 상품 탐색 경험, 이탈 구간 개선을 서비스 구조로 해석하고, 전환율·재구매 흐름과 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  SERVICE_PLANNING__IND_HEALTHCARE_PHARMA_BIO: Object.freeze({
    subVertical: "SERVICE_PLANNING",
    industryKey: "IND_HEALTHCARE_PHARMA_BIO",
    axis2LiftHint:
      "헬스케어 서비스기획에서는 환자·의료인 중심 워크플로우, 의료정보 민감도, 안전성 제약 조건을 기획 맥락으로 이해하고 서비스 흐름과 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  DATA_ANALYSIS__IND_FINANCE_FINTECH_INSURANCE: Object.freeze({
    subVertical: "DATA_ANALYSIS",
    industryKey: "IND_FINANCE_FINTECH_INSURANCE",
    axis2LiftHint:
      "금융·핀테크 데이터분석에서는 리스크 지표, 이탈·자산 데이터 구조, 규제 제약 조건을 분석 맥락에 통합하고, 결과의 방향성과 한계를 명확하게 전달할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  DATA_ANALYSIS__IND_COMMERCE_CONSUMER_RETAIL: Object.freeze({
    subVertical: "DATA_ANALYSIS",
    industryKey: "IND_COMMERCE_CONSUMER_RETAIL",
    axis2LiftHint:
      "커머스 데이터분석에서는 구매 퍼널·코호트 이탈 패턴·A/B 실험을 해석하고, 장바구니·LTV 지표를 사업 의사결정과 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  CUSTOMER_SUCCESS__IND_B2B_SAAS_IT_PLATFORM: Object.freeze({
    subVertical: "CUSTOMER_SUCCESS",
    industryKey: "IND_B2B_SAAS_IT_PLATFORM",
    axis2LiftHint:
      "B2B SaaS CS에서는 계정 건강도, 갱신 리스크 조기 감지, 확장 수익 기회를 고객 여정 맥락으로 해석하고 이탈 방지 행동과 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  PRODUCT_MARKETING_PMM__IND_B2B_SAAS_IT_PLATFORM: Object.freeze({
    subVertical: "PRODUCT_MARKETING_PMM",
    industryKey: "IND_B2B_SAAS_IT_PLATFORM",
    axis2LiftHint:
      "B2B SaaS PMM에서는 목표 고객 정의, 포지셔닝·메시징 설계, 영업 지원 전략을 산업 맥락으로 연결하고, 제품 출시와 고객 도입 흐름을 이해할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  CONTENT_MARKETING__IND_MEDIA_CONTENT_ENTERTAINMENT: Object.freeze({
    subVertical: "CONTENT_MARKETING",
    industryKey: "IND_MEDIA_CONTENT_ENTERTAINMENT",
    axis2LiftHint:
      "미디어·콘텐츠 산업의 콘텐츠마케팅에서는 콘텐츠를 채널이 아닌 핵심 상품으로 이해하고, 오디언스 확보 전략과 구독·광고 기반 수익 흐름과 연결할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

  RECRUITING__IND_HR_RECRUITMENT_PEOPLE_SERVICE: Object.freeze({
    subVertical: "RECRUITING",
    industryKey: "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
    axis2LiftHint:
      "HR·채용 서비스 산업에서는 인하우스와 달리 고객사 포지션 파악, 후보자 파이프라인의 서비스 관점 운영, 마감 속도와 품질 균형을 이해할 수 있으면 이 축이 더 올라갈 수 있습니다.",
  }),

});

export function getAxis2CompoundHint(subVertical, industryKey) {
  const safeSubVertical = typeof subVertical === "string" ? subVertical.trim() : "";
  const safeIndustryKey = typeof industryKey === "string" ? industryKey.trim() : "";
  if (!safeSubVertical || !safeIndustryKey) return null;
  return NEWGRAD_AXIS2_COMPOUND_HINT_REGISTRY[`${safeSubVertical}__${safeIndustryKey}`] ?? null;
}
