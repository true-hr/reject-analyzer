# Axis Evidence Selection Rules
작성일: 2026-04-08
버전: v1.0
성격: SSOT / selector contract / Newgrad explanation evidence selection

---

## 1. 문서 목적

이 문서는 Newgrad 5축 explanation 조립 이전 단계에서,
각 축이 어떤 evidence를 primary positive / primary limiting / secondary로 선택할지를 정의한다.

이 문서의 목적은 아래 4가지다.

1. score와 explanation이 같은 evidence family를 보게 만든다.
2. 동일 source(project / internship / self-report)를 축마다 다른 질문으로 읽게 만든다.
3. scoreReason positive + limiting pair를 selector 단계에서 보장한다.
4. scorer / explanation / QA 간 selector drift를 막는다.

본 문서는 점수 1~5의 의미를 다시 정의하지 않는다.
band 의미와 점수 상태는 `Axis_Score_Anchor_Table.md`를 따른다.

---

## 2. 참조 문서

- 00_HQ/Axis_Score_Anchor_Table.md
- 00_HQ/Newgrad_Axis_Explanation_Assembly_Contract.md
- 00_HQ/Explanation_Ready_Evidence_Schema.md
- 00_HQ/Axis_Explanation_Output_Contract.md
- 00_HQ/Axis_Explanation_QA_Checklist.md

---

## 3. 문서 범위 / 비범위

### 다루는 범위
- 축별 primary positive selector
- 축별 primary limiting selector
- secondary selector
- tie-break
- overlap guard
- weak evidence / self-report 처리
- no-evidence 처리

### 다루지 않는 범위
- 점수 계산식
- 축별 1~5점 anchor 정의
- 최종 카피 문장
- fallback 제거 판단
- UI 노출 정책의 재정의

---

## 4. selector 공통 원칙

### 4-1. selector의 역할
selector는 많은 evidence를 모으는 단계가 아니라,
현재 축의 점수와 상태를 가장 잘 대표하는 evidence를 선출하는 단계다.

### 4-2. 기본 산출물
각 축은 explanation 조립 전에 최소 아래를 산출해야 한다.

- primaryPositiveEvidence
- primaryLimitingEvidence
- secondaryEvidenceList
- selectorConfidence
- overlapGuardNotes

### 4-3. 선출 우선 기준
여러 후보가 있을 때 우선순위는 아래를 따른다.

1. 축 질문 적합성
2. directness
3. specificity
4. observed evidence 우선
5. score band 설명력
6. limiting pair 설명 가능성

### 4-4. 금지
- score와 무관한 evidence를 대표 근거로 선출하는 것
- self-report only를 강한 observed evidence처럼 승격하는 것
- secondary가 primary보다 더 본질적인데 잘못 배치되는 것

---

## 5. evidence tier

### Tier A
직접적이고 관찰 가능한 강한 evidence.
대표 근거 우선 선출 가능.

### Tier B
간접적이거나 보조적이지만 의미 있는 evidence.
Tier A 부족 시 primary 가능.

### Tier C
보조 신호 수준 evidence.
독립 primary 금지, support-only 사용.

---

## 6. overlap guard 대원칙

### 6-1. 동일 source 재사용 허용
같은 project / internship를 여러 축이 사용할 수 있다.
다만 같은 이유로 재사용하면 안 된다.

### 6-2. 축별 읽기 질문 분리
- Axis1: role directness
- Axis2: industry context
- Axis3: depth / ownership / outcome / duration
- Axis4: stakeholder interaction
- Axis5: strengths / workstyle consistency

### 6-3. 금지되는 중복
- Axis1에서 쓴 role fit 근거를 Axis2 industry 근거처럼 재포장
- Axis3에서 depth 대신 fit을 설명
- Axis4 interaction evidence를 Axis5 behavioral fit로 복제
- Axis5 self-report를 Axis4 contact evidence처럼 쓰는 것

---

## 7. 축별 selector rules

# Axis1

## primary positive selector
우선:
1. direct role-aligned project
2. direct role-aligned internship/contract
3. strong major prior with supporting execution
4. adjacent role evidence bundle

## primary limiting selector
우선:
1. direct role evidence 부재
2. adjacent-only alignment
3. execution evidence는 있으나 role specificity 부족
4. evidence spine 불명확

## secondary selector
허용:
- major prior
- adjacent project
- supporting internship hint
- related coursework/cert hint

## 금지
- industry만 맞는 evidence를 Axis1 대표 positive로 선출
- self-report를 role fit 대표 근거로 선출

---

# Axis2

## primary positive selector
우선:
1. target industry aligned context evidence
2. industry-specific project/intern context
3. certification/major plus context support
4. repeated adjacent-industry exposure

## primary limiting selector
우선:
1. target industry 직접 맥락 부족
2. adjacent context only
3. certification/major는 있으나 applied context 부족
4. generic execution only

## secondary selector
허용:
- relevant certification
- relevant major domain
- adjacent industry project
- light contextual exposure

## 금지
- role fit evidence를 industry understanding evidence로 재사용
- generic teamwork/tool usage를 산업 이해 근거로 승격

---

# Axis3

## primary positive selector
우선:
1. strongest ownership + outcome evidence
2. sustained duration + responsibility evidence
3. multiple medium-depth experiences
4. meaningful deliverable spine

## primary limiting selector
우선:
1. ownership 부족
2. outcome 부족
3. duration 부족
4. fragmented light experiences only

## secondary selector
허용:
- sub-outcome
- duration signal
- repeated deliverable hints
- partial responsibility hints

## 금지
- direct fit 자체를 Axis3 대표 근거로 사용
- 산업 관련성만으로 depth를 설명

---

# Axis4

## primary positive selector
우선:
1. explicit stakeholder-facing evidence
2. customer/user/partner/cross-functional interaction
3. repeated coordination evidence
4. presentation/feedback/communication with named counterpart

## primary limiting selector
우선:
1. stakeholder type 불명확
2. 내부 협업만 존재
3. direct external contact 부족
4. 단발성 interaction만 존재

## secondary selector
허용:
- presentation
- coordination
- customer response hint
- collaboration with named stakeholder

## 금지
- generic teamwork를 strong interaction evidence로 승격
- 성향/태도 문장을 Axis4 대표 근거로 사용

---

# Axis5

## primary positive selector
우선:
1. self-report + observed behavior alignment
2. repeated behavior pattern across experiences
3. self-report supported by one concrete case
4. limited but consistent alignment bundle

## primary limiting selector
우선:
1. self-report only
2. self-report와 observed evidence 불일치
3. repeated pattern 부족
4. role-relevant behavior specificity 부족

## secondary selector
허용:
- strengthsSelected
- workStyleSelected
- observed behavior hints
- project/intern behavior support

## 금지
- self-report only를 strong primary positive로 선출
- Axis4 interaction evidence를 Axis5 fit 근거로 그대로 복제
- 경험 정합성 없는 self-report를 high-confidence로 서술

---

## 8. tie-break rules

동급 후보가 여러 개일 때는 아래 순서로 결정한다.

1. 현재 축 질문에 더 직접 답하는 후보
2. positive + limiting pair를 함께 설명하기 쉬운 후보
3. 더 구체적인 행동/맥락이 드러나는 후보
4. 단일 강한 spine을 형성하는 후보
5. weak evidence 다수보다 strong evidence 1개 우선

---

## 9. no-evidence / weak-only 처리

### no strong evidence
Tier A 부재, Tier B만 있을 경우
confidence를 낮춘 상태로 선출 가능

### weak-only
Tier C만 있을 경우
positive는 support-only framing으로 제한
limiting을 더 강하게 반영

### Axis5 self-report only
self-report only면 primary limiting 우선
positive는 방향성 표현까지만 허용

---

## 10. selector QA 체크포인트

아래 중 하나라도 발생하면 selector 실패다.

1. score와 explanation이 다른 evidence family를 본다.
2. Axis1/2/3이 같은 source를 같은 이유로 읽는다.
3. Axis4/5가 interaction vs behavior를 구분하지 못한다.
4. secondary가 primary보다 더 강하다.
5. self-report only가 strong positive처럼 선출된다.
6. limiting이 필요한 band인데 limiting selector가 비어 있다.

---

## 11. 최종 요약

- Anchor는 점수 의미를 정의하고, 본 문서는 대표 근거 선출 규칙을 정의한다.
- selector는 explanation의 재료 선출 단계다.
- 같은 source를 여러 축이 써도, 같은 이유로 쓰면 안 된다.
- Axis4는 상대와 상호작용, Axis5는 성향과 일하는 방식이다.
- Axis5 self-report 과신은 금지한다.
- scoreReason pair는 selector 단계에서부터 보장한다.