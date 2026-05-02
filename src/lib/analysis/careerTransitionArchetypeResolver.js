/**
 * Career Transition Archetype Resolver — Phase 3 minimal implementation.
 * Standalone pure function. Not connected to UI or analysis pipeline.
 * @MX:ANCHOR: [AUTO] Public API boundary. Fan-in will grow as pipeline integrates.
 * @MX:REASON: resolveCareerTransitionArchetype is the single entry point for all archetype resolution.
 */

const JOB_GROUP_MAP = {
  JOB_BUSINESS_SERVICE_PLANNING: 'service_planning',
  JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT: 'product_management',
  JOB_BUSINESS_BUSINESS_PLANNING: 'business_planning',
  JOB_MARKETING_PERFORMANCE_MARKETING: 'performance_marketing',
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS: 'customer_support',
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS: 'customer_success',
  JOB_SALES_SALES_OPERATIONS: 'sales_admin',
  JOB_PROCUREMENT_SCM_PROCUREMENT: 'procurement',
  JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING: 'procurement',
  JOB_PROCUREMENT_SCM_PURCHASING: 'procurement',
  JOB_FINANCE_ACCOUNTING_ACCOUNTING: 'accounting',
  JOB_FINANCE_ACCOUNTING_FP_AND_A: 'finance_planning',
  JOB_FINANCE_ACCOUNTING_TAX: 'tax',
  JOB_FINANCE_ACCOUNTING_TREASURY: 'treasury',
  JOB_HR_ORGANIZATION_HR_OPS: 'hr_operations',
  JOB_HR_ORGANIZATION_HRBP: 'hrbp',
  JOB_HR_ORGANIZATION_RECRUITING: 'recruiting',
  JOB_HR_ORGANIZATION_LEARNING_OD: 'learning_od',
  JOB_PROCUREMENT_SCM_SCM: 'scm',
  JOB_DESIGN_UX_DESIGN: 'ux_design',
  JOB_DESIGN_UI_DESIGN: 'ux_design',
  JOB_DESIGN_PRODUCT_DESIGN: 'ux_design',
  JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING: 'operations_planning',
  JOB_BUSINESS_OPERATIONS_MANAGEMENT: 'operations_planning',
  JOB_BUSINESS_BUSINESS_DEVELOPMENT: 'business_development',
  JOB_SALES_B2B_SALES: 'sales_b2b',
  JOB_SALES_PROPOSAL_SALES: 'sales_b2b',
  JOB_SALES_KEY_ACCOUNT_MANAGEMENT: 'account_management',
  JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION: 'admin',
  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA: 'manufacturing_qa',
  JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING: 'tech_support',
  JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT: 'engineering',
  JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT: 'engineering',
  JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT: 'engineering',
  JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH: 'research',
  JOB_MARKETING_MARKETING_RESEARCH: 'research',
  JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: 'data_analytics',
  JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION: 'qa_engineer',
  JOB_MARKETING_BRAND_MARKETING: 'brand_marketing',
  JOB_MARKETING_CRM_MARKETING: 'crm_marketing',
  JOB_MARKETING_DIGITAL_MARKETING: 'digital_marketing',
  JOB_MARKETING_CONTENT_MARKETING: 'content_marketing',
  JOB_IT_DATA_DIGITAL_IT_PLANNING: 'it_planning',
  JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS: 'commerce_operations',
  JOB_BUSINESS_MERCHANDISING: 'md',
  JOB_CUSTOMER_OPERATIONS_CX_PLANNING: 'cx_planning',
};

// @MX:NOTE: [AUTO] CURATED_CASES checked before ARCHETYPE_TABLE. condition() guard enables PO exclusion.
const CURATED_CASES = [
  {
    sourceGroup: 'service_planning',
    targetGroup: 'product_management',
    condition: (input) => input.targetSubType !== 'PO',
    caseId: 'EXPERIENCED_SERVICE_PLANNING_TO_PRODUCT_MANAGER_V2',
    archetypeId: 'PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP',
    secondaryAxis: 'responsibilityScope',
    confidence: 'high',
    overlays: {
      jobStructure: {
        lead: '서비스기획 경험은 PM 직무와 기본 구조가 많이 겹칩니다. 사용자 흐름을 정리하고 기능을 정의하며 개발·디자인 조직과 협업해 서비스를 출시하는 경험은 PM 업무의 중요한 기반입니다.',
        scoreReason: 'PM은 기획 산출물을 만드는 역할에서 한 단계 더 나아가, 제품이 풀어야 할 문제정의를 하고 우선순위를 판단하며 출시 후 성과까지 확인하는 역할입니다.',
        criteria: '기획 경험이 PM의 핵심 역할인 문제정의, 제품 방향 설정, 우선순위 판단, 성과 확인과 얼마나 직접 연결되는지를 봅니다.',
      },
      responsibilityScope: {
        lead: '서비스기획에서 제품 오너십으로 책임 범위가 이동합니다. 기획자는 기능 완성도를 높이는 역할이지만, PM은 제품의 방향, 우선순위, 성과까지 더 넓게 책임집니다.',
        liftOrLimit: '"담당 화면을 설계했다"보다 "어떤 기준으로 우선순위를 정했고, 출시 이후 어떤 데이터를 보고 개선했는지"를 보여주면 PM 역할 확장성이 더 분명해집니다.',
      },
    },
  },
  {
    sourceGroup: 'service_planning',
    targetGroup: 'business_planning',
    condition: () => true,
    caseId: 'EXPERIENCED_SERVICE_PLANNING_TO_BUSINESS_PLANNING_V1',
    archetypeId: 'PLANNING_OUTPUT_TO_BUSINESS_STRATEGY',
    secondaryAxis: 'responsibilityScope',
    confidence: 'high',
    overlays: {
      jobStructure: {
        lead: '서비스기획 경험은 사업기획의 서비스·시장 이해 역량과 연결될 수 있습니다. 서비스 내부 구조와 고객 흐름을 이해한 경험은 시장 분석과 사업 성과 판단의 기반이 됩니다.',
        scoreReason: '다만 사업기획은 수익모델, 시장 전략, 사업 성과 판단이 핵심입니다. 기존 기획 경험을 사업 전략과 수익 관점으로 연결하는 역량이 추가로 확인되어야 합니다.',
        criteria: '시장 분석, 수익모델 설계, 사업 성과 판단 경험이 기획 이력 안에 얼마나 포함되어 있는지를 봅니다.',
      },
      responsibilityScope: {
        lead: '서비스기획 역할에서 사업 전략·시장 분석 중심 역할로 책임 방향이 전환됩니다.',
        liftOrLimit: '"화면을 설계했다"보다 "이 기능이 어떤 사업 성과를 달성했는지"를 보여주면 사업기획 역할과의 연결이 강해집니다.',
      },
    },
  },
  {
    sourceGroup: 'performance_marketing',
    targetGroup: 'service_planning',
    condition: () => true,
    caseId: 'PERFORMANCE_MARKETING_TO_SERVICE_PLANNING',
    archetypeId: 'PERFORMANCE_MARKETING_TO_SERVICE_PLANNING',
    secondaryAxis: 'customerType',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '퍼포먼스마케팅 경험은 서비스기획과 연결될 수 있습니다. 사용자 행동 데이터와 퍼널을 분석해온 경험은 서비스 구조 문제를 발견하는 데 강점이 됩니다.',
        scoreReason: '다만 서비스기획은 광고 성과 최적화가 아니라, 사용자 흐름과 서비스 구조 개선을 직접 설계하는 역할입니다. 기획 산출물 작성 경험이 추가로 확인되어야 합니다.',
        criteria: '퍼포먼스마케팅 경험이 사용자 흐름 분석, 서비스 구조 개선, 기획안 작성과 얼마나 연결되는지를 봅니다.',
      },
      customerType: {
        lead: '사용자 데이터와 퍼널을 통해 쌓은 고객 행동 이해는 서비스기획의 사용자 흐름 설계에 직접 연결됩니다.',
        liftOrLimit: '"광고를 최적화했다"보다 "서비스 내 사용자 흐름의 어떤 지점을 개선했고, 어떤 서비스 구조 문제를 발견했는지"를 보여줘야 합니다.',
      },
    },
  },
];

const ARCHETYPE_TABLE = {
  'customer_support:service_planning': {
    archetypeId: 'CUSTOMER_SUPPORT_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'customerType',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '반복 VOC와 반복 문의 패턴 이해가 서비스 구조 문제 발견의 출발점이 된다.',
        scoreReason: '문의 응대 경험에서 서비스 구조 원인을 분석하고 정책 개선 요구사항으로 정의한 경험이 있는지가 핵심이다.',
        criteria: 'VOC 분류·집계를 넘어 화면 기능이나 정책 개선안 작성에 관여한 경험 여부를 확인한다.',
      },
      customerType: {
        lead: '최종 사용자 언어와 불편 패턴에 대한 직접 이해가 서비스기획에서 차별화 강점이 된다.',
        liftOrLimit: '반복 이슈의 서비스 구조 원인을 파악하고 기획 산출물로 연결한 경험이 있으면 긍정적, 응대 처리에만 머물렀으면 기획 역량 증명이 추가로 필요하다.',
      },
    },
  },
  'customer_support:product_management': {
    archetypeId: 'CUSTOMER_SUPPORT_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "고객지원 경험은 PM 전환에서 '고객 문제를 제품 개선 기회로 발견한 경험'으로 연결될 수 있습니다.",
        scoreReason:
          'PM은 고객이 제품을 쓰는 과정에서 어디서 막히고 어떤 기능을 필요로 하는지 이해해야 합니다. 고객지원 경험은 실제 사용자 불편, 반복 문의, 오류, 이탈 신호를 가까이서 본다는 점에서 PM과 연결될 수 있습니다. 다만 PM으로 보이려면 고객 요청을 전달한 수준이 아니라, 문제를 유형화하고 제품 우선순위나 기능 개선안으로 연결한 경험이 필요합니다.',
        criteria:
          '강점: 반복 VOC, 고객 불만, 사용성 문제, 기능 요청을 직접 접한 경험은 제품 문제 발견에 강점입니다. 한계: 상담 처리량이나 응대 만족도 중심으로만 표현되면 PM 직무와의 직접성은 약합니다. 이력서에서는 고객 문제를 어떤 기능 개선, 정책 변경, 제품 지표 개선 과제로 정리했는지 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '고객지원 경험은 문제 발견에는 강점이지만, PM 전환에서는 그 문제를 제품 의사결정과 우선순위로 연결한 흔적이 필요합니다.',
      },
    },
  },
  'customer_success:service_planning': {
    archetypeId: 'CUSTOMER_SUCCESS_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "Customer Success 경험은 서비스기획 전환에서 '고객 사용 과정과 정착 문제를 개선 과제로 본 경험'으로 연결될 수 있습니다.",
        scoreReason:
          'Customer Success는 고객이 서비스를 도입하고 실제로 활용하는 과정에서 어떤 장애물을 겪는지 가까이서 보는 역할입니다. 이 경험은 서비스기획에서 온보딩, 사용 흐름, 안내 체계, 운영 정책을 개선하는 데 강점이 될 수 있습니다. 다만 서비스기획으로 보이려면 고객 관리나 교육 경험에 그치지 않고, 사용 과정의 문제를 서비스 구조 개선으로 연결한 사례가 필요합니다.',
        criteria:
          '강점: 고객 온보딩, 활용률, 이탈 징후, 반복 요청을 이해한 경험은 서비스기획과 연결됩니다. 한계: 고객 관리, 교육, 관계 유지 중심으로만 보이면 기획 직접성은 약해 보일 수 있습니다. 이력서에서는 고객 정착 문제를 어떤 화면, 정책, 안내 흐름, 기능 개선으로 연결했는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'Customer Success 경험은 고객 사용 맥락을 깊게 이해한다는 강점이 있지만, 서비스기획 전환에서는 이를 서비스 흐름과 정책 개선으로 옮긴 경험이 필요합니다.',
      },
    },
  },
  'customer_success:product_management': {
    archetypeId: 'CUSTOMER_SUCCESS_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "Customer Success 경험은 PM 전환에서 '고객 활용률과 제품 개선 기회를 연결한 경험'으로 활용될 수 있습니다.",
        scoreReason:
          'PM은 제품이 고객에게 실제로 쓰이고 있는지, 어디서 정착이 안 되는지, 어떤 기능이 가치를 만드는지 판단해야 합니다. Customer Success 경험은 고객의 사용 맥락, 도입 장벽, 활용률, 이탈 위험을 가까이서 본다는 점에서 PM과 연결됩니다. 다만 PM으로 보이려면 고객 요청을 관리하는 데 그치지 않고, 제품 개선 방향과 우선순위 판단으로 연결한 경험이 필요합니다.',
        criteria:
          '강점: 고객 활용률, 온보딩, 이탈 위험, 기능 요청, 도입 장벽을 이해한 경험은 B2B/SaaS PM과 특히 연결됩니다. 한계: 고객 관리나 교육 중심으로만 표현되면 제품 책임 경험은 약해 보일 수 있습니다. 이력서에서는 고객 사용 데이터를 바탕으로 어떤 제품 개선안이나 로드맵 제안을 했는지 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'Customer Success 경험은 고객 사용 맥락을 잘 안다는 강점이 있지만, PM 전환에서는 이를 제품 우선순위와 지표 개선으로 연결한 경험이 핵심입니다.',
      },
    },
  },
  'sales_admin:business_planning': {
    archetypeId: 'SALES_ADMIN_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '영업 데이터 집계 경험이 사업 인사이트 도출의 원재료로 작동합니다.',
        scoreReason: '영업 지표를 사업 전략 판단으로 연결한 경험이 있는지가 핵심 평가 기준입니다.',
        criteria: '데이터 보고를 넘어 전략적 해석까지 경험했는지 이력서에서 확인합니다.',
      },
      responsibilityScope: {
        lead: '영업 내부 지원 역할에서 사업 전반의 기획·분석 역할로 책임 범위가 이동합니다.',
        liftOrLimit: '전략 해석 경험이나 경영진 보고 경험이 있으면 긍정적입니다. 단순 집계 역할에 머물렀다면 전환 거리가 있어 추가 경험이 필요합니다.',
      },
    },
  },
  'procurement:business_planning': {
    archetypeId: 'PURCHASING_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '구매·조달 경험은 사업기획 전환에서 원가, 공급사, 운영 구조를 이해한 경험으로 연결될 수 있습니다.',
        scoreReason: '사업기획은 매출뿐 아니라 비용 구조, 공급 조건, 운영 효율, 수익성 개선 가능성을 함께 봐야 합니다. 구매·조달 경험은 공급사 관리, 단가 협상, 원가 절감, 계약 조건, 납기와 품질 이슈를 다뤄본 경험이라는 점에서 사업기획과 연결될 수 있습니다. 다만 구매 실행 중심으로만 보이면 시장·사업 모델·성과 지표를 설계하는 사업기획 역할과는 차이가 있어 보일 수 있습니다.',
        criteria: '강점: 원가 구조, 공급사 협상, 계약 조건, 비용 절감, 운영 리스크 관리 경험은 사업기획과 연결됩니다. 한계: 발주 처리나 견적 비교 중심으로만 보이면 기획 역할로 보기 어렵습니다. 이력서에서는 구매 경험이 어떤 비용 구조 개선, 수익성 개선, 사업 운영 판단으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: '구매·조달 경험은 사업기획의 비용·운영 관점과 연결성이 있지만, 사업성과와 의사결정에 기여한 근거까지 드러나야 전환 설득력이 높아집니다.',
      },
    },
  },
  'scm:business_planning': {
    archetypeId: 'SCM_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'SCM 경험은 사업기획 전환에서 공급망과 운영 흐름을 사업성과 관점으로 이해한 경험으로 연결될 수 있습니다.',
        scoreReason: '사업기획은 상품이나 서비스가 실제로 고객에게 전달되는 과정에서 비용, 리드타임, 재고, 수요, 운영 효율이 어떻게 성과에 영향을 주는지 봐야 합니다. SCM 경험은 수요·공급 조율, 재고 관리, 납기, 물류, 공급망 리스크를 다뤄본 경험이라는 점에서 사업기획과 연결될 수 있습니다. 다만 운영 관리 중심으로만 보이면 시장 전략이나 사업 모델을 설계하는 기획 역할과는 차이가 있어 보일 수 있습니다.',
        criteria: '강점: 수요·공급 조율, 재고 관리, 리드타임 개선, 물류 효율화, 공급망 리스크 관리 경험은 사업기획과 연결됩니다. 한계: 일정 관리나 운영 처리 중심으로만 보이면 사업기획 전환 근거가 약합니다. 이력서에서는 SCM 경험이 비용 절감, 매출 기회, 서비스 품질, 사업 운영 지표 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: 'SCM 경험은 사업 운영 구조를 이해하는 강점이 있지만, 사업기획 전환에서는 운영 개선을 사업성과와 연결한 경험이 중요합니다.',
      },
    },
  },
  'procurement:product_management': {
    archetypeId: 'PURCHASING_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '구매·조달 경험은 PM 전환에서 원가, 공급 조건, 파트너 구조를 제품 의사결정에 반영해본 경험으로 연결될 수 있습니다.',
        scoreReason: 'PM은 고객 문제뿐 아니라 제품의 가격, 수익성, 공급 가능성, 파트너 조건, 운영 제약을 함께 고려해야 합니다. 구매·조달 경험은 공급사, 원가, 계약 조건, 품질, 납기 이슈를 다뤄본 경험이라는 점에서 제품 운영형 PM이나 커머스·플랫폼 PM과 연결될 수 있습니다. 다만 구매 실행 중심으로만 보이면 사용자 문제 정의, 기능 우선순위, 제품 지표 개선과는 거리가 있어 보일 수 있습니다.',
        criteria: '강점: 원가, 공급사, 계약 조건, 품질·납기 이슈를 이해한 경험은 제품 운영과 수익성 판단에 연결됩니다. 한계: 발주나 협상 실무 중심으로만 보이면 PM의 제품 책임과는 차이가 있어 보일 수 있습니다. 이력서에서는 구매·조달 경험이 어떤 제품 조건, 가격 정책, 상품 구성, 운영 지표 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: '구매·조달 경험은 제품의 비용과 공급 구조를 이해하는 강점이 있지만, PM 전환에서는 사용자 문제와 제품 지표로 연결한 사례가 필요합니다.',
      },
    },
  },
  'scm:product_management': {
    archetypeId: 'SCM_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'SCM 경험은 PM 전환에서 운영 흐름과 공급 제약을 제품 개선 과제로 해석한 경험으로 연결될 수 있습니다.',
        scoreReason: 'PM은 제품이 실제로 운영되는 과정에서 발생하는 병목, 비용, 리드타임, 품질, 고객 경험 문제를 제품 개선 과제로 바꿔야 합니다. SCM 경험은 수요·공급 조율, 재고, 물류, 납기, 공급망 이슈를 구조적으로 다뤄본 경험이라는 점에서 운영형 PM, 커머스 PM, 물류·플랫폼 PM과 연결될 수 있습니다. 다만 운영 처리 중심으로만 보이면 제품 기능, 우선순위, 지표 개선을 책임지는 PM 역할과는 차이가 있어 보일 수 있습니다.',
        criteria: '강점: 공급망 흐름, 재고, 리드타임, 물류, 운영 병목을 이해한 경험은 제품 운영 개선과 연결됩니다. 한계: 일정 조율이나 예외 처리 중심으로만 보이면 PM 전환 근거가 약합니다. 이력서에서는 SCM 문제가 어떤 제품 기능, 운영 자동화, 고객 경험, 비용·전환율·처리시간 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: 'SCM 경험은 운영 문제를 구조적으로 보는 강점이 있지만, PM 전환에서는 이를 제품 의사결정과 지표 개선으로 연결한 경험이 필요합니다.',
      },
    },
  },
  'procurement:business_development': {
    archetypeId: 'PURCHASING_TO_BUSINESS_DEVELOPMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'stakeholderComplexity',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '구매·조달 경험은 BD 전환에서 외부 파트너와 조건을 조율해본 경험으로 연결될 수 있습니다.',
        scoreReason: 'BD는 외부 파트너와 협력 구조를 만들고, 조건을 조율하며, 사업 기회를 실제 실행 가능한 형태로 만들어야 합니다. 구매·조달 경험은 공급사 발굴, 협상, 계약 조건 조율, 리스크 관리, 관계 관리를 해본 경험이라는 점에서 BD와 연결될 수 있습니다. 다만 구매자 입장에서 비용을 낮추는 역할에만 머물렀다면, 매출 기회나 사업 확장 구조를 만드는 BD와는 차이가 있어 보일 수 있습니다.',
        criteria: '강점: 파트너 발굴, 협상, 계약 조건 조율, 공급사 관계 관리 경험은 BD와 연결됩니다. 한계: 단가 협상이나 발주 처리 중심으로만 보이면 사업개발 역할로 보기 어렵습니다. 이력서에서는 외부 파트너십이 어떤 신규 기회, 매출 가능성, 운영 확장, 사업 조건 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      stakeholderComplexity: {
        liftOrLimit: '구매·조달 경험은 파트너 협상과 조건 조율 측면에서 BD와 연결되지만, 사업 기회 창출 관점으로 재해석해야 전환 설득력이 높아집니다.',
      },
    },
  },
  'accounting:finance_planning': {
    archetypeId: 'ACCOUNTING_TO_FPA',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '회계 경험은 FP&A나 재무기획 전환에서 숫자를 기준으로 사업을 해석해본 경험으로 연결될 수 있습니다.',
        scoreReason: 'FP&A와 재무기획은 단순 회계 처리보다 매출, 비용, 손익, 예산, 실적 차이를 보고 사업 의사결정에 필요한 해석을 제공하는 역할입니다. 회계 경험은 재무제표, 비용 구조, 결산, 손익 흐름을 이해한다는 점에서 연결성이 있습니다. 다만 FP&A로 보이려면 기록과 마감 중심을 넘어 예산 대비 실적 분석, 원인 파악, 사업부와의 커뮤니케이션, 개선 제안 경험이 함께 보여야 합니다.',
        criteria: '강점: 결산, 비용 관리, 손익 분석, 재무제표 이해 경험은 FP&A와 연결됩니다. 한계: 전표 처리, 마감, 세금 신고 보조처럼 처리 중심으로만 보이면 기획 역할과는 거리가 있어 보일 수 있습니다. 이력서에서는 숫자를 정리한 것을 넘어 어떤 비용 문제, 손익 변화, 예산 차이, 사업 의사결정에 기여했는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: '회계 경험은 FP&A의 기반이 될 수 있지만, 사업부 관점의 원인 분석과 의사결정 지원 경험까지 드러나야 전환 설득력이 높아집니다.',
      },
    },
  },
  'tax:finance_planning': {
    archetypeId: 'TAX_TO_FPA',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '세무 경험은 FP&A나 재무기획 전환에서 비용·리스크·재무 구조를 보는 경험으로 일부 연결될 수 있습니다.',
        scoreReason: '세무는 세법, 신고, 비용 인정, 리스크 관리, 법인세·부가세 등 재무적 영향을 다루는 역할입니다. 이 경험은 FP&A나 재무기획에서 비용 구조와 재무 리스크를 이해하는 데 도움이 될 수 있습니다. 다만 세무 신고와 규정 대응 중심으로만 보이면 사업 실적 분석, 예산 관리, 손익 개선을 다루는 FP&A 역할과는 차이가 있어 보일 수 있습니다.',
        criteria: '강점: 세무 리스크, 비용 구조, 법인세·부가세, 신고 프로세스 이해는 재무기획과 연결될 수 있습니다. 한계: 신고 실무나 증빙 관리 중심으로만 보이면 FP&A 전환 근거가 약합니다. 이력서에서는 세무 이슈를 비용 절감, 재무 리스크 관리, 사업 의사결정 지원과 연결해 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: '세무 경험은 재무 리스크와 비용 구조 이해라는 강점이 있지만, FP&A 전환에서는 사업 실적과 예산을 해석한 경험이 추가로 필요합니다.',
      },
    },
  },
  'treasury:finance_planning': {
    archetypeId: 'TREASURY_TO_FPA',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '자금·재무 경험은 FP&A나 재무기획 전환에서 현금흐름과 재무 구조를 관리해본 경험으로 연결될 수 있습니다.',
        scoreReason: 'FP&A와 재무기획은 손익뿐 아니라 예산, 현금흐름, 투자 계획, 재무 안정성을 함께 고려해야 합니다. 자금·재무 경험은 현금흐름, 자금 집행, 금융기관 대응, 자금 계획을 다뤄본 경험이라는 점에서 연결성이 있습니다. 다만 자금 집행이나 입출금 관리 중심으로만 보이면 FP&A의 사업 분석·예산 기획 역할과는 차이가 있어 보일 수 있습니다.',
        criteria: '강점: 현금흐름 관리, 자금 계획, 금융기관 커뮤니케이션, 재무 안정성 관리 경험은 재무기획과 연결됩니다. 한계: 지급 처리나 단기 자금 운용 중심으로만 보이면 기획 역할로 보기 어렵습니다. 이력서에서는 자금 흐름을 근거로 어떤 예산 판단, 투자 판단, 비용 조정, 사업 의사결정에 기여했는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: '자금·재무 경험은 재무기획과 연결성이 있지만, FP&A 전환에서는 손익 분석과 사업부 의사결정 지원 경험까지 보여주는 것이 중요합니다.',
      },
    },
  },
  'accounting:data_analytics': {
    archetypeId: 'ACCOUNTING_TO_DATA_ANALYTICS',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'dataFluency',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '회계·재무 경험은 데이터분석 전환에서 숫자 기반으로 문제를 해석해본 경험으로 연결될 수 있습니다.',
        scoreReason: '데이터분석은 데이터를 정리하는 것보다 숫자에서 패턴과 원인을 찾고 의사결정에 필요한 해석을 제공하는 역할입니다. 회계·재무 경험은 매출, 비용, 손익, 예산, 실적 차이를 다뤄본 경험이라는 점에서 데이터분석과 연결될 수 있습니다. 다만 데이터분석 직무로 보이려면 엑셀 집계나 보고서 작성 수준을 넘어 SQL, BI, Python, 통계적 분석, 대시보드 구축 같은 분석 도구 활용 경험이 함께 보여야 합니다.',
        criteria: '강점: 재무 데이터, 비용 데이터, 손익 데이터, 예산 대비 실적 분석 경험은 데이터분석과 연결됩니다. 한계: 반복 보고서 작성이나 수기 집계 중심이면 분석 직무와는 거리가 있어 보일 수 있습니다. 이력서에서는 데이터를 통해 어떤 이상 징후, 비용 원인, 실적 차이, 개선 기회를 발견했는지를 보여줘야 합니다.',
      },
      dataFluency: {
        liftOrLimit: '회계·재무 경험은 숫자 감각이라는 강점이 있지만, 데이터분석 전환에서는 분석 도구와 재현 가능한 분석 산출물을 함께 보여줘야 합니다.',
      },
    },
  },
  'hr_operations:hrbp': {
    archetypeId: 'HR_OPERATIONS_TO_HRBP',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'HR운영 경험은 HRBP 전환에서 조직과 구성원 이슈를 제도·프로세스 관점에서 이해한 경험으로 연결될 수 있습니다.',
        scoreReason: 'HRBP는 단순 행정 처리보다 조직의 인력 이슈, 리더십 요구, 구성원 경험, 제도 운영의 맥락을 함께 판단해야 합니다. HR운영 경험은 인사제도, 발령, 평가, 보상, 근태, 인사 프로세스를 다뤄본 경험이라는 점에서 HRBP와 연결될 수 있습니다. 다만 HRBP로 보이려면 단순 처리 업무를 넘어 현업 조직의 문제를 해석하고 개선안을 제안한 경험이 함께 보여야 합니다.',
        criteria: '강점: 인사제도 운영, 구성원 문의 대응, 평가·보상·근태 프로세스 경험은 HRBP의 기본 맥락과 연결됩니다. 한계: 행정 처리나 규정 안내 중심으로만 보이면 현업 파트너 역할과는 거리가 있어 보일 수 있습니다. 이력서에서는 제도 운영 경험이 어떤 조직 문제 해결, 리더 지원, 구성원 경험 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: 'HR운영 경험은 HRBP의 기반이 될 수 있지만, 현업 조직 이슈를 해석하고 리더와 함께 해결한 경험까지 드러나야 전환 설득력이 높아집니다.',
      },
    },
  },
  'recruiting:hrbp': {
    archetypeId: 'RECRUITING_TO_HRBP',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '채용 경험은 HRBP 전환에서 조직의 인력 수요와 현업 요구를 이해한 경험으로 연결될 수 있습니다.',
        scoreReason: 'HRBP는 조직별 인력 구조, 리더의 요구, 직무별 역량 기준, 구성원 이슈를 종합적으로 이해해야 합니다. 채용 경험은 현업과 채용 요건을 조율하고, 직무·조직에 맞는 인재 기준을 정리해본 경험이라는 점에서 HRBP와 연결될 수 있습니다. 다만 채용 실행 중심으로만 보이면 HRBP의 조직관리·성과관리·구성원 이슈 대응 역할과는 차이가 있어 보일 수 있습니다.',
        criteria: '강점: 현업 인터뷰, 채용 요건 정의, 후보자 평가 기준 정리, 조직별 인력 수요 파악 경험은 HRBP와 연결됩니다. 한계: 공고 운영, 일정 조율, 후보자 커뮤니케이션 중심으로만 보이면 HRBP 전환 근거가 약해질 수 있습니다. 이력서에서는 채용 경험을 조직 문제, 인력 계획, 리더 요구, 직무 역량 기준과 연결해 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: '채용 경험은 HRBP 전환의 좋은 출발점이지만, 채용을 넘어 조직 운영과 구성원 이슈까지 다뤄본 근거가 필요합니다.',
      },
    },
  },
  'learning_od:hrbp': {
    archetypeId: 'HRD_TO_HRBP',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'HRD 경험은 HRBP 전환에서 구성원 성장과 조직 역량 이슈를 다뤄본 경험으로 연결될 수 있습니다.',
        scoreReason: 'HRBP는 조직의 성과 문제와 구성원 역량 이슈를 함께 보고, 리더와 함께 개선 방향을 찾는 역할을 합니다. HRD 경험은 교육 니즈 분석, 역량 진단, 리더십·직무 교육 기획을 통해 조직의 성장 과제를 다뤄본 경험이라는 점에서 HRBP와 연결될 수 있습니다. 다만 교육 프로그램 운영 중심으로만 보이면 HRBP의 현업 조직 파트너 역할과는 차이가 있어 보일 수 있습니다.',
        criteria: '강점: 교육 니즈 분석, 역량 모델링, 리더십 교육, 직무 교육, 조직 역량 개선 경험은 HRBP와 연결됩니다. 한계: 교육 일정 운영이나 만족도 관리 중심으로만 보이면 조직 이슈 해결 경험으로 보이기 어렵습니다. 이력서에서는 교육 기획이 어떤 조직 문제, 성과 개선, 리더십 과제 해결과 연결되었는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit: 'HRD 경험은 조직 역량 관점에서 HRBP와 연결될 수 있지만, 교육 운영을 넘어 현업 조직의 문제 해결로 확장한 경험이 중요합니다.',
      },
    },
  },
  'engineering:product_management': {
    archetypeId: 'ENGINEERING_TO_PRODUCT_MANAGER',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '개발 경험은 PM 전환에서 분명한 강점이 될 수 있습니다. 제품이 실제로 어떻게 구현되는지 알고 있고, 개발 난이도나 기술적 제약을 이해하며, 개발팀과 구체적으로 협업해본 경험이 있기 때문입니다.',
        scoreReason: '다만 PM은 직접 만드는 사람이 아니라, 무엇을 왜 만들어야 하는지 정하고 우선순위를 조율하는 역할에 가깝습니다. 그래서 개발 경험만으로는 부족하고, 사용자 문제를 어떻게 이해했는지, 기능 방향에 어떤 의견을 냈는지, 출시 후 어떤 변화나 지표를 봤는지가 함께 드러나야 합니다.',
        criteria: '이력서에는 단순히 "개발을 담당했다"보다, 기능 사양을 논의하며 어떤 기준으로 개선 방향을 제안했는지, 기획·디자인·비즈니스 담당자와 어떤 판단을 주고받았는지, 그 결과 사용자 경험이나 운영 효율이 어떻게 달라졌는지를 보여주는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "기능을 구현하는 것"에서 "무엇을 만들지, 왜 만들어야 하는지 정하는 것"으로 이동합니다.',
        liftOrLimit: '기술 실현 가능성을 판단하거나 기획 초기 단계에서 사양 논의에 참여한 경험이 있다면 PM 전환에서 설득력이 생깁니다. 반대로 구현 업무에만 머물렀다면, 제품 문제정의와 우선순위 판단 경험을 이력서에서 별도로 보강해야 합니다.',
      },
    },
  },
  'engineering:service_planning': {
    archetypeId: 'ENGINEERING_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '개발 경험은 서비스기획 전환에서도 강점이 될 수 있습니다. 서비스가 실제로 어떤 구조로 작동하는지 알고 있고, 기획 요구사항이 개발 과정에서 어떻게 구현되는지 이해하고 있기 때문입니다.',
        scoreReason: '다만 서비스기획은 개발을 잘 아는 것만으로 완성되는 역할은 아닙니다. 사용자가 어떤 흐름으로 서비스를 이용하는지, 화면과 기능이 어떤 순서로 구성되어야 하는지, 정책과 예외 상황을 어떻게 정리할지를 기획 산출물로 풀어낼 수 있어야 합니다.',
        criteria: '이력서에는 개발 업무 자체보다, 기획자와 기능 요구사항을 조율한 경험, 화면 흐름이나 정책 개선에 의견을 낸 경험, 사용성이나 운영 이슈를 기능 개선으로 연결한 경험을 중심으로 정리하는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "정해진 기능을 구현하는 것"에서 "서비스 구조와 사용자 흐름을 설계하는 것"으로 이동합니다.',
        liftOrLimit: '화면 사양, 기능 요구사항, 정책 개선 논의에 참여한 경험이 있다면 서비스기획과의 연결성이 높아집니다. 반대로 구현 업무 중심으로만 설명하면 기획 역할을 직접 수행할 수 있다는 근거가 약하게 보일 수 있습니다.',
      },
    },
  },
  'qa_engineer:product_management': {
    archetypeId: 'QA_ENGINEER_TO_PRODUCT_MANAGER',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'QA 경험은 PM 전환에서 품질 기준과 사용자 시나리오를 깊게 이해했다는 강점으로 연결될 수 있습니다. 기능이 실제 사용자 흐름에서 어디서 깨지는지, 어떤 예외 상황이 생기는지 봐왔다는 점은 제품 판단에 도움이 됩니다.',
        scoreReason: '다만 PM은 문제를 발견하는 데서 끝나는 역할이 아니라, 어떤 문제를 먼저 해결할지 정하고 기능 방향을 조율하는 역할입니다. QA 경험이 PM 경험으로 보이려면 결함 리포팅을 넘어, 문제의 원인과 사용자 영향, 개선 우선순위까지 고민한 흔적이 필요합니다.',
        criteria: '이력서에는 테스트 수행 건수보다, 발견한 품질 이슈를 어떤 제품 개선 제안으로 연결했는지, 기획·개발팀과 어떤 기준으로 기능 사양을 조율했는지, 사용자 시나리오를 바탕으로 어떤 개선 방향을 제안했는지를 보여주는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "문제를 검증하고 발견하는 것"에서 "어떤 문제를 먼저 풀지 판단하는 것"으로 확장됩니다.',
        liftOrLimit: '품질 이슈를 기능 개선이나 사용자 경험 개선으로 연결한 경험이 있다면 PM 전환에 긍정적으로 작용합니다. 반대로 테스트 실행과 결함 리포팅에만 머물렀다면, 문제정의와 우선순위 판단 경험을 보완해야 합니다.',
      },
    },
  },
  'qa_engineer:service_planning': {
    archetypeId: 'QA_ENGINEER_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'QA 경험은 서비스기획 전환에서 사용자 시나리오와 예외 케이스를 잘 이해한다는 강점으로 연결될 수 있습니다. 실제 서비스가 어디서 불편해지는지, 어떤 조건에서 오류나 혼선이 생기는지 봐왔기 때문입니다.',
        scoreReason: '다만 서비스기획은 문제를 검증하는 역할을 넘어, 화면 흐름과 기능 요구사항, 정책과 예외 처리를 직접 설계하는 역할입니다. QA 경험이 서비스기획으로 연결되려면 발견한 문제를 기능 개선안이나 요구사항으로 정리한 경험이 중요합니다.',
        criteria: '이력서에는 테스트 수행 자체보다, 사용자 시나리오를 바탕으로 기능 개선을 제안한 경험, 반복되는 오류를 정책이나 화면 흐름 개선으로 연결한 경험, 기획·개발팀과 요구사항을 조율한 경험을 중심으로 정리하는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "서비스 품질을 검증하는 것"에서 "서비스 구조와 기능 흐름을 설계하는 것"으로 이동합니다.',
        liftOrLimit: '품질 이슈나 예외 케이스를 기능 요구사항으로 정리한 경험이 있다면 서비스기획 전환에 도움이 됩니다. 반대로 테스트 실행 중심으로만 설명하면 기획 산출물을 만들 수 있다는 근거가 부족해 보일 수 있습니다.',
      },
    },
  },
  'brand_marketing:service_planning': {
    archetypeId: 'BRAND_MARKETING_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'customerType',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '브랜드마케팅 경험은 서비스기획 전환에서 사용자가 서비스를 어떻게 인식하고 받아들이는지 이해했다는 강점으로 연결될 수 있습니다. 특히 브랜드 경험, 메시지, 고객 접점을 다뤄본 경험은 사용자 관점의 기획에 도움이 됩니다.',
        scoreReason: '다만 서비스기획은 브랜드 이미지를 만드는 역할이 아니라, 사용자가 실제로 이용하는 화면과 기능, 흐름과 정책을 설계하는 역할입니다. 그래서 캠페인이나 메시지 중심 경험을 서비스 구조 개선이나 기능 요구사항으로 연결해 보여주는 것이 중요합니다.',
        criteria: '이력서에는 브랜드 캠페인을 운영했다는 설명보다, 고객 반응이나 브랜드 인식에서 발견한 문제를 서비스 개선 아이디어로 연결한 경험, 사용자 접점의 불편을 화면이나 기능 개선 방향으로 정리한 경험을 보여주는 것이 좋습니다.',
      },
      customerType: {
        lead: '브랜드 관점에서 쌓은 사용자 이해는 서비스기획에서 사용자 흐름과 접점을 설계할 때 연결될 수 있습니다.',
        liftOrLimit: '사용자 인식이나 고객 반응을 서비스 개선 요구사항으로 바꿔본 경험이 있다면 긍정적입니다. 반대로 브랜드 노출, 메시지, 캠페인 성과 중심으로만 설명하면 서비스기획과의 직접 연결성은 약하게 보일 수 있습니다.',
      },
    },
  },
  'crm_marketing:service_planning': {
    archetypeId: 'CRM_MARKETING_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'customerType',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'CRM마케팅 경험은 서비스기획 전환에서 꽤 좋은 연결점이 될 수 있습니다. 리텐션, 라이프사이클, 고객 행동 데이터를 보며 사용자가 언제 이탈하고 어떤 접점에서 반응하는지 다뤄왔기 때문입니다.',
        scoreReason: '다만 서비스기획은 메시지를 발송하거나 캠페인을 최적화하는 역할이 아니라, 서비스 흐름과 기능 자체를 개선하는 역할입니다. CRM 경험이 서비스기획으로 연결되려면 고객 행동 데이터를 바탕으로 화면, 기능, 정책, 플로우 개선까지 제안한 경험이 중요합니다.',
        criteria: '이력서에는 캠페인 성과나 발송 지표만 쓰기보다, 고객 행동 데이터에서 어떤 불편이나 이탈 지점을 발견했는지, 그것을 서비스 플로우나 기능 개선 아이디어로 어떻게 연결했는지를 보여주는 것이 좋습니다.',
      },
      customerType: {
        lead: 'CRM에서 쌓은 고객 행동 이해는 서비스기획에서 사용자 이탈 지점과 흐름 개선을 설계할 때 직접 연결될 수 있습니다.',
        liftOrLimit: 'CRM 데이터를 서비스 구조 개선 요구사항으로 연결한 경험이 있다면 강점이 됩니다. 반대로 캠페인 실행과 지표 최적화에만 머물렀다면, 서비스 기획 산출물로 확장한 근거를 보완해야 합니다.',
      },
    },
  },
  'brand_marketing:product_management': {
    archetypeId: 'BRAND_MARKETING_TO_PRODUCT_MANAGER',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '브랜드마케팅 경험은 PM 전환에서 사용자가 제품을 어떻게 인식하고 선택하는지 이해했다는 강점으로 연결될 수 있습니다. 제품의 포지셔닝, 메시지, 고객 반응을 다뤄본 경험은 제품 방향을 고민할 때 도움이 됩니다.',
        scoreReason: '다만 PM은 브랜드 이미지를 관리하는 역할이 아니라, 어떤 기능을 왜 만들어야 하는지 정하고 우선순위를 조율하는 역할입니다. 브랜드 경험이 PM 경험으로 보이려면 사용자 인식이나 시장 반응을 제품 문제정의, 기능 개선, 지표 판단으로 연결한 경험이 필요합니다.',
        criteria: '이력서에는 캠페인이나 포지셔닝 성과만 강조하기보다, 고객 반응을 보고 제품 개선 방향을 제안한 경험, 기획·개발팀과 기능 방향을 논의한 경험, 제품 지표나 사용자 행동을 기준으로 판단한 경험을 보여주는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "제품을 어떻게 보이게 할지"에서 "제품이 어떤 문제를 해결해야 하는지"로 이동합니다.',
        liftOrLimit: '브랜드 관점에서 제품 개선 방향을 제안하거나 제품팀과 협업한 경험이 있다면 PM 전환에 도움이 됩니다. 반대로 캠페인 실행과 메시지 관리 중심으로만 설명하면 제품 의사결정 경험은 부족하게 보일 수 있습니다.',
      },
    },
  },
  'crm_marketing:product_management': {
    archetypeId: 'CRM_MARKETING_TO_PRODUCT_MANAGER',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'CRM마케팅 경험은 PM 전환에서 사용자 행동 데이터와 리텐션 지표를 다뤄봤다는 점에서 좋은 연결점이 됩니다. 특히 고객이 언제 이탈하고, 어떤 행동을 반복하며, 어떤 접점에서 반응하는지 본 경험은 제품 개선에도 활용될 수 있습니다.',
        scoreReason: '다만 PM은 캠페인을 최적화하는 역할이 아니라, 사용자 행동 데이터를 제품 문제로 해석하고 기능 우선순위를 정하는 역할입니다. CRM 경험이 PM 경험으로 보이려면 리텐션이나 전환율 개선을 마케팅 액션이 아니라 제품 기능 개선이나 사용자 경험 개선으로 연결한 사례가 필요합니다.',
        criteria: '이력서에는 캠페인 지표 개선만 쓰기보다, 고객 행동 데이터를 보고 어떤 제품 문제를 발견했는지, 기능 개선이나 온보딩 개선, 이탈 방지 플로우 개선으로 어떻게 연결했는지를 보여주는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "고객 커뮤니케이션을 최적화하는 것"에서 "제품 기능과 사용자 경험을 개선하는 것"으로 이동합니다.',
        liftOrLimit: 'CRM 데이터를 제품 개선 제안으로 연결하거나 제품팀과 협업한 경험이 있다면 PM 전환에 설득력이 생깁니다. 반대로 캠페인 실행과 지표 관리 중심으로만 설명하면 제품 의사결정 경험은 별도로 보완해야 합니다.',
      },
    },
  },
  'operations_planning:service_planning': {
    archetypeId: 'OPERATIONS_PLANNING_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '운영기획 경험은 서비스기획 전환에서 꽤 자연스럽게 연결될 수 있습니다. 실제 서비스가 운영되는 과정에서 반복 문제, 사용자 불편, 업무 흐름의 병목을 가까이서 봐왔기 때문입니다.',
        scoreReason: '다만 운영기획은 이미 돌아가는 프로세스를 안정적으로 관리하고 개선하는 역할에 가깝고, 서비스기획은 그 문제를 화면, 기능, 정책, 사용자 흐름으로 다시 설계하는 역할에 가깝습니다. 따라서 운영 개선 경험을 단순 처리나 관리 업무로만 쓰기보다, 어떤 문제를 발견했고 그것을 서비스 구조나 기능 개선으로 어떻게 연결했는지가 드러나야 합니다.',
        criteria: '이력서에는 "운영 프로세스를 관리했다"는 설명보다, 반복되는 사용자 문의나 운영 이슈를 발견해 어떤 개선안을 제안했는지, 서비스 흐름이나 정책을 어떻게 바꾸면 문제가 줄어든다고 판단했는지, 기획·개발·CS·영업 등과 어떤 기준으로 조율했는지를 보여주는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "운영 흐름을 관리하고 개선하는 것"에서 "사용자 흐름과 서비스 구조를 설계하는 것"으로 이동합니다.',
        liftOrLimit: '운영 이슈를 기능 개선, 화면 흐름 개선, 정책 변경 제안으로 연결한 경험이 있다면 서비스기획 전환에 설득력이 생깁니다. 반대로 운영 처리나 일정 관리 중심으로만 설명하면 서비스기획과의 직접 연결성은 약하게 보일 수 있습니다.',
      },
    },
  },
  'sales_b2b:business_planning': {
    archetypeId: 'SALES_B2B_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'B2B영업 경험은 사업기획 전환에서 중요한 현장 기반 강점이 될 수 있습니다. 고객이 실제로 어떤 문제를 갖고 있는지, 어떤 조건에서 구매를 결정하는지, 매출이 어떤 구조로 만들어지는지를 가까이서 봐왔기 때문입니다.',
        scoreReason: '다만 사업기획은 개별 고객을 설득하거나 매출을 만드는 역할에 그치지 않고, 시장 기회, 수익 구조, 사업 우선순위, 확장 가능성을 판단하는 역할에 가깝습니다. 따라서 영업 성과 자체보다 고객 니즈와 매출 데이터를 바탕으로 어떤 사업적 판단을 했는지가 드러나야 합니다.',
        criteria: '이력서에는 "매출을 달성했다"는 설명만 쓰기보다, 고객군별 니즈를 어떻게 파악했는지, 반복되는 제안·수주 패턴에서 어떤 시장 기회를 발견했는지, 가격·계약·도입 장벽·경쟁 상황을 바탕으로 어떤 사업 개선 의견을 냈는지를 보여주는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "고객을 설득하고 매출을 만드는 것"에서 "시장과 고객 데이터를 바탕으로 사업 방향을 판단하는 것"으로 이동합니다.',
        liftOrLimit: '고객 현장에서 얻은 인사이트를 상품 개선, 시장 확장, 제안 전략, 수익 구조 개선으로 연결한 경험이 있다면 사업기획 전환에 도움이 됩니다. 반대로 개인 영업 실적 중심으로만 설명하면 사업기획에서 요구하는 구조적 판단 경험은 부족하게 보일 수 있습니다.',
      },
    },
  },
  'data_analytics:service_planning': {
    archetypeId: 'DATA_ANALYTICS_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "데이터분석 경험은 서비스기획 전환에서 '문제 발견과 개선 근거'를 만드는 강점으로 연결될 수 있습니다.",
        scoreReason:
          '서비스기획은 화면이나 기능을 정리하는 일처럼 보이지만, 실제로는 사용자 행동·운영 지표·전환율·이탈 원인을 보고 어떤 문제를 먼저 풀지 정하는 일이 중요합니다. 데이터분석 경험이 있다면 이 지점에서 강점이 됩니다. 다만 목표 직무에서는 분석 결과를 제시하는 데서 끝나지 않고, 그 결과를 바탕으로 기능 요구사항, 정책, 화면 흐름, 우선순위까지 연결한 경험이 드러나야 더 설득력이 생깁니다.',
        criteria:
          "사용자 행동, 매출, 운영, 전환율 같은 지표를 근거로 문제를 설명할 수 있습니다. 감이나 주장보다 데이터 기반으로 개선 필요성을 제시할 수 있습니다. 서비스기획에서 중요한 '왜 이 기능이 필요한가'를 수치나 패턴으로 뒷받침할 수 있습니다.",
      },
      responsibilityScope: {
        lead: "이력서에서는 '어떤 데이터를 분석했다'보다 '그 분석으로 어떤 서비스 문제를 발견했고, 어떤 개선안이나 기획 판단으로 연결했는지'를 중심으로 써야 합니다. 예를 들어 지표 변화 → 문제 정의 → 개선 방향 제안 → 기능/운영 반영 → 결과 순서로 정리하면 서비스기획 전환 설득력이 높아집니다.",
        liftOrLimit:
          '분석 결과가 실제 기능 개선, 화면 변경, 정책 변경, 프로세스 개선으로 이어졌는지가 약하면 기획 경험으로 보이기 어렵습니다. SQL, 대시보드, 리포트 작성 중심으로만 표현되면 서비스기획보다 분석 직무에 더 가깝게 읽힐 수 있습니다. 사용자 요구사항 정리, 이해관계자 조율, 기획 산출물 작성 경험이 부족하면 실행 기획 역량은 추가 설명이 필요합니다.',
      },
    },
  },
  'business_planning:product_management': {
    archetypeId: 'BUSINESS_PLANNING_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'productOwnership',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "사업기획 경험은 PM 전환에서 '사업성과와 제품 방향을 연결하는 관점'으로 강점이 될 수 있습니다.",
        scoreReason:
          'PM은 제품 기능만 관리하는 역할이 아니라, 제품이 어떤 고객 문제를 해결하고 어떤 사업 성과로 이어져야 하는지 함께 판단하는 역할입니다. 사업기획 경험이 있다면 시장성, 수익성, 전략 방향, 부서 간 조율 관점에서 강점이 있습니다. 다만 PM으로 보이려면 사업계획을 세운 경험만으로는 부족하고, 실제 제품·서비스의 우선순위, 요구사항, 지표, 출시 이후 개선까지 얼마나 관여했는지가 드러나야 합니다.',
        criteria:
          '제품을 단순 기능이 아니라 매출, 고객, 시장, 운영 구조와 연결해 볼 수 있습니다. 사업 목표와 실행 과제를 정리하고 이해관계자를 조율한 경험이 PM 역할과 일부 연결됩니다. 신규 서비스, 제휴, 수익모델, 시장 분석 경험은 제품 방향성을 설명하는 근거가 될 수 있습니다.',
      },
      responsibilityScope: {
        lead: "이력서에서는 '사업 전략을 수립했다'보다 '그 전략이 어떤 제품/서비스 의사결정으로 이어졌는지'를 보여줘야 합니다. 시장·고객 문제 정의 → 제품 방향 제안 → 우선순위 조율 → 실행 부서 협업 → 성과 또는 학습 결과 순서로 정리하면 PM 전환 문맥이 더 분명해집니다.",
        liftOrLimit:
          '사업계획서, 전략안, 보고서 작성 중심으로만 표현되면 실제 제품 실행 경험이 약해 보일 수 있습니다. 기능 우선순위 결정, 사용자 문제 정의, 요구사항 구체화, 출시 후 지표 개선 경험이 드러나야 PM 적합도가 높아집니다. 제품팀, 개발팀, 디자인팀과의 협업 경험이 부족하면 PM의 실행 조율 역량은 추가 확인이 필요합니다.',
      },
    },
  },
  'digital_marketing:service_planning': {
    archetypeId: 'DIGITAL_MARKETING_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "디지털마케팅 경험은 서비스기획 전환에서 '고객 반응을 근거로 서비스 개선점을 찾는 경험'으로 연결될 수 있습니다.",
        scoreReason:
          '디지털마케팅은 광고 집행이나 캠페인 운영처럼 보이지만, 실제로는 고객이 어떤 메시지에 반응하고 어디에서 이탈하며 어떤 흐름에서 전환되는지 관찰하는 일과 맞닿아 있습니다. 이 경험은 서비스기획에서 사용자 문제를 발견하고 개선 방향을 제안하는 근거가 될 수 있습니다. 다만 목표 직무에서는 캠페인 성과를 낸 경험만으로는 부족하고, 그 인사이트가 기능, 화면, 정책, 사용자 흐름 개선으로 어떻게 이어졌는지가 드러나야 합니다.',
        criteria:
          '강점: 퍼널, 전환율, 유입경로, 고객 반응 데이터를 바탕으로 문제를 설명할 수 있습니다. A/B 테스트, 소재 테스트, 랜딩페이지 개선 경험은 서비스 개선 관점으로 연결될 수 있습니다. 고객의 관심사와 이탈 지점을 읽어내는 감각이 서비스기획의 문제 발견 역량과 맞닿아 있습니다. 한계: 광고 성과나 콘텐츠 성과 중심으로만 쓰이면 서비스기획보다 마케팅 실행 경험으로 읽힐 수 있습니다. 요구사항 정의, 화면 흐름, 정책 설계, 이해관계자 조율 경험이 부족하면 기획 실행 역량은 추가 설명이 필요합니다. 이력서에서는 \'광고 효율을 개선했다\'에서 멈추지 말고, 어떤 고객 행동을 발견했고 그 발견이 어떤 서비스 개선 제안이나 사용자 흐름 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '마케팅 성과를 만든 경험은 강점이지만, 서비스기획에서는 그 성과를 만든 원인을 제품/서비스 구조의 문제로 해석하고 개선안으로 연결하는 책임이 더 중요합니다.',
      },
    },
  },
  'digital_marketing:product_management': {
    archetypeId: 'DIGITAL_MARKETING_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'productOwnership',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "디지털마케팅 경험은 PM 전환에서 '고객 반응과 성장 지표를 제품 의사결정에 연결하는 강점'으로 활용될 수 있습니다.",
        scoreReason:
          'PM은 제품 기능을 만드는 역할에 그치지 않고, 어떤 고객 문제를 풀어야 성장 지표와 사업 성과가 좋아지는지 판단해야 합니다. 디지털마케팅 경험은 유입, 전환, 이탈, 재방문 같은 지표를 통해 고객 반응을 읽어낸다는 점에서 PM과 연결될 수 있습니다. 다만 PM으로 보이려면 캠페인 운영자가 아니라 제품 문제를 정의하고 우선순위를 제안한 사람으로 읽혀야 합니다.',
        criteria:
          '강점: 퍼널 지표, 전환율, 고객 세그먼트, 메시지 반응을 바탕으로 제품 개선 기회를 찾을 수 있습니다. 실험과 성과 측정 경험은 PM의 가설 검증 방식과 연결됩니다. 성장 관점에서 제품을 바라볼 수 있다는 점은 초기 서비스나 그로스 조직에서 강점이 될 수 있습니다. 한계: 광고 집행, 매체 운영, 콘텐츠 성과 중심으로만 표현되면 PM 직무와의 직접성이 약해집니다. 기능 우선순위, 요구사항 구체화, 개발/디자인 협업, 출시 후 제품 지표 개선 경험이 드러나야 PM 전환 설득력이 높아집니다. 이력서에서는 \'마케팅 성과\'보다 \'고객 행동에서 어떤 제품 문제를 발견했고, 어떤 개선 방향을 제안했는지\'를 중심으로 재구성해야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'PM 전환에서는 마케팅 지표를 잘 본다는 점보다, 그 지표를 제품 문제 정의와 우선순위 판단으로 연결한 경험이 더 중요하게 평가됩니다.',
      },
    },
  },
  'performance_marketing:product_management': {
    archetypeId: 'PERFORMANCE_MARKETING_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'dataExperimentation',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '퍼포먼스마케팅 경험은 PM 전환에서 데이터 기반 실험과 제품 성장 지표를 이해한 경험으로 연결될 수 있습니다.',
        scoreReason:
          'PM은 제품의 성장과 사용성을 판단하기 위해 유입, 전환, 이탈, 재방문, 구매 같은 지표를 해석하고 우선순위를 정해야 합니다. 퍼포먼스마케팅 경험은 전환율, CAC, ROAS, 랜딩 페이지, 캠페인 실험, 고객 행동 데이터를 다뤄본 경험이라는 점에서 PM과 연결될 수 있습니다. 다만 광고 매체 운영이나 소재 효율 개선 중심으로만 보이면 제품 문제를 정의하고 기능 개선 방향을 정하는 PM 역할과는 차이가 있어 보일 수 있습니다.',
        criteria:
          '강점: 퍼널 분석, 전환율 개선, 실험 설계, 고객 획득 비용 분석, 랜딩/가입/구매 흐름 개선, 고객 행동 데이터 해석 경험은 PM과 연결됩니다. 한계: 광고 세팅, 예산 운영, 소재 테스트 중심이면 제품 의사결정 경험으로 보기 어렵습니다. 이력서에서는 퍼포먼스마케팅 경험이 어떤 제품 지표 개선, 사용자 흐름 개선, 기능 개선 제안, 고객 문제 발견으로 이어졌는지를 보여줘야 합니다.',
      },
      dataExperimentation: {
        liftOrLimit:
          '퍼포먼스마케팅 경험은 PM 전환에서 데이터와 실험 감각으로 연결될 수 있지만, 광고 운영 성과를 넘어 제품 성장 문제를 다룬 경험으로 재구성해야 설득력이 높아집니다.',
      },
    },
  },
  'content_marketing:service_planning': {
    archetypeId: 'CONTENT_MARKETING_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "콘텐츠마케팅 경험은 서비스기획 전환에서 '사용자 언어와 니즈를 읽어내는 강점'으로 연결될 수 있습니다.",
        scoreReason:
          '콘텐츠마케팅은 단순히 글이나 이미지를 만드는 일이 아니라, 고객이 어떤 문제에 반응하고 어떤 표현을 신뢰하며 어떤 정보가 있어야 행동하는지 파악하는 일입니다. 이 경험은 서비스기획에서 사용자 요구를 정리하고 서비스 흐름을 더 이해하기 쉽게 만드는 데 강점이 될 수 있습니다. 다만 서비스기획으로 보이려면 콘텐츠 제작 경험을 넘어, 사용자 문제 정의와 서비스 구조 개선으로 연결된 사례가 필요합니다.',
        criteria:
          '강점: 고객의 관심사, 불안, 구매 이유, 정보 탐색 흐름을 이해하는 데 강점이 있습니다. 콘텐츠 반응 데이터를 통해 어떤 메시지와 정보 구조가 효과적인지 설명할 수 있습니다. 사용자 관점에서 서비스 안내, 온보딩, FAQ, 랜딩 흐름을 개선한 경험은 서비스기획과 연결될 수 있습니다. 한계: 콘텐츠 제작량, 조회수, 팔로워, 캠페인 성과만 강조하면 서비스기획 직접성은 약해질 수 있습니다. 기능 요구사항, 화면 흐름, 정책, 운영 프로세스 개선 경험이 부족하면 기획자로서의 실행 범위는 추가 설명이 필요합니다. 이력서에서는 \'콘텐츠를 만들었다\'보다 \'사용자 반응을 바탕으로 정보 구조나 서비스 흐름을 어떻게 개선했는지\'를 중심으로 써야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '콘텐츠마케팅의 강점은 사용자 언어를 잘 안다는 점이지만, 서비스기획에서는 그 이해를 실제 화면, 정책, 프로세스 개선으로 옮긴 경험이 함께 보여야 합니다.',
      },
    },
  },
  'content_marketing:product_management': {
    archetypeId: 'CONTENT_MARKETING_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'productOwnership',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "콘텐츠마케팅 경험은 PM 전환에서 '고객 문제와 메시지 반응을 제품 방향으로 해석하는 강점'이 될 수 있습니다.",
        scoreReason:
          'PM은 고객이 왜 제품을 쓰고, 어디서 망설이며, 어떤 가치에 반응하는지 이해해야 합니다. 콘텐츠마케팅 경험은 고객 언어, 반응 포인트, 설득 구조를 가까이서 다룬다는 점에서 PM과 일부 연결됩니다. 다만 PM으로 보이려면 콘텐츠 성과를 제품 가설, 기능 개선, 온보딩, 전환 흐름 개선으로 연결한 경험이 필요합니다.',
        criteria:
          '강점: 고객이 실제로 쓰는 표현과 관심사를 바탕으로 문제를 정의할 수 있습니다. 콘텐츠 반응과 전환 데이터를 통해 제품 메시지나 사용 흐름의 약점을 찾을 수 있습니다. 초기 서비스, 커머스, 교육, SaaS처럼 설명과 설득이 중요한 제품에서는 강점으로 작용할 수 있습니다. 한계: 콘텐츠 기획과 제작 중심으로만 보이면 PM의 제품 책임과는 거리가 있어 보일 수 있습니다. 제품 로드맵, 요구사항, 개발/디자인 협업, 지표 개선 경험이 부족하면 PM 적합도는 제한적으로 평가될 수 있습니다. 이력서에서는 콘텐츠 성과보다 \'고객 반응을 통해 어떤 제품/서비스 개선 가설을 세웠고, 어떤 실행으로 이어졌는지\'를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '콘텐츠 경험은 고객 이해의 출발점이 될 수 있지만, PM 전환에서는 그 이해를 제품 의사결정과 실행 우선순위로 옮긴 흔적이 필요합니다.',
      },
    },
  },
  'it_planning:service_planning': {
    archetypeId: 'IT_PLANNING_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'responsibilityScope',
    confidence: 'high',
    overlays: {
      jobStructure: {
        lead: 'IT기획 경험은 서비스기획 전환에서 가장 자연스러운 경로 중 하나입니다. 시스템 요구사항을 정리하고 개발팀과 협업하며 기능과 정책을 설계한 경험이 직접 연결되기 때문입니다.',
        scoreReason:
          'IT기획은 기술 구조와 사용자 요구를 동시에 다룬다는 점에서 서비스기획과 역할 범위가 크게 겹칩니다. 다만 IT기획이 내부 시스템이나 인프라 중심이었다면, 서비스기획에서는 외부 사용자의 경험과 제품 흐름 전체를 설계하는 책임이 더 넓어집니다. 사용자 관점의 요구사항 정의와 기능 우선순위 판단 경험이 드러나야 합니다.',
        criteria:
          '이력서에서는 시스템 요구사항이나 기능 명세를 누구의 문제를 해결하기 위해 어떻게 정의했는지를 보여주는 것이 좋습니다. 개발팀과의 협업 방식, 기능 우선순위 판단 근거, 출시 후 개선 경험이 있다면 서비스기획 전환에 직접적인 근거가 됩니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "IT 시스템과 기능을 기획하는 것"에서 "사용자 경험과 서비스 흐름 전체를 설계하는 것"으로 확장됩니다.',
        liftOrLimit:
          '사용자 시나리오, 화면 흐름, 정책 설계 경험이 있다면 서비스기획 전환 설득력이 높습니다. 내부 시스템 설계나 요구사항 정리 중심으로만 설명하면 외부 사용자 대상 서비스 경험은 추가로 보완해야 할 수 있습니다.',
      },
    },
  },
  'it_planning:product_management': {
    archetypeId: 'IT_PLANNING_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'productOwnership',
    confidence: 'high',
    overlays: {
      jobStructure: {
        lead: 'IT기획 경험은 PM 전환에서 기술 이해와 기획 역량을 동시에 갖춘 강점으로 읽힙니다. 개발 프로세스, 시스템 구조, 요구사항 정의를 모두 다뤄봤기 때문입니다.',
        scoreReason:
          'PM은 기술팀과 사업팀 사이에서 제품 방향을 조율하는 역할인데, IT기획 경험이 있다면 개발팀과의 소통 방식과 기술적 제약 이해에서 강점이 생깁니다. 다만 PM으로 보이려면 기술 요구사항 정리에 그치지 않고, 고객 문제 정의·제품 지표·우선순위 판단까지 얼마나 관여했는지가 드러나야 합니다.',
        criteria:
          '기능 기획과 개발팀 협업 경험은 PM 역할과 직접 연결됩니다. 이력서에서는 어떤 고객 문제를 풀기 위해 어떤 기능을 제안했는지, 우선순위를 어떻게 판단했는지, 출시 후 어떤 지표를 봤는지를 보여주면 PM 전환 설득력이 높아집니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "IT 기능과 시스템 요구사항을 기획하는 것"에서 "고객 문제와 사업 성과를 연결하는 제품 의사결정을 주도하는 것"으로 이동합니다.',
        liftOrLimit:
          '고객 문제 정의, 제품 지표, 출시 후 개선 경험이 있다면 PM 전환에 강점이 됩니다. 내부 IT 운영이나 개발 지원 중심으로만 보이면 PM의 제품 책임 범위와는 일부 거리가 있을 수 있습니다.',
      },
    },
  },
  'operations_planning:business_planning': {
    archetypeId: 'OPERATIONS_PLANNING_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '운영기획 경험은 사업기획 전환에서 실행 현장의 구체적인 데이터와 문제 인식을 기반으로 한 강점이 될 수 있습니다.',
        scoreReason:
          '운영기획은 현재 서비스가 어떻게 돌아가는지 가장 가까이서 보는 역할입니다. 사업기획은 그 운영 경험을 넘어서 시장 기회, 수익 구조, 사업 방향을 판단하는 역할로 확장됩니다. 따라서 운영에서 발견한 문제나 기회를 사업 관점으로 어떻게 연결했는지가 드러나야 합니다.',
        criteria:
          '이력서에서는 "운영 효율을 개선했다"는 설명에 그치지 말고, 운영 현장에서 발견한 문제가 어떤 사업 기회나 구조적 개선으로 이어졌는지, 비용·수익·성장 관점에서 어떤 판단을 했는지를 보여주는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "운영 프로세스를 안정적으로 관리하는 것"에서 "사업 방향과 수익 구조를 판단하는 것"으로 이동합니다.',
        liftOrLimit:
          '운영 데이터를 사업 판단 근거로 활용하거나 수익·비용 구조 분석에 관여한 경험이 있다면 사업기획 전환에 설득력이 생깁니다. 운영 처리나 일정 관리 중심으로만 설명하면 사업기획과의 연결성은 보완이 필요합니다.',
      },
    },
  },
  'operations_planning:product_management': {
    archetypeId: 'OPERATIONS_PLANNING_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'productOwnership',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '운영기획 경험은 PM 전환에서 "실제 서비스가 어떻게 운영되는지 아는 사람"이라는 강점이 될 수 있습니다.',
        scoreReason:
          'PM은 제품을 만드는 것뿐 아니라 출시 후 어떻게 운영되고 개선되는지까지 책임지는 역할입니다. 운영기획 경험이 있다면 서비스 운영 현실, 반복 문제, 사용자 불편을 이미 잘 알고 있다는 점에서 PM 역할과 연결됩니다. 다만 PM으로 보이려면 운영 문제를 처리하는 역할을 넘어, 그 문제를 기능·정책·구조 개선으로 연결한 경험이 드러나야 합니다.',
        criteria:
          '이력서에서는 운영 중 발견한 반복 문제나 사용자 불편을 어떻게 기능 개선 제안이나 프로세스 변경으로 연결했는지를 보여주면 PM 전환에 강한 근거가 됩니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "운영 프로세스를 관리하고 개선하는 것"에서 "제품 기능과 사용자 경험을 의사결정하는 것"으로 이동합니다.',
        liftOrLimit:
          '운영 이슈를 제품 기능 개선, 화면 변경, 정책 조정으로 연결한 경험이 있다면 PM 전환 설득력이 높아집니다. 운영 처리 중심으로만 설명하면 제품 의사결정 경험이 약하게 보일 수 있습니다.',
      },
    },
  },
  'account_management:business_planning': {
    archetypeId: 'ACCOUNT_MANAGEMENT_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '영업관리(Account Management) 경험은 사업기획 전환에서 고객과 시장을 직접 다룬 현장 강점으로 연결될 수 있습니다.',
        scoreReason:
          '사업기획은 고객 데이터, 시장 구조, 수익 패턴을 바탕으로 사업 방향을 판단하는 역할입니다. 핵심 고객을 관리하고 관계를 유지해온 경험은 시장과 고객에 대한 깊은 이해로 이어질 수 있습니다. 다만 개별 고객 관리에서 그치지 않고, 고객 데이터나 시장 패턴을 사업 판단 근거로 어떻게 활용했는지가 드러나야 합니다.',
        criteria:
          '이력서에서는 주요 고객 관리 성과만 쓰기보다, 고객군의 특성이나 니즈 패턴에서 어떤 사업 기회를 발견했는지, 매출·계약 구조·고객 유지율 데이터를 바탕으로 어떤 사업 개선 의견을 냈는지를 보여주는 것이 좋습니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "고객과의 관계를 관리하고 계정을 유지하는 것"에서 "시장과 고객 데이터를 바탕으로 사업 방향을 판단하는 것"으로 이동합니다.',
        liftOrLimit:
          '고객 현장에서 얻은 인사이트를 상품 개선, 시장 전략, 수익 구조 개선으로 연결한 경험이 있다면 사업기획 전환에 설득력이 높아집니다. 고객 관계 유지나 계정 관리 중심으로만 설명하면 사업기획의 구조적 판단 경험은 보완이 필요합니다.',
      },
    },
  },
  'account_management:product_management': {
    archetypeId: 'ACCOUNT_MANAGEMENT_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'productOwnership',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '영업관리 경험은 PM 전환에서 "고객이 실제로 어떤 문제를 겪는지 아는 사람"이라는 강점으로 읽힐 수 있습니다.',
        scoreReason:
          'PM은 고객 문제를 제품으로 해결하는 역할입니다. 주요 고객과 직접 소통하고 요구사항을 조율해온 경험은 PM의 고객 이해 역량과 직접 연결됩니다. 다만 고객 관리자가 아닌 제품 의사결정자로 보이려면, 고객 피드백을 기능 개선 제안이나 제품 방향 조정으로 연결한 경험이 드러나야 합니다.',
        criteria:
          '이력서에서는 고객 요청을 처리한 경험보다, 반복되는 고객 문제를 제품 문제로 정의하고 개선 방향을 제안한 경험을 중심으로 써야 합니다. 제품팀 또는 개발팀과 함께 기능을 개선한 경험이 있다면 PM 전환에 강한 근거가 됩니다.',
      },
      responsibilityScope: {
        lead: '역할의 중심이 "고객 관계를 유지하고 계정을 성장시키는 것"에서 "고객 문제를 제품으로 해결하는 의사결정을 주도하는 것"으로 이동합니다.',
        liftOrLimit:
          '고객 피드백을 기능 개선, 요구사항 정의, 제품 방향 조정으로 연결한 경험이 있다면 PM 전환 설득력이 높아집니다. 고객 관계 관리나 계약 갱신 중심으로만 표현하면 제품 의사결정 경험은 추가 설명이 필요합니다.',
      },
    },
  },
  'sales_b2b:product_management': {
    archetypeId: 'SALES_B2B_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'B2B영업 경험은 PM 전환에서 \'고객사의 실제 요구와 구매 판단을 가까이서 본 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          'B2B영업은 고객사가 어떤 문제를 갖고 있고, 어떤 조건에서 제품이나 서비스를 선택하는지 직접 접하는 역할입니다. 이 경험은 PM이 고객 문제와 시장 요구를 이해하는 데 강점이 될 수 있습니다. 다만 PM으로 보이려면 영업 성과나 제안 경험을 넘어, 고객 요구를 제품 개선 방향이나 우선순위로 구조화한 경험이 드러나야 합니다.',
        criteria:
          '강점: 고객사의 니즈, 예산, 의사결정 구조, 도입 장벽을 가까이서 이해한 경험은 B2B 제품 PM과 연결됩니다. 한계: 매출 성과나 관계 관리 중심으로만 보이면 제품 책임 경험은 약해 보일 수 있습니다. 이력서에서는 고객 요구를 어떤 제품 개선안, 기능 제안, 정책 변경, 우선순위 판단으로 연결했는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'B2B영업 경험은 고객 이해에는 강점이 있지만, PM 전환에서는 고객 요청을 제품 의사결정으로 바꿔본 경험이 핵심입니다.',
      },
    },
  },
  'sales_b2b:service_planning': {
    archetypeId: 'SALES_B2B_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'B2B영업 경험은 서비스기획 전환에서 \'고객 요구를 서비스 개선 과제로 발견한 경험\'으로 활용될 수 있습니다.',
        scoreReason:
          'B2B영업은 고객사가 실제로 어떤 불편을 겪고 어떤 조건에서 서비스를 선택하는지 가까이서 듣는 역할입니다. 이 경험은 서비스기획에서 고객 요구를 정리하고 서비스 흐름이나 정책 개선으로 연결하는 데 강점이 될 수 있습니다. 다만 서비스기획으로 보이려면 제안이나 계약 경험에 그치지 않고, 요구사항 정리와 서비스 개선안 도출 경험이 함께 드러나야 합니다.',
        criteria:
          '강점: 고객사의 반복 요구, 도입 장벽, 사용 과정의 불편을 직접 들었다는 점은 서비스기획과 연결됩니다. 한계: 영업 제안서나 관계 관리 중심으로만 표현되면 기획 직접성은 약해집니다. 이력서에서는 고객 요구를 어떤 기능, 정책, 프로세스 개선안으로 바꿨는지를 중심으로 써야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'B2B영업의 고객 접점 경험은 강점이지만, 서비스기획 전환에서는 그 요구를 기획 산출물과 개선 흐름으로 바꾼 흔적이 필요합니다.',
      },
    },
  },
  'sales_admin:product_management': {
    archetypeId: 'SALES_ADMIN_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '영업관리 경험은 PM 전환에서 \'매출 흐름과 고객 대응 문제를 제품 개선 과제로 본 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          '영업관리는 매출 데이터, 고객 요청, 영업 프로세스, 내부 운영 병목을 함께 다루는 경우가 많습니다. 이 경험은 PM이 제품의 사업 성과와 고객 문제를 함께 보는 데 일부 연결됩니다. 다만 PM으로 보이려면 영업 지원이나 실적 관리에 그치지 않고, 반복되는 고객/영업 문제를 제품 기능이나 프로세스 개선으로 연결한 경험이 필요합니다.',
        criteria:
          '강점: 매출 흐름, 고객 요청, 영업 프로세스의 병목을 이해한 경험은 제품 개선 근거가 될 수 있습니다. 한계: 실적 집계, 보고, 영업 지원 중심으로만 보이면 PM 직무와의 직접성은 약합니다. 이력서에서는 반복 문제를 어떤 제품 개선안이나 우선순위로 정리했는지 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '영업관리 경험은 사업 현장을 이해한다는 강점이 있지만, PM 전환에서는 제품 의사결정으로 연결한 경험이 더 중요합니다.',
      },
    },
  },
  'sales_admin:service_planning': {
    archetypeId: 'SALES_ADMIN_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '영업관리 경험은 서비스기획 전환에서 \'고객·영업 프로세스의 반복 문제를 개선 과제로 본 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          '서비스기획은 고객이 겪는 불편뿐 아니라 내부 운영과 영업 프로세스에서 반복되는 문제도 개선 대상으로 봅니다. 영업관리 경험은 고객 요청, 영업 지원, 계약·견적·주문 흐름의 병목을 이해했다는 점에서 서비스기획과 연결될 수 있습니다. 다만 서비스기획으로 보이려면 관리·지원 업무를 넘어 서비스 흐름이나 정책 개선으로 연결한 사례가 필요합니다.',
        criteria:
          '강점: 영업 프로세스, 고객 요청, 내부 처리 흐름을 이해한 경험은 서비스 개선 과제 발굴에 도움이 됩니다. 한계: 단순 실적 관리나 지원 업무 중심으로 보이면 기획 역량은 약해 보일 수 있습니다. 이력서에서는 반복 문제를 어떤 서비스 흐름 개선, 정책 정리, 기능 요청으로 바꿨는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '영업관리 경험은 현장 문제를 안다는 강점이 있지만, 서비스기획 전환에서는 그 문제를 구조화된 개선안으로 만든 경험이 필요합니다.',
      },
    },
  },
  'crm_marketing:business_planning': {
    archetypeId: 'CRM_MARKETING_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'CRM마케팅 경험은 사업기획 전환에서 \'고객 유지와 매출 구조를 데이터로 본 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          '사업기획은 신규 성장뿐 아니라 기존 고객 유지, 재구매, LTV, 이탈 관리 같은 수익 구조를 이해해야 합니다. CRM마케팅 경험은 고객 세그먼트와 반응 데이터를 바탕으로 매출 개선 기회를 찾는다는 점에서 사업기획과 연결됩니다. 다만 사업기획으로 보이려면 캠페인 운영을 넘어 고객 전략, 수익성, 성장 과제로 해석한 경험이 필요합니다.',
        criteria:
          '강점: 고객 세그먼트, 재구매, 이탈, LTV, 캠페인 반응을 이해한 경험은 사업기획과 연결됩니다. 한계: 메시지 발송이나 캠페인 운영 중심으로만 보이면 전략 기획 범위는 제한적으로 보일 수 있습니다. 이력서에서는 CRM 성과를 어떤 고객 전략이나 매출 구조 개선으로 연결했는지 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'CRM마케팅 경험은 고객 유지와 매출 데이터를 이해한다는 강점이 있지만, 사업기획 전환에서는 이를 사업 전략과 성장 과제로 확장해 보여줘야 합니다.',
      },
    },
  },
  'brand_marketing:business_planning': {
    archetypeId: 'BRAND_MARKETING_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '브랜드마케팅 경험은 사업기획 전환에서 \'시장 포지션과 고객 인식을 사업 기회로 해석한 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          '사업기획은 숫자만 보는 역할이 아니라 시장에서 우리 제품이나 서비스가 어떤 위치를 차지하고 어떤 고객군을 공략해야 하는지 판단해야 합니다. 브랜드마케팅 경험은 고객 인식, 시장 포지션, 메시지 전략을 다뤘다는 점에서 사업기획과 연결될 수 있습니다. 다만 사업기획으로 보이려면 캠페인이나 브랜딩 활동을 넘어 매출, 고객군, 시장 확장, 수익성 관점으로 해석한 경험이 필요합니다.',
        criteria:
          '강점: 시장 포지션, 고객 인식, 브랜드 차별화, 메시지 전략을 다룬 경험은 사업 방향 설정과 연결됩니다. 한계: 캠페인 실행이나 브랜드 이미지 관리 중심으로만 보이면 사업기획 직접성은 약해 보일 수 있습니다. 이력서에서는 브랜드 활동이 어떤 고객군 확장, 매출 기회, 시장 전략으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '브랜드마케팅 경험은 시장과 고객 인식을 읽는 강점이 있지만, 사업기획 전환에서는 이를 숫자와 성장 전략으로 연결한 경험이 필요합니다.',
      },
    },
  },
  'digital_marketing:business_planning': {
    archetypeId: 'DIGITAL_MARKETING_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '디지털마케팅 경험은 사업기획 전환에서 \'성장 지표와 고객 획득 구조를 본 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          '사업기획은 매출 성장과 고객 획득 구조를 이해해야 합니다. 디지털마케팅 경험은 유입, 전환율, CAC, ROAS, 채널 효율, 퍼널 개선을 다룬다는 점에서 사업기획과 연결됩니다. 다만 사업기획으로 보이려면 광고 효율 개선을 넘어 사업 성장 과제, 수익성, 고객 획득 전략으로 해석한 경험이 필요합니다.',
        criteria:
          '강점: 유입, 전환율, 고객 획득 비용, 채널별 성과를 이해한 경험은 사업 성장 판단에 도움이 됩니다. 한계: 매체 운영이나 광고 성과 중심으로만 보이면 사업기획보다 마케팅 실행 경험으로 읽힐 수 있습니다. 이력서에서는 마케팅 성과를 어떤 성장 전략, 수익 구조, 고객 획득 과제로 연결했는지 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '디지털마케팅 경험은 성장 지표를 다뤘다는 강점이 있지만, 사업기획 전환에서는 이를 사업 모델과 수익성 판단으로 확장해 보여줘야 합니다.',
      },
    },
  },
  'content_marketing:business_planning': {
    archetypeId: 'CONTENT_MARKETING_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '콘텐츠마케팅 경험은 사업기획 전환에서 \'고객 니즈와 시장 반응을 읽은 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          '사업기획은 어떤 고객군이 어떤 문제에 반응하고, 어떤 메시지와 가치 제안이 시장에서 통하는지 판단해야 합니다. 콘텐츠마케팅 경험은 고객 관심사, 정보 탐색 흐름, 반응 데이터를 다뤘다는 점에서 사업기획과 연결됩니다. 다만 사업기획으로 보이려면 콘텐츠 성과를 넘어 고객군, 시장 기회, 상품 전략, 매출 가능성으로 해석한 경험이 필요합니다.',
        criteria:
          '강점: 고객 관심사, 반응 포인트, 정보 탐색 흐름을 이해한 경험은 시장 기회 판단과 연결됩니다. 한계: 콘텐츠 제작량이나 조회수 중심으로만 보이면 사업기획 직접성은 약합니다. 이력서에서는 콘텐츠 반응을 어떤 고객군 정의, 시장 기회, 상품/서비스 전략으로 연결했는지 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '콘텐츠마케팅 경험은 고객 니즈를 읽는 강점이 있지만, 사업기획 전환에서는 이를 시장과 매출 기회로 해석한 경험이 필요합니다.',
      },
    },
  },
  'data_analytics:product_management': {
    archetypeId: 'DATA_ANALYTICS_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '데이터분석 경험은 PM 전환에서 \'제품 문제를 지표로 발견하고 검증하는 강점\'으로 연결될 수 있습니다.',
        scoreReason:
          'PM은 고객 문제를 정의하고, 제품 개선이 실제 지표 변화로 이어졌는지 확인해야 합니다. 데이터분석 경험은 사용자 행동, 전환율, 이탈, 매출, 운영 지표를 근거로 문제를 발견한다는 점에서 PM과 연결됩니다. 다만 PM으로 보이려면 분석 결과를 전달하는 데 그치지 않고, 제품 개선안과 우선순위 판단으로 연결한 경험이 필요합니다.',
        criteria:
          '강점: 사용자 행동 데이터, 전환율, 이탈률, 매출 지표를 바탕으로 제품 문제를 설명할 수 있습니다. 한계: 리포트 작성이나 대시보드 운영 중심으로만 보이면 PM의 제품 책임과는 거리가 있어 보일 수 있습니다. 이력서에서는 어떤 지표 문제를 발견했고, 어떤 기능 개선이나 제품 의사결정으로 이어졌는지 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '데이터분석 경험은 문제를 지표로 발견하는 데 강점이 있지만, PM 전환에서는 분석 결과를 제품 우선순위와 실행으로 연결한 경험이 필요합니다.',
      },
    },
  },
  'data_analytics:business_planning': {
    archetypeId: 'DATA_ANALYTICS_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '데이터분석 경험은 사업기획 전환에서 \'사업 문제를 숫자로 구조화한 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          '사업기획은 시장, 매출, 비용, 고객, 운영 데이터를 바탕으로 어디에 성장 기회와 비효율이 있는지 판단해야 합니다. 데이터분석 경험은 숫자로 문제를 발견하고 의사결정 근거를 만든다는 점에서 사업기획과 연결됩니다. 다만 사업기획으로 보이려면 분석 결과를 보고하는 데 그치지 않고, 사업 과제와 실행 방향으로 연결한 경험이 필요합니다.',
        criteria:
          '강점: 매출, 고객, 운영, 퍼널, 비용 데이터를 바탕으로 사업 문제를 설명할 수 있습니다. 한계: 분석 요청 대응이나 리포트 작성 중심으로만 보이면 전략 기획 범위는 제한적으로 보일 수 있습니다. 이력서에서는 어떤 사업 문제를 발견했고, 어떤 전략/운영/수익 개선 과제로 연결했는지 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '데이터분석 경험은 숫자로 문제를 구조화하는 강점이 있지만, 사업기획 전환에서는 이를 실행 가능한 사업 판단으로 바꾼 경험이 필요합니다.',
      },
    },
  },
  'commerce_operations:service_planning': {
    archetypeId: 'COMMERCE_OPERATIONS_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '커머스운영 경험은 서비스기획 전환에서 \'구매 흐름과 운영 병목을 이해한 경험\'으로 연결될 수 있습니다.',
        scoreReason:
          '서비스기획은 사용자 흐름을 설계하고 요구사항을 구조화하며 개발·디자인팀과 협업해 서비스를 개선합니다. 커머스운영 경험은 실제 구매 흐름에서 어떤 이슈가 발생하는지 잘 아는 강점이 있지만, 기획자는 그 문제를 화면·기능·정책으로 구조화하는 역할까지 해야 합니다.',
        criteria:
          '강점: 상품 등록, 주문·배송, CS, 프로모션 등 운영 흐름 전반을 이해하고 있어 서비스의 실제 작동 맥락을 잘 압니다. 한계: 운영 실행 중심의 경험이 기획 산출물(PRD, 요구사항 명세, 사용자 흐름 설계)로 연결된 이력이 명확히 보여야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '커머스운영 경험은 현장 이해에는 강점이 있지만, 서비스기획 전환에서는 그 문제를 구조화해 서비스 개선안으로 만든 경험이 필요합니다.',
      },
    },
  },
  'commerce_operations:product_management': {
    archetypeId: 'COMMERCE_OPERATIONS_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '커머스운영 경험은 PM 전환에서 \'구매 경험과 운영 맥락을 이해한 도메인 배경\'으로 연결될 수 있습니다.',
        scoreReason:
          'PM은 제품이 풀어야 할 문제를 정의하고 우선순위를 판단하며 출시 후 성과까지 확인합니다. 커머스운영 경험은 실제 구매 흐름에서 어떤 마찰이 있는지 잘 아는 도메인 강점이 있지만, PM으로 보이려면 운영 이슈를 제품 개선 과제로 전환한 경험이 필요합니다.',
        criteria:
          '강점: 커머스 도메인 이해와 실제 운영 흐름 파악이 뛰어납니다. 한계: "운영 중 발견한 문제를 어떻게 제품 개선으로 정의했고, 개발팀과 어떻게 협업해 출시했으며, 성과를 어떻게 확인했는지"가 이력서에 담겨야 PM 역할로 읽힙니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '커머스운영 경험은 문제 탐지력은 좋지만, PM 전환에서는 문제를 제품 관점으로 정의하고 우선순위를 판단한 경험이 더 중요합니다.',
      },
    },
  },
  'md:business_planning': {
    archetypeId: 'MD_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'MD/머천다이징 경험은 사업기획 전환에서 \'상품 구성과 판매 성과를 연결한 상업적 판단력\'으로 연결될 수 있습니다.',
        scoreReason:
          '사업기획은 수익모델, 시장 전략, 사업 성과 판단이 핵심입니다. MD 경험은 카테고리 단위의 성과와 파트너 관계를 관리한 강점이 있지만, 사업기획으로 보이려면 상품 성과를 사업 전략과 수익 관점으로 연결한 경험이 추가로 확인되어야 합니다.',
        criteria:
          '강점: 카테고리 성과 추적, 파트너 협의, 프로모션 기획 경험은 사업기획의 실행 감각과 연결됩니다. 한계: 카테고리 범위를 넘어 시장 분석, 수익모델 설계, 사업 방향 설정 경험이 이력서에 포함되어야 사업기획 역할로 읽힙니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'MD 경험은 상업적 판단력의 강점이 있지만, 사업기획 전환에서는 카테고리 범위를 넘어 사업 전체의 방향과 수익을 기획한 경험이 필요합니다.',
      },
    },
  },
  'md:product_management': {
    archetypeId: 'MD_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'MD/머천다이징 경험은 PM 전환에서 \'상품과 고객 반응을 이해한 도메인 배경\'으로 연결될 수 있습니다.',
        scoreReason:
          'PM은 제품이 풀어야 할 문제를 정의하고 우선순위를 판단하며 개발·디자인팀과 협업해 출시하고 성과를 확인합니다. MD 경험은 상품 구성과 고객 반응을 이해하는 강점이 있지만, PM으로 보이려면 상품 전략을 제품 기능 개선 과제로 전환한 경험이 필요합니다.',
        criteria:
          '강점: 상품·카테고리 도메인 이해와 고객 구매 데이터 해석 경험이 PM의 사용자 관점과 연결됩니다. 한계: "어떤 문제를 발견해 제품 개선 과제로 정의했고, 개발팀과 어떻게 협업해 출시했으며, 성과를 어떻게 확인했는지"가 이력서에 담겨야 PM 역할로 읽힙니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'MD 경험은 상품 전략과 고객 반응 이해의 강점이 있지만, PM 전환에서는 제품 개선 정의와 개발 협업 경험이 더 중요합니다.',
      },
    },
  },

  'cx_planning:service_planning': {
    archetypeId: 'CX_PLANNING_TO_SERVICE_PLANNING',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'responsibilityScope',
    confidence: 'high',
    overlays: {
      jobStructure: {
        lead: 'CX기획 경험은 서비스기획 전환에서 고객 경험과 서비스 흐름을 개선해본 경험으로 비교적 자연스럽게 연결됩니다.',
        scoreReason:
          'CX기획은 고객 여정, 접점별 불편, VOC, 안내 체계, 운영 프로세스를 분석하고 개선하는 역할입니다. 이 경험은 서비스기획에서 사용자 문제를 정의하고 서비스 흐름, 정책, 화면, 커뮤니케이션을 개선하는 일과 많이 겹칩니다. 다만 목표 직무가 제품 기능 중심의 서비스기획이라면, 실제 화면·기능 요구사항이나 개발 협업 경험이 얼마나 있는지도 함께 보여줘야 합니다.',
        criteria:
          '강점: 고객 여정 분석, VOC 정리, 접점 개선, 안내/정책 개선 경험은 서비스기획과 직접 연결됩니다. 한계: 오프라인 응대 프로세스나 상담 품질 개선에만 머물렀다면 디지털 서비스기획과의 연결은 추가 설명이 필요합니다. 이력서에서는 고객 경험 개선이 어떤 서비스 흐름, 정책, 화면, 기능 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'CX기획 경험은 서비스기획과 연결성이 높지만, 디지털 서비스기획으로 전환하려면 화면·기능·개발 협업 경험까지 드러나는 것이 좋습니다.',
      },
    },
  },

  'cx_planning:product_management': {
    archetypeId: 'CX_PLANNING_TO_PRODUCT_MANAGEMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: "CX기획 경험은 PM 전환에서 '고객 경험 문제를 제품 개선 과제로 정의한 경험'으로 연결될 수 있습니다.",
        scoreReason:
          'PM은 고객 경험에서 어떤 문제가 제품 가치와 지표를 떨어뜨리는지 판단하고 개선 우선순위를 정해야 합니다. CX기획 경험은 고객 여정, VOC, 접점별 불편을 구조화해본 경험이라는 점에서 PM과 연결될 수 있습니다. 다만 PM으로 보이려면 경험 개선안이 제품 기능, 로드맵, 우선순위, 지표 개선으로 연결된 사례가 필요합니다.',
        criteria:
          '강점: 고객 여정, VOC, 불편 지점, 접점 개선 경험은 제품 문제 정의와 연결됩니다. 한계: 응대 프로세스나 서비스 품질 개선 중심으로만 보이면 PM의 제품 책임과는 거리가 있어 보일 수 있습니다. 이력서에서는 CX 문제를 어떤 기능 개선, 제품 우선순위, 전환율/유지율 개선 과제로 연결했는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          'CX기획 경험은 고객 문제를 구조화하는 데 강점이 있지만, PM 전환에서는 이를 제품 의사결정과 지표 개선으로 연결한 경험이 필요합니다.',
      },
    },
  },
  'sales_b2b:business_development': {
    archetypeId: 'B2B_SALES_TO_BUSINESS_DEVELOPMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'stakeholderComplexity',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'B2B영업 경험은 BD 전환에서 고객사 문제와 외부 의사결정 구조를 이해한 경험으로 연결될 수 있습니다.',
        scoreReason:
          'BD는 단순 판매보다 시장 기회, 파트너 구조, 고객사 니즈, 수익 모델, 협력 조건을 함께 설계하는 역할입니다. B2B영업 경험은 고객사 의사결정자와 커뮤니케이션하고, 니즈를 파악하며, 제안과 협상을 해본 경험이라는 점에서 BD와 연결될 수 있습니다. 다만 매출 목표 달성이나 영업 실행 중심으로만 보이면 신규 사업 기회 발굴과 협력 구조 설계 역할과는 차이가 있어 보일 수 있습니다.',
        criteria:
          '강점: 고객사 니즈 파악, 제안, 협상, 의사결정자 커뮤니케이션, 계약 조건 조율 경험은 BD와 연결됩니다. 한계: 기존 상품 판매나 단기 매출 달성 중심으로만 보이면 사업개발 역할로 보기 어렵습니다. 이력서에서는 영업 경험이 어떤 신규 기회, 파트너십, 시장 확장, 수익 구조 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      stakeholderComplexity: {
        liftOrLimit:
          'B2B영업 경험은 BD 전환의 강한 기반이 될 수 있지만, 판매 실적을 넘어 사업 기회와 협력 구조를 만든 경험으로 재해석해야 설득력이 높아집니다.',
      },
    },
  },
  'account_management:business_development': {
    archetypeId: 'ACCOUNT_MANAGEMENT_TO_BUSINESS_DEVELOPMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'stakeholderComplexity',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'AM 경험은 BD 전환에서 고객사 관계를 확장하고 추가 기회를 만든 경험으로 연결될 수 있습니다.',
        scoreReason:
          'BD는 외부 파트너나 고객사와의 관계를 바탕으로 새로운 사업 기회와 협력 구조를 만들어야 합니다. AM 경험은 기존 고객사의 니즈를 관리하고, 관계를 유지하며, 업셀·크로스셀·확장 기회를 찾아본 경험이라는 점에서 BD와 연결될 수 있습니다. 다만 운영 관리나 고객 대응 중심으로만 보이면 신규 사업을 발굴하고 조건을 설계하는 BD 역할과는 차이가 있어 보일 수 있습니다.',
        criteria:
          '강점: 고객사 관계 관리, 니즈 발굴, 업셀·크로스셀, 계약 갱신, 이해관계자 조율 경험은 BD와 연결됩니다. 한계: 요청 대응이나 계정 운영 중심으로만 보이면 사업개발 전환 근거가 약합니다. 이력서에서는 AM 경험이 어떤 신규 매출 기회, 파트너십 확장, 계약 조건 개선, 사업 성장으로 이어졌는지를 보여줘야 합니다.',
      },
      stakeholderComplexity: {
        liftOrLimit:
          'AM 경험은 BD와 연결성이 높지만, 기존 고객 관리에서 끝나지 않고 새로운 기회와 협력 구조를 만든 근거가 필요합니다.',
      },
    },
  },
  'customer_success:business_development': {
    archetypeId: 'CUSTOMER_SUCCESS_TO_BUSINESS_DEVELOPMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'stakeholderComplexity',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: 'Customer Success 경험은 BD 전환에서 고객의 성공 조건과 확장 기회를 이해한 경험으로 연결될 수 있습니다.',
        scoreReason:
          'BD는 고객이나 파트너가 어떤 조건에서 더 큰 가치를 얻고 협력할 수 있는지 판단해야 합니다. Customer Success 경험은 고객의 사용 맥락, 성공 지표, 리텐션, 확장 가능성, 내부 이해관계자 요구를 다뤄본 경험이라는 점에서 BD와 연결될 수 있습니다. 다만 온보딩이나 문의 대응 중심으로만 보이면 신규 사업 기회와 협력 구조를 만드는 BD 역할과는 차이가 있어 보일 수 있습니다.',
        criteria:
          '강점: 고객 성공 지표, 리텐션, 확장 기회, 이해관계자 관리, 고객 문제 구조화 경험은 BD와 연결됩니다. 한계: 사용 안내나 단순 고객 대응 중심으로만 보이면 사업개발 전환 근거가 약합니다. 이력서에서는 Customer Success 경험이 어떤 업셀, 확장 계약, 파트너십, 신규 기회 발굴로 이어졌는지를 보여줘야 합니다.',
      },
      stakeholderComplexity: {
        liftOrLimit:
          'Customer Success 경험은 고객 가치와 확장 가능성을 이해한다는 강점이 있지만, BD 전환에서는 이를 신규 기회와 사업 구조로 연결한 경험이 중요합니다.',
      },
    },
  },
  'sales_admin:business_development': {
    archetypeId: 'SALES_ADMIN_TO_BUSINESS_DEVELOPMENT',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'low',
    overlays: {
      jobStructure: {
        lead: '영업관리 경험은 BD 전환에서 영업 운영 구조와 거래 흐름을 이해한 경험으로 일부 연결될 수 있습니다.',
        scoreReason:
          'BD는 외부 협력과 사업 기회를 실제 계약과 운영 구조로 연결해야 합니다. 영업관리 경험은 견적, 계약, 매출 관리, 영업 프로세스, 거래 조건을 다뤄본 경험이라는 점에서 일부 연결될 수 있습니다. 다만 내부 지원이나 행정 처리 중심으로만 보이면 BD의 외부 기회 발굴, 협상, 파트너십 설계 역할과는 차이가 커 보일 수 있습니다.',
        criteria:
          '강점: 견적, 계약, 매출 관리, 영업 프로세스, 거래 조건 이해는 BD의 실행 구조와 연결됩니다. 한계: 영업 지원이나 정산·서류 처리 중심이면 사업개발 전환 근거가 약합니다. 이력서에서는 영업관리 경험이 어떤 거래 조건 개선, 고객사 협상 지원, 신규 기회 실행, 매출 구조 개선으로 이어졌는지를 보여줘야 합니다.',
      },
      responsibilityScope: {
        liftOrLimit:
          '영업관리 경험은 BD의 운영 기반과 일부 연결되지만, 외부 파트너와 직접 기회를 만들고 조율한 경험이 부족하면 전환 설득력은 낮아질 수 있습니다.',
      },
    },
  },
};

const BLOCKED_OVERLAYS = {
  jobStructure: {
    lead: 'PM과 PO 역할은 동일한 직무 코드를 공유하고 있어 자동 경로 선택이 제한됩니다.',
    scoreReason: 'PO 역할로의 전환은 PM 역할과 구분된 taxonomy ID가 확정된 이후 자동 분석이 가능합니다.',
    criteria: '지원하는 역할이 PM인지 PO인지 명확히 구분된 공고를 기준으로 전환 전략을 세우는 것이 중요합니다.',
  },
  responsibilityScope: {
    lead: 'PO 역할 전환을 위한 전략은 별도 상담을 통해 확인해 주세요.',
    liftOrLimit: 'PM과 PO의 책임 구조 차이를 명확히 이해한 후 지원 방향을 정하는 것이 중요합니다.',
  },
};

const FALLBACK_OVERLAYS = {
  jobStructure: {
    lead: '입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다. 목표 직무가 요구하는 핵심 역량과 현재 경험 간의 차이를 구체적으로 파악하는 것이 중요합니다.',
    scoreReason: '직무 전환 가능성은 기존 경험과 목표 직무의 핵심 역량 사이의 구체적인 거리(차이)를 기준으로 판단합니다. 문제 정의 역량, 산출물 작성 경험 여부가 핵심 평가 기준입니다.',
    criteria: '현재 직무 경험이 목표 직무의 핵심 역량과 얼마나 겹치는지, 그 차이를 어떻게 보완할 수 있는지를 판단합니다.',
  },
  responsibilityScope: {
    lead: '현재 직무에서 목표 직무로의 책임 범위 이동을 파악하기 위해 추가 정보가 필요합니다.',
    liftOrLimit: '현재 경험과 목표 역할 간의 차이를 명확히 이해하고 보완 계획을 세우는 것이 중요합니다.',
  },
};

// @MX:NOTE: [AUTO] SC-E12 전용 overlay. service_planning↔service_design 교차 fallback 금지 케이스.
const FALLBACK_E12_OVERLAYS = {
  jobStructure: {
    lead: '목표 직무가 서비스기획인지 서비스디자인인지 불명확하면 자동 해석을 제한해야 한다. 두 직무는 핵심 역량과 산출물이 다릅니다.',
    scoreReason: '화면/기능 요구사항과 리서치/경험설계는 구분해야 한다. 서비스기획은 UX 정책·기능 정의가 중심이고, 서비스디자인은 리서치·경험 아키텍처 설계가 중심입니다.',
    criteria: '지원 직무의 방향을 먼저 명확히 한 후 전환 전략을 수립해야 합니다.',
  },
  responsibilityScope: {
    lead: '서비스기획과 서비스디자인은 책임 구조와 산출물이 다릅니다. 지원 방향 확정 후 전략을 재설계해야 합니다.',
    liftOrLimit: '지원하는 직무가 서비스기획인지 서비스디자인인지를 먼저 결정하면 더 정확한 전환 분석이 가능합니다.',
  },
};

function selectModifiers(input) {
  const modifiers = [];
  const { yearsOfExperience, sourceIndustryId, targetIndustryId, candidateEvidencePack } = input;
  if (yearsOfExperience != null) {
    if (yearsOfExperience < 3) modifiers.push('junior');
    else if (yearsOfExperience < 7) modifiers.push('mid');
    else modifiers.push('senior');
  }
  if (sourceIndustryId && targetIndustryId) {
    modifiers.push(sourceIndustryId === targetIndustryId ? 'same_domain' : 'different_domain');
  }
  if (candidateEvidencePack) {
    const { hasMetricEvidence, hasProcessImprovementEvidence, hasCrossFunctionalEvidence, hasCustomerProblemEvidence } = candidateEvidencePack;
    if (hasMetricEvidence) modifiers.push('metric_evidence');
    if (hasProcessImprovementEvidence) modifiers.push('process_improvement_evidence');
    if (hasCrossFunctionalEvidence) modifiers.push('crossfunctional_evidence');
    if (hasCustomerProblemEvidence) modifiers.push('customer_problem_evidence');
  }
  return modifiers;
}

export function resolveCareerTransitionArchetype(input) {
  const { sourceJobId, targetJobId, targetSubType } = input;
  const sourceGroup = JOB_GROUP_MAP[sourceJobId] ?? null;
  const targetGroup = JOB_GROUP_MAP[targetJobId] ?? null;

  // 1. Null source → FALLBACK
  if (!sourceGroup) {
    return {
      resolutionStatus: 'FALLBACK',
      selectedCaseId: null,
      selectedArchetypeId: null,
      selectedModifiers: [],
      sourceGroup: null,
      targetGroup,
      blockedReason: null,
      confidence: 'low',
      overlays: FALLBACK_OVERLAYS,
    };
  }

  // 2. BLOCKED: PM/PO shared taxonomy ID
  if (targetGroup === 'product_management' && targetSubType === 'PO') {
    return {
      resolutionStatus: 'BLOCKED_TAXONOMY',
      selectedCaseId: 'EXPERIENCED_SERVICE_PLANNING_TO_PO_V1',
      selectedArchetypeId: null,
      selectedModifiers: [],
      sourceGroup,
      targetGroup: null,
      blockedReason: 'PM/PO 공용 taxonomyId. targetSubType PO 분리 완료 전 자동 발화 불가.',
      confidence: 'low',
      overlays: BLOCKED_OVERLAYS,
    };
  }

  // 3. FALLBACK: ambiguous service_design target (SC-E12)
  if (targetSubType === 'ambiguous_service_design') {
    return {
      resolutionStatus: 'FALLBACK',
      selectedCaseId: null,
      selectedArchetypeId: null,
      selectedModifiers: [],
      sourceGroup,
      targetGroup: null,
      blockedReason: 'targetSubType ambiguous_service_design — service_planning과 service_design 분기 불가.',
      confidence: 'low',
      overlays: FALLBACK_E12_OVERLAYS,
    };
  }

  // 5. Curated case match
  for (const c of CURATED_CASES) {
    if (c.sourceGroup === sourceGroup && c.targetGroup === targetGroup && c.condition(input)) {
      return {
        resolutionStatus: 'CURATED_MATCH',
        selectedCaseId: c.caseId,
        selectedArchetypeId: c.archetypeId,
        selectedModifiers: [],
        sourceGroup,
        targetGroup,
        blockedReason: null,
        confidence: c.confidence,
        overlays: c.overlays,
      };
    }
  }

  // 6. Archetype table match
  const key = `${sourceGroup}:${targetGroup}`;
  const archetype = ARCHETYPE_TABLE[key];
  if (archetype) {
    return {
      resolutionStatus: archetype.resolutionStatus,
      selectedCaseId: null,
      selectedArchetypeId: archetype.archetypeId,
      selectedModifiers: selectModifiers(input),
      sourceGroup,
      targetGroup,
      blockedReason: null,
      confidence: archetype.confidence,
      overlays: archetype.overlays,
    };
  }

  // 7. Generic fallback
  return {
    resolutionStatus: 'FALLBACK',
    selectedCaseId: null,
    selectedArchetypeId: null,
    selectedModifiers: [],
    sourceGroup,
    targetGroup,
    blockedReason: null,
    confidence: 'low',
    overlays: FALLBACK_OVERLAYS,
  };
}
