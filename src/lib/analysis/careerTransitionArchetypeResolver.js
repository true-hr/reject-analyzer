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
        lead: '영업 데이터 집계 경험이 사업 인사이트 도출의 원재료로 작동한다.',
        scoreReason: '영업 지표를 사업 전략 판단으로 연결한 경험이 있는지가 핵심 평가 기준이다.',
        criteria: '데이터 보고를 넘어 전략적 해석까지 경험했는지 이력서에서 확인한다.',
      },
      responsibilityScope: {
        lead: '영업 내부 지원 역할에서 사업 전반의 기획·분석 역할로 책임 범위가 이동한다.',
        liftOrLimit: '전략 해석 경험이나 경영진 보고 경험이 있으면 긍정적, 단순 집계 역할에 머물렀으면 전환 거리가 크다.',
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
        lead: '원가 구조와 공급망 비용 관리 경험이 사업 수익성 분석의 기초 데이터로 작동한다.',
        scoreReason: '비용 절감 성과를 사업 판단 관점과 연결했는지가 전환 판단 기준이다.',
        criteria: '단가 협상 성과를 넘어 수익성·시장 영향 분석까지 확장한 경험 여부를 확인한다.',
      },
      responsibilityScope: {
        lead: '공급망 내부 운영 역할에서 사업 전략·시장 분석·성과 기획 역할로 책임 범위가 이동한다.',
        liftOrLimit: '원가 분석을 사업 판단 자료로 활용한 경험이 있으면 긍정적, 협상 실행에만 머물렀으면 전략 기획 역량 보완이 필요하다.',
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
        lead: '회계 기록 중심 역할에서 사업부 의사결정 지원과 예산 분석 중심 역할로 책임 범위가 이동한다.',
        liftOrLimit: '사업부 비용 구조 분석이나 실적 분석 경험이 있으면 긍정적, 결산 처리에만 머물렀으면 분석 역량 보완이 필요하다.',
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
        lead: '인사 제도 운영 경험이 HRBP의 조직 진단·제도 설계 역할에서 실행 기반이 된다.',
        scoreReason: '제도 운영 경험을 조직 이슈 해결과 현업 협업으로 연결했는지가 전환 가능성 판단 기준이다.',
        criteria: '노무·평가·보상 등 인사 제도 이해도와 현업 협업 경험이 함께 평가된다.',
      },
      responsibilityScope: {
        lead: '내부 제도 관리 역할에서 현업 조직 파트너링과 인력 전략 지원 역할로 책임 범위가 확장된다.',
        liftOrLimit: '현업 부서와 협업한 제도 개선 경험이 있으면 긍정적, 제도 운영에만 머물렀으면 현업 파트너링 경험 보완이 필요하다.',
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
