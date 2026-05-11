# PASSMAP Required Condition Resolution Policy

> 버전: 1.0.0  
> 상태: 확정(Locked)  
> 위치: docs/ — SSOT 정책 문서  
> 상위 문서: `PASSMAP_GATE_AI_DECISION_POLICY.md`

---

## 1. 문서 목적

`PASSMAP_GATE_AI_DECISION_POLICY.md`가 gate / risk / AI 해석의 **상위 철학**을 고정했다면, 이 문서는 rule 결과와 AI 결과를 **엔진 안에서 어떻게 결합할지**를 고정한다.

목적은 rule-based 사실과 AI-based 해석을 섞지 않고, **최종 판정을 별도 계층에서 안정적으로 만드는 것**이다.

이 문서는 향후 다음 고도화 작업과 AI Required Condition Interpreter 연결의 **기준**이 된다:
- `REQUIRED_LANGUAGE`
- `REQUIRED_TOOL_OR_TECH`
- `REQUIRED_EXPERIENCE`
- `REQUIRED_YEARS`

---

## 2. 핵심 결론

1. AI 결과를 `requiredGateSignals` 안에 넣지 않는다.
2. AI 결과는 별도 `requiredConditionInterpretations`에 둔다.
3. 룰 결과와 AI 결과를 합치는 전용 최종 판정 계층 `requiredConditionResolutions`를 둔다.
4. 장기적으로 gate / risk / question producer는 `requiredConditionResolutions`를 읽는 방향이 맞다.
5. 단, 기존 룰 gate의 점진 전환을 위해 초기에는 기존 gate가 `requiredGateSignals`를 계속 읽을 수 있다.

---

## 3. 세 객체의 역할

| 객체 | 성격 | 설명 |
|---|---|---|
| `requiredGateSignals` | 룰 사실 | 룰이 안정적으로 추출한 구조화 사실. deterministic. AI 없이도 존재. |
| `requiredConditionInterpretations` | AI 해석 원본 | AI가 읽은 조건별 해석 결과. 확률, 근거, ambiguity를 포함하는 원본 해석 결과. |
| `requiredConditionResolutions` | 최종 판정 | 룰과 AI를 정책적으로 결합한 최종 판정. 최종 status, output layer, dominant source, suppression metadata를 가짐. |

---

## 4. 왜 `requiredGateSignals`에 AI 결과를 섞지 않는가

- 확정 사실과 해석 결과가 섞인다.
- 디버깅이 어려워진다.
- AI 미호출 / 실패 시 계약이 흔들린다.
- deterministic QA와 AI QA를 분리하기 어렵다.
- 기존 gate가 `requiredGateSignals`를 안정적 사실로 전제하고 읽는 구조와 충돌한다.

---

## 5. 권장 데이터 흐름

```
JD / Resume
  → rule extractors
  → requiredGateSignals

JD / Resume
  → AI Required Condition Interpreter
  → requiredConditionInterpretations

requiredGateSignals + requiredConditionInterpretations
  → Required Condition Resolver
  → requiredConditionResolutions
  → gate / hard risk / question / suppression layer
```

**원칙:**
- gate와 risk producer가 AI 원본 결과(`requiredConditionInterpretations`)를 직접 읽지 않는다.
- 반드시 resolver를 거친 최종 판정(`requiredConditionResolutions`)을 읽는다.

---

## 6. Rule authority model

룰의 권한 수준은 두 단계로 구분한다.

| 권한 수준 | 정의 |
|---|---|
| `decisive` | 그 룰만으로 해당 요건의 충족/미충족을 안정적으로 판정할 수 있음 |
| `supporting` | 참고 신호는 되지만 그 자체로 최종 판정을 내리기엔 부족함 |

### decisive 예시

- 학사 이상 필수
- 산업안전기사 필수
- TOEIC 800 이상 필수

### supporting 예시

- Python 문자열 없음
- B2B 키워드 없음
- 경험 항목명 불일치

**원칙:**
- `decisive rule`은 AI가 뒤집지 못한다.
- `supporting rule`은 AI가 보완하거나 약화할 수 있다.

---

## 7. Rule vs AI 충돌 처리 원칙

### 7-1. decisive rule일 때

| rule 판정 | AI 판정 | 최종 판정 |
|---|---|---|
| satisfied | unsatisfied | rule satisfied 유지 |
| unsatisfied | satisfied | rule unsatisfied 유지 |
| unsatisfied | unsatisfied | unsatisfied |
| satisfied | satisfied | satisfied |

### 7-2. supporting rule일 때

| rule 상태 | AI 판정 | 최종 판정 |
|---|---|---|
| missing signal | strong satisfied evidence | AI가 보완 가능 |
| missing signal | high-confidence unsatisfied | unsatisfied 가능 |
| missing signal | ambiguous | question / hard risk |
| present signal | weak substantive evidence | AI가 약화 판단 가능 |

---

## 8. low-confidence AI 결과 처리

### 전역 기본 정책

| 조건 | 허용 output layer |
|---|---|
| `confidence >= 0.90` + no ambiguity + explicit required | gate 후보 가능 |
| `0.75 <= confidence < 0.90` | gate 금지, 기본 hard risk 후보 |
| `confidence < 0.75` | gate 금지, 기본 question 또는 coaching |
| `ambiguity.hasAmbiguity === true` | gate 금지 |
| `resume_omission_possible` | question 우선 |
| `preferred` | gate 금지 |

### 조건군별 추가 제약

| 조건군 | 추가 제약 |
|---|---|
| 정형 언어 (TOEIC/OPIc/JLPT/HSK) | gate 가능 |
| 정성 언어 (비즈니스 영어 등) | 초기 구현에서는 gate 승격 기본 금지, hard risk 우선 |
| 툴/기술 | exact tool + 강한 근거 부재일 때만 제한적 gate 후보 |
| 필수 경험 | 초기 구현에서는 AI 단독 gate 금지, hard risk 우선 |
| 관련경력 연차 | AI 관련도 + 룰 기간 계산 결합 시만 gate 후보 |

---

## 9. suppression 정책

- suppression은 각 producer 안에서 흩어져 처리하지 않고, **resolver 또는 그 직후의 중앙 계층**에서 처리한다.
- 같은 사실 중복 출력 방지를 위해 `conditionKey`와 `topicKey`를 분리한다.

| 키 | 정의 |
|---|---|
| `conditionKey` | 정확히 같은 요구조건인지 식별 |
| `topicKey` | 같은 주제군인지 식별 |

### 예시

- `conditionKey`: `required_language:english:toeic:gte:800`
- `topicKey`: `language:english`

### dominance 규칙

- 같은 `conditionKey` 안에서는 `gate > hard risk > context risk > coaching` 순으로 우선
- 같은 `topicKey`라도 `conditionKey`가 다르면 자동 suppress하지 않는다.

---

## 10. `requiredConditionResolutions` 개념 스키마

아래는 개념 수준 정의이며 구현 코드가 아니다.

| 필드 | 설명 |
|---|---|
| `conditionKey` | 조건 고유 식별자 |
| `topicKey` | 주제군 식별자 |
| `conditionType` | 조건 유형 (language / certification / experience 등) |
| `requirement` | 요건 요약 (source, normalized text 포함) |
| `ruleAssessment.status` | 룰 판정 결과 (satisfied / unsatisfied / unknown) |
| `ruleAssessment.authority` | 룰 권한 수준 (decisive / supporting) |
| `ruleAssessment.reason` | 룰 판정 근거 |
| `aiAssessment.status` | AI 판정 결과 (satisfied / unsatisfied / unknown) |
| `aiAssessment.confidence` | AI 신뢰도 (0.0 ~ 1.0) |
| `aiAssessment.hasAmbiguity` | AI 모호성 존재 여부 |
| `aiAssessment.reason` | AI 판정 근거 |
| `finalAssessment.status` | 최종 판정 (satisfied / unsatisfied / unknown) |
| `finalAssessment.outputLayer` | 최종 출력 계층 (gate / hard_risk / context_risk / question / coaching) |
| `finalAssessment.dominantSource` | 판정을 주도한 근거 (rule / ai / combined) |
| `finalAssessment.reason` | 최종 판정 근거 |
| `suppression.suppressesConditionKeys` | 이 resolution이 억제하는 다른 conditionKey 목록 |
| `suppression.mayOverlapTopicKeys` | 겹칠 수 있는 topicKey 목록 |

**참고:**
- AI 원본 해석은 `requiredConditionInterpretations`에 남고,
- resolution은 최종 판정만 담는다.

---

## 11. PR #233에 대한 현재 의미

- PR #233의 역할은 언어 정형 신호를 **룰 쪽에서 생산하는 선행 기반**이다.
- `test / score / level / mode` 보존과 `languages.matched / missing` 계산은 이 문서의 구조와 충돌하지 않는다.
- 다만 #233 이후 곧바로 `REQUIRED_LANGUAGE` gate로 직결해서는 안 된다.
- #233의 해석은 "룰 신호 생산층"까지이며, gate 승격은 resolver 정책 이후의 문제다.

---

## 12. 이번 문서에서 아직 확정하지 않는 후속 설계

아래 사항은 이번 문서에서 결정하지 않는다. 별도 설계 세션에서 다룬다.

- `conditionKey` 생성 규칙의 정확한 포맷
- `topicKey` 일반화 범위
- `requiredConditionResolutions`를 실제 어느 파일 / 함수에서 생성할지
- 기존 gate들을 언제부터 resolution 기반으로 전환할지
- context risk와 preferred risk의 UI 구분 방식
- PR #233을 지금 바로 머지할지, 문서 반영 후 머지할지
- resolver를 먼저 만들지, #233을 먼저 머지할지

---

## 13. 현재 마스터 순서표상 위치

| 단계 | 상태 |
|---|---|
| 1단계: 판정 철학 고정 | 완료 |
| 조건군별 책임 분해 / gate 승격 정책 | 완료 |
| AI와 규칙의 접점 설계 | 완료 |
| 다음: 접점 설계의 세부 결정 (conditionKey / topicKey 생성 규칙, resolution 생성 위치, 기존 gate와의 이행 전략) | 미착수 |
| 아직 금지: `REQUIRED_LANGUAGE`, `REQUIRED_TOOL_OR_TECH`, `REQUIRED_EXPERIENCE` 구현으로 바로 진입 | — |
| 아직 금지: AI 해석 결과를 `requiredGateSignals` 안에 섞는 구현 | — |
