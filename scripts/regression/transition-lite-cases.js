/**
 * transition-lite-cases.js  (v2 — hardened)
 *
 * 8개 고정 회귀 케이스 정의 + 방향성 기대값(expectations)
 *
 * expectations 필드 목록:
 *   preferredTopRiskKeys        이 중 하나 이상이 topRisks에 있어야 함
 *   forbiddenTopRiskKeys        이 중 하나라도 topRisks에 있으면 fail
 *   maxTopRiskCount             topRisks 개수 상한
 *   noDuplicateTopRisks         topRisks key 중복 없어야 함
 *   requireIndustryTraitsAsset  true이면 industryTraitsAsset != null 필요
 *   forbidPlaceholderPatterns   true이면 {…} raw template 패턴 금지
 *   requiredKeywordsBySurface   각 surface에 반드시 있어야 할 키워드
 *   forbiddenPhrasesBySurface   각 surface에 있으면 안 되는 문구
 *   minSurfaceLengthByField     각 surface 최소 길이 (미달 시 warning)
 */

// Risk key constants (buildTransitionLiteResult.js 기준)
export const RISK_INDUSTRY_CONTEXT_SHIFT = "RISK_INDUSTRY_CONTEXT_SHIFT";
export const RISK_JOB_EXPECTATION_SHIFT = "RISK_JOB_EXPECTATION_SHIFT";
export const RISK_EXECUTION_LINK_CHECK = "RISK_EXECUTION_LINK_CHECK";
export const RISK_STRATEGIC_VIEW_CHECK = "RISK_STRATEGIC_VIEW_CHECK";
export const RISK_RESPONSIBILITY_EXPANSION = "RISK_RESPONSIBILITY_EXPANSION";
export const RISK_SCOPE_REINTERPRETATION = "RISK_SCOPE_REINTERPRETATION";

export const REGRESSION_CASES = [
  // ─── Case 1: 완전 근접 이동 기준점 ───────────────────────────────────────
  // 같은 직무(DevOps), 인접 산업(B2B SaaS → 엔터프라이즈 솔루션)
  // 기대: 큰 전환 리스크 없음 / 과잉 리스크가 나오면 안 됨 / DevOps 핵심 책임이 살아야 함
  {
    id: "case-1",
    label: "완전 근접 이동 기준점",
    input: {
      currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
      targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION",
    },
    expectations: {
      preferredTopRiskKeys: [],
      forbiddenTopRiskKeys: [RISK_JOB_EXPECTATION_SHIFT],
      maxTopRiskCount: 1,
      requireIndustryTraitsAsset: false,
      forbidPlaceholderPatterns: true,
      requiredKeywordsBySurface: {
        targetJobRead: ["배포", "ci"],
        targetIndustryRead: ["엔터프라이즈", "안정성"],
      },
      forbiddenPhrasesBySurface: {
        whyThisRead: ["둘 다 it", "비슷한 업무입니다"],
      },
      minSurfaceLengthByField: {
        targetJobRead: 30,
        targetIndustryRead: 30,
      },
    },
  },

  // ─── Case 2: 같은 직무, 산업만 크게 변경 ─────────────────────────────────
  // DevOps 유지, B2B SaaS → 공공기관 (cross industry)
  // 기대: 산업 리스크가 상위 / 직무 리스크는 나오면 안 됨 / 공공기관 맥락이 살아야 함
  {
    id: "case-2",
    label: "같은 직무, 산업만 크게 변경",
    input: {
      currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
      targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
      targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
      forbiddenTopRiskKeys: [RISK_JOB_EXPECTATION_SHIFT],
      requireIndustryTraitsAsset: true,
      forbidPlaceholderPatterns: true,
      requiredKeywordsBySurface: {
        targetIndustryRead: ["공공"],
      },
      forbiddenPhrasesBySurface: {
        whyThisRead: ["둘 다 it", "비슷한 업무입니다"],
        targetIndustryRead: ["비슷한 업무입니다"],
      },
      minSurfaceLengthByField: {
        whyThisRead: 15,
        targetJobRead: 30,
        targetIndustryRead: 30,
      },
    },
  },

  // ─── Case 3: 인접 직무, 같은 산업 ────────────────────────────────────────
  // QA/테스트 자동화 → DevOps/인프라 (adjacent job, same industry)
  // 기대: SCOPE_REINTERPRETATION이 주 리스크 / 산업 리스크 없음
  //       targetJobRead에 배포·운영 개념 필수
  {
    id: "case-3",
    label: "인접 직무, 같은 산업",
    input: {
      currentJobId: "JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION",
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
      targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_SCOPE_REINTERPRETATION],
      forbiddenTopRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
      forbidPlaceholderPatterns: true,
      requiredKeywordsBySurface: {
        targetJobRead: ["배포", "운영"],
      },
      forbiddenPhrasesBySurface: {
        whyThisRead: ["둘 다 it", "같은 기획이라", "비슷한 업무입니다"],
      },
      minSurfaceLengthByField: {
        whyThisRead: 15,
        targetJobRead: 30,
        targetIndustryRead: 20,
      },
    },
  },

  // ─── Case 4: 인접 직무 + 산업 변경 ──────────────────────────────────────
  // 서비스운영(온라인 커머스) → 운영기획(아웃소싱/운영대행)
  // 기대: 산업+역할 양쪽 전환 드러나야 함 / 아웃소싱/운영대행 맥락 필수
  {
    id: "case-4",
    label: "인접 직무 + 산업 변경",
    input: {
      currentJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
      currentIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE",
      targetJobId: "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING",
      targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT, RISK_SCOPE_REINTERPRETATION],
      forbiddenTopRiskKeys: [],
      requireIndustryTraitsAsset: true,
      forbidPlaceholderPatterns: true,
      requiredKeywordsBySurface: {
        targetIndustryRead: ["아웃소싱", "운영"],
      },
      forbiddenPhrasesBySurface: {
        whyThisRead: ["비슷한 업무입니다", "유사한 역할입니다"],
        targetIndustryRead: ["비슷한 업무입니다"],
      },
      minSurfaceLengthByField: {
        whyThisRead: 15,
        targetJobRead: 30,
        targetIndustryRead: 30,
      },
    },
  },

  // ─── Case 5: 직무군은 비슷하지만 결과물 구조가 바뀌는 케이스 ──────────────
  // 서비스기획(B2C 플랫폼) → 사업기획(컨설팅/리서치)
  // 기대: "기획이라 비슷" generic 실패 / 컨설팅/리서치 맥락 필수
  {
    id: "case-5",
    label: "직무군은 비슷하지만 결과물 구조가 바뀌는 케이스",
    input: {
      currentJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      targetJobId: "JOB_BUSINESS_BUSINESS_PLANNING",
      targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_JOB_EXPECTATION_SHIFT, RISK_SCOPE_REINTERPRETATION],
      forbiddenTopRiskKeys: [],
      forbidPlaceholderPatterns: true,
      requiredKeywordsBySurface: {
        targetJobRead: ["사업"],
        targetIndustryRead: ["컨설팅"],
      },
      forbiddenPhrasesBySurface: {
        whyThisRead: ["같은 기획이라", "기획이라 비슷", "비슷한 업무입니다"],
        targetJobRead: ["비슷한 업무입니다", "유사한 역할"],
      },
      minSurfaceLengthByField: {
        whyThisRead: 15,
        targetJobRead: 30,
        targetIndustryRead: 30,
      },
    },
  },

  // ─── Case 6: 제조 현장 기반 → 기술지원 / 필드 계열 ──────────────────────
  // 품질보증QA(전기전자) → 기술지원/필드엔지니어(기계/산업장비)
  // 기대: front-facing 역할 변화 드러나야 함 / 지원·현장 키워드 필수
  {
    id: "case-6",
    label: "제조 현장 기반 → 기술지원 / 필드 계열",
    input: {
      currentJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
      currentIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
      targetJobId: "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
      targetIndustryId: "IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_SCOPE_REINTERPRETATION, RISK_JOB_EXPECTATION_SHIFT],
      forbiddenTopRiskKeys: [],
      requireIndustryTraitsAsset: true,
      forbidPlaceholderPatterns: true,
      requiredKeywordsBySurface: {
        targetJobRead: ["지원"],
      },
      forbiddenPhrasesBySurface: {
        whyThisRead: ["비슷한 업무입니다", "유사한 역할입니다"],
      },
      minSurfaceLengthByField: {
        whyThisRead: 15,
        targetJobRead: 30,
        targetIndustryRead: 20,
      },
    },
  },

  // ─── Case 7: 전문서비스 → 협회/단체 특수 맥락 ────────────────────────────
  // 채용(HR/채용/인사서비스) → 대외협력(협회/단체)
  // 기대: 이해관계자 구조 변화 드러나야 함 / 협회/단체 산업 traits 필수 / generic 실패
  {
    id: "case-7",
    label: "전문서비스 → 협회/단체 특수 맥락",
    input: {
      currentJobId: "JOB_HR_ORGANIZATION_RECRUITING",
      currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
      targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS",
      targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_ASSOCIATION_ORGANIZATION",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_JOB_EXPECTATION_SHIFT, RISK_INDUSTRY_CONTEXT_SHIFT],
      forbiddenTopRiskKeys: [],
      requireIndustryTraitsAsset: true,
      forbidPlaceholderPatterns: true,
      requiredKeywordsBySurface: {
        targetIndustryRead: ["협회"],
      },
      forbiddenPhrasesBySurface: {
        whyThisRead: ["비슷한 업무입니다", "유사한 역할입니다"],
        targetJobRead: ["비슷한 업무입니다"],
        targetIndustryRead: ["비슷한 업무입니다"],
      },
      minSurfaceLengthByField: {
        whyThisRead: 15,
        targetJobRead: 30,
        targetIndustryRead: 30,
      },
    },
  },

  // ─── Case 8: 실제 문제 케이스 재검증 ─────────────────────────────────────
  // DevOps/인프라(아웃소싱/운영대행) → 민원/현장지원(협회/단체)
  //
  // 현재 산업 선정 근거:
  //   professional_b2b_services 섹터 내 IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS가
  //   DevOps 인프라 운영 아웃소싱 맥락으로 가장 근접. 컨설팅/HR서비스는 DevOps 맥락과 멀다.
  //
  // 기대: 직무 번역 정확성 / 협회 산업 traits 필수 / 리스크 중복 없음 — 가장 엄격하게 검사
  {
    id: "case-8",
    label: "실제 문제 케이스 재검증",
    input: {
      currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
      currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
      targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT",
      targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_ASSOCIATION_ORGANIZATION",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_JOB_EXPECTATION_SHIFT],
      forbiddenTopRiskKeys: [],
      noDuplicateTopRisks: true,
      requireIndustryTraitsAsset: true,
      forbidPlaceholderPatterns: true,
      requiredKeywordsBySurface: {
        targetIndustryRead: ["협회"],
      },
      forbiddenPhrasesBySurface: {
        whyThisRead: ["둘 다 it", "비슷한 업무입니다"],
        targetJobRead: ["비슷한 업무입니다"],
      },
      minSurfaceLengthByField: {
        whyThisRead: 15,
        targetJobRead: 30,
        targetIndustryRead: 30,
      },
    },
  },

  // ─── Case 5g-1: D1 guard — customerMarketFlip (B2C→B2B, same IT sector) ──────
  // 서비스기획(B2C 플랫폼) → 사업기획(B2B SaaS)
  // same IT_SOFTWARE_PLATFORM sector, different customerMarket
  // D1: customerMarketFlip=true → INDUSTRY +8 → 30 > SCOPE 24
  // 기대: INDUSTRY_CONTEXT_SHIFT wins despite same sector
  {
    id: "case-5g-1",
    label: "D1 guard: B2C→B2B customerMarketFlip, same sector cross industry",
    input: {
      currentJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      targetJobId: "JOB_BUSINESS_BUSINESS_PLANNING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
      forbiddenTopRiskKeys: [],
      noDuplicateTopRisks: true,
      forbidPlaceholderPatterns: true,
    },
  },

  // ─── Case 5g-3: D1 absence guard — B2B→B2B, no customerMarketFlip ──────────
  // 서비스기획(B2B SaaS) → 사업기획(컨설팅/리서치)
  // both B2B, cross sector: D1 not fired, D3 fires (family mismatch, no flip) → SCOPE +4
  // 기대: SCOPE_REINTERPRETATION wins (base 24+4=28 > INDUSTRY 22)
  {
    id: "case-5g-3",
    label: "D1 absence guard: B2B→B2B cross, no customerMarketFlip, D3 fires",
    input: {
      currentJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
      targetJobId: "JOB_BUSINESS_BUSINESS_PLANNING",
      targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_SCOPE_REINTERPRETATION],
      forbiddenTopRiskKeys: [],
      noDuplicateTopRisks: true,
      forbidPlaceholderPatterns: true,
    },
  },

  // ─── Case 5g-4: D1 guard — customerMarketFlip (B2C→B2G_B2C_MIXED) ──────────
  // 서비스기획(B2C 플랫폼) → 사업기획(공공기관)
  // D1: "B2C" !== "B2G_B2C_MIXED" → customerMarketFlip=true → INDUSTRY +8 → 30 > SCOPE 24
  // 기대: INDUSTRY_CONTEXT_SHIFT wins
  {
    id: "case-5g-4",
    label: "D1 guard: B2C→B2G_B2C_MIXED customerMarketFlip, public sector cross",
    input: {
      currentJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      targetJobId: "JOB_BUSINESS_BUSINESS_PLANNING",
      targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION",
    },
    expectations: {
      preferredTopRiskKeys: [RISK_INDUSTRY_CONTEXT_SHIFT],
      forbiddenTopRiskKeys: [],
      noDuplicateTopRisks: true,
      forbidPlaceholderPatterns: true,
    },
  },
];
