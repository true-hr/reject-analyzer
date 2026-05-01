# Work Record Taxonomy Design

## 목적
PM 전용으로 하드코딩된 work record 입력 taxonomy를 공통 레이어 + 직무별 확장 레이어 구조로 전환하기 위한 설계 SSOT를 잠근다.

이번 문서는 다음을 먼저 고정한다.
- 입력 taxonomy와 job ontology의 역할 분리
- 공통 3축 정의
- `job id -> input preset registry` 계약
- MVP 1차 확장 직무 범위

## 현재 확인된 사실
- 현재 PM 입력 chip/tag 상수 owner는 `src/components/mvp/PmRecordInput.jsx`다.
- `TRACK_COPY` 안에 today / weekly별 title, description, placeholder, sampleRecord, workTags가 같이 박혀 있다.
- 공통 협업/결과 태그도 같은 파일 안의 `CONTEXT_TAGS`, `RESULT_TAGS` 상수로 박혀 있다.
- 현재 `PmRecordInput` consumer는 `src/components/mvp/PmMvpView.jsx`의 `<PmRecordInput track={track} onSubmit={handleRecordSubmit} />`다.
- 현재 직무 선택값과 연결 가능한 job id source는 `src/data/job/jobOntology.index.js`다.
- 현재 ontology lookup 경로는 `src/data/job/jobLookup.index.js`의 `findJobOntologyByUiSelection()` -> `getJobOntologyItemByMajorSubcategory()`다.

## 왜 job ontology만으로 입력 taxonomy가 자동 확장되지 않는가
- 현재 job ontology는 해석 자산으로는 강하다.
  - `strongSignals`
  - `mediumSignals`
  - `boundarySignals`
  - `responsibilityHints`
  - `levelHints`
  - `summaryTemplate`
- 하지만 이 필드들은 입력 chip preset이 아니라 해석/리포트/경계 판정용 문장 자산이다.
- 이유는 아래와 같다.
  - `strongSignals`, `mediumSignals`, `boundarySignals`는 서술형이고 길다.
  - `responsibilityHints`는 role 설명에는 좋지만 하루/주간 기록용 chip granularity와 다르다.
  - `summaryTemplate`는 결과 문장용이지 입력 UI preset이 아니다.
- 따라서 job ontology를 그대로 입력 taxonomy로 재사용하면 chip 밀도, 문장 길이, 행동 단위가 UI에 맞지 않는다.

## 공통 3축 정의
### 1) 업무 유형
- 사용자가 실제로 한 일을 짧은 행동 단위로 기록하는 축
- 예: 정리, 조율, 보고, 분석, 운영 개선
- 직무별로 가장 크게 달라지는 축이므로 확장 레이어 대상이다.

### 2) 협업 맥락
- 누구와 어떤 방식으로 맞물렸는지 기록하는 축
- 예: 개발, 디자인, 영업, 고객/CS, 외부 파트너
- 공통 레이어로 유지하되 직무별 추천 세트를 덧붙일 수 있다.

### 3) 결과/후속 메모
- 처리 결과, 반영 상태, 후속 액션을 짧게 남기는 축
- 예: 문서 반영, 후속 연결, 일정 조정, 이슈 정리
- 공통 레이어로 유지하는 편이 안전하다.

## 공통 레이어와 직무별 확장 레이어
### 공통 레이어
- 입력 구조 3축 자체
- custom tag 추가/토글/삭제 동작
- record shape
  - `text`
  - `roleTags`
  - `collaborationTags`
  - `resultTags`
  - `track`
- 공통 협업/결과 tag 기본 세트
- canonical id / alias 정규화 규칙

### 직무별 확장 레이어
- `workTags`
- placeholder
- sampleRecord
- helper copy
- 필요 시 직무별 추천 협업 tag 보강

## job ontology와 input taxonomy의 역할 분리
### job ontology
- 직무 해석 기준
- role/family/adjacent/boundary 읽기
- 결과 문장, 강점 신호, 경계 설명 자산
- 직무 선택값 canonicalization의 source

### input taxonomy
- 입력 UI preset
- 짧은 chip label
- sample/placeholder
- 직무별 기록 흐름 가이드
- 입력값 canonical id 정규화

## canonical id / alias 규칙 초안
- 모든 입력 tag는 label과 별도로 canonical id를 가진다.
- id는 소문자 snake_case 또는 lower kebab이 아니라 repo 현재 taxonomy naming 관례를 따라 snake_case 우선으로 둔다.
- 예시:
  - `issue_coordination`
  - `document_reporting`
  - `customer_cs`
  - `followup_connected`
- alias는 사용자 입력 normalize 시 canonical id로 매핑한다.
- UI 렌더는 label 기반, 저장과 연결은 canonical id 기반을 권장한다.

## job id -> input preset registry 계약
- registry는 job ontology와 별도 파일로 둔다.
- 최소 shape 초안:

```js
{
  jobOntologyId: "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT",
  presetKey: "product_management",
  commonContextMode: "default",
  commonResultMode: "default"
}
```

- preset file 최소 shape 초안:

```js
{
  presetKey: "product_management",
  title: "오늘 기록하기",
  workTags: [],
  collaborationTags: [],
  resultTags: [],
  placeholderByTrack: {
    today: "",
    weekly: "",
  },
  sampleRecordByTrack: {
    today: { text: "", roleTags: [], collaborationTags: [], resultTags: [] },
    weekly: { text: "", roleTags: [], collaborationTags: [], resultTags: [] },
  },
}
```

## MVP 1차 대상 직무
- PM
- PMM
- HR Ops
- FP&A
- Product Design

선정 이유:
- 현재 ontology가 이미 존재한다.
- PM 구조와 완전히 멀지 않다.
- 기록형 UI로 풀기 쉬운 직무다.
- 초기 multi-job input preset 비교 대상으로 적절하다.

## 예상 파일 구조
- `src/data/workRecord/commonRecordTaxonomy.js`
- `src/data/workRecord/jobExtensionRegistry.js`
- `src/data/workRecord/jobExtensions/product_management.js`
- `src/data/workRecord/jobExtensions/product_marketing.js`
- `src/data/workRecord/jobExtensions/hr_ops.js`
- `src/data/workRecord/jobExtensions/fpna.js`
- `src/data/workRecord/jobExtensions/product_design.js`
- `src/data/workRecord/workTypeCanonicalMap.js`

## Out Of Scope
- job ontology와 input taxonomy를 한 파일 체계로 억지 통합하는 것
- 직무별 완전 독립 taxonomy 시스템
- 직무별 scoring model
- 실제 Notion / Google Calendar fetch/auth 연동
- `App.jsx` 구조 개편
