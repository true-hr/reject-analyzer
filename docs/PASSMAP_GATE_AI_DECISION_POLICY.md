# PASSMAP Gate & AI Decision Policy

> 버전: 1.0.0  
> 상태: 확정(Locked)  
> 위치: docs/ — SSOT 정책 문서

---

## 1. 문서 목적

이 문서는 PASSMAP 서류탈락 분석에서 **gate / risk / AI 해석의 경계를 고정**한다.

목적은 룰을 끝없이 늘리는 것이 아니라, **규칙이 확정할 수 있는 것과 AI가 해석해야 하는 것을 분리**하는 것이다.

이 문서는 이후 다음 고도화 작업의 **상위 기준**이 된다:
- `REQUIRED_LANGUAGE`
- `REQUIRED_TOOL_OR_TECH`
- `REQUIRED_EXPERIENCE`
- `REQUIRED_YEARS`

---

## 2. 판정 결과의 4층 구조

| 계층 | 정의 |
|---|---|
| **Gate** | JD에 명시된 필수조건이고, 미충족 시 서류 진입 자체가 어려울 가능성이 높은 조건 |
| **Hard Risk** | 명시적 필수는 아니거나 해석이 복잡하지만, 채용 가능성을 크게 낮추는 핵심 리스크 |
| **Context Risk** | JD에 필수라고 안 써도 직무/산업상 중요한 조건 |
| **Coaching / 참고정보** | 탈락 원인이라기보다 보완점, 질문 제안, 표현 개선 포인트 |

---

## 3. Gate 인정 기준

Gate는 아래 **4가지를 모두 만족**해야 한다.

1. JD에 명시적 필수로 적혀 있다.
2. 후보자 충족 여부를 상당히 안정적으로 판정할 수 있다.
3. 실제 서류 단계에서 컷으로 작동할 가능성이 높다.
4. 같은 사실이 더 상위의 다른 gate로 이미 설명되고 있지 않다.

**주의사항:**
- "중요해 보인다"는 이유만으로 gate가 되어서는 안 된다.
- JD 비명시 시장 맥락 조건은 gate가 아니라 **context risk**다.

---

## 4. 규칙이 맡을 일 vs AI가 맡을 일

| 규칙(Rule)이 맡을 것 | AI가 맡을 것 |
|---|---|
| 이미 구조화된 값의 비교 | JD 문장의 의미 해석 |
| 숫자/등급이 명확한 조건 | 필수 / 우대 / 사실상 중요 조건 구분 |
| 동일 사실 중복 억제 | 표현 변형 통합 |
| gate 발동 금지 조건 | 이력서 경험이 요구조건을 사실상 충족하는지 해석 |
| 최종 dominance / 노출 우선순위 | 직무/산업 맥락상 중요도 판단 |
| 날짜/기간 계산 | 근거 문장, confidence, ambiguity 반환 |
| 최종 점수 반영 규칙 | 관련경력의 실질 관련도 판독 |

**원칙:**
- 규칙은 **확정 가능한 사실을 판정**하고, AI는 **의미를 해석**한다.
- AI는 gate 후보를 제안할 수는 있지만, **gate를 단독으로 확정하지 못한다.**

---

## 5. AI가 보조할 수 있지만 gate 승격은 금지인 것

다음에 해당하는 경우 AI 해석 결과를 gate로 올려서는 안 된다.

- JD에 명시되지 않은 시장 맥락 조건
- 우대조건
- 회사 내부 선호 추정
- 후보자 보유 여부가 이력서 누락인지 실제 미보유인지 불분명한 조건
- AI confidence가 낮은 해석
- 근거 없는 "직무상 중요해 보임" 판단

---

## 6. AI Required Condition Interpreter 공통 출력 스키마

AI 해석 결과를 gate / risk / coaching 계층에 넘기기 위한 공통 인터페이스 설계.  
아래는 개념 수준 정의이며, 구현 코드가 아니다.

### 6-1. 스키마 필드 목록

| 필드 그룹 | 필드명 | 설명 |
|---|---|---|
| (루트) | `conditionType` | 조건 유형 (language / certification / experience / years 등) |
| (루트) | `explicitness` | 명시성 수준 (explicit_required / preferred / contextual / unknown) |
| `requirement` | `rawText` | JD 원문 |
| `requirement` | `normalizedText` | 정규화된 요건 텍스트 |
| `requirement` | `sourceQuote` | 근거 원문 인용 |
| `requirement` | `sourceSection` | 출처 섹션 (자격요건 / 우대 / 책임 등) |
| `requirement` | `comparator` | 비교 연산자 (gte / eq / exists 등) |
| `requirement` | `targetValue` | 목표값 (800, IH, N1 등) |
| `requirement` | `targetUnit` | 단위 (score / level / 년 등) |
| `candidateEvidence[]` | `rawText` | 이력서 원문 |
| `candidateEvidence[]` | `normalizedText` | 정규화된 이력서 텍스트 |
| `candidateEvidence[]` | `sourceQuote` | 이력서 근거 인용 |
| `candidateEvidence[]` | `evidenceType` | 근거 유형 (direct / inferred / absent 등) |
| `candidateEvidence[]` | `strength` | 근거 강도 (strong / moderate / weak / none) |
| `evaluation` | `likelySatisfied` | 충족 여부 판단 (true / false / unknown) |
| `evaluation` | `confidence` | 판단 신뢰도 (0.0 ~ 1.0) |
| `evaluation` | `reason` | 판단 근거 자연어 설명 |
| `evaluation` | `satisfactionMode` | 충족 방식 (rule / ai_inferred / ambiguous) |
| `ambiguity` | `hasAmbiguity` | 모호성 존재 여부 |
| `ambiguity` | `flags` | 모호성 플래그 목록 |
| `ambiguity` | `note` | 모호성 설명 |
| `gatePolicy` | `gateCandidate` | gate 후보 여부 |
| `gatePolicy` | `gateCandidateReason` | gate 후보 판단 근거 |
| `gatePolicy` | `recommendedOutputLayer` | 권고 출력 계층 (gate / hard_risk / context_risk / coaching) |

### 6-2. 각 그룹이 필요한 이유

| 그룹 | 필요 이유 |
|---|---|
| `explicitness` | 필수 / 우대 / 맥락 조건을 분리하여 gate 승격 조건 판단에 사용 |
| `requirement` | AI가 공고의 어떤 문장을 읽었는지 추적하고 재현 가능성 확보 |
| `candidateEvidence` | 후보자 근거의 강함·약함·부재를 명시적으로 분리 |
| `evaluation` | 결론(likelySatisfied)과 판정 방식(satisfactionMode)을 분리하여 과신 방지 |
| `ambiguity` | 신뢰도 낮은 해석의 gate 승격을 차단하기 위한 명시적 플래그 |
| `gatePolicy` | gate / risk / question 계층으로 넘기기 위한 후속 판단 인터페이스 |

---

## 7. AI 결과의 gate 승격 최소 기준

AI 해석 결과를 gate로 올리려면 아래 **7가지를 모두 충족**해야 한다.

1. `explicitness === "explicit_required"`
2. `likelySatisfied === false`
3. `confidence >= 0.90`
4. `requirement.sourceQuote` 존재
5. `candidateEvidence` 검토 완료
6. `ambiguity.hasAmbiguity === false`
7. 규칙 검증과 충돌 없음

**추가 원칙:**
- 하나라도 빠지면 gate로 올리지 않는다.
- explicit required라도 애매하면 **hard risk 또는 question으로 낮춘다.**
- 시장 맥락상 중요하다는 이유만으로는 gate가 아니다.

---

## 8. 조건군별 책임 분해

| 조건군 | 룰이 맡을 것 | AI가 맡을 것 | gate 가능 범위 |
|---|---|---|---|
| **학력** | 학위 등급 비교, 명시 여부 확인 | 동등 학력 해석, 해외 학위 체계 예외 해석 | 넓음 (룰 중심 gate) |
| **전공** | 전공 클러스터 매핑, 유사도 계산 | 전공 유연성 해석, 관련도 판단 | 좁고 명시적인 필수 전공만 gate |
| **자격증** | 자격증명 매칭, 필수/우대 분류 | 동등 자격·실무 경력 대체 가능성 해석 | 명시적 필수 자격증만 gate |
| **언어** | TOEIC/OPIc/JLPT/HSK 정형 점수·등급 비교 | "비즈니스 영어" 등 정성 조건 해석, 테스트 간 동등성 판단 | 정형 조건만 룰 gate 가능; 정성 조건은 AI 해석 |
| **툴/기술** | 동일 툴명 존재 여부 확인 | 숙련도·실무 수준 해석, 유사 툴 대체 가능성 판단 | exact tool name 정도만 제한적 gate 후보; 숙련도는 AI 해석 |
| **필수 경험** | 경력 구간 구조화, 기간 계산 | 경험의 실질 관련성·깊이 해석 | AI 중심, gate 매우 제한 |
| **관련경력 연차** | 기간 계산, 경력 공백 산출 | 관련도 판독, 업무 연관성 해석 | AI가 관련도 판독, 룰이 기간 계산 |
| **시장 맥락 조건** | — (gate 없음) | 직무/산업 맥락상 중요도 판단 | **gate 금지**, context risk만 |

---

## 9. 조건군별 gate 용이성 요약

| 조건군 | gate 용이성 |
|---|---|
| 학력 | 매우 높음 |
| 전공 | 높음 |
| 자격증 | 높음 |
| 언어 | 중간 |
| 툴/기술 | 낮음~중간 |
| 필수 경험 | 낮음 |
| 관련경력 연차 | 낮음~중간 |
| 시장 맥락 | 없음 |

---

## 10. 이번 문서에서 아직 확정하지 않는 후속 설계

아래 사항은 이번 문서에서 결정하지 않는다. 별도 설계 세션에서 다룬다.

- AI 결과를 `requiredGateSignals`에 직접 넣을지, 별도 `requiredConditionInterpretations`로 둘지
- 기존 rule-based signals와 AI interpretation을 어디서 합칠지
- rule 충족 판정과 AI 미충족 판정이 충돌할 때 우선순위
- low-confidence AI 결과를 risk로 흘릴지, question으로 만들지
- 같은 사실이 rule gate / AI hard risk / legacy risk로 중복 출력되지 않도록 suppression을 어디서 처리할지
- PR #233을 그대로 머지할지, 보완 후 머지할지, 보류할지
- `REQUIRED_LANGUAGE` 구현 구조

---

## 11. 현재 마스터 순서표상 위치

| 단계 | 상태 |
|---|---|
| 1단계: 판정 철학 고정 | 완료 |
| 2단계: 조건군별 책임 분해 / gate 승격 정책 (일부) | 완료 |
| 다음: AI와 규칙의 접점 설계 | 미착수 |
| 아직 금지: `REQUIRED_LANGUAGE` / `REQUIRED_TOOL_OR_TECH` / `REQUIRED_EXPERIENCE` 구현으로 바로 진입 | — |
