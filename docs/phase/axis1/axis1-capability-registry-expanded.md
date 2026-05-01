# Axis 1 Capability Registry — Expanded Draft (40 Jobs)

- date: 2026-04-20
- scope: DESIGN ONLY. No production patch. Expanded from 20 → 40 jobs.
- depends on: docs/axis1-capability-registry-draft.md, docs/axis1-capability-registry-gap-analysis.md

---

## Files Inspected This Round

- `docs/axis1-capability-registry-draft.md` — baseline 20-job draft
- `docs/axis1-capability-registry-gap-analysis.md` — verified additional 20 IDs
- `src/data/job/ontology/sales/*.js` — subVertical confirmation
- `src/data/job/ontology/business/*.js` — subVertical confirmation
- `src/data/job/ontology/customer_operations/*.js` — subVertical confirmation
- `src/data/job/ontology/finance_accounting/*.js` — subVertical confirmation
- `src/data/job/ontology/manufacturing_quality_production/*.js` — subVertical confirmation
- `src/data/job/ontology/it_data_digital/*.js` — subVertical confirmation
- `src/data/job/ontology/research_professional/*.js` — subVertical confirmation

---

## Section 1: Executive Summary

- 40개 직무 registry draft 완성 ✅
- bridgeGroup 정규화 완료 (기존 ~25개 ad-hoc → 10개 정규 그룹) ✅
- ambiguity/intent split 5개 항목 별도 가이드로 정리 ✅
- 12개 capability cluster 유지 결정 — v1 40-job coverage에 충분히 버팀 ✅
- 추가 20개 직무 전원 live ID 검증 완료 ✅
- JOB_SALES_SALES_OPERATIONS, JOB_BUSINESS_STRATEGY — gap analysis에서 이미 verified ✅
- 모든 bridgeGroup이 old draft의 GTM 편향에서 벗어나 균형적으로 분배됨 ✅
- explanation template 5-case 기준으로 40-job coverage 점검 완료 — 추가 수정 필요한 문구 2건 명시 ✅
- defer list 확정: Design/Education/Public Admin/Legal/Deep Specialist Engineering — v1 scope 밖 ✅
- 이번 라운드 결과: READY FOR FINAL BODY ✅
- 사람이 이 draft를 받아 final `jobCapabilityClusterRegistry.js` 본문을 직접 작성 가능한 수준

---

## Section 2: Baseline Recheck

| 항목 | 수치 |
|---|---|
| 기존 draft 경로 | `docs/axis1-capability-registry-draft.md` |
| 기존 drafted count | 20 |
| 이번 추가 대상 count | 20 |
| 최종 expanded drafted count | **40** |
| mismatch / ambiguity count | 5개 intent split (아래 Section 6에서 처리) |
| 기존 mismatch (ID 교정) | 11개 — 이미 gap analysis에서 처리 완료 |
| intended code path | `src/data/transitionLite/jobCapabilityClusterRegistry.js` |

---

## Section 3: Final Capability Cluster Recheck

**결론: 현재 12개 cluster 유지.**

| Cluster | 유지 판단 이유 |
|---|---|
| customer_discovery | 40개 전 직무에서 충분히 분화됨 |
| persuasion_proposal | 영업/제안/컨설팅 구분에 유효 |
| market_insight | GTM-전략-데이터 계열 공통 |
| message_positioning | 마케팅 내부 분화에 핵심 |
| relationship_management | CS-영업-HR 구분에 핵심 |
| crossfunctional_alignment | PM-기획-HR 계열 공통 |
| execution_operations | 운영/실행 직무 구분에 핵심 |
| analysis_optimization | 데이터/FP&A/퍼포먼스 구분에 핵심 |
| product_service_translation | PM-PMM-솔루션영업 구분에 필수 |
| planning_structuring | 기획 계열 전 직무에 분화됨 |
| stakeholder_support | HR-CS-운영 계열 구분에 유효 |
| domain_technical_depth | 기술/공학/전문직 구분에 핵심 |

**v2 검토 노트 (이번 라운드 미반영):**
- `domain_technical_depth`가 소프트웨어 vs 산업/제조 기술을 구분하지 못함 → v2에서 `software_technical_depth` / `industrial_technical_depth` 분리 검토
- `stakeholder_support`와 `crossfunctional_alignment`의 경계가 HR Ops/운영관리 구간에서 모호해짐 → v2에서 정의 강화 필요

---

## Section 4: Final Normalized BridgeGroup Taxonomy

### 10개 정규 그룹

| bridgeGroup | 한국어 의미 | 묶는 역할군 | 대표 직무 |
|---|---|---|---|
| `commercial_gtm` | GTM·영업·마케팅 성장 | 영업 전 계열, 마케팅 전 계열 | GENERAL_SALES, BRAND_MARKETING, PERFORMANCE_MARKETING |
| `product_service_strategy` | 제품·서비스·IT 전략 | PM, PMM, IT기획, 데이터분석 | PRODUCT_MANAGEMENT, PMM, IT_PLANNING, DATA_ANALYSIS |
| `business_planning_ops` | 사업기획·운영 전략 | 전략기획, 사업기획, 운영관리, PM(프로젝트) | BUSINESS_PLANNING, STRATEGY, PROJECT_MANAGEMENT, SALES_OPERATIONS |
| `people_ops` | 사람 운영·조직 전반 | HR 전 계열 | RECRUITING, HRBP, HR_PLANNING, HR_OPS |
| `customer_service_ops` | 고객 서비스·운영 | CS, 고객성공, 서비스운영, 운영기획 | CUSTOMER_SUCCESS, SERVICE_OPERATIONS, CUSTOMER_SUPPORT_CS, OPERATION_PLANNING |
| `finance_planning_control` | 재무 계획·통제 | 회계, FP&A, 관리회계, 재무 | ACCOUNTING, FP_AND_A, MANAGEMENT_ACCOUNTING |
| `industrial_operations` | 제조·생산·품질 운영 | 생산, 공정, 품질보증, 제조혁신 | PRODUCTION_ENGINEERING, PROCESS_ENGINEERING, PRODUCTION_MANAGEMENT, QUALITY_ASSURANCE_QA |
| `technical_build` | 기술 구현·설계 개발 | 소프트웨어개발, 기계설계, 엔지니어링 개발 | SOFTWARE_DEVELOPMENT, MECHANICAL_DESIGN |
| `research_advisory` | 리서치·자문·분석 전문직 | 컨설팅, 시장조사, 전문가 평가 | CONSULTING |
| `supplier_partner_network` | 파트너·공급망 네트워크 | 파트너영업, BD, 구매/SCM | PARTNER_CHANNEL_SALES, BUSINESS_DEVELOPMENT |

---

### Old → New Migration Mapping

| Old bridgeGroup (기존 ad-hoc) | New bridgeGroup (정규화) | 비고 |
|---|---|---|
| commercial_gtm | commercial_gtm | 유지 |
| customer_facing_growth | commercial_gtm | 병합 |
| complex_b2b_motion | commercial_gtm | 병합 |
| partner_ecosystem | supplier_partner_network | 명칭 변경 |
| solution_consultative | commercial_gtm | 병합 |
| brand_message_strategy | commercial_gtm | 병합 |
| product_gtm | product_service_strategy | 명칭 변경 |
| content_message_execution | commercial_gtm | 병합 |
| performance_growth | commercial_gtm | 병합 |
| business_strategy_planning | business_planning_ops | 명칭 변경 |
| product_building | product_service_strategy | 병합 |
| customer_problem_solving | customer_service_ops | 병합 |
| people_operations | people_ops | 명칭 변경 |
| talent_acquisition | people_ops | 병합 |
| service_delivery_operations | customer_service_ops | 병합 |
| internal_execution | business_planning_ops | 병합 |
| post_sales_value_delivery | customer_service_ops | 병합 |
| finance_control | finance_planning_control | 명칭 변경 |
| financial_operations | finance_planning_control | 병합 |
| finance_strategy | finance_planning_control | 병합 |
| business_planning_support | business_planning_ops | 병합 |
| engineering_design_build | technical_build | 명칭 변경 |
| technical_execution | technical_build | 병합 |
| manufacturing_execution | industrial_operations | 명칭 변경 |
| industrial_process | industrial_operations | 병합 |
| engineering_development | industrial_operations | PROCESS_ENGINEERING 맥락에 더 적합 |
| data_decision_support | product_service_strategy | 병합 |
| business_analysis | business_planning_ops | 병합 |
| hr_business_partnering | people_ops | 병합 |

---

## Section 5: Expanded Registry Draft (40 Jobs)

```js
// src/data/transitionLite/jobCapabilityClusterRegistry.js
// DRAFT — NOT production code. Do not import until Round 3 rollout.
// date: 2026-04-20 | coverage: 40 jobs | clusters: 12 | bridgeGroups: 10

export const JOB_CAPABILITY_CLUSTER_REGISTRY = {

  // ══════════════════════════════════════════════════════════════════════
  // SALES (6 jobs)
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // MARKETING (6 jobs)
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // BUSINESS (7 jobs)
  // ══════════════════════════════════════════════════════════════════════

  JOB_BUSINESS_BUSINESS_PLANNING: {
    capabilityClusters: ["planning_structuring", "market_insight", "crossfunctional_alignment", "analysis_optimization"],
    workingMotionTags: ["planning_heavy", "internal_alignment", "growth_or_business_decision_support"],
    bridgeGroups: ["business_planning_ops", "commercial_gtm"],
    confidence: "medium",
    rationaleKo: "시장/사업 정보를 구조화해 방향과 실행 우선순위를 설계하는 역할"
  },

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

  JOB_BUSINESS_PROJECT_MANAGEMENT: {
    capabilityClusters: ["planning_structuring", "crossfunctional_alignment", "execution_operations", "stakeholder_support"],
    workingMotionTags: ["project_delivery", "timeline_management", "cross_team_coordination"],
    bridgeGroups: ["business_planning_ops"],
    confidence: "medium",
    rationaleKo: "프로젝트 일정과 리소스를 조율하고 성과 달성까지 책임지는 역할로, IT 제품 중심이 아닌 사업/조직 프로젝트 중심"
  },

  JOB_SALES_SALES_OPERATIONS: {
    capabilityClusters: ["execution_operations", "analysis_optimization", "planning_structuring", "crossfunctional_alignment"],
    workingMotionTags: ["internal_ops", "data_feedback_loop", "sales_enablement"],
    bridgeGroups: ["commercial_gtm", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "영업 성과를 분석하고 영업 프로세스와 도구를 운영·개선하는 내부 지원 역할"
  },

  // ══════════════════════════════════════════════════════════════════════
  // PRODUCT / IT / DATA (3 jobs)
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // HR (4 jobs)
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // CUSTOMER OPERATIONS (4 jobs)
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // FINANCE (3 jobs)
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // ENGINEERING DEVELOPMENT (2 jobs)
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // MANUFACTURING / QUALITY / PRODUCTION (4 jobs)
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // RESEARCH / PROFESSIONAL (1 job)
  // ══════════════════════════════════════════════════════════════════════

  JOB_RESEARCH_PROFESSIONAL_CONSULTING: {
    capabilityClusters: ["planning_structuring", "market_insight", "analysis_optimization", "crossfunctional_alignment", "stakeholder_support"],
    workingMotionTags: ["structured_problem_solving", "advisory_delivery", "client_engagement"],
    bridgeGroups: ["research_advisory", "business_planning_ops"],
    confidence: "medium",
    rationaleKo: "복잡한 사업 문제를 구조화하고 분석해 의뢰인에게 실행 가능한 권고를 제시하는 역할"
  }
};

// ══════════════════════════════════════════════════════════════════════════
// CAPABILITY CLUSTER TAXONOMY (12 clusters — unchanged from draft v1)
// ══════════════════════════════════════════════════════════════════════════

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
```

---

## Section 6: Ambiguity / Intent Split Guide

### 1. 전략기획 vs 사업기획
| 항목 | JOB_BUSINESS_STRATEGY | JOB_BUSINESS_BUSINESS_PLANNING |
|---|---|---|
| capabilityClusters 차이 | planning_structuring + market_insight + analysis_optimization | planning_structuring + market_insight + crossfunctional_alignment + analysis_optimization — 동일 기반 |
| workingMotionTags 차이 | strategic_planning, long_range_direction, executive_decision_support | planning_heavy, internal_alignment, growth_or_business_decision_support |
| 핵심 구분 | 전사 수준 중장기 방향 설계 / 추상도 높음 / CEO·이사회 레벨 결과물 | 사업부 수준 계획 수립 / 실행 가능한 로드맵 / 팀·사업부 실행 지원 |
| 왜 같은 걸로 취급하면 안 되는지 | 전략기획은 의사결정 구조 자체를 설계, 사업기획은 실행 계획을 만듦. 전환 시 요구되는 추상도와 이해관계자 레벨이 다름 |
| user-facing 분기 시사점 | "사업기획 경험이 전략기획으로 바로 이어지진 않습니다 — 레벨 차이가 있습니다" |

### 2. 서비스기획 vs IT기획
| 항목 | JOB_BUSINESS_SERVICE_PLANNING | JOB_IT_DATA_DIGITAL_IT_PLANNING |
|---|---|---|
| capabilityClusters 차이 | planning_structuring + customer_discovery + product_service_translation + crossfunctional_alignment | planning_structuring + crossfunctional_alignment + product_service_translation + analysis_optimization |
| workingMotionTags 차이 | service_design, feature_definition, user_flow_planning | it_strategy, system_roadmap, vendor_coordination |
| 핵심 구분 | 사용자 경험 흐름과 서비스 요구사항 중심 (비개발 맥락 가능) | IT 인프라·시스템 방향과 투자 계획 중심 (기술 맥락 필요) |
| 왜 같은 걸로 취급하면 안 되는지 | 서비스기획은 사용자 관점에서 기획, IT기획은 시스템 관점에서 기획. "서비스기획자"가 IT예산 전략을 바로 다루기 어려움 |
| user-facing 분기 시사점 | "서비스기획과 IT기획은 이름이 비슷해도 요구되는 기술 맥락이 다릅니다" |

### 3. 프로덕트 PM vs 프로젝트 PM
| 항목 | JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT | JOB_BUSINESS_PROJECT_MANAGEMENT |
|---|---|---|
| capabilityClusters 차이 | customer_discovery + product_service_translation 포함 | stakeholder_support 더 강조, product 계열 없음 |
| workingMotionTags 차이 | product_decision_making, user_problem_framing | project_delivery, timeline_management |
| 핵심 구분 | 무엇을 만들지 결정하는 역할 (why & what) | 어떻게 완료할지 관리하는 역할 (how & when) |
| 왜 같은 걸로 취급하면 안 되는지 | PM(Product)은 제품 방향 결정권이 있고, PM(Project)은 실행 완료 책임이 있음. 전환 시 요구되는 판단 유형이 근본적으로 다름 |
| user-facing 분기 시사점 | "'PM 경험이 있다'는 말은 제품 PM인지 프로젝트 PM인지에 따라 해석이 완전히 달라집니다" |

### 4. 고객운영기획 vs 사업운영관리
| 항목 | JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING | JOB_BUSINESS_OPERATIONS_MANAGEMENT |
|---|---|---|
| capabilityClusters 차이 | customer_service_ops bridgeGroup 포함 | business_planning_ops 더 강함 |
| workingMotionTags 차이 | ops_strategy, process_improvement, performance_tracking | operational_governance, process_management, internal_alignment |
| 핵심 구분 | 고객 서비스 접점의 운영 방향 설계 | 사업부 전체의 실행 거버넌스 관리 |
| 왜 같은 걸로 취급하면 안 되는지 | 운영기획은 CS/서비스 접점 최적화 중심, 사업운영관리는 전사 실행 구조 조율 중심. 이해관계자와 성과 지표가 다름 |
| user-facing 분기 시사점 | "운영기획 경험이 사업운영관리 역할에 바로 이어지는 경우도 있지만, 이해관계자 레벨 차이를 확인해야 합니다" |

### 5. 회계 vs 재무 vs 관리회계
| 항목 | JOB_FINANCE_ACCOUNTING_ACCOUNTING | JOB_FINANCE_ACCOUNTING_FP_AND_A | JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING |
|---|---|---|---|
| capabilityClusters 차이 | domain_technical_depth 가장 강함 | planning_structuring + market_insight 더 강함 | analysis_optimization + planning_structuring; 중간 위치 |
| workingMotionTags 차이 | accuracy_control, rule_based_execution | financial_planning, forecasting | cost_control, management_reporting, variance_analysis |
| 핵심 구분 | 외부 보고 기준 정확한 기록/마감 | 미래 방향 계획과 예측 | 내부 원가/성과 분석 |
| 왜 같은 걸로 취급하면 안 되는지 | 세 역할은 다루는 시간 축(과거/현재/미래)과 독자(외부/경영진/운영팀)가 다름. "재무 경험" 한 마디로는 어느 유형인지 알 수 없음 |
| user-facing 분기 시사점 | "회계/재무/관리회계는 같은 숫자를 다루지만 목적과 방향이 다릅니다 — 어떤 유형의 재무 업무를 했는지가 중요합니다" |

---

## Section 7: Explanation Scalability Check

**기존 5-case 템플릿은 40-job coverage에서도 대체로 버팀.**

추가 수정이 필요한 케이스 2건:

### 수정 1: adjacent same-domain — 기획 계열 분화 케이스 추가

기존 템플릿에 아래 문구를 추가로 활용 가능:
```
positive[0]: "기존 기획 경험의 핵심 구조가 이어지기 때문에 완전히 새로 시작하는 전환은 아닙니다."
positive[1]: "업무에서 다루는 언어와 협업 흐름이 비슷해서 진입 비용이 크지 않은 편입니다."
caution[0]: "다만 목표 직무에서 더 요구되는 실무 깊이나 이해관계자 레벨 차이는 별도로 확인이 필요합니다."
caution[1]: "같은 기획이라도 어떤 수준에서 해왔는지가 면접에서 더 중요하게 작용할 수 있습니다."
```
활용 케이스: BUSINESS_PLANNING → STRATEGY, SERVICE_PLANNING → IT_PLANNING, HR_PLANNING → HRBP

### 수정 2: bridgeable cross-family — 운영/기획 혼합 케이스 추가

기존 템플릿에 아래 문구를 추가로 활용 가능:
```
positive[0]: "실행 운영과 기획 양쪽 경험이 있다면, 그 조합 자체가 전이 가능한 근거가 됩니다."
positive[1]: "직접 운영을 해봤다는 것은 기획 역할에서도 실행 감각으로 활용될 수 있습니다."
caution[0]: "다만 기획 결과물을 직접 만들어본 경험이 있는지는 별도로 확인이 필요합니다."
caution[1]: "운영 경험이 있다고 해서 기획 논리 구조가 자동으로 따라오지는 않습니다."
```
활용 케이스: SERVICE_OPERATIONS → OPERATION_PLANNING, HR_OPS → HR_PLANNING, CUSTOMER_SUPPORT_CS → CUSTOMER_SUCCESS

기존 3, 4, 5번 케이스 (bridgeable, deceptive, truly distant) 템플릿은 변경 없이 40-job 전체에 적용 가능.

---

## Section 8: Remaining Defer List

| 직무 계열 | 구체 직무 | 미포함 이유 | 추후 조건 |
|---|---|---|---|
| Design 전체 | UI/UX, 그래픽, 브랜드디자인 | visual-creative 전용 cluster 미정의 | v2: visual_communication cluster 추가 후 |
| Education / Counseling | 강사, 코치, 상담사 | people_development 전용 cluster 없음 | v2: people_development cluster 추가 후 |
| Public Administration Support | 행정, 공공기관 지원 | 공공기관 고유 맥락은 현재 bridgeGroup 체계와 맞지 않음 | v2: institutional_operations bridgeGroup 추가 후 |
| Legal / Regulatory / Policy | 법무, RA, 정책 연구 | governance_compliance cluster 없음 | v2: domain_technical_depth 분화 또는 신규 cluster 추가 후 |
| Deep Specialist Engineering | 회로설계, 임베디드, 시스템엔지니어링, AI/ML, DevOps, 보안 | domain_technical_depth 하나로 묶기엔 전문성 차이가 너무 큼; v1 bridge case에 영향 없음 | v2: software_technical_depth / industrial_technical_depth 분리 후 |
| Medium-priority marketing | PR, 마케팅리서치 | 현재 bridge case 우선순위 밖; cluster coverage 충분 | 다음 확장 라운드 |
| HR 전문직 | 보상/복지, 노무 | 특수 전문성 — 현재 HR bridge case 해결에 불필요 | 다음 확장 라운드 |
| Procurement / SCM | 구매, 공급망 | supplier_partner_network 커버 있으나 세부 충분히 검증 못함 | ID 검증 후 다음 라운드 |

---

## Section 9: Coverage Threshold Decision

**판정: READY FOR FINAL BODY**

이유:
- 40개 직무 전원 live ID 검증 완료, copy-pasteable JS 본문 작성 완료
- 주요 bridge case 전부 커버: GTM(영업↔마케팅), 기획 계열(전략↔사업), PM 계열(제품↔서비스), HR 계열(채용↔HRBP↔인사기획), CS 계열, 재무 계열, 제조 계열
- bridgeGroup 정규화 완료 — 10개 그룹으로 운영 가능한 수준
- 12-cluster 체계는 v1 scope에서 충분함

남은 리스크:
- `domain_technical_depth`가 소프트웨어/산업 기술을 구분 못함 — v2 전에 사람이 cluster 분리 여부 결정 필요
- `stakeholder_support` / `crossfunctional_alignment` 경계가 HR Ops, 운영관리 구간에서 모호 — 추후 weight 조정으로 완화 가능
- 신규 workingMotionTags는 Round 3에서 실제 소비 방식 확정 필요 (현재 이름만 정의)

**사람이 final registry 본문을 직접 작성해도 되는가: YES.**
이 draft를 그대로 `src/data/transitionLite/jobCapabilityClusterRegistry.js`에 붙여넣어 시작 가능.

---

## Section 10: Repo Docs Update

이 문서 자체가 `docs/axis1-capability-registry-expanded.md` 역할을 합니다.
bridgeGroup 정규화 상세는 `docs/axis1-bridgegroup-normalization.md`에 별도 저장됩니다.

### Next Decision Points

1. 사람이 이 draft를 기반으로 `src/data/transitionLite/jobCapabilityClusterRegistry.js` 실제 파일 생성
2. Round 1 (all-family signal read) 구현 시작 — `docs/axis1-next-rollout-blueprint.md` 참고
3. v2 cluster 분화 여부 결정: `domain_technical_depth` split, `visual_communication` 추가 검토

### Owner Assumptions (unchanged)

- score owner: `buildAxisConnectivityPack.js > scoreAxis1()`
- registry owner (new): `src/data/transitionLite/jobCapabilityClusterRegistry.js`
- explanation owner: `axisExplanationRegistry.js > buildJobStructureExplanation()`
- upstream: `classifyTransition.js > classifyJobDistance()`
