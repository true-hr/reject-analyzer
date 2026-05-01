# Axis Explanation Output Contract

## 문서 목적

이 문서는 5축 설명이 어떤 구조로 생성되고 내려와야 하는지에 대한 출력 계약(SSOT)을 정의한다.
목표는 축 설명을 점수 장식 문장이 아니라 점수 해석 결과물로 고정하는 것이다.

## 1. 축 설명의 역할

각 축 설명은 최소한 아래 질문에 답해야 한다.

- 이 축은 무엇을 보는가
- 내 입력 중 어떤 근거가 반영되었는가
- 왜 현재 점수가 나왔는가
- 무엇이 제한 요인이며, 무엇이 추가되면 상승할 수 있는가

## 2. 축 설명 출력 원칙

각 축 설명은 아래 원칙을 따른다.

- 설명은 producer에서 생성한다
- UI는 설명을 생성하지 않고 렌더만 한다
- 설명은 score/band와 불일치하면 안 된다
- 설명은 raw input 나열이 아니라 explanation-ready evidence에 기반해야 한다
- 설명은 축별 고유 질문을 반영해야 하며, 다른 축과 중복 서술을 피해야 한다

## 3. explanationCard 필수 구조

각 축은 최소 아래 구조를 가진 explanationCard를 내려야 한다.

```json
{
  "axisKey": "jobFit",
  "score": 3,
  "band": "mid",
  "explanation": {
    "available": true,
    "lead": "",
    "criteria": "",
    "scoreReason": "",
    "liftOrLimit": ""
  }
}
```

## 4. explanation 필드 정의

### 4-1. lead

첫 판정문.
사용자의 핵심 입력 근거를 축 관점에서 요약해야 한다.

예:

- `[컴퓨터공학]` 전공은 `[개발]` 직무와 기본 연결성이 있습니다.
- `[인사]` 인턴 경험은 목표 직무와 직접 닿는 실무 근거로 볼 수 있습니다.

### 4-2. criteria

이 축이 무엇을 보는지 설명해야 한다.
단순 반복이 아니라, 왜 특정 input이 중요한지 드러내야 한다.

예:

- 다만 이 축에서는 전공명 자체뿐 아니라 실제 프로젝트 역할 경험도 함께 봅니다.

### 4-3. scoreReason

왜 현재 점수가 나왔는지 직접 설명해야 한다.
반드시 현재 점수의 제한/보완 논리가 포함되어야 한다.

예:

- 현재 입력 기준에서는 프로젝트 역할 근거가 제한적이어서 3점으로 읽혔습니다.

### 4-4. liftOrLimit

상승 조건 또는 제한 요인을 설명해야 한다.
행동 가능성이 있되, 근거 없는 낙관 문장은 금지한다.

예:

- 직접 구현 프로젝트나 관련 인턴 역할이 추가되면 더 높은 점수로 올라갈 수 있습니다.

## 5. 필수/선택 규칙

필수

- lead
- criteria
- scoreReason
- liftOrLimit

선택

- primaryPositiveEvidence
- primaryLimitingEvidence
- secondaryEvidence
- usedInputTypes
- fallbackReason

## 6. evidence 연결 슬롯

QA와 디버깅을 위해 explanationCard 바깥 또는 내부에 아래 evidence reference를 둘 수 있다.

```json
{
  "primaryPositiveEvidence": {},
  "primaryLimitingEvidence": {},
  "secondaryEvidence": [],
  "usedInputTypes": ["major", "project"]
}
```

이 슬롯은 UI 직접 노출용이 아니라 producer/QA 검증용이다.

## 7. 본문 / 상세보기 분리

본문

- 3~4문장
- 사용자가 바로 점수를 납득할 수 있어야 함
- 과도한 근거 나열 금지

상세보기

- 대표 근거의 세부 내용
- 어떤 입력이 어떤 축 속성으로 반영되었는지
- 본문 반복 금지

## 8. unavailable / fallback 정책

설명 생성이 불완전할 경우 아래 구조를 허용한다.

```json
{
  "explanation": {
    "available": false,
    "fallbackReason": "insufficient_project_evidence"
  }
}
```

단, fallback은 예외이며 기본 경로가 되어선 안 된다.

## 9. 금지 규칙

- score와 어긋나는 과장 표현 금지
- 모든 축이 비슷한 문장 구조로 복붙되는 상태 금지
- UI에서 score를 재해석해서 문장 조립하는 행위 금지
- raw input dump를 explanation으로 간주하는 것 금지

## 10. 출력 계약 완료 기준

아래 조건을 모두 만족해야 이 계약이 잠긴 것으로 본다.

- explanationCard 필드가 고정됨
- 필수/선택 필드가 구분됨
- 본문/상세보기 역할이 분리됨
- fallback 정책이 정의됨
- producer/UI 책임이 분리됨
