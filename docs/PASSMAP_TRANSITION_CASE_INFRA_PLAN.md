# PASSMAP Transition Case Overlay Infrastructure Plan

> 목적: career mode 전환 해석 레이어(F-layer)를 대량으로 probe→cluster→implement→lock 하기 위한 파일 구조, runner 설계, 운영 방식 문서
> 코드 변경 없음. 설계 문서만.
> 날짜: 2026-05-01
> 기준 커밋: 0049e89 (F-2A: CS→서비스기획 첫 profile 구현)

---

## 1. 목적

career mode 전환 케이스(F-layer)를 확장할 때 아래 사이클을 반복한다:

```
probe (현재 출력 캡처)
  → gap 진단 (generic 태그 자동화)
    → copy backlog 승인 (UI 문구 초안 검토)
      → profile 구현 (registry 추가)
        → smoke fixture lock (regression 고정)
```

이 사이클을 케이스별 수작업이 아닌 **배치 처리**로 운영하기 위한 인프라를 설계한다.

---

## 2. 기존 방식의 한계

### 2-1. 케이스별 수작업 반복

F-0A~F-2A까지 매 라운드마다 다음 절차가 수동으로 반복됐다:
- 프롬프트에 probe 입력값 작성
- node 실행 + 출력 복사
- gap 판단 + 문구 초안 작성
- 문서에 수동 정리
- 구현 + runner로 재확인

이 방식으로는 30개 케이스를 다루면 30회 프롬프트-실행-문서 루프가 필요하다.

### 2-2. profile 중복 위험

각 profile이 어떤 currentJobId×targetJobId 조합을 커버하는지 centralized 목록이 없으면, 새 profile 추가 시 기존 profile과 동일한 sourceJob/targetJob을 다시 커버하는 중복이 발생한다.

### 2-3. UI 문구 품질 관리

현재 profile 문구는 careerTransitionCaseOverlays.js 내부에 하드코딩되어 있어:
- 문구 초안과 최종 확정본이 같은 파일에 섞임
- 검토 전 문구가 runtime에 직접 반영될 위험
- 어떤 문구가 승인됐는지 추적 불가

### 2-4. activation / boundary fixture 없음

F-2A 구현 후 profile이 발화하는 케이스와 발화하면 안 되는 케이스를 검증하는 구조화된 fixture가 없다. 신입 D/E layer는 `newgrad-core-invariant-cases.js` + `run-newgrad-ui-insight-surface-smoke.mjs`로 12개 계약이 고정됐지만, F-layer에는 이에 해당하는 구조가 없다.

---

## 3. 제안 파일 구조

### 3-1. 파일 목록

```
src/lib/analysis/
  careerTransitionCaseProfiles.js     ← 신규 (profile 데이터 전용)
  careerTransitionCaseOverlays.js     ← 기존 (engine 전용으로 리팩터)

scripts/regression/
  career-transition-case-matrix.js    ← 신규 (fixture 목록)
  run-career-transition-case-probes.mjs    ← 신규 (probe batch runner)
  run-career-transition-profile-smoke.mjs  ← 신규 (activation/boundary smoke runner)

docs/
  PASSMAP_TRANSITION_PROFILE_COPY_BACKLOG.md  ← 신규 (UI 문구 초안 검토 큐)
  PASSMAP_TRANSITION_PROFILE_STATUS.md        ← 신규 (profile 상태 트래킹)
```

### 3-2. 각 파일 상세

---

#### `src/lib/analysis/careerTransitionCaseProfiles.js`

| 항목 | 내용 |
|---|---|
| 역할 | profile 데이터 정의만 담는 순수 데이터 레지스트리 |
| 입력 | (없음, static data) |
| 출력 | `CAREER_TRANSITION_PROFILE_REGISTRY` export |
| 수정 빈도 | profile 추가/수정 시마다 (1~3개 단위로 추가) |
| owner 성격 | DATA — UI 문구 승인 후에만 변경 |
| 위험도 | MEDIUM — 잘못된 appliesTo gate 추가 시 미발화 또는 오발화 |

**분리 이유**: 현재 `careerTransitionCaseOverlays.js`에 데이터와 엔진이 섞여 있다. profile 수가 늘어날수록 파일이 과도하게 커지고, 엔진을 수정할 때 데이터가 함께 노출된다.

---

#### `src/lib/analysis/careerTransitionCaseOverlays.js`

| 항목 | 내용 |
|---|---|
| 역할 | profile 데이터를 읽어 axisPack에 overlay를 적용하는 engine 전용 |
| 입력 | `axisPack`, `{ currentJobId, targetJobId }` |
| 출력 | `{ axisPack: overlaidAxisPack, firedProfileIds }` |
| 수정 빈도 | engine 로직 변경 시만 (드물게) |
| owner 성격 | ENGINE — profile 추가 시 수정 불필요 |
| 위험도 | HIGH — 모든 career mode probe가 이 함수를 통과함 |

**현재 상태**: F-2A에서 데이터+엔진 혼합 구현됨. 프로파일 2~3개가 추가되기 전에 분리 권장.

---

#### `scripts/regression/career-transition-case-matrix.js`

| 항목 | 내용 |
|---|---|
| 역할 | career transition 케이스 fixture 정의 목록. D/E의 `newgrad-core-invariant-cases.js`에 해당 |
| 입력 | (없음, static data) |
| 출력 | `CAREER_TRANSITION_CASES` export (caseId, caseType, input, expected 필드) |
| 수정 빈도 | profile 추가 시 activation/boundary/co-fire case 동시 추가 |
| owner 성격 | DATA + CONTRACT — 구현 후 변경 시 SSOT 위반 |
| 위험도 | LOW (읽기 전용 fixture) |

**최소 포함 케이스 (현재 시점)**:
- `TR-PROBE-CS-TO-SERVICE-001` (PROBE — already run in F-1)
- `TR-PROFILE-CS-TO-SERVICE-001` (ACTIVATION)
- `TR-BOUNDARY-CS-TO-SERVICE-001` (BOUNDARY)
- `TR-COFIRE-CS-TO-SERVICE-001` (COFIRE)
- Finance/Marketing probe cases (F-1에서 실행됨, 미등록 상태)

---

#### `scripts/regression/run-career-transition-case-probes.mjs`

| 항목 | 내용 |
|---|---|
| 역할 | case matrix의 PROBE 케이스를 배치 실행해 현재 출력을 수집 + generic 자동 진단 |
| 입력 | `career-transition-case-matrix.js` (PROBE type 필터) |
| 출력 | stdout 또는 `--json` 플래그 시 `scripts/regression/output/` JSON 파일 |
| 수정 빈도 | 거의 수정 안 함 (케이스 추가는 matrix에서) |
| owner 성격 | RUNNER — 실행 전용 |
| 위험도 | NONE (read-only) |

---

#### `scripts/regression/run-career-transition-profile-smoke.mjs`

| 항목 | 내용 |
|---|---|
| 역할 | ACTIVATION/BOUNDARY 케이스 기준으로 profile 발화/미발화, slot 주입, shouldMention/shouldNotMention 계약 검증 |
| 입력 | `career-transition-case-matrix.js` (ACTIVATION/BOUNDARY type 필터) |
| 출력 | 신입 smoke runner와 동일한 PASS/FAIL/ISSUE 형식 |
| 수정 빈도 | smoke 계약 변경 시만 |
| owner 성격 | SMOKE RUNNER — CI 역할 |
| 위험도 | NONE (read-only, regression baseline) |

---

#### `docs/PASSMAP_TRANSITION_PROFILE_COPY_BACKLOG.md`

| 항목 | 내용 |
|---|---|
| 역할 | probe 결과로 생성된 UI 문구 초안을 승인 전에 쌓아두는 검토 큐 |
| 입력 | probe runner 출력 → 수동 정리 |
| 출력 | 승인된 항목은 profile 구현 시 careerTransitionCaseProfiles.js로 이동 |
| 수정 빈도 | probe 배치마다 추가, 구현 완료 후 archived 처리 |
| owner 성격 | REVIEW QUEUE — 승인 전 runtime 반영 금지 |
| 위험도 | NONE (문서) |

**목적**: 문구 초안이 검토 없이 runtime에 직접 들어가는 것을 막는 중간 단계.

---

#### `docs/PASSMAP_TRANSITION_PROFILE_STATUS.md`

| 항목 | 내용 |
|---|---|
| 역할 | 모든 profile의 구현 상태, 적용 axis, fixture 고정 여부를 한 곳에서 추적 |
| 입력 | 구현 커밋마다 수동 업데이트 |
| 출력 | (없음, 참조 문서) |
| 수정 빈도 | profile 추가/상태 변경마다 |
| owner 성격 | STATUS TRACKER |
| 위험도 | NONE |

---

## 4. Profile Registry Schema

`careerTransitionCaseProfiles.js`에서 각 profile이 가져야 할 필드:

```js
{
  id: "CUSTOMER_SUPPORT_TO_SERVICE_PLANNING",

  // 발화 조건
  sourceJobIds: ["JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS"],
  sourceJobFamilies: ["CUSTOMER_SUPPORT_CS"],          // ID 없을 때 family 매칭 fallback
  sourceIndustryIds: null,                              // null = 산업 무관
  targetJobIds: ["JOB_BUSINESS_SERVICE_PLANNING"],
  targetJobFamilies: ["SERVICE_PLANNING"],
  targetIndustryIds: null,

  // 메타
  transitionType: "ADJACENT",    // SAME / ADJACENT / CROSS / INDUSTRY_CROSS
  priority: "P0",                // P0 / P1 / P2
  overclaimRisk: "MEDIUM",       // LOW / MEDIUM / HIGH

  // overlay 대상 axis
  axes: ["jobStructure", "responsibilityScope"],

  // slot 정의 — axis별로 null이면 미주입
  overlays: {
    jobStructure: {
      lead: "고객 응대 경험은...",
      scoreReason: "다만 서비스기획에서는...",
      criteria: "확인 가능한 근거는...",
      liftOrLimit: null,
    },
    responsibilityScope: {
      lead: "CS 경험을...",
      scoreReason: null,
      criteria: null,
      liftOrLimit: "다음 보완은...",
    },
  },

  // shouldMention: probe에서 확인해야 할 키워드 (smoke 검증 대상)
  shouldMentionCandidates: ["VOC", "요구사항", "기능정의", "화면흐름"],

  // shouldNotMention: 절대 포함되면 안 되는 표현 (smoke FAIL 대상)
  shouldNotMentionCandidates: ["고객 응대가 곧 서비스기획", "바로 전환 가능"],

  // boundary: 이 profile이 발화하면 안 되는 케이스 조건 요약
  boundaryCases: [
    "단순 응대만 있고 VOC 분석·개선안 이력 없음",
  ],

  // co-fire 허용 profile (같은 케이스에서 동시 발화 가능)
  cofireAllowedWith: [],

  // 상호 배타 profile (같은 케이스에서 동시 발화 불가)
  mutuallyExclusiveWith: [],

  // 자유 메모
  notes: "D/E CS_OPERATIONS_TO_SERVICE_PLANNING과 모드 분리. axis 겹침 있으나 mode 분리로 충돌 없음.",
}
```

### 4-1. appliesTo 우선순위 규칙

1. `sourceJobIds`에 `currentJobId`가 있으면 우선 매칭
2. `sourceJobIds`가 null이면 `sourceJobFamilies`로 fallback
3. `sourceIndustryIds`가 있으면 AND 조건 추가
4. target도 동일 순서

---

## 5. Case Matrix Schema

`career-transition-case-matrix.js`에서 각 case:

```js
{
  caseId: "TR-PROFILE-CS-TO-SERVICE-001",

  // 케이스 유형
  caseType: "ACTIVATION",
  // PROBE       : 현재 출력 기록용. profile 미존재 시점에도 실행 가능.
  // ACTIVATION  : profile이 발화해야 하는 케이스. expectedProfileIds 필수.
  // BOUNDARY    : profile이 발화하면 안 되는 케이스. forbiddenProfileIds 필수.
  // COFIRE      : 두 개 이상 profile이 동시에 발화해야 하는 케이스.
  // UI_SURFACE  : 실제 UI에 보여지는 slot 값 계약 고정.

  // 입력
  sourceJobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
  sourceIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
  targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
  targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",

  // 경력 증거 (career mode — probe에서 workExp 구조 확정 후 추가)
  evidenceInput: {},

  // profile 기대값
  expectedProfileIds: ["CUSTOMER_SUPPORT_TO_SERVICE_PLANNING"],
  forbiddenProfileIds: [],

  // axis/slot 계약
  expectedAxisSlots: {
    jobStructure: ["lead", "scoreReason", "criteria"],
    responsibilityScope: ["lead", "liftOrLimit"],
  },

  // 문구 계약
  shouldMention: ["VOC", "요구사항"],
  shouldNotMention: ["바로 전환 가능"],

  // 중복 방지
  duplicateOf: null,

  // 상태
  status: "PROPOSED",
  // PROPOSED / LOCKED / DEPRECATED
}
```

---

## 6. Batch Probe Runner 설계

### `run-career-transition-case-probes.mjs` 동작 흐름

```
1. career-transition-case-matrix.js 로드
2. --type PROBE 필터 (기본값) 또는 --type all
3. 각 case에 대해 buildTransitionLiteResult 실행
4. 출력 수집:
   - firedProfileIds
   - classification (현재 {} 여부 포함)
   - whyThisRead.headline / subline / supportLine
   - axisPack.axes.*.{band, displayScore, explanation.summary, explanation.lead, ...}
   - topRisks[].key
5. generic diagnosis 자동 태깅 (axis별)
6. stdout 또는 --json 출력
```

### Generic Diagnosis Tags

각 axis에 대해 자동으로 아래 태그를 부여:

| 태그 | 진단 기준 |
|---|---|
| `TOO_GENERIC` | explanation.summary가 band-distance 패턴 문자열 그대로. F-layer lead 없음. |
| `MISSED_POSITIVE_BRIDGE` | reasons에 `direction: "positive"` 항목이 있는데 summary/lead에 미반영 |
| `MISSED_LIMITATION` | reasons에 `direction: "negative"` 항목이 있는데 liftOrLimit 없음 |
| `ACTION_GUIDANCE_MISSING` | band가 `low` 또는 `very_low`인데 liftOrLimit 없음 |
| `OVERCLAIM_RISK` | band가 `very_low`인데 lead 문구에 긍정 과장 표현 |
| `WRONG_AXIS` | 실제로 낮은 축과 다른 axis에 overlay가 주입됨 |
| `SLOT_CONFLICT_RISK` | 두 profile이 같은 axisKey.slot에 동시 주입 예정 |

### 출력 형식 예시 (--json 아닌 stdout)

```
[TR-PROBE-CS-TO-SERVICE-001] CS → 서비스기획
  firedProfiles: []
  classification: {}
  jobStructure    | very_low (20) | TOO_GENERIC, ACTION_GUIDANCE_MISSING
  industryContext | high (100)   | OK
  responsibilityScope | low (20) | TOO_GENERIC, ACTION_GUIDANCE_MISSING
  customerType    | high (100)   | OK
  roleCharacter   | mid_high (55) | MISSED_LIMITATION
```

---

## 7. Profile Smoke Runner 설계

### `run-career-transition-profile-smoke.mjs` 동작 흐름

```
1. career-transition-case-matrix.js 로드
2. ACTIVATION / BOUNDARY type만 필터
3. 각 case 실행
4. ACTIVATION 검증:
   - firedProfileIds ⊇ expectedProfileIds
   - axis slot 실제 값 존재 여부
   - shouldMention 키워드 포함 여부 → ISSUE
   - shouldNotMention 미포함 여부 → FAIL
5. BOUNDARY 검증:
   - firedProfileIds ∩ forbiddenProfileIds = ∅
6. 결과:
   PASS / ISSUE (shouldMention 미포함) / FAIL (forbidden 발화 또는 shouldNotMention 포함)
7. 요약 출력 (신입 smoke runner와 동일 형식)
```

### D/E smoke와의 관계

| 항목 | 신입 D/E smoke | career F smoke |
|---|---|---|
| runner | `run-newgrad-ui-insight-surface-smoke.mjs` | `run-career-transition-profile-smoke.mjs` |
| fixture | `newgrad-core-invariant-cases.js` | `career-transition-case-matrix.js` |
| 빌더 | `buildNewgradTransitionLiteResult` | `buildTransitionLiteResult` |
| 기준선 | 12 PASS 고정 (마감) | F profile 추가마다 성장 |
| 의존성 | 완전 독립 | D/E와 독립 (mode 분리) |

두 runner는 완전 독립 실행. 신입 12개는 F-layer 구현으로 절대 영향받지 않음.

---

## 8. 대량 작업 운영 방식

### 권장 배치 크기

| 작업 단계 | 배치 크기 | 이유 |
|---|---|---|
| Probe 실행 | 20~30개 | runner가 있으면 배치 가능. probe는 read-only. |
| Gap 진단 + copy 초안 | 20~30개 | 문구 품질 검토가 필요하므로 일괄 승인은 불가 |
| UI copy 승인 | 5~10개 | 승인 단위는 작게 유지 |
| runtime 구현 (profile 추가) | 1~3개 | 구현마다 smoke runner 통과 필수 |
| smoke fixture lock | profile과 동시 | 구현 직후 바로 fixture 고정 |

### 중단 조건

아래 중 하나라도 발생하면 즉시 중단하고 보고:
- 같은 axis/slot에 두 profile이 동시 주입 예정 (`SLOT_CONFLICT_RISK`)
- D/E smoke 12 PASS 이탈
- appliesTo gate가 의도치 않게 넓어져 다른 케이스에서 오발화

---

## 9. F-2A 이후 A안/B안 비교

> 참고: F-2A에서 CS→서비스기획 profile은 이미 구현 완료 (커밋 0049e89).
> 아래 비교는 "다음 profile(Finance→Data, Marketing→Product)을 어떤 순서로 진행할 것인가"의 선택이다.

### A안 — infra runner 먼저, 다음 profile은 그 후

**순서**: F-INFRA-2 (runner + matrix) → F-2B (Finance→Data with runner)

| 항목 | A안 |
|---|---|
| 속도 | 느림 (infra 구축 1~2 라운드 추가) |
| 안정성 | 높음 (runner 검증 후 profile 추가) |
| 회귀 위험 | 낮음 (smoke runner가 gate 역할) |
| 코드 복잡도 | 낮음 (data/engine 분리, 구조 정비됨) |
| 문구 품질 관리 | copy backlog로 체계화 |
| 추천 상황 | profile 5개 이상 추가할 계획이 있을 때 |

### B안 — 다음 profile을 먼저, infra는 나중에

**순서**: F-2B (Finance→Data) → F-2C (Marketing→Product) → infra later

| 항목 | B안 |
|---|---|
| 속도 | 빠름 (profile 바로 추가) |
| 안정성 | 낮음 (runner 없이 수동 verify) |
| 회귀 위험 | 중간 (기존 D/E smoke는 보호되나 career smoke 없음) |
| 코드 복잡도 | 높아짐 (careerTransitionCaseOverlays.js에 데이터 누적) |
| 문구 품질 관리 | 수동 (파일 내부에 하드코딩) |
| 추천 상황 | 단기 2~3개만 추가하고 멈출 계획일 때 |

### 현재 상황 평가

F-2A는 B안 방식으로 1개 profile을 구현했다. 이 상태에서 F-2B를 B안으로 계속하면:
- `careerTransitionCaseOverlays.js`에 데이터가 계속 쌓여 engine/data 분리 시점이 늦어진다
- career smoke runner 없이는 boundary case 계약이 사람 눈에만 의존한다

---

## 10. 최종 추천

### 추천 다음 라운드: **A안 — 최소 infra 먼저 (F-INFRA-2), 그 다음 F-2B**

이유:

1. **F-2A가 B안으로 이미 실행됐다.** 1개는 수동으로 검증 가능했지만, 2~3개가 쌓이면 boundary case 계약이 관리 불능이 된다.

2. **smoke runner가 gate 역할을 해야 한다.** D/E layer는 12개 smoke fixture가 regression 방어선을 형성한다. career F-layer도 activation/boundary fixture가 없으면 구현 후 "발화 계약"이 사람 기억에만 의존하게 된다.

3. **profile data/engine 분리는 2번째 profile 추가 전이 마지막 저비용 시점이다.** 3개 이상 추가된 후 분리하면 ref 갱신 비용이 커진다.

### 권장 F-INFRA-2 범위 (최소)

- `career-transition-case-matrix.js` 신규: CS→서비스기획 4개 케이스 (PROBE/ACTIVATION/BOUNDARY/COFIRE) + Finance/Marketing PROBE 2개
- `run-career-transition-profile-smoke.mjs` 신규: ACTIVATION/BOUNDARY 검증 (D/E smoke runner 구조 참고)
- `careerTransitionCaseProfiles.js` 분리: 현재 `careerTransitionCaseOverlays.js`의 profile 데이터를 별도 파일로 이동
- `careerTransitionCaseOverlays.js` 정리: engine 전용으로 축소

### 권장 F-2B 범위 (infra 이후)

- Finance→Data profile 추가 (위 infra 위에서 구현)
- smoke runner에 ACTIVATION case 추가
- data/engine 분리된 구조이므로 추가 공수 최소

### 절대 금지

- infra 없이 profile 3개 이상 일괄 구현
- 한 라운드에 runtime 구현 + fixture + runner 모두 동시 처리
- D/E smoke 12개를 수정하거나 F-layer smoke와 합치기

---

## 부록: 현재 F-layer 구현 상태 요약

| 항목 | 현재 상태 |
|---|---|
| 구현된 profile 수 | 1개 (CUSTOMER_SUPPORT_TO_SERVICE_PLANNING) |
| activation fixture | 없음 (수동 probe 스크립트로만 확인됨) |
| boundary fixture | 없음 |
| career smoke runner | 없음 |
| profile data/engine 분리 | 미분리 (careerTransitionCaseOverlays.js에 혼재) |
| copy backlog 문서 | 없음 (F-1 probe 문서에 통합) |
| profile status 문서 | 없음 (matrix P0 문서에 부분 반영) |
| 신입 D/E smoke baseline | 12 PASS (마감, 독립 유지) |

---

*다음 문서: F-INFRA-2 구현 후 `PASSMAP_TRANSITION_PROFILE_STATUS.md` 신규 생성 권장.*
