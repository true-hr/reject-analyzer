# PASSMAP Newgrad Transition Lite Gold Set

## 목적
- newgrad transition-lite의 starter calibration 케이스를 pure newgrad / bridge-newgrad 기준으로 분리 적재한다.

## 사용 원칙
- expected는 exact score가 아니라 band hypothesis와 reasoning note 중심으로 적는다.
- positive control과 negative control을 모두 포함한다.
- 한 케이스는 1~2개 핵심 축 갈림만 드러내게 설계한다.
- full cross-product는 금지한다.

## starter taxonomy
- pure newgrad
  - high / mid / low target similarity
  - domain evidence high / low
  - execution evidence high / low
  - communication evidence high / low
  - strength evidence high / low
- bridge-newgrad
  - subtype signal + real work evidence high / low
  - domain relevance high / low
  - communication relevance high / low
- controls
  - positive control
  - negative control

## starter case skeleton list
### NG-CASE-001
- caseId: NG-CASE-001
- family: pure_newgrad_positive_control
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: target relevance가 높은 프로젝트와 인턴 evidence가 반복됨
- expected focus axes: 직무 적합 연결성, 수행 경험 연결성
- expected band hypothesis:
  - 직무 적합 연결성: high
  - 도메인 관심 연결성: mid_high
  - 수행 경험 연결성: high
  - 타겟 커뮤니케이션 연결성: mid
  - 강점 DNA 연결성: mid_high
- reasoning note: positive control. target job relevance와 직접 수행 evidence가 같이 높아야 한다.
- status: draft

### NG-CASE-002
- caseId: NG-CASE-002
- family: pure_newgrad_domain_high_execution_low
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: domain 관심 근거는 강하지만 직접 수행 evidence는 약함
- expected focus axes: 도메인 관심 연결성, 수행 경험 연결성
- expected band hypothesis:
  - 직무 적합 연결성: mid
  - 도메인 관심 연결성: high
  - 수행 경험 연결성: low
  - 타겟 커뮤니케이션 연결성: low
  - 강점 DNA 연결성: mid
- reasoning note: 관심과 실행을 분리해서 읽어야 하는 케이스다.
- status: draft

### NG-CASE-003
- caseId: NG-CASE-003
- family: pure_newgrad_execution_high_communication_low
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: 프로젝트 산출물은 명확하지만 stakeholder communication evidence는 약함
- expected focus axes: 수행 경험 연결성, 타겟 커뮤니케이션 연결성
- expected band hypothesis:
  - 직무 적합 연결성: mid_high
  - 도메인 관심 연결성: mid
  - 수행 경험 연결성: high
  - 타겟 커뮤니케이션 연결성: low
  - 강점 DNA 연결성: mid
- reasoning note: 팀플과 stakeholder fit을 같은 것으로 읽지 않도록 설계한다.
- status: draft

### NG-CASE-004
- caseId: NG-CASE-004
- family: pure_newgrad_strength_high_execution_low
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: strengths와 work style 메모는 풍부하지만 직접 실행 근거는 약함
- expected focus axes: 강점 DNA 연결성, 수행 경험 연결성
- expected band hypothesis:
  - 직무 적합 연결성: low
  - 도메인 관심 연결성: mid
  - 수행 경험 연결성: low
  - 타겟 커뮤니케이션 연결성: mid
  - 강점 DNA 연결성: high
- reasoning note: soft skill을 높게 보더라도 execution을 끌어올리면 안 된다.
- status: draft

### NG-CASE-005
- caseId: NG-CASE-005
- family: pure_newgrad_negative_control
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: 추상 관심 진술만 있고 target relevance evidence가 거의 없음
- expected focus axes: 전체
- expected band hypothesis:
  - 직무 적합 연결성: low
  - 도메인 관심 연결성: low
  - 수행 경험 연결성: low
  - 타겟 커뮤니케이션 연결성: low
  - 강점 DNA 연결성: low
- reasoning note: negative control. 추상 키워드만으로 과대평가되지 않아야 한다.
- status: draft

### NG-CASE-006
- caseId: NG-CASE-006
- family: bridge_newgrad_execution_high
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: bridgeCandidate true, 계약직 또는 인턴 실무 evidence가 target task와 직접 닿음
- expected focus axes: 수행 경험 연결성, 직무 적합 연결성
- expected band hypothesis:
  - 직무 적합 연결성: mid_high
  - 도메인 관심 연결성: mid
  - 수행 경험 연결성: high
  - 타겟 커뮤니케이션 연결성: mid
  - 강점 DNA 연결성: mid
- reasoning note: bridge flag 자체가 아니라 short-form real work evidence가 핵심이다.
- status: draft

### NG-CASE-007
- caseId: NG-CASE-007
- family: bridge_newgrad_communication_high
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: bridgeCandidate true, 실제 상대했던 stakeholder가 target role과 가깝다
- expected focus axes: 타겟 커뮤니케이션 연결성
- expected band hypothesis:
  - 직무 적합 연결성: mid
  - 도메인 관심 연결성: mid
  - 수행 경험 연결성: mid
  - 타겟 커뮤니케이션 연결성: high
  - 강점 DNA 연결성: mid
- reasoning note: stakeholder proximity가 핵심인 bridge 케이스다.
- status: draft

### NG-CASE-008
- caseId: NG-CASE-008
- family: bridge_newgrad_domain_high_execution_high
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: bridgeCandidate true, 도메인 관심과 실무형 evidence가 모두 높음
- expected focus axes: 도메인 관심 연결성, 수행 경험 연결성
- expected band hypothesis:
  - 직무 적합 연결성: mid_high
  - 도메인 관심 연결성: high
  - 수행 경험 연결성: high
  - 타겟 커뮤니케이션 연결성: mid_high
  - 강점 DNA 연결성: mid
- reasoning note: bridge-newgrad positive control.
- status: draft

### NG-CASE-009
- caseId: NG-CASE-009
- family: bridge_newgrad_flag_only_negative
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: bridgeCandidate true지만 실무 근거가 추상적이거나 target relevance가 약함
- expected focus axes: 수행 경험 연결성, 타겟 커뮤니케이션 연결성
- expected band hypothesis:
  - 직무 적합 연결성: low
  - 도메인 관심 연결성: mid
  - 수행 경험 연결성: low
  - 타겟 커뮤니케이션 연결성: low
  - 강점 DNA 연결성: mid
- reasoning note: bridgeCandidate auto boost 금지 확인용 negative control.
- status: draft

### NG-CASE-010
- caseId: NG-CASE-010
- family: bridge_newgrad_target_mismatch_negative
- targetJob: placeholder
- targetIndustry: placeholder
- input evidence summary: 실무 경험은 있으나 target job 또는 target stakeholder relevance가 낮음
- expected focus axes: 직무 적합 연결성, 도메인 관심 연결성
- expected band hypothesis:
  - 직무 적합 연결성: low
  - 도메인 관심 연결성: low
  - 수행 경험 연결성: mid
  - 타겟 커뮤니케이션 연결성: low
  - 강점 DNA 연결성: mid
- reasoning note: 실무 경험 자체와 target fit을 분리해서 읽는지 확인한다.
- status: draft

## 운영 메모
- `targetJob`, `targetIndustry` placeholder는 calibration 준비 단계에서 실제 케이스로 교체한다.
- pure newgrad와 bridge-newgrad는 같은 문서 안에서 family만 분리하고, experienced gold set과는 섞지 않는다.

## 2026-04-05 Axis 1 / Axis 3 Priority Gold Set Skeleton

### case id rule
- Axis 1 priority case: `NG5A1-CASE-YYYYMMDD-###`
- Axis 3 priority case: `NG5A3-CASE-YYYYMMDD-###`
- skeleton 단계에서는 placeholder id를 먼저 배정하고, 실제 execution 시 append-only로 확정한다.

### 공통 case template
```md
### NG5A1-CASE-20260405-001
- caseId:
- axisTarget:
- currentMajor:
- certifications:
- projects:
- internships:
- activities:
- targetJobId:
- targetIndustryId:
- expectedBand:
- expectedReasoning:
- likelyConfusers:
- reviewerNote:
```

### Axis 1 `jobStructure` operational definition
- 신입에게서 Axis 1은 "목표 직무의 핵심 과업과 직접 닿는 전공/프로젝트 role/인턴 roleFamily가 있는가"를 본다.
- 전공명만 예뻐 보여도 direct task evidence가 없으면 high로 읽지 않는다.
- 반대로 전공이 달라도 direct role evidence가 반복되면 high 후보가 된다.

### Axis 1 starter cases
#### NG5A1-CASE-20260405-001
- caseId: `NG5A1-CASE-20260405-001`
- axisTarget: `jobStructure`
- currentMajor: `컴퓨터공학`
- certifications: `정보처리기사`
- projects: `백엔드 역할 2건, API/DB 구현 명시`
- internships: `개발 roleFamily 1건`
- activities: `없음`
- targetJobId: `JOB_ENGINEERING_DEVELOPMENT_*`
- targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD`
- expectedBand: `high`
- expectedReasoning: direct role evidence가 반복되고 major도 같은 방향이라 high control로 적합하다.
- likelyConfusers: industry fit이 높다고 Axis 2와 혼동하지 말 것.
- reviewerNote: repeated direct role 여부를 먼저 본다.

#### NG5A1-CASE-20260405-002
- caseId: `NG5A1-CASE-20260405-002`
- axisTarget: `jobStructure`
- currentMajor: `경영학`
- certifications: `ADsP`
- projects: `데이터 분석 역할 1건`
- internships: `없음`
- activities: `데이터 동아리 1건`
- targetJobId: `JOB_IT_DATA_DIGITAL_*`
- targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD`
- expectedBand: `mid`
- expectedReasoning: direct role 반복은 없지만 adjacent/direct project role 1건이 있어 low보다는 높아야 한다.
- likelyConfusers: 관련 자격과 산업 흥미를 Axis 1 가산으로 과대해석할 수 있다.
- reviewerNote: role evidence와 major mismatch를 분리해서 본다.

#### NG5A1-CASE-20260405-003
- caseId: `NG5A1-CASE-20260405-003`
- axisTarget: `jobStructure`
- currentMajor: `심리학`
- certifications: `없음`
- projects: `공모전 기획 1건`
- internships: `없음`
- activities: `대외활동 1건`
- targetJobId: `JOB_ENGINEERING_DEVELOPMENT_*`
- targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD`
- expectedBand: `low`
- expectedReasoning: target job direct/adjacent role도 아니고 major relevance도 약하다.
- likelyConfusers: evidence group이 있다는 이유로 mid로 올리는 실수
- reviewerNote: participation presence와 job fit을 구분한다.

#### NG5A1-CASE-20260405-004
- caseId: `NG5A1-CASE-20260405-004`
- axisTarget: `jobStructure`
- currentMajor: `산업공학`
- certifications: `없음`
- projects: `기획 역할 1건`
- internships: `운영 / 지원 roleFamily 1건`
- activities: `없음`
- targetJobId: `JOB_BUSINESS_*`
- targetIndustryId: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- expectedBand: `mid`
- expectedReasoning: adjacent/direct 해석이 섞일 수 있는 경계 케이스라 boundary control에 적합하다.
- likelyConfusers: 운영 경험을 Axis 3 high처럼 읽어 Axis 1도 같이 올리는 실수
- reviewerNote: adjacent role과 major support의 조합만 본다.

### Axis 3 `responsibilityScope` operational definition
- 신입에게서 Axis 3은 "실제로 만든 것, 반복 수행한 것, 일정 수준의 책임과 결과를 가진 경험이 있는가"를 본다.
- role title보다 evidence group 수, item 수, outcomeLevel, duration이 핵심이다.
- 단순 참여만 있으면 high로 읽지 않는다.

### Axis 3 starter cases
#### NG5A3-CASE-20260405-001
- caseId: `NG5A3-CASE-20260405-001`
- axisTarget: `responsibilityScope`
- currentMajor: `컴퓨터공학`
- certifications: `없음`
- projects: `프로젝트 2건, outcomeLevel에 실제 적용 / 운영 반영 포함`
- internships: `인턴 1건, duration 1년`
- activities: `없음`
- targetJobId: `JOB_ENGINEERING_DEVELOPMENT_*`
- targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD`
- expectedBand: `high`
- expectedReasoning: projects+internships 반복, outcome lift, duration lift가 함께 있어 high control로 적합하다.
- likelyConfusers: job fit이 높아서 execution도 높아 보이는 착시
- reviewerNote: 수행 흔적의 반복성과 lift를 함께 본다.

#### NG5A3-CASE-20260405-002
- caseId: `NG5A3-CASE-20260405-002`
- axisTarget: `responsibilityScope`
- currentMajor: `경영학`
- certifications: `없음`
- projects: `프로젝트 1건, outcomeLevel 결과물 완성`
- internships: `없음`
- activities: `학회 운영 1건`
- targetJobId: `JOB_BUSINESS_*`
- targetIndustryId: `IND_PROFESSIONAL_B2B_SERVICES`
- expectedBand: `mid`
- expectedReasoning: evidence group 2개와 item 2개가 있어 수행 흔적은 보이지만 반복성과 ownership 강도는 제한적이다.
- likelyConfusers: 운영 활동을 커뮤니케이션 경험으로만 보고 Axis 3를 과소평가하는 실수
- reviewerNote: 단일 프로젝트라도 산출물 완성 여부를 본다.

#### NG5A3-CASE-20260405-003
- caseId: `NG5A3-CASE-20260405-003`
- axisTarget: `responsibilityScope`
- currentMajor: `언론 / 미디어`
- certifications: `없음`
- projects: `없음`
- internships: `없음`
- activities: `동아리 참여만 존재`
- targetJobId: `JOB_MARKETING_*`
- targetIndustryId: `IND_MEDIA_CONTENT_EDUCATION`
- expectedBand: `low`
- expectedReasoning: evidence group은 있으나 직접 산출물과 반복 수행 근거가 약하다.
- likelyConfusers: 활동 참여 사실만으로 mid를 주는 실수
- reviewerNote: participation와 execution depth를 분리한다.

#### NG5A3-CASE-20260405-004
- caseId: `NG5A3-CASE-20260405-004`
- axisTarget: `responsibilityScope`
- currentMajor: `경제학`
- certifications: `없음`
- projects: `프로젝트 1건, outcomeLevel 발표 / 제출 / 시연`
- internships: `인턴 1건, duration 6개월 미만`
- activities: `없음`
- targetJobId: `JOB_FINANCE_ACCOUNTING_*`
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expectedBand: `mid`
- expectedReasoning: evidence는 둘이지만 long duration/high outcome이 아니어서 high까지는 어렵다. boundary control로 적합하다.
- likelyConfusers: 인턴 존재만으로 high로 올리는 실수
- reviewerNote: duration lift와 high outcome lift가 실제로 있는지 따로 본다.

### Axis 2 retest starter queue
#### NGA2-AUDIT-20260405-001
- caseId: `NGA2-AUDIT-20260405-001`
- axisTarget: `industryContext`
- currentMajor: `무관 전공`
- certifications: `없음`
- projects: `weak project.type only`
- internships: `없음`
- activities: `없음`
- targetJobId: `placeholder`
- targetIndustryId: `placeholder`
- expectedBand: `low`
- expectedReasoning: weak project support 단독이면 low cap 확인용이다.
- likelyConfusers: non-empty major 존재가 floor를 올리는지
- reviewerNote: Pattern A 재확인용

#### NG5A1-CASE-20260405-005
- caseId: `NG5A1-CASE-20260405-005`
- axisTarget: `jobStructure`
- currentMajor: `경영학`
- certifications: `없음`
- projects: `기획 역할 2건`
- internships: `없음`
- activities: `서비스 기획 스터디`
- targetJobId: `JOB_BUSINESS_SERVICE_PLANNING`
- targetIndustryId: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- expectedBand: `high`
- expectedReasoning: direct 기획 role 반복이 있어 high control로 적합하다.
- likelyConfusers: industry relevance와 Axis 1 direct role 반복을 혼동하는 실수
- reviewerNote: 전공보다 role 반복을 먼저 본다.

#### NG5A1-CASE-20260405-006
- caseId: `NG5A1-CASE-20260405-006`
- axisTarget: `jobStructure`
- currentMajor: `언론정보학`
- certifications: `없음`
- projects: `없음`
- internships: `없음`
- activities: `홍보 동아리 1건`
- targetJobId: `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expectedBand: `low`
- expectedReasoning: target job direct/adjacent evidence와 major support가 모두 약하다.
- likelyConfusers: 활동 존재만으로 low를 넘겨 읽는 실수
- reviewerNote: no-evidence floor 확인용

#### NG5A3-CASE-20260405-005
- caseId: `NG5A3-CASE-20260405-005`
- axisTarget: `responsibilityScope`
- currentMajor: `광고홍보학`
- certifications: `없음`
- projects: `프로젝트 1건, outcomeLevel 수상 / 선발 / 우수성과`
- internships: `인턴 2건`
- activities: `브랜드 서포터즈 리더`
- targetJobId: `JOB_MARKETING_BRAND_MARKETING`
- targetIndustryId: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- expectedBand: `high`
- expectedReasoning: evidence group과 item 수가 높고 high outcome이 있어 high control에 적합하다.
- likelyConfusers: 커뮤니케이션 축과 실행 축을 섞는 실수
- reviewerNote: group 수와 outcome lift를 함께 본다.

#### NG5A3-CASE-20260405-006
- caseId: `NG5A3-CASE-20260405-006`
- axisTarget: `responsibilityScope`
- currentMajor: `경영학`
- certifications: `없음`
- projects: `없음`
- internships: `없음`
- activities: `없음`
- targetJobId: `JOB_BUSINESS_SERVICE_PLANNING`
- targetIndustryId: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- expectedBand: `low`
- expectedReasoning: 실질 실행 evidence가 없어 low floor 확인용이다.
- likelyConfusers: 전공 적합도를 execution으로 잘못 읽는 실수
- reviewerNote: no-evidence baseline

## 2026-04-05 Axis 1 First Run Actuals

### execution path
- `buildNewgradTransitionLiteResult(payload)` 직접 호출
- axis actual source: `vm.axisPack.axes.jobStructure`
- visible narrative: `TransitionLiteResult.jsx`의 same mapping을 안전한 임시 harness에서 복제해 조회

### result rows
- `NG5A1-CASE-20260405-011`
  - expectedBand: `high`
  - actualAxisScore: `100`
  - actualBand: `high` -> 3-band `high`
  - narrative: `직무에 필요한 핵심 기술(Tool, 프로세스 등)을 프로젝트에서 직접 구현해 본 경험이 있습니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: direct role 반복 high control 정상
- `NG5A1-CASE-20260405-012`
  - expectedBand: `high`
  - actualAxisScore: `100`
  - actualBand: `high` -> 3-band `high`
  - narrative: `직무에 필요한 핵심 기술(Tool, 프로세스 등)을 프로젝트에서 직접 구현해 본 경험이 있습니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: 기획 direct role 반복 high control 정상
- `NG5A1-CASE-20260405-013`
  - expectedBand: `mid`
  - actualAxisScore: `80`
  - actualBand: `mid_high` -> 3-band `high`
  - narrative: `직무와 유사한 프로젝트나 인턴 경험이 있어 실무 투입 시 적응이 빠를 것으로 보입니다.`
  - driftType: `score`
  - suspectedOwner: `buildNewgradAxisPack`
  - short finding: single direct project role이 예상보다 한 단계 높게 읽혔다
- `NG5A1-CASE-20260405-014`
  - expectedBand: `mid`
  - actualAxisScore: `60`
  - actualBand: `mid` -> 3-band `mid`
  - narrative: `전공이나 교육을 통해 기초 지식은 갖추었으며, 이를 직무와 연결할 논리가 필요합니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: major-only mid baseline 정상
- `NG5A1-CASE-20260405-015`
  - expectedBand: `low`
  - actualAxisScore: `40`
  - actualBand: `low` -> 3-band `low`
  - narrative: `직무와 관련된 간접적인 경험은 있으나, 핵심 과업과는 거리가 있습니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: 무관 전공 + 기획 공모전 low 유지
- `NG5A1-CASE-20260405-016`
  - expectedBand: `low`
  - actualAxisScore: `40`
  - actualBand: `low` -> 3-band `low`
  - narrative: `직무와 관련된 간접적인 경험은 있으나, 핵심 과업과는 거리가 있습니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: no-evidence floor low 유지

## 2026-04-05 Axis 3 First Run Actuals

### execution path
- `buildNewgradTransitionLiteResult(payload)` 직접 호출
- axis actual source: `vm.axisPack.axes.responsibilityScope`
- visible narrative: `TransitionLiteResult.jsx`의 same mapping을 안전한 임시 harness에서 복제해 조회

### result rows
- `NG5A3-CASE-20260405-011`
  - expectedBand: `high`
  - actualAxisScore: `100`
  - actualBand: `high` -> 3-band `high`
  - narrative: `실제 인턴이나 산학협력을 통해 프로페셔널한 환경에서 책임을 다해본 경험이 있습니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: multi-group + high outcome/duration high control 정상
- `NG5A3-CASE-20260405-012`
  - expectedBand: `high`
  - actualAxisScore: `100`
  - actualBand: `high` -> 3-band `high`
  - narrative: `실제 인턴이나 산학협력을 통해 프로페셔널한 환경에서 책임을 다해본 경험이 있습니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: internship 반복 + award lift high control 정상
- `NG5A3-CASE-20260405-013`
  - expectedBand: `mid`
  - actualAxisScore: `80`
  - actualBand: `mid_high` -> 3-band `high`
  - narrative: `특정 프로젝트에서 리더 혹은 핵심 역할을 맡아 실질적인 결과물을 만들어낸 적이 있습니다.`
  - driftType: `score`
  - suspectedOwner: `buildNewgradAxisPack`
  - short finding: project 1 + 활동 1 조합이 예상보다 빨리 high 측으로 올라갔다
- `NG5A3-CASE-20260405-014`
  - expectedBand: `mid`
  - actualAxisScore: `80`
  - actualBand: `mid_high` -> 3-band `high`
  - narrative: `특정 프로젝트에서 리더 혹은 핵심 역할을 맡아 실질적인 결과물을 만들어낸 적이 있습니다.`
  - driftType: `score`
  - suspectedOwner: `buildNewgradAxisPack`
  - short finding: 짧은 인턴 + 발표형 프로젝트 조합도 high 측으로 붙었다
- `NG5A3-CASE-20260405-015`
  - expectedBand: `low`
  - actualAxisScore: `40`
  - actualBand: `low` -> 3-band `low`
  - narrative: `단체 활동 경험은 있으나, 본인의 주도적인 역할이 명확하지 않습니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: activity-only low baseline 정상
- `NG5A3-CASE-20260405-016`
  - expectedBand: `low`
  - actualAxisScore: `20`
  - actualBand: `very_low` -> 3-band `low`
  - narrative: `주어진 과제를 수동적으로 수행한 경험이 대부분입니다.`
  - driftType: `match`
  - suspectedOwner: `n/a`
  - short finding: no-evidence floor very_low raw / low coarse

## 2026-04-05 Axis 3 Boundary Stress Cases

### case rows
- `NG5A3-CASE-20260405-021`
  - expectedBand: `low`
  - payload_summary: project 1 only, 진행 중심, no internship/activity
  - actualAxisScore: `40`
  - actualBand: `low`
  - narrative: `단체 활동 경험은 있으나, 본인의 주도적인 역할이 명확하지 않습니다.`
  - driftType: `match`
  - severity: `low`
  - suspectedOwner: `n/a`
  - short finding: single low-evidence project는 low에 머문다
- `NG5A3-CASE-20260405-022`
  - expectedBand: `mid`
  - payload_summary: project 1 + activity 1, no outcome/duration lift
  - actualAxisScore: `60`
  - actualBand: `mid`
  - narrative: `목표를 설정하고 끝까지 완수한 경험이 있으며, 그 과정에서의 배움을 설명할 수 있습니다.`
  - driftType: `match`
  - severity: `low`
  - suspectedOwner: `n/a`
  - short finding: lower-mid boundary는 mid로 유지
- `NG5A3-CASE-20260405-023`
  - expectedBand: `mid`
  - payload_summary: project 1, 결과물 완성
  - actualAxisScore: `60`
  - actualBand: `mid`
  - narrative: `목표를 설정하고 끝까지 완수한 경험이 있으며, 그 과정에서의 배움을 설명할 수 있습니다.`
  - driftType: `match`
  - severity: `low`
  - suspectedOwner: `n/a`
  - short finding: medium outcome 1건만으로는 high로 점프하지 않는다
- `NG5A3-CASE-20260405-024`
  - expectedBand: `mid`
  - payload_summary: short internship 1 + activity 1
  - actualAxisScore: `60`
  - actualBand: `mid`
  - narrative: `목표를 설정하고 끝까지 완수한 경험이 있으며, 그 과정에서의 배움을 설명할 수 있습니다.`
  - driftType: `match`
  - severity: `low`
  - suspectedOwner: `n/a`
  - short finding: short internship 단독은 high를 만들지 않는다
- `NG5A3-CASE-20260405-025`
  - expectedBand: `mid`
  - payload_summary: project 1 + short internship 1 + 발표/제출
  - actualAxisScore: `80`
  - actualBand: `high`
  - narrative: `특정 프로젝트에서 리더 혹은 핵심 역할을 맡아 실질적인 결과물을 만들어낸 적이 있습니다.`
  - driftType: `score`
  - severity: `medium`
  - suspectedOwner: `buildNewgradAxisPack`
  - short finding: upper-mid boundary는 high 쪽으로 붙는다
- `NG5A3-CASE-20260405-026`
  - expectedBand: `mid`
  - payload_summary: project 1 + short internship 1 + 결과물 완성
  - actualAxisScore: `80`
  - actualBand: `high`
  - narrative: `특정 프로젝트에서 리더 혹은 핵심 역할을 맡아 실질적인 결과물을 만들어낸 적이 있습니다.`
  - driftType: `score`
  - severity: `medium`
  - suspectedOwner: `buildNewgradAxisPack`
  - short finding: upper-mid boundary 2건 연속 high-side 상승

### boundary reading
- lower-mid 2건은 `low`, `mid`로 분리돼 과도한 jump는 없었다.
- true mid 2건도 둘 다 `mid`에 머물렀다.
- upper-mid 2건만 반복적으로 `high`로 올라갔다.
- 현재 evidence로는 threshold 전체가 공격적이라기보다 `project + internship` 조합과 medium outcome이 upper-mid를 high 쪽으로 미는 것으로 읽는 편이 더 자연스럽다.

## 2026-04-05 Axis 1 Boundary Stress Cases

### case rows
- `NG5A1-CASE-20260405-021`
  - expectedBand: `mid`
  - payload_summary: major only support
  - actualAxisScore: `60`
  - actualBand: `mid`
  - narrative: `전공이나 교육을 통해 기초 지식은 갖추었으며, 이를 직무와 연결할 논리가 필요합니다.`
  - driftType: `match`
  - severity: `low`
  - suspectedOwner: `n/a`
  - short finding: major-only는 mid baseline 유지
- `NG5A1-CASE-20260405-022`
  - expectedBand: `low`
  - payload_summary: adjacent role only
  - actualAxisScore: `40`
  - actualBand: `low`
  - narrative: `직무와 관련된 간접적인 경험은 있으나, 핵심 과업과는 거리가 있습니다.`
  - driftType: `match`
  - severity: `low`
  - suspectedOwner: `n/a`
  - short finding: adjacent-only는 low cap 유지
- `NG5A1-CASE-20260405-023`
  - expectedBand: `mid`
  - payload_summary: single direct project role only
  - actualAxisScore: `80`
  - actualBand: `high`
  - narrative: `직무와 유사한 프로젝트나 인턴 경험이 있어 실무 투입 시 적응이 빠를 것으로 보입니다.`
  - driftType: `score`
  - severity: `medium`
  - suspectedOwner: `buildNewgradAxisPack`
  - short finding: single direct role 1건이면 current rule은 high 쪽으로 읽는다
- `NG5A1-CASE-20260405-024`
  - expectedBand: `high`
  - payload_summary: single direct role + major support
  - actualAxisScore: `80`
  - actualBand: `high`
  - narrative: `직무와 유사한 프로젝트나 인턴 경험이 있어 실무 투입 시 적응이 빠를 것으로 보입니다.`
  - driftType: `match`
  - severity: `low`
  - suspectedOwner: `n/a`
  - short finding: weak/related major가 direct role 부재를 보완한다기보다 direct role이 이미 핵심이다
- `NG5A1-CASE-20260405-025`
  - expectedBand: `mid`
  - payload_summary: repeated adjacent signals
  - actualAxisScore: `40`
  - actualBand: `low`
  - narrative: `직무와 관련된 간접적인 경험은 있으나, 핵심 과업과는 거리가 있습니다.`
  - driftType: `score`
  - severity: `medium`
  - suspectedOwner: `buildNewgradAxisPack`
  - short finding: repeated adjacent는 count 가산 없이 low에 머문다
- `NG5A1-CASE-20260405-026`
  - expectedBand: `low`
  - payload_summary: direct role 없음 + generic activity only
  - actualAxisScore: `40`
  - actualBand: `low`
  - narrative: `직무와 관련된 간접적인 경험은 있으나, 핵심 과업과는 거리가 있습니다.`
  - driftType: `match`
  - severity: `low`
  - suspectedOwner: `n/a`
  - short finding: generic activity only low cap 유지

### boundary reading
- single direct role 1건은 이번 stress run에서도 다시 `high`로 올라갔다.
- major support는 direct role 부재를 과도하게 보완하지 않았다.
- repeated adjacent signals는 reviewer 기대와 달리 `mid`가 아니라 `low`에 머물렀다.
- generic activity only는 안정적으로 low cap이 유지된다.
## 2026-04-05 Axis 3 Micro-Boundary Confirmation

### axis 3 micro cases

#### `NG5A3-CASE-20260405-031`
- axisTarget: `responsibilityScope`
- bucket: `upper-mid-low edge`
- expectedBand: `mid`
- input_summary: 프로젝트 1건만 있고 outcome / duration lift 없음
- actualAxisScore: `60`
- actualBandInterpretation: `mid`
- narrative_summary: 목표를 세우고 끝까지 완수한 경험 요약
- driftType: `match`
- severity: `low`
- suspectedOwner: `buildNewgradAxisPack.scoreExecutionDepth`
- short_finding: evidenceGroup 1 + item 1이면 high-side jump가 없다.

#### `NG5A3-CASE-20260405-032`
- axisTarget: `responsibilityScope`
- bucket: `upper-mid-low edge`
- expectedBand: `mid`
- input_summary: 짧은 인턴 1건 + 활동 1건, outcome lift 없음
- actualAxisScore: `60`
- actualBandInterpretation: `mid`
- narrative_summary: 완수 경험 요약
- driftType: `match`
- severity: `low`
- suspectedOwner: `buildNewgradAxisPack.scoreExecutionDepth`
- short_finding: group 2여도 item 2 + semantic lift 없음이면 mid에 머문다.

#### `NG5A3-CASE-20260405-033`
- axisTarget: `responsibilityScope`
- bucket: `exact upper-mid candidate`
- expectedBand: `mid`
- input_summary: 프로젝트 1건 + 짧은 인턴 1건, outcome lift 없음
- actualAxisScore: `80`
- actualBandInterpretation: `high`
- narrative_summary: 핵심 역할과 결과물 경험 강조
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack.scoreExecutionDepth`
- short_finding: project + internship 조합만으로 high-side로 상승했다.

#### `NG5A3-CASE-20260405-034`
- axisTarget: `responsibilityScope`
- bucket: `exact upper-mid candidate`
- expectedBand: `mid`
- input_summary: 프로젝트 1건 + 짧은 인턴 1건 + 발표/제출 단서
- actualAxisScore: `80`
- actualBandInterpretation: `high`
- narrative_summary: 핵심 역할과 결과물 경험 강조
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack.scoreExecutionDepth`
- short_finding: item/group 조합이 유지되면 약한 outcome 추가 여부와 무관하게 high-side였다.

#### `NG5A3-CASE-20260405-035`
- axisTarget: `responsibilityScope`
- bucket: `upper-mid-high edge`
- expectedBand: `high`
- input_summary: 프로젝트 1건 + 인턴 1건 + 실제 적용/운영 반영
- actualAxisScore: `100`
- actualBandInterpretation: `high`
- narrative_summary: 실제 현업 책임 경험 강조
- driftType: `match`
- severity: `low`
- suspectedOwner: `buildNewgradAxisPack.scoreExecutionDepth`
- short_finding: strong outcome / context가 붙으면 확실히 high다.

#### `NG5A3-CASE-20260405-036`
- axisTarget: `responsibilityScope`
- bucket: `upper-mid-high edge`
- expectedBand: `high`
- input_summary: 프로젝트 1건 + 인턴 1건 + 수상/우수성과
- actualAxisScore: `100`
- actualBandInterpretation: `high`
- narrative_summary: 실제 현업 책임 경험 강조
- driftType: `match`
- severity: `low`
- suspectedOwner: `buildNewgradAxisPack.scoreExecutionDepth`
- short_finding: high control은 계속 안정적이다.

### axis 3 micro reading
- repeated_variable: `evidenceGroupCount >= 2` 와 `project + internship` 조합이 가장 강하게 high-side jump를 만든다.
- repeated_variable: weak outcome 유무보다 `project + internship`의 그룹 조합 자체가 더 큰 영향으로 읽힌다.
- reviewer_note: reviewer의 mid 정의를 더 좁히는 것보다 threshold가 upper-mid에서 공격적으로 보이는 쪽이 더 그럴듯하다.
- readiness_judgment: `patch_ready`
- readiness_reason:
  - 같은 방향의 upper-mid inflation이 prior 2건 + micro 2건으로 4건 반복됐다.
  - 변수 조합도 `project + internship` 기반으로 설명된다.
  - lower-mid / true-mid / high control은 안정적이라 noise보다는 threshold 경계 문제에 가깝다.

## 2026-04-05 Axis 1 Expectation Clarification Cases

#### `NG5A1-CASE-20260405-031`
- axisTarget: `jobStructure`
- expectedBand: `high`
- input_summary: single direct role only + no supporting major
- actualAxisScore: `80`
- actualBandInterpretation: `high`
- driftType: `match`
- severity: `low`
- suspectedOwner: `buildNewgradAxisPack.scoreJobFit`
- short_finding: directCount 1이면 high-side라는 current contract와 일치했다.

#### `NG5A1-CASE-20260405-032`
- axisTarget: `jobStructure`
- expectedBand: `high`
- input_summary: single direct role only + weak supporting major
- actualAxisScore: `80`
- actualBandInterpretation: `high`
- driftType: `match`
- severity: `low`
- suspectedOwner: `buildNewgradAxisPack.scoreJobFit`
- short_finding: weak major support는 high-side 판정을 바꾸지 않았다.

#### `NG5A1-CASE-20260405-033`
- axisTarget: `jobStructure`
- expectedBand: `low`
- input_summary: repeated adjacent only + no direct role
- actualAxisScore: `40`
- actualBandInterpretation: `low`
- driftType: `match`
- severity: `low`
- suspectedOwner: `buildNewgradAxisPack.scoreJobFit`
- short_finding: adjacent repetition은 directCount를 만들지 못해 low에 머문다.

#### `NG5A1-CASE-20260405-034`
- axisTarget: `jobStructure`
- expectedBand: `low`
- input_summary: repeated adjacent + weak generic activity
- actualAxisScore: `40`
- actualBandInterpretation: `low`
- driftType: `match`
- severity: `low`
- suspectedOwner: `buildNewgradAxisPack.scoreJobFit`
- short_finding: generic activity는 low cap을 깨지 못했다.

### axis 1 expectation clarification reading
- contract_reread:
  - `single direct role signal`은 `directCount >= 1 => 4`로 이미 high-side 신호다.
  - `adjacent repetition`은 `bestRoleLevel >= 1`로만 읽히며 directCount 누적이 없어 low 또는 mid-low에 머문다.
  - `major only`는 `majorRelevant => 3`이라 구조적으로 mid가 맞다.
- clarification_judgment: `expectation too conservative`
- reviewer_guideline_draft:
  - single direct role 1건은 추가 major support가 없어도 high-side 후보로 본다.
  - repeated adjacent signal은 direct role 부재를 대체하지 못하므로 low 우선으로 본다.
  - major-only는 직무 연결 단서가 아니라 전공 적합성 보정이므로 mid를 기본값으로 둔다.
## 2026-04-05 Certification QA Case Skeleton

### case template
- caseId
- targetAxis or targetQuestion
- currentMajor
- certifications
- projects
- internships
- activities
- targetJobId
- targetIndustryId
- expectedBand
- expectedReasoning
- certImportanceHypothesis
- likelyConfusers
- reviewerNote

### must-cover certification cases

#### `NGCERT-CASE-20260405-001`
- targetQuestion: `관련 직무 핵심 자격증 only`
- currentMajor: `무관 전공`
- certifications: `ADsP`
- projects: `없음`
- internships: `없음`
- activities: `없음`
- targetJobId: `JOB_IT_DATA_DIGITAL_DATA_ANALYST`
- targetIndustryId: `IT_SOFTWARE_PLATFORM`
- expectedBand: `low`
- expectedReasoning: cert only는 low cap이 우선이어야 한다.
- certImportanceHypothesis: 데이터 직무 핵심 cert라도 단독으로는 high 근거가 아니다.
- likelyConfusers: related industry keyword와 cert label이 같이 있어 과대평가될 수 있다.
- reviewerNote: cert-only cap 확인용

#### `NGCERT-CASE-20260405-002`
- targetQuestion: `무관 자격증 only`
- currentMajor: `무관 전공`
- certifications: `토익`
- projects: `없음`
- internships: `없음`
- activities: `없음`
- targetJobId: `JOB_FINANCE_ACCOUNTING_FINANCIAL_PLANNING`
- targetIndustryId: `FINANCE_INSURANCE_FINTECH`
- expectedBand: `low`
- expectedReasoning: 무관 cert only는 direct raise 근거가 되면 안 된다.
- certImportanceHypothesis: generic language cert는 industry understanding 증거가 약하다.
- likelyConfusers: language category가 일부 industry profile과 약하게 겹칠 수 있다.
- reviewerNote: non-linked cert guardrail 확인용

#### `NGCERT-CASE-20260405-003`
- targetQuestion: `관련 전공 없음 + 핵심 자격증 only`
- currentMajor: `심리학`
- certifications: `정보처리기사`
- projects: `없음`
- internships: `없음`
- activities: `없음`
- targetJobId: `JOB_ENGINEERING_DEVELOPMENT_BACKEND_ENGINEER`
- targetIndustryId: `IT_SOFTWARE_PLATFORM`
- expectedBand: `low`
- expectedReasoning: 핵심 cert라도 applied evidence 없이 mid를 넘기면 안 된다.
- certImportanceHypothesis: IT cert only가 related-major 부재를 얼마나 보완하는지 확인
- likelyConfusers: 개발 직무 자체가 cert keyword와 가깝다.
- reviewerNote: cert-only under/over-lift 체크

#### `NGCERT-CASE-20260405-004`
- targetQuestion: `관련 전공 있음 + 무관 자격증 only`
- currentMajor: `경영학`
- certifications: `토익`
- projects: `없음`
- internships: `없음`
- activities: `없음`
- targetJobId: `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
- targetIndustryId: `FINANCE_INSURANCE_FINTECH`
- expectedBand: `mid`
- expectedReasoning: mid의 근거는 major이며 무관 cert가 추가 가산을 만들면 안 된다.
- certImportanceHypothesis: unrelated cert noise가 major reading을 왜곡하는지 확인
- likelyConfusers: language cert가 weakSignalCount로 작동할 수 있다.
- reviewerNote: major baseline 유지 체크

#### `NGCERT-CASE-20260405-005`
- targetQuestion: `관련 프로젝트 없음 + 핵심 자격증 only`
- currentMajor: `경제학`
- certifications: `AFPK`
- projects: `없음`
- internships: `없음`
- activities: `없음`
- targetJobId: `JOB_FINANCE_ACCOUNTING_FINANCIAL_PLANNING`
- targetIndustryId: `FINANCE_INSURANCE_FINTECH`
- expectedBand: `mid`
- expectedReasoning: related major + linked cert는 thin evidence라도 mid까지는 가능해야 한다.
- certImportanceHypothesis: finance linked cert가 related major와 결합될 때 under-lift가 있는지 확인
- likelyConfusers: prior Axis 2 major/cert under-lift pattern
- reviewerNote: related major + linked cert 확인용

#### `NGCERT-CASE-20260405-006`
- targetQuestion: `관련 인턴 있음 + 핵심 자격증 추가`
- currentMajor: `경제학`
- certifications: `AFPK`
- projects: `없음`
- internships: `금융권 인턴 1건`
- activities: `없음`
- targetJobId: `JOB_FINANCE_ACCOUNTING_FINANCIAL_PLANNING`
- targetIndustryId: `FINANCE_INSURANCE_FINTECH`
- expectedBand: `high`
- expectedReasoning: direct internship context에 linked cert가 붙으면 high-side 후보가 된다.
- certImportanceHypothesis: cert가 context evidence 위에 support signal로 붙는지 확인
- likelyConfusers: internship만으로도 이미 mid 이상일 수 있다.
- reviewerNote: additive support 확인용

#### `NGCERT-CASE-20260405-007`
- targetQuestion: `같은 자격증 + 목표 직무만 다름`
- currentMajor: `경영학`
- certifications: `GA4`
- projects: `없음`
- internships: `없음`
- activities: `없음`
- targetJobId: `JOB_MARKETING_PERFORMANCE_MARKETING`
- targetIndustryId: `DISTRIBUTION_COMMERCE_CONSUMER_GOODS`
- expectedBand: `low`
- expectedReasoning: current scoring은 job-specific cert weighting이 없으므로 industry-only 수준으로 읽힐 가능성이 높다.
- certImportanceHypothesis: same cert를 job별로 차등 반영하지 못하는지 확인
- likelyConfusers: marketing 직무 상식상 relevance가 높아 reviewer가 과대 기대할 수 있다.
- reviewerNote: job-specific weight gap 확인용

#### `NGCERT-CASE-20260405-008`
- targetQuestion: `같은 목표 직무 + 관련 자격증 vs 무관 자격증 비교`
- currentMajor: `무관 전공`
- certifications: `정보처리기사 vs 토익`
- projects: `없음`
- internships: `없음`
- activities: `없음`
- targetJobId: `JOB_ENGINEERING_DEVELOPMENT_BACKEND_ENGINEER`
- targetIndustryId: `IT_SOFTWARE_PLATFORM`
- expectedBand: `low vs low`
- expectedReasoning: 둘 다 cert only라 low cap이지만 related cert 쪽 reasoning이 더 긍정적으로 읽혀야 한다.
- certImportanceHypothesis: band는 같아도 reasoning 차이가 생기는지 확인
- likelyConfusers: band match만 보고 cert differentiation이 없다고 오판할 수 있다.
- reviewerNote: band + reasoning 동시 비교용

### execution recommendation
- 이번 라운드는 설계까지만 잠근다.
- 이유:
  - coverage gap와 scoring usage gap를 먼저 분리 문서화해야 reviewer가 expectedBand를 안정적으로 잡을 수 있다.
  - current path가 canonical cert asset을 직접 안 쓰기 때문에 실행 전 case payload를 UI-asset 기준과 raw asset 기준으로 분리해야 한다.
## 2026-04-05 Axis 3 Post-Patch Replay + Regression Fixtures

### replay summary
- harness: `buildNewgradTransitionLiteResult(payload)` + same normalized input 기준 pre-patch `scoreExecutionDepth()` formula replay
- total replayed: `12`
- changed: `4`
- desired: `12`
- undesired: `0`
- verdict candidate: `keep_with_watch`

### fixed regression fixtures
- `NG5A3-CASE-20260405-025`
  - group: `inflation target fixture`
  - purpose: `project + short internship + activity + 발표/제출 조합이 100/high에서 80/mid_high로 내려와야 한다.`
  - expected direction: `after < before`
  - sensitivity note: `base 4 + combo + medium outcome`
- `NG5A3-CASE-20260405-026`
  - group: `inflation target fixture`
  - purpose: `project + short internship + activity + 결과물 완성 조합이 100/high에서 80/mid_high로 내려와야 한다.`
  - expected direction: `after < before`
  - sensitivity note: `base 4 + combo + medium outcome`
- `NG5A3-CASE-20260405-033`
  - group: `inflation target fixture`
  - purpose: `project + long internship + activity upper-mid가 100/high에서 80/mid_high로 내려와야 한다.`
  - expected direction: `after < before`
  - sensitivity note: `base 4 + combo + duration lift`
- `NG5A3-CASE-20260405-034`
  - group: `inflation target fixture`
  - purpose: `project + short internship + part-time + 발표/제출 조합이 100/high에서 80/mid_high로 내려와야 한다.`
  - expected direction: `after < before`
  - sensitivity note: `base 4 + combo + medium outcome + third evidence`
- `NG5A3-CASE-20260405-011`
  - group: `true high preserve fixture`
  - purpose: `projects 2 + internship 1 high control은 100/high 유지`
  - expected direction: `unchanged high`
  - sensitivity note: `repeated core evidence`
- `NG5A3-CASE-20260405-035`
  - group: `true high preserve fixture`
  - purpose: `project + internship + strong outcome high control은 100/high 유지`
  - expected direction: `unchanged high`
  - sensitivity note: `high outcome exempt`
- `NG5A3-CASE-20260405-022`
  - group: `stable mid preserve fixture`
  - purpose: `project + activity no semantic lift는 60/mid 유지`
  - expected direction: `unchanged mid`
  - sensitivity note: `stable lower-mid control`
- `NG5A3-CASE-20260405-015`
  - group: `low preserve fixture`
  - purpose: `activity only는 40/low 유지`
  - expected direction: `unchanged low`
  - sensitivity note: `low cap preserve`

### usage rule
- Axis 3 owner block 수정 전후에는 위 8건을 항상 같은 harness로 재실행한다.
- `inflation target fixture`는 `after < before`가 유지되어야 한다.
- `preserve fixture`는 band, displayScore, narrative tier가 흔들리면 회귀로 본다.
- coarse 3-band만 보지 말고 `displayScore`와 narrative 문장 레벨도 같이 본다.
