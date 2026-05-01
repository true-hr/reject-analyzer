# classifyTransition Testdata

## 1. 입력 예시 10개

1. 동일 직무 / 동일 산업
- input:
  - currentJobId: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - currentIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
  - targetJobId: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- expected:
  - jobDistance: `same`
  - industryDistance: `same`
  - roleWeightShift: `similar`
  - responsibilityShift: `similar`
- 근거: job/industry id equality rule이 먼저 적용된다.

2. 동일 직무 / 인접 산업
- input:
  - currentJobId: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - currentIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
  - targetJobId: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION`
- expected:
  - jobDistance: `same`
  - industryDistance: `adjacent`
  - roleWeightShift: `similar`
  - responsibilityShift: `similar`
- 근거: 같은 sector 안에서 B2B customerMarket과 valueChain/coreContext 토큰이 겹쳐 industry fallback이 adjacent로 본다.

3. 인접 직무 / 동일 산업
- input:
  - currentJobId: `JOB_BUSINESS_BUSINESS_DEVELOPMENT`
  - currentIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
  - targetJobId: `JOB_BUSINESS_BUSINESS_PLANNING`
  - targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- expected:
  - jobDistance: `adjacent`
  - industryDistance: `same`
  - roleWeightShift: `similar`
  - responsibilityShift: `similar`
- 근거: Business Development ontology family의 `adjacentFamilies`에 사업기획 축이 직접 연결되어 있다.

4. 인접 직무 / cross 산업
- input:
  - currentJobId: `JOB_BUSINESS_BUSINESS_DEVELOPMENT`
  - currentIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
  - targetJobId: `JOB_BUSINESS_BUSINESS_PLANNING`
  - targetIndustryId: `IND_CONSTRUCTION_REAL_ESTATE_INFRA_CONSTRUCTION_GENERAL_CONTRACTOR`
- expected:
  - jobDistance: `adjacent`
  - industryDistance: `cross`
  - roleWeightShift: `similar`
  - responsibilityShift: `similar`
- 근거: job은 ontology fallback으로 adjacent지만, industry는 sector와 operating context가 멀어 cross로 남는다.

5. cross 직무 / 동일 산업
- input:
  - currentJobId: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - currentIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
  - targetJobId: `JOB_MARKETING_BRAND_MARKETING`
  - targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- expected:
  - jobDistance: `cross`
  - industryDistance: `same`
  - roleWeightShift: `execution_to_strategy`
  - responsibilityShift: `meaningfully_up`
- 근거: 직무 ontology 상 직접 연결 근거가 없고, role/responsibility profile 차이는 상향으로 계산된다.

6. strategy_to_execution 사례
- input:
  - currentJobId: `JOB_BUSINESS_STRATEGY`
  - currentIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
  - targetJobId: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- expected:
  - jobDistance: `cross`
  - industryDistance: `same`
  - roleWeightShift: `strategy_to_execution`
  - responsibilityShift: `down_or_narrower`
- 근거: role profile이 `strategy -> execution_or_hybrid`, responsibility rank는 4에서 2로 내려간다.

7. execution_to_strategy 사례
- input:
  - currentJobId: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - currentIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
  - targetJobId: `JOB_HR_ORGANIZATION_HR_PLANNING`
  - targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- expected:
  - jobDistance: `cross`
  - industryDistance: `same`
  - roleWeightShift: `execution_to_strategy`
  - responsibilityShift: `meaningfully_up`
- 근거: role profile이 `execution_or_hybrid -> strategy`, responsibility rank는 2에서 4로 오른다.

8. operator_to_coordinator 사례
- input:
  - currentJobId: `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS`
  - currentIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
  - targetJobId: `JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS`
  - targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- expected:
  - jobDistance: `adjacent`
  - industryDistance: `same`
  - roleWeightShift: `operator_to_coordinator`
  - responsibilityShift: `meaningfully_up`
- 근거: ontology fallback에서 고객운영 family 경계가 이어지고, role profile은 `operator -> coordinator`, responsibility rank는 1에서 3으로 상승한다.

9. responsibility meaningfully_up 사례
- input:
  - currentJobId: `JOB_SALES_GENERAL_SALES`
  - currentIndustryId: `IND_FINANCE_INSURANCE_FINTECH_FINTECH`
  - targetJobId: `JOB_SALES_KEY_ACCOUNT_MANAGEMENT`
  - targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_FINTECH`
- expected:
  - jobDistance: `cross`
  - industryDistance: `same`
  - roleWeightShift: `operator_to_coordinator`
  - responsibilityShift: `meaningfully_up`
- 근거: responsibility rank가 1에서 5로 크게 뛰고, role profile도 `operator -> strategy_or_coordinator`로 이동한다.

10. profile/relation 없는 fallback 사례
- input:
  - currentJobId: `JOB_UNKNOWN`
  - currentIndustryId: `IND_UNKNOWN`
  - targetJobId: `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS`
- expected:
  - jobDistance: `cross`
  - industryDistance: `cross`
  - roleWeightShift: `similar`
  - responsibilityShift: `similar`
- 근거: lookup/profile miss는 throw 없이 보수 fallback으로 처리한다.

## 2. 경계 사례 5개

1. `JOB_BUSINESS_BUSINESS_DEVELOPMENT -> JOB_BUSINESS_SERVICE_PLANNING`
- 예상: `jobDistance=adjacent`
- 근거: 직접 같은 subcategory는 아니지만 Business Development family의 경계 힌트와 adjacentFamilies가 서비스기획 축을 가리킨다.

2. `IND_IT_SOFTWARE_PLATFORM_B2B_SAAS -> IND_FINANCE_INSURANCE_FINTECH_FINTECH`
- 예상: `industryDistance=cross`
- 근거: customerMarket 일부는 겹쳐도 sector가 다르고 operating context가 충분히 강하게 겹치지 않아 adjacent를 주지 않는다.

3. `JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING -> JOB_PROCUREMENT_SCM_PROCUREMENT`
- 예상: `jobDistance=adjacent`
- 근거: procurement 계열 family 간 경계가 가까워 ontology fallback에서 adjacent가 가능하다.

4. `JOB_MARKETING_PR_COMMUNICATIONS -> JOB_MARKETING_BRAND_MARKETING`
- 예상: `jobDistance=cross`
- 근거: 같은 major 안이어도 동일 family나 adjacent family 근거가 없으면 보수적으로 cross로 남긴다.

5. `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT -> JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING`
- 예상: `responsibilityShift=down_or_narrower`
- 근거: responsibility rank가 `high_scope_ownership -> execution_plus_coordination`으로 내려간다.

## 3. fallback 동작 설명

- relation seed 없음
  - 현재 레포에 `JOB_RELATION_SEED_MAP`, `INDUSTRY_RELATION_SEED_MAP` 자산이 없으면 seed 조회는 빈 맵으로 처리한다.
  - 이 경우 job은 ontology fallback, industry는 registry fallback 규칙만 사용한다.

- profile map 없음
  - role/responsibility profile lookup miss면 각각 `similar`로 고정한다.

- id 누락/invalid
  - job/industry id가 하나라도 없거나 invalid lookup이면 distance는 `cross`, shift는 `similar`로 반환한다.
