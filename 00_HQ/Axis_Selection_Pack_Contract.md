# Axis Selection Pack Contract
작성일: 2026-04-08
버전: v1.0
성격: SSOT / intermediate output contract / Newgrad axis explanation selection pack

---

## 1. 문서 목적

이 문서는 Newgrad 5축 explanation 생성 과정에서,
selector가 evidence를 선출한 뒤 assembler / builder에 전달해야 하는
중간 산출물(selection pack)의 출력 계약을 정의한다.

본 문서의 목적은 아래 4가지다.

1. selector 결과를 축별로 동일한 shape로 표준화한다.
2. score / explanation / QA가 같은 evidence selection 결과를 공유하게 만든다.
3. explanation 4슬롯 조립 전에 필요한 핵심 판단 결과를 구조적으로 보존한다.
4. builder / registry / fallback 간 해석 drift를 줄인다.

본 문서는 selection rule 자체를 다시 정의하지 않는다.
무엇을 뽑을지는 `Axis_Evidence_Selection_Rules.md`를 따른다.

본 문서는 점수 1~5의 의미를 다시 정의하지 않는다.
band 의미는 `Axis_Score_Anchor_Table.md`를 따른다.

---

## 2. 참조 문서

- 00_HQ/Axis_Score_Anchor_Table.md
- 00_HQ/Axis_Evidence_Selection_Rules.md
- 00_HQ/Newgrad_Axis_Explanation_Assembly_Contract.md
- 00_HQ/Explanation_Ready_Evidence_Schema.md
- 00_HQ/Axis_Explanation_Output_Contract.md
- 00_HQ/Axis_Explanation_QA_Checklist.md

---

## 3. 문서 범위 / 비범위

### 다루는 범위
- selection pack top-level shape
- evidence item shape
- field required / optional 규칙
- weak-only / self-report-only 상태 표현 방식
- overlap guard 기록 방식
- assembler 연결용 최소 필드
- selector confidence 표현 규칙

### 다루지 않는 범위
- score 계산식
- band threshold 정의
- selector 우선순위 규칙 자체
- 최종 UI 카피 문장
- fallback 제거 결정

---

## 4. selection pack의 역할

selection pack은 explanation의 최종 문장이 아니다.

selection pack은 아래 사이를 연결하는 intermediate layer다.

- scorer / evidence reader / selector
- explanation assembler / builder / registry

즉 selection pack은
“현재 축에서 어떤 근거가 positive / limiting / secondary로 선택되었는가”
를 손실 없이 전달하는 구조여야 한다.

---

## 5. selection pack top-level contract

각 축은 최소 아래 shape의 selection pack을 산출해야 한다.

```ts
type AxisSelectionPack = {
  axisKey: string
  axisVersion?: string

  primaryPositiveEvidence: SelectedEvidence | null
  primaryLimitingEvidence: SelectedEvidence | null
  secondaryEvidenceList: SelectedEvidence[]

  selectorConfidence: "high" | "medium" | "low"
  selectionMode: "standard" | "weak_only" | "self_report_limited" | "no_strong_evidence"

  primaryEvidenceType: string | null
  limitingEvidenceType: string | null

  weakOnly: boolean
  selfReportOnly: boolean
  noStrongObservedEvidence: boolean

  overlapGuardNotes: string[]
  selectionSummary: string | null

  assemblyHints?: AxisSelectionAssemblyHints
}
6. top-level field 정의
6-1. axisKey

현재 축 식별자.
예: axis1, axis2, axis3, axis4, axis5

필수값.

6-2. axisVersion

selection pack 생성 기준 버전.
선택값이지만 가능하면 항상 포함 권장.

예:

newgrad-selection-pack-v1
newgrad-axis-pack-v2
6-3. primaryPositiveEvidence

현재 축에서
“왜 이 점수까지는 올라왔는가”를 가장 잘 설명하는 대표 evidence 1개.

없을 수 있다.
단, 없을 경우 selectionMode, weakOnly, selectorConfidence가 그 상태를 설명해야 한다.

6-4. primaryLimitingEvidence

현재 축에서
“왜 더 높은 band가 아닌가”를 가장 잘 설명하는 대표 limiting evidence 1개.

없을 수 있다.
다만 Anchor / Assembly / QA 계약상 limiting이 필요한 구간에서는
null 허용이 아니라 명시적 reason이 필요하다.

6-5. secondaryEvidenceList

primary를 보강하는 evidence 목록.

규칙:

0개 이상 허용
strong primary보다 본질적으로 더 강한 evidence를 secondary에 넣으면 안 된다
동일 의미의 중복 evidence 나열 금지
보통 0~2개 권장, 많아도 3개를 넘기지 않는 방향 권장
6-6. selectorConfidence

현재 selection 결과의 신뢰도.

허용값:

high
medium
low

해석 원칙:

high: observed evidence가 충분하고 primary 선출이 명확함
medium: meaningful evidence는 있으나 일부 간접/보조 신호 의존
low: weak-only 또는 self-report limited 상태
6-7. selectionMode

현재 축의 selection 상태를 한 줄로 나타내는 운영 모드.

허용값:

standard
weak_only
self_report_limited
no_strong_evidence

의미:

standard: 일반적인 primary/limiting/secondary 조립 가능 상태
weak_only: 약한 evidence만 존재
self_report_limited: Axis5 등에서 self-report 중심으로 제한적 조립
no_strong_evidence: Tier A observed evidence 부재
6-8. primaryEvidenceType / limitingEvidenceType

대표 evidence의 source family를 요약한 값.

예:

major
project
internship
contract
certification
self_report
mixed

이 필드는 assembler / QA / debug에서
현재 설명의 핵심 source가 무엇인지 빠르게 확인하는 용도다.

6-9. weakOnly

강한 observed evidence 없이
약한 신호 위주로 selection이 이뤄졌는지 나타낸다.

boolean 필수.

6-10. selfReportOnly

self-report 계열 evidence만으로 selection이 형성되었는지 나타낸다.

boolean 필수.

특히 Axis5에서 중요하다.

6-11. noStrongObservedEvidence

관찰 가능한 strong evidence가 없는 상태인지 나타낸다.

boolean 필수.

weakOnly와 유사하지만 완전히 동일하지 않다.
예:

observed는 있으나 강도가 낮은 경우
inferred signal만 존재하는 경우
를 분리하기 위해 유지한다.
6-12. overlapGuardNotes

동일 source를 여러 축이 사용하더라도
왜 이 축에서 이 방식으로 읽었는지 기록하는 guard 메모.

형식:
문장 배열(string[])

예:

Axis1 used project as role_directness evidence, not industry_context
Axis4 uses stakeholder-facing contact, not workstyle consistency
Axis5 excludes generic teamwork already consumed by Axis4

필수값.
없으면 빈 배열이라도 유지.

6-13. selectionSummary

현재 selection 결과를 내부 요약용으로 1문장 정리한 값.

예:

Direct role-aligned project selected as positive; lack of internship alignment selected as limiting.
Industry context comes mainly from one aligned project; repeated domain exposure is limited.

이 값은 UI 직접 노출용이 아니라
builder / debug / QA 해석 보조용이다.

null 허용.

6-14. assemblyHints

assembler가 4슬롯 조립 시 참고할 수 있는 보조 힌트.

선택값이다.
단, 있으면 아래 contract를 따른다.

7. assembly hints contract
type AxisSelectionAssemblyHints = {
  recommendedLeadMode?: "positive_first" | "balanced" | "limit_first"
  recommendedCriteriaFocus?: string[]
  recommendedLiftOrLimitMode?: "lift" | "limit"
  suppressOverclaim?: boolean
}
필드 의미
recommendedLeadMode
positive_first: positive 중심 lead 권장
balanced: positive/limiting 균형형
limit_first: 약한 evidence 상태에서 제한 중심 lead 권장
recommendedCriteriaFocus
criteria에서 강조할 evidence family 또는 reading lens
예: ["role_directness", "observed_execution"]
recommendedLiftOrLimitMode
assembly contract의 lift/limit 중 어느 쪽이 자연스러운지 힌트 제공
suppressOverclaim
high confidence처럼 과장하지 않도록 억제 플래그
Axis5 self-report only 등에서 특히 중요
8. selected evidence item contract

각 selected evidence는 최소 아래 shape를 따른다.

type SelectedEvidence = {
  sourceType: "major" | "project" | "internship" | "contract" | "certification" | "self_report" | "mixed"
  sourceId?: string | null

  signalType: string
  axisUsage: string

  strengthTier: "A" | "B" | "C"
  observed: boolean

  directness?: "direct" | "adjacent" | "weak" | "none" | null
  specificity?: "high" | "medium" | "low" | null

  summary: string
  limitingPoint?: string | null

  supportRole?: "positive" | "limiting" | "secondary"
  confidence?: "high" | "medium" | "low"

  tags?: string[]
}
9. selected evidence field 정의
9-1. sourceType

evidence의 원천 source 분류.

필수값.

허용값:

major
project
internship
contract
certification
self_report
mixed
9-2. sourceId

가능하면 원본 evidence item과 연결할 수 있는 id 또는 key.
선택값.

예:

project_1
internship_2
major_subcategory_marketing
9-3. signalType

현재 evidence가 어떤 신호를 대표하는지 나타낸다.

예:

role_directness
industry_context
ownership_depth
stakeholder_contact
workstyle_alignment

필수값.

9-4. axisUsage

같은 source를 여러 축이 쓰더라도
이 축에서 무엇으로 읽었는지 분명히 적는 값.

예:

role_directness
industry_context
execution_depth
stakeholder_interaction
behavior_consistency

필수값.

9-5. strengthTier

Evidence Schema / Selection Rules 기준의 강도 tier.

필수값.

A
B
C
9-6. observed

직접 관찰 가능한 evidence인지 여부.

필수값.

true
false

예:

project / internship role evidence → true 가능
self-report only → false
9-7. directness

현재 축 질문에 대한 직접성 수준.

선택값.
특히 Axis1, Axis2에서 중요.

허용값:

direct
adjacent
weak
none
9-8. specificity

evidence의 구체성 수준.

선택값.

허용값:

high
medium
low

예:

구체 과업/산출물/상대방/맥락이 있으면 high
포괄적 진술만 있으면 low
9-9. summary

해당 evidence를 1문장으로 요약한 내부 설명.

필수값.

예:

Target role-aligned project shows direct task overlap with planner responsibilities.
Only one adjacent industry-linked certification is present without applied context.
9-10. limitingPoint

이 evidence가 왜 상위 band를 막는지, 또는 어떤 한계가 있는지 나타내는 보조 필드.

선택값.

예:

No repeated alignment across internship evidence
Industry exposure is single-path only
Observed behavior support is missing
9-11. supportRole

이 evidence가 pack 내에서 맡는 역할.

허용값:

positive
limiting
secondary

선택값이지만 가능하면 항상 기입 권장.

9-12. confidence

개별 evidence 수준의 신뢰도.

허용값:

high
medium
low

top-level selectorConfidence와 다를 수 있다.
예:

positive evidence는 medium
pack 전체 confidence는 low
9-13. tags

디버그 / QA / filtering용 태그 배열.

예:

["direct_project"]
["self_report_only"]
["external_stakeholder"]

선택값.

10. field requiredness rules
10-1. 항상 필수

top-level:

axisKey
primaryPositiveEvidence
primaryLimitingEvidence
secondaryEvidenceList
selectorConfidence
selectionMode
weakOnly
selfReportOnly
noStrongObservedEvidence
overlapGuardNotes

selected evidence:

sourceType
signalType
axisUsage
strengthTier
observed
summary
10-2. 조건부 필수
primaryEvidenceType:
primaryPositiveEvidence가 있으면 기입 권장
limitingEvidenceType:
primaryLimitingEvidence가 있으면 기입 권장
limitingPoint:
limiting evidence면 가능하면 기입
assemblyHints:
weak-only / self-report-limited / limit-first 조립 필요 시 강하게 권장
11. Axis5 special contract

Axis5는 self-report 과신 방지를 위해 별도 계약을 가진다.

11-1. selfReportOnly true인 경우

아래를 기본으로 한다.

selectionMode = "self_report_limited" 또는 "weak_only"
selectorConfidence = "low" 권장
noStrongObservedEvidence = true
assemblyHints.suppressOverclaim = true
recommendedLiftOrLimitMode = "limit" 우선
11-2. primary positive 제한

self-report only 상태에서는
primaryPositiveEvidence를 완전한 strong fit 근거처럼 다루면 안 된다.

즉,

방향성
가능성
부분 정렬
수준 표현만 허용한다.
11-3. limiting 우선

Axis5 self-report only에서는
primaryLimitingEvidence가 비어 있으면 안 된다.

핵심 limiting은 보통 아래 중 하나다.

observed behavior support 부족
repeated pattern 부족
experience consistency 부족
12. overlap guard contract

동일 source 재사용은 허용되지만,
selection pack은 왜 다르게 읽었는지 기록해야 한다.

예시
Axis1: project_1을 role_directness로 사용
Axis2: 같은 project_1을 industry_context로 사용
Axis3: 같은 project_1을 execution_depth로 사용

이 경우 overlapGuardNotes에는 최소 아래 중 하나가 남아야 한다.

어떤 reading lens로 소비했는가
다른 축이 이미 소비한 lens는 무엇인가
무엇을 의도적으로 제외했는가
13. assembler 연결 규칙

selection pack은 explanation 4슬롯에 아래처럼 연결된다.

lead
primaryPositiveEvidence 중심
약한 상태에서는 assemblyHints.recommendedLeadMode 반영 가능
criteria
secondaryEvidenceList
primary evidence family 요약
current case에서 실제로 본 evidence 종류
scoreReason
primaryPositiveEvidence
primaryLimitingEvidence
positive + limiting pair 유지
liftOrLimit
primaryLimitingEvidence의 gap
다음 band 도약 조건
recommendedLiftOrLimitMode 참고

selection pack은 직접 최종 문장을 생성하지 않는다.
조립용 구조화 입력만 제공한다.

14. invalid pack 사례

아래는 invalid로 본다.

primary보다 secondary가 본질적으로 더 강함
primaryPositiveEvidence는 self-report only인데 confidence가 high
Axis4 pack이 stakeholder 없이 teamwork generic만으로 strong 판단
Axis1 positive가 사실상 industry alignment만 설명함
Axis3 positive가 direct fit만 있고 ownership/outcome가 없음
primaryLimitingEvidence가 필요한 band인데 null이며 이유도 없음
overlapGuardNotes가 비어 있고, 동일 source 중복 사용 흔적이 있음
15. QA 체크포인트

selection pack QA에서는 최소 아래를 본다.

top-level 필수 필드 누락 여부
primary / limiting / secondary 배치 적절성
sourceType / axisUsage 정합성
selfReportOnly / weakOnly 상태 플래그 정확성
overlapGuardNotes 존재 여부
scoreReason pair 조립 가능 여부
assembler가 과장 없이 조립 가능한 상태인지 여부
16. 최종 원칙 요약
selection pack은 문장이 아니라 조립용 intermediate contract다.
무엇을 뽑을지는 Selection Rules가 정의하고,
어떻게 넘길지는 본 문서가 정의한다.
같은 source를 여러 축이 쓰더라도 axisUsage는 달라야 한다.
primary / limiting / secondary는 구조적으로 분리되어야 한다.
Axis5 self-report only는 반드시 제한 모드로 다뤄야 한다.
selection pack은 explanation 4슬롯 조립을 가능하게 해야 하며,
과장/중복/축간 혼선을 줄이는 방향으로 유지한다.