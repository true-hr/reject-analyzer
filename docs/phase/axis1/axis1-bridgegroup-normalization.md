# Axis 1 BridgeGroup Normalization

- date: 2026-04-20
- scope: DESIGN ONLY. BridgeGroup taxonomy normalization from ~25 ad-hoc groups → 10 normalized groups.
- depends on: docs/axis1-capability-registry-expanded.md

---

## Problem

The first draft of `JOB_CAPABILITY_CLUSTER_REGISTRY` (docs/axis1-capability-registry-draft.md) used
approximately 25 ad-hoc bridgeGroup names with strong GTM bias and no naming convention.

Examples of old GTM sprawl:
- commercial_gtm, customer_facing_growth, complex_b2b_motion, partner_ecosystem,
  solution_consultative, brand_message_strategy, product_gtm, content_message_execution,
  performance_growth (9 groups just for GTM area)

Non-GTM areas were severely underrepresented:
- People: people_operations, talent_acquisition (2 groups, inconsistent)
- Finance: finance_control, financial_operations, finance_strategy (3 overlapping groups)
- Industrial: manufacturing_execution, industrial_process, engineering_development (3 overlapping)

---

## Normalized Taxonomy (10 groups)

### 1. `commercial_gtm`
- 한국어 의미: GTM·영업·마케팅 성장 활동
- 묶는 역할군: 영업 전 계열(일반영업, B2B, 솔루션, KAM, 파트너, 제안영업, 세일즈옵스), 마케팅 전 계열(브랜드, PMM, 콘텐츠, 퍼포먼스, CRM, 디지털), 사업기획 부분
- 대표 직무: JOB_SALES_GENERAL_SALES, JOB_MARKETING_BRAND_MARKETING, JOB_BUSINESS_BUSINESS_PLANNING
- 선정 이유: GTM 활동 전반을 하나의 그룹으로 묶어야 sales↔marketing 간 bridge 감지 가능

### 2. `product_service_strategy`
- 한국어 의미: 제품·서비스·IT 전략
- 묶는 역할군: 프로덕트 PM, PMM, IT기획, 서비스기획, 데이터분석
- 대표 직무: JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT, JOB_MARKETING_PRODUCT_MARKETING_PMM, JOB_IT_DATA_DIGITAL_IT_PLANNING, JOB_IT_DATA_DIGITAL_DATA_ANALYSIS
- 선정 이유: 제품/서비스/데이터를 전략적으로 다루는 역할군을 묶어야 PM↔PMM, PM↔데이터분석 bridge 감지 가능

### 3. `business_planning_ops`
- 한국어 의미: 사업기획·운영 전략
- 묶는 역할군: 전략기획, 사업기획, 프로젝트관리, 운영관리, 세일즈옵스, 컨설팅, FP&A, 관리회계
- 대표 직무: JOB_BUSINESS_STRATEGY, JOB_BUSINESS_BUSINESS_PLANNING, JOB_BUSINESS_PROJECT_MANAGEMENT, JOB_RESEARCH_PROFESSIONAL_CONSULTING
- 선정 이유: 기획·분석·운영 전략 계열을 묶어야 전략기획↔컨설팅, FP&A↔사업기획 bridge 감지 가능

### 4. `people_ops`
- 한국어 의미: 사람 운영·조직 전반
- 묶는 역할군: HR 전 계열(채용, HRBP, 인사기획, HR Ops, 노무, 보상)
- 대표 직무: JOB_HR_ORGANIZATION_RECRUITING, JOB_HR_ORGANIZATION_HRBP, JOB_HR_ORGANIZATION_HR_PLANNING, JOB_HR_ORGANIZATION_HR_OPS
- 선정 이유: HR 계열 내부 bridge(채용↔HRBP, HRBP↔인사기획) 감지를 위해 통합 필요

### 5. `customer_service_ops`
- 한국어 의미: 고객 서비스·운영
- 묶는 역할군: 고객성공(CS), 서비스운영, 운영기획, 고객상담(CS support), CRM마케팅
- 대표 직무: JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS, JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS, JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING, JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS
- 선정 이유: 고객 접점 역할군을 묶어야 CS support↔Customer Success, 서비스운영↔운영기획 bridge 감지 가능

### 6. `finance_planning_control`
- 한국어 의미: 재무 계획·통제
- 묶는 역할군: 회계(외부 보고), FP&A(계획·예측), 관리회계(내부 원가), 재무(자금)
- 대표 직무: JOB_FINANCE_ACCOUNTING_ACCOUNTING, JOB_FINANCE_ACCOUNTING_FP_AND_A, JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING
- 선정 이유: 재무 계열 내부 bridge(회계↔FP&A, FP&A↔관리회계) 감지를 위해 통합 필요

### 7. `industrial_operations`
- 한국어 의미: 제조·생산·품질 운영
- 묶는 역할군: 생산기술, 생산관리, 공정개발(공정엔지니어링), 품질보증, 제조혁신
- 대표 직무: JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING, JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING, JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT, JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA
- 선정 이유: 제조/생산 계열 내부 bridge 감지를 위해 통합 필요

### 8. `technical_build`
- 한국어 의미: 기술 구현·설계 개발
- 묶는 역할군: 소프트웨어개발, 기계설계, 회로설계, 임베디드, 시스템엔지니어링
- 대표 직무: JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT, JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN
- 선정 이유: 기술 구현 역할군을 분리해야 truly distant(영업↔소프트웨어개발) 판별 가능

### 9. `research_advisory`
- 한국어 의미: 리서치·자문·분석 전문직
- 묶는 역할군: 컨설팅, 시장/산업 리서치, 전문가 평가
- 대표 직무: JOB_RESEARCH_PROFESSIONAL_CONSULTING
- 선정 이유: 컨설팅↔전략기획 bridge 감지 및 리서치 계열 전문직 묶음

### 10. `supplier_partner_network`
- 한국어 의미: 파트너·공급망 네트워크
- 묶는 역할군: 파트너영업, BD(신사업개발), 구매/SCM
- 대표 직무: JOB_SALES_PARTNER_CHANNEL_SALES, JOB_BUSINESS_BUSINESS_DEVELOPMENT
- 선정 이유: 외부 파트너 네트워크를 통해 성과를 내는 역할군을 분리

---

## Migration Mapping (old → new)

| Old bridgeGroup | New bridgeGroup | 처리 방식 |
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

## Usage in Scoring (Round 4)

```js
// Bridge eligibility check (replaces AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST)
function getBridgeEligibility(currentJobId, targetJobId) {
  const current = JOB_CAPABILITY_CLUSTER_REGISTRY[currentJobId];
  const target = JOB_CAPABILITY_CLUSTER_REGISTRY[targetJobId];
  if (!current || !target) return { eligible: false, sharedGroups: [] };
  const shared = current.bridgeGroups.filter(g => target.bridgeGroups.includes(g));
  return { eligible: shared.length >= 1, sharedGroups: shared };
}
// → if eligible: bridge floor 40 (vs current hardcoded floor 20 for 4-job ALLOWLIST)
```

---

## Next Decision Point

- Round 4 구현 시 `applyAxis1WeakUmbrellaBridge()` 내 ALLOWLIST를 위 함수로 교체
- `supplier_partner_network`의 bridge floor 필요 여부 결정 (파트너↔BD는 현재 mid_high 기대치)
- v2 검토: `industrial_operations` + `technical_build` 경계 재정의 (QA가 양쪽에 걸침)
