# ENGINE TEST RULES (PASSMAP 테스트 작성 규칙)

> 목적: testEngine.js + test_dataset.passmap.v1.json 기반 회귀 테스트 작성 시 반드시 지켜야 할 규칙 정리.

---

## 1. testMode 의미

| testMode 값 | 동작 |
|-------------|------|
| 없음 (생략) | decision + analyze 두 모드 모두 실행 |
| `"decision"` | decision 모드에서만 실행, analyze에서 SKIP |
| `"analyze"` | analyze 모드에서만 실행, decision에서 SKIP |

```json
// 예시: decision 전용 케이스
{ "id": "TC_001", "testMode": "decision", "state": {...}, "expect": {...} }
```

---

## 2. decision vs analyze 차이

### decision 모드
- 실행 함수: `buildDecisionPack({ state, ai:null, structural:null, careerSignals })`
- careerSignals를 case에서 직접 주입 가능
- 엔진 내부 riskResults/capReason/meta 검증에 최적
- JD/resume 텍스트는 `state.jdText`, `state.resumeText` 필드 사용

### analyze 모드
- 실행 함수: `analyze(state, null)` — 전체 파이프라인 실행
- careerSignals는 엔진이 `state.career`로부터 자동 생성 (직접 주입 불가)
- passProbability, topRisks 등 simVM 필드 검증 가능
- state.jdText/resumeText 기반으로 모든 신호 자동 생성

### 케이스 배치 원칙

| 상황 | 적합한 모드 |
|------|-------------|
| careerSignals 직접 주입 필요 (SENIORITY gate 등) | `decision` 전용 |
| passProbability 범위 검증 | `analyze` 전용 또는 both |
| toolMustProbe missingCount 검증 | 두 모드 모두 가능 |
| domain gate 검증 | 두 모드 모두 가능 (하단 주의사항 참조) |

---

## 3. dataset 작성 규칙

### 3-1. state 필드

```json
{
  "state": {
    "jdText": "JD 전문",
    "resumeText": "이력서 전문"
  }
}
```

- `jdText`, `resumeText` 사용 (jd/resume 아님)
- careerSignals가 필요한 경우 case 최상위에 별도 `careerSignals` 필드로 추가

### 3-2. expect 필드 목록

| 필드 | 타입 | 설명 |
|------|------|------|
| `mustHaveIds` | string[] | riskResults에 반드시 존재해야 하는 id |
| `mustNotHaveIds` | string[] | riskResults에 존재하면 안 되는 id |
| `layerAtLeast` | object | 레이어별 최소 개수 `{ gate: 1, must: 1, ... }` |
| `capReasonIncludes` | string | capReason에 포함되어야 하는 문자열 |
| `meta.grayZone.gateId` | string | grayZone.gateId 일치 여부 |
| `meta.toolMustProbe.missingCount` | number | toolMustProbe missingCount 일치 여부 |
| `meta.toolMustProbe.shouldGate` | boolean | toolMustProbe shouldGate 일치 여부 |
| `passProbabilityMin` | number | analyze 전용. pp ≥ 이 값 |
| `passProbabilityMax` | number | analyze 전용. pp ≤ 이 값 |
| `topRiskMustContainAny` | string[] | analyze 전용. topRiskIds에 하나라도 포함 |

---

## 4. 툴 allowlist 주의사항

엔진이 인식하는 툴은 아래 allowlist로 고정되어 있다. **이 외의 툴은 mustTools에 포함되지 않는다.**

```
sap, oracle, salesforce, excel, power bi, powerbi, sql, python, aws, gcp, azure
```

### PowerBI 주의
- `power bi`와 `powerbi`가 **둘 다** allowlist에 있음
- JD에 "PowerBI" 하나를 써도 mustTools가 **2개**(`power bi`, `powerbi`)로 집계됨
- "1개 누락" 시나리오를 테스트하려면 `power bi`/`powerbi` 대신 단일 토큰 툴(python, sap 등)을 사용할 것

### Tableau, Jira, Confluence 등
- allowlist 밖 → toolMustProbe에 포함되지 않음 → 해당 툴로 must/gate 테스트 불가

---

## 5. domain gate 트리거 조건

엔진의 domain mismatch gate는 **도메인 키워드가 dense하게 나열**될 때 신뢰도 있게 트리거된다.

### 권장 패턴 (TC_004 기준)

```
jdText:    "구매/소싱/RFQ/RFX/협상/계약/발주(PO)/벤더/Vendor/원가/단가"
resumeText: "서비스 기획/퍼널/전환율/리텐션/콘텐츠 운영/CRM/캠페인"
```

- 슬래시(`/`) 구분으로 도메인 키워드를 최대한 dense하게 나열
- 자연어 문장 형태는 gate 미트리거 가능성 있음

### analyze 모드에서만 트리거되는 케이스
- 일반 자연어 문장 JD/resume 형태의 도메인 미스매치는 analyze 모드에서 더 잘 감지됨
- decision 모드에서 gate 미트리거 시 `"testMode": "analyze"` 사용 고려

---

## 6. SENIORITY gate 작성 규칙

SENIORITY gate는 `careerSignals.experienceGap`(음수 = 부족)에 기반하므로 **반드시 decision 전용**으로 작성해야 한다.

```json
{
  "testMode": "decision",
  "careerSignals": {
    "requiredYears": { "min": 3 },
    "resumeYears": 2.75,
    "experienceGap": -0.25,
    "gapMonthsAbs": 3
  }
}
```

- `experienceGap`: 음수(부족), 0(정확), 양수(충족) — 단위: 년
- `gapMonthsAbs`: 부족 개월 수 절대값
- grayZone 기준: `gapMonthsAbs ≤ 6` (대략)

---

## 7. 현재 케이스 목록 (v1, 22개)

| ID | 유형 | 모드 | 검증 포인트 |
|----|------|------|-------------|
| TC_001 | SENIORITY grayZone (3개월 부족) | decision | gate + grayZone meta |
| TC_002 | 툴 3개 누락 → gate | both | TOOL gate, missingCount=3 |
| TC_003 | 툴 1개 누락 → must | both | MUST__TOOL__MISSING_1, no gate |
| TC_004 | 도메인 미스매치 (구매 vs 서비스기획) | both | domain gate + weak keyword |
| TC_005 | SENIORITY gate (18개월 부족) | decision | gate, no grayZone |
| TC_006 | 툴 전부 보유 → no tool risk | decision | missingCount=0 |
| TC_007 | 연차 충분 → no seniority | decision | SENIORITY 없음 |
| TC_008 | SaaS영업 JD vs 전기안전 resume | analyze | gate + pp<45 |
| TC_009 | SENIORITY grayZone (1개월 부족) | decision | gate + grayZone meta |
| TC_010 | 전략기획 JD vs 전략구매 resume | both | no domain hard gate |
| TC_011 | 툴 2개 누락 (SAP+Python) → gate | decision | TOOL gate, missingCount=2 |
| TC_012 | 연차 정확히 일치 (gap=0) | decision | SENIORITY 없음 |
| TC_013 | 마케팅 JD vs 토목 resume | both | domain gate + pp<45 |
| TC_014 | 재무 JD vs 마케팅 resume | both | domain gate + pp<45 |
| TC_015 | 강한 매칭 케이스 | analyze | no domain gate + pp≥60 |
| TC_016 | Gate/Cap contract (재무 vs 게임개발) | analyze | gate + capIsNumber + pp≤45 |
| TC_017 | Cap null control (강한 매칭) | both | capIsNull + pp≥60 |
| TC_GATE_SENIORITY_BELOW_EDGE | 연차 경계 아래 (2년11개월 vs 3년) | both | gate + capIsNumber + pp≤55 |
| TC_GATE_SENIORITY_CONTROL | 연차 경계 통과 (3년2개월 vs 3년) | decision | no SENIORITY gate + capIsNull |
| TC_GATE_DOMAIN_HARD_MISMATCH | 도메인 완전 불일치 (재무 vs 게임운영) | analyze | gate + capIsNumber + pp≤45 |
| TC_GATE_MUST_HAVE_MISSING | 필수 스킬 누락 + 도메인 미스매치 | analyze | gate + capIsNumber + pp≤50 |
| TC_GATE_MULTI_COMPOUND | 복합 gate (SENIORITY + TOOL) | analyze | gate≥2 + capIsNumber + pp≤45 |

### TC_GATE_SENIORITY_CONTROL 비고
- `capIsNull` 검증은 decision 모드에서만 가능
- analyze 모드에서 PSEUDO_GATE__ROLE_SKILL__MUST_HAVE_MISSING이 발동해 cap이 설정될 수 있음
- 따라서 `testMode: "decision"` 전용으로 설정

---

## 8. Test Mode Semantics (Current Source of Truth)

### 8-1. Run Modes
- `decision`
- `contract`
- `analyze`

`modeInput` 허용값은 위 3개만 지원한다. 그 외 값은 즉시 실패한다.

### 8-2. Contract Mode
- `contract` 실행은 내부적으로 `decision` 엔진 경로를 재사용한다. (`exec: decision`)
- 단, 케이스 매칭은 `contract` 기준으로 동작한다. (`match: contract`)

### 8-3. testMode Matching

| case `testMode` | decision | contract | analyze |
|---|---|---|---|
| 미지정 | 실행 | 실행 | 실행 |
| `"decision"` | 실행 | SKIP | SKIP |
| `"contract"` | SKIP | 실행 | SKIP |
| `"analyze"` | SKIP | SKIP | 실행 |
| `"both"` | 실행 | 실행 | SKIP |

`testMode: "both"`는 decision/contract 공통 회귀 검증용이며 analyze에서는 실행되지 않는다.

### 8-4. Case Authoring Note
- `testMode: "both"` 케이스에는 analyze 전용 기대값(`passProbabilityMin/Max`, `topRiskMustContainAny`, simVM 관련 값)을 넣지 않는다.

## 9. Test Case Authoring Conventions

### 9-1. ID Naming
- `TC_001_...`: 일반 회귀 케이스
- `TC_GATE_...`: gate/contract 핵심 계약 케이스
- `TC_BOTH_...`: decision/contract 공통 회귀 케이스

기존 prefix 체계는 유지하고, 새 케이스도 가능한 한 동일한 패턴으로 추가한다.

### 9-2. Recommended Case Buckets
- 일반 decision 회귀
- analyze 전용 회귀
- contract 전용 회귀
- both 공통 회귀

케이스 목적이 섞이지 않도록, 새 케이스를 추가할 때는 먼저 어느 bucket에 속하는지 정하고 작성한다.

### 9-3. Authoring Tips
- 새 케이스는 가능하면 `cases` 배열 마지막에 append-only로 추가한다.
- `testMode: "both"` 케이스에는 analyze 전용 기대값(`passProbabilityMin/Max`, `topRiskMustContainAny`, simVM 관련 값)을 넣지 않는다.
- flaky한 수치 기대값보다 `mustHaveIds`, `mustNotHaveIds`, `capReason`, `layerAtLeast/layerMax`처럼 안정적인 expect를 우선 사용한다.
