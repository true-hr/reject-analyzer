# Newgrad Axis4 UI 문구 출력 경로 조사 보고서

**작성일**: 2026-05-04
**조사 범위**: Axis4 "이해관계자 소통 적합성" P2.5 개선 문구 미반영 원인 분석
**조사 대상**: Newgrad Report UI 렌더링 경로

---

## 1. Executive Summary

### 발견
P2.5에서 추가한 Axis4 개선 문구(`buildAxis4StakeholderRoleHint()`, `stakeholderRoles` 등)가 **실제로 생성되지만 UI에서는 렌더링되지 않는 상태**입니다.

### 원인
**WRONG_RENDER_PATH (카테고리 F)**

- newgrad report에서는 `explanation.positives`/`explanation.gaps`가 렌더링되지 않음
- 대신 `comparisonBlock` (buildAxis4ComparisonBlock 결과)만 렌더링됨
- UI 로직: `isNewgradReport = true` → `isCareerAxisCard = false` → `hasSummarySignalBox` 조건 미충족

### 결론
패치 방향: buildAxis4ComparisonBlock의 hardcoded 문구를 P2.5 helpers와 연결하는 것이 필요합니다.

---

## 2. 현재 UI 출력 문제

### 현재 화면에 보이는 문구 (문제의 근거)

**카드 1: "중요 이해관계자와 맞닿은 경험"**
- 확인된 근거: 사람을 상대하는 경험 신호가 일부 보입니다.
- 보완 포인트: 타인과의 접점은 보이지만, 직접 상호작용으로 읽히는 신호는 아직 약한 편입니다.

**카드 2: "직접 소통·조율 경험"**
- 확인된 근거: 이해관계자와의 접점이 있는 경험이 반영됩니다.
- 보완 포인트: 일하는 방식 선택값은 참고 신호로 반영되지만, 실제 경험 신호가 더 중요하게 읽힙니다.

**하단 종합 문구:**
- 이 축은 어떤 사람들과 얼마나 직접 맞닿아 있었는지가 중요합니다. 지금은 관련 신호가 일부 보이지만, 직접 상호작용으로 강하게 읽히는 입력은 제한적입니다.

### 문제점
위 문구는 **우리가 목표로 한 Axis4 P2.5 결과가 아님**
- P1~P2.5에서 추가한 `stakeholderRoles`, `read path`, `copy variation` 문구가 UI에 거의 반영되지 않음

---

## 3. Literal Search 결과

### 6개 현재 UI 문구 위치

모든 문구가 **단일 파일/단일 함수**에서 정의됨:

| 문구 | 파일 | 함수 | 라인 |
|------|------|------|------|
| "사람을 상대하는 경험 신호가 일부 보입니다" | buildNewgradAxisPack.js | buildAxis4ComparisonBlock | 3511 |
| "타인과의 접점은 보이지만, 직접 상호작용으로..." | buildNewgradAxisPack.js | buildAxis4ComparisonBlock | 3522 |
| "이해관계자와의 접점이 있는 경험이 반영됩니다" | buildNewgradAxisPack.js | buildAxis4ComparisonBlock | 3556 |
| "일하는 방식 선택값은 참고 신호로..." | buildNewgradAxisPack.js | buildAxis4ComparisonBlock | 3569 |
| "어떤 사람들과 얼마나 직접 맞닿아..." | buildNewgradAxisPack.js | buildAxis4ComparisonBlock | 3581 |
| "직접 상호작용으로 강하게 읽히는" | buildNewgradAxisPack.js | buildAxis4ComparisonBlock | 3580 |

**결론**: 현재 UI 카드의 모든 문구가 `buildAxis4ComparisonBlock()` 함수에 hardcoded되어 있습니다.

---

## 4. Axis4 Builder 데이터 흐름

### 4.1 두 개의 독립적인 빌더

#### 경로 1: `buildAxis4ComparisonBlock()` (현재 사용 중)
- **정의 파일**: `src/lib/analysis/buildNewgradAxisPack.js` (라인 3469-3583)
- **반환 구조**:
  ```javascript
  {
    version: "newgrad-comparison-v2",
    axisKey: "axis4",
    title: "이해관계자 소통 적합성",
    introText: "...",
    rows: [ ... ],  // ← UI 카드들의 label, positiveEvidenceLabels, missingEvidenceLabels
    cautionText: "..."
  }
  ```
- **특징**: `positiveEvidenceLabels`, `missingEvidenceLabels` 필드가 hardcoded 문구를 직접 포함

#### 경로 2: `buildNewgradInteractionFitExplanation()` (P2.5 개선 포함)
- **정의 파일**: `src/data/transitionLite/axisExplanationRegistry.js` (라인 3161+)
- **호출 함수**: 
  - `buildNewgradInteractionFitPositives()` (라인 1301-1324)
  - `buildNewgradInteractionFitGaps()` (라인 1326-1343)
- **반환 구조**:
  ```javascript
  {
    available: true,
    summary: "...",
    positives: [ "강점 문구 1", "강점 문구 2", ... ],
    gaps: [ "보완 문구 1", "보완 문구 2", ... ],
    reasons: [ ... ],
    detailVersion: "1.0"
  }
  ```
- **P2.5 개선 포함**:
  - `buildAxis4StakeholderRoleHint()` (라인 1203-1240) → positives에 추가
  - `buildNewgradInteractionFitPositives()` → 전체 positives 배열 생성

### 4.2 buildNewgradAxisPack의 데이터 구성

라인 4259:
```javascript
explanation: {
  ...buildNewgradInteractionFitExplanation(_interactionFit.signals, _interactionFit.band, ...),
  whyThisAxisMatters: getAxisJobRationale("axis4", _targetSubVertical),
  ...
},
```

**두 경로 모두 호출되지만 용도가 다름:**
- `comparisonBlock` ← buildAxis4ComparisonBlock() 결과
- `explanation` ← buildNewgradInteractionFitExplanation() 결과

---

## 5. Axis4 UI 소비 경로

### 5.1 TransitionLiteResult.jsx의 렌더링 로직

라인 2446:
```javascript
const isNewgradReport = Boolean(axisPack && axisPack.version.startsWith("newgrad"));
```

라인 2669:
```javascript
const rows = getVisibleComparisonRows(axis?.comparisonBlock);
```

라인 2675-2679:
```javascript
title: String(axis?.comparisonBlock?.title || ...),
introText: takeLeadingSentences(String(axis?.comparisonBlock?.introText || ...), 1),
cautionText: String(axis?.comparisonBlock?.cautionText || ...),
block: axis?.comparisonBlock,
```

**결과**: UI는 `axis.comparisonBlock`을 읽어 카드를 렌더링합니다.

### 5.2 explanation 필드의 처리

라인 3141-3151:
```javascript
const explanationPositives = Array.isArray(explanation?.positives)
  ? explanation.positives.map(...).filter(...).slice(0, ...)
  : [];
const explanationGaps = Array.isArray(explanation?.gaps)
  ? explanation.gaps.map(...).filter(...).slice(0, ...)
  : [];
```

라인 3166-3167:
```javascript
const isCareerAxisCard = !isNewgradReport;
const hasSummarySignalBox = isCareerAxisCard && (explanationPositives.length > 0 || explanationGaps.length > 0);
```

**핵심**: `explanation.positives`/`explanation.gaps`는 **career report에서만** 렌더링됨
- newgrad report: `isNewgradReport = true` → `isCareerAxisCard = false` → 렌더링 안 함

---

## 6. P2.5 Helper 호출 여부 확인

### 6.1 buildAxis4StakeholderRoleHint() 호출 경로

**정의**:
- `src/data/transitionLite/axisExplanationRegistry.js` 라인 1203-1240

**호출 관계**:
```
buildNewgradAxisPack()
  └─ buildNewgradInteractionFitExplanation() [라인 4259]
      └─ buildNewgradInteractionFitPositives() [라인 1314 호출]
          └─ buildAxis4StakeholderRoleHint() [라인 1314]
```

**확인 사항**:
- ✅ 함수가 정의됨
- ✅ export/import 연결됨
- ✅ buildNewgradInteractionFitPositives()에서 호출됨 (라인 1314)
- ✅ 반환된 문구가 positives 배열에 추가됨 (라인 1315-1317)

**문제**: positives 배열이 newgrad report UI에서 렌더링되지 않음

### 6.2 signals 전달 확인

buildAxis4StakeholderRoleHint()의 신호 의존성:

라인 1204-1207:
```javascript
const jobRelevantHit = signals?.jobRelevantStakeholdersHit;
const relevanceMeta = signals?.axis4RelevanceMeta;
const targetJobLabel = String(signals?.targetJobLabel || "").trim() || "목표 직무";
const industryAxis4Context = signals?.industryAxis4Context;
```

**핵심 조건** (라인 1209):
```javascript
if (!relevanceMeta?.stakeholderRoles) return "";
```

**신호 요구사항**:
- `signals.axis4RelevanceMeta.stakeholderRoles` - 필수
- `signals.jobRelevantStakeholdersHit.primaryKeys/secondaryKeys` - 선택
- `signals.targetJobLabel` - 선택

---

## 7. Registry Lookup 확인

### 7.1 stakeholderRoles 데이터 구조

라인 1211-1225:
```javascript
const stakeholderRoles = relevanceMeta.stakeholderRoles;
const primaryHitKeys = Array.isArray(jobRelevantHit?.primaryKeys) ? jobRelevantHit.primaryKeys : [];
const secondaryHitKeys = Array.isArray(jobRelevantHit?.secondaryKeys) ? jobRelevantHit.secondaryKeys : [];

let hitKey = "";
let isPrimaryHit = false;
if (primaryHitKeys.length > 0) {
  hitKey = String(primaryHitKeys[0] || "").trim();
  isPrimaryHit = true;
} else if (secondaryHitKeys.length > 0) {
  hitKey = String(secondaryHitKeys[0] || "").trim();
  isPrimaryHit = false;
}

if (!hitKey || !stakeholderRoles[hitKey]) return "";
```

**lookup 메커니즘**:
1. jobRelevantStakeholdersHit.primaryKeys의 첫 번째 값을 hitKey로 선택
2. 없으면 secondaryKeys에서 선택
3. stakeholderRoles[hitKey]로 role 데이터 조회
4. 없으면 빈 문자열 반환

---

## 8. 원인 분류

### 최종 진단: **F. WRONG_RENDER_PATH**

#### 상세 분석

**빌더 측**: ✅ 정상
- buildNewgradInteractionFitExplanation() 호출됨
- buildAxis4StakeholderRoleHint() 호출됨
- positives/gaps 배열이 생성됨

**UI 소비 측**: ❌ 문제
- newgrad report에서 explanation.positives/gaps를 **렌더링하지 않음**
- 대신 comparisonBlock 사용
- 조건: `isCareerAxisCard = !isNewgradReport` → newgrad report에서는 false

#### 코드 증거

**TransitionLiteResult.jsx 라인 3166-3218**:
```javascript
const isCareerAxisCard = !isNewgradReport;
const hasSummarySignalBox = isCareerAxisCard && (explanationPositives.length > 0 || explanationGaps.length > 0);

return (
  {hasSummarySignalBox ? (
    // explanation.positives/gaps 렌더링
    <div>
      {explanationPositives.map((p, i) => <li>{p}</li>)}
      {explanationGaps.map((g, i) => <li>{g}</li>)}
    </div>
  ) : null}
)
```

**newgrad report에서의 흐름**:
1. `isNewgradReport = true` (라인 2446)
2. `isCareerAxisCard = false` (라인 3166)
3. `hasSummarySignalBox = false` (라인 3167)
4. explanation.positives/gaps 섹션이 렌더링되지 않음

---

## 9. 권장 수정 범위

### 9.1 수정이 필요한 파일

| 파일 | 함수/영역 | 변경 범위 |
|------|---------|---------|
| buildNewgradAxisPack.js | buildAxis4ComparisonBlock | 필수 수정 |
| axisExplanationRegistry.js | buildNewgradInteractionFitExplanation | 부분 수정 또는 유지 |
| TransitionLiteResult.jsx | NewgradComparisonBlock 렌더링 로직 | 조건부 수정 |

### 9.2 수정 옵션

#### 옵션 A: comparisonBlock에 positives/gaps 추가 (권장)
- `buildAxis4ComparisonBlock()`이 P2.5 helpers 호출
- 반환 객체에 `positives`/`gaps` 필드 추가
- UI 변경 없음
- **장점**: 기존 렌더링 경로 유지, 최소 수정
- **파일**: buildNewgradAxisPack.js (1개)

#### 옵션 B: newgrad report에서 explanation 렌더링 활성화
- TransitionLiteResult.jsx의 조건 변경
- `isCareerAxisCard = !isNewgradReport` → `isCareerAxisCard = true` (newgrad도 포함)
- **장점**: 기존 positives/gaps 로직 재사용
- **단점**: 다른 축의 렌더링에 영향 가능
- **파일**: TransitionLiteResult.jsx (1개)

#### 옵션 C: 빌더 통합
- buildNewgradInteractionFitExplanation()의 positives/gaps를 comparisonBlock에 병합
- 두 경로 데이터를 하나로 통합
- **장점**: 단일 데이터 소스
- **단점**: 큰 규모 수정
- **파일**: buildNewgradAxisPack.js, axisExplanationRegistry.js (2개)

### 9.3 안전성 평가

| 옵션 | 회귀 위험 | 테스트 범위 | 난이도 |
|------|---------|-----------|--------|
| A | 낮음 | buildAxis4ComparisonBlock + UI 표준 케이스 | 중간 |
| B | 중간 | TransitionLiteResult 전체 축 + 두 리포트 타입 | 높음 |
| C | 높음 | 빌더 + 데이터 구조 + UI 전체 | 높음 |

---

## 10. 검증 및 QA 방법

### 10.1 수정 후 검증 체크리스트

1. **Axis4 신입 케이스**
   - [ ] 현재 UI에서 P2.5 개선 문구 표시 확인
   - [ ] 카드 1, 카드 2, 하단 종합 문구 모두 확인
   - [ ] stakeholderRoles 문구 포함 여부 확인

2. **신호 조건별**
   - [ ] primaryHitKeys 있음 + stakeholderRoles 있음 → 개선 문구 표시
   - [ ] primaryHitKeys 없음 → fallback 문구 표시
   - [ ] stakeholderRoles 없음 → 기존 동작 유지

3. **다른 축 회귀**
   - [ ] Axis 1-5 career report 렌더링 정상
   - [ ] Axis 1-5 newgrad report 렌더링 정상
   - [ ] 카드별 positives/gaps 표시 정상

4. **심화 케이스**
   - [ ] 다중 stakeholder 경우
   - [ ] 부분 신호 케이스 (일부만 제공)
   - [ ] 다국어 문구 한글 인코딩 정상

---

## 11. 검토된 파일 목록

### 조사에 실제 읽은 파일

| 파일 | 역할 | 섹션 |
|------|------|------|
| buildNewgradAxisPack.js | Axis 데이터 빌더 | buildAxis4ComparisonBlock (L3469-3583) |
| axisExplanationRegistry.js | Axis 설명 생성 | buildAxis4StakeholderRoleHint (L1203-1240), buildNewgradInteractionFitPositives (L1301-1324), buildNewgradInteractionFitGaps (L1326-1343) |
| TransitionLiteResult.jsx | UI 렌더링 | isNewgradReport 정의 (L2446), comparisonBlock 소비 (L2669-2679), explanation 소비 (L3141-3218) |

### 확인하지 않은 파일 (향후 참고)

- `newgradAxis4JobStakeholderRelevanceRegistry.js` - registry 내용 (조사 범위 외)
- PDF/print 렌더링 경로 - 별도 경로
- 비교 이전 버전 (buildAxis4ComparisonBlock_legacy) - 라인 2765

---

## 12. 다음 단계

### Phase 1: 원인 확인 (완료)
- ✅ UI 문구 위치 특정: buildAxis4ComparisonBlock()
- ✅ P2.5 버전 위치 특정: axisExplanationRegistry.js
- ✅ 두 경로 분리 원인: newgrad report의 isCareerAxisCard 조건
- ✅ 원인 분류: WRONG_RENDER_PATH (F)

### Phase 2: 패치 방향 결정 (필요)
- [ ] 옵션 A/B/C 중 선택
- [ ] stakeholder와 협의

### Phase 3: 패치 구현 (다음 작업)
- [ ] 선택된 옵션 구현
- [ ] 조건별 테스트 케이스 작성
- [ ] UI 검증 및 회귀 테스트

---

## 부록

### A. 함수 호출 체인 (Axis4 경로 1)

```
buildNewgradAxisPack()
└─ Line 4175: buildAxis4ComparisonBlock(_interactionFit.signals)
   └─ Returns: { rows: [...], title: "이해관계자 소통 적합성", ... }
      └─ Consumed by: TransitionLiteResult.jsx L2669 (comparisonBlock)
         └─ Rendered as: Axis4 카드 (현재 UI)
```

### B. 함수 호출 체인 (Axis4 경로 2)

```
buildNewgradAxisPack()
└─ Line 4259: buildNewgradInteractionFitExplanation(_interactionFit.signals, ...)
   └─ Calls: buildNewgradInteractionFitPositives()
      └─ Calls: buildAxis4StakeholderRoleHint()
         └─ Returns: P2.5 개선 문구
      └─ Returns: { positives: [...], gaps: [...], ... }
   └─ Stored in: explanation field
      └─ Consumed by: TransitionLiteResult.jsx L3166-3218
         └─ NOT rendered in newgrad report (isCareerAxisCard = false)
```

### C. 현재 UI 문구 hardcoded 위치 (buildAxis4ComparisonBlock)

**라인 3511-3512** (카드 1 positives):
```javascript
: "사람을 상대하는 경험 신호가 일부 보입니다.",
"사람을 상대하는 경험 신호가 일부 보입니다."
```

**라인 3522-3523** (카드 1 missingEvidenceLabels):
```javascript
: "타인과의 접점은 보이지만, 직접 상호작용으로 읽히는 신호는 아직 약한 편입니다.",
"타인과의 접점은 보이지만, 직접 상호작용으로 읽히는 신호는 아직 약한 편입니다."
```

**라인 3556-3557** (카드 2 positives):
```javascript
: "이해관계자와의 접점이 있는 경험이 반영됩니다.",
"이해관계자와의 접점이 있는 경험이 반영됩니다."
```

**라인 3569-3570** (카드 2 missingEvidenceLabels):
```javascript
: "일하는 방식 선택값은 참고 신호로 반영되지만, 실제 경험 신호가 더 중요하게 읽힙니다.",
"일하는 방식 선택값은 참고 신호로 반영되지만, 실제 경험 신호가 더 중요하게 읽힙니다."
```

**라인 3580-3581** (하단 cautionText):
```javascript
: `이 축은 ${stakeholderText} 같은 대상과 얼마나 직접 맞닿아 있었는지가 중요합니다. 지금은 관련 신호가 일부 보이지만, 직접 상호작용으로 강하게 읽히는 입력은 제한적입니다.`)
: "이 축은 어떤 사람들과 얼마나 직접 맞닿아 있었는지가 중요합니다. 지금은 관련 신호가 일부 보이지만, 직접 상호작용으로 강하게 읽히는 입력은 제한적입니다.",
```

---

**END OF INVESTIGATION REPORT**
