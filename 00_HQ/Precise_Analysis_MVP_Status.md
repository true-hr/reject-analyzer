# Precise Analysis MVP 상태 기준선

## 문서 목적
이 문서는 preciseAnalysis MVP의 현재 구현 범위, 엔진 상태, 다음 우선순위를 고정하기 위한 HQ 기준 문서다.  
목적은 세션이 바뀌어도 현재 상태와 다음 단계의 기준이 흔들리지 않게 만드는 것이다.

## 현재 한 줄 상태
현재 preciseAnalysis는 공통 contract와 1차 MVP 핵심 리스크 엔진 5개까지 구현된 상태다.  
따라서 지금 단계는 새 엔진을 계속 늘리는 단계가 아니라, 이미 만든 엔진을 서비스 가능한 수준으로 마감하는 단계로 본다.

## 공통 기반 상태
- `src/lib/preciseAnalysis/createRiskResult.js`가 생성되었고, 앞으로 모든 리스크 엔진은 이 shape contract를 따른다.
- `App.jsx`에는 `window.__PRECISE_ANALYSIS_DEBUG__` stash가 연결되어 있어 개발 중 엔진 결과를 즉시 확인할 수 있다.

## 완료된 핵심 엔진 범위

### 1. 필수요건 미충족
현재 엔진은 preferred 오염 방어가 반영되어 있으며, `raw-fit` / `hard-must-guarded` 모드를 구분한다.  
또한 trim / lowercase / 공백 normalize가 들어가 있고, QA 문서 기대값도 코드 기준에 맞게 정합성이 수정되었다.  
현재 5개 엔진 중 가장 많이 닫힌 엔진으로 본다.

### 2. 연차/레벨 불일치
현재 엔진은 `experienceYears`와 `employmentPeriods`를 기반으로 동작한다.  
비중복 기간 합산이 반영되어 있고, `range-check`와 `insufficient-data` 정책이 분리되어 있다.  
또한 overqualified는 high가 아니라 medium까지만 주는 보수 정책이 반영되어 있다.  
다만 이 엔진은 총 경력 기반 엔진이며, 관련 경력 부족까지 보는 엔진은 아니다.

### 3. 성과 검증 불가
현재 엔진은 `window.__PARSED_RESUME__`에서 `achievements`, `timeline[].bullets`를 읽어 판정한다.  
`achievement-check` / `insufficient-data` 모드를 구분하며, 정량 표현의 count와 ratio를 raw에 남긴다.  
구조는 유효하지만, "5년 경력" 같은 비성과 숫자도 일부 정량 성과처럼 잡힐 수 있어 향후 정확도 보강 후보로 본다.

### 4. JD 키워드 반영 부족
현재 엔진은 `domainKeywords`, parsed resume, `__resumeMerged`를 조합해 coverage를 판단한다.  
`keywordPolicyMode`, `matchedKeywordCount`, `missingKeywords`, `keywordCoverageRatio`가 raw에 남는다.  
다만 substring 기반 매칭이라 `"SQL"`이 `"MySQL"`에 잡힐 수 있고, spec과 구현 사이에 medium 기준 차이가 약간 남아 있다.  
현재 가장 먼저 정책 정리가 필요한 엔진으로 본다.

### 5. 공백/이직 설명 부재
현재 엔진은 `employmentPeriods`, `parsedResume.gaps`, `parsedResume.transitionNarrative`를 기반으로 구현되어 있다.  
`gap-check` / `insufficient-data` 모드를 구분한다.  
다만 현재 정책은 설명 신호가 하나만 있어도 none으로 많이 완화되는 편이라, 현실 채용 관점에서는 다소 과완화일 수 있다.

## 현재 단계의 판단
현재 상태를 "엔진 골격 단계"로 보지 않는다.  
이미 1차 MVP용 핵심 엔진 5개는 구현됐기 때문에, 이제는 정합성 보강, 정책 정리, 종합 연결 단계로 넘어갈 수 있는 상태로 본다.

## 지금 당장 해야 할 일
1. 엔진 확정 라운드  
2. 엔진 5개 운영 정리 문서화  
3. composite / top3 설계  
4. 추출/정규화 SSOT 초안 설계  
5. UI와 엔진 연결은 별도 채팅에서 read path 중심으로 진행

## 현재 우선순위 판단
지금은 새 엔진을 계속 추가하는 것보다, 기존 5개 엔진을 서비스 가능한 수준으로 마감하는 것이 ROI가 더 높다.  
특히 아래 3개 엔진은 정책 흔들림이 남아 있으므로 우선 정리 대상이다.

- 성과 검증 불가
- JD 키워드 반영 부족
- 공백/이직 설명 부재

## 다음 단계 원칙
- 지금 단계의 핵심은 "엔진 추가"가 아니라 "엔진 확정"이다.
- 개별 엔진 정책이 안정화되기 전에는 composite/top3를 성급히 고정하지 않는다.
- 추출/정규화 레이어는 별도 SSOT로 문서화해 이후 엔진 추가와 UI 연결의 기준으로 삼는다.

## 종합판정 단계 (composite/top3)

### 설계 원칙 확정 (2026-04-12)

**top3 선정 규칙**
- 포함 조건: `triggered === true` AND `severity !== "low"` AND `severity !== "none"`
- 정렬: severity 내림차순(critical>high>medium) → category 내림차순(fatal>important) → 엔진 선언 순서
- low risk: `supporting.lowRisks`로 분리
- insufficient-data: `raw.*PolicyMode === "insufficient-data"` 감지, `supporting.insufficientData`로 분리
- fallback: 후보 < 3이면 빈 슬롯 패딩 없이 있는 것만 반환

**overall band (4단계)**
- `high_risk` — fatal 엔진에서 critical 또는 high 발생 → "서류 통과 저해 리스크 있음"
- `warning` — medium 이상 triggered 존재 → "보완이 필요한 리스크 존재"
- `caution` — low only triggered → "경미한 리스크 주의"
- `pass` — triggered 없음 → "전반적으로 양호"

**숫자 점수 불채택 이유**: MVP에서 점수 기준이 자의적이고 사용자 체감 불명확. band/label이 더 직관적.

**owner**: `src/lib/preciseAnalysis/buildCompositeRisk.js` (순수 함수, 신규 파일)

**result shape 핵심 구조**
```
{ summary: { overallBand, overallLabel, overallReason, triggeredRiskCount, fatalTriggeredCount },
  topRisks: RiskResult[],          // max 3
  supporting: { lowRisks, insufficientData, passedRisks },
  meta: { evaluatedRiskCount, triggeredRiskCount, insufficientDataCount, riskVersion } }
```

**다음 단계**: App.jsx stash에 `buildCompositeRisk` 호출 추가 → PreciseAnalysisFlow.jsx UI read path 연결

## 이번 문서의 결론
Precise Analysis MVP는 이미 핵심 엔진 5개까지 도달한 상태다.  
이후의 올바른 순서는 "정책/정합성 마감 → composite/top3 → 추출/정규화 SSOT → UI 연결"이다.

composite/top3 설계는 2026-04-12 라운드에서 확정되었으며, `buildCompositeRisk.js`가 구현된 상태다.  
다음 단계는 App.jsx 호출 추가 및 PreciseAnalysisFlow.jsx UI read path 연결이다.
