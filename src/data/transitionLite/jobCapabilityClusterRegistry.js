// jobCapabilityClusterRegistry.js
// date: 2026-04-20
// scope: axis1 capability bridge layer — DRAFT, not yet imported by scorer
// coverage: 40 jobs | 12 clusters | 10 bridgeGroups
// source: docs/axis1-capability-registry-expanded.md
// next: import into buildAxisConnectivityPack.js in Round 3 (shadow) / Round 4 (live)

// ── CAPABILITY CLUSTER TAXONOMY (12 clusters) ───────────────────────────────

export const CAPABILITY_CLUSTER_TAXONOMY = {
  customer_discovery: {
    label: "고객 니즈 파악",
    meaning: "고객의 문제, 요구, 구매 맥락, 사용 맥락을 파악하는 일"
  },
  persuasion_proposal: {
    label: "설득·제안",
    meaning: "상대를 설득하고 제안서를 만들거나 메시지를 조정해 의사결정을 이끄는 일"
  },
  market_insight: {
    label: "시장·경쟁 이해",
    meaning: "시장 흐름, 경쟁사, 고객 세그먼트, 반응을 읽고 방향성을 잡는 일"
  },
  message_positioning: {
    label: "메시지·포지셔닝 설계",
    meaning: "어떤 메시지로 누구에게 어떤 가치를 전달할지 정리하는 일"
  },
  relationship_management: {
    label: "관계 관리",
    meaning: "고객, 파트너, 내부 이해관계자와 지속적으로 관계를 유지·조율하는 일"
  },
  crossfunctional_alignment: {
    label: "부서 간 조율",
    meaning: "여러 조직과 협업하며 일정, 우선순위, 요구사항을 맞추는 일"
  },
  execution_operations: {
    label: "실행 운영",
    meaning: "정해진 목표를 실제 운영, 실행, 관리하는 일"
  },
  analysis_optimization: {
    label: "데이터 해석·개선",
    meaning: "수치/현황을 보고 문제를 해석하고 개선 포인트를 찾는 일"
  },
  product_service_translation: {
    label: "제품·서비스 가치 해석",
    meaning: "제품/서비스의 가치를 사용자·고객 언어로 바꾸고 연결하는 일"
  },
  planning_structuring: {
    label: "기획·구조화",
    meaning: "목표를 정리하고 실행 구조, 우선순위, 로드맵을 짜는 일"
  },
  stakeholder_support: {
    label: "이해관계자 지원",
    meaning: "현업/사용자/조직이 더 잘 움직이도록 지원하고 문제를 풀어주는 일"
  },
  domain_technical_depth: {
    label: "전문기술 기반 수행",
    meaning: "특정 기술/공학/회계 지식 자체가 핵심 수행 기반이 되는 일"
  }
};

// ── NORMALIZED BRIDGEGROUP TAXONOMY (10 groups) ─────────────────────────────

export const NORMALIZED_BRIDGEGROUP_TAXONOMY = {
  commercial_gtm: {
    label: "GTM·영업·마케팅 성장",
    meaning: "영업/마케팅/GTM 활동 전반. sales↔marketing 간 bridge 감지의 핵심 그룹"
  },
  product_service_strategy: {
    label: "제품·서비스·IT 전략",
    meaning: "PM, PMM, IT기획, 서비스기획, 데이터분석. 제품/서비스/데이터를 전략적으로 다루는 역할군"
  },
  business_planning_ops: {
    label: "사업기획·운영 전략",
    meaning: "전략기획, 사업기획, 프로젝트관리, 운영관리, 컨설팅, FP&A. 기획·분석·운영 전략 계열"
  },
  people_ops: {
    label: "사람 운영·조직 전반",
    meaning: "HR 전 계열(채용, HRBP, 인사기획, HR Ops). HR 내부 bridge 감지의 핵심 그룹"
  },
  customer_service_ops: {
    label: "고객 서비스·운영",
    meaning: "CS, 고객성공, 서비스운영, 운영기획, 고객상담. 고객 접점 역할군"
  },
  finance_planning_control: {
    label: "재무 계획·통제",
    meaning: "회계, FP&A, 관리회계, 재무. 재무 계열 내부 bridge 감지의 핵심 그룹"
  },
  industrial_operations: {
    label: "제조·생산·품질 운영",
    meaning: "생산기술, 생산관리, 공정엔지니어링, 품질보증. 제조/생산 계열 내부 bridge 감지"
  },
  technical_build: {
    label: "기술 구현·설계 개발",
    meaning: "소프트웨어개발, 기계설계, 엔지니어링 개발 계열"
  },
  research_advisory: {
    label: "리서치·자문·분석 전문직",
    meaning: "컨설팅, 시장/산업 리서치, 전문가 평가"
  },
  supplier_partner_network: {
    label: "파트너·공급망 네트워크",
    meaning: "파트너영업, BD(신사업개발), 구매/SCM 계열"
  }
};

// ── JOB CAPABILITY CLUSTER REGISTRY (40 jobs) ───────────────────────────────
// source of truth: docs/axis1-capability-registry-expanded.md
// field order: capabilityClusters / workingMotionTags / bridgeGroups / confidence / rationaleKo

export const JOB_CAPABILITY_CLUSTER_REGISTRY = {

  // ── SALES (6 jobs) ────────────────────────────────────────────────────────

  JOB_SALES_GENERAL_SALES: {
    capabilityClusters: ["customer_discovery", "persuasion_proposal", "relationship_management", "market_insight"],
    workingMotionTags: ["market_facing", "quota_or_growth_driven", "external_communication_heavy"],
    bridgeGroups: ["commercial_gtm", "customer_service_ops"],
    confidence: "medium",
    rationaleKo: "영업의 본질인 고객 니즈 파악, 설득, 관계 관리가 강하고 시장 감각도 일부 포함됨"
  },

  JOB_SALES_B2B_SALES: {
    capabilityClusters: ["customer_discovery", "persuasion_proposal", "relationship_management", "crossfunctional_alignment", "message_positioning"],
    workingMotionTags: ["market_facing", "deal_driven", "external_communication_heavy"],
    bridgeGroups: ["commercial_gtm"],
    confidence: "medium",
    rationaleKo: "단순 판매보다 제안, 메시지 조정, 내부 협업이 더 강하게 들어가는 B2B형 영업"
  },

  JOB_SALES_PARTNER_CHANNEL_SALES: {
    capabilityClusters: ["relationship_management", "persuasion_proposal", "crossfunctional_alignment", "market_insight"],
    workingMotionTags: ["partner_facing", "ecosystem_driven", "external_communication_heavy"],
    bridgeGroups: ["commercial_gtm", "supplier_partner_network"],
    confidence: "medium",
    rationaleKo: "직접 고객이 아니라 파트너 네트워크를 통해 성과를 내는 구조가 핵심"
  },

  JOB_SALES_SOLUTION_SALES: {
    capabilityClusters: ["customer_discovery", "persuasion_proposal", "product_service_translation", "crossfunctional_alignment", "domain_technical_depth"],
    workingMotionTags: ["consultative_selling", "market_facing", "solution_translation"],
    bridgeGroups: ["commercial_gtm"],
    confidence: "medium",
    rationaleKo: "고객 문제 해석과 제품/기술 가치를 연결하는 설명력이 중요한 영업"
  },

  JOB_SALES_KEY_ACCOUNT_MANAGEMENT: {
    capabilityClusters: ["relationship_management", "customer_discovery", "crossfunctional_alignment", "planning_structuring", "persuasion_proposal"],
    workingMotionTags: ["strategic_account_management", "renewal_or_growth_focus", "executive_relationship"],
    bridgeGroups: ["commercial_gtm", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "핵심 고객 관계를 장기적으로 유지하고 전략적으로 성장시키는 역할로, 단순 신규 영업보다 관계·기획·협업 비중이 더 큼"
  },

  JOB_SALES_PROPOSAL_SALES: {
    capabilityClusters: ["persuasion_proposal", "customer_discovery", "crossfunctional_alignment", "domain_technical_depth"],
    workingMotionTags: ["proposal_driven", "competitive_bidding", "market_facing"],
    bridgeGroups: ["commercial_gtm"],
    confidence: "medium",
    rationaleKo: "RFP 대응과 제안서 작성이 중심인 영업으로, 제안 역량과 내부 조율, 기술/솔루션 이해가 함께 필요한 역할"
  },

  // ── SALES OPERATIONS ──────────────────────────────────────────────────────

  JOB_SALES_SALES_OPERATIONS: {
    capabilityClusters: ["execution_operations", "analysis_optimization", "planning_structuring", "crossfunctional_alignment"],
    workingMotionTags: ["internal_ops", "data_feedback_loop", "sales_enablement"],
    bridgeGroups: ["commercial_gtm", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "영업 성과를 분석하고 영업 프로세스와 도구를 운영·개선하는 내부 지원 역할"
  },

  // ── MARKETING (6 jobs) ───────────────────────────────────────────────────

  JOB_MARKETING_BRAND_MARKETING: {
    capabilityClusters: ["market_insight", "message_positioning", "planning_structuring", "crossfunctional_alignment"],
    workingMotionTags: ["market_facing", "message_strategy_heavy", "campaign_or_brand_planning"],
    bridgeGroups: ["commercial_gtm"],
    confidence: "medium",
    rationaleKo: "시장과 고객을 해석해 브랜드 메시지와 방향을 설계하는 역할"
  },

  JOB_MARKETING_PRODUCT_MARKETING_PMM: {
    capabilityClusters: ["market_insight", "message_positioning", "product_service_translation", "crossfunctional_alignment", "planning_structuring"],
    workingMotionTags: ["market_facing", "message_strategy_heavy", "product_translation"],
    bridgeGroups: ["commercial_gtm", "product_service_strategy"],
    confidence: "medium",
    rationaleKo: "제품 가치를 시장 언어로 번역하고 제품-영업-마케팅을 잇는 역할"
  },

  JOB_MARKETING_CONTENT_MARKETING: {
    capabilityClusters: ["message_positioning", "market_insight", "execution_operations"],
    workingMotionTags: ["content_execution", "message_delivery", "market_facing"],
    bridgeGroups: ["commercial_gtm"],
    confidence: "medium",
    rationaleKo: "메시지를 실제 콘텐츠로 풀어내고 반응을 보며 개선하는 성격이 강함"
  },

  JOB_MARKETING_PERFORMANCE_MARKETING: {
    capabilityClusters: ["analysis_optimization", "execution_operations", "market_insight"],
    workingMotionTags: ["channel_optimization", "data_feedback_loop", "campaign_execution"],
    bridgeGroups: ["commercial_gtm"],
    confidence: "medium",
    rationaleKo: "메시지 설계보다는 채널 운영과 수치 최적화의 비중이 더 큼"
  },

  JOB_MARKETING_CRM_MARKETING: {
    capabilityClusters: ["analysis_optimization", "execution_operations", "relationship_management", "message_positioning"],
    workingMotionTags: ["lifecycle_marketing", "data_feedback_loop", "retention_focused"],
    bridgeGroups: ["commercial_gtm", "customer_service_ops"],
    confidence: "medium",
    rationaleKo: "고객 데이터 기반으로 단계별 메시지와 캠페인을 설계하고 유지·재구매를 촉진하는 역할"
  },

  JOB_MARKETING_DIGITAL_MARKETING: {
    capabilityClusters: ["execution_operations", "analysis_optimization", "message_positioning", "market_insight"],
    workingMotionTags: ["channel_optimization", "digital_execution", "market_facing"],
    bridgeGroups: ["commercial_gtm"],
    confidence: "medium",
    rationaleKo: "디지털 채널 전반에서 마케팅을 실행하고 성과를 관리하는 역할로 퍼포먼스마케팅과 유사하나 채널 범위가 더 넓음"
  },

  // ── BUSINESS (7 jobs) ────────────────────────────────────────────────────

  JOB_BUSINESS_BUSINESS_PLANNING: {
    capabilityClusters: ["planning_structuring", "market_insight", "crossfunctional_alignment", "analysis_optimization"],
    workingMotionTags: ["planning_heavy", "internal_alignment", "growth_or_business_decision_support"],
    bridgeGroups: ["business_planning_ops", "commercial_gtm"],
    confidence: "medium",
    rationaleKo: "시장/사업 정보를 구조화해 방향과 실행 우선순위를 설계하는 역할"
  },

  // @MX:NOTE: 전략기획(STRATEGY) vs 사업기획(BUSINESS_PLANNING) — 추상도와 이해관계자 레벨이 다름. 같은 걸로 취급하면 안 됨.
  JOB_BUSINESS_STRATEGY: {
    capabilityClusters: ["planning_structuring", "market_insight", "analysis_optimization", "crossfunctional_alignment"],
    workingMotionTags: ["strategic_planning", "long_range_direction", "executive_decision_support"],
    bridgeGroups: ["business_planning_ops", "research_advisory"],
    confidence: "medium",
    rationaleKo: "중장기 방향성과 사업 구조를 설계하고 의사결정 재료를 만드는 역할로 사업기획보다 전사 수준의 추상도가 더 높음"
  },

  JOB_BUSINESS_BUSINESS_DEVELOPMENT: {
    capabilityClusters: ["market_insight", "planning_structuring", "persuasion_proposal", "crossfunctional_alignment", "relationship_management"],
    workingMotionTags: ["opportunity_identification", "deal_structuring", "external_facing_growth"],
    bridgeGroups: ["commercial_gtm", "business_planning_ops", "supplier_partner_network"],
    confidence: "medium",
    rationaleKo: "시장 기회를 발굴하고 파트너십/신규사업 구조를 만드는 역할로 영업보다 기획, 마케팅보다 사업구조에 집중함"
  },

  // @MX:NOTE: 서비스기획(SERVICE_PLANNING) vs IT기획(IT_PLANNING) — 사용자 경험 흐름 vs 시스템 방향 계획으로 맥락이 다름.
  JOB_BUSINESS_SERVICE_PLANNING: {
    capabilityClusters: ["planning_structuring", "customer_discovery", "product_service_translation", "crossfunctional_alignment"],
    workingMotionTags: ["service_design", "feature_definition", "user_flow_planning"],
    bridgeGroups: ["product_service_strategy", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "서비스/제품 흐름을 기획하고 요구사항을 정의하는 역할로 IT PM과 유사하지만 비개발 서비스 맥락에서 더 많이 쓰임"
  },

  JOB_BUSINESS_OPERATIONS_MANAGEMENT: {
    capabilityClusters: ["execution_operations", "crossfunctional_alignment", "planning_structuring", "analysis_optimization"],
    workingMotionTags: ["operational_governance", "process_management", "internal_alignment"],
    bridgeGroups: ["business_planning_ops", "customer_service_ops"],
    confidence: "medium",
    rationaleKo: "사업 실행 전반을 관리하고 부서 간 운영 우선순위와 프로세스를 정렬하는 역할"
  },

  // @MX:NOTE: 프로덕트 PM(PRODUCT_MANAGEMENT) vs 프로젝트 PM(PROJECT_MANAGEMENT) — what to build vs how to deliver. 판단 유형이 근본적으로 다름.
  JOB_BUSINESS_PROJECT_MANAGEMENT: {
    capabilityClusters: ["planning_structuring", "crossfunctional_alignment", "execution_operations", "stakeholder_support"],
    workingMotionTags: ["project_delivery", "timeline_management", "cross_team_coordination"],
    bridgeGroups: ["business_planning_ops"],
    confidence: "medium",
    rationaleKo: "프로젝트 일정과 리소스를 조율하고 성과 달성까지 책임지는 역할로, IT 제품 중심이 아닌 사업/조직 프로젝트 중심"
  },

  // ── PRODUCT / IT / DATA (3 jobs) ─────────────────────────────────────────

  JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT: {
    capabilityClusters: ["planning_structuring", "crossfunctional_alignment", "customer_discovery", "product_service_translation", "analysis_optimization"],
    workingMotionTags: ["product_decision_making", "crossfunctional_core", "user_problem_framing"],
    bridgeGroups: ["product_service_strategy", "customer_service_ops"],
    confidence: "medium",
    rationaleKo: "사용자 문제 정의와 우선순위 설계, 협업 조율이 중심인 역할"
  },

  JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
    capabilityClusters: ["analysis_optimization", "planning_structuring", "stakeholder_support"],
    workingMotionTags: ["data_interpretation", "decision_support", "insight_delivery"],
    bridgeGroups: ["product_service_strategy", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "데이터를 해석해 인사이트를 만들고 의사결정을 돕는 역할"
  },

  JOB_IT_DATA_DIGITAL_IT_PLANNING: {
    capabilityClusters: ["planning_structuring", "crossfunctional_alignment", "product_service_translation", "analysis_optimization"],
    workingMotionTags: ["it_strategy", "system_roadmap", "vendor_coordination"],
    bridgeGroups: ["product_service_strategy", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "IT 시스템 방향과 투자를 계획하고 내부 요구사항을 기술로 연결하는 역할로 서비스기획과 유사하지만 시스템·인프라 맥락이 더 강함"
  },

  JOB_IT_DATA_DIGITAL_DATA_ENGINEERING: {
    capabilityClusters: ["domain_technical_depth", "execution_operations", "analysis_optimization"],
    workingMotionTags: ["data_pipeline_build", "technical_implementation", "engineering_build", "systems_reliability"],
    bridgeGroups: ["technical_build", "product_service_strategy"],
    confidence: "medium",
    rationaleKo: "ETL/ELT 파이프라인 설계, 데이터 품질 관리, 모니터링, 저장소 운영이 핵심인 역할. 시스템 신뢰성·데이터 흐름·디버깅 역량을 가진 기술직에서 일부 전환 가능성이 있으며, SQL·Python·Airflow·Spark·클라우드 저장소 경험이 없으면 전환 준비가 추가로 필요합니다."
  },

  // ── HR (4 jobs) ──────────────────────────────────────────────────────────

  JOB_HR_ORGANIZATION_RECRUITING: {
    capabilityClusters: ["stakeholder_support", "relationship_management", "execution_operations", "persuasion_proposal"],
    workingMotionTags: ["candidate_facing", "process_execution", "coordination_heavy"],
    bridgeGroups: ["people_ops"],
    confidence: "medium",
    rationaleKo: "후보자/현업을 조율하며 채용 과정을 운영하고 설득하는 역할"
  },

  JOB_HR_ORGANIZATION_HRBP: {
    capabilityClusters: ["stakeholder_support", "relationship_management", "planning_structuring", "crossfunctional_alignment"],
    workingMotionTags: ["internal_partnering", "people_strategy_support", "organizational_alignment"],
    bridgeGroups: ["people_ops"],
    confidence: "medium",
    rationaleKo: "조직 이슈를 이해하고 현업과 사람 이슈를 함께 풀어가는 파트너 역할"
  },

  JOB_HR_ORGANIZATION_HR_PLANNING: {
    capabilityClusters: ["planning_structuring", "crossfunctional_alignment", "stakeholder_support", "analysis_optimization"],
    workingMotionTags: ["hr_strategy", "org_design", "policy_development"],
    bridgeGroups: ["people_ops", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "인사 전략과 정책을 설계하고 조직 구조와 인력 계획을 수립하는 역할로 채용·HRBP와 다르게 구조 설계 비중이 큼"
  },

  JOB_HR_ORGANIZATION_HR_OPS: {
    capabilityClusters: ["execution_operations", "stakeholder_support", "crossfunctional_alignment"],
    workingMotionTags: ["hr_process_execution", "admin_coordination", "compliance_tracking"],
    bridgeGroups: ["people_ops"],
    confidence: "medium",
    rationaleKo: "인사 프로세스를 실제로 운영하고 시스템/행정을 관리하는 역할로 전략보다 실행 비중이 압도적으로 큼"
  },

  JOB_BUSINESS_MERCHANDISING: {
    capabilityClusters: ["planning_structuring", "analysis_optimization", "stakeholder_support", "commercial_strategy"],
    workingMotionTags: ["product_strategy", "sales_performance", "vendor_coordination"],
    bridgeGroups: ["commercial_gtm"],
    confidence: "medium",
    rationaleKo: "상품 구성, 카테고리 전략, 판매 흐름과 고객 반응을 다루는 역할"
  },

  // ── CUSTOMER OPERATIONS (4 jobs) ─────────────────────────────────────────

  JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS: {
    capabilityClusters: ["execution_operations", "stakeholder_support", "analysis_optimization", "crossfunctional_alignment"],
    workingMotionTags: ["ops_execution", "process_improvement", "customer_journey"],
    bridgeGroups: ["customer_service_ops"],
    confidence: "medium",
    rationaleKo: "커머스 구매 흐름을 운영하고 개선하는 역할"
  },

  JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS: {
    capabilityClusters: ["execution_operations", "stakeholder_support", "analysis_optimization", "crossfunctional_alignment"],
    workingMotionTags: ["ops_execution", "service_stability", "process_improvement"],
    bridgeGroups: ["customer_service_ops"],
    confidence: "medium",
    rationaleKo: "운영 품질과 프로세스 개선, 현업 지원이 중심인 역할"
  },

  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS: {
    capabilityClusters: ["relationship_management", "stakeholder_support", "customer_discovery", "product_service_translation", "crossfunctional_alignment"],
    workingMotionTags: ["customer_facing", "retention_or_adoption", "problem_resolution"],
    bridgeGroups: ["customer_service_ops", "commercial_gtm"],
    confidence: "medium",
    rationaleKo: "고객의 문제를 풀고 제품 가치 실현을 지원하며 내부와도 강하게 연결되는 역할"
  },

  JOB_CUSTOMER_OPERATIONS_CX_PLANNING: {
    capabilityClusters: ["customer_discovery", "planning_structuring", "analysis_optimization", "crossfunctional_alignment"],
    workingMotionTags: ["customer_facing", "process_improvement", "ops_strategy"],
    bridgeGroups: ["customer_service_ops"],
    confidence: "medium",
    rationaleKo: "고객 여정, VOC, 접점별 불편을 구조화하고 서비스 개선 과제를 정의하며 유관 부서와 협력하는 역할"
  },

  // @MX:NOTE: 운영기획(OPERATION_PLANNING) vs 사업운영관리(OPERATIONS_MANAGEMENT) — 고객 서비스 접점 최적화 vs 전사 실행 거버넌스.
  JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING: {
    capabilityClusters: ["planning_structuring", "analysis_optimization", "crossfunctional_alignment", "execution_operations"],
    workingMotionTags: ["ops_strategy", "process_improvement", "performance_tracking"],
    bridgeGroups: ["customer_service_ops", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "운영 전반의 방향과 프로세스를 설계하고 개선하는 역할로 직접 운영보다 기획·분석 비중이 더 큼"
  },

  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS: {
    capabilityClusters: ["stakeholder_support", "execution_operations", "relationship_management"],
    workingMotionTags: ["customer_facing", "issue_resolution", "process_execution"],
    bridgeGroups: ["customer_service_ops"],
    confidence: "medium",
    rationaleKo: "고객 문의·불만을 직접 처리하고 빠르게 해결하는 역할로 고객성공(CS)보다 단건 처리·대응 중심"
  },

  // ── FINANCE (3 jobs) ─────────────────────────────────────────────────────
  // @MX:NOTE: 회계(ACCOUNTING) / FP&A / 관리회계(MANAGEMENT_ACCOUNTING) — 시간 축(과거/미래/현재)과 독자(외부/경영진/운영팀)가 다름.

  JOB_FINANCE_ACCOUNTING_ACCOUNTING: {
    capabilityClusters: ["domain_technical_depth", "execution_operations", "analysis_optimization"],
    workingMotionTags: ["accuracy_control", "rule_based_execution", "financial_reporting"],
    bridgeGroups: ["finance_planning_control"],
    confidence: "medium",
    rationaleKo: "정확성과 규정 기반 처리, 재무 데이터 정리가 핵심인 역할"
  },

  JOB_FINANCE_ACCOUNTING_FP_AND_A: {
    capabilityClusters: ["analysis_optimization", "planning_structuring", "market_insight", "crossfunctional_alignment"],
    workingMotionTags: ["financial_planning", "business_decision_support", "forecasting"],
    bridgeGroups: ["finance_planning_control", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "숫자를 해석해 계획과 의사결정을 지원하는 역할"
  },

  JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING: {
    capabilityClusters: ["analysis_optimization", "domain_technical_depth", "planning_structuring", "crossfunctional_alignment"],
    workingMotionTags: ["cost_control", "management_reporting", "variance_analysis"],
    bridgeGroups: ["finance_planning_control", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "원가·예산·성과를 분석하고 경영진의 의사결정을 지원하는 역할로 외부 보고 중심인 회계와 달리 내부 관리 초점"
  },

  // ── ENGINEERING DEVELOPMENT (2 jobs) ─────────────────────────────────────

  JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN: {
    capabilityClusters: ["domain_technical_depth", "planning_structuring", "analysis_optimization"],
    workingMotionTags: ["engineering_design", "technical_problem_solving", "specification_driven"],
    bridgeGroups: ["technical_build"],
    confidence: "medium",
    rationaleKo: "공학적 전문지식과 설계 문제 해결이 핵심인 역할"
  },

  JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT: {
    capabilityClusters: ["domain_technical_depth", "execution_operations", "analysis_optimization"],
    workingMotionTags: ["technical_implementation", "engineering_build", "specification_driven"],
    bridgeGroups: ["technical_build"],
    confidence: "high",
    rationaleKo: "코드를 직접 작성하고 시스템을 구현하는 역할로 전문 기술 수행이 핵심"
  },

  JOB_ENGINEERING_DEVELOPMENT_EMBEDDED_DEVELOPMENT: {
    capabilityClusters: ["domain_technical_depth", "execution_operations", "analysis_optimization"],
    workingMotionTags: ["technical_implementation", "engineering_build", "systems_reliability", "data_collection_processing"],
    bridgeGroups: ["technical_build"],
    confidence: "medium",
    rationaleKo: "MCU·펌웨어 구현이 핵심이지만, 센서·장비·로그 데이터를 안정적으로 수집·처리·전송한 경험은 데이터 수집 파이프라인과 운영 모니터링 관점으로 일부 전환될 수 있습니다. SQL/ETL/클라우드 경험이 없으면 전환 리스크가 크지만, 시스템 신뢰성·디버깅·데이터 흐름 설계 감각은 브릿지 시작점이 됩니다."
  },

  // ── MANUFACTURING / QUALITY / PRODUCTION (4 jobs) ────────────────────────

  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING: {
    capabilityClusters: ["execution_operations", "analysis_optimization", "domain_technical_depth", "crossfunctional_alignment"],
    workingMotionTags: ["factory_execution", "process_improvement", "technical_operations"],
    bridgeGroups: ["industrial_operations"],
    confidence: "medium",
    rationaleKo: "생산 현장 실행과 개선, 기술적 운영 안정화가 중심인 역할"
  },

  JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING: {
    capabilityClusters: ["domain_technical_depth", "planning_structuring", "analysis_optimization", "crossfunctional_alignment"],
    workingMotionTags: ["process_design", "technical_problem_solving", "scaleup_or_optimization"],
    bridgeGroups: ["industrial_operations", "technical_build"],
    confidence: "medium",
    rationaleKo: "공정 자체를 설계하고 개선하는 개발 성격이 더 강한 역할"
  },

  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT: {
    capabilityClusters: ["execution_operations", "planning_structuring", "crossfunctional_alignment", "analysis_optimization"],
    workingMotionTags: ["production_scheduling", "capacity_planning", "supply_coordination"],
    bridgeGroups: ["industrial_operations", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "생산 일정과 자원을 계획하고 실행을 조율하는 역할로 생산기술보다 일정·물량 관리 비중이 큼"
  },

  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA: {
    capabilityClusters: ["domain_technical_depth", "execution_operations", "analysis_optimization", "planning_structuring"],
    workingMotionTags: ["quality_governance", "standards_compliance", "audit_verification"],
    bridgeGroups: ["industrial_operations", "technical_build"],
    confidence: "medium",
    rationaleKo: "품질 기준을 설계하고 공정·제품의 적합성을 검증하는 역할로 현장 실행보다 기준·감사 비중이 큼"
  },

  // ── RESEARCH / PROFESSIONAL (1 job) ──────────────────────────────────────

  JOB_RESEARCH_PROFESSIONAL_CONSULTING: {
    capabilityClusters: ["planning_structuring", "market_insight", "analysis_optimization", "crossfunctional_alignment", "stakeholder_support"],
    workingMotionTags: ["structured_problem_solving", "advisory_delivery", "client_engagement"],
    bridgeGroups: ["research_advisory", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "복잡한 사업 문제를 구조화하고 분석해 의뢰인에게 실행 가능한 권고를 제시하는 역할"
  }
};
