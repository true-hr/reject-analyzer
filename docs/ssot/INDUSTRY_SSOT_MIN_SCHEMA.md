# INDUSTRY SSOT Minimum Schema

## 목적

이 문서는 PASSMAP에서 산업 분류와 산업 해석 자산을 잠그기 위한 최소 SSOT 규격을 정의한다.
목표는 산업 대분류-중분류 표와 산업 특성 자산을 이후 Phase 2, 3, 4, 6, 8, 10에서 재사용 가능한 최소 구조로 고정하는 것이다.
이 문서는 현재 analyzer, decision, simulation, UI의 직접 실행 규격이 아니라 SSOT 문서다.

## SSOT 원칙

- 첨부된 산업 대분류-중분류 표를 산업 분류 SSOT로 본다.
- 미리 작성해 둔 산업 특성 코드를 해석 자산 SSOT 원재료로 본다.
- KSCO, 기존 산업 분류 코드, 기존 ontology, 기존 텍스트 분류 유산은 보조 힌트로만 본다.
- SSOT는 식별과 해석 자산의 기준을 잠그는 역할만 수행한다.
- 실행 로직, 점수화, 위험 계산은 SSOT 정의에 포함하지 않는다.

## 적용 범위

- industry registry item 정의
- 산업 canonical id에 연결될 최소 구조 정의
- 산업 inventory 분류 기준 정의
- 산업 해석 자산 수용 기준 정의

적용 제외:

- analyzer 직접 연결
- decision 규칙 연결
- simulation 출력 연결
- UI 렌더링 전용 스키마
- scoring / penalty 로직

## Industry Registry Item 최소 스키마

각 산업 item은 아래 최소 구조를 충족해야 한다.

```md
id: string
label: string
major: string
sub: string
aliases: string[]
marketType: string
operatingRhythm: string
decisionStructure: string
proofSignals: string[]
domainIntensity: string
adjacentIndustries: string[]
jobInteractionHints: JobInteractionHint[]
summaryTemplate: SummaryTemplate
```

## Required Fields

### `id`

- canonical 식별자
- 불변 값
- `CANONICAL_ID_RULES.md` 규칙을 따른다

### `label`

- 현재 대표 산업명
- 사람에게 읽히는 표시 이름
- 변경 가능하다

### `major`

- 산업 대분류
- 첨부된 산업 대분류-중분류 표의 대분류 값이어야 한다

### `sub`

- 산업 중분류
- 첨부된 산업 대분류-중분류 표의 중분류 값이어야 한다

### `aliases`

- 동의어, 대체 표기, 검색용 표현 집합
- canonical id를 대체하지 않는다

### `marketType`

- 시장 유형
- 예: B2B, B2C, B2B2C, 플랫폼형, 공공조달형

### `operatingRhythm`

- 운영 리듬
- 예: 장기 수주형, 반복 운영형, 캠페인형, 규제 대응형

### `decisionStructure`

- 의사결정 구조
- 예: 다층 승인형, 실무 주도형, 본사 집중형

### `proofSignals`

- 해당 산업에서 설득력 있게 작동하는 증거 신호 집합

### `domainIntensity`

- 산업 특수성 강도
- 범용 전이보다 도메인 이해가 얼마나 중요한지 설명하는 최소 값

### `adjacentIndustries`

- 인접 산업 목록
- 전이 가능성 또는 경계 설명의 기준으로 사용한다

### `jobInteractionHints`

- 직무 family와 산업 특성의 교차 힌트
- 최소 의미:
  - `jobFamily`
  - `hint`

예시 구조:

```md
- jobFamily: "marketing"
  hint: "브랜드보다 성과형 매체 운영 증거가 더 강하게 요구될 수 있다"
```

### `summaryTemplate`

- 해당 산업 설명의 최소 템플릿
- 최소 의미:
  - `oneLiner`
  - `expectationFocus`
  - `riskFocus`

예시 구조:

```md
oneLiner: "규모와 정확도가 중요한 고정밀 운영 산업"
expectationFocus: "프로세스 준수, 정확도, 장기 개선"
riskFocus: "도메인 맥락 없는 일반론"
```

## Optional Fields

다음 필드는 선택 필드다.

- `customerStructure`
- `regulationLevel`
- `marginStructure`
- `evidenceArtifacts`
- `talentMobilityHints`
- `boundaryNotes`

이 선택 필드들은 해석 자산을 풍부하게 만들기 위한 확장용이며, 최소 스키마 충족 조건은 아니다.

## Field Semantics Rules

- `major`와 `sub`는 분류표의 값과 직접 연결되어야 한다.
- `label`은 사람 친화적 이름이고, `id`는 식별자다.
- `aliases`는 탐색과 매칭 보조용이며, 식별 기준이 아니다.
- `marketType`, `operatingRhythm`, `decisionStructure`는 산업의 구조적 성격을 설명하는 최소 필드다.
- `proofSignals`는 산업 적합성을 설명하는 증거 신호 집합이다.
- `domainIntensity`는 산업 맥락이 얼마나 강하게 요구되는지 설명하는 필드다.
- `adjacentIndustries`는 인접한 산업 이동의 설명 기준이다.
- `jobInteractionHints`는 산업 자체가 아니라 산업-직무 접점을 설명하는 보조 자산이다.
- `summaryTemplate`는 요약 문구 자산이지 UI 최종 문자열 규약이 아니다.

## 금지 사항

- scoring 로직 포함 금지
- penalty 로직 포함 금지
- analyzer import 의존 구조 포함 금지
- UI 직접 렌더 전용 구조 포함 금지
- decision/risk 고정 규칙 포함 금지
- 텍스트 매칭 규칙을 SSOT처럼 승격하는 행위 금지
- 기존 heuristic keyword 세트를 산업 SSOT 본체처럼 문서화하는 행위 금지

## 최소 유효성 체크리스트

- `id`가 존재한다
- `label`이 존재한다
- `major`가 존재한다
- `sub`가 존재한다
- `aliases`가 배열이다
- `marketType`이 존재한다
- `operatingRhythm`이 존재한다
- `decisionStructure`가 존재한다
- `proofSignals`가 배열이다
- `domainIntensity`가 존재한다
- `adjacentIndustries`가 배열이다
- `jobInteractionHints`에 `jobFamily`, `hint`가 존재한다
- `summaryTemplate`에 `oneLiner`, `expectationFocus`, `riskFocus`가 존재한다
- 현재 analyzer / decision / UI 직접 연결 규격이 아니라는 전제가 유지된다

## Inventory 판정 기준

### Ready

- 최소 스키마 required fields가 모두 충족된다
- 분류표 기준 major/sub가 명확하다
- 해석 자산으로 재사용 가능한 품질을 가진다

### Partial

- major/sub 또는 산업 특성 필드 일부가 비어 있다
- canonical id 후보는 있으나 해석 자산이 부분적이다

### Raw Material

- 기존 산업 특성 코드, 메모, taxonomy 조각 등 원재료는 있으나
- 최소 스키마 item으로 정리되지 않았다

### Reject for Now

- 분류표와 직접 연결되지 않는다
- 산업 item이라기보다 점수 규칙, UI 문구, 임시 분기, 실험 코드에 가깝다

## 비고

- 이 문서는 Phase 1 잠금 문서다.
- 현재 analyzer, decision, simulation, UI에 직접 주입하는 명세가 아니다.
- 이후 Phase 2 이상에서 inventory 정리, 해석팩 생성, ontology 자산 연결 시 기준 문서로 재사용한다.
