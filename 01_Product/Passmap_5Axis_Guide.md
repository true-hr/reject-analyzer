# PASSMAP 5축 가이드

## 이 문서의 경계
- 이 문서는 운영자/기획자가 읽는 설명용 mirror다.
- runtime SSOT는 코드이며, 이 문서가 점수 계산 기준을 대신하지 않는다.
- 아래 설명은 2026-04-05 true owner audit에서 확정된 내용만 옮긴 것이다.
- 과도기 구조나 coverage 의존이 있는 축은 그대로 caveat로 남긴다.

## Experienced 5축

### 직무 구조 연결성
- 이 축이 보는 것
- 현재 직무와 목표 직무의 핵심 과업, 산출 방식, 역할 구조가 얼마나 닮았는지 본다.
- 주요 판단 기준
- strongSignals overlap
- responsibilityHints overlap
- jobDistance
- family distance
- mission / output type match
- high / mid / low가 대체로 의미하는 것
- high: 현재 직무의 과업 구조를 목표 직무에 비교적 자연스럽게 연결할 수 있다.
- mid: 이어지는 부분은 있지만 어떤 과업이 닿는지 더 풀어 설명해야 한다.
- low: 직무 구조 차이가 커서 연결 논리를 별도로 세워야 한다.
- 해석 시 주의점
- 이 축은 직무 task/output 구조 축이다.
- 책임 범위나 seniority 차이만으로 읽으면 Axis 3와 혼동된다.

### 산업 맥락 연결성
- 이 축이 보는 것
- 산업이 돌아가는 맥락, value chain, core context, 규제, 세일즈 사이클이 얼마나 비슷한지 본다.
- 주요 판단 기준
- industryDistance
- same sector / same subSector
- valueChain fit
- coreContext fit
- regulation barrier fit
- sales cycle fit
- high / mid / low가 대체로 의미하는 것
- high: 산업 문법 차이가 작아 기존 경험을 그대로 이어 설명하기 좋다.
- mid: 일부 맥락은 이어지지만 업계 차이를 보완 설명해야 한다.
- low: 산업 문법 차이가 커서 업계 적응 논리가 필요하다.
- 해석 시 주의점
- 고객 구조나 buying motion은 일부 연관되지만, 이 축의 중심은 산업 맥락이다.

### 역할 범위 연결성
- 이 축이 보는 것
- 목표 역할이 지금보다 더 넓은 책임을 요구하는지, 비슷한 수준인지, 더 좁은지를 본다.
- 주요 판단 기준
- `responsibilityShift`
- high / mid / low가 대체로 의미하는 것
- high: 현재 책임 범위가 목표 역할과 가깝다.
- mid: 기본 연결은 가능하지만 범위 차이를 설명해야 한다.
- low: 목표 역할의 책임 범위가 지금과 꽤 다르다.
- 해석 시 주의점
- 이 축은 현재 `classifyTransition()`의 upstream 분류에 크게 묶여 있다.
- final score만 보면 왜 그런 점수가 나왔는지 문서가 얕아질 수 있다.

### 고객 유형 연결성
- 이 축이 보는 것
- 상대하던 고객군과 구매/의사결정 구조가 목표 산업과 얼마나 비슷한지 본다.
- 주요 판단 기준
- customerMarket fit
- buyingMotion fit
- decisionStructure fit
- high / mid / low가 대체로 의미하는 것
- high: 고객군과 구매 방식이 비슷해 사례 연결이 쉽다.
- mid: 일부는 이어지지만 고객 구조 차이를 따로 설명해야 한다.
- low: 고객군이나 구매 구조가 크게 달라 적응 논리가 필요하다.
- 해석 시 주의점
- 이름은 고객 유형이지만 실제 계산은 buying motion / decision structure까지 포함한다.

### 직무 성격 연결성
- 이 축이 보는 것
- 일의 기본 성격이 전략형인지 실행형인지, 성과를 보는 방식과 시간축이 얼마나 닮았는지 본다.
- 주요 판단 기준
- roleWeightShift
- mission type match
- success metric type match
- horizon type match
- output type match
- high / mid / low가 대체로 의미하는 것
- high: 일하는 성격과 성과 기준이 목표 직무와 비교적 잘 맞는다.
- mid: 일부는 맞지만 일의 무게중심 차이를 설명할 필요가 있다.
- low: 일의 기본 성격 차이가 커서 적응 설명이 필요하다.
- 해석 시 주의점
- 이 축은 soft skill 축이 아니다.
- role profile + job meta match 축으로 읽어야 한다.

## Newgrad 5축

### 전공과 직무의 연결성 (Job Fit)
- 이 축이 보는 것
- 전공, 프로젝트 역할, 인턴 역할이 목표 직무 task-role과 얼마나 직접 연결되는지 본다.
- 주요 판단 기준
- project role
- internship / part-time roleFamily
- major prior
- coursework
- high / mid / low가 대체로 의미하는 것
- high: 직무와 닿는 역할 경험이 비교적 직접적이다.
- mid: 전공이나 교육은 맞닿지만 직무 연결 논리를 더 풀어야 한다.
- low: 직접적인 role evidence가 부족하다.
- 해석 시 주의점
- 이 축은 `resolveNewgradAxis1MajorPrior()` 영향을 받는다.
- major는 시작점일 뿐 최종 판정 전체가 아니다.

### 산업 연관성
- 이 축이 보는 것
- 목표 산업의 문법을 이해했거나 닿아본 증거가 얼마나 있는지 본다.
- 주요 판단 기준
- major-industry alignment
- cert relevance bridge 결과
- strong context evidence
- weak project support
- high / mid / low가 대체로 의미하는 것
- high: 목표 산업과 직접 닿는 준비나 맥락 증거가 여러 경로에서 잡힌다.
- mid: 일부 접점은 있으나 산업 문법 이해를 더 설명해야 한다.
- low: 산업과의 직접 접점이 약하다.
- 해석 시 주의점
- cert는 phase1 relevance bridge 범위에 의존한다.
- industry profile coverage 차이도 영향을 준다.
- 따라서 cert가 없다고 산업 적합성이 곧바로 낮다고 단정하면 안 된다.

### 유사한 경험이 있는가?
- 이 축이 보는 것
- 실제로 끝까지 수행해 본 양과 깊이, 결과 강도를 본다.
- 주요 판단 기준
- evidence group / item count
- project outcome level
- experience duration level
- combo evidence
- high / mid / low가 대체로 의미하는 것
- high: 활동 수만이 아니라 결과나 지속성까지 같이 잡힌다.
- mid: 수행 경험은 있으나 깊이를 더 보여줄 여지가 있다.
- low: 수행 경험의 양이나 깊이가 약하다.
- 해석 시 주의점
- experienced의 역할 범위 축과 다르다.
- newgrad에서는 execution depth 쪽 의미가 더 강하다.

### 고객 커뮤니케이션 적합성
- 이 축이 보는 것
- 사람, 고객, 협업 상대와 실제 상호작용해 본 경험이 있는지 본다.
- 주요 판단 기준
- internships / projects / extracurriculars / part-time evidence
- stakeholder semantic lift
- workStyleNotes presence
- high / mid / low가 대체로 의미하는 것
- high: 상호작용 경험이 비교적 선명하고 stakeholder signal도 잡힌다.
- mid: 기본적인 소통 경험은 있으나 직무 맥락과의 연결이 더 필요하다.
- low: 상호작용 경험이 약하거나 간접적이다.
- 해석 시 주의점
- experienced Axis 4와 같은 key를 쓰지만 의미가 다르다.
- 여기서는 고객 구조보다 interaction evidence 쪽이 중심이다.

### 강점과 재능
- 이 축이 보는 것
- 자기보고 강점과 업무 스타일이 목표 직무 성격과 얼마나 맞는지 본다.
- 주요 판단 기준
- strengths
- workStyleNotes
- target trait map hit
- high / mid / low가 대체로 의미하는 것
- high: self-report와 target trait map이 비교적 잘 맞는다.
- mid: 일부는 맞지만 직무와의 연결을 더 설명해야 한다.
- low: 입력이 적거나 trait hit가 약하다.
- 해석 시 주의점
- self-report 기반 caveat가 크다.
- trait map coverage와 입력 어휘 일치에 민감하다.
- 이 축을 검증 완료된 적합성처럼 과하게 해석하면 안 된다.

## 같은 key지만 의미가 다른 축
- `responsibilityScope`
- experienced: 책임 범위 이동
- newgrad: execution depth / 유사 경험
- `customerType`
- experienced: 고객군 + buying motion + decision structure
- newgrad: interaction / 커뮤니케이션 evidence
- `roleCharacter`
- experienced: role profile + mission/metric/horizon match
- newgrad: self-report 강점 / 업무 스타일 match

## 점수 해석 시 주의할 점
- 5축 점수는 설명 보조 수단이다.
- 문서 설명보다 코드 계산이 우선한다.
- 같은 점수여도 어떤 신호가 점수를 만들었는지에 따라 해석이 달라질 수 있다.
- experienced와 newgrad는 같은 key를 써도 의미가 다를 수 있으므로 섞어서 읽지 않는다.
- newgrad Axis 2와 Axis 5는 coverage / self-report caveat를 항상 함께 본다.

## QA 시 대표 확인 포인트
- experienced
- Axis 1: same family / adjacent family / far family가 band와 explanation에 다르게 반영되는지
- Axis 2: same sector but different subSector, cross industry but overlap case가 분리되는지
- Axis 3: `responsibilityShift` 4종이 다른 raw 구간으로 고정되는지
- Axis 4: customer market mismatch인데 buying motion 일부 일치 시 보정이 생기는지
- Axis 5: role profile은 비슷하지만 mission/metric/horizon mismatch일 때 점수가 내려가는지
- newgrad
- Axis 1: major-only, project direct 1개, project direct 2개, fallback-only가 구분되는지
- Axis 2: major aligned only, cert direct only, strong context only, weak project only가 다르게 읽히는지
- Axis 3: count-only와 outcome/duration lift가 분리되는지
- Axis 4: stakeholder high signal이 실제로 추가 lift로 잡히는지
- Axis 5: strengths / workStyleNotes가 target trait와 안 맞으면 high로 가지 않는지
