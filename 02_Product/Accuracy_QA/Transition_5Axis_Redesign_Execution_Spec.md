# Transition 5-Axis Radar Redesign Execution Spec

## 목적
- PASSMAP 전환 분석 5축 레이더를 copy 수정 문제가 아니라 producer-side scoring redesign 과제로 다룬다.
- 다음 패치 라운드에서 축별 signal 설계, raw score 설계, band 검토, QA를 순차적으로 수행할 수 있도록 실행 계약을 잠근다.

## 문제 재정의
- 현재 5축은 동일한 종류의 축이 아니다.
- 축별 basis가 서로 다르다.
  - 1축: job ontology distance + family adjacency
  - 2축: industry registry distance + sector/subSector relation
  - 3축: responsibility profile rank gap
  - 4축: customerMarket type flip
  - 5축: role weight profile shift
- 따라서 visible naming을 조금 다듬는 것만으로는 사용자가 이해하는 축 contract와 엔진 contract가 일치하지 않는다.
- 이번 재설계는 label rewrite보다 `무엇을 비교하고 어떤 상태를 1~5로 볼지`를 재정의하는 작업이다.

## Phase A. 축 정의 고정
각 축은 패치 전에 아래 4개를 먼저 잠근다.

### 1축
- 무엇을 측정하는가: 현재 직무와 목표 직무의 핵심 업무/산출물/문제 구조 유사성
- 무엇을 측정하지 않는가: taxonomy 거리 자체, 산업 맥락, 고객군, responsibility level 자체
- 어떤 signal을 쓸 것인가:
  - `job ontology families[*].strongSignals`
  - `job ontology families[*].mediumSignals`
  - `roles[*].responsibilityHints`
  - `roles[*].levelHints`
  - `summaryTemplate`
  - 필요 시 `jobTransitionReadMetaRegistry`의 `outputType`, `missionType`
- 1~5점 상태를 어떤 상태로 볼 것인가:
  - 1: 핵심 업무/산출물/문제 구조가 거의 겹치지 않음
  - 2: 일부 인접 단서는 있으나 핵심 업무 overlap이 약함
  - 3: 공통 업무가 있으나 중심 업무가 다름
  - 4: 핵심 업무군이 상당 부분 겹침
  - 5: 주요 업무/산출물/문제 구조가 거의 직접 대응됨

### 2축
- 무엇을 측정하는가: 산업 배경과 운영 맥락 유사성
- 무엇을 측정하지 않는가: 책임 레벨, 고객 구조만의 단일 차이, role weight 자체
- 어떤 signal을 쓸 것인가:
  - `industryDistance`
  - `sector`, `subSector`
  - `valueChainPosition`
  - `coreContext`
  - `decisionStructure`
  - `jobInteractionHints`
  - `support_industry_traits`의 `businessStructure`, `customerStructure`, `operatingLanguage`, `problemTypes`
- 1~5점 상태를 어떤 상태로 볼 것인가:
  - 1: 산업 운영 logic가 크게 다름
  - 2: sector 또는 context 일부만 닿음
  - 3: 핵심 맥락 일부 공유
  - 4: 운영 맥락이 대체로 유사
  - 5: 산업 배경과 읽는 언어가 매우 가까움

### 3축
- 무엇을 측정하는가: 책임 수준/범위 유사성
- 무엇을 측정하지 않는가: task content overlap, industry 맥락, customer structure
- 어떤 signal을 쓸 것인가:
  - `JOB_RESPONSIBILITY_PROFILE_MAP`
  - `RESPONSIBILITY_PROFILE_RANK`
  - `responsibilityShift`
  - 보조로 `roles[*].responsibilityHints`, `roles[*].levelHints`
- 1~5점 상태를 어떤 상태로 볼 것인가:
  - 1: 책임 범위 차이가 매우 큼
  - 2: 의미 있는 확장 또는 축소가 필요함
  - 3: 일부 확장/축소가 있으나 연결 가능함
  - 4: 책임 범위가 대체로 맞음
  - 5: 책임 수준과 기대 범위가 거의 직접 대응됨

### 4축
- 무엇을 측정하는가: 상대 고객과 이해관계자 구조 유사성
- 무엇을 측정하지 않는가: industry 전체 맥락, task content 자체, responsibility level
- 어떤 signal을 쓸 것인가:
  - `customerMarket`
  - `decisionStructure`
  - `buyingMotion`
  - `jobInteractionHints`
  - `support_industry_traits.customerStructure`
  - `jobTransitionReadMetaRegistry.stakeholderPrimary`
  - `classifyTransitionReadPatterns().debug.stakeholderSame`
- 1~5점 상태를 어떤 상태로 볼 것인가:
  - 1: 상대 고객/이해관계자 구조가 매우 다름
  - 2: 표면 고객군은 닿아도 실제 설득/상대 구조가 다름
  - 3: 일부 이해관계자 구조가 겹침
  - 4: 상대 고객과 의사결정 상대 구조가 꽤 유사함
  - 5: 고객군/이해관계자/설득 구조가 거의 직접 대응됨

### 5축
- 무엇을 측정하는가: 일하는 방식과 역할 성향 유사성
- 무엇을 측정하지 않는가: customerMarket, industry 맥락, responsibility level 자체
- 어떤 signal을 쓸 것인가:
  - `JOB_ROLE_WEIGHT_PROFILE_MAP`
  - `jobTransitionReadMetaRegistry.missionType`
  - `outputType`
  - `successMetricType`
  - `horizonType`
  - `roles[*].levelHints`
  - `families[*].summaryTemplate`, `boundarySignals`
  - `classifyTransitionReadPatterns()` support patterns
- 1~5점 상태를 어떤 상태로 볼 것인가:
  - 1: 전략/실행/운영/조율 방식이 크게 다름
  - 2: 일부 인접하지만 working mode 차이가 큼
  - 3: 공통 working mode가 있으나 중심이 다름
  - 4: 일하는 방식과 역할 성향이 대체로 유사함
  - 5: mission/output/metric/horizon/role weight가 거의 직접 대응됨

## Phase B. 현재 엔진 조사 고정

### 현재 producer owner
- `src/lib/analysis/buildAxisConnectivityPack.js`
- 현재 visible label owner도 동일 파일이다.
- 현재 narrative owner는 `src/components/report/TransitionLiteResult.jsx`의 `getAxisScoreNarrative()`다.

### 현재 consumer owner
- `src/App.jsx`는 `buildTransitionLiteResult()` 결과를 `TransitionLiteResult`에 전달한다.
- `src/components/report/TransitionLiteResult.jsx`는 `viewModel.axisPack.axes.*`를 render한다.

### 현재 축별 score basis
- 1축: `jobDistance`, `familyDistance`, `sharedFamiliesCount`
- 2축: `industryDistance`, `sameSector`, `sameSubSector`
- 3축: `responsibilityShift`
- 4축: `customerMarketFlip`, `sameSector`
- 5축: `roleWeightShift`

### 현재 fallback 원칙
- input ID가 하나라도 없거나 job/industry lookup이 실패하면 `buildAxisConnectivityPack()`은 `null`을 반환한다.
- 3축 responsibility/5축 role weight는 profile map 누락 시 `similar` fallback을 사용한다.
- consumer는 `band`를 우선 사용해 1~5로 바꾸므로 실질적인 UI 점수는 `displayScore`보다 `band bucket`가 더 직접적인 source다.

## Phase C. 재설계 signal inventory 요약

### 1축 재사용 가능 signal
- `src/data/job/ontology/**`
  - family `strongSignals`, `mediumSignals`, `boundarySignals`, `summaryTemplate`
  - role `responsibilityHints`, `levelHints`
  - axis metadata
- `src/lib/transitionLite/buildTransitionLiteResult.js`
  - `scoreJobKeyOutputsFit()`
  - `scoreJobDecisionCriteriaFit()`
  - `collectJobSignalText()`
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js`
  - `missionType`, `outputType`, `successMetricType`, `horizonType`

### 4축 재사용 가능 signal
- `src/data/industry/registry/**`
  - `customerMarket`, `buyingMotion`, `decisionStructure`, `coreContext`, `jobInteractionHints`
- `src/data/transitionLite/targetReadAdapter.js`
  - `getCustomerMarketDisplay()`
  - `buildTransitionLite2IndustryTraitBullets()`
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js`
  - `stakeholderPrimary`
- `src/lib/transitionLite/classifyTransitionReadPatterns.js`
  - `debug.stakeholderSame`

### 5축 재사용 가능 signal
- `src/data/transitionLite/JOB_ROLE_WEIGHT_PROFILE_MAP.js`
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js`
  - `missionType`, `outputType`, `successMetricType`, `horizonType`
- `src/lib/transitionLite/classifyTransitionReadPatterns.js`
  - `OUTPUT_SIMILAR`, `STAKEHOLDER_SIMILAR`, `METRIC_SIMILAR`, `HORIZON_DIFFERENT`
- `src/lib/transitionLite/buildTransitionLiteResult.js`
  - `deriveJobWeightMode()`
  - `scoreJobCoreRoleFit()`
  - `scoreJobDecisionCriteriaFit()`

### 2축 유지/확장 후보
- 현재 구조 재사용 가치가 높다.
- 다만 이름만 바꾸는 대신 `industryDistance` 외에 `coreContext`, `valueChainPosition`, `decisionStructure`, `jobInteractionHints`, `support_industry_traits` 기반 세부 비교를 더 강하게 쓰는 것이 맞다.

### 3축 유지/확장 후보
- 현재 구조가 목표 정의와 가장 가깝다.
- 우선은 `responsibilityShift` 중심 유지가 가능하다.
- 단, `responsibilityHints`를 이용한 설명/row evidence 보강 여지는 있다.

## Phase D. 패치 실행 순서
- 1단계: 1축 signal contract 잠금
- 2단계: 1축 raw scoring prototype 정의
- 3단계: 1축 band/bucket 설계
- 4단계: 1축 QA case 작성
- 5단계: 4축 재설계
- 6단계: 5축 재설계
- 7단계: 2축 정교화
- 8단계: 3축 검증/유지 여부 확정

## 우선순위
1. 1축 `직무 구조 연결성`
2. 4축 `고객 유형 연결성`
3. 5축 `직무 성격 연결성`
4. 2축 `산업 맥락 연결성`
5. 3축 `역할 범위 연결성`

## 패치 금지 원칙
- 문구를 먼저 바꾸지 않는다.
- producer 설계가 잠기기 전 consumer narrative를 수정하지 않는다.
- 5축을 한 번에 패치하지 않는다.
- `buildAxisConnectivityPack.js`를 먼저 본다.
- raw score와 band를 분리하지 않고 함께 검토한다.

## exact owner / anchor shortlist
- `src/lib/analysis/buildAxisConnectivityPack.js`
  - `buildAxisConnectivityPack`
  - `scoreAxis1`
  - `scoreAxis4`
  - `scoreAxis5`
- `src/lib/transitionLite/buildTransitionLiteResult.js`
  - `scoreJobKeyOutputsFit`
  - `scoreIndustryCustomerStructureFit`
  - `scoreIndustryBuyingMotionFit`
  - `scoreIndustryDecisionStructureFit`
  - `scoreJobCoreRoleFit`
  - `scoreJobDecisionCriteriaFit`
  - `collectJobSignalText`
  - `deriveJobWeightMode`
  - `deriveResponsibilityBand`
- `src/lib/transitionLite/classifyTransitionReadPatterns.js`
  - `classifyTransitionReadPatterns`
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js`
  - `getTransitionReadJobMeta`
  - `getTransitionReadJobMetaByJobItem`
- `src/data/transitionLite/targetReadAdapter.js`
  - `getTransitionLite2IndustryTraits`
  - `getCustomerMarketDisplay`
  - `buildSafeIndustrySummary`

## 1축 scoring contract lock (draft)

### included signals
- `strongSignals` overlap
  - source: job ontology family level
  - role-level hint보다 핵심 업무/산출물 단서에 더 직접적이다.
- `responsibilityHints` overlap
  - source: job ontology role level
  - 실제 수행 단위와 책임 표현을 보강하는 직접 단서다.
- `mediumSignals` overlap
  - source: job ontology family level
  - strong signal이 약할 때 보조 단서로만 쓴다.
- `missionType`
  - source: `jobTransitionReadMetaRegistry`
  - 핵심 업무 종류의 큰 방향 일치 여부를 secondary consistency check로만 쓴다.
- `outputType`
  - source: `jobTransitionReadMetaRegistry`
  - 산출물 유형 일치 여부를 secondary consistency check로만 쓴다.
- `jobDistance`, `familyDistance`, `sharedFamiliesCount`
  - source: 현재 Axis 1 producer / `classifyTransition`
  - direct score basis가 아니라 floor/ceiling/modifier로만 제한 사용한다.

### excluded signals
- `summaryTemplate` direct scoring
  - 길고 서술형이라 token overlap 시 generic 문장 영향이 크다.
  - evidence/explanation 용도로만 쓴다.
- `industryDistance`
- `customerMarket`
- `buyingMotion`
- `decisionStructure`
- `roleWeightShift`
- `responsibilityShift`
- `sameSector`, `sameSubSector`

### primary / secondary / modifier
- primary
  - `strongSignals` overlap
  - `responsibilityHints` overlap
- secondary
  - `mediumSignals` overlap
  - `missionType`
  - `outputType`
- modifier
  - `jobDistance`
  - `familyDistance`
  - `sharedFamiliesCount`
- evidence-only
  - `summaryTemplate`
  - `levelHints`
  - `boundarySignals`

### open risks
- `responsibilityHints`는 strongSignals와 일부 의미 중복이 발생할 수 있어 가중치를 동일하게 두면 과측정 위험이 있다.
- `missionType`/`outputType`를 primary로 올리면 5축과 의미가 겹칠 가능성이 커진다.
- taxonomy distance를 완전히 제거하면 ontology 품질 guardrail이 사라져 false high 위험이 생길 수 있다.
- `summaryTemplate`를 점수 source로 넣으면 generic phrase overlap이 과대평가될 수 있다.

## 4축 scoring contract lock (draft)

### target meaning
- 현재 산업/직무와 목표 산업/직무가 어떤 고객 또는 이해관계자를 상대하는지,
- 그 고객 구조와 구매/의사결정 구조가 얼마나 유사한지를 나타내는 축으로 잠정 고정한다.
- 이 축은 핵심 업무 유사성, 책임 수준 상하 이동, role weight/strategy-execution 성향, 산업 전체 거리 자체를 직접 측정하지 않는다.

### included signal candidates
- `customerMarket`
  - source: `src/data/industry/registry/**`
  - 현재 producer가 이미 읽고 있는 가장 정규화된 고객 구조 신호다.
- `buyingMotion`
  - source: `src/data/industry/registry/**`
  - `buildTransitionLiteResult.js`의 `scoreIndustryBuyingMotionFit()`에서 이미 normalized overlap 비교가 가능하다.
- `decisionStructure`
  - source: `src/data/industry/registry/**`
  - 문장형이지만 `scoreIndustryDecisionStructureFit()` 기준으로 약한 비교는 가능하다.
- `stakeholderPrimary`
  - source: `src/data/transitionLite/jobTransitionReadMetaRegistry.js`
  - 고객 구조 그 자체보다 job-facing counterpart proxy로 보는 것이 안전하다.
- `support_industry_traits.customerStructure`
  - source: `src/data/transitionLite2/**/support_industry_traits.js`
  - scoring raw보다는 support/evidence 성격이 강하다.

### excluded / evidence-only candidates
- excluded from direct scoring
  - `industryDistance`
  - `sameSector`
  - `sameSubSector`
  - `roleWeightShift`
  - `responsibilityShift`
  - 1축용 업무 유사성 signal
- evidence-only
  - `stakeholderPrimary`
  - `classifyTransitionReadPatterns().debug.stakeholderSame`
  - `customerStructure`
  - `jobInteractionHints`
  - `coreContext`
- 이유
  - `stakeholderPrimary`는 job meta라 coarse하고,
  - `customerStructure`, `jobInteractionHints`, `coreContext`는 설명력은 높지만 narrative/free-text 비중이 커 score source로 쓰기 위험하다.

### primary / secondary / modifier hypothesis
- primary
  - `customerMarket`
- secondary
  - `buyingMotion`
  - `decisionStructure`
- modifier
  - 없음
  - 이번 조사 기준으로 taxonomy/industry adjacency modifier를 넣으면 2축과 중복될 가능성이 더 크다.
- evidence-only
  - `stakeholderPrimary`
  - `customerStructure`
  - `jobInteractionHints`
  - `coreContext`

### open risks
- `buyingMotion`과 `decisionStructure`를 둘 다 강하게 넣으면 같은 구매/승인 구조를 이중 측정할 수 있다.
- `stakeholderPrimary`를 primary로 올리면 4축이 고객 구조 축이 아니라 job-facing interaction 축으로 이동할 수 있다.
- `decisionStructure`는 sentence-form text라 exact scoring 안정성이 낮다.
- `customerMarket`를 너무 약화하면 기존 producer의 가장 안정적인 SSOT를 잃고 free-text heuristic 비중이 커진다.
