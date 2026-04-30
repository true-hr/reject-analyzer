# PASSMAP Transition Case Test Strategy

> **목적**: 직무·산업 전환 케이스를 무작정 추가하지 않고, profile / fixture / boundary / co-fire 기준으로 체계화하기 위한 테스트 전략 문서.
>
> **작성**: Round F-0A (2026-04-30)
> **상태**: STRATEGY DRAFT — 코드 수정 없음. 다음 구현 라운드(F-1 이후)까지 이 문서가 SSOT.

---

## 1. 목적

D/E pattern layer가 전공·프로젝트·자격증·강점 기반 evidence quality 해석을 안정화했다면,
F transition layer는 **source job/industry → target job/industry 관계 기반 전환 해석**을 체계화하는 것을 목표로 한다.

핵심 원칙:
- 중복 profile을 만들지 않는다 — source/target 조합이 같으면 하나의 profile로 커버한다
- 기존 `specialTransitionDiagnostics.js`의 9개 SPECIAL rule과 겹치지 않거나, 명확히 다른 계층임을 확인한다
- D/E pattern과 F profile이 같은 axis의 같은 slot을 건드리면 co-fire 금지 또는 merge rule을 정의한다
- 테스트는 probe → profile activation → boundary → co-fire → UI surface → regression lock 순서로 쌓는다

---

## 2. D/E Pattern Layer와 F Transition Layer 차이

### 2-1. 핵심 구분

| 항목 | D/E Pattern Layer | F Transition Layer |
|---|---|---|
| 파일 | `newgradCaseInsightOverlays.js` | 미정 (F-1 이후 신규 또는 확장) |
| 발화 조건 | evidence quality (전공/프로젝트/자격증/강점) | sourceJob/sourceIndustry + targetJob/targetIndustry 관계 |
| output 구조 | `axisOverlays.{axisKey}.explanation.{slot}` | TBD (axis overlay 방식 권장, title+body 방식과 병행 가능) |
| 적용 모드 | newgrad 전용 | career 전환 모드 (신입 확장 가능) |
| 기존 유사 레이어 | 없음 (신규) | `specialTransitionDiagnostics.js` 9개 SPECIAL rule (title+body 방식) |

### 2-2. 기존 specialTransitionDiagnostics와 F layer의 관계

`specialTransitionDiagnostics.js`는 이미 career-mode에서 작동하는 전환 진단 레이어다.
현재 9개 rule이 있으며 구조가 다르다:

```
SPECIAL rule:   { id, title, body }  → 자유형 텍스트, axis 미할당
F profile:      { axisOverlays.{axisKey}.explanation.{slot} }  → axis 할당, slot 분리
```

**F layer가 SPECIAL rule을 대체하지 않는다.**
SPECIAL rule은 그대로 유지하고, F profile은 axis explanation 계층에서 보완 해석을 추가하는 역할이다.

기존 SPECIAL rule 목록 (F-0A 기준 중복 체크용):

| Rule ID | source | target | F-layer 후보와 겹침 여부 |
|---|---|---|---|
| SPECIAL_B2C_CS_TO_B2B_CSM | CS | CSM | **CUSTOMER_SUPPORT_TO_SERVICE_PLANNING과 target 다름** — 비중복 |
| SPECIAL_MFG_QA_TO_IT_QA_SQA | 제조 QA | IT QA/SQA | MANUFACTURING_QUALITY_TO_PRODUCT_PLANNING과 target 다름 — 비중복 |
| SPECIAL_MFG_QA_TO_REGULATED_QA_RA | 제조 QA (manufacturing) | Healthcare QA/RA | **REGULATED_DOMAIN_TO_RA_QA와 부분 겹침** — source 범위 차이 확인 필요 |
| SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING | Sales Ops / Ops Mgmt | 사업기획 / 전략기획 | OPERATIONS_TO_SERVICE_PLANNING과 target 일부 겹침 — boundary 정의 필요 |
| SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS | Operations Mgmt | 생산 / SCM / EHS | F 후보 없음 |
| SPECIAL_BUSINESS_SUPPORT_TO_ACCOUNTING_TAX | Business Support | 회계 / 세무 | F 후보 없음 |
| SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES | 유통/B2C 영업 | 솔루션 / B2B 영업 | SALES_TO_BUSINESS_DEVELOPMENT와 target 다름 — 비중복 |
| SPECIAL_PERFORMANCE_MARKETING_TO_PMM | 퍼포먼스 / CRM 마케팅 | PMM | MARKETING_TO_PRODUCT_PLANNING과 부분 겹침 — source 범위 차이 확인 필요 |
| SPECIAL_DOC_ADMIN_TO_RA | 문서 사무지원 | RA/인증 | REGULATED_DOMAIN_TO_RA_QA와 source 일부 겹침 — boundary 정의 필요 |

### 2-3. 둘이 겹치면 안 되는 영역

- **같은 axis, 같은 slot 동시 write**: 두 레이어가 동일 axis의 동일 slot(`lead`, `scoreReason` 등)을 각자 덮어쓰면 마지막 적용이 이기는 덮어쓰기 충돌 발생
- **D/E pattern의 발화 조건 수정**: F profile이 D/E appliesTo를 변경하거나 major prior를 재계산하면 안 됨
- **newgrad 전용 axis에 career profile 적용**: newgrad-only axis explanation 경로에 career-mode profile이 주입되면 안 됨

### 2-4. 둘이 co-fire 가능한 영역

- **다른 axis인 경우**: D/E가 `responsibilityScope`를 담당하고 F가 `customerType`을 담당하면 co-fire 허용
- **D/E가 evidence gap을 설명하고, F가 transition bridge를 설명하는 경우**: 유저에게 다른 정보를 줌
  - 예: `NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA`(responsibilityScope) + `FINANCE_TO_DATA_ANALYSIS`(industryContext) — 무경험 비전공 + 금융→데이터 전환 희망자에게 각각 다른 축의 다른 메시지
- **co-fire fixture로 명시적으로 검증 후 허용 리스트에 추가**

---

## 3. 테스트 레이어 정의 (6개 유형)

### A. Probe Case

- **목적**: 코드 변경 없이 현재 generic output 확인. patch 전 gap 측정용.
- `expectedPatternIds`: 없음 (발화 기대 없음)
- `expectedProfileIds`: 없음
- `uiInsightExpected`: surface 체크만, pattern check 없음
- **사용 시점**: F-0B — 각 전환 케이스에서 현재 어떤 텍스트가 나오는지 probe

### B. Profile Activation Fixture

- **목적**: 특정 transition profile이 발화해야 하는 케이스 고정
- `expectedProfileIds`: profile 발화 필수 명시
- `shouldMention`: profile이 올바른 axis/slot에 텍스트를 전달했는지 확인
- **사용 시점**: F-1 이후 — profile 코드 작성 후 계약 고정

### C. Boundary Non-fire Fixture

- **목적**: 비슷하지만 profile이 발화하면 안 되는 케이스 확인. 오발화 방지 계약.
- `shouldNotMention`: 오발화 텍스트 미포함 계약
- `forbiddenProfileIds`: 발화 금지 profile 명시
- **사용 시점**: 각 profile 추가 시 반드시 boundary fixture 쌍으로 추가

### D. Co-fire Fixture

- **목적**: D/E pattern과 F transition profile이 같이 발화해도 되는지, slot conflict가 없는지 확인
- `expectedPatternIds` + `expectedProfileIds` 동시 명시
- 같은 axis의 같은 slot이 없는지 검증
- **사용 시점**: D/E + F가 동시에 발화 가능한 케이스 발견 시마다 추가

### E. UI Surface Fixture

- **목적**: 실제 axis/slot에 문구가 도달하는지 end-to-end 확인
- `uiInsightExpected.targetLayer`: `"UI_VISIBLE_AXIS_EXPLANATION"`
- `shouldMention`: `{axisKey}.{slot}` 기준 텍스트 도달 계약
- `hasSlots` gate: `lead`, `scoreReason`, `criteria`, `liftOrLimit` 중 2개 이상 필수
- **사용 시점**: B (Activation Fixture)와 함께 작성. 코드 연결 후 smoke runner에 등록.

### F. Regression Lock

- **목적**: 기존 12개 D/E smoke fixture가 F profile 추가 후에도 계속 PASS인지 확인
- F-layer 코드 변경 시마다 `run-newgrad-ui-insight-surface-smoke.mjs` 재실행
- 12 PASS 유지 = 기존 계약 미파괴 확인
- **실행 명령**: `"/d/잡다/node.exe" "scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs"`

---

## 4. 중복 판정 규칙

### 4-1. 중복으로 보는 경우

아래 조건이 모두 동일하면 중복 profile:
- `sourceJobFamily` 동일
- `targetJobFamily` 동일
- `positiveBridge` (전환 논리) 동일
- `limitation` (한계 설명) 동일
- `recommendedEvidence` (보완 근거) 동일
- `targetAxis` 동일
- 유저에게 주는 `다음 행동`(liftOrLimit/actionable guidance) 동일

### 4-2. 중복이 아닌 경우

- targetJob은 같아도 **sourceJob의 연결 논리**가 다를 때
  - 예: 영업 → 사업개발 vs 마케팅 → 사업개발 (sourceJob 다름, bridge 다름)
- sourceJob은 같아도 **targetJob의 요구 산출물**이 다를 때
  - 예: CS → 서비스기획 vs CS → CSM (targetJob 다름, 필요 산출물 다름)
- 산업 **규제성/도메인 민감도**가 다를 때
  - 예: 제조 QA → 일반기업 IT QA vs 제조 QA → 의료기기 QA/RA (산업 제약 다름)
- 같은 경험이라도 **target axis**가 다를 때
  - 예: 동일 CS경험 → customerType axis vs responsibilityScope axis 해석 차이
- **보완 산출물 유형**이 다를 때
  - 예: 화면 흐름도(서비스기획) vs 계약 관리 실적(CSM) vs SQL 분석 리포트(데이터)

---

## 5. Fixture Naming Convention

### prefix 정의

| Prefix | 의미 | 예시 |
|---|---|---|
| `TR-PROBE` | 현재 generic output 확인용 (코드 변경 전) | `TR-PROBE-CS-TO-SERVICE-001` |
| `TR-PROFILE` | 특정 transition profile 발화 계약 | `TR-PROFILE-CS-TO-SERVICE-001` |
| `TR-BOUNDARY` | 오발화 방지 계약 (발화 금지) | `TR-BOUNDARY-CS-TO-SERVICE-001` |
| `TR-COFIRE` | D/E pattern + F profile 동시 발화 계약 | `TR-COFIRE-CS-SERVICE-NOEVIDENCE-001` |
| `TR-UI` | UI surface end-to-end 도달 확인 | `TR-UI-CS-SERVICE-001` |

### naming 구성 규칙

```
{PREFIX}-{SOURCE_JOB_SHORT}-{TO}-{TARGET_JOB_SHORT}-{SEQ}
```

- `SOURCE_JOB_SHORT`: 출발 직무 약어 (CS, FIN, MKT, HR, TECH 등)
- `TARGET_JOB_SHORT`: 목표 직무 약어 (SERVICE, DATA, BIZDEV, RA 등)
- `SEQ`: 3자리 숫자 (001~)

공동 fixture (co-fire):
```
TR-COFIRE-{SOURCE}-{TARGET}-{DE_PATTERN_SHORT}-{SEQ}
```
예: `TR-COFIRE-CS-SERVICE-NOEVIDENCE-001`

---

## 6. Profile Inventory Schema 초안

각 F transition profile은 아래 필드를 가져야 한다.

```js
{
  profileId: "CUSTOMER_SUPPORT_TO_SERVICE_PLANNING",  // SCREAMING_SNAKE_CASE

  // 발화 조건
  sourceJobFamily: "CUSTOMER_SUPPORT_CS",       // subVertical 또는 직무 군
  sourceIndustryFamily: null,                    // null = 산업 무관
  targetJobFamily: "SERVICE_PLANNING",
  targetIndustryFamily: null,

  // 전환 유형 분류
  transitionType: "ADJACENT",                   // DIRECT / ADJACENT / DISTANT / DOMAIN_SHIFT
  transitionDistance: 2,                         // 1(very close) ~ 4(very far)

  // 전환 논리
  positiveBridge: [
    // 이 전환이 가능한 이유 — 유저에게 전달할 연결 논리
    "VOC/불편 분석 경험이 사용자 관점 파악의 근거가 됨",
    "고객 응대 반복 경험이 요구사항 수집 배경이 됨",
  ],

  // 한계 및 과장 위험
  limitation: [
    "고객 응대 ≠ 기획 산출물 보유",
    "VOC 경험만으로 서비스기획 적합도 상위권 주장 과장 위험",
  ],
  overclaimRisk: "MEDIUM",                      // LOW / MEDIUM / HIGH

  // 유저 액션 가이드
  recommendedEvidence: [
    "화면 흐름도, 요구사항 정의서, 사용자 시나리오 중 1개",
    "개선 제안서 또는 기능 개선 아이디어 문서",
  ],

  // 출력 타겟
  targetAxis: ["responsibilityScope", "customerType"],  // axis key 배열
  preferredSlots: {
    responsibilityScope: ["lead", "scoreReason", "liftOrLimit"],
    customerType: ["lead", "scoreReason"],
  },

  // 텍스트 계약 후보 (fixture에서 검증)
  shouldMentionCandidates: [
    "기획 산출물",
    "요구사항 정의",
    "VOC를 개선 방향으로",
  ],
  shouldNotMentionCandidates: [
    "고객을 잘 응대했다",  // 단순 응대 표현 — 과장 방지
  ],

  // co-fire 정책
  cofireAllowedWith: [
    "NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA",  // 다른 axis면 허용 (D/E 패턴 예시)
  ],
  mutuallyExclusiveWith: [
    "CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT",  // 같은 newgrad D/E 패턴과 동일 axis 충돌 가능
  ],

  // boundary 케이스
  boundaryCases: [
    {
      description: "경영학 전공 + CS 경험 → 서비스기획 (major prior direct이면 WEAK_MAJOR 미발화, F profile 발화 가능)",
      shouldFire: true,
    },
    {
      description: "CS 경험 없고 CS 자격증만 있는 경우 → 발화 금지",
      shouldFire: false,
    },
  ],

  // 우선순위
  priority: "P0",                              // P0 / P1 / P2
  status: "PROPOSED",                          // PROPOSED / PROBED / PROFILE_DEFINED / FIXTURED / REGRESSION_LOCKED / SKIPPED_DUPLICATE
}
```

---

## 7. Case Matrix Schema 초안

각 test case는 아래 필드를 가져야 한다.

```js
{
  caseId: "TR-PROFILE-CS-TO-SERVICE-001",

  // 테스트 유형
  testType: "PROFILE_ACTIVATION",              // PROBE / PROFILE_ACTIVATION / BOUNDARY_NON_FIRE / CO_FIRE / UI_SURFACE / REGRESSION_LOCK

  // 입력 조건
  sourceJobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
  sourceIndustryId: "IND_PROFESSIONAL_B2B_SERVICES",
  targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
  targetIndustryId: null,                        // null = 무관

  // 입력 증거
  inputEvidence: {
    workExp: ["고객상담 1년"],
    projects: [],
    certifications: [],
    strengths: [],
    major: null,
  },

  // 기대 발화
  expectedProfileIds: ["CUSTOMER_SUPPORT_TO_SERVICE_PLANNING"],
  forbiddenProfileIds: [],

  // 기대 axis/slot
  expectedAxis: ["responsibilityScope", "customerType"],
  expectedSlots: {
    responsibilityScope: ["lead", "scoreReason", "liftOrLimit"],
    customerType: ["lead", "scoreReason"],
  },

  // 텍스트 계약
  shouldMention: [
    { axis: "customerType", slot: "lead", contains: "고객 이해" },
    { axis: "responsibilityScope", slot: "liftOrLimit", contains: "기획 산출물" },
  ],
  shouldNotMention: [
    { axis: "jobStructure", anySlot: true, contains: "전공 연결성 제한" },
  ],

  // 중복 여부
  duplicateOf: null,                             // 다른 caseId 또는 null

  // 상태
  status: "PROPOSED",
  lastChecked: null,
  notes: "F-0B probe 먼저 실행 후 실제 output 확인 필요",
}
```

**status 정의**:

| Status | 의미 |
|---|---|
| `PROPOSED` | 아이디어 단계 — 입력/기대 조건 미확정 |
| `PROBED` | 현재 output 확인 완료. probe 결과 기록됨 |
| `PROFILE_DEFINED` | profile 조건 정의 완료. 코드 미작성 |
| `FIXTURED` | 재현 가능한 fixture 데이터 완성 |
| `REGRESSION_LOCKED` | 발화 계약 고정. 변경 시 반드시 재검증 |
| `SKIPPED_DUPLICATE` | 기존 케이스와 중복 판정. 이유 기록 |

---

## 8. D/E Layer와의 Overlap Guard

**F profile이 지켜야 할 불변 원칙**:

1. **F profile은 major prior 자체를 수정하지 않는다.**
   - major prior 계산 경로(`newgradAxis1MajorPriorRegistry.js`)는 F layer의 관할 밖.

2. **F profile은 자격증/프로젝트/강점 존재 여부만으로 발화하지 않는다.**
   - evidence quality 판단은 D/E pattern의 역할. F는 반드시 sourceJob/targetJob 관계를 본다.

3. **F profile은 반드시 sourceJob/sourceIndustry + targetJob/targetIndustry 관계를 발화 조건으로 가진다.**
   - 전환 경로 없이 evidence 상태만 보는 profile은 D/E pattern으로 분류.

4. **D/E pattern은 evidence quality를 설명하고, F profile은 transition bridge를 설명한다.**
   - 같은 케이스에 둘이 발화해도 되는 경우: 다른 axis 담당 시 허용.
   - 같은 axis를 담당하는 경우: 같은 slot에 동시 write 금지.

5. **같은 axis + 같은 slot 충돌 방지 규칙**:

| 상황 | 정책 |
|---|---|
| D/E와 F가 다른 axis | co-fire 허용 — 서로 다른 정보 제공 |
| D/E와 F가 같은 axis, 다른 slot | co-fire 조건부 허용 — slot 계약 명시 필수 |
| D/E와 F가 같은 axis, 같은 slot | co-fire 금지 — F가 이기거나 D/E가 이기는 merge rule 사전 정의 필요 |

6. **D/E 기존 6개 pattern과 동일한 appliesTo 조건을 가진 F profile 금지.**
   - 조건이 겹치면 D/E pattern을 수정하는 방향 검토.

---

## 9. P0 후보 Profile 10개

코드 없음 — profile 후보 목록과 설계 메모만 기록.

### P1. CUSTOMER_SUPPORT_TO_SERVICE_PLANNING

- **왜 필요한가**: CS 경험 보유자가 서비스기획 전환 시 "VOC 경험이 기획 근거가 되는지" 해석이 필요. 현재 generic output만 나옴.
- **D/E 비중복 이유**: D/E의 `CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT`은 **newgrad 전용**, 프로젝트 없음 조건. F profile은 **career 전환자** 대상이며 sourceJob/targetJob 관계 기반.
- **기존 SPECIAL rule 비중복 이유**: `SPECIAL_B2C_CS_TO_B2B_CSM`은 target이 CSM. 이 profile은 target이 서비스기획 — 다름.
- **첫 fixture 후보**: `TR-PROBE-CS-TO-SERVICE-001` — CS 경험 1년 + 서비스기획 지원 → 현재 output probe
- **boundary fixture 후보**: `TR-BOUNDARY-CS-TO-SERVICE-001` — CS 경험 없이 CS 자격증만 있는 경우 → 미발화 확인
- **co-fire 검토**: D/E `NO_EVIDENCE` pattern(responsibilityScope)와 동일 케이스 발생 가능 → axis 분리 확인 필요

### P2. OPERATIONS_TO_SERVICE_PLANNING

- **왜 필요한가**: 운영 담당자가 서비스기획 전환 시 "프로세스 개선 경험이 기획 근거가 되는지" 해석 필요.
- **D/E 비중복 이유**: D/E는 newgrad evidence quality 기반. F는 career 전환 경로 기반.
- **기존 SPECIAL rule 비중복 이유**: `SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING`은 target이 사업기획/전략기획. 서비스기획은 다른 직무 — boundary가 필요하지만 중복은 아님.
- **첫 fixture 후보**: `TR-PROBE-OPS-TO-SERVICE-001`
- **boundary fixture 후보**: `TR-BOUNDARY-OPS-TO-SERVICE-001` — 사업기획 targetJob 시 이 profile 미발화 확인 (SPECIAL rule과 분리)
- **co-fire 검토**: 낮음 — axis 겹침 가능성 중간

### P3. MARKETING_TO_PRODUCT_PLANNING

- **왜 필요한가**: 마케터가 PM/서비스기획 전환 시 "캠페인 경험이 제품 기획 근거가 되는지" 해석 필요.
- **D/E 비중복 이유**: D/E evidence quality 기반과 무관.
- **기존 SPECIAL rule 비중복 이유**: `SPECIAL_PERFORMANCE_MARKETING_TO_PMM`은 target이 PMM(Product Marketing Manager). 이 profile은 target이 서비스기획/PM — 다름. source 범위도 더 넓음(전체 마케팅).
- **첫 fixture 후보**: `TR-PROBE-MKT-TO-PRODUCT-001`
- **boundary fixture 후보**: `TR-BOUNDARY-MKT-TO-PMM-001` — target이 PMM일 때 이 profile 미발화 확인 (SPECIAL rule과 분리)
- **co-fire 검토**: 낮음

### P4. SALES_TO_BUSINESS_DEVELOPMENT

- **왜 필요한가**: 영업 담당자가 BD 전환 시 "고객 설득 경험이 파트너십 발굴 근거가 되는지" 해석 필요.
- **D/E 비중복 이유**: D/E 무관.
- **기존 SPECIAL rule 비중복 이유**: `SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES`는 source가 유통/채널 영업, target이 솔루션/B2B 영업. 이 profile은 source가 일반 영업, target이 BD — 다름.
- **첫 fixture 후보**: `TR-PROBE-SALES-TO-BIZDEV-001`
- **boundary fixture 후보**: `TR-BOUNDARY-SALES-TO-SOLUTION-001` — target이 솔루션영업일 때 이 profile 미발화 확인
- **co-fire 검토**: 낮음

### P5. FINANCE_TO_DATA_ANALYSIS

- **왜 필요한가**: 재무/회계 담당자가 데이터분석 전환 시 "수치 분석 경험이 데이터 직무 근거가 되는지" 해석 필요. 현재 generic output.
- **D/E 비중복 이유**: D/E에는 finance→data 전환 coverage 없음.
- **기존 SPECIAL rule 비중복 이유**: 9개 SPECIAL rule에 finance→data 없음 — 완전 신규.
- **첫 fixture 후보**: `TR-PROBE-FIN-TO-DATA-001`
- **boundary fixture 후보**: `TR-BOUNDARY-FIN-TO-DATA-001` — SQL/Python 경험 없는 재무 담당자 → 과상승 방지
- **co-fire 검토**: **높음** — D/E `CERT_ONLY` pattern(industryContext)과 같은 케이스 가능 → axis 분리 필수 확인

### P6. GENERAL_ADMIN_TO_PLANNING

- **왜 필요한가**: 총무/행정 담당자가 기획 전환 시 "문서/절차 경험이 기획 근거가 되는지" 해석 필요.
- **D/E 비중복 이유**: D/E 무관.
- **기존 SPECIAL rule 비중복 이유**: `SPECIAL_DOC_ADMIN_TO_RA`는 target이 RA/인증 직무. 이 profile은 target이 기획 — 다름. source 범위도 더 넓음.
- **첫 fixture 후보**: `TR-PROBE-ADMIN-TO-PLAN-001`
- **boundary fixture 후보**: `TR-BOUNDARY-ADMIN-TO-RA-001` — target이 RA일 때 이 profile 미발화 확인
- **co-fire 검토**: 낮음

### P7. REGULATED_DOMAIN_TO_RA_QA

- **왜 필요한가**: 규제 도메인(제약/의료/식품) 종사자가 RA/QA 전환 시 "도메인 지식이 인허가 근거가 되는지" 해석 필요.
- **D/E 비중복 이유**: D/E 무관.
- **기존 SPECIAL rule 주의**: `SPECIAL_MFG_QA_TO_REGULATED_QA_RA`와 source 범위 일부 겹침. 이 profile은 source industry가 regulated domain(전체)이며 source job은 QA 외 직무도 포함. **boundary fixture로 분리 정의 필수.**
- **첫 fixture 후보**: `TR-PROBE-REG-TO-RA-001`
- **boundary fixture 후보**: `TR-BOUNDARY-MFG-QA-RA-001` — source가 제조 QA인 경우 SPECIAL rule과 이 profile 동시 발화 방지
- **co-fire 검토**: 중간 — SPECIAL rule과 axis 겹침 가능성 있음

### P8. TECH_PROJECT_TO_DATA_ANALYSIS

- **왜 필요한가**: IT 프로젝트 관리자/기술 지원 담당자가 데이터분석 전환 시 "시스템 이해도가 데이터 직무 근거가 되는지" 해석 필요.
- **D/E 비중복 이유**: D/E의 `NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA`는 newgrad 전용. 이 profile은 career 전환 기반.
- **기존 SPECIAL rule 비중복 이유**: 9개 SPECIAL rule에 tech project→data 없음 — 신규.
- **첫 fixture 후보**: `TR-PROBE-TECH-TO-DATA-001`
- **boundary fixture 후보**: `TR-BOUNDARY-TECH-TO-DEV-001` — target이 개발직무일 때 이 profile 미발화 확인
- **co-fire 검토**: 중간 — D/E NON_MAJOR pattern(responsibilityScope)과 newgrad 케이스에서 겹침 가능

### P9. HR_OPERATIONS_TO_PEOPLE_ANALYTICS

- **왜 필요한가**: HR 운영 담당자가 피플애널리틱스 전환 시 "인사 데이터 접근 경험이 분석 근거가 되는지" 해석 필요.
- **D/E 비중복 이유**: D/E 무관.
- **기존 SPECIAL rule 비중복 이유**: 9개 SPECIAL rule에 HR→people analytics 없음 — 신규.
- **첫 fixture 후보**: `TR-PROBE-HR-TO-ANALYTICS-001`
- **boundary fixture 후보**: `TR-BOUNDARY-HR-TO-RECRUITING-001` — target이 HR 채용 직무일 때 이 profile 미발화 확인
- **co-fire 검토**: 낮음

### P10. MANUFACTURING_QUALITY_TO_PRODUCT_PLANNING

- **왜 필요한가**: 품질관리 담당자가 제품기획/UX 전환 시 "불량 분석 경험이 제품 개선 기획 근거가 되는지" 해석 필요.
- **D/E 비중복 이유**: D/E 무관.
- **기존 SPECIAL rule 비중복 이유**: `SPECIAL_MFG_QA_TO_IT_QA_SQA`는 target이 IT QA. 이 profile은 target이 제품기획/서비스기획 — 다름.
- **첫 fixture 후보**: `TR-PROBE-MFGQA-TO-PRODUCT-001`
- **boundary fixture 후보**: `TR-BOUNDARY-MFGQA-TO-ITQA-001` — target이 IT QA일 때 이 profile 미발화 확인 (SPECIAL rule과 분리)
- **co-fire 검토**: 낮음

---

## 10. 다음 라운드 추천

### F-0B: Probe-only 현재 output 확인

**할 일**:
- 위 P0 profile 중 3개만 골라 실제 case matrix 작성 (PROPOSED → PROBED 승격)
- runtime patch 없음 — probe fixture만 작성
- 각 케이스의 현재 generic output을 기록하여 gap 측정

**추천 3개 (F-0B 범위)**:

| 프로필 | 이유 |
|---|---|
| `CUSTOMER_SUPPORT_TO_SERVICE_PLANNING` | 유저 빈도 높음. D/E 기존 newgrad 패턴과 co-fire 검증 기회. SPECIAL rule과 target이 달라 경계 명확. |
| `FINANCE_TO_DATA_ANALYSIS` | SPECIAL rule에 없는 신규 영역. D/E CERT_ONLY 패턴과 axis co-fire 검증 기회. |
| `MARKETING_TO_PRODUCT_PLANNING` | SPECIAL_PERFORMANCE_MARKETING_TO_PMM과 target boundary 검증 필요. 빈도 높은 전환 패턴. |

**F-0B 진행 방식**:
1. 위 3개 profile의 PROBE fixture 작성 (`TR-PROBE-*-001`)
2. 현재 output (`axisPack.axes.*.explanation.lead`) 기록
3. gap 분석 → F-1 profile 코드 설계의 입력값으로 사용
4. D/E regression: `"/d/잡다/node.exe" "scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs"` — 12 PASS 유지 확인

**F-1 이후 (코드 작성 시작)**:
- 위 probe 결과 바탕으로 `CUSTOMER_SUPPORT_TO_SERVICE_PLANNING` profile 첫 구현
- Profile activation fixture + boundary fixture 쌍 추가
- smoke runner 확장 또는 별도 TR runner 생성

---

## 11. Do Not Touch

- `src/lib/analysis/newgradCaseInsightOverlays.js` — D/E pattern 직접 수정 금지
- `scripts/regression/newgrad-core-invariant-cases.js` — 기존 12개 fixture 수정 금지
- `scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs` — D/E runner 수정 금지
- `docs/COMM_PATCH_NOTES.md` — 직접 수정 금지
- `src/lib/transitionLite/specialTransitionDiagnostics.js` — 기존 9개 SPECIAL rule 수정 금지 (F-1에서 확장 시 RULES 배열 append 방식만 허용)
