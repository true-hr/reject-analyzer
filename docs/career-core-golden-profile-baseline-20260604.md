# Career Core Golden Profile Baseline - Batch 1

## 1. 목적

Career Core Integrity Audit의 첫 기준선으로 한국어 Golden Resume 5개와 Expected CareerProfile 5개를 고정한다. 이번 기준선은 특정 JD 적합도가 아니라 "이 사람이 어떤 경력자인가"를 판정하기 위한 입력과 기대 해석을 정의한다.

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

- `golden_01_direct_service_planner`: 김서윤 / 넥스트커리어랩 / 서비스기획자 / 2020.03 ~ 2023.08, 커리어온 / 주니어 서비스기획자 / 2018.07 ~ 2020.02. 총 62개월.
- `golden_02_career_consulting_to_service_planning`: 박민재 / 트루커리어파트너스 / 이직코칭 운영 매니저 / 2021.01 ~ 2024.12, 잡콘텐츠스튜디오 / 콘텐츠 운영 담당자 / 2019.03 ~ 2020.12. 총 70개월.
- `golden_03_manufacturing_quality_to_bio_operations`: 이도현 / 한성정밀 / 생산관리 담당자 / 2018.04 ~ 2022.03, 세영테크 / 품질검사 보조 / 2016.08 ~ 2018.02. 총 67개월.
- `golden_04_gap_short_tenure_transition`: 정하늘 / 삼성바이오로직스 / 바이오의약품 생산 엔지니어 / 2018.03 ~ 2019.07, 약 50개월 공백, 커리어인사이트 / 커리어 리서치 어시스턴트 / 2023.10 ~ 2024.09. 총 경력 29개월.
- `golden_05_mixed_ops_growth_service`: 최유진 / 로컬커머스랩 / 운영기획 매니저 / 2021.06 ~ 2024.05, 브랜드콘텐츠랩 / 콘텐츠 마케팅 담당자 / 2019.12 ~ 2021.04. 총 53개월.

## 6. Expected CareerProfile 5개 요약

`directlyRelevantMonths`, `adjacentRelevantMonths`, `transferableMonths`는 특정 JD 기준 RoleFit 값이 아니다. 이번 Batch에서는 CareerProfile 기준의 경력 정체성/직무축 분류 baseline으로만 사용한다.

- `golden_01_direct_service_planner`: primaryRoleFamily는 `service_planning`, secondaryRoleFamilies는 `product_planning_pm`, `operations`, industryDomains는 `education_career`, `platform`, `hr_recruiting`. 직접 유관 62개월.
- `golden_02_career_consulting_to_service_planning`: primaryRoleFamily는 `career_consulting`, secondaryRoleFamilies는 `operations`, `service_planning`, `content_strategy`, industryDomains는 `education_career`, `hr_recruiting`, `content_service`. 직접 48개월, adjacent 22개월.
- `golden_03_manufacturing_quality_to_bio_operations`: primaryRoleFamily는 `production_quality`, secondaryRoleFamilies는 `process_management`, `risk_management`, `operations`, industryDomains는 `manufacturing`, adjacentIndustryDomains는 `bio_pharma`. 직접 48개월, adjacent 19개월.
- `golden_04_gap_short_tenure_transition`: primaryRoleFamily는 `production_quality`, secondaryRoleFamilies는 `process_management`, `risk_management`, `career_consulting`, industryDomains는 `bio_pharma`, adjacentIndustryDomains는 `education_career`, `hr_recruiting`. gapMonths 50, shortTenureCount 1.
- `golden_05_mixed_ops_growth_service`: primaryRoleFamily는 `operations`, secondaryRoleFamilies는 `growth_marketing`, `service_planning`, `content_strategy`, industryDomains는 `commerce`, `platform`, `content_service`. 직접 36개월, adjacent 17개월.

## 7. Mutation Ideas 요약

Mutation은 이번 Batch에서 정식 fixture가 아니다. 한국어 Golden Resume별로 최소 3개 idea만 기록했고, JD 표현 변형은 제외했다. 총 15개다.

- Golden 01: 정량 수치 제거, PM/PO 표현 제거, 커리어 플랫폼 산업 표현 약화
- Golden 02: 코칭/상담 표현 변형, SOP 재설계 신호 제거, 콘텐츠 운영 metric 제거
- Golden 03: 품질 표현 약화, 바이오 adjacent 문서관리 표현 추가, 초기 품질검사 보조 경력 약화
- Golden 04: 공백 기간 단축, 최근 리서치 재직 기간 연장, 바이오 생산 구체성 약화
- Golden 05: 그로스 마케팅 표현 제거, 서비스기획 신호 추가, 콘텐츠 서비스 산업 맥락 약화

## 8. 완료 기준

- 허용 파일 4개만 생성 또는 변경
- 한국어 Golden Resume 5개 작성
- Expected CareerProfile 5개 작성
- 각 Golden Resume별 3개 이상 mutation idea 작성
- Target JD, Expected RoleFit, RoleFit fixture, QA script 미작성
- Career Core 로직, taxonomy, scoring, UI, API, DB, Supabase, env, Vercel 미수정
- fixture 파일 3개의 `node --check` 통과

## 9. 다음 Batch 제안

다음 Batch에서는 이 기준선 위에서 Target JD fixture와 Expected RoleFit fixture를 별도로 작성한다. 그때도 CareerProfile 기준선과 RoleFit 판정을 분리하고, JD 표현 변형 mutation은 RoleFit Batch에서만 다룬다.
