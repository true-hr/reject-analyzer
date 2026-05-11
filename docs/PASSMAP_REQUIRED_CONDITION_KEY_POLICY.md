# PASSMAP Required Condition Key Policy

> 버전: 1.0.0  
> 상태: 확정(Locked)  
> 위치: docs/ — SSOT 정책 문서  
> 상위 문서:
> - `PASSMAP_GATE_AI_DECISION_POLICY.md` (판정 철학)
> - `PASSMAP_REQUIRED_CONDITION_RESOLUTION_POLICY.md` (rule/AI 결합 흐름)

---

## 1. 문서 목적

- `conditionKey`는 정확히 같은 요구조건인지 식별하기 위한 키다.
- `topicKey`는 사용자 관점에서 같은 주제군인지 식별하기 위한 키다.
- 이 두 키는 resolver 매칭, dominance, suppression의 기준이 된다.
- 이 문서는 기존 `PASSMAP_REQUIRED_CONDITION_RESOLUTION_POLICY.md`의 세부 식별자 정책을 고정한다.

---

## 2. 핵심 결론

1. `conditionKey`는 최종 출력 이름이 아니라 **요구조건 자체의 정체성**을 표현한다.
2. `topicKey`는 같은 **주제군**을 표현한다.
3. 기본 포맷:
   - `conditionKey = <scope>:<conditionType>:<subject>:<constraint...>`
   - `topicKey = <conditionType>:<subject>`
4. 자동 suppression은 기본적으로 **같은 `conditionKey` 안에서만** 적용한다.
5. 같은 `topicKey`는 중복 가능성 점검용이며 **자동 suppression 조건이 아니다.**

---

## 3. `conditionKey`와 `topicKey`의 역할 차이

| 키 | 역할 | 예시 |
|---|---|---|
| `conditionKey` | 정확히 같은 요구조건인지 식별 | `required:language:english:toeic:gte:800` |
| `topicKey` | 사용자 입장에서 같은 주제군인지 식별 | `language:english` |

**예시로 이해하기:**
- `TOEIC 800 필수`와 `TOEIC 900 필수`는 같은 topic이지만 **다른 condition**이다.
- `TOEIC 800 필수`와 `해외영업에서 영어 근거 약함`은 같은 topic이지만 **다른 condition**이다.

---

## 4. `conditionKey` 기본 포맷

```
<scope>:<conditionType>:<subject>:<constraint...>
```

| 세그먼트 | 정의 | 예시 값 |
|---|---|---|
| `scope` | 조건의 필수성 범위 | `required`, `preferred`, `context` |
| `conditionType` | 조건 유형 | `language`, `certification`, `major`, `major_cluster`, `education`, `tool`, `experience`, `years` |
| `subject` | 정규화된 조건 대상 | `english`, `industrial_safety_engineer`, `python` 등 |
| `constraint` | 비교 연산자, 레벨, 목표값 등 | `toeic:gte:800`, `exists`, `gte:bachelor` 등 |

**원칙:**
- `scope`는 반드시 포함한다.
- 같은 TOEIC 800이라도 필수와 우대는 **같은 condition이 아니다.**

**예시:**
- `required:language:english:toeic:gte:800`
- `preferred:language:english:toeic:gte:800`
- `required:certification:industrial_safety_engineer:exists`

---

## 5. `conditionKey`에 넣지 않는 것

다음은 조건 정체성이 아니라 판정 결과, 출력 계층, 원문 위치, 또는 메타데이터이므로 `conditionKey`에 포함하지 않는다.

| 제외 항목 | 이유 |
|---|---|
| `missing`, `matched`, `unsatisfied` | 판정 결과 |
| `gate`, `hard_risk`, `context_risk` | 출력 계층 |
| raw text 전체 | 원문 — 동일 조건이 표현만 다를 수 있음 |
| source line number | 원문 위치 |
| AI confidence | 메타데이터 |
| gate profile ID | 출력 ID |

**나쁜 예 (conditionKey로 사용하면 안 됨):**
- `GATE__REQUIRED_CERT_MISSING` — gate 출력 ID
- `missing_english` — 판정 결과 포함
- `jd_line_12_toeic_800` — source 위치 포함

**좋은 예:**
- `required:certification:industrial_safety_engineer:exists`
- `required:language:english:toeic:gte:800`

---

## 6. 조건군별 권장 포맷

### 6-1. 언어

| conditionKey | topicKey |
|---|---|
| `required:language:english:toeic:gte:800` | `language:english` |
| `required:language:japanese:jlpt:gte:n1` | `language:japanese` |
| `required:language:chinese:hsk:gte:5` | `language:chinese` |
| `required:language:english:opic:gte:ih` | `language:english` |
| `required:language:english:qualitative:gte:business` | `language:english` |

### 6-2. 자격증

| conditionKey | topicKey |
|---|---|
| `required:certification:industrial_safety_engineer:exists` | `certification:industrial_safety_engineer` |
| `required:certification:registered_nurse_license:exists` | `certification:registered_nurse_license` |
| `required:certification:social_worker_level_2:exists` | `certification:social_worker_level_2` |

**원칙:** alias가 달라도 canonical certification id는 같아야 한다.

### 6-3. 학력

| conditionKey | topicKey |
|---|---|
| `required:education:degree:gte:bachelor` | `education:degree` |
| `required:education:degree:gte:master` | `education:degree` |

### 6-4. 전공

| conditionKey | topicKey |
|---|---|
| `required:major:mechanical_engineering:exists` | `major:mechanical_engineering` |
| `required:major:nursing:exists` | `major:nursing` |
| `required:major_cluster:engineering:exists` | `major_cluster:engineering` |
| `required:major_cluster:computer_related:exists` | `major_cluster:computer_related` |

**원칙:** `기계공학 필수`와 `이공계 필수`는 **같은 condition이 아니다.**

### 6-5. 툴 / 기술

| conditionKey | topicKey |
|---|---|
| `required:tool:python:exists` | `tool:python` |
| `required:tool:sap:exists` | `tool:sap` |
| `required:tool:autocad:exists` | `tool:autocad` |
| `required:tool:python:proficiency:gte:working` | `tool:python` |
| `required:tool:sql:proficiency:gte:advanced` | `tool:sql` |

**원칙:** `Python 필수`와 `Python 숙련 필수`는 같은 topic이지만 **다른 condition**이다.

### 6-6. 필수 경험

| conditionKey | topicKey |
|---|---|
| `required:experience:cra:exists` | `experience:cra` |
| `required:experience:b2b_saas_sales:exists` | `experience:b2b_saas_sales` |
| `required:experience:overseas_regulatory_affairs:exists` | `experience:overseas_regulatory_affairs` |
| `required:experience:factory_procurement:exists` | `experience:factory_procurement` |

**원칙:** experience key는 장기적으로 canonical experience ontology에 붙어야 한다. 그 전까지는 AI 단독 gate를 금지한다는 기존 정책과 일치한다.

### 6-7. 관련경력 연차

| conditionKey | topicKey |
|---|---|
| `required:years:total_experience:gte:3y` | `years:total_experience` |
| `required:years:related_experience:gte:3y` | `years:related_experience` |
| `required:years:cra_experience:gte:2y` | `years:cra_experience` |
| `required:years:b2b_sales_experience:gte:5y` | `years:b2b_sales_experience` |

**원칙:** 총경력과 관련경력은 반드시 분리한다.

---

## 7. 한 문장에서 여러 condition이 나올 수 있음

**예시 JD 문장:**
> "영어 능통자 및 TOEIC 850 이상 필수"

**생성되는 conditionKey:**
- `required:language:english:qualitative:gte:fluent`
- `required:language:english:toeic:gte:850`

두 조건 모두 `topicKey = language:english`를 공유한다.

**원칙:**
- 한 문장이어도 조건은 여러 개일 수 있다.
- suppression은 **조건 단위**로 해야 한다.

---

## 8. 키 생성 시점과 중앙화 원칙

- 키는 가능한 한 조건 정규화 직후 **초기에 생성**한다.
- 룰 쪽에서는 JD 정형 조건 구조화 직후 생성한다.
- AI 쪽에서도 **같은 canonicalization 규칙**으로 생성한다.
- 룰과 AI가 같은 조건을 다른 키로 만들지 않도록 **공통 canonicalization 규칙**이 필요하다.
- key 생성 로직은 개별 extractor나 AI prompt에 흩어두지 않는다.
- 장기적으로 **공통 유틸 / resolver 인접 계층**에서 중앙화해야 한다.

**개념 헬퍼 이름 (구현 위치 미결정):**
- `normalizeRequiredCondition()`
- `buildRequiredConditionKeys()`

---

## 9. `topicKey`의 일반화 범위

- 너무 좁으면 같은 주제가 흩어진다.
- 너무 넓으면 다른 주제가 섞인다.
- 권장 범위는 **`conditionType + canonical subject`** 까지다.

| 분류 | 예시 |
|---|---|
| 권장 (good) | `language:english`, `certification:industrial_safety_engineer`, `tool:python`, `experience:b2b_saas_sales`, `years:related_experience` |
| 너무 좁음 (bad) | `language:english:toeic`, `language:english:business` |
| 너무 넓음 (bad) | `language` |

---

## 10. suppression과의 관계

- 같은 `conditionKey` 안에서는 기본 dominance: **`gate > hard risk > context risk > coaching`**
- 같은 `topicKey`라도 `conditionKey`가 다르면 **자동 suppress하지 않는다.**
- `topicKey`는 반복 가능성 점검용 메타이며, 자동 억제의 직접 조건이 아니다.

**예시 A — 같은 conditionKey, 다른 output layer:**

| 항목 | 값 |
|---|---|
| condition 1 | `TOEIC 800 필수 gate` (conditionKey: `required:language:english:toeic:gte:800`) |
| condition 2 | `TOEIC 800 미달 hard risk` (conditionKey: `required:language:english:toeic:gte:800`) |
| 결과 | 같은 conditionKey → 하위 계층(hard risk) suppress |

**예시 B — 같은 topicKey, 다른 conditionKey:**

| 항목 | 값 |
|---|---|
| condition 1 | `TOEIC 800 필수 gate` (conditionKey: `required:language:english:toeic:gte:800`) |
| condition 2 | `해외영업에서 영어 근거 약함 context risk` (conditionKey: `context:language:english:evidence:weak`) |
| 결과 | 같은 topicKey(`language:english`)지만 다른 conditionKey → 자동 suppression 없음 |

---

## 11. 현재 코드와의 연결 의미

- 기존 gate profile ID는 **출력 ID**이지 condition identity가 아니다.
- 예를 들어 `GATE__REQUIRED_CERT_MISSING`은 실제로 여러 개별 자격증 조건을 품을 수 있다.
- PR #233은 언어 조건에 `test / score / level / mode`를 보존하기 시작했기 때문에, 언어 key 생성 기반과 잘 맞는다.
- 이후 중앙 suppression과 resolver 매칭은 **gate profile ID가 아니라 condition identity 기준**으로 가야 한다.

---

## 12. 이번 문서에서 아직 확정하지 않는 후속 설계

아래 사항은 이번 문서에서 결정하지 않는다. 별도 설계 세션에서 다룬다.

- canonical subject dictionary를 어디까지 먼저 만들지
- 문자열 key 생성 시 separator / escaping 세부 규칙
- 정성 조건 level 체계 (`qualitative:gte:business` 등)의 최종 canonical vocabulary
- experience ontology를 언제 만들지
- key를 실제 어느 파일 / 함수에서 생성할지
- 기존 gate를 언제 resolution 기반으로 이행할지

---

## 13. 현재 마스터 순서표상 위치

| 단계 | 상태 |
|---|---|
| 판정 철학 고정 | 완료 |
| 조건군별 책임 분해 / gate 승격 정책 | 완료 |
| AI와 규칙의 접점 설계 | 완료 |
| conditionKey / topicKey 정책 | 완료 |
| 다음: resolution 생성 위치 설계 | 미착수 |
| 다음: 기존 gate 이행 전략 설계 | 미착수 |
| 아직 금지: `REQUIRED_LANGUAGE`, `REQUIRED_TOOL_OR_TECH`, `REQUIRED_EXPERIENCE` 구현으로 바로 진입 | — |
| 아직 금지: gate profile ID를 condition identity처럼 사용하는 구현 | — |
| 아직 금지: AI 해석 결과를 `requiredGateSignals`에 섞는 구현 | — |
