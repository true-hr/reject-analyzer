# Canonical ID Rules

## 목적

이 문서는 PASSMAP의 job / industry SSOT에서 사용하는 canonical id 규칙을 잠그기 위한 문서다.
식별자 규칙을 먼저 고정해 두고, label 변경이나 aliases 확장은 이후 단계에서 안전하게 허용하는 것이 목적이다.

## 기본 원칙

- id는 불변이다.
- label은 변경 가능하다.
- aliases는 확장 가능하다.
- id는 식별자이지 UI 문구가 아니다.
- alias는 탐색용이며 id를 대체하지 않는다.
- 하나의 item은 하나의 canonical id만 가진다.

## Prefix 규칙

- job prefix = `JOB_`
- industry prefix = `IND_`

다른 prefix는 이 문서 범위 밖이다.

## Naming 형식 규칙

- 영문 대문자 + underscore만 사용한다.
- 공백 금지
- 하이픈 금지
- 특수문자 금지
- slash 금지
- 소문자 금지

허용 형식:

```md
JOB_BUSINESS_STRATEGY
JOB_TECHNICAL_SALES
IND_MANUFACTURING_SEMICONDUCTOR
IND_FINANCE_SECURITIES
```

## major / sub와 id 관계

- id는 `major`, `sub`를 안정적으로 식별할 수 있어야 한다.
- id는 분류표의 대분류-중분류 관계를 압축한 식별자여야 한다.
- `major`, `sub`가 수정되면 신규 item 검토 대상이 되며, 기존 id를 자동 변경하지 않는다.
- label 조정만으로 해결 가능한 경우 id는 유지한다.

예시:

- `major = BUSINESS`, `sub = STRATEGY` 라면 `JOB_BUSINESS_STRATEGY`
- `major = MANUFACTURING`, `sub = SEMICONDUCTOR` 라면 `IND_MANUFACTURING_SEMICONDUCTOR`

## label / aliases 규칙

- `label`은 대표 표시 이름이다.
- `aliases`는 다른 표현, 띄어쓰기 차이, 약어, 검색 표현을 흡수한다.
- label이 바뀌어도 canonical id는 유지한다.
- 여러 표현은 aliases로 흡수하고, id를 추가 생성하지 않는다.

예시:

```md
id: JOB_BUSINESS_STRATEGY
label: 사업전략
aliases:
- 전략기획
- 경영전략
- 사업 기획 전략
```

## 1 item = 1 canonical id 원칙

- 하나의 item은 하나의 canonical id만 가진다.
- 표현 변형, 유사 문구, 약어 차이는 aliases로 처리한다.
- 동일 의미를 여러 id로 쪼개는 것은 금지한다.
- 반대로 의미가 다른데 하나의 id로 억지 통합하는 것도 금지한다.

## 분류표와 자산의 관계

- 분류표는 `major / sub`의 SSOT다.
- 해석 자산은 해당 canonical id에 연결되는 보조 자산이다.
- id는 분류표를 기준으로 부여하고, 자산은 그 id 아래에 연결한다.
- label이나 alias는 자산 편의를 위해 바뀔 수 있지만, id는 기준점으로 고정된다.

## 금지 규칙

- UI 문구를 그대로 id로 사용하는 행위 금지
- 한글 id 금지
- 소문자 id 금지
- 하이픈 포함 id 금지
- slash 포함 id 금지
- score나 fit 의미를 id에 섞는 행위 금지
- 상태값이나 해석결과를 id에 붙이는 행위 금지

금지 예시:

- `JOB_전략기획`
- `job_business_strategy`
- `JOB-BUSINESS-STRATEGY`
- `JOB_BUSINESS/STRATEGY`
- `JOB_STRATEGY_HIGHFIT`

## 추천 분화 기준

- 분류표의 `major / sub`가 명확히 다르면 id를 분리한다.
- 실제 역할 의미가 다르고 aliases로 흡수하기 어려우면 id를 분리한다.
- 단순 표현 차이, 띄어쓰기 차이, 약어 차이는 aliases로 흡수한다.
- 점수나 평가 결과에 따라 id를 분화하지 않는다.

## Inventory 체크 규칙

- 분류표의 `major / sub`가 확정되어 있는가
- id가 prefix 규칙을 따르는가
- id가 대문자+underscore 형식만 사용하는가
- label이 존재하는가
- aliases로 표현 변형을 충분히 흡수할 수 있는가
- 동일 의미에 여러 id가 생기지 않았는가
- label 변경과 id 변경을 혼동하지 않았는가

## 비고

- 이 문서는 Phase 1 잠금 문서다.
- 현재 analyzer, decision, simulation, UI에 직접 연결되는 규약이 아니다.
- 이후 job / industry registry 작성과 inventory 정리에 공통 기준으로 사용한다.
