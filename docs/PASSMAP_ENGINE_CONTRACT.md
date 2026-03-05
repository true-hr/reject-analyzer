# PASSMAP Engine Contract (Immutable Rules) v0

> 목적: “불변 규칙(계약)”을 코드 기준으로 못 박아 UI/테스트/엔진이 서로 다른 길을 보지 않게 한다.
> 범위: 지금 당장 확정 가능한 SSOT 3개 + 재발 방지 규칙(팩트 기반) 2개.

---
PASSMAP Risk ID prefix는 layer가 아니다.

실제 layer 값은 다음 5개만 사용한다.

gate
must
domain
exp
preferred

## 1) SSOT (Single Source of Truth)

### SSOT-1) 최종 점수
SSOT: decisionPack.decisionScore.capped  
근거: decisionScore = { raw, capped, cap, ... } (1697~1713)

### SSOT-2) cap
SSOT: decisionPack.decisionScore.cap  
근거: cap: (typeof __capFinal === "number") ? __capFinal : null (1700)

### SSOT-3) grayZone
SSOT: decisionPack.decisionScore.meta.grayZone  
근거: meta: { ... grayZone: __grayZoneMeta ... } (1705~1711) + “표준 경로” 주석(1617)

---

## 2) 재발 방지 규칙 (팩트 기반)

### R-1) grayZoneMeta try/catch 특성 (silent null 가능)
- grayZoneMeta는 try/catch 안에서만 채워지고, 실패해도 조용히 null 유지 가능  
  - let __grayZoneMeta = null; (1482)  
  - try { __grayZoneMeta = {...} } catch { } (1618~1629)

따라서 정책 테스트/디버그 규칙:
- “grayZone 관련 try/catch는 global snapshot 없이 빈 catch 금지”
- “grayZoneMeta null은 ‘미진입/에러’ 둘 다 가능 → 테스트에서 반드시 케이스 분리”

### R-2) capFinal은 gate id override 우선 (특히 SENIORITY)
- capFinal은 gate id에 따라 override됨  
  - if (id === "SENIORITY__UNDER_MIN_YEARS") { ... return __cap; } (1497~1634)
- grayZone에서 hits 기반 cap 60/65 완화  
  - (1615~1616)

따라서:
- “cap은 maxGateP만으로 결정” 같은 단순 규칙은 틀림
- cap 정책 테스트는 “id override 우선”을 포함해야 함

---

## CONTRACT-RR-1) riskResults는 정규화된 리스트여야 한다

SSOT 생성 흐름:

evalRiskProfiles(...)  
→ __normalizeRiskResults(riskResults)

따라서 UI / 다른 모듈은  
정규화 전 list를 직접 사용하면 안 된다.

---

## CONTRACT-RR-2) Gate 리스크는 “gate 스펙”을 강제한다

__normalizeRiskItem()이 gate로 판정되면 다음을 강제한다.

layer: "gate"  
group: "gates"  
gateTriggered: true  

id: __normalizeGateId(id) 적용

priority:

기존 priority가 없거나 0이면  
score 기반 derivedPriority = round(score01 * 100)

score는 0~1 / 0~100 혼재를 score01로 정규화

severityTier:

priority >= 85 → "S"  
그 외 → "A"

결론:

gate 최소 계약 키

{id, group, layer, priority, gateTriggered}

---

## CONTRACT-RR-3) explain 표준형 (UI crash 방지)

__normalizeRiskResults()는 모든 risk에 대해

title 보정:

title 없으면 explain.title → 없으면 id

explain 구조 강제

explain.why = []  
explain.signals = []  
explain.action = []  
explain.counter = []

결론:

UI는 explain 배열 존재를 가정해도 된다.

---

## CONTRACT-RR-4) meta merge 규칙

normalize 과정에서

원본 meta = om  
normalize meta = nm

결과

meta: { ...om, ...nm }

normalize meta가 우선.

결론:

meta는 append-only 확장 가능.

---

## Risk Item 최소 계약 키

id: string  

layer: string  

priority: number  

title: string  

explain:  
{
why:[],
signals:[],
action:[],
counter:[]
}

meta?: object

주의

evidence / score / group은 존재할 수 있으나  
최소 계약 키는 아니다.

---

# Risk Layer Contract (PASSMAP 표준 레이어)

PASSMAP 리스크 레이어 표준값은 아래 5개로 고정한다.

SSOT는 layer 값이며 group은 보조 식별자이다.

## gate

컷 조건 또는 점수 상한(cap)에 영향을 줄 수 있는 리스크

normalize 단계에서 아래를 강제한다

layer: "gate"  
group: "gates"  
gateTriggered: true  

priority는 score 기반으로 자동 산정될 수 있다.

---

## must

필수 요건 누락 리스크

실제 gate가 없을 경우  
cap 계산용 pseudo gate로 승격될 수 있다.

예

PSEUDO_GATE__*

---

## domain

도메인 적합성 리스크

예

DOMAIN__MISMATCH  
DOMAIN__KEYWORD_SPARSE

cap에는 직접 영향을 주지 않는다.

---

## exp

경력 깊이 / 레벨 리스크

예

EXP__SCOPE__TOO_SHALLOW  
EXP__LEADERSHIP__MISSING

cap에는 영향을 주지 않는다.

---

## preferred

긍정 요인

우대 조건 / 가점 요소

낮은 score 또는 priority로 기록된다.

---

# CONTRACT-TOP3-1 Risk 정렬 규칙

정렬 위치

src/lib/decision/index.js

evalRiskProfiles() 내부

정렬 규칙

priority 내림차순  
priority 동일 시 score 내림차순

즉

priority가 사실상 Top3 결정 요소이며  
score는 동률 타이브레이커 역할을 한다.

gate는 normalize 과정에서 score 기반 priority가 생성되므로  
Top3에 올라올 가능성이 높다.

---

# CONTRACT-SIMPLE-1 simple mode risk 제한

simple 모드에서는 non-gate risk를 최대 3개까지만 유지한다.

동작 위치

buildDecisionPack()

처리 과정

__gates = riskResults.filter(gate)

__nonGateSorted = riskResults
.filter(!gate)
.slice(0,3)

최종

riskResults =
__normalizeRiskResults([
...__gates,
...__nonGateSorted
])

즉

simple 모드 결과는

gate는 유지되고  
non-gate는 최대 3개만 유지된다.

---

# CONTRACT-SIMPLE-2 simple mode gate 보장

simple 모드에서 gate가 하나도 없으면

buildDecisionPack이 detail 모드로 gate만 재평가한다.

동작 위치

index.js 1035~1069

처리

__stateForGate.mode = "detail"

evalRiskProfiles() 재호출

결과에서 layer === "gate"만 추출하여 riskResults에 추가

즉

simple 모드에서도 gate는 반드시 존재해야 한다.

---

# UI Top3 정책

엔진은 gate를 제거하지 않는다.

simple 모드에서도 gate는 유지 또는 재평가된다.

따라서

UI에서 Top3에서 gate를 제외하고 싶다면  
UI 로직에서 필터링해야 한다.

엔진 계약은

"gate를 유지하는 것"이다.

---

# CONTRACT-TOP3-UI Top3 선정 규칙

Top3는 buildSimulationViewModel.js에서 생성된다.

정렬 기준

sorted = [...riskResults].sort((a,b) => priority(b) - priority(a))

즉

priority 내림차순 정렬

priority 동일 시 기존 순서 유지

---

## Top3 구성 규칙

sorted 리스트에서

__gates = sorted.filter(__isGate)

__normals = sorted.filter(!__isGate)

최종 Top3

Top3 =
(gate 최대 3개 우선)
+
(부족분 normal로 채움)

즉

Top3 = gate 우선 최대 3개 + normal

단

전체는 priority 순서를 유지한다.

---

# CONTRACT-GATE-DETECTION gate 판정 규칙

__isGate(r) 조건

다음 중 하나면 gate로 인식한다

layer === "gate"

또는

id.startsWith("GATE__")

---

## gate 인식 실패 주요 원인

다음 케이스는 gate로 인식되지 않는다.

CASE-A

layer 값 오류

예

"gates"
"Gate"
undefined

또는 raw.layer에만 존재하고
risk.layer에는 없는 경우

CASE-B

priority가 0 또는 없음

gate 내부 정렬도 priority 기반이므로
priority가 없으면 gate 내부에서도 뒤로 밀릴 수 있다.

---

# CONTRACT-UI-MINIFY App.jsx Top3 미니화

App.jsx에서 Top3 표시를 위해 risk를 축약(minify)한다.

축약 위치

App.jsx 3033~3049

축약 시 유지되는 필드

id
group
layer
priority
score
gateTriggered

explain은

{ title }

형태로 축약된다.

---

## 계약

Top3 미니화는

gate 판정
priority 정렬

에 필요한 필드를 제거하지 않는다.

즉

UI 미니화는 Top3 선정 로직에 영향을 주지 않는다.

---

# CONTRACT-TOP3-UI Top3 선정 규칙

Top3는 buildSimulationViewModel.js에서 생성된다.

정렬 기준

sorted = [...riskResults].sort((a,b) => priority(b) - priority(a))

즉

priority 내림차순 정렬

priority 동일 시 기존 순서 유지

---

## Top3 구성 규칙

sorted 리스트에서

__gates = sorted.filter(__isGate)

__normals = sorted.filter(!__isGate)

최종 Top3

Top3 =
(gate 최대 3개 우선)
+
(부족분 normal로 채움)

즉

Top3 = gate 우선 최대 3개 + normal

단

전체는 priority 순서를 유지한다.

---

# CONTRACT-GATE-DETECTION gate 판정 규칙

__isGate(r) 조건

다음 중 하나면 gate로 인식한다

layer === "gate"

또는

id.startsWith("GATE__")

---

## gate 인식 실패 주요 원인

다음 케이스는 gate로 인식되지 않는다.

CASE-A

layer 값 오류

예

"gates"
"Gate"
undefined

또는 raw.layer에만 존재하고
risk.layer에는 없는 경우

CASE-B

priority가 0 또는 없음

gate 내부 정렬도 priority 기반이므로
priority가 없으면 gate 내부에서도 뒤로 밀릴 수 있다.

---

# CONTRACT-UI-MINIFY App.jsx Top3 미니화

App.jsx에서 Top3 표시를 위해 risk를 축약(minify)한다.

축약 위치

App.jsx 3033~3049

축약 시 유지되는 필드

id
group
layer
priority
score
gateTriggered

explain은

{ title }

형태로 축약된다.

---

## 계약

Top3 미니화는

gate 판정
priority 정렬

에 필요한 필드를 제거하지 않는다.

즉

UI 미니화는 Top3 선정 로직에 영향을 주지 않는다.