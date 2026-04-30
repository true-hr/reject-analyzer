# PASSMAP Transition Case Matrix P0

> **목적**: F-0A 전략을 바탕으로 P0 profile 3개의 case matrix를 정의한다.
> 이 문서는 runtime 구현 전, 중복/경계/co-fire 위험을 줄이기 위한 설계 문서다.
>
> **작성**: Round F-0B (2026-04-30)
> **상태**: DESIGN DRAFT — 코드 수정 없음. 구현 라운드(F-2 이후) 전까지 SSOT.

---

## 1. Purpose

F-0A에서 수립한 전략을 바탕으로, 아래 3개 P0 profile에 대한 case matrix를 설계한다.

1. `CUSTOMER_SUPPORT_TO_SERVICE_PLANNING`
2. `FINANCE_TO_DATA_ANALYSIS`
3. `MARKETING_TO_PRODUCT_PLANNING`

이 문서에서 하는 것:
- 각 profile의 probe / activation / boundary / co-fire case 정의
- 실제 job/industry ID 확인 및 TBD 명시
- D/E layer overlap 위험 체계화
- F-1 probe 실행을 위한 input shape 확정

이 문서에서 하지 않는 것:
- runtime 코드 작성 없음
- fixture 파일 추가 없음
- runner 수정 없음
- 확정 복사 문구 작성 없음

---

## 2. Baseline Guard

### 2-1. D/E Pattern Layer 기준선

D/E pattern layer는 공식 마감된 기준선이다. F profile 추가 후에도 아래 조건을 유지해야 한다.

| 항목 | 기준값 |
|---|---|
| Pattern 수 | 6개 |
| Smoke-runnable fixture 수 | 12개 |
| Runner 결과 | 12 PASS / 0 ISSUE / 0 FAIL |
| Runner 명령 | `"/d/잡다/node.exe" "scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs"` |

### 2-2. F Layer 원칙

- F profile은 `major prior`, `자격증`, `프로젝트`, `강점` 자체를 평가하지 않는다.
- F profile은 `currentJobId`/`currentIndustryId` → `targetJobId`/`targetIndustryId`의 전환 논리를 설명한다.
- F profile은 career 전환 모드(`buildTransitionLiteResult.js`) 기반이다. D/E는 신입 모드(`buildNewgradTransitionLiteResult.js`) 기반이다.
- 같은 axis/slot을 D/E와 F가 동시에 write하면 conflict 발생. co-fire 시 axis 분리 필수.

### 2-3. 모드 분리 확인

| 항목 | D/E Pattern Layer | F Transition Layer |
|---|---|---|
| 빌더 | `buildNewgradTransitionLiteResult.js` | `buildTransitionLiteResult.js` |
| 입력 필드 | `targetJobId`, `targetIndustryId` (source 없음) | `currentJobId`, `currentIndustryId`, `targetJobId`, `targetIndustryId` |
| axis overlay 경로 | `buildNewgradAxisPack.js` → `buildNewgradCaseInsightOverlays` | career axis pack (경로 F-1에서 확인) |
| 발화 조건 | evidence quality (major/projects/certs/strengths) | source→target job/industry 관계 |

---

## 3. Job / Industry ID 레퍼런스

### 3-1. 확정 Job ID (fixture 또는 명시적 `id` 필드로 확인됨)

| Job | ID | 확인 방법 |
|---|---|---|
| 서비스기획 | `JOB_BUSINESS_SERVICE_PLANNING` | 기존 fixture 다수 확인 |
| 데이터분석 | `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS` | 기존 fixture 다수 확인 |
| 프로덕트 매니지먼트(PM/PO) | `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT` | 파일 내 명시적 `id` 필드 확인 |
| FP&A(재무분석) | `JOB_FINANCE_ACCOUNTING_FP_AND_A` | 기존 MATH-002 fixture 확인 |

### 3-2. 파생 Job ID (자동 생성 패턴 `JOB_{vertical}_{subVertical}` — fixture 미확인)

아래 ID는 `jobOntology.index.js`의 `JOB_${majorCategory}_${subcategory}` 자동생성 규칙에서 파생됨. 패턴상 정확하나 fixture에서 실제 사용한 적 없음. **F-1 probe 전에 `getJobOntologyItemById(id)` 호출로 실제 resolve 여부를 확인해야 함.**

| Job | 파생 ID | vertical | subVertical |
|---|---|---|---|
| 고객상담 / CS | `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS` | CUSTOMER_OPERATIONS | CUSTOMER_SUPPORT_CS |
| 퍼포먼스마케팅 | `JOB_MARKETING_PERFORMANCE_MARKETING` | MARKETING | PERFORMANCE_MARKETING |
| CRM 마케팅 | `JOB_MARKETING_CRM_MARKETING` | MARKETING | CRM_MARKETING |
| 브랜드 마케팅 | `JOB_MARKETING_BRAND_MARKETING` | MARKETING | BRAND_MARKETING |
| 디지털 마케팅 | `JOB_MARKETING_DIGITAL_MARKETING` | MARKETING | DIGITAL_MARKETING |
| 콘텐츠 마케팅 | `JOB_MARKETING_CONTENT_MARKETING` | MARKETING | CONTENT_MARKETING |
| 회계 | `JOB_FINANCE_ACCOUNTING_ACCOUNTING` | FINANCE_ACCOUNTING | ACCOUNTING |
| 재무 | `JOB_FINANCE_ACCOUNTING_FINANCE` | FINANCE_ACCOUNTING | FINANCE |
| 관리회계 | `JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING` | FINANCE_ACCOUNTING | MANAGEMENT_ACCOUNTING |

### 3-3. 확정 Industry ID

| 산업 | ID | 확인 방법 |
|---|---|---|
| IT 플랫폼(B2C) | `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM` | 기존 fixture 다수 확인 |
| IT 플랫폼(AI/데이터/클라우드) | `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD` | 기존 fixture 다수 확인 |
| 금융/보험/핀테크(은행/대출) | `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING` | fixture + 파일 `id` 필드 확인 |
| 제조/전자/반도체 | `IND_MANUFACTURING_ELECTRONICS_SEMICONDUCTOR` | 기존 MATH-003 fixture 확인 |

### 3-4. TBD Industry ID

아래 산업은 F-1 probe에서 필요할 수 있으나 현재 ID 미확인. 사용 전 `industryRegistry.index.js` 직접 확인 필요.

| 산업 | TBD ID |
|---|---|
| 유통/이커머스 | TBD — `IND_DISTRIBUTION_COMMERCE_*` 패턴 예상 |
| 마케팅/광고/미디어 | TBD — 별도 sector 확인 필요 |
| 일반 금융(증권/자산운용) | TBD — `IND_FINANCE_INSURANCE_FINTECH_*` 계열 예상 |

---

## 4. Profile Matrix

### 4-1. CUSTOMER_SUPPORT_TO_SERVICE_PLANNING

#### Profile 개요

| 항목 | 내용 |
|---|---|
| profileId | `CUSTOMER_SUPPORT_TO_SERVICE_PLANNING` |
| sourceJobFamily | `CUSTOMER_SUPPORT_CS` (subVertical) |
| targetJobFamily | `SERVICE_PLANNING` (subVertical) |
| transitionType | `ADJACENT` |
| overclaimRisk | `MEDIUM` |
| priority | `P0` |
| status | `PROPOSED` |

**기존 SPECIAL rule 비중복 확인**:
- `SPECIAL_B2C_CS_TO_B2B_CSM`: target=CSM, 이 profile은 target=서비스기획 → **비중복**
- `SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING`: source=Sales Ops/Ops, target=전략/사업기획 → **비중복**
- D/E `CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT`: **신입 모드 전용** (targetJobId + canonicalWorkRowsRaw 기반). F profile은 career 모드 기반 → 모드 분리로 코드 충돌 없음. 단, axis 겹침은 별도 확인 필요.

#### Case A. TR-PROBE-CS-TO-SERVICE-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-PROBE-CS-TO-SERVICE-001` |
| testType | `PROBE` |
| 목적 | 현재 generic output 확인 — F profile 미존재 상태에서 어떤 텍스트가 나오는지 기록 |
| currentJobId | `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS` *(파생 — F-1 전 resolve 확인)* |
| currentIndustryId | `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM` |
| targetJobId | `JOB_BUSINESS_SERVICE_PLANNING` |
| targetIndustryId | `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM` |
| workExp | `[{ role: "고객상담", months: 12 }]` *(실제 input shape는 F-1에서 확인)* |
| projects | `[]` |
| certs | `[]` |
| strengths | `[]` |
| expectedProfileIds | 없음 |
| 확인할 output | `axisPack.axes.customerType.explanation.lead`, `axisPack.axes.responsibilityScope.explanation.lead` |
| generic 판단 기준 | "CS 경험" 또는 "고객 응대" 표현이 아예 없으면 완전 generic; 있어도 기획 방향 언급 없으면 partially generic |
| status | `PROPOSED_PROBE` |

#### Case B. TR-PROFILE-CS-TO-SERVICE-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-PROFILE-CS-TO-SERVICE-001` |
| testType | `PROFILE_ACTIVATION` |
| 목적 | F profile 구현 후 발화 계약 고정 — F-2 이후 사용 |
| currentJobId | `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS` |
| targetJobId | `JOB_BUSINESS_SERVICE_PLANNING` |
| positive bridge | VOC/고객 불편 분석, 반복 문의 유형 파악, 사용 맥락 관찰 경험 |
| limitation | 요구사항 정의서·기능 개선안·화면 흐름·우선순위 판단 산출물 부족 |
| recommended evidence | VOC 분석표, 개선안, 기능정의서, 화면흐름도, 우선순위 판단 근거 |
| target axis 후보 | `customerType` (primary), `responsibilityScope` (secondary) |
| preferred slots | `customerType.lead`, `customerType.scoreReason`, `responsibilityScope.liftOrLimit` |
| shouldMention 후보 | "고객 불편을 기획 방향으로", "VOC 분석", "요구사항 정의", "기획 산출물" |
| shouldNotMention 후보 | "고객 응대 자체가 서비스기획 경험" (과대해석 방지) |
| status | `PROPOSED` |

#### Case C. TR-BOUNDARY-CS-TO-SERVICE-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-BOUNDARY-CS-TO-SERVICE-001` |
| testType | `BOUNDARY_NON_FIRE` |
| 목적 | 단순 콜/불만처리만 있고 VOC 분석·개선안 없는 경우 profile 미발화 확인 |
| 발화하면 안 되는 조건 | 단순 친절 응대, 반복 문의 처리, 고객 불만 해소만 있음 / VOC 분석·개선 제안 이력 없음 |
| shouldNotMention | "VOC를 기능 개선안으로", "서비스기획의 문제 발견 단계와 연결" |
| boundary 이유 | 고객 접점은 있지만, 기획 전환 근거로 과대해석 금지 — 고객 응대 ≠ 사용자 리서치 |
| input 특징 | 동일한 currentJobId+targetJobId이지만 workExp.description이 단순 응대 수준 |
| status | `PROPOSED` |
| 구현 시기 | F-2 이후 (Profile Activation Fixture와 쌍으로 추가) |

#### Case D. TR-COFIRE-CS-TO-SERVICE-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-COFIRE-CS-TO-SERVICE-001` |
| testType | `CO_FIRE` |
| 목적 | D/E `CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT`와의 co-fire axis 충돌 검증 |
| 시나리오 | **신입** + 사회학 전공 + 서비스기획 희망 + CS 인턴 경험 + 프로젝트 없음 |
| 예상 발화 | D/E `CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT` (신입 모드) |
| F profile 발화 여부 | **없음** — 신입 모드에서는 F profile 미발화 (currentJobId 없음) |
| conflict risk | **LOW** — 모드 분리로 구조적 충돌 없음. 단, 동일 axis를 양쪽이 overlay하는 경로가 있다면 확인 필요. |
| axis 겹침 | D/E: `customerType` + `responsibilityScope`. F profile 후보: `customerType` + `responsibilityScope` → **같은 axis** — F-1에서 career mode axis overlay 경로 분리 여부 확인 필수 |
| status | `PROPOSED` |

---

### 4-2. FINANCE_TO_DATA_ANALYSIS

#### Profile 개요

| 항목 | 내용 |
|---|---|
| profileId | `FINANCE_TO_DATA_ANALYSIS` |
| sourceJobFamily | `ACCOUNTING`, `FINANCE`, `FP_AND_A`, `MANAGEMENT_ACCOUNTING` (subVertical 복수) |
| targetJobFamily | `DATA_ANALYSIS` (subVertical) |
| transitionType | `ADJACENT` |
| overclaimRisk | `MEDIUM` |
| priority | `P0` |
| status | `PROPOSED` |

**기존 SPECIAL rule 비중복 확인**:
- 9개 SPECIAL rule 중 finance→data 경로 없음 → **완전 신규**

**D/E pattern 관계**:
- `CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE`: 자격증만 있고 경험 없을 때 발화. 금융 전문가가 ADsP만 따고 데이터분석 지원하면 D/E 발화 + F profile 잠재 co-fire → `industryContext` axis 겹침 위험 **HIGH**
- `NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA`: 비전공+무경험+개발/데이터 희망. 신입 전용 → F와 모드 분리
- `NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA`: 신입 전용 → F와 모드 분리

#### Case A. TR-PROBE-FINANCE-TO-DATA-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-PROBE-FINANCE-TO-DATA-001` |
| testType | `PROBE` |
| 목적 | 회계/재무 → 데이터분석 지원 시 현재 generic output 확인 |
| currentJobId | `JOB_FINANCE_ACCOUNTING_ACCOUNTING` *(파생 — F-1 전 resolve 확인)* |
| currentIndustryId | `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING` |
| targetJobId | `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS` |
| targetIndustryId | `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD` |
| workExp | `[{ role: "회계", months: 24 }]` |
| projects | `[]` |
| certs | `[]` |
| strengths | `[]` |
| expectedProfileIds | 없음 |
| 확인할 output | `axisPack.axes.responsibilityScope.explanation.lead`, `axisPack.axes.industryContext.explanation.lead` |
| generic 판단 기준 | 재무 경험과 데이터 직무 연결 언급 없으면 generic; "수치 분석"만 언급되어도 partially generic |
| status | `PROPOSED_PROBE` |

#### Case B. TR-PROFILE-FINANCE-TO-DATA-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-PROFILE-FINANCE-TO-DATA-001` |
| testType | `PROFILE_ACTIVATION` |
| 목적 | F profile 구현 후 발화 계약 고정 — F-2 이후 사용 |
| sourceJobFamily | `ACCOUNTING`, `FINANCE`, `FP_AND_A`, `MANAGEMENT_ACCOUNTING` (복수) |
| targetJobFamily | `DATA_ANALYSIS` |
| positive bridge | 숫자 해석 습관, 지표 이해, 정확성/오류 감지, 재무 보고서 작성, 재무 데이터 이해 |
| limitation | SQL/Python 기반 추출·가공·분석 자동화 경험 부족, 모델링, 대시보드 경험 없음 |
| recommended evidence | SQL 쿼리 결과물, Python 분석 스크립트, 재무 데이터 대시보드, 자동화 산출물 |
| target axis 후보 | `responsibilityScope` (primary), `industryContext` (secondary) |
| preferred slots | `responsibilityScope.lead`, `responsibilityScope.liftOrLimit` |
| shouldMention 후보 | "숫자 해석 능력은 데이터분석의 기반", "재무 데이터 이해도", "SQL/Python 기반 분석 경험" |
| shouldNotMention 후보 | "재무 경험이 데이터분석 역량과 동일" (과대해석 방지) |
| status | `PROPOSED` |

#### Case C. TR-BOUNDARY-FINANCE-TO-DATA-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-BOUNDARY-FINANCE-TO-DATA-001` |
| testType | `BOUNDARY_NON_FIRE` |
| 목적 | 단순 전표 처리/반복 정산만 있고 지표 해석이 없는 경우 profile 미발화 확인 |
| 발화하면 안 되는 조건 | 단순 전표 입력, 정산 업무, 숫자 입력 반복 / 지표 분석·보고서 작성 없음 |
| shouldNotMention | "재무 데이터 이해도가 데이터분석 직무 전환의 직접 근거" |
| boundary 이유 | 숫자 업무 ≠ 데이터 분석 능력. 단순 수치 입력을 분석 역량으로 과대해석 금지 |
| status | `PROPOSED` |

#### Case D. TR-COFIRE-FINANCE-TO-DATA-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-COFIRE-FINANCE-TO-DATA-001` |
| testType | `CO_FIRE` |
| 목적 | D/E `CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE`와의 co-fire axis 충돌 검증 |
| 시나리오 | 회계 경력 1년 + ADsP 자격증 보유 + 프로젝트/인턴십 없음 + 데이터분석 지원 |
| 예상 D/E 발화 | `CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE` (신입 모드, `industryContext` axis) |
| 예상 F profile 발화 | `FINANCE_TO_DATA_ANALYSIS` (career 모드) |
| conflict risk | **HIGH** — 두 레이어가 모두 `industryContext` 또는 `responsibilityScope`를 타겟으로 할 경우 slot overwrite 가능 |
| 해결 방향 | F profile은 `responsibilityScope`를 primary axis로, `industryContext`는 D/E CERT_ONLY에 양보. 또는 career mode에서는 D/E CERT_ONLY 미발화 확인. |
| 확인 필요 | career mode에서 D/E pattern이 발화하는지 여부 — 분리되어 있다면 conflict 없음 |
| status | `PROPOSED` |
| 주의 | **F-1 probe에서 반드시 career mode vs newgrad mode axis overlay 경로 분리 여부 확인** |

---

### 4-3. MARKETING_TO_PRODUCT_PLANNING

#### Profile 개요

| 항목 | 내용 |
|---|---|
| profileId | `MARKETING_TO_PRODUCT_PLANNING` |
| sourceJobFamily | `PERFORMANCE_MARKETING`, `CRM_MARKETING`, `BRAND_MARKETING`, `DIGITAL_MARKETING` (subVertical 복수) |
| targetJobFamily | `SERVICE_PLANNING`, `PRODUCT_MANAGEMENT` (subVertical 복수) |
| transitionType | `ADJACENT` |
| overclaimRisk | `MEDIUM` |
| priority | `P0` |
| status | `PROPOSED` |

**기존 SPECIAL rule 비중복 확인**:
- `SPECIAL_PERFORMANCE_MARKETING_TO_PMM`: source=PERFORMANCE_MARKETING 또는 CRM_MARKETING, target=PRODUCT_MARKETING_PMM. 이 profile은 target이 SERVICE_PLANNING 또는 PRODUCT_MANAGEMENT — target 다름. **비중복. 단, source가 겹침 → boundary fixture 필수.**

#### Case A. TR-PROBE-MARKETING-TO-PRODUCT-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-PROBE-MARKETING-TO-PRODUCT-001` |
| testType | `PROBE` |
| 목적 | 퍼포먼스마케팅 → 서비스기획/PM 지원 시 현재 generic output 확인 |
| currentJobId | `JOB_MARKETING_PERFORMANCE_MARKETING` *(파생 — F-1 전 resolve 확인)* |
| currentIndustryId | `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM` |
| targetJobId | `JOB_BUSINESS_SERVICE_PLANNING` |
| targetIndustryId | `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM` |
| workExp | `[{ role: "퍼포먼스마케팅", months: 18 }]` |
| projects | `[]` |
| certs | `[]` |
| strengths | `[]` |
| expectedProfileIds | 없음 |
| 확인할 output | `axisPack.axes.jobStructure.explanation.lead`, `axisPack.axes.responsibilityScope.explanation.lead` |
| generic 판단 기준 | 마케팅 → 기획 전환 논리 언급 없으면 generic |
| status | `PROPOSED_PROBE` |

**Probe 변형: PM 타겟**

| 항목 | 내용 |
|---|---|
| caseId | `TR-PROBE-MARKETING-TO-PM-001` |
| 변경 | targetJobId를 `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT`로 변경 |
| 목적 | 서비스기획 vs PM 타겟별 output 차이 확인 |
| status | `PROPOSED_PROBE` |

#### Case B. TR-PROFILE-MARKETING-TO-PRODUCT-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-PROFILE-MARKETING-TO-PRODUCT-001` |
| testType | `PROFILE_ACTIVATION` |
| 목적 | F profile 구현 후 발화 계약 고정 — F-2 이후 사용 |
| positive bridge | 고객 반응 해석, 퍼널 분석, 전환율 기반 판단, 캠페인 성과 기반 의사결정 |
| limitation | 제품 요구사항 정의, 기능 우선순위, 개발팀 협업, 화면 흐름/정책 설계 경험 부족 |
| recommended evidence | A/B 테스트 결과, 기능 개선 제안서, 고객 세그먼트 분석, PRD 초안, 화면 흐름도, 우선순위 판단 근거 |
| target axis 후보 | `jobStructure` (primary), `responsibilityScope` (secondary), `customerType` (optional) |
| preferred slots | `jobStructure.lead`, `responsibilityScope.liftOrLimit` |
| shouldMention 후보 | "고객 반응 데이터를 기획 근거로", "기능 개선 방향", "제품 요구사항 정의" |
| shouldNotMention 후보 | "마케팅 경험이 PM 역량과 동일" (과대해석 방지) |
| status | `PROPOSED` |

#### Case C. TR-BOUNDARY-MARKETING-TO-PRODUCT-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-BOUNDARY-MARKETING-TO-PRODUCT-001` |
| testType | `BOUNDARY_NON_FIRE` |
| 목적 | 콘텐츠 업로드/광고 운영/SNS 관리만 있고 기획 산출물 없는 경우 미발화 확인 |
| 발화하면 안 되는 조건 | 콘텐츠 업로드, 광고 소재 제작, SNS 게시 업무만 / 고객 행동 분석·기능 개선 이력 없음 |
| shouldNotMention | "마케팅 경험이 PM의 직접 근거", "제품 기획 경험으로 해석 가능" |
| boundary 이유 | 콘텐츠/광고 운영 ≠ 제품 기획 역량. 실행 업무 ↔ 기획 의사결정은 다름. |
| status | `PROPOSED` |

#### Case D-1. TR-BOUNDARY-MARKETING-TO-PMM-001 (SPECIAL rule boundary)

| 항목 | 내용 |
|---|---|
| caseId | `TR-BOUNDARY-MARKETING-TO-PMM-001` |
| testType | `BOUNDARY_NON_FIRE` |
| 목적 | targetJob이 PMM일 때 이 profile 미발화 확인 — SPECIAL_PERFORMANCE_MARKETING_TO_PMM과 분리 |
| 발화하면 안 되는 조건 | currentJob=PERFORMANCE_MARKETING, targetJob=PRODUCT_MARKETING_PMM |
| 이유 | SPECIAL_PERFORMANCE_MARKETING_TO_PMM이 담당하는 영역 — F profile 중복 발화 금지 |
| status | `PROPOSED` |

#### Case E. TR-COFIRE-MARKETING-TO-PRODUCT-001

| 항목 | 내용 |
|---|---|
| caseId | `TR-COFIRE-MARKETING-TO-PRODUCT-001` |
| testType | `CO_FIRE` |
| 목적 | D/E `WEAK_MAJOR_STRONG_RELEVANT_PROJECT` 또는 `SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE`와의 co-fire 검증 |
| 시나리오 | 신입 + 비전공 + 서비스기획 지원 + 마케팅 인턴 경험 + 프로젝트 2개 |
| 예상 D/E 발화 | `WEAK_MAJOR_STRONG_RELEVANT_PROJECT` (신입 모드, `jobStructure` + `responsibilityScope`) |
| 예상 F profile 발화 | 없음 — 신입 모드에서는 currentJobId 없어 F profile 미발화 |
| conflict risk | **LOW** — 모드 분리로 구조적 충돌 없음 |
| 변형 시나리오 | career 전환자(경력 있음) + 서비스기획 지원 + 강점만 있고 프로젝트 없음 → D/E `SELF_REPORT`는 신입 전용이므로 career mode에서 미발화. F profile만 발화. |
| status | `PROPOSED` |

---

## 5. Cross-Profile Duplicate Check

유사 전환 패턴 3개 비교: **비중복 근거 명시**

| 항목 | CS → 서비스기획 | 마케팅 → 서비스기획/PM | 영업 → 사업개발/서비스기획 |
|---|---|---|---|
| positive bridge 핵심 | 고객 불편·VOC 직접 경험 → 사용자 관점 | 고객 반응 데이터 해석 → 기획 근거 | 고객 설득·니즈 파악 → 솔루션 발굴 |
| limitation 핵심 | 기획 산출물(화면흐름·정의서) 없음 | 제품 요구사항 정의·개발 협업 없음 | 파트너십 발굴·전략 제안 산출물 없음 |
| recommended evidence | VOC 분석표, 기능 개선안, 화면흐름도 | A/B 결과, PRD 초안, 고객 세그먼트 분석 | 파트너 제안서, 신규 채널 발굴 사례, LOI |
| why 별도 profile | 연결 논리가 "고객 불편 직접 접촉" | 연결 논리가 "데이터 기반 반응 해석" | 연결 논리가 "고객 설득과 가치 제안" |
| target axis | customerType(primary), responsibilityScope | jobStructure(primary), responsibilityScope | TBD (사업개발 axis 구조 F-1에서 확인) |

**중복 판정**: 각각 positive bridge / limitation / evidence 유형이 다름 → **비중복 확인**.

---

## 6. D/E Layer Overlap Check

각 F profile과 D/E 6개 pattern의 관계 요약.

### 모드 분리 전제

D/E pattern은 **신입 모드** (`buildNewgradTransitionLiteResult.js`)에서만 발화한다.
F profile은 **career 전환 모드** (`buildTransitionLiteResult.js`)에서만 발화한다.
같은 사용자가 두 모드를 동시에 사용하지 않으므로 대부분의 co-fire는 이론적 위험이다.

단, 아래 예외 확인 필요:
- career mode에서도 D/E axis overlay 경로가 실행되는지 (`buildNewgradAxisPack.js` 호출 경로)

### CUSTOMER_SUPPORT_TO_SERVICE_PLANNING

| D/E Pattern | 관계 | Conflict Risk | 이유 |
|---|---|---|---|
| WEAK_MAJOR_STRONG_RELEVANT_PROJECT | 무관 | NONE | 신입+약한전공+서비스기획+프로젝트 기반. 소스 경로 다름. |
| CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE | 무관 | NONE | 자격증 기반. CS 경험 있으면 CERT_ONLY 미발화. |
| CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT | **모드 분리** | LOW | 신입 전용. Career mode에서는 발화 안 함. **같은 axis(customerType+responsibilityScope) 사용 → career mode axis overlay 경로 분리 확인 필요** |
| NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA | 무관 | NONE | 개발/데이터 타겟. 서비스기획과 무관. |
| SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE | 무관 | NONE | 신입 강점 기반. Career mode CS 경험자와 겹치지 않음. |
| NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA | 무관 | NONE | 개발/데이터 타겟. 서비스기획과 무관. |

### FINANCE_TO_DATA_ANALYSIS

| D/E Pattern | 관계 | Conflict Risk | 이유 |
|---|---|---|---|
| WEAK_MAJOR_STRONG_RELEVANT_PROJECT | 무관 | NONE | 신입+서비스기획 기반. |
| CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE | **co-fire 주의** | **HIGH** | 금융→데이터 career 전환자가 ADsP만 있을 경우, career mode에서 CERT_ONLY가 발화할 수 있음. 같은 industryContext/responsibilityScope axis 가능성 → slot 분리 확인 필수 |
| CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT | 무관 | NONE | CS+서비스기획 기반. |
| NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA | 모드 분리 | LOW | 신입 전용이나 같은 데이터 axis(responsibilityScope) 사용. Career mode 분리 확인 필요. |
| SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE | 무관 | NONE | 신입 전용. |
| NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA | 모드 분리 | LOW | 신입 전용. 데이터 타겟 같음. Career mode 분리 확인 필요. |

### MARKETING_TO_PRODUCT_PLANNING

| D/E Pattern | 관계 | Conflict Risk | 이유 |
|---|---|---|---|
| WEAK_MAJOR_STRONG_RELEVANT_PROJECT | 모드 분리 | LOW | 신입+서비스기획+약전공. Career mode 분리 확인 필요. 같은 jobStructure/responsibilityScope axis 가능. |
| CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE | 무관 | NONE | 자격증 기반. 마케팅 경력자와 겹치지 않음. |
| CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT | 무관 | NONE | CS 경험 기반. 마케팅 경험과 무관. |
| NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA | 무관 | NONE | 개발/데이터 타겟. |
| SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE | 모드 분리 | LOW | 신입 강점 기반. Career mode 분리 확인 필요. |
| NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA | 무관 | NONE | 개발/데이터 타겟. |

---

## 7. F-1 Probe Recommendation

F-1에서 실행할 probe-only 케이스 3개. runtime patch 없음, 현재 output 기록만.

### Probe 1. TR-PROBE-CS-TO-SERVICE-001

| 항목 | 내용 |
|---|---|
| input | `currentJobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS"` *(resolve 확인 필수)* |
| | `targetJobId: "JOB_BUSINESS_SERVICE_PLANNING"` |
| | `currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM"` |
| | `targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM"` |
| 확인 output | `axisPack.axes.customerType.explanation.lead` |
| | `axisPack.axes.responsibilityScope.explanation.lead` |
| | `axisPack.meta.caseInsightOverlays.firedPatternIds` |
| generic 판단 기준 | lead 텍스트에 "고객 응대", "CS 경험", "VOC" 언급 없으면 완전 generic |
| 추천 이유 | 실사용 빈도 높음. D/E CS 패턴과 axis 겹침 확인 기회. SPECIAL rule과 target 분리 명확. |

### Probe 2. TR-PROBE-FINANCE-TO-DATA-001

| 항목 | 내용 |
|---|---|
| input | `currentJobId: "JOB_FINANCE_ACCOUNTING_ACCOUNTING"` *(resolve 확인 필수)* |
| | `targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS"` |
| | `currentIndustryId: "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING"` |
| | `targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD"` |
| 확인 output | `axisPack.axes.responsibilityScope.explanation.lead` |
| | `axisPack.axes.industryContext.explanation.lead` |
| | `axisPack.meta.caseInsightOverlays.firedPatternIds` (CERT_ONLY 발화 여부) |
| generic 판단 기준 | lead 텍스트에 재무/회계 경험과 데이터 직무 연결 언급 없으면 generic |
| 추천 이유 | SPECIAL rule 없는 신규. D/E CERT_ONLY와 axis co-fire 위험 HIGH → 우선 probe. |

### Probe 3. TR-PROBE-MARKETING-TO-PRODUCT-001

| 항목 | 내용 |
|---|---|
| input | `currentJobId: "JOB_MARKETING_PERFORMANCE_MARKETING"` *(resolve 확인 필수)* |
| | `targetJobId: "JOB_BUSINESS_SERVICE_PLANNING"` |
| | `currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM"` |
| | `targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM"` |
| 확인 output | `axisPack.axes.jobStructure.explanation.lead` |
| | `axisPack.axes.responsibilityScope.explanation.lead` |
| | `axisPack.meta.caseInsightOverlays.firedPatternIds` |
| generic 판단 기준 | lead 텍스트에 마케팅 → 기획 전환 논리 언급 없으면 generic |
| 추천 이유 | SPECIAL PMM rule과 target boundary 검증 필요. 빈도 높은 전환 패턴. |

**공통 확인 사항** (probe 전 선행):
1. `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS`, `JOB_MARKETING_PERFORMANCE_MARKETING`, `JOB_FINANCE_ACCOUNTING_ACCOUNTING` ID가 `getJobOntologyItemById()` 로 실제 resolve되는지 확인
2. career mode에서 D/E axis overlay가 실행되는지 확인 (`buildNewgradAxisPack.js` 호출 경로)
3. `axisPack.meta.caseInsightOverlays.firedPatternIds`가 career mode에서도 존재하는지 확인

---

## 8. Next Step

### F-1 (다음 라운드)

**F-1은 runtime patch 아님 — probe-only.**

1. 위 3개 probe 케이스를 실제 `buildTransitionLiteResult` 기반 probe 스크립트로 실행
2. 파생 Job ID 3개 (`CS`, `퍼포먼스마케팅`, `회계`) resolve 확인
3. career mode에서 D/E axis overlay 경로 분리 여부 확인
4. probe 결과 기록 → case status를 `PROPOSED_PROBE` → `PROBED`로 갱신
5. D/E regression: 12 PASS 유지 확인 (F-1 probe는 코드 변경 없으므로 생략 가능하나 확인 권장)

### F-2 (첫 profile 구현 후보)

F-1 probe 결과를 바탕으로 아래 기준으로 1개 profile 선택:
- generic output 확인 완료
- axis co-fire 위험 낮음
- 파생 ID resolve 확인 완료

**현재 추천**: `CUSTOMER_SUPPORT_TO_SERVICE_PLANNING`
- SPECIAL rule과 target 분리 명확
- axis co-fire 위험 LOW(모드 분리)
- 실사용 빈도 높음
- D/E CS 패턴과 구별 기준 명확 (신입 vs career)

---

## 9. Do Not Touch

- `src/lib/analysis/newgradCaseInsightOverlays.js` — D/E pattern 직접 수정 금지
- `scripts/regression/newgrad-core-invariant-cases.js` — 기존 12개 fixture 수정 금지
- `scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs` — D/E runner 수정 금지
- `docs/COMM_PATCH_NOTES.md` — 직접 수정 금지
- `src/lib/transitionLite/specialTransitionDiagnostics.js` — 기존 9개 SPECIAL rule 수정 금지
