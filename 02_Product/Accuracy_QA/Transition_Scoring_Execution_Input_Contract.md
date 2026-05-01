# PASSMAP Transition Scoring Execution Input Contract

## 목적
- Gold Set의 전문가 기대값 케이스를 PASSMAP에서 실제 실행 가능한 입력으로 변환하기 위한 계약을 정의한다.
- Gold Set만으로는 `model_score`, `model_grade`, 설명 출력을 만들 수 없기 때문에 실행 payload ownership을 분리한다.
- 이후 Round 실행 시 어떤 필드가 없어서 실행이 막히는지 명확히 추적할 수 있게 한다.

## 언제 이 문서를 쓰는가
- QA 실행 준비 단계에서 Gold Set 케이스를 runnable input으로 바꿀 때 쓴다.
- 새 Gold Set 케이스를 PASSMAP 실행 포맷으로 매핑할 때 쓴다.
- 어떤 케이스가 실행되지 않는 이유를 디버깅할 때 쓴다.

## 다른 문서와의 관계
- 평가 기준은 `Transition_Scoring_QA_Framework.md`를 따른다.
- 전문가 기대값 registry는 `Transition_Scoring_Gold_Set.md`가 owner다.
- 실제 실행 결과는 `05_Execution/Accuracy_QA_Log.md`에 남긴다.
- calibration 판단은 `05_Execution/Scoring_Calibration_Log.md`로 넘긴다.

## true execution owner 조사 결과
- 실제 점수/등급/설명 산출 owner는 `src/lib/analyzer.js`의 `analyze(state, ai)`다.
- 입력 canonicalization owner는 `src/lib/analysis/buildCanonicalAnalysisInput.js`다.
- 이유:
  - 테스트와 앱 실제 경로 모두 `analyze(state, null)` 또는 `analyze(__stateForAnalyze, __aiForAnalyze)`를 호출한다.
  - `analyze()` 내부에서 `buildCanonicalAnalysisInput(state)`를 먼저 호출해 raw state를 canonical payload로 정리한다.
  - 이후 구조 분석, decision pack, evidence fit, simulation view model을 모두 이 경로에서 만든다.
- `transition-lite` 경로는 보조 read/분류 자산 owner다.
  - `src/lib/transitionLite/buildTransitionLiteResult.js`와 관련 artifact는 canonical ID 기반 `jobDistance`, `industryDistance`, `targetJobRead`, `targetIndustryRead`를 만든다.
  - 그러나 Round 1에서 필요한 PASSMAP score/grade owner는 아니다.

## 최소 실행 입력 계약

### 실제 score 실행 최소값
- 필수
  - `jd`
    - 타입: string
    - 용도: JD 기대역량, must-have, 구조 신호, evidence fit 계산
  - `resume`
    - 타입: string
    - 용도: 경력 증거, 역할 적합성, risk signal 계산
  - `career`
    - 타입: object
    - 최소 필드: `totalYears`
    - 권장 필드: `gapMonths`, `jobChanges`, `lastTenureMonths`, `leadershipLevel`
- 근거
  - integration test와 trace script는 실제로 `analyze({ jd, resume, career })` 형태를 사용한다.
  - `analyze()` 내부 risk/evidence 계층은 `jdText`, `resumeText`, `careerSignals` 계열을 직접 읽는다.

### 전환 scoring 품질 검증에 필요한 구조화 선택값
- 강하게 권장
  - `roleCurrentResolved.id`
  - `roleTargetResolved.id`
  - `industryCurrentResolved.id`
  - `industryTargetResolved.id`
- 대응 raw field
  - `roleCurrent` / `currentRole`
  - `roleTarget` / `targetRole`
  - `industryCurrent`
  - `industryTarget`
- 근거
  - `buildCanonicalAnalysisInput.js`는 resolved selection을 `canonical.selectionResolved`에 보관한다.
  - `buildAxisConnectivityPack.js`는 `currentJobId`, `targetJobId`, `currentIndustryId`, `targetIndustryId`가 모두 있어야 동작한다.
  - transition-lite 기반 axis/classification read는 canonical ID가 있어야 안정적으로 재현된다.

### optional fields
- `selfCheck`
  - 타입: object
  - 없으면 실행은 가능하지만 보조 해석 신호가 줄어든다.
- `company`, `role`, `stage`, `portfolio`, `interviewNotes`
  - 타입: string
  - 없더라도 score 실행은 가능하다.
- `industryCurrentSub`, `industryTargetSub`, `roleCurrentSub`, `roleTargetSub`
  - 타입: string
  - 세부 표기 보조용이며 최소 실행 조건은 아니다.

## field canonical rule
- human-readable label만으로도 `analyze()` 자체는 실행 가능하다.
- 하지만 Round 1 전환 QA에서는 human-readable label만으로는 부족하다.
- 이유:
  - label만 있으면 텍스트 score는 돌릴 수 있어도, job/industry transition classification과 axis connectivity를 안정적으로 재현하기 어렵다.
  - 따라서 Round 1 runnable payload는 `라벨 + resolved canonical ID`를 함께 가지는 hybrid contract가 맞다.

## Gold Set -> Execution Payload mapping rule
- `current_job`
  - Gold Set의 한국어 라벨을 `roleCurrent`에 넣는다.
  - 가능하면 대응 `roleCurrentResolved.id`를 별도 매핑한다.
- `target_job`
  - Gold Set의 한국어 라벨을 `roleTarget`에 넣는다.
  - 가능하면 대응 `roleTargetResolved.id`를 별도 매핑한다.
- `current_industry`
  - Gold Set의 한국어 라벨을 `industryCurrent`에 넣는다.
  - 가능하면 대응 `industryCurrentResolved.id`를 별도 매핑한다.
- `target_industry`
  - Gold Set의 한국어 라벨을 `industryTarget`에 넣는다.
  - 가능하면 대응 `industryTargetResolved.id`를 별도 매핑한다.
- `years_of_experience`
  - `career.totalYears`로 변환한다.
- `experience_summary`
  - `resume`의 최소 근거 텍스트 초안으로 변환한다.
  - 그대로 한 줄 복사하지 말고 직무 증거, 협업, 성과/책임 범위가 드러나는 짧은 resume형 문장으로 정리해야 한다.
- 별도 준비 필요
  - `jd`
    - Gold Set에는 목표 직무/산업과 기대 등급만 있으므로, 목표 포지션의 최소 JD형 텍스트를 추가 설계해야 한다.

## Round 1 execution strategy
- Round 1은 pure structured payload only로 끝내면 안 된다.
- 권장 방식은 hybrid input이다.
  - structured payload
    - role/industry 라벨 + resolved canonical ID
    - career.totalYears 등 최소 career metadata
  - minimal evidence text
    - `resume`
    - `jd`
- 이유
  - 실제 score/risk/evidence 계산은 `analyze()` 내부에서 text evidence를 강하게 사용한다.
  - 반대로 transition classification과 axis read는 canonical ID가 있어야 안정적이다.

## 최소 evidence text contract
- `resume`
  - 2~4문장
  - 실제 수행 업무, 협업 대상, 산출물 또는 성과를 포함해야 한다.
  - Gold Set의 `experience_summary`를 그대로 쓰기보다 PASSMAP resume 입력 문장으로 정리해야 한다.
- `jd`
  - 2~4문장 또는 짧은 bullet 묶음
  - 최소 포함 요소
    - 주요업무
    - 자격요건 또는 필수 경험
  - 없어도 분류 일부는 가능하지만 score/grade 비교용 실행 계약으로는 불충분하다.

## grounded sample evidence
- 앱 샘플/trace와 integration test는 모두 `jd`와 `resume` 텍스트를 직접 넣어 `analyze()`를 호출한다.
- `tests/validate_wave1e.mjs`
  - `jd`, `resume`, `career`, `roleTargetResolved`, `roleCurrentResolved`, `industryTarget`
- `tests/integration/mismatchSmoke.test.mjs`
  - `jd`, `resume`, `career`
- `artifacts/transition-lite-safe-test-20260327.json`
  - transition-lite 전용 canonical ID input 예시
  - score owner가 아니라 classification/read owner 참고 자료

## starter mapping note
- 현재 조사만으로는 `TSG-001 ~ TSG-003`의 canonical ID를 확정하지 않았다.
- 이유
  - Gold Set은 한국어 visible label 중심이고, repository 내 canonical registry와 일대일 매핑을 아직 검증하지 않았다.
- 따라서 이번 라운드에서는 샘플 case별 canonical ID를 fabricate하지 않는다.

## unresolved questions / blockers
- 각 Gold Set 라벨이 실제 ontology/industry registry의 어떤 canonical ID와 1:1 매핑되는지 아직 확인되지 않았다.
- Gold Set의 `experience_summary`만으로 PASSMAP용 `resume` 텍스트를 충분히 표준화할지, 별도 resume template을 둘지 아직 잠기지 않았다.
- 목표 직무/산업별 `jd` 초안 owner를 Gold Set에 둘지 실행 input mapping layer에 둘지 후속 결정이 필요하다.

## next step
1. Gold Set 20건에 대해 `라벨 -> canonical ID` 매핑 표를 먼저 만든다.
2. 각 케이스에 `resume` 최소 증거 문장과 `jd` 최소 실행 문장을 붙인다.
3. 그 결과를 바탕으로 `ROUND-2026-04-02-A`의 pending table을 실제 PASSMAP output으로 채운다.

## Round 1 실행 payload 템플릿
```md
### TSG-000
- case_id:
- current_job_label:
- current_industry_label:
- target_job_label:
- target_industry_label:
- roleCurrentResolved.id:
- roleTargetResolved.id:
- industryCurrentResolved.id:
- industryTargetResolved.id:
- career.totalYears:
- resume:
- jd:
- payload_notes:
```

### 템플릿 운영 규칙
- `case_id`, `career.totalYears`, `resume`, `jd`는 Round 1 실행 최소 단위로 본다.
- `current_*_label`, `target_*_label`은 Gold Set visible label을 그대로 유지한다.
- `role*Resolved.id`, `industry*Resolved.id`는 repository 근거가 있을 때만 채운다.
- canonical ID를 아직 확정하지 못한 필드는 `확인 필요`로 명시하고 임의 값으로 대체하지 않는다.
- `resume`은 Gold Set의 `experience_summary`를 그대로 복붙하지 말고, PASSMAP 입력용 2~3문장으로 정리한다.
- `jd`는 목표 직무의 핵심 업무와 필수 기대역량을 담은 2~3문장 최소 텍스트로 고정한다.

## Gold Set label -> canonical mapping table
| label_type | gold_set_label | canonical_id | 근거 | 상태 |
|---|---|---|---|---|
| job | 운영기획 | `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING` | `customer_operations/operation_planning.js`, `artifacts/transition-lite-investigation-cases.json` | confirmed |
| industry | 온라인 커머스 | `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE` | `industry/registry/distribution_commerce_consumer_goods/online_commerce.js` | confirmed |
| industry | 오프라인 리테일 | `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_OFFLINE_RETAIL` | `industry/registry/distribution_commerce_consumer_goods/offline_retail.js` | confirmed |
| job | B2B 영업 | `JOB_SALES_B2B_SALES` | `job/ontology/sales/b2b_sales.js`, `artifacts/transition-lite-investigation-cases.json` | confirmed |
| industry | B2B SaaS | `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS` | `industry/registry/it_software_platform/b2b_saas.js` | confirmed |
| job | 솔루션 영업 | `JOB_SALES_SOLUTION_SALES` | `job/ontology/sales/solution_sales.js`, `artifacts/transition-lite-safe-test-20260327.json` | confirmed |
| industry | 엔터프라이즈 솔루션 | `IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION` | `industry/registry/it_software_platform/enterprise_solution.js`, `artifacts/transition-lite-safe-test-20260327.json` | confirmed |
| job | 퍼포먼스 마케팅 | `JOB_MARKETING_PERFORMANCE_MARKETING` | `job/ontology/marketing/performance_marketing.js` | confirmed |
| job | CRM 마케팅 | `JOB_MARKETING_CRM_MARKETING` | `job/ontology/marketing/crm_marketing.js` | confirmed |
| industry | B2C 플랫폼 | `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM` | `industry/registry/it_software_platform/b2c_platform.js` | confirmed |
| job | 백엔드 개발자 | `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT` | `job/ontology/it_data_digital/backend_development.js`, `transitionLite/classifyTransition.testdata.md` | confirmed |
| job | 플랫폼 백엔드 개발자 | `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT` | `backend_development.js`의 platform family / alias, `transitionLite/classifyTransition.testdata.md` | confirmed |
| job | 품질보증 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA` | `job/ontology/manufacturing_quality_production/quality_assurance_qa.js`, `artifacts/transition-lite-safe-test-20260327.json` | confirmed |
| job | 품질관리 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL` | `job/ontology/manufacturing_quality_production/quality_control.js`, `artifacts/transition-lite-investigation-cases.json` | confirmed |
| industry | 전기전자 제조 | `IND_MANUFACTURING_ELECTRONICS_APPLIANCES` | `manufacturing/electronics_appliances.js`의 alias `전기전자`는 맞지만 visible label이 더 넓다 | ambiguous |
| job | 데이터 분석가 | `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS` | `job/ontology/it_data_digital/data_analysis.js`, `jobTransitionReadMetaRegistry.js` | confirmed |
| job | 서비스기획 | `JOB_BUSINESS_SERVICE_PLANNING` | `job/ontology/business/service_planning.js`, `transition-lite-safe-test-20260327.json` | confirmed |
| job | 브랜드 마케팅 | `JOB_MARKETING_BRAND_MARKETING` | `job/ontology/marketing/brand_marketing.js`, `transition-lite-investigation-cases.json` | confirmed |
| industry | 소비재 브랜드 | `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_BRAND_FMCG` | `distribution_commerce_consumer_goods/brand_fmcg.js`가 closest match이나 visible label이 더 좁다 | ambiguous |
| job | 상품기획 | `JOB_MARKETING_PRODUCT_MARKETING_PMM` | `marketing/product_marketing_pmm.js`가 closest match이나 consumer-goods 상품기획과 PMM는 ownership 차이가 있다 | ambiguous |
| job | 생산기술 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING` | `manufacturing_quality_production/production_engineering.js`, `JOB_ROLE_WEIGHT_PROFILE_MAP.js` | confirmed |
| industry | 자동차 부품 제조 | `IND_MANUFACTURING_AUTOMOTIVE_MOBILITY` | `manufacturing/automotive_mobility.js` alias `자동차 부품` | confirmed |
| job | 제조혁신 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION` | `manufacturing_quality_production/manufacturing_innovation.js`, `jobTransitionReadMetaRegistry.js` | confirmed |
| industry | 스마트팩토리 솔루션 | `IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION` | `enterprise_solution.js` alias `MES`는 맞지만 software solution과 automation equipment 중간지대여서 exact lock은 아님 | ambiguous |
| job | 사업기획 | `JOB_BUSINESS_BUSINESS_PLANNING` | `job/ontology/business/business_planning.js`, `transition-lite-safe-test-20260327.json` | confirmed |
| job | 전략기획 | `JOB_BUSINESS_STRATEGY` | `job/ontology/business/strategy.js`, `classifyTransition.testdata.md` | confirmed |
| job | 기술영업 | `JOB_SALES_TECHNICAL_SALES` | `job/ontology/sales/technical_sales.js`, `transition-lite-safe-test-20260327.json` | confirmed |
| industry | 산업장비 | `IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT` | `manufacturing/machinery_industrial_equipment.js` alias `산업장비` | confirmed |
| industry | 산업자동화 | `IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT` | `machinery_industrial_equipment.js` alias `자동화 장비`와 가깝지만 software/controls 문맥까지 포함하는지 불명확 | ambiguous |
| job | 채용 담당자 | `JOB_HR_ORGANIZATION_RECRUITING` | `job/ontology/hr_organization/recruiting.js`, `transition-lite-safe-test-20260327.json` | confirmed |
| industry | HR 서비스 | `IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES` | `professional_b2b_services/hr_recruiting_people_services.js` alias `HR 서비스` | confirmed |
| industry | 핀테크 | `IND_FINANCE_INSURANCE_FINTECH_FINTECH` | `finance_insurance_fintech/fintech.js` exact label | confirmed |
| job | 생산관리 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT` | `production_management` ID는 `transition-lite-safe-test-20260327.json`, `jobTransitionReadMetaRegistry.js`에 존재 | confirmed |
| industry | 식품 제조 | `IND_MANUFACTURING_FOOD_CONSUMER_GOODS` | `manufacturing/food_consumer_goods.js` alias `식품 제조` | confirmed |
| industry | 뷰티 브랜드 | `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_LUXURY_FASHION_BEAUTY` | `luxury_fashion_beauty.js` alias `뷰티`는 맞지만 visible label이 더 좁다 | ambiguous |
| job | 회계 담당자 | `JOB_FINANCE_ACCOUNTING_ACCOUNTING` | `job/ontology/finance_accounting/accounting.js`, `transition-lite-safe-test-20260327.json` | confirmed |
| job | 데이터 사이언티스트 | 확인 필요 | exact ontology owner를 확인하지 못했고 `data_analysis` 또는 `ai_ml_engineering`로 단순 치환하면 위험함 | unresolved |
| industry | AI·데이터 서비스 | `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD` | `ai_data_cloud.js`가 closest match이나 cloud까지 포함한 broader registry다 | ambiguous |
| job | 전략구매 | `JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING` | `procurement_scm/strategic_sourcing.js`, `transition-lite-investigation-cases.json` | confirmed |
| industry | 제조업 | 확인 필요 | manufacturing 하위 registry가 여러 갈래로 나뉘어 있어 broad visible label만으로는 확정 불가 | unresolved |
| job | 프론트엔드 개발자 | `JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT` | `it_data_digital/frontend_development.js`, `JOB_ROLE_WEIGHT_PROFILE_MAP.js` | confirmed |
| industry | 게임 | `IND_IT_SOFTWARE_PLATFORM_GAMING_CONTENT_PLATFORM` | `gaming_content_platform.js` alias `게임 서비스` | confirmed |
| job | 재무기획 | `JOB_FINANCE_ACCOUNTING_FINANCE` | `finance_accounting/finance.js`, `transition-lite-investigation-cases.json` | confirmed |
| industry | 금융 | 확인 필요 | banking/insurance/securities/fintech 중 exact lock 불가 | unresolved |
| job | 프로덕트 매니저 | `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT` | `it_data_digital/product_management.js`, `tests/validate_wave1e.mjs` | confirmed |
| job | 영업기획 | `JOB_SALES_SALES_OPERATIONS` | `sales/sales_operations.js`가 closest match이나 visible label이 planning 중심인지 ops 중심인지 추가 확인 필요 | ambiguous |
| industry | 소비재 유통 | `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_OFFLINE_RETAIL` | offline retail과 brand/distribution 경계가 겹쳐 closest match만 가능 | ambiguous |
| job | 사업개발 | `JOB_BUSINESS_BUSINESS_DEVELOPMENT` | `business/business_development.js`, `classifyTransition.testdata.md` | confirmed |
| job | 리스크 관리 | 확인 필요 | finance ontology에서 exact risk management owner를 확인하지 못함 | unresolved |
| industry | 은행·여신 | `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING` | `finance_insurance_fintech/banking_lending.js` exact label/alias | confirmed |
| industry | 제약·바이오 | `IND_HEALTHCARE_PHARMA_BIO_PHARMACEUTICALS` | `pharmaceuticals.js`가 closest match이나 visible label은 pharmaceutical과 bio를 함께 포함해 broader하다 | ambiguous |
| job | 규제대응 | `JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS` | `research_professional/regulatory_affairs.js`, `JOB_ROLE_WEIGHT_PROFILE_MAP.js` | confirmed |
| job | 공정기술 엔지니어 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING` | `process_engineering.js` label과 맞지만 `production_engineering.js` alias와도 겹친다 | ambiguous |
| industry | 반도체 제조 | `IND_MANUFACTURING_SEMICONDUCTOR_DISPLAY` | `manufacturing/semiconductor_display.js` alias `반도체` | confirmed |
| industry | 반도체 장비 | `IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT` | 장비 공급 관점에서는 closest match이나 semiconductor-specific supplier granularity는 없음 | ambiguous |
| job | 프로젝트 매니저 | `JOB_BUSINESS_PROJECT_MANAGEMENT` | `business/project_management.js`, `jobTransitionReadMetaRegistry.js` | confirmed |

### 반복 애매성 메모
- `서비스기획` vs `프로덕트 매니저`는 title보다 실제 owner 범위와 수익/우선순위 책임을 더 봐야 한다.
- `영업기획` vs `사업개발`은 제휴/딜 발굴 ownership이 있는지 별도 확인이 필요하다.
- 제조 산업 라벨은 `전기전자 제조`처럼 Gold Set이 넓고 registry가 `전기전자 / 가전`처럼 더 구체적일 수 있어 exact match를 서두르면 안 된다.
- `상품기획`, `스마트팩토리 솔루션`, `반도체 장비`처럼 시장 언어가 product/industry를 혼합하는 라벨은 exact registry보다 business context를 먼저 확인해야 한다.

## Round 1 starter payloads

### TSG-001
- case_id: TSG-001
- current_job_label: 운영기획
- current_industry_label: 온라인 커머스
- target_job_label: 운영기획
- target_industry_label: 오프라인 리테일
- roleCurrentResolved.id: `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING`
- roleTargetResolved.id: `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING`
- industryCurrentResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- industryTargetResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_OFFLINE_RETAIL`
- career.totalYears: 4
- resume: 온라인 커머스 환경에서 주문, 정산, CS 운영 프로세스를 관리했고 월간 운영 지표와 이슈 리포트를 만들었습니다. 물류, 고객센터, 영업 현장과 협업하며 운영 정책 개선안을 반복 실행했습니다.
- jd: 오프라인 리테일 운영기획 포지션으로 매장 운영 프로세스와 운영 정책을 설계하고 월간 KPI를 관리합니다. 물류, 매장, 고객응대 조직과 협업해 운영 이슈를 개선한 경험이 필요합니다.
- payload_notes: 동일 기능군 내 산업 인접 전환 기준점. 현재/목표 canonical ID 모두 확인됨.

### TSG-002
- case_id: TSG-002
- current_job_label: B2B 영업
- current_industry_label: B2B SaaS
- target_job_label: 솔루션 영업
- target_industry_label: 엔터프라이즈 솔루션
- roleCurrentResolved.id: `JOB_SALES_B2B_SALES`
- roleTargetResolved.id: `JOB_SALES_SOLUTION_SALES`
- industryCurrentResolved.id: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION`
- career.totalYears: 5
- resume: 중견기업 대상 신규 영업과 기존 고객 업셀을 맡았고 제안서 작성과 데모 운영을 주도했습니다. 세일즈포스 기반 파이프라인 관리와 분기 매출 목표 달성 경험이 있습니다.
- jd: 엔터프라이즈 솔루션 영업 포지션으로 고객 문제를 구조화해 맞춤형 제안을 만들고 데모와 제안 과정을 리딩해야 합니다. 신규 계정 발굴부터 수주 전환까지 B2B 소프트웨어 세일즈 경험이 필요합니다.
- payload_notes: current/target job과 industry ID 확인됨. 대형 엔터프라이즈 조달 구조 적응 여부는 execution note로만 남긴다.

### TSG-003
- case_id: TSG-003
- current_job_label: 퍼포먼스 마케팅
- current_industry_label: 온라인 커머스
- target_job_label: CRM 마케팅
- target_industry_label: B2C 플랫폼
- roleCurrentResolved.id: `JOB_MARKETING_PERFORMANCE_MARKETING`
- roleTargetResolved.id: `JOB_MARKETING_CRM_MARKETING`
- industryCurrentResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM`
- career.totalYears: 3
- resume: 검색광고와 메타 광고, 리타겟팅 캠페인을 운영하며 CAC와 ROAS를 관리했습니다. 회원 세그먼트별 재구매 캠페인과 프로모션 메시지 A/B 테스트 경험이 있습니다.
- jd: B2C 플랫폼 CRM 마케팅 포지션으로 고객 세그먼트 기반 리텐션 캠페인과 재구매 시나리오를 운영합니다. 고객 데이터 해석, 실험 설계, 메시지 최적화 경험이 필요합니다.
- payload_notes: 퍼널 지표 경험을 CRM 리텐션 문맥으로 옮기는 인접 전환 기준점.

### TSG-004
- case_id: TSG-004
- current_job_label: 백엔드 개발자
- current_industry_label: B2B SaaS
- target_job_label: 플랫폼 백엔드 개발자
- target_industry_label: 엔터프라이즈 솔루션
- roleCurrentResolved.id: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
- roleTargetResolved.id: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
- industryCurrentResolved.id: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION`
- career.totalYears: 4
- resume: API 서버와 배치 처리, DB 스키마 설계를 담당했고 장애 대응 온콜 경험이 있습니다. 인증, 권한, 로그 수집 기능을 개발하며 프론트엔드와 QA 조직과 협업했습니다.
- jd: 엔터프라이즈 솔루션 환경의 플랫폼 백엔드 포지션으로 공통 인증, 권한, 로그, 서비스 간 구조를 설계하고 안정적으로 운영해야 합니다. 서버 개발과 운영 안정화 경험이 필요합니다.
- payload_notes: target label은 platform family지만 현재 ontology item은 backend_development 공통 ID를 사용한다.

### TSG-005
- case_id: TSG-005
- current_job_label: 품질보증
- current_industry_label: 전기전자 제조
- target_job_label: 품질관리
- target_industry_label: 전기전자 제조
- roleCurrentResolved.id: `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA`
- roleTargetResolved.id: `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL`
- industryCurrentResolved.id: 확인 필요
- industryTargetResolved.id: 확인 필요
- career.totalYears: 3
- resume: 공정 이상 대응과 불량 원인 분석, 고객사 품질 이슈 대응을 맡았고 협력사 품질 점검과 시정조치 보고서를 작성했습니다. 제조 현장과 협력사 대응 경험이 있습니다.
- jd: 전기전자 제조 품질관리 포지션으로 공정과 출하 단계의 검사 기준을 운영하고 이상 품질을 빠르게 통제해야 합니다. 제조 현장 품질 이슈 대응과 품질 기록 관리 경험이 필요합니다.
- payload_notes: job ID는 확인됐지만 industry label `전기전자 제조`는 registry의 `전기전자 / 가전`과 exact match가 아니라 unresolved로 둔다.

### TSG-006
- case_id: TSG-006
- current_job_label: 데이터 분석가
- current_industry_label: 온라인 커머스
- target_job_label: 서비스기획
- target_industry_label: B2C 플랫폼
- roleCurrentResolved.id: `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS`
- roleTargetResolved.id: `JOB_BUSINESS_SERVICE_PLANNING`
- industryCurrentResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM`
- career.totalYears: 4
- resume: 온라인 커머스에서 유입, 전환, 리텐션 지표를 분석했고 대시보드와 인사이트 리포트를 만들었습니다. 기획자와 함께 실험 설계와 개선 우선순위 도출을 지원했습니다.
- jd: B2C 플랫폼 서비스기획 포지션으로 사용자 요구사항과 기능 우선순위를 정의하고 데이터 기반으로 개선안을 설계합니다. 지표 해석과 실험 협업 경험이 필요합니다.
- payload_notes: 직무 전환이지만 분석 기반 서비스 개선 경험이 명확해 ready로 본다.

### TSG-007
- case_id: TSG-007
- current_job_label: 브랜드 마케팅
- current_industry_label: 소비재 브랜드
- target_job_label: 상품기획
- target_industry_label: 온라인 커머스
- roleCurrentResolved.id: `JOB_MARKETING_BRAND_MARKETING`
- roleTargetResolved.id: 확인 필요
- industryCurrentResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_BRAND_FMCG`
- industryTargetResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- career.totalYears: 5
- resume: 시즌 캠페인과 브랜드 메시지 운영, 제품 출시 프로모션을 맡았고 시장 조사와 고객 반응 분석을 바탕으로 포지셔닝 제안을 했습니다. 출시 협업과 소비자 인사이트 정리 경험이 있습니다.
- jd: 온라인 커머스 상품기획 포지션으로 카테고리 구조와 상품 포지셔닝, 출시 일정과 판매 가설을 설계합니다. 고객 인사이트와 출시 협업 경험이 필요합니다.
- payload_notes: `상품기획`은 PMM/MD/카테고리 기획 경계가 겹쳐 target job canonical을 잠그지 않았다.

### TSG-008
- case_id: TSG-008
- current_job_label: 생산기술
- current_industry_label: 자동차 부품 제조
- target_job_label: 제조혁신
- target_industry_label: 스마트팩토리 솔루션
- roleCurrentResolved.id: `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING`
- roleTargetResolved.id: `JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION`
- industryCurrentResolved.id: `IND_MANUFACTURING_AUTOMOTIVE_MOBILITY`
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION`
- career.totalYears: 6
- resume: 설비 개선과 공정 자동화 과제를 운영했고 생산성 향상 프로젝트를 리드했습니다. 현장 엔지니어, 품질, 설비 협력사와 개선안을 검증하고 적용한 경험이 있습니다.
- jd: 스마트팩토리 솔루션 제조혁신 포지션으로 제조 현장의 병목을 구조화하고 자동화·표준화 과제를 설계합니다. 공정 개선과 현장 협업 경험이 필요합니다.
- payload_notes: target industry는 `MES` 문맥상 enterprise solution을 closest로 두었지만 smart-factory software와 automation equipment 경계가 남아 partial이다.

### TSG-009
- case_id: TSG-009
- current_job_label: 사업기획
- current_industry_label: 엔터프라이즈 솔루션
- target_job_label: 전략기획
- target_industry_label: B2B SaaS
- roleCurrentResolved.id: `JOB_BUSINESS_BUSINESS_PLANNING`
- roleTargetResolved.id: `JOB_BUSINESS_STRATEGY`
- industryCurrentResolved.id: `IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION`
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- career.totalYears: 5
- resume: 신사업 검토와 경쟁사 분석, 사업계획 수립, 경영진 보고 자료 작성을 담당했습니다. 매출 구조와 파이프라인 데이터를 보고 우선 과제를 제안한 경험이 있습니다.
- jd: B2B SaaS 전략기획 포지션으로 성장 우선순위와 사업 구조를 정의하고 경영진 의사결정을 지원합니다. 사업 분석과 전략 문서 작성 경험이 필요합니다.
- payload_notes: strategy/business planning pair와 industry pair가 모두 grounded돼 ready로 본다.

### TSG-010
- case_id: TSG-010
- current_job_label: 기술영업
- current_industry_label: 산업장비
- target_job_label: 프로젝트 매니저
- target_industry_label: 산업자동화
- roleCurrentResolved.id: `JOB_SALES_TECHNICAL_SALES`
- roleTargetResolved.id: `JOB_BUSINESS_PROJECT_MANAGEMENT`
- industryCurrentResolved.id: `IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT`
- industryTargetResolved.id: `IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT`
- career.totalYears: 4
- resume: 고객 요구 파악, 제안서 작성, 납기 조율, 설치 이후 이슈 대응까지 맡았습니다. 기술팀과 고객사 사이에서 일정과 범위를 조율한 경험이 많습니다.
- jd: 산업자동화 프로젝트 매니저 포지션으로 구축 일정과 범위, 리스크를 관리하고 고객과 내부 기술팀을 조율합니다. 기술 이해와 일정 조율 경험이 필요합니다.
- payload_notes: target industry는 automation equipment closest match를 썼지만 control software까지 포함하는지 애매해 partial이다.

### TSG-011
- case_id: TSG-011
- current_job_label: 채용 담당자
- current_industry_label: HR 서비스
- target_job_label: 백엔드 개발자
- target_industry_label: 핀테크
- roleCurrentResolved.id: `JOB_HR_ORGANIZATION_RECRUITING`
- roleTargetResolved.id: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
- industryCurrentResolved.id: `IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES`
- industryTargetResolved.id: `IND_FINANCE_INSURANCE_FINTECH_FINTECH`
- career.totalYears: 3
- resume: 채용 공고 운영과 면접 조율, 후보자 커뮤니케이션, 채용 데이터 정리를 담당했습니다. 개발 조직과 협업한 경험은 있지만 직접 개발 산출물이나 기술 프로젝트 경험은 없습니다.
- jd: 핀테크 백엔드 개발자 포지션으로 서버 로직과 데이터 처리 기능을 개발하고 운영 안정화를 책임집니다. 실제 백엔드 개발 경험과 코드 기반 산출물이 필요합니다.
- payload_notes: negative control용 ready case다. 구조상 false high 탐지 목적이 강하다.

### TSG-012
- case_id: TSG-012
- current_job_label: 생산관리
- current_industry_label: 식품 제조
- target_job_label: 브랜드 마케팅
- target_industry_label: 뷰티 브랜드
- roleCurrentResolved.id: `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT`
- roleTargetResolved.id: `JOB_MARKETING_BRAND_MARKETING`
- industryCurrentResolved.id: `IND_MANUFACTURING_FOOD_CONSUMER_GOODS`
- industryTargetResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_LUXURY_FASHION_BEAUTY`
- career.totalYears: 5
- resume: 생산 계획과 자재 수급, 생산 일정 관리와 현장 이슈 대응을 맡았습니다. 소비자 조사나 브랜드 캠페인 기획 경험은 없습니다.
- jd: 뷰티 브랜드 마케팅 포지션으로 브랜드 포지셔닝과 캠페인 메시지, 소비자 인식 관리를 담당합니다. 브랜드 전략과 소비자 커뮤니케이션 경험이 필요합니다.
- payload_notes: target industry는 beauty closest match로만 잠가 partial이다. false high 탐지용이다.

### TSG-013
- case_id: TSG-013
- current_job_label: 회계 담당자
- current_industry_label: 제조업
- target_job_label: 데이터 사이언티스트
- target_industry_label: AI·데이터 서비스
- roleCurrentResolved.id: `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
- roleTargetResolved.id: 확인 필요
- industryCurrentResolved.id: 확인 필요
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD`
- career.totalYears: 2
- resume: 월마감과 전표 검토, 비용 정산, 재무 보고 보조 업무를 수행했습니다. 엑셀은 사용했지만 모델링이나 코딩 기반 분석 프로젝트 경험은 없습니다.
- jd: AI·데이터 서비스 데이터 사이언티스트 포지션으로 모델링과 데이터 실험, 분석 결과 해석을 담당합니다. 통계 모델링과 코드 기반 분석 경험이 필요합니다.
- payload_notes: target job과 current industry가 broad/unresolved라 partial이다. score probe는 가능하지만 transition read 재현성은 낮다.

### TSG-014
- case_id: TSG-014
- current_job_label: 퍼포먼스 마케팅
- current_industry_label: 온라인 커머스
- target_job_label: 전략구매
- target_industry_label: 제조업
- roleCurrentResolved.id: `JOB_MARKETING_PERFORMANCE_MARKETING`
- roleTargetResolved.id: `JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING`
- industryCurrentResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- industryTargetResolved.id: 확인 필요
- career.totalYears: 4
- resume: 광고 예산 운영과 캠페인 성과 분석, 대행사 협업을 중심으로 일했습니다. 협상 경험은 있지만 매체 단가 조율 수준이며 공급망이나 원가 구조 경험은 없습니다.
- jd: 제조업 전략구매 포지션으로 공급 구조와 벤더 전략, 원가 절감과 조달 리스크를 함께 판단해야 합니다. 소싱 전략과 계약 구조 경험이 필요합니다.
- payload_notes: target job은 grounded지만 target industry가 제조업 broad label이라 partial이다.

### TSG-015
- case_id: TSG-015
- current_job_label: 프론트엔드 개발자
- current_industry_label: 게임
- target_job_label: 재무기획
- target_industry_label: 금융
- roleCurrentResolved.id: `JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT`
- roleTargetResolved.id: `JOB_FINANCE_ACCOUNTING_FINANCE`
- industryCurrentResolved.id: `IND_IT_SOFTWARE_PLATFORM_GAMING_CONTENT_PLATFORM`
- industryTargetResolved.id: 확인 필요
- career.totalYears: 4
- resume: 웹 UI 개발과 사용자 이벤트 로깅, 프론트 성능 개선을 담당했습니다. 예산 관리나 재무 분석, 경영 계획 수립 경험은 없습니다.
- jd: 금융권 재무기획 포지션으로 손익 계획과 예산 운영, 경영 의사결정 지원 자료를 담당합니다. 재무 분석과 계획 수립 경험이 필요합니다.
- payload_notes: target industry `금융`은 broad label이라 partial이다. job gap은 명확해서 false high 탐지에 유용하다.

### TSG-016
- case_id: TSG-016
- current_job_label: 서비스기획
- current_industry_label: B2C 플랫폼
- target_job_label: 프로덕트 매니저
- target_industry_label: B2B SaaS
- roleCurrentResolved.id: `JOB_BUSINESS_SERVICE_PLANNING`
- roleTargetResolved.id: `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT`
- industryCurrentResolved.id: `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM`
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- career.totalYears: 5
- resume: 사용자 요구사항 정의와 화면 정책 수립, 개발 우선순위 조율을 맡았습니다. 데이터 분석과 실험 리뷰 경험은 있지만 제품 수익 구조를 직접 책임진 범위는 제한적입니다.
- jd: B2B SaaS 프로덕트 매니저 포지션으로 제품 방향과 우선순위를 정의하고 고객 문제를 해결하는 기능 로드맵을 운영합니다. 요구사항 정의와 데이터 기반 의사결정 경험이 필요합니다.
- payload_notes: current/target job과 industry가 모두 grounded돼 ready다. title 차이보다 ownership 차이를 보는 boundary case다.

### TSG-017
- case_id: TSG-017
- current_job_label: 영업기획
- current_industry_label: 소비재 유통
- target_job_label: 사업개발
- target_industry_label: B2B SaaS
- roleCurrentResolved.id: `JOB_SALES_SALES_OPERATIONS`
- roleTargetResolved.id: `JOB_BUSINESS_BUSINESS_DEVELOPMENT`
- industryCurrentResolved.id: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_OFFLINE_RETAIL`
- industryTargetResolved.id: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- career.totalYears: 6
- resume: 채널별 매출 계획과 프로모션 손익 분석, 신규 거래처 검토를 담당했습니다. 제휴 논의와 내부 보고 경험은 있지만 장기 파트너십 발굴을 직접 리드한 경험은 제한적입니다.
- jd: B2B SaaS 사업개발 포지션으로 신규 파트너 기회를 발굴하고 제휴 구조와 사업 확장 가설을 설계합니다. 파트너 발굴과 deal structuring 경험이 필요합니다.
- payload_notes: current job과 current industry 모두 closest match만 가능해 partial이다. title similarity 과대평가 방지용이다.

### TSG-018
- case_id: TSG-018
- current_job_label: 데이터 분석가
- current_industry_label: 핀테크
- target_job_label: 리스크 관리
- target_industry_label: 은행·여신
- roleCurrentResolved.id: `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS`
- roleTargetResolved.id: 확인 필요
- industryCurrentResolved.id: `IND_FINANCE_INSURANCE_FINTECH_FINTECH`
- industryTargetResolved.id: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- career.totalYears: 4
- resume: 대출 전환율과 부정거래 패턴, 운영 지표를 분석했고 이상 징후 리포트를 만들었습니다. 정량 분석은 강하지만 규제 해석과 심사 정책 ownership은 직접 맡지 않았습니다.
- jd: 은행·여신 리스크 관리 포지션으로 심사 정책과 이상 거래 리스크를 분석하고 통제 기준을 운영합니다. 금융 리스크 판단과 정책 운영 경험이 필요합니다.
- payload_notes: target job exact ontology를 못 잠가 partial이다. industry pair는 grounded다.

### TSG-019
- case_id: TSG-019
- current_job_label: 품질보증
- current_industry_label: 제약·바이오
- target_job_label: 규제대응
- target_industry_label: 제약·바이오
- roleCurrentResolved.id: `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA`
- roleTargetResolved.id: `JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS`
- industryCurrentResolved.id: `IND_HEALTHCARE_PHARMA_BIO_PHARMACEUTICALS`
- industryTargetResolved.id: `IND_HEALTHCARE_PHARMA_BIO_PHARMACEUTICALS`
- career.totalYears: 5
- resume: GMP 문서 관리와 일탈 조사, CAPA 운영, 내부 감사 대응을 수행했습니다. 품질 시스템 이해는 깊지만 인허가 제출 문서 작성 경험은 제한적입니다.
- jd: 제약·바이오 규제대응 포지션으로 인허가 문서와 규제 기준 대응을 담당하고 대외 제출 품질을 관리합니다. 문서 체계와 규제 해석 경험이 필요합니다.
- payload_notes: industry는 pharmaceutical closest match를 사용했지만 bio/manufacturing 범위가 더 넓어 partial이다.

### TSG-020
- case_id: TSG-020
- current_job_label: 공정기술 엔지니어
- current_industry_label: 반도체 제조
- target_job_label: 기술영업
- target_industry_label: 반도체 장비
- roleCurrentResolved.id: `JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING`
- roleTargetResolved.id: `JOB_SALES_TECHNICAL_SALES`
- industryCurrentResolved.id: `IND_MANUFACTURING_SEMICONDUCTOR_DISPLAY`
- industryTargetResolved.id: `IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT`
- career.totalYears: 7
- resume: 공정 개선과 수율 문제 분석, 장비 협력사와의 기술 커뮤니케이션을 담당했습니다. 고객 대응 경험은 일부 있지만 매출 목표와 파이프라인 운영 책임은 없었습니다.
- jd: 반도체 장비 기술영업 포지션으로 고객 기술 요구를 해석하고 제안 과정에서 사양과 일정, 기술 검토를 조율해야 합니다. 고객-facing 기술 설명과 세일즈 coordination 경험이 필요합니다.
- payload_notes: current job은 process/production engineering 경계, target industry는 semiconductor equipment closest match만 가능해 partial이다.

## Round 1 execution readiness summary
| case_id | readiness | reason |
|---|---|---|
| TSG-001 | ready | current/target job과 industry ID가 모두 confirmed |
| TSG-002 | ready | current/target job과 industry ID가 모두 confirmed |
| TSG-003 | ready | marketing adjacent transition 기준 payload가 모두 confirmed |
| TSG-004 | ready | backend common ID와 industry pair가 confirmed |
| TSG-005 | partial | industry `전기전자 제조`가 exact registry보다 broad |
| TSG-006 | ready | data analysis -> service planning pair와 industry pair가 confirmed |
| TSG-007 | partial | `상품기획` target job canonical이 PMM/MD 경계로 남음 |
| TSG-008 | partial | `스마트팩토리 솔루션` target industry가 enterprise solution closest match 수준 |
| TSG-009 | ready | strategy/business planning과 industry pair가 모두 grounded |
| TSG-010 | partial | `산업자동화` target industry가 broad label |
| TSG-011 | ready | negative control이지만 job/industry payload 자체는 grounded |
| TSG-012 | partial | `뷰티 브랜드` target industry가 luxury/beauty closest match 수준 |
| TSG-013 | partial | `데이터 사이언티스트`, `제조업` canonical lock이 없음 |
| TSG-014 | partial | target industry `제조업` broad label unresolved |
| TSG-015 | partial | target industry `금융` broad label unresolved |
| TSG-016 | ready | service planning -> product management와 industry pair가 grounded |
| TSG-017 | partial | `영업기획`, `소비재 유통` 모두 closest match만 가능 |
| TSG-018 | partial | target job `리스크 관리` exact ontology owner 미확인 |
| TSG-019 | partial | `제약·바이오` industry가 pharma/bio/manufacturing 경계로 남음 |
| TSG-020 | partial | `공정기술 엔지니어`, `반도체 장비`가 closest match 수준 |

### readiness count
- ready: 8
- partial: 12
- blocked: 0

## unresolved blockers after full payload expansion
- `데이터 사이언티스트`, `리스크 관리`처럼 Gold Set visible label에 대응하는 exact job owner가 아직 잠기지 않았다.
- `제조업`, `금융`처럼 너무 넓은 industry label은 exact registry lock 없이는 transition axis 재현성이 낮다.
- `스마트팩토리 솔루션`, `반도체 장비`, `소비재 유통`은 software/solution/vendor/distribution 문맥이 섞여 있어 closest match만 가능하다.
- 실제 `analyze()` probe에서는 `vm.score`와 `hireabilityScore`는 확인되지만 Gold Set 계약의 5-band `model_grade`와 1:1 대응되는 output field는 아직 surface에서 확인하지 못했다.

## Round 1 공식 score source 잠금
- Round 1의 공식 비교 score source는 `reportPack.simulationViewModel.score`로 잠근다.
- owner 근거:
  - `src/App.jsx`는 current VM SSOT를 `reportPack.simulationViewModel`로 명시한다.
  - `src/lib/simulation/buildSimulationViewModel.js`는 최종 UI용 점수 `__posPct`를 계산해 `vm.score`로 노출한다.
- rejected alternative:
  - `hireability.final.hireabilityScore`는 내부 fit layer score다.
  - 같은 값은 `src/lib/analyzer.js`에서 interview risk base 계산과 fit cap 적용에 재사용되므로 QA의 최종 비교 score라기보다 하위 계산 축에 가깝다.
- Round 1 운영 규칙:
  - Gold Set의 `expert_score_range`와 직접 비교하는 값은 `vm.score`만 사용한다.
  - `hireability.final.hireabilityScore`는 설명 보조나 진단 비교에는 남길 수 있지만 공식 hit-rate 계산에는 쓰지 않는다.
- caveat:
  - `vm.score`는 display-oriented final score surface이므로, 내부 component score와 숫자 톤이 다를 수 있다.
  - 따라서 동일 케이스에서 `vm.score`와 `hireability.final.hireabilityScore`를 혼용하면 안 된다.

## Round 1 model_grade derivation contract
- confidence: provisional
- direct field 여부:
  - Gold Set이 요구하는 5-band `model_grade` 직접 field는 현재 probe surface에서 확인하지 못했다.
  - `vm.band`는 interpretation/cap label을 우선 사용하므로 Round 1 grade source로 직접 쓰지 않는다.
- derivation basis:
  - 1차 source는 `vm.score`
  - 2차 basis는 `src/lib/policy/simulatorExpressionPolicy.js`의 `getBaseBandLabel(score)` threshold
- provisional mapping rule:
  - `상위 검토권` -> `매우 높음`
  - `검토 우세권` -> `높음`
  - `경계 검토권` -> `중간`
  - `경계` / `위험` / `낮음` / `경합 구간` -> `낮음`
  - `매우 낮음` -> `매우 낮음`
- derivation 절차:
  1. `reportPack.simulationViewModel.score`를 읽는다.
  2. 같은 threshold로 base band를 복원한다.
  3. 복원된 base band를 위 QA 5-band로 collapse한다.
- 왜 locked가 아니라 provisional인가:
  - 현재 product surface에는 QA가 요구하는 5-band 한국어 grade가 직접 노출되지 않는다.
  - `vm.band`는 실제 probe에서 `근거 확인 필요`처럼 risk/expression cap label로 보였고, score grade와 1:1 대응되지 않았다.
  - 따라서 Round 1의 `model_grade`는 문서용 파생값으로만 사용해야 한다.
- revisit 조건:
  - product가 5-band 또는 equivalent human-readable grade를 직접 surface하면 이 규칙을 즉시 교체한다.
  - 추후 measured case가 늘면 provisional grade와 `vm.band`의 괴리를 따로 검증한다.

## output surface caveat
- `vm.score`는 Round 1 공식 score source다.
- `hireability.final.hireabilityScore`는 내부 fit layer reference다.
- `vm.band`는 score band가 아니라 capped expression surface일 수 있다.
- 따라서 Round 1 QA 기록에서는 `score`, `derived_model_grade`, `raw_band`를 분리해 적는다.
