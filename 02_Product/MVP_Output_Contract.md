# MVP Output Contract

## 목적
PM MVP 중심으로 쓰이던 출력 계약을 다직무 확장 가능한 구조로 재정리한다.

이번 문서는 결과 해석 레이어는 공통 계약으로 유지하고, 입력 preset은 직무별 확장 레이어로 분리한다는 원칙을 잠근다.

## 현재 owner 확인
- 현재 PM 입력 preset owner는 `src/components/mvp/PmRecordInput.jsx`다.
- 현재 결과 consumer 흐름은 `src/components/mvp/PmMvpView.jsx`에서 시작된다.
- 현재 직무 lookup source는 `src/data/job/jobOntology.index.js`와 `src/data/job/jobLookup.index.js`다.

## 공통 출력 계약
### 오늘 기록 결과
- 오늘 기록 해석
- 오늘 기록에서 읽힌 신호 1개에서 3개
- 자산 후보 문장 1개
- 이번 주 묶음으로 넘길지 여부

### 이번 주 기록 결과
- 이력서 문장
- 강점 요약
- 누적 자산 반영 가능 메모
- 준비도 변화 반영 가능성

### readiness 결과
- 목표 직무 기준 핵심 요구 신호
- 현재 보이는 신호
- 부족 신호
- 남은 간극 요약
- 우선 보완 항목

## 입력 taxonomy와 출력 계약의 역할 분리
- 입력 taxonomy는 chip/preset/sample/placeholder를 담당한다.
- 출력 계약은 해석 결과가 어떤 카드와 문장 구조로 나오는지 담당한다.
- 즉 다직무 확장 시 출력 카드 구조는 최대한 공통으로 유지하고, 입력 preset과 일부 직무별 wording만 바꾼다.

## 직무 공통으로 유지할 것
- 기록 -> 해석 -> 자산화 흐름
- 강점/신호/반영 문장/보완 포인트 구조
- custom tag는 strong evidence로 자동 승격하지 않는 보수적 원칙

## 직무별로 따로 가져갈 것
- 업무 유형 preset
- placeholder / sampleRecord
- 직무별 asset candidate wording
- 일부 직무별 결과 헤더 copy

## 다직무 확장 기준
- 공통 3축은 유지한다.
  - 업무 유형
  - 협업 맥락
  - 결과/후속 메모
- 직무 선택 시 `job id -> input preset registry`를 통해 preset만 바꾼다.
- job ontology는 해석용 공통 자산으로 재사용한다.

## Out Of Scope
- 직무별 별도 scoring engine
- 직무별 완전 분리 route
- 저장/백엔드 연동
