# Experienced Industry Comparison Panel Design

## 1. 문서 목적

이 문서는 experienced 직무산업 분석의 industry comparison table에서  
각 row가 왜 서로 다른 panel 구조를 갖게 되었는지,  
그리고 앞으로 어떤 기준으로 확장/보수해야 하는지를 정리하기 위한 설계 문서다.

이번 문서는 아래 4개 row를 다룬다.

- 고객 구조 (`industry_customer_structure`)
- 구매/도입 방식 (`industry_buying_motion`)
- 의사결정 구조 (`industry_decision_structure`)
- 운영 맥락 (`industry_operating_context`)

핵심 원칙은 단순하다.

> 모든 row에 같은 형태의 펼쳐보기 패널을 붙이지 않는다.  
> row source의 성격에 따라 panel contract를 다르게 설계한다.

---

## 2. 공통 전제

### 2-1. row summary와 panel detail은 같은 문제가 아니다

industry comparison table의 row summary는 비교표 가독성을 위해 짧게 잘린다.  
반면 panel detail은 사용자가 비교 의미를 더 깊게 이해하도록 돕는 surface다.

따라서 row와 panel이 완전히 같은 모양일 필요는 없다.  
다만 아래는 반드시 지켜야 한다.

- row와 panel이 서로 다른 source를 섞어 쓰면 안 된다.
- row와 panel의 관계가 사용자 입장에서 납득 가능해야 한다.
- panel이 더 자세한 설명이 아니라 다른 source의 재탕이 되면 안 된다.

---

## 3. 항목별 설계 요약

### 3-1. 고객 구조 (`industry_customer_structure`)

#### source
- `industry.customerMarket`

#### row summary 성격
- 단일 source를 짧은 label로 보여주는 형태
- 예: B2B / B2C / B2G / mixed

#### panel 설계 방향
- 단순 panel형
- `고객 구조 읽는 법`
- 현재 산업 / 지원 산업 각각에 대해
  - 짧은 display label
  - 과장 없는 short description
만 보여준다.

#### 왜 이렇게 설계했는가
고객 구조는 source가 사실상 단일값이라,  
복잡하게 구조화하는 것보다 누가 주요 고객인가를 바로 읽게 하는 편이 낫다.

#### 하면 안 되는 것
- 고객 구조를 의사결정 구조처럼 3블록으로 과설계하지 말 것
- customerMarket 외의 target-only traits 문구를 끌어오지 말 것
- 깊은 맞춤형처럼 과장하지 말 것

#### 다음 패치 시 확인할 것
- summary/detail 범위가 사실상 일치하는지
- short description이 source를 과장하지 않는지

---

### 3-2. 구매/도입 방식 (`industry_buying_motion`)

#### source
- `industry.buyingMotion`

#### row summary 성격
- `formatComparisonValue(..., { maxItems: 2 })`
- 앞 2개 대표값만 비교표에 노출

#### panel 설계 방향
- taxonomy list형
- `구매/도입 방식 읽는 법`
- 현재 산업 / 지원 산업 각각에 대해 buying motion 항목을 보여준다.

#### 핵심 리스크
구매/도입 방식은 summary/detail contract mismatch가 생기기 쉽다.

예:
- row에는 `제안형 / 캠페인형`만 보임
- panel에는 `반복구매형 / 관계형`까지 함께 노출됨

이 경우 사용자는
위에 없는 값이 왜 아래에 나오지?
라고 느끼게 된다.

#### 설계 원칙
- row는 대표값 요약
- panel은 detail surface
이 구조 자체는 허용 가능하다.

하지만 반드시 아래 중 하나를 택해야 한다.

1. panel도 row와 같은 범위만 보여준다
2. panel 안에서 `대표 방식`과 `추가로 함께 나타나는 방식`을 분리한다

현재 기준 권장 방향:
- row summary를 유지
- panel에서 대표 항목과 추가 항목을 구분하는 방향 검토

#### 하면 안 되는 것
- summary와 panel이 왜 다른지 아무 설명 없이 전체 raw를 동일 위상으로 노출
- buyingMotion 외의 다른 source를 섞어 의미를 풍부하게 보이게 만들기

#### 다음 패치 시 확인할 것
- row summary에 보인 항목과 panel 항목의 관계가 사용자에게 납득되는지
- 추가 항목이 있다면 별도 구분이 필요한지

---

### 3-3. 의사결정 구조 (`industry_decision_structure`)

#### source
- `industry.decisionStructure`

#### 기존 문제
의사결정 구조 raw는 단일 taxonomy가 아니다.  
한 문장 안에 아래 요소가 함께 섞여 들어온다.

- 검토 주체
- 승인 구조
- 판단 기준
- 산업 특성 문장

기존 flat item card 방식은 이 raw를 그대로 나열해서  
사용자가 누가 / 어떻게 / 무엇을 보고를 읽기 어렵게 만들었다.

#### 현재 설계 방향
의사결정 구조는 taxonomy list형이 아니라 3블록 구조형으로 설계한다.

블록:
1. 주요 검토 주체
2. 최종 승인 구조
3. 실제 판단 기준

#### producer contract
`decisionStructurePanel.current` / `target`는 아래 shape를 갖는다.

- `reviewers[]`
- `approvalFlow[]`
- `decisionCriteria[]`
- `unmatched[]`

#### 분류 전략
혼합형 사용:
- 기본 keyword helper
- local override rule
- 분류 애매한 문장은 `unmatched`

#### 왜 이렇게 설계했는가
의사결정 구조는 같은 종류 항목을 나열하는 패널로는 읽히지 않는다.  
반드시 성격이 다른 정보를 먼저 분리해줘야 사용자가 이해할 수 있다.

#### 하면 안 되는 것
- 다시 flat item dump로 회귀
- approvalFlow / criteria / reviewers를 한 리스트에 섞기
- 애매한 문장을 억지로 눈에 보이는 블록에 집어넣기

#### 다음 패치 시 확인할 것
- mixed raw가 어느 bucket으로 들어가는지
- override rule이 과도하게 늘어나는지
- row summary는 일단 유지하고, panel 품질이 안정화된 후에만 summary 수정 검토

---

### 3-4. 운영 맥락 (`industry_operating_context`)

#### source
- `industry.coreContext`

#### row summary 성격
- `formatComparisonValue(..., { maxItems: 2 })`
- coreContext 앞 2문장을 비교표에 그대로 이어 붙임

#### 중요한 차이점
운영 맥락은 다른 row보다 중복 위험이 크다.

겹칠 수 있는 surface:
- Axis 2 explanation
- `targetIndustryRead.summary`
- `targetIndustryRead.bullets`
- `industryTraitsAsset.operatingLanguage`
- `industryTraitsAsset.whyIndustryMatters`
- `industryTraitsAsset.evaluationCriteria`

#### 운영 맥락 panel 설계 원칙
운영 맥락 panel은 반드시 `coreContext only`로 간다.  
다른 source를 섞지 않는다.

#### 권장 구조
운영 맥락은 3블록 요약형이 맞다.

1. 일의 리듬
2. 핵심 제약
3. 실무에서 먼저 챙길 것

예시 shape:
- `workRhythm[]`
- `constraints[]`
- `practicalFocus[]`
- `unmatched[]`

#### 왜 이렇게 설계해야 하는가
운영 맥락은 raw를 그대로 펴면
- 추상적이고
- 길고
- 다른 설명 surface와 중복되기 쉽다

따라서 비교 가능한 짧은 실무형 블록으로 재분류해야 한다.

#### 하면 안 되는 것
- `targetIndustryRead`를 operating panel source로 재사용
- `industryTraitsAsset` 문구를 operating panel에 직접 노출
- Axis 2 explanation 문장을 operating panel에 복사

#### 다음 패치 시 확인할 것
- panel source가 정말 `coreContext only`인지
- 3블록이 `일의 리듬 / 핵심 제약 / 실무 우선 기준`으로 안정적으로 읽히는지
- traits 문구와 직접 중복되는 문장이 없는지

---

## 4. 항목별 설계 철학 한 줄 요약

- 고객 구조: **단일 source라서 단순하게**
- 구매/도입 방식: **taxonomy는 좋지만 summary/detail 계약 관리 필요**
- 의사결정 구조: **raw가 섞여 있으므로 3블록 구조로 분해**
- 운영 맥락: **coreContext only + 중복 금지 + 3블록 요약형**

---

## 5. 앞으로의 작업 우선순위

1. 각 row의 source 성격을 먼저 확인한다.
2. panel을 만들 때 source를 섞지 않는다.
3. row summary와 panel detail의 관계를 사용자 입장에서 납득 가능하게 만든다.
4. mixed raw는 억지 분류하지 않고 unmatched를 허용한다.
5. operating context는 traits/read/explanation과 중복 금지 규칙을 먼저 적용한다.

---

## 6. 실제 owner 정리

### comparison row producer
- `src/lib/transitionLite/buildTransitionLiteResult.js`
- `buildIndustryContextComparisonTable(...)`

### customer / buying / decision / operating panel producer
- `src/lib/transitionLite/buildTransitionLiteResult.js`

### comparison table consumer
- `src/components/report/TransitionLiteResult.jsx`

### target industry read / traits / explanation owners
- `src/data/transitionLite/targetReadAdapter.js`
- `src/data/transitionLite/axisExplanationRegistry.js`
- `src/lib/transitionLite/buildTransitionLiteResult.js` 내부 `getIndustryTraitsAsset(...)`

---

## 7. 최종 메모

이번 설계의 핵심은  
모든 row를 똑같은 펼쳐보기 패널로 만들지 않는다는 점이다.

source가 단순하면 단순한 panel이 맞고,  
source가 섞여 있으면 먼저 구조를 나눠야 하며,  
중복 위험이 큰 row는 source 경계를 더 엄격하게 관리해야 한다.

industry comparison panel은 UI 통일보다  
**source 성격에 맞는 contract 설계**가 우선이다.
