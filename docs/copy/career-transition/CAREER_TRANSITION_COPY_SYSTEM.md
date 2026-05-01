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

Version: 1.0.0
Created: 2026-05-01
