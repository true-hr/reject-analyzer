# Career Core Golden Profile Baseline - Batch 1

## 1. 목적

Career Core Integrity Audit의 첫 기준선으로 Golden Resume 5개와 Expected CareerProfile 5개를 고정한다. 이번 기준선은 특정 JD 적합도가 아니라 "이 사람이 어떤 경력자인가"를 판정하기 위한 입력과 기대 해석을 정의한다.

## 2. 왜 Batch 1은 A+B만 하는지

Golden Resume만 있으면 샘플 이력서에 그치고, Expected CareerProfile까지 있어야 Career Core가 해당 이력서를 어떻게 해석해야 하는지 검증 기준이 생긴다.

RoleFit은 특정 Target JD 기준 적합도이므로 CareerProfile 기준선이 먼저 고정된 뒤 다음 Batch에서 다룬다. 따라서 이번 Batch는 A. Golden Resume Set과 B. Expected CareerProfile Set만 작성한다.

## 3. 이번 Batch에서 하지 않는 것

- Target JD 작성 금지
- Expected RoleFit 작성 금지
- RoleFit fixture 작성 금지
- 정식 Mutation fixture 작성 금지
- 실제 test file 작성 금지
- QA script 작성 금지
- Career Core 로직 수정 금지
- taxonomy, scoring, 설명문 생성 로직 수정 금지
- UI, API, DB, Supabase, env, Vercel 변경 금지

## 4. Anti-overfitting Rule

- `caseId === "golden_01"` 같은 조건문 금지
- 특정 fixture 문장에만 반응하는 alias 추가 금지
- Expected 결과를 맞추기 위한 설명문만 수정 금지
- CareerProfile은 틀렸는데 최종 문장만 맞추는 수정 금지
- Golden 5개만 맞고 Mutation에서 깨지는 수정 금지
- 허용되는 개선은 날짜 파싱 일반화, role taxonomy 보강, industry alias 보강, similarity matrix 보강, evidence extraction rule 개선처럼 일반화 가능한 구조 개선뿐이다.
- 이번 Batch에서는 그런 구조 개선도 하지 않고 기준선만 작성한다.

## 5. Golden Resume 5개 요약

- `golden_01_direct_service_planner`: B2B SaaS / 커리어 플랫폼 서비스기획자와 교육/커리어 서비스 주니어 서비스기획자 경력, 총 62개월 전후.
- `golden_02_career_consulting_to_service_planning`: 이직코칭 운영 매니저와 콘텐츠 운영 담당자 경력, 총 70개월 전후.
- `golden_03_manufacturing_quality_to_bio_operations`: 제조업 생산관리/품질 운영과 품질검사 보조 경력, 총 67개월 전후.
- `golden_04_gap_short_tenure_transition`: 바이오의약품 생산 엔지니어 17개월 전후, 약 50개월 공백, 커리어 리서치 어시스턴트 12개월.
- `golden_05_mixed_ops_growth_service`: 운영기획 매니저와 콘텐츠 마케팅 담당자 경력, 총 53개월 전후.

## 6. Expected CareerProfile 5개 요약

- `golden_01_direct_service_planner`: primaryRoleFamily는 `service_planning_pm_po`, industryDomains는 `b2b_saas`, `career_platform`, `career_education`, 직접 유관 62개월.
- `golden_02_career_consulting_to_service_planning`: primaryRoleFamily는 `career_consulting_operations`, secondaryRoleFamilies는 `service_operations`, `service_planning`, `content_operations`, 직접 41개월과 adjacent 29개월.
- `golden_03_manufacturing_quality_to_bio_operations`: primaryRoleFamily는 `production_quality_operations`, adjacentIndustryDomains는 `bio_pharma_production`, `medical_device`, `quality_assurance`, 직접 49개월과 adjacent 18개월.
- `golden_04_gap_short_tenure_transition`: primaryRoleFamily는 `bio_production_operations`, secondaryRoleFamilies는 `career_research`, `evidence_classification`, `operations_research`, gapMonths 50, shortTenureCount 1.
- `golden_05_mixed_ops_growth_service`: primaryRoleFamily는 `operations_planning`, secondaryRoleFamilies는 `growth_marketing`, `service_planning`, `data_analysis`, 직접 33개월과 adjacent 20개월.

## 7. Mutation Ideas 요약

각 Golden Resume마다 최소 3개 mutation idea를 작성했다. 총 15개이며, JD 표현 변형은 제외했다.

- Golden 01: metric 제거, PM/서비스기획 title alias, B2B phrase 일부 제거
- Golden 02: 상담/코칭 표현 변형, service backlog bullet 제거, content ops metric 제거
- Golden 03: regulated component phrase 제거, early assistant role 약화, quality/production control boundary 변형
- Golden 04: gap 단축, recent role 연장, research metric 제거
- Golden 05: growth term 제거, content role product-like 강화, ops metric 제거

## 8. 완료 기준

- 허용 파일 4개만 생성 또는 변경
- Golden Resume 5개 작성
- Expected CareerProfile 5개 작성
- 각 Golden Resume별 3개 이상 mutation idea 작성
- Target JD, Expected RoleFit, RoleFit fixture, QA script 미작성
- Career Core 로직, taxonomy, scoring, UI, API, DB, Supabase, env, Vercel 미수정
- fixture 파일 3개의 `node --check` 통과

## 9. 다음 Batch 제안

다음 Batch에서는 이 기준선 위에서 Target JD fixture와 Expected RoleFit fixture를 별도로 작성한다. 그때도 CareerProfile 기준선과 RoleFit 판정을 분리하고, JD 표현 변형 mutation은 RoleFit Batch에서만 다룬다.
