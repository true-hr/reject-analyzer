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
  JOB_HR_ORGANIZATION_HR_OPS: 'hr_operations',
  JOB_HR_ORGANIZATION_HRBP: 'hrbp',
  JOB_HR_ORGANIZATION_RECRUITING: 'recruiting',
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
    archetypeId: 'PROCUREMENT_TO_BUSINESS_PLANNING',
    resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '원가 구조와 공급망 비용 관리 경험이 사업 수익성 분석의 기초 데이터로 작동합니다.',
        scoreReason: '비용 절감 성과를 사업 판단 관점과 연결했는지가 전환 판단 기준입니다.',
        criteria: '단가 협상 성과를 넘어 수익성·시장 영향 분석까지 확장한 경험 여부를 확인합니다.',
      },
      responsibilityScope: {
        lead: '공급망 내부 운영 역할에서 사업 전략·시장 분석·성과 기획 역할로 책임 범위가 이동합니다.',
        liftOrLimit: '원가 분석을 사업 판단 자료로 활용한 경험이 있으면 긍정적입니다. 협상 실행에만 머물렀다면 전략 기획 역량 보완이 필요합니다.',
      },
    },
  },
  'accounting:finance_planning': {
    archetypeId: 'ACCOUNTING_TO_BUSINESS_FINANCE',
    resolutionStatus: 'ARCHETYPE_MATCH',
    secondaryAxis: 'responsibilityScope',
    confidence: 'medium',
    overlays: {
      jobStructure: {
        lead: '회계 경험은 FP&A의 재무 분석 역량과 기본 구조가 겹칩니다. 결산, 비용 분석, 원가 파악 경험은 예산 수립과 실적 분석의 중요한 기반이 됩니다.',
        scoreReason: 'FP&A는 재무 데이터를 사업 성과와 연결해 의사결정자에게 인사이트를 제공하는 역할입니다. 기존 경험이 규정 준수 중심이었다면 분석·사업 이해 경험이 추가로 확인되어야 합니다.',
        criteria: '사업부 비용 구조 분석, 예산 대비 실적 분석 경험이 얼마나 포함되어 있는지를 봅니다.',
      },
      responsibilityScope: {
        lead: '회계 기록 중심 역할에서 사업부 의사결정 지원과 예산 분석 중심 역할로 책임 범위가 이동합니다.',
        liftOrLimit: '사업부 비용 구조 분석이나 실적 분석 경험이 있으면 긍정적입니다. 결산 처리에만 머물렀다면 분석 역량 보완이 필요합니다.',
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
        lead: '인사 제도 운영 경험이 HRBP의 조직 진단·제도 설계 역할에서 실행 기반이 됩니다.',
        scoreReason: '제도 운영 경험을 조직 이슈 해결과 현업 협업으로 연결했는지가 전환 가능성 판단 기준입니다.',
        criteria: '노무·평가·보상 등 인사 제도 이해도와 현업 협업 경험이 함께 평가됩니다.',
      },
      responsibilityScope: {
        lead: '내부 제도 관리 역할에서 현업 조직 파트너링과 인력 전략 지원 역할로 책임 범위가 확장됩니다.',
        liftOrLimit: '현업 부서와 협업한 제도 개선 경험이 있으면 긍정적입니다. 제도 운영에만 머물렀다면 현업 파트너링 경험 보완이 필요합니다.',
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

const PENDING_OVERLAYS = {
  jobStructure: {
    lead: '고객성공 경험은 서비스기획 전환과 연결성이 있을 수 있습니다. 단, 정확한 분석을 위해 추가 확인이 필요합니다.',
    scoreReason: '고객성공 직무의 정확한 분석 경로가 아직 준비 중입니다.',
    criteria: '온보딩·리텐션 경험에서 서비스기획으로의 전환 가능성은 별도 분석 경로 준비 후 제공됩니다.',
  },
  responsibilityScope: {
    lead: '고객성공 경험에서 서비스기획 역할로의 전환 책임 구조 분석을 준비 중입니다.',
    liftOrLimit: '분석 경로가 준비되면 더 구체적인 전환 전략을 제공할 수 있습니다.',
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

  // 3. PENDING: customer_success has no archetype logic yet
  if (sourceGroup === 'customer_success') {
    return {
      resolutionStatus: 'PENDING_TAXONOMY',
      selectedCaseId: null,
      selectedArchetypeId: null,
      selectedModifiers: [],
      sourceGroup,
      targetGroup,
      blockedReason: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS는 PENDING_TAXONOMY.',
      confidence: 'low',
      overlays: PENDING_OVERLAYS,
    };
  }

  // 4. FALLBACK: ambiguous service_design target (SC-E12)
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
