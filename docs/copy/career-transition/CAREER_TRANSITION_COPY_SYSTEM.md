# PASSMAP Career Transition Copy System

## Purpose

경력 직무·산업 분석에서 사용하는 전환 맞춤 해석 문구의 생성·관리 원칙을 정의한다.

이 문서는 개별 케이스 전문 저장 방식의 한계를 인식하고, 확장 가능한 문구 생성 구조를 설계한 SSOT다.

---

## 1. 왜 개별 케이스 무한 저장 방식이 위험한가

### 현재 방식의 구조

- 현재 직무 × 목표 직무 조합마다 별도 case 전문 문서 작성
- 각 케이스를 LOCKED → APPLIED → VERIFIED까지 개별 관리
- 코드에도 케이스별 프로파일 1:1 등록

### 이 방식의 한계

1. **조합 폭발**: 현재 직무 100개 × 목표 직무 50개 = 5,000개 케이스. 수동 작성으로는 커버 불가.
2. **문구 희석**: 케이스가 늘어날수록 각 케이스의 coreDifference가 약해지고 일반론 문구로 흐른다.
3. **유지 비용**: 목표 직무 정의가 바뀌거나 새 axis가 추가되면 모든 케이스를 재작업해야 한다.
4. **표현 혼재**: 비슷한 targetJob 케이스끼리 표현이 섞여 PM ≠ PO ≠ 서비스기획 구분이 흐려진다.
5. **우선순위 부재**: 모든 케이스가 동등하게 취급되어 고도화할 케이스와 자동화할 케이스를 구분할 수 없다.

---

## 2. 최종 운영 원칙

### 핵심 케이스 (Curated Case)

- 전환 빈도가 높고 판단 난이도가 높은 조합을 엄선한다.
- 목표 규모: 50~100개 케이스
- 관리: 수동 고도화, LOCKED 이상 유지, 개별 case 전문 파일 작성
- 코드 적용: careerTransitionCaseProfiles.js에 1:1 등록

### 나머지 케이스 (Template-Based)

- 전환 유형 템플릿(Archetype) + 도메인/연차/증거 modifier 조합으로 문구 생성
- 수동 전문 작성 불필요
- 코드 적용: Archetype 레이어 + modifier 주입 방식으로 동작

---

## 3. 문구 생성 레이어

레이어는 낮은 번호가 기반이고 높은 번호가 구체적이다. 상위 레이어가 있으면 하위 레이어를 덮어쓴다.

### Layer 1: Target Role Template

가장 기본 레이어. 목표 직무(targetJob)별로 "PM이란 무엇인가", "FP&A란 무엇인가"를 정의한 기본 해석 틀.

목적: axis lead/criteria의 기본 골격 제공.

### Layer 2: Transition Archetype

전환 유형별 해석 패턴. ARCHETYPE_REGISTRY.md에서 관리한다.

예:
- OPERATIONS_TO_PRODUCT_IMPROVEMENT: 운영 문제 → 제품화 전환 패턴
- ANALYTICS_TO_PRODUCT_DECISION: 분석 역량 → 제품 의사결정 전환 패턴

목적: 비슷한 전환 구조를 공유하는 케이스들에 동일한 해석 뼈대 적용.

### Layer 3: Axis Overlay

Archetype이 지정한 핵심 2개 축에 lead / scoreReason / criteria / liftOrLimit 슬롯을 주입한다.

기본 원칙: 핵심 2축 overlay만 적용. 5축 전체 overlay는 예외적으로만 허용.

### Layer 4: Domain Modifier

목표 직무 도메인이 현재 경험 도메인과 같은지 다른지에 따라 axis scoreReason / liftOrLimit을 조정한다.

예: same_domain → 전환 난이도 낮음 표현. different_domain → 추가 학습 필요 강조.

### Layer 5: Seniority Modifier

연차에 따라 기대 역할과 판단 기준이 달라진다.

예: junior → 퍼널 분석·실험 경험 중심. senior → 성장 전략·제품팀 협업 리더십 중심.

### Layer 6: Evidence Modifier

이력서에서 확인된 증거 유형에 따라 risk copy와 resume rewrite hint를 조정한다.

예: output_only → 산출물 중심 리스크 강조. metric_evidence → 강점 부각.

### Layer 7: Curated Case Override

Layer 1~6보다 항상 우선한다. LOCKED 이상의 curated case 문서가 있으면 해당 case 전문을 사용한다.

---

## 4. 적용 우선순위

```
Curated Case Override (최우선)
    ↓ 없으면
Transition Archetype (Layer 2)
    + Domain Modifier (Layer 4)
    + Seniority Modifier (Layer 5)
    + Evidence Modifier (Layer 6)
```

같은 sourceJob + targetJob 조합에 Curated Case가 있으면 Archetype은 발화하지 않는다.

---

## 4-1. 서비스기획 vs 서비스디자인 혼동 방지 원칙

아래 두 역할은 반드시 분리한다. archetype 선택에서 섞이면 문구 방향이 오염된다.

| 역할 | 핵심 산출물 | 핵심 판단 기준 |
|---|---|---|
| 서비스기획 | 정책 문서, 화면 흐름, 기능 요구사항, 운영 가이드 | 운영 가능한 구조로 바꿀 수 있는가 |
| 서비스디자인 | 여정 지도, 서비스 청사진, 사용성 리포트, 경험 아키텍처 | 리서치를 경험 설계로 연결할 수 있는가 |

CX 계열 전환에서 이 구분을 적용하는 방법:

- CS/고객지원 출신이 서비스기획으로 전환 → CUSTOMER_SUPPORT_TO_SERVICE_PLANNING
- CSM/고객성공 출신이 서비스기획으로 전환 → CUSTOMER_SUCCESS_TO_SERVICE_PLANNING
- UX리서처/CX디자이너가 서비스디자인으로 전환 → CX_TO_SERVICE_DESIGN

세 archetype을 병합하거나 혼용하면 서비스기획 문구에 리서치/경험 설계 방법론 언어가 섞여 채용 담당자가 오해하는 결과를 낳는다.

---

## 5. 코드 적용 원칙

### 핵심 2축 overlay 원칙

- 기본: jobStructure + responsibilityScope 2축만 적용
- 이유: 3축 이상은 카드 컨텍스트 과잉이 되어 사용자 인지 부담이 커진다
- 예외: 특정 직군(예: 회계→FP&A, B2B영업→사업개발)에서 industryContext 또는 customerType이 판단에 필수적인 경우 3축 허용

### 5축 전체 overlay 제한

- 5축 전체(jobStructure + industryContext + responsibilityScope + customerType + roleCharacter) overlay는 예외적으로만 허용
- 허용 조건: 전환 판단 난이도가 극히 높고, 각 축 설명이 서로 실질적으로 다른 메시지를 전달해야 함

### 화면 미연결 문구 처리

- topSummary, Risk Copy, Resume Rewrite Direction은 화면 컴포넌트 연결 전까지 case 전문 문서에만 유지한다
- 코드 overlay에는 포함하지 않는다
- 화면 컴포넌트가 준비되면 그때 별도 slot으로 추가한다

---

## 6. BATCH_PM_01의 의미

BATCH_PM_01(서비스기획→PM, 운영기획→PM, 데이터분석→PM, 퍼포먼스마케팅→PM)은 최종 운영 방식이 아니다.

이 배치의 목적:
1. **Seed Case**: 전환 문구 품질의 기준점 역할
2. **Quality Benchmark**: 향후 archetype 문구가 이 수준 이상이 되어야 함을 확인
3. **Pattern Source**: 각 케이스에서 반복되는 표현 패턴을 추출해 archetype 뼈대로 추상화

향후 작업:
- BATCH_PM_01 케이스에서 공통 패턴을 추출해 각 archetype의 lead / scoreReason / criteria / liftOrLimit 골격 초안을 작성한다
- 새로운 직무 조합이 동일 archetype에 해당하면 개별 case 작성 없이 archetype + modifier 조합으로 커버한다

---

## 7. 이 시스템이 완성되면

- 현재 직무 + 목표 직무 입력만으로 archetype 매칭 → modifier 조합 → axis overlay 자동 생성
- 수동 작업은 고빈도·고난이도 케이스의 curated case 고도화에만 집중
- 케이스 추가 비용이 낮아지고, 기존 케이스의 유지 품질이 높아진다

---

## 8. 관련 파일 경로

| 파일 | 역할 |
|---|---|
| CAREER_TRANSITION_COPY_MATRIX.md | 개별 케이스 파이프라인 상태 추적 |
| ARCHETYPE_REGISTRY.md | 전환 유형 템플릿 등록 |
| MODIFIER_REGISTRY.md | 도메인/연차/증거 modifier 등록 |
| cases/{caseKey}.md | Curated Case 전문 문서 |
| src/lib/analysis/careerTransitionCaseProfiles.js | 코드 적용 프로파일 |
| src/lib/analysis/careerTransitionCaseOverlays.js | overlay 엔진 |

---

## 9. 처리 우선순위 (4-Tier)

새 전환 케이스가 들어올 때 아래 순서로 처리 방식을 결정한다.

### 1순위: Curated Case Override

조건: 해당 source × target 조합에 LOCKED 이상 case 문서와 코드 profile이 존재하는 경우.

처리: case 전문 문서의 axis overlay를 그대로 사용한다. archetype과 modifier는 발화하지 않는다.

예: 서비스기획→PM, 서비스기획→사업기획, 데이터분석→PM

### 2순위: Archetype Match

조건: 직접 case는 없지만 전환 구조가 기존 archetype 패턴과 일치하는 경우.

처리: ARCHETYPE_REGISTRY.md에서 매칭된 archetype의 axisOverlayTemplate을 사용한다. modifier는 선택 적용.

예: 영업관리→사업기획 → SALES_TO_BUSINESS_DEVELOPMENT archetype 매칭

### 3순위: Archetype + Modifier 조합

조건: 전환 구조는 archetype과 비슷하지만 연차, 도메인, 증거 강도에 따라 문구 보정이 필요한 경우.

처리: archetype 기본 템플릿에 Domain/Seniority/Evidence modifier를 조합해 적용한다.

예: 구매담당→사업기획 (SALES_ADMIN_TO_BUSINESS_PLANNING archetype + different_domain + mid modifier)

### 4순위: Generic Fallback

조건: 아직 충분한 정보가 없거나 archetype 매칭이 되지 않는 경우.

처리 규칙:
- "연결성이 있습니다" 같은 빈 문장 금지.
- 반드시 현재 직무 경험과 목표 직무 요구의 구체적인 차이를 최소 1개 이상 짚는다.
- "어떤 경험이 더 필요한지" 또는 "어떤 부분이 이미 연결되는지" 중 하나는 명시한다.

---

## 10. 새 Curated Case 생성 기준

### 만들어야 하는 조건 (AND 조건 아님 — 하나 이상 해당되면 검토 대상)

- 사용 빈도가 높을 가능성이 큼 (PM/서비스기획/사업기획/HR/데이터 등 주요 시장 직무군)
- 직무 전환 난이도가 높거나 혼동 가능성이 큼 (예: PM과 PO 구분, 서비스기획과 서비스디자인 구분)
- 기존 archetype 문구로 처리하면 오해가 생기는 구조적 차이가 있음
- 이력서 재구성 방향이 다른 archetype 케이스와 실질적으로 다름
- 영업/마케팅/기획/재무/HR/데이터 등 주요 시장 직무군에 해당

### 만들면 안 되는 조건 (하나라도 해당되면 보류)

- 기존 archetype 문구에 modifier만 붙이면 충분히 커버됨
- source 또는 target taxonomyId가 불안정하거나 여러 직무를 섞고 있음
- target job이 실제 채용 시장에서 거의 없는 조합임
- 문구 차이가 기존 archetype 대비 20% 미만임
- 단순 희귀 조합이며 일반화 가능성이 낮음

---

## 11. 운영 목표

| 항목 | 목표 수량 | 비고 |
|---|---|---|
| Curated Case | 50개 내외 | 수동 고도화, LOCKED 이상 유지 |
| Archetype | 20~30개 | ACTIVE/DRAFT 포함 |
| Modifier | 30~50개 | 4개 그룹으로 분류 |

전체 조합을 직접 작성하지 않는다. 수동 작업은 고빈도·고난이도 케이스의 Curated Case 고도화에만 집중한다.

---

Version: 1.2.0
Updated: 2026-05-01
Changes: §4-1 서비스기획 vs 서비스디자인 혼동 방지 원칙 추가 (CX 계열 3분기 원칙)
Created: 2026-05-01
