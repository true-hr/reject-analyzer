# PASSMAP Career Transition Copy Matrix

## Purpose

경력 직무·산업 분석에서 사용하는 "현재 직무 → 목표 직무" 맞춤 해석 문구의 진행 상태를 관리한다.

이 문서는 문구 전문을 저장하는 곳이 아니라, 어떤 케이스가 이미 설계되었고 어떤 케이스와 섞이면 안 되는지 추적하는 SSOT다.

목적은 세 가지다.

1. 이미 설계한 전환 케이스를 중복 생성하지 않는다.
2. 비슷한 목표 직무 케이스끼리 문구가 섞이지 않도록 한다.
3. 문구 설계 → 검토 → 확정 → 코드 반영 → 화면 검증 상태를 한눈에 추적한다.

## Status Rule

- TODO: 아직 설계하지 않음
- DRAFTED: 초안 작성됨
- REVIEWED: 사람이 검토함
- LOCKED: 문구 방향 확정
- APPLIED: 코드 반영됨
- VERIFIED: 화면 또는 테스트 확인됨
- DEPRECATED: 더 이상 사용하지 않음

## Version Rule

- V1: 최초 설계
- V2: 사용자 피드백 반영 후 구조/깊이 개선
- V3+: 실제 화면 적용 또는 테스트 결과 기반 개선

## caseMode 정의

| caseMode | 설명 |
|---|---|
| CURATED | Curated Case 전문 문서 + 코드 profile 존재. 1순위 처리. |
| ARCHETYPE_ONLY | 직접 case 없음. archetype 매칭으로만 처리. |
| ARCHETYPE_WITH_MODIFIER | archetype + modifier 조합으로 처리. |
| BLOCKED_TAXONOMY | taxonomyId 분리 또는 정의 이슈로 코드 적용 보류. |
| PENDING_TAXONOMY | taxonomyId 확인 중. 코드 적용 전 단계. |

## Case Matrix

| caseKey | currentJob | targetJob | status | version | batch | caseMode | archetype | doNotDuplicateWith | coreDifference | nextAction |
|---|---|---|---|---|---|---|---|---|---|---|
| EXPERIENCED_SERVICE_PLANNING_TO_PRODUCT_MANAGER_V2 | 서비스기획 | PM/Product Manager | VERIFIED | V2 | BATCH_PM_01 | CURATED | PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP | 서비스기획→PO, 운영기획→PM, 데이터분석→PM, 퍼포먼스마케팅→PM | 서비스기획 산출물 중심 경험을 PM의 문제정의·우선순위·지표개선·제품오너십으로 확장하는 케이스 | 완료 |
| EXPERIENCED_SERVICE_PLANNING_TO_PO_V1 | 서비스기획 | PO/Product Owner | LOCKED | V1 | BATCH_PM_01 | BLOCKED_TAXONOMY | PLANNING_OUTPUT_TO_DELIVERY_OWNERSHIP | 서비스기획→PM | PM보다 백로그, 스프린트, 개발 실행 책임, 요구사항 우선순위 관리 쪽을 더 강조해야 함 | SKIP — PO 전용 taxonomyId 분리 후 적용 가능 |
| EXPERIENCED_SERVICE_PLANNING_TO_BUSINESS_PLANNING_V1 | 서비스기획 | 사업기획 | APPLIED | V1 | BATCH_PLANNING_01 | CURATED | PLANNING_OUTPUT_TO_BUSINESS_STRATEGY | 서비스기획→PM, 서비스기획→PO | 제품 화면/기능 기획 경험을 시장·수익모델·사업성과·전략기획 관점으로 확장하는 케이스 | 브라우저 검증 후 VERIFIED 전환 예정 |
| EXPERIENCED_OPERATIONS_PLANNING_TO_PRODUCT_MANAGER_V1 | 운영기획 | PM/Product Manager | VERIFIED | V1 | BATCH_PM_01 | CURATED | OPERATIONS_TO_PRODUCT_IMPROVEMENT | 서비스기획→PM, 데이터분석→PM | 운영 효율화·프로세스 개선 경험을 제품화·자동화·고객경험 개선으로 연결하는 케이스 | 완료 |
| EXPERIENCED_DATA_ANALYST_TO_PRODUCT_MANAGER_V1 | 데이터분석 | PM/Product Manager | VERIFIED | V1 | BATCH_PM_01 | CURATED | ANALYTICS_TO_PRODUCT_DECISION | 서비스기획→PM, 퍼포먼스마케팅→PM | 데이터 해석 강점을 제품 의사결정·가설검증·우선순위 판단으로 확장하는 케이스 | 완료 |
| EXPERIENCED_PERFORMANCE_MARKETING_TO_PRODUCT_MANAGER_V1 | 퍼포먼스마케팅 | PM/Product Manager | VERIFIED | V1 | BATCH_PM_01 | CURATED | PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT | 데이터분석→PM, 서비스기획→PM | 퍼널·전환·실험 경험을 그로스/제품 PM으로 연결하는 케이스 | 완료 |
| EXPERIENCED_PERFORMANCE_MARKETING_TO_SERVICE_PLANNING_V1 | 퍼포먼스마케팅 | 서비스기획 | LOCKED | V1 | BATCH_PLANNING_01 | CURATED | PERFORMANCE_MARKETING_TO_SERVICE_PLANNING | 퍼포먼스마케팅→PM, 데이터분석→PM | 광고 성과·퍼널 개선 경험을 사용자 흐름·기능 개선·서비스 구조 설계로 연결하는 케이스. PM 케이스와 언어 분리 필수 | 코드 적용 전 단계. taxonomyId 확인 후 진행 |
| EXPERIENCED_B2B_SALES_TO_BUSINESS_DEVELOPMENT_V1 | B2B영업 | 사업개발/BD | TODO | V1 | BATCH_BIZ_01 | CURATED | SALES_TO_BUSINESS_DEVELOPMENT | 영업관리→사업기획, B2B영업→사업기획 | 고객·시장 접점과 딜 경험을 파트너십·신규사업·시장확장 전략으로 확장하는 케이스 | 문구 설계 필요 |
| EXPERIENCED_CX_TO_SERVICE_PLANNING_V1 | CS/CX | 서비스기획 | LOCKED | V1 | BATCH_PLANNING_01 | PENDING_TAXONOMY | CUSTOMER_SUCCESS_TO_SERVICE_PLANNING | CS/CX→서비스디자인, 운영기획→서비스기획 | VOC와 고객 불편 이해를 기능 개선·서비스 흐름 설계·정책 개선으로 연결하는 케이스. 서비스디자인 혼동 방지 명시 | 코드 적용 전 단계. taxonomyId 확인 후 진행 |
| EXPERIENCED_ACCOUNTING_TO_FPA_V1 | 회계 | FP&A | TODO | V1 | BATCH_STAFF_01 | CURATED | ACCOUNTING_TO_BUSINESS_FINANCE | 회계→경영기획 | 회계 결산·비용 관리 경험을 예산·실적 분석·사업부 의사결정 지원으로 확장하는 케이스 | 문구 설계 필요 |
| EXPERIENCED_HR_OPERATIONS_TO_HRBP_V1 | 인사운영 | HRBP | TODO | V1 | BATCH_HR_01 | CURATED | HR_OPERATIONS_TO_HRBP | 채용담당→TA, 인사운영→조직문화 | 제도 운영·노무·인사 프로세스 경험을 조직 이슈 진단·현업 파트너링·인력 전략으로 확장하는 케이스 | 문구 설계 필요 |
| EXPERIENCED_PURCHASING_TO_SCM_V1 | 구매 | SCM | TODO | V1 | BATCH_SCM_01 | ARCHETYPE_WITH_MODIFIER | PROCUREMENT_TO_BUSINESS_PLANNING | 구매→전략소싱, 물류운영→SCM | 공급업체·단가·발주 관리 경험을 수요예측·재고·공급망 최적화 관점으로 확장하는 케이스 | 문구 설계 필요 |

## Working Rule

새 케이스를 만들기 전에는 반드시 이 matrix를 먼저 확인한다.

1. caseKey가 이미 있으면 새로 만들지 않는다.
2. status가 LOCKED 이상이면 문구를 임의 수정하지 않는다.
3. 비슷한 currentJob 또는 targetJob 케이스가 있으면 fullCopyFile을 먼저 확인한다.
4. doNotDuplicateWith에 적힌 케이스와 문구가 섞이지 않도록 한다.
5. 새 케이스는 matrix에 먼저 TODO로 등록한 뒤 문구를 작성한다.
6. 문구 전문은 cases/{caseKey}.md에 저장한다.
7. 코드 반영 후 status를 APPLIED로 바꾼다.
8. 화면 또는 테스트 확인 후 status를 VERIFIED로 바꾼다.
9. case 전문 파일이 아직 없더라도, matrix에는 예정 경로를 먼저 기록한다.
10. 문구 전문 파일을 만들 때는 이 matrix의 coreDifference를 반드시 기준으로 삼는다.

## Batch Rule

한 번에 설계하는 케이스는 원칙적으로 3~5개로 제한한다.

이유:
- 한 번에 너무 많이 만들면 문구가 일반론으로 흐르기 쉽다.
- 같은 targetJob 케이스끼리 표현이 섞일 수 있다.
- 각 케이스의 coreDifference가 약해질 수 있다.

추천 배치:
- BATCH_PM_01: 서비스기획→PM, 서비스기획→PO, 운영기획→PM, 데이터분석→PM, 퍼포먼스마케팅→PM
- BATCH_PLANNING_01: 서비스기획→사업기획, 퍼포먼스마케팅→서비스기획, CX→서비스기획
- BATCH_BIZ_01: B2B영업→사업개발, 영업관리→사업기획
- BATCH_STAFF_01: 회계→FP&A, 회계→경영기획, 인사운영→HRBP
- BATCH_SCM_01: 구매→SCM, 구매→전략소싱, 물류운영→SCM

## Mandatory Case Template

각 case 전문 파일은 나중에 아래 구조를 따른다.

1. Case Scope
2. Forbidden Mix
3. Core Difference
4. Top Summary
5. Target Job Feature
6. Career Level Interpretation
   - 저연차
   - 중간연차
   - 고연차
7. Domain Fit Interpretation
   - 같은 도메인
   - 다른 도메인
   - 특수 도메인
8. JD Repeated Requirements
9. Axis Slot Mapping
   - Axis1 lead / scoreReason / criteria / liftOrLimit
   - Axis2 lead / scoreReason / criteria / liftOrLimit
   - Axis3 lead / scoreReason / criteria / liftOrLimit
   - Axis4 lead / scoreReason / criteria / liftOrLimit
   - Axis5 lead / scoreReason / criteria / liftOrLimit
10. Risk Copy
11. Resume Rewrite Direction
12. Comparison Table
13. Version History
