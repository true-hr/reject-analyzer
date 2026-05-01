# PASSMAP 신입 UI 설명 경로 조사 (UI Copy Path Investigation)

**날짜**: 2026-04-29
**분류**: SAFE INVESTIGATION — 런타임/UI/scoring 코드 수정 없음
**목적**: P0 fixture의 `uiInsightExpected` 계약이 실제 결과 화면의 어떤 VM 필드/컴포넌트/슬롯으로 연결되어야 하는지 파악

---

## 1. 조사 범위 및 목적

### 조사 대상 파일

| 파일 | 역할 |
|---|---|
| `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` | VM 생성 진입점 (신입 분석 결과 객체 반환) |
| `src/lib/analysis/buildNewgradAxisPack.js` | axisPack 구성 — 5축 explanation/comparisonBlock 생성 |
| `src/data/transitionLite/axisExplanationRegistry.js` | 축별 explanation 슬롯 빌더 |
| `src/components/report/TransitionLiteResult.jsx` | 결과 화면 렌더러 |

### 조사 목적

신입 P0 fixture에 정의된 `uiInsightExpected` 계약(headlineShouldMention, bodyShouldMention 등)이
실제 UI에서 어느 VM 필드 → 어느 컴포넌트 → 어느 슬롯을 통해 유저에게 보이는지 확인.

설명 텍스트를 **어디에 써야 화면에 나타나는지**를 확정하는 것이 핵심 목표.

---

## 2. VM 필드 맵

`buildNewgradTransitionLiteResult` 반환 객체의 최상위 필드와 UI 도달 여부.

| VM 필드 | 렌더 여부 | 노출 위치 | 비고 |
|---|---|---|---|
| `heroSummary` | ❌ 미렌더 | — | TransitionLiteResult.jsx:2182에서 read되지만 JSX에서 사용 없음 |
| `whyThisRead` | ❌ 미렌더 | — | read되지만 JSX 렌더 없음 (완전 dead) |
| `whyThisReadSupportLine` | ❌ 미렌더 | — | JSX에서 사용 흔적 없음 |
| `inputEvidenceRead` | ❌ 미렌더 | — | JSX 렌더 없음 |
| `axisReadSummary` | ❌ 미렌더 | — | JSX 렌더 없음 |
| `topRepairSignals` | ⚠️ 미렌더 | 코드 존재하나 숨김 | `shouldRenderNewgradRepairSignalsSection = false` 하드코딩(line 2306) |
| `transitionReadBlock` | ❌ 신입 제외 | `!isNewgradReport` 조건 | 경력 전환 전용 |
| `newgradGoalComparisonTable` | ✅ 렌더 | `NewgradGoalComparisonSection` | 입력-직무·산업 연결 테이블 |
| `strengthEvidenceRead` | ✅ 렌더 | "강점 연결 근거" 섹션 | line 2996 |
| `targetJobRead` | ✅ 렌더 | 참고 정보 섹션 | title, body, bullets, tags |
| `targetIndustryRead` | ✅ 렌더 | 참고 정보 섹션 | title, summary, bullets |
| `axisPack` | ✅ 렌더 | 5축 카드 + 세부판독 | 가장 핵심적인 렌더 경로 |

### isNewgradReport 판별 조건

```js
// TransitionLiteResult.jsx:1994
const isNewgradReport = Boolean(
  axisPack && typeof axisPack.version === "string" && axisPack.version.startsWith("newgrad")
);
```

`buildNewgradAxisPack.js:3728`에서 `version: "newgrad.v1"` 고정 반환 → 항상 `true`.

---

## 3. UI 슬롯 맵 — axis explanation 하위 필드

### 3-1. hasSlots 게이팅 (★ 핵심)

```js
// TransitionLiteResult.jsx:2612-2619
const explanation = axis?.explanation?.available ? axis.explanation : null;
const slotLead         = typeof explanation?.lead         === "string" ? explanation.lead.trim()         : "";
const slotCriteria     = typeof explanation?.criteria     === "string" ? explanation.criteria.trim()     : "";
const slotScoreReason  = typeof explanation?.scoreReason  === "string" ? explanation.scoreReason.trim()  : "";
const slotLiftOrLimit  = typeof explanation?.liftOrLimit  === "string" ? explanation.liftOrLimit.trim()  : "";
const slotFieldCount   = [slotLead, slotCriteria, slotScoreReason, slotLiftOrLimit].filter(Boolean).length;
const hasSlots         = isNewgradReport && Boolean(explanation) && slotFieldCount >= 2;
```

`hasSlots = true` 조건: `{lead, criteria, scoreReason, liftOrLimit}` 중 **2개 이상** 채워져야 함.

### 3-2. 각 슬롯별 노출 위치

| 슬롯 | `hasSlots` 조건 | 화면 위치 | 사용자 액션 필요 |
|---|---|---|---|
| `explanation.lead` | hasSlots=true → primaryBody | 축 카드 메인 텍스트 (항상 표시) | 없음 |
| `explanation.scoreReason` | hasSlots=true → secondaryBody | 축 카드 서브 텍스트 (항상 표시) | 없음 |
| `explanation.criteria` | hasSlots=true | "상세보기" 확장 → **"판단 기준"** | 클릭 필요 |
| `explanation.liftOrLimit` | hasSlots=true | "상세보기" 확장 → **"다음 보완 방향"** | 클릭 필요 |
| `explanation.whyThisAxisMatters` | 항상 | "상세보기" 확장 → **"왜 이 축을 보나요?"** (tiny 10.5px) | 클릭 필요 |
| `explanation.positives[]` | **!hasSlots** | "상세보기" 확장 → "강점 신호" | 클릭 필요 |
| `explanation.gaps[]` | **!hasSlots** | "상세보기" 확장 → "보완 포인트" | 클릭 필요 |
| `explanation.reasons[]` | **!hasSlots** | "상세보기" 확장 → "반영 이유" | 클릭 필요 |
| `explanation.experienceSupportLine` | showLegacyExperienceDetail (= comparisonBlock 없을 때) | "실전 경험 반영" 박스 | 클릭 필요 |
| `explanation.selfReportSupportLine` | showLegacySelfReportDetail (= comparisonBlock 없을 때) | "입력 기반 해석" 박스 | 클릭 필요 |
| `explanation.explanationBridgeContext` | **Axis1(jobStructure) 전용** | "상세보기" → **"연결되는 지점"** | 클릭 필요 |
| `explanation.explanationWhyNotHigher` | **Axis1(jobStructure) 전용** | "상세보기" → **"더 높게 보기 어려운 이유"** | 클릭 필요 |

> **주의**: `positives[]`, `gaps[]`, `reasons[]`는 `hasSlots=false`일 때만 표시됨.
> hasSlots=true이면 이 세 배열은 렌더에서 제외되므로 lead/scoreReason이 반드시 채워져야 함.

### 3-3. comparisonBlock 슬롯

`axisPack.axes.{axisKey}.comparisonBlock` 필드들:

| 슬롯 | 화면 위치 | 사용자 액션 |
|---|---|---|
| `comparisonBlock.rows[]` | "세부판독" 섹션 (`NewgradDetailedReadSection`) | "세부판독 펼치기" 클릭 |
| `comparisonBlock.rows[].summaryText` | 세부판독 카드 내 각 행 설명 | "세부판독 펼치기" 클릭 |
| `comparisonBlock.rows[].positiveEvidenceLabels[]` | "확인된 근거" 레이블 | "세부판독 펼치기" 클릭 |
| `comparisonBlock.rows[].missingEvidenceLabels[]` | "보완 포인트" 레이블 | "세부판독 펼치기" 클릭 |
| `comparisonBlock.cautionText` | 세부판독 카드 하단 **"이 축의 종합 보완 포인트"** footer | "세부판독 펼치기" 클릭 |
| `comparisonBlock.capabilityLabels[]` | 세부판독 카드 내 "이 결과에 영향을 준 역량" 칩 | "역량 설명 보기" 클릭 |
| `comparisonBlock.capabilityLabelLine` | 역량 칩 대체 텍스트 | — |

### 3-4. industryImportanceProfile (Axis2 전용)

`axisPack.axes.industryContext.industryImportanceProfile`:

세부판독 카드 내 violet 박스 **"산업 맥락 체크"** 로 렌더.

```
industryImportanceProfile.title      → 박스 타이틀
industryImportanceProfile.summary    → 박스 설명
industryImportanceProfile.signals[]  → 칩 + 설명 텍스트
industryImportanceProfile.guidance   → 하단 안내 문구
```

---

## 4. 죽은 필드 & 렌더되지 않는 필드 목록

### 완전 dead — VM에 있지만 JSX에서 렌더 없음

| 필드 | 상태 | 근거 |
|---|---|---|
| `vm.heroSummary` | DEAD | TransitionLiteResult.jsx에서 read 후 사용 없음 |
| `vm.whyThisRead` | DEAD | read되나 JSX 렌더 없음 |
| `vm.whyThisReadSupportLine` | DEAD | JSX 흔적 없음 |
| `vm.inputEvidenceRead` | DEAD | JSX 렌더 없음 |
| `vm.axisReadSummary` | DEAD | JSX 렌더 없음 |

### 조건부 비활성 — 코드 있으나 출력 차단됨

| 필드/섹션 | 상태 | 근거 |
|---|---|---|
| `vm.topRepairSignals` → newgradRepairCards | BLOCKED | `shouldRenderNewgradRepairSignalsSection = false` 하드코딩 (line 2306) |
| `vm.transitionReadBlock` | NEWGRAD 제외 | `!isNewgradReport` 조건 (line 2934) |
| `explanation.positives[]`, `gaps[]`, `reasons[]` | hasSlots=true 시 숨김 | 4개 슬롯 중 2개 이상 채워지면 억제됨 |
| `explanation.experienceSupportLine/Highlights` | comparisonBlock 있으면 숨김 | `showLegacyExperienceDetail = hasExperienceDetail && !hasComparisonBlock` |
| `explanation.selfReportSupportLine/Highlights` | comparisonBlock 있으면 숨김 | 위와 동일 로직 |

### 정의만 있고 JSX에서 미사용인 컴포넌트

- `NewgradComparisonBlock` (TransitionLiteResult.jsx:242): 컴포넌트로 정의되어 있으나 JSX 어느 곳에서도 `<NewgradComparisonBlock>` 호출 없음 — 사실상 DEAD 컴포넌트

---

## 5. 케이스별 라우팅 후보 (P0 7개)

### NG-INVARIANT-AXIS1-001 — 프로젝트 경험 → Axis1 과상승 방지

**핵심 메시지**: 프로젝트 경험은 Axis3(경험 연결성) 근거이고 Axis1(전공-직무 연결성)의 근거가 아님.

| 슬롯 | 라우팅 이유 | 우선순위 |
|---|---|---|
| `axes.jobStructure.explanation.lead` | 항상 보이는 primary body → "전공 기반 없이 Axis1이 높아질 수 없음" 전달 | ★★★ |
| `axes.jobStructure.explanation.scoreReason` | secondary body → 구체 이유 설명 | ★★★ |
| `axes.jobStructure.explanation.explanationWhyNotHigher` | Axis1 전용 "더 높게 보기 어려운 이유" | ★★ |
| `axes.jobStructure.explanation.explanationBridgeContext` | Axis1 전용 "연결되는 지점" → 프로젝트는 Axis3로 이어짐 설명 | ★★ |

**forbidden 검증**: `shouldNotMention` 항목은 `lead`/`scoreReason` 텍스트에서 제거 확인.

---

### NG-INVARIANT-AXIS2-001 — 전공 기반 산업 이해 → Axis2 제한

**핵심 메시지**: 전공 유사성이 산업 이해 증거가 되려면 추가 근거(자격증·인턴·관련 과목)가 필요.

| 슬롯 | 라우팅 이유 | 우선순위 |
|---|---|---|
| `axes.industryContext.explanation.lead` | primary body → 현재 산업 이해 근거 수준 설명 | ★★★ |
| `axes.industryContext.explanation.criteria` | "판단 기준" → Axis2가 보는 기준 명시 (expandable) | ★★ |
| `axes.industryContext.explanation.liftOrLimit` | "다음 보완 방향" → 산업 이해 강화 방법 | ★★ |
| `comparisonBlock.cautionText` (Axis2) | 세부판독 footer hint | ★ |

---

### NG-INVARIANT-AXIS3-001 — 인턴/실전 경험 → Axis3 상승

**핵심 메시지**: 실전 인턴 경험은 Axis3(경험 연결성) 상승 근거로 올바르게 반영되어야 함.

| 슬롯 | 라우팅 이유 | 우선순위 |
|---|---|---|
| `axes.responsibilityScope.explanation.lead` | primary body → 인턴 경험이 Axis3에 반영된 이유 | ★★★ |
| `axes.responsibilityScope.explanation.scoreReason` | secondary body → 점수 상승 근거 구체화 | ★★★ |
| `comparisonBlock.rows[].summaryText` | 세부판독 내 경험 evidence trail 확인 | ★★ |
| `comparisonBlock.rows[].positiveEvidenceLabels[]` | "확인된 근거" 레이블로 인턴 경험 표시 | ★★ |

---

### NG-CERT-AXIS2-001 — 전공 특화 자격증 → Axis2 상승

**핵심 메시지**: 산업 특화 자격증은 Axis2 산업 이해 근거로 반영되어야 함.

| 슬롯 | 라우팅 이유 | 우선순위 |
|---|---|---|
| `axes.industryContext.explanation.lead` | primary body → 자격증이 Axis2에 미친 영향 | ★★★ |
| `comparisonBlock.capabilityLabels[]` | "이 결과에 영향을 준 역량" 칩 → 자격증 표시 | ★★ |
| `axes.industryContext.industryImportanceProfile` | 산업 맥락 체크 박스 (violet) | ★★ |
| `axes.industryContext.explanation.criteria` | "판단 기준" — 도메인 자격증의 산업 이해 기여 조건 | ★ |

---

### NG-INDUSTRY-SENSITIVITY-001 — 보수적 산업 → 신입 적합도 하향

**핵심 메시지**: 보수적 산업(금융·공공·법무 등)은 신입 진입 기준이 높아 전반적 점수가 낮을 수 있음.

| 슬롯 | 라우팅 이유 | 우선순위 |
|---|---|---|
| `axes.industryContext.industryImportanceProfile` | "산업 맥락 체크" 박스 — 산업 고유 특성 안내 (violet 강조) | ★★★ |
| `axes.industryContext.explanation.lead` | primary body → 산업 진입 장벽 설명 | ★★★ |
| `axes.industryContext.explanation.criteria` | "판단 기준" — 이 산업이 보수적으로 평가되는 이유 | ★★ |
| `axes.jobStructure.explanation.lead` (영향받는 경우) | Axis1도 영향받으면 동일 전략 | ★★ |

---

### NG-COMBO-WEAK-001 — 전공 없음 + 경험 없음 → 전체 낮음

**핵심 메시지**: 전공과 경험 모두 없을 때 5개 축 전반이 낮아지는 이유와 개선 방향.

| 슬롯 | 라우팅 이유 | 우선순위 |
|---|---|---|
| `axes.{각 약한 축}.explanation.lead` | 각 축별 primary body → 낮은 이유 | ★★★ |
| `axes.{각 약한 축}.explanation.liftOrLimit` | "다음 보완 방향" — 구체적 개선 방법 | ★★ |
| `axes.{각 약한 축}.explanation.scoreReason` | secondary body → 점수 산출 근거 | ★★ |

> ⚠️ **주의**: `vm.topRepairSignals`는 이 케이스에서 풍부하게 채워지겠지만,
> `shouldRenderNewgradRepairSignalsSection = false`로 인해 유저에게 전혀 보이지 않음.
> repair 메시지는 반드시 axis explanation 슬롯을 통해야 함.

---

### NG-COMBO-STRONG-001 — 전공 일치 + 인턴 경험 → Axis1/3 상승

**핵심 메시지**: 전공 일치와 인턴이 함께 있을 때 Axis1(전공 연결) AND Axis3(경험 연결) 모두 높아야 함.

| 슬롯 | 라우팅 이유 | 우선순위 |
|---|---|---|
| `axes.jobStructure.explanation.lead` | Axis1 primary → 전공 일치 확인 텍스트 | ★★★ |
| `axes.responsibilityScope.explanation.lead` | Axis3 primary → 인턴 경험 확인 텍스트 | ★★★ |
| `comparisonBlock.rows[].summaryText` (Axis1, Axis3) | 세부판독에서 evidence 확인 | ★★ |
| `axes.jobStructure.explanation.explanationBridgeContext` | Axis1 "연결되는 지점" — 전공+직무 연결 설명 | ★ |

---

## 6. hasSlots 게이팅 메커니즘 상세

### 분기 요약

```
hasSlots = isNewgradReport
           && explanation?.available === true
           && [lead, criteria, scoreReason, liftOrLimit].filter(Boolean).length >= 2
```

| 상태 | primaryBody | secondaryBody | 확장 패널 |
|---|---|---|---|
| `hasSlots = true` | `lead` | `scoreReason` | criteria, liftOrLimit, whyThisAxisMatters |
| `hasSlots = false` | `summary 또는 narrative` | — | positives, gaps, reasons |

### 함의

- **항상 보이는 텍스트를 원하면**: `lead` + `scoreReason` 중 하나 이상 채워야 하고, 총 4개 중 2개 이상 필요
- **"상세보기" 없이도 보이게**: `lead`가 핵심 메시지를 담아야 함
- **expandable 섹션(criteria, liftOrLimit)**: 유저가 "상세보기"를 클릭해야 보임 → secondary 정보 적합

---

## 7. 위험 패턴 (Dangerous Patterns)

### 패턴 1 — Dead 필드에 텍스트 기록

```
vm.heroSummary → 절대 사용 금지 (never rendered)
vm.whyThisRead → 절대 사용 금지 (never rendered)
vm.inputEvidenceRead → 절대 사용 금지 (never rendered)
```

### 패턴 2 — topRepairSignals에 의존

`shouldRenderNewgradRepairSignalsSection = false` 하드코딩으로 이 섹션은 현재 **완전히 숨겨짐**.
case-specific 메시지를 topRepairSignals에 담으면 유저에게 전달되지 않음.

### 패턴 3 — positives/gaps에만 의존하고 lead를 비워두기

`hasSlots = true` 상태에서는 `positives[]`, `gaps[]`, `reasons[]`가 렌더에서 제외됨.
lead + scoreReason이 채워져서 hasSlots=true가 되면 나머지 세 배열은 "상세보기"에서도 숨겨짐.

### 패턴 4 — whyThisAxisMatters를 핵심 설명으로 사용

이 슬롯은 "상세보기" 확장 패널 하단에서 `text-[10.5px] text-slate-500`로 렌더됨.
사실상 **교육용 보조 주석** 수준으로, case-specific 주요 메시지에 적합하지 않음.

### 패턴 5 — comparisonBlock.cautionText를 헤드라인으로 사용

이 슬롯은 세부판독 카드 하단의 **"이 축의 종합 보완 포인트"** footer임.
부연 설명에만 적합하며, 주요 insight headline로 사용하면 가시성 부족.

### 패턴 6 — explanationBridgeContext/explanationWhyNotHigher의 가시성 오해

두 슬롯 모두 Axis1 전용, **"상세보기" 확장 필요**. 유저 클릭 없이는 노출되지 않음.
핵심 메시지를 여기에만 담으면 대부분의 유저는 놓침.

### 패턴 7 — NewgradComparisonBlock 인스턴스화 시도

`NewgradComparisonBlock` 컴포넌트는 `TransitionLiteResult.jsx:242`에 정의되어 있으나
JSX render tree 어느 곳에서도 `<NewgradComparisonBlock>` 호출이 없음 — dead component.
이 컴포넌트를 통한 렌더를 기대하면 안 됨.

---

## 8. 구현 우선순위 권고

사례별 UI 설명 텍스트를 실제로 구현할 때의 작업 순서.

| 순위 | 대상 슬롯 | 이유 | 영향 케이스 |
|---|---|---|---|
| P1 | `explanation.lead` | 클릭 없이 항상 노출 — 가장 확실한 전달 경로 | 전체 7개 |
| P1 | `explanation.scoreReason` | 항상 노출, lead와 함께 hasSlots=true 보장 | 전체 7개 |
| P2 | `explanation.explanationWhyNotHigher` (Axis1) | 과상승 방지 케이스 핵심 슬롯 | NG-INVARIANT-AXIS1-001 |
| P2 | `explanation.explanationBridgeContext` (Axis1) | 프로젝트↔Axis3 연결 설명 | NG-INVARIANT-AXIS1-001 |
| P3 | `explanation.criteria` | "판단 기준" expandable — 이해 보완 | NG-INVARIANT-AXIS2-001, NG-INDUSTRY-SENSITIVITY-001 |
| P3 | `explanation.liftOrLimit` | "다음 보완 방향" expandable — 개선 안내 | NG-COMBO-WEAK-001, NG-CERT-AXIS2-001 |
| P4 | `comparisonBlock.cautionText` | 세부판독 footer hint — 부연 | NG-INVARIANT-AXIS2-001 |
| P4 | `industryImportanceProfile` | "산업 맥락 체크" violet 박스 | NG-INDUSTRY-SENSITIVITY-001, NG-CERT-AXIS2-001 |
| P5 | `comparisonBlock.rows[].summaryText` | 세부판독 evidence trail | NG-INVARIANT-AXIS3-001, NG-COMBO-STRONG-001 |

---

## 9. 결론 및 다음 단계

### 핵심 결론

1. **항상 보이는 경로는 `explanation.lead` + `explanation.scoreReason` 뿐**이다.
   다른 모든 슬롯은 expandable 클릭이나 `hasSlots=false` 조건을 요구한다.

2. **`topRepairSignals`/`whyThisRead`/`heroSummary`에 쓰는 텍스트는 유저에게 도달하지 않는다.**
   `shouldRenderNewgradRepairSignalsSection = false` 하드코딩이 repair 섹션 전체를 차단 중이다.

3. **`hasSlots` 게이트를 먼저 통과해야 한다.**
   `{lead, criteria, scoreReason, liftOrLimit}` 중 2개 이상을 채워야 lead/scoreReason이 화면에 나타난다.
   그 전까지는 legacy `positives/gaps/reasons` 경로가 렌더되지만 "상세보기" 확장 필요.

4. **Axis1(jobStructure)에는 추가 전용 슬롯이 있다.**
   `explanationBridgeContext`("연결되는 지점"), `explanationWhyNotHigher`("더 높게 보기 어려운 이유").
   현재 신입 모드에서 이 두 슬롯을 생성하는 코드가 `buildNewgradJobFitExplanation`에 없음
   → 구현 시 `buildNewgradExplanationSlots` 또는 explanation 빌더 확장이 필요.

### 다음 단계 (구현 라운드 전 준비 사항)

1. **`hasSlots` 보장 확인**: 각 P0 케이스를 baseline runner로 실행해 explanation 객체에 lead + 최소 1개 슬롯이 생성되는지 확인.
2. **lead 텍스트 품질 검증**: `uiInsightExpected.visibleSurfaces[role=primaryBody].shouldMention` 항목이 현재 생성되는 `lead` 텍스트에 포함되는지 확인.
3. **`explanationWhyNotHigher` 신입 지원 여부 확인**: `buildNewgradJobFitExplanation`이 이 슬롯을 생성하는지 확인 → 없으면 구현 범위에 추가.
4. **topRepairSignals 섹션 활성화 여부 결정**: `shouldRenderNewgradRepairSignalsSection = false`를 `true`로 바꾸는 것이 적절한지 별도 라운드에서 설계 필요 (현재 비활성 이유 불명확).

---

## 10. uiInsightExpected 계약 정정 이력 (2026-04-30)

### 정정 사유

초기 Round 3에서 `uiInsightExpected.preferredVisibleSlot = "caseInsight"` 및 `"whyThisRead"` 를 후보로 기록했으나,
Round 4 조사 결과 해당 슬롯들이 실제 UI에 도달하지 않는 dead/blocked field임이 확인됨.

### 제거된 후보 visible target

| 필드 | 이유 |
|---|---|
| `vm.whyThisRead` | TransitionLiteResult.jsx에서 read되나 JSX 렌더 없음 — dead field |
| `vm.topRepairSignals` | `shouldRenderNewgradRepairSignalsSection = false` 하드코딩 — 섹션 차단됨 |
| `preferredVisibleSlot: "caseInsight"` | 실제 존재하지 않는 슬롯 이름 — 구현 후보가 아님 |

### 확정된 1차 구현 후보

```
axisPack.axes.{axisKey}.explanation.lead        → primaryBody (항상 노출, hasSlots=true 시)
axisPack.axes.{axisKey}.explanation.scoreReason → secondaryBody (항상 노출, hasSlots=true 시)
```

### hasSlots 조건 필수 요건

`lead`/`scoreReason`이 화면에 노출되려면 반드시 `hasSlots = true`여야 한다.

```
hasSlots = isNewgradReport
           && explanation.available === true
           && [lead, criteria, scoreReason, liftOrLimit].filter(Boolean).length >= 2
```

따라서 케이스별 explanation 빌더가 `lead` + 추가 1개 이상의 슬롯을 동시에 채워야 한다.
이를 보장하는 조건이 `minimumVisibleSlotRule` 계약으로 각 fixture의 `uiInsightExpected`에 포함됨.

### 정정된 fixture 파일

`scripts/regression/newgrad-core-invariant-cases.js` — 7개 케이스 전체 `uiInsightExpected` 구조 교체:
- `targetLayer`: `"UI_VISIBLE_EXPLANATION"` → `"UI_VISIBLE_AXIS_EXPLANATION"`
- `preferredVisibleSlot`: `"caseInsight"` → `"axisExplanation"`
- `headlineShouldMention` / `bodyShouldMention` → `visibleSurfaces[].shouldMention` (surfacePath + role 명시)
- `minimumVisibleSlotRule` 추가

---

*조사 완료 — 런타임/UI/scoring 코드 수정 없음*
*생성: 2026-04-29 | 정정: 2026-04-30 | 근거 파일: TransitionLiteResult.jsx, buildNewgradAxisPack.js, axisExplanationRegistry.js*
