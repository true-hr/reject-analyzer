# PASSMAP ENGINE FLOW
Final Reference v1 (FACT)

이 문서는 PASSMAP 엔진의 실제 코드 기반 실행 흐름을 정리한 공식 참조 문서이다.  
추측이 아닌 코드에서 확인된 FACT만 기록한다.

---
PASSMAP Risk ID prefix는 layer가 아니다.

실제 layer 값은 다음 5개만 사용한다.

gate
must
domain
exp
preferred

# 1. 전체 아키텍처 개요

PASSMAP 분석 파이프라인은 다음 4개 계층으로 구성된다.

Input  
│  
▼  
Analyzer Engine  
│  
▼  
Decision Engine  
│  
▼  
Simulation ViewModel  
│  
▼  
UI Rendering  

각 계층의 책임은 명확히 분리되어 있다.

| Layer | 책임 |
|------|------|
| Analyzer | 신호 생성 / 분석 팩 생성 |
| Decision | 위험 평가 / riskResults 생성 |
| Simulation | Top3 / 유형 라벨 계산 |
| UI | 표시용 가공 |

---

# 2. Engine Entry Point

## analyze()

파일


src/lib/analyzer.js


엔진의 유일한 Orchestrator이다.


export function analyze(state, ai = null)


### 입력

state  
ai  

대표 state 필드


state.jd
state.resume
state.portfolio
state.career
state.roleKscoMajor
state.roleKscoOfficeSub


---

# 3. Analyzer 단계

analyze()는 먼저 신호 분석 객체들을 생성한다.

---

## 3.1 구조 분석


structurePack = buildStructureAnalysis()


입력

- resumeText
- jdText
- KSCO hints
- industry
- role
- company size

출력


structureAnalysis
structureSummaryForAI


실패 시 fallback


{
structureAnalysis: null,
structureSummaryForAI: ""
}


---

## 3.2 Signals 생성

Analyzer는 다음 신호들을 생성한다.


keywordSignals
careerSignals
resumeSignals
majorSignals


생성 함수


buildKeywordSignals()
buildCareerSignals()
buildResumeSignals()
buildMajorSignals()


---

## 3.3 Objective Score

다음 신호들을 기반으로 계산된다.


buildObjectiveScore({
keywordSignals
careerSignals
resumeSignals
majorSignals
})


---

## 3.4 Hypotheses


buildHypotheses(state, ai)


면접관 가설 생성

---

## 3.5 Report


buildReport(state, ai)


설명용 리포트 생성

---

## 3.6 Structural Pattern


detectStructuralPatterns()


출력


structural


패키징


structuralPatternsPack = {
summary
flags
metrics
}


---

# 4. Decision Engine

Analyzer는 Decision Engine을 호출한다.

파일


src/lib/decision/index.js


함수


buildDecisionPack()


호출


decisionPack = buildDecisionPack({
state,
ai,
structural,
careerSignals
})


---

# 5. Decision Engine 내부

## 5.1 Structural pressure


computeStructuralDecisionPressure()


입력


structural.flags


---

## 5.2 Risk evaluation

핵심 엔진


evalRiskProfiles()


입력


state
ai
structural


출력


riskResults[]


---

## 5.3 Risk normalization


riskResults = __normalizeRiskResults(riskResults)


---

## 5.4 Simple mode detection

조건

- JD 없음
- Resume 없음

이면


simple mode


---

## 5.5 Simple mode UX 보정

simple 모드에서는


gate 유지
+
최대 3개 non-gate 카드


를 보장한다.

---

## 5.6 Risk feed 생성

UI 확장용


riskFeed


생성 방식


evalRiskProfiles(detail mode)


---

# 6. Decision Pack

Decision Engine의 최종 출력


decisionPack


핵심 필드


decisionPack = {

riskResults[]

riskFeed[]

meta

decisionScore

}


핵심 데이터는


riskResults[]


이다.

---

# 7. Simulation ViewModel

파일


src/lib/simulation/buildSimulationViewModel.js


함수


buildSimulationViewModel(riskResults)


입력


decisionPack.riskResults


---

## 7.1 Gate 판정

다음 조건 중 하나


layer === "gate"
OR
id.startsWith("GATE__")


주의

PASSMAP gate rule 대부분은


SENIORITY__UNDER_MIN_YEARS


형식이므로


layer = "gate"


가 반드시 필요하다.

---

## 7.2 Top3 선택

알고리즘


gate 우선
+
priority 정렬


---

## 7.3 유형 라벨 결정

함수


__determineType()


입력


gateMax
trust
fit
risk


출력 예시


무난 통과형
구조적 차단형
전환 시험대형


---

# 8. UI Layer

파일


src/App.jsx


UI는 다음 경로로 simVM을 생성한다.


const vmFull = buildSimulationViewModel(rr)


---

## 8.1 UI 가공

UI는 표시용 trimming 수행


logs
max 6 lines
140 chars

top3
max 3


---

# 9. Simulation Input Source

UI에서 simVM 입력은 다음 경로로 결정된다.


__simSource


선택 규칙


decision risks
OR
drivers fallback


---

# 10. Fallback Mechanism

Decision riskResults가 비면

다음 데이터를 사용한다.


reportPack.riskLayer.documentRisk.drivers
reportPack.riskLayer.interviewRisk.drivers


drivers를 risk 객체로 변환


{
id: DRIVER__
title
layer
priority
score
}


목적


UI empty state 방지


---

# 11. Known Design Debts

현재 구조에서 기록된 설계 부채

### fallback 중복

구현 위치


analyzer.js
App.jsx


### gate 판정 contract

gate rule은 반드시


layer:"gate"


필요

### simVM 생성 책임 이중화


Analyzer
UI


두 계층 존재

---

# 12. 실제 데이터 흐름


state
ai
│
▼
analyze()
│
├─ signals
├─ structural
│
▼
buildDecisionPack()
│
▼
riskResults
│
▼
buildSimulationViewModel()
│
▼
simVM
│
▼
App.jsx rendering


---

# 13. 가장 중요한 엔진 계약

PASSMAP에서 절대 깨지면 안 되는 규칙

Contract 1


riskResults는 Decision Engine의 단일 출력이다


Contract 2


Simulation VM 입력은 riskResults다


Contract 3


gate rule → layer="gate"


Contract 4


fallback은 UI safety only
엔진 로직이 아니다


---

# 14. PASSMAP 핵심 개념 요약

PASSMAP은 다음 구조의 엔진이다.


signals → riskProfiles → decisionPack → simulationVM


즉


신호 분석
→ 위험 평가
→ 합격 판단
→ UI 시뮬레이션