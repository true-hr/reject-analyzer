# Missing Items Checklist

## 직무 자산 요약

- primary inventory 대상: `src/lib/roleDictionary.js` `ROLE_RULES`
- inventoried job candidates: 49
- grade summary
  - Ready: 0
  - Partial: 0
  - Raw Material: 49
  - Reject for Now: 0

보조 참고만 수행한 파일:

- `src/lib/ontology/jobOntology.js`
- `src/lib/roleDistance.js`
- `src/lib/decision/roleOntology/canonicalRoleMap.js`

## 산업 자산 요약

- primary inventory 대상: `src/lib/semantic/taxonomy/domainTaxonomy.js` `PROCUREMENT_SCM_DOMAINS`
- inventoried industry candidates: 12
- grade summary
  - Ready: 0
  - Partial: 0
  - Raw Material: 12
  - Reject for Now: 0

보조 참고만 수행한 파일:

- `src/lib/semantic/taxonomy/hrTaxonomy.js`
- `src/lib/decision/roleOntology/domainTextMap.js`

## 분류표 대비 자산 없음

현재 inventory 기준으로 다음 상태가 확인된다.

- Phase 1 최소 스키마를 직접 충족하는 job item 없음
- Phase 1 최소 스키마를 직접 충족하는 industry item 없음
- `major/sub/label/aliases/families/axes/boundaryHints/summaryTemplate`가 함께 갖춰진 job asset 없음
- `major/sub/marketType/operatingRhythm/decisionStructure/proofSignals/summaryTemplate`가 함께 갖춰진 industry asset 없음

## 분류표 1개 자산 여러 개 후보

### job 쪽

- 전략/기획 계열
  - `corp_strategy`
  - `planning_budget_control`
  - `bizops_ops_strategy`
  - `finance_strategy_fpa`
- 구매/공급망 계열
  - `procurement_buyer`
  - `srm_vendor_mgmt`
  - `supply_chain_scm`
  - `logistics_trade`
  - `production_planning_control_ppc`
- PM 계열
  - `product_manager_pm`
  - `pmo_program_manager`
  - `project_manager_delivery`
  - `growth_pm`

### industry 쪽

- `procurement_scm` family 아래에 12개 domain candidate가 집중되어 있다.
- 즉 industry registry라기보다 특정 family 내부의 fine-domain taxonomy가 먼저 만들어진 상태다.

## 이름은 있으나 내용 빈약한 항목

### job

- 모든 `ROLE_RULES` item은 role/family/strong/weak/negative는 있지만
  - `aliases`
  - `axes`
  - `adjacentFamilies`
  - `boundaryHints`
  - `summaryTemplate`
  가 없다.

### industry

- `PROCUREMENT_SCM_DOMAINS` item은 aliases와 phrase bundle은 풍부하지만
  - `marketType`
  - `operatingRhythm`
  - `decisionStructure`
  - `proofSignals`
  - `domainIntensity`
  - `adjacentIndustries`
  - `jobInteractionHints`
  - `summaryTemplate`
  가 없다.

## 과분화 의심 항목

### job

- `strategy` family에 묶인 support/admin/procurement/scm 성격 role
  - `hr_people_ops_admin`
  - `general_affairs_admin`
  - `legal_compliance_support`
  - `biz_ops_management_support`
  - `planning_budget_control`
  - `finance_strategy_fpa`
  - `procurement_buyer`
  - `srm_vendor_mgmt`
  - `supply_chain_scm`
  - `logistics_trade`
  - `production_planning_control_ppc`

판정:

- family 명칭과 실제 role 성격이 넓게 섞여 있어 과분화 또는 잘못된 상위 family 편입 가능성이 있다.

### industry

- `PROCUREMENT_SCM_DOMAINS`는 industry registry라기보다 procurement/scm subdomain set이다.
- 따라서 industry SSOT 기준에서는 "산업"보다 "기능 도메인"으로 과분화되어 있을 가능성이 높다.

## id 규칙 재검토 필요 항목

### job

- `ROLE_RULES`의 role key 전반
  - 예: `comp_benefits_cnb`, `ml_engineer_mle`, `account_executive_ae`
- 이유:
  - 약어 suffix 포함
  - SSOT canonical id로 그대로 승격할지 불명확
  - label/alias 분리 없이 key가 곧 label 역할을 하고 있음

### industry

- `PROCUREMENT_SCM_DOMAINS.domain=*`
- 이유:
  - 현재는 domain key이지 Phase 1 industry canonical id가 아님
  - `IND_*` 규칙으로 바로 승격하기 전에 industry 분류표와 정합성 검토 필요

## 정규화 우선순위 제안

### P1: 거의 바로 정규화 가능한 항목

- `src/lib/roleDictionary.js` `corp_strategy`
- `src/lib/roleDictionary.js` `product_manager_pm`
- `src/lib/roleDictionary.js` `data_analyst_bi`
- `src/lib/roleDictionary.js` `sales_engineer_se`
- `src/lib/roleDictionary.js` `procurement_buyer`

사유:

- role key가 비교적 명확하다
- family 정보가 이미 있다
- strong/weak/negative signal이 있어 해석 원재료 밀도가 상대적으로 높다

### P2: 필수 필드만 보강하면 되는 항목

- 마케팅 세부 role 묶음
  - `performance_marketer`
  - `growth_marketer`
  - `brand_marketer`
  - `content_marketer`
  - `pr_communications`
- 세일즈 묶음
  - `account_executive_ae`
  - `customer_success_cs`
  - `partnership_bd`
- 제조/엔지니어링 묶음
  - `process_engineer_mfg`
  - `quality_engineer_mfg`
  - `manufacturing_engineer_me`

### P3: 구조 재정리가 필요한 raw material

- `strategy` family에 과적재된 support/admin/procurement/scm role 전체
- `src/lib/semantic/taxonomy/domainTaxonomy.js` `PROCUREMENT_SCM_DOMAINS` 전체

사유:

- 상위 분류와 세부 자산의 단위가 Phase 1 schema와 맞지 않는다
- industry registry item으로 바로 승격하기 어렵다

### Hold: 지금은 보류할 항목

- `src/lib/ontology/jobOntology.js`
- `src/lib/roleDistance.js`
- `src/lib/decision/roleOntology/canonicalRoleMap.js`
- `src/lib/semantic/taxonomy/hrTaxonomy.js`
- `src/lib/decision/roleOntology/domainTextMap.js`

사유:

- Phase 1 문서에서 이미 legacy ontology / taxonomy / role map / text map은 보조 힌트로 규정했다
- 이번 inventory 단계에서는 primary source가 아니라 참고 자산으로만 유지하는 편이 안전하다
