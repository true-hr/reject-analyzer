# PASSMAP Required Condition Resolver Placement Policy

> 버전: 1.0.0  
> 상태: 확정(Locked)  
> 위치: docs/ — SSOT 정책 문서  
> 상위 문서:
> - `PASSMAP_GATE_AI_DECISION_POLICY.md` (판정 철학)
> - `PASSMAP_REQUIRED_CONDITION_RESOLUTION_POLICY.md` (rule/AI 결합 정책)
> - `PASSMAP_REQUIRED_CONDITION_KEY_POLICY.md` (조건 식별 키 정책)

---

## 1. 문서 목적

이 문서는 `requiredConditionResolutions`를 **엔진 흐름의 어디에서 생성할지**를 고정한다.

목적은 resolver를 억지로 기존 decision pack 내부에 밀어 넣지 않고, **현재 deterministic 엔진과 미래 AI 해석 확장을 모두 수용하는 안정적인 위치**를 정하는 것이다.

이 문서는 기존 세 SSOT 문서의 후속 세부 정책이다.

---

## 2. 핵심 결론

1. `resolveRequiredConditions()`의 소유권은 **`decision` 도메인**에 둔다.
2. 권장 위치는 `src/lib/decision/requiredConditions/resolveRequiredConditions.js`다.
3. 실행 시점은 **`buildRequiredGateSignals()` 직후, `buildDecisionPack()` 직전**이다.
4. `buildDecisionPack()` 내부에서 AI-dependent resolution을 만들지 않는다.
5. resolver는 **AI 결과가 없어도 항상 실행**한다.
6. 미래 AI 결합은 **같은 resolver를 다시 돌리는 2-pass 구조**로 확장한다.
7. 기존 gate는 당장 유지하고, **신규 gate부터 resolution-first**로 설계한다.
8. 기존 gate는 **점진적으로** resolution 기반으로 이행한다.
9. `evalRiskProfiles()` context에는 이후 `requiredConditionResolutions`를 **append-only**로 추가한다.
10. 현행 **비차단 AI UX**와 **deterministic baseline**은 유지한다.

---

## 3. 현재 코드 흐름에서의 배경

현재 엔진 흐름의 주요 구조:

- `buildRequiredGateSignals()`는 analyzer orchestration 단계에서 룰 기반 구조화 신호를 만든다.
- `buildDecisionPack()`은 decision 계층에서 risk profile 평가와 점수 산출을 담당한다.
- `evalRiskProfiles()`는 현재 `requiredGateSignals`를 context로 받아 gate를 평가한다.
- 현재 AI endpoint는 deterministic 결과를 후속 설명하는 **비차단형 보조층**에 가깝다.
- grounded 모드에서는 AI가 기존 규칙 기반 진단 결과를 재판단하거나 등급을 바꾸지 말도록 되어 있다.
- 현재 UI도 먼저 규칙 기반 결과를 보여주고, AI 섹션은 뒤에 붙는 흐름이다.

---

## 4. 왜 `analyzer.js` 안에 직접 두지 않는가

- analyzer는 orchestration 중심이어야 한다.
- resolver는 단순 연결이 아니라 **판정 정책 로직**이다.
- analyzer 내부에 넣으면 orchestration과 decision policy가 섞인다.
- 재사용성과 테스트성이 떨어진다.
- rule/AI 결합 기준이 decision 도메인 밖으로 새어 나간다.

---

## 5. 왜 `buildDecisionPack()` 내부에 두지 않는가

- `buildDecisionPack()`은 현재 deterministic decision 엔진의 중심이다.
- 현행 AI는 deterministic 결과 뒤에 붙는 비동기 보조층이다.
- AI 결과가 들어오려면 decision pack을 비동기화하거나 재실행해야 하므로 현 구조와 충돌한다.
- AI 유무에 따라 decision pack의 의미가 달라지면 안정성이 깨진다.
- 현재 "AI는 먼저 확정된 결과를 설명한다"는 grounded 구조와 충돌한다.
- 따라서 resolver는 `buildDecisionPack()` **앞단**에 둔다.

---

## 6. 권장 데이터 흐름

### 6-1. 현재 즉시 가능한 deterministic baseline

```
raw inputs
→ buildRequiredGateSignals()
→ requiredGateSignals
→ resolveRequiredConditions({ requiredGateSignals, requiredConditionInterpretations: [] })
→ requiredConditionResolutions
→ buildDecisionPack({ ..., requiredGateSignals, requiredConditionResolutions })
```

### 6-2. 미래 AI 증강 시

```
deterministic pass
→ AI Required Condition Interpreter returns
→ resolveRequiredConditions({ requiredGateSignals, requiredConditionInterpretations })
→ aiAugmentedRequiredConditionResolutions
```

**원칙:**
- AI가 들어와도 **별도 판정 체계를 만들지 않고** 같은 resolver를 다시 사용한다.
- 초기에는 deterministic `decisionPack`과 AI-augmented required condition layer를 **분리하는 것이 안전**하다.

---

## 7. 왜 2-pass 구조인가

| 장점 |
|---|
| 기존 앱의 비차단 흐름 유지 |
| AI 실패 내성 확보 |
| deterministic QA와 AI QA 분리 가능 |
| 같은 resolver 재사용 가능 |
| 현재 grounded AI 구조와 충돌 최소화 |

---

## 8. 생성 시점

**`buildRequiredGateSignals()` 직후, `buildDecisionPack()` 직전**이 정답이다.

| 시점 | 판단 |
|---|---|
| `buildRequiredGateSignals()` 이전 | 부적절 — 정규화된 룰 신호가 아직 없음 |
| `buildRequiredGateSignals()` 직후 | **적절** |
| `buildDecisionPack()` 내부 | 부적절 — AI 결합 때문에 동기 엔진 오염 |
| `buildDecisionPack()` 이후 | 부적절 — gate/risk producer가 이미 지나간 뒤라 늦음 |

---

## 9. 권장 모듈 위치

**권장 위치: `src/lib/decision/requiredConditions/resolveRequiredConditions.js`**

| 후보 위치 | 판단 | 이유 |
|---|---|---|
| `src/lib/analyzer.js` | 부적절 | orchestration 전용이라 decision policy가 섞임 |
| `src/lib/fit/` | 부적절 | JD/resume fit 계산 계층이라 역할이 다름 |
| `src/lib/decision/riskProfiles/` | 부적절 | producer 계층이라 너무 아래 |
| `src/lib/decision/requiredConditions/` | **적절** | decision 도메인 내 전용 서브 디렉토리 |

---

## 10. `buildDecisionPack()` 및 `evalRiskProfiles()`와의 관계

- 초기에는 `buildDecisionPack()` 호출 시 `requiredGateSignals`와 함께 `requiredConditionResolutions`를 넘긴다.
- `evalRiskProfiles()` context에는 **append-only**로 `requiredConditionResolutions`를 추가한다.
- 기존 gate는 당장 `requiredGateSignals`를 계속 읽어도 된다.
- **신규 gate부터 `requiredConditionResolutions`를 읽도록 설계**한다.
- 장기적으로 최종 판정의 SSOT는 `requiredConditionResolutions`가 된다.

---

## 11. resolver의 책임 범위

### 해야 할 일

- 룰 기반 condition item을 표준 condition 형태로 정리
- AI interpretation과 같은 `conditionKey` 기준으로 매칭
- rule authority 적용 (decisive / supporting)
- AI confidence / ambiguity 적용
- 최종 `status`, `outputLayer`, `dominantSource` 결정
- suppression metadata 생성

### 하지 말아야 할 일

- 원문에서 JD를 새로 파싱
- AI 직접 호출
- risk card 문구 생성
- 최종 점수 계산
- raw text 기반 즉흥 key 생성

---

## 12. AI 결과가 없는 경우

resolver는 항상 실행한다. `requiredConditionInterpretations = []`를 기본 입력으로 사용한다.

**이유:**
- final resolution 레이어를 항상 보장
- 새 producer가 같은 구조를 **분기 없이** 읽을 수 있음
- AI 유무에 따라 엔진 계약이 달라지지 않음
- 이후 AI 결합에도 **같은 함수 재사용** 가능

---

## 13. 기존 gate 이행 전략의 기본 방향

| 단계 | 내용 |
|---|---|
| 1단계 | 기존 gate는 유지하고 resolution 레이어만 **병행** 생성 |
| 2단계 | 신규 조건군(`REQUIRED_LANGUAGE`, `REQUIRED_TOOL_OR_TECH`, `REQUIRED_EXPERIENCE`, 관련경력 고도화)은 처음부터 **resolution-first** |
| 3단계 | 기존 gate는 **점진적으로** resolution 기반으로 이행 |

**권장 이행 순서 (기존 gate 기준):**
1. `REQUIRED_CERT`
2. `REQUIRED_MAJOR`
3. `REQUIRED_EDUCATION`
4. 총연차 gate

**이행 우선순위 근거:**
- 자격증 / 전공 / 학력은 rule decisive라 이행이 비교적 안전
- 경험 / 관련경력은 ontology와 AI 해석이 더 필요하므로 후순위

**금지:**
- 기존 gate를 한 번에 전부 갈아엎지 않는다.
- AI interpreter가 아직 없는데 기존 gate 로직을 급히 삭제하지 않는다.
- baseline resolution 없이 AI-augmented resolution만 만들지 않는다.

---

## 14. 이번 문서에서 아직 확정하지 않는 후속 설계

아래 사항은 이번 문서에서 결정하지 않는다. 별도 설계 세션에서 다룬다.

- 기존 gate 이행 전략의 세부 단계와 완료 기준
- 어떤 기존 gate를 언제 resolution 기반으로 전환할지
- `requiredConditionResolutions`를 실제 코드에 추가하는 첫 구현 범위
- `aiAugmentedRequiredConditionResolutions`를 UI에 언제, 어떻게 노출할지
- PR #233을 지금 머지할지, 세부 이행 전략까지 확정한 뒤 머지할지

---

## 15. 현재 마스터 순서표상 위치

| 단계 | 상태 |
|---|---|
| 판정 철학 고정 | 완료 |
| 조건군별 책임 분해 / gate 승격 정책 | 완료 |
| AI와 규칙의 접점 설계 | 완료 |
| conditionKey / topicKey 정책 | 완료 |
| resolver 생성 위치 설계 | 완료 |
| 다음: 기존 gate 이행 전략 세부 설계 | 미착수 |
| 다음: PR #233 최종 판단 | 미착수 |
| 아직 금지: `REQUIRED_LANGUAGE`, `REQUIRED_TOOL_OR_TECH`, `REQUIRED_EXPERIENCE` 구현으로 바로 진입 | — |
| 아직 금지: `buildDecisionPack()` 내부에 AI-dependent resolver를 직접 박는 구현 | — |
| 아직 금지: 기존 gate를 한 번에 resolution 기반으로 갈아엎는 구현 | — |
