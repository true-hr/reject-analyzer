# Work Record MultiJob Expansion Plan

## 현재 상태
- 현재 work record 입력 구조는 `src/components/mvp/PmRecordInput.jsx`에 PM 전용 상수로 박혀 있다.
- `TRACK_COPY`가 today / weekly copy와 sampleRecord, `workTags`를 함께 들고 있다.
- `CONTEXT_TAGS`, `RESULT_TAGS`도 같은 파일의 local constant다.
- 현재 consumer는 `src/components/mvp/PmMvpView.jsx`다.
- 현재 직무 선택값에서 ontology item으로 가는 lookup은 `src/data/job/jobLookup.index.js`다.
- 현재 job id source of truth는 `src/data/job/jobOntology.index.js`다.

## 현재 PM-only 하드코딩 위치
- `src/components/mvp/PmRecordInput.jsx`
  - `TRACK_COPY.today.workTags`
  - `TRACK_COPY.weekly.workTags`
  - `TRACK_COPY.today.placeholder`
  - `TRACK_COPY.weekly.placeholder`
  - `TRACK_COPY.today.sampleRecord`
  - `TRACK_COPY.weekly.sampleRecord`
  - `CONTEXT_TAGS`
  - `RESULT_TAGS`

## 목표 파일 구조
- `src/data/workRecord/commonRecordTaxonomy.js`
  - 공통 협업/결과 태그
  - 공통 field label
  - 공통 helper copy
- `src/data/workRecord/jobExtensionRegistry.js`
  - `jobOntologyId -> presetKey`
- `src/data/workRecord/jobExtensions/product_management.js`
- `src/data/workRecord/jobExtensions/product_marketing.js`
- `src/data/workRecord/jobExtensions/hr_ops.js`
- `src/data/workRecord/jobExtensions/fpna.js`
- `src/data/workRecord/jobExtensions/product_design.js`
- `src/data/workRecord/workTypeCanonicalMap.js`
  - workType canonical id / alias 규칙

## 1차 구현 순서
1. data layer 파일 생성
2. PM preset을 `PmRecordInput.jsx` 밖으로 이동
3. `PmRecordInput.jsx`가 registry/preset을 읽도록 최소 변경
4. PM 동작 동일성 확인
5. PMM / HR Ops / FP&A / Product Design preset 추가
6. track별 sample/placeholder만 직무별로 분기

## QA 체크리스트
- PM 현재 동작이 그대로 유지되는가
- today / weekly track 차이가 유지되는가
- custom tag 추가/토글/삭제가 유지되는가
- job id가 없을 때 기본 PM 또는 default preset fallback이 안전한가
- 직무별 placeholder와 sample이 섞이지 않는가
- 공통 결과 구조는 유지되고 입력 preset만 바뀌는가

## 리스크 / 금지사항
- `App.jsx`에서 직무별 분기 로직을 크게 추가하지 말 것
- job ontology와 input taxonomy를 한 파일로 섞지 말 것
- PM 외 직무 preset을 한 라운드에 과하게 자세히 만들지 말 것
- scoring / analyzer / transition-lite 계층을 먼저 건드리지 말 것
- placeholder/sample이 해석 엔진 계약보다 앞서 과장되지 않게 유지할 것

## 가장 적은 수정으로 붙일 consumer 지점
- 1차 consumer는 `src/components/mvp/PmRecordInput.jsx`다.
- 2차 연결 지점은 `src/components/mvp/PmMvpView.jsx`다.
- 직무 선택값을 실제로 넘겨야 할 경우 `PmMvpView` 또는 상위에서 `jobOntologyId` prop 하나를 추가하는 방식이 최소 변경 경로다.

## 다음 라운드 최소 패치 범위
- `src/data/workRecord/commonRecordTaxonomy.js`
- `src/data/workRecord/jobExtensionRegistry.js`
- `src/data/workRecord/jobExtensions/product_management.js`
- `src/components/mvp/PmRecordInput.jsx`

이 순서가 맞는 이유:
- PM 동작을 깨지 않고 하드코딩만 바깥으로 빼는 첫 단계이기 때문이다.
