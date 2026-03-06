[역할]
너는 PASSMAP 코드베이스에서 leadership 판단 로직을 실제 채용 판단 방식에 맞게 확장하는 패치 엔지니어다.

이번 작업은 기존 leadershipLevel 신호를 기반으로
"역할 스코프 mismatch + 회사 규모 보정"을 적용하는 로직을 추가하는 것이다.

중요: 기존 엔진을 리팩토링하지 말고 append-only 방식으로 확장한다.

---

[현재 상태]

state.career.leadershipLevel 값:

individual
manager
executive

현재 일부 risk 파일에서 leadershipLevel을 숫자로 매핑해 사용 중이다.

예:

({ individual: 1, manager: 3, executive: 5 })[ctx?.state?.career?.leadershipLevel] ?? 0

하지만 현재 엔진은 아래 판단을 하지 않는다.

1️⃣ leadershipLevel vs targetRole mismatch  
2️⃣ 회사 규모 보정(scale adjustment)

즉 실제 채용 판단에 중요한 아래 로직이 빠져 있다.

---

[추가할 판단 로직]

Leadership 판단은 아래 3개의 축을 동시에 본다.

leadershipLevel
vs
targetRole
vs
companyScale

targetRole은 아래 기준으로 해석한다.

individual
manager

companyScale은 아래 값 중 하나라고 가정한다.

startup
small
mid
large

---

[Scale 비교 규칙]

scaleUpgrade
small → mid
small → large
mid → large

scaleDowngrade
large → mid
large → small
mid → small

scaleSimilar
그 외

---

[Leadership 판단 케이스]

CASE L1
individual → individual
risk = none

CASE L2
individual → manager
risk = leadership_gap

CASE L3
manager → manager
risk = none

CASE L4
manager → individual

scaleUpgrade
risk = low

scaleSimilar
risk = medium

scaleDowngrade
risk = high

CASE L5
executive → individual
risk = overqualified

CASE L6
executive → manager
risk = scope_mismatch

---

[패치 전략]

절대 기존 riskProfiles를 대규모 수정하지 말 것.

새로운 helper 로직을 추가해서
riskProfiles에서 호출하는 방식으로 구현한다.

예시 구조:

src/lib/decision/leadership/

파일 추가:

leadershipRiskEvaluator.js

---

[leadershipRiskEvaluator.js 기능]

export function evaluateLeadershipRisk(ctx)

입력:

ctx.state.career.leadershipLevel
ctx.objective.targetRole
ctx.objective.companyScaleCurrent
ctx.objective.companyScaleTarget

출력:

{
  riskLevel: "none" | "low" | "medium" | "high",
  type: "leadership_gap" | "scope_mismatch" | "overqualified" | null
}

---

[구현 요구]

1️⃣ scale 비교 helper 추가

function compareScale(current, target)

return

upgrade
downgrade
similar

---

2️⃣ leadership mismatch 판단

function computeLeadershipRisk(...)

---

3️⃣ 결과를 아래 형식으로 반환

{
 riskLevel,
 type
}

---

[엔진 연결]

다음 위치에서 호출 가능하도록 설계

ctx.analysis.signals

또는

ctx.analysis.leadershipRisk

기존 score 계산은 직접 수정하지 말고
context signal 형태로 먼저 추가한다.

---

[절대 원칙]

- append-only
- 기존 analyzer 구조 변경 금지
- decisionScore 계산 변경 금지
- 기존 riskProfiles 로직 수정 최소화
- 새로운 helper 파일 추가 방식 사용

---

[출력 형식]

1️⃣ 수정 분류  
안전 패치

2️⃣ 영향 파일

새 파일
src/lib/decision/leadership/leadershipRiskEvaluator.js

기존 연결 파일 (필요 시)
최대 2개

3️⃣ 정확한 삽입 위치

파일 경로 + 함수 앵커 기준

4️⃣ 붙여넣기 가능한 최종 코드

diff 형식 금지

5️⃣ 테스트 방법

PASSMAP에서 아래 케이스 테스트

individual → manager
manager → individual (scaleUpgrade)
manager → individual (scaleDowngrade)
executive → individual

각 케이스에서 ctx.analysis.leadershipRisk 결과 확인