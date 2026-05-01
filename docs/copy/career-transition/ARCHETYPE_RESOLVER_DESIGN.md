# PASSMAP Archetype Resolver Design

## Purpose

sourceJobId + targetJobId 입력으로부터 적절한 archetype을 선택하고,
연차/도메인/증거/목표역할 modifier를 조합해 axis overlay를 생성하는
Resolver의 설계 명세서다.

이 문서는 코드 구현 전 설계 기준이다.
코드 구현은 이 문서가 검토 완료된 이후에 진행한다.

관련 문서:
- CAREER_TRANSITION_COPY_SYSTEM.md — 전체 레이어 원칙 및 운영 목표
- ARCHETYPE_REGISTRY.md — archetype 카탈로그 (현재 26개)
- MODIFIER_REGISTRY.md — modifier 카탈로그 (현재 32개)
- CAREER_TRANSITION_COPY_MATRIX.md — curated case 파이프라인
- JOB_GROUP_TAXONOMY_MAP.md — jobGroup ↔ taxonomyId 매핑 (CONFIRMED/UNKNOWN 구분)
- ARCHETYPE_RESOLVER_SMOKE_SPEC.md — 입력/출력 계약 및 smoke case 12개 (Phase 2)

---

## 1. Resolver 처리 순서

```
입력: sourceJobId + targetJobId + context

1순위: Curated Case Override
  → matrix에서 caseMode == CURATED && status >= LOCKED 인 case 조회
  → 매칭 성공 → careerTransitionCaseProfiles.js profile 또는 case copy 사용
  → BLOCKED_TAXONOMY / PENDING_TAXONOMY는 자동 발화 금지

2순위: Exact Archetype Match
  → sourceJobId → sourceGroup 변환
  → targetJobId → targetGroup 변환
  → archetypeMatchTable에서 (sourceGroup, targetGroup) 조합 조회
  → 단일 매칭 성공 → archetype overlay 사용

3순위: Archetype + Modifier 조합
  → archetype 매칭 후 modifier selection logic 실행
  → Domain / Seniority / Evidence / TargetRole modifier 1~4개 선택
  → archetype base overlay + modifier delta 합산

4순위: Generic Fallback
  → 위 3단계 모두 실패 또는 매칭 신뢰도 낮음
  → 빈 문구 금지
  → 현재 직무 경험과 목표 직무 요구 차이 최소 1개 명시 필수
  → "연결성이 있습니다" 같은 내용 없는 문장 금지
```

---

## 2. Resolver 입력값 정의

### 2-1. 필수 입력

| 필드 | 타입 | 설명 |
|---|---|---|
| sourceJobId | string | 현재 직무 taxonomy ID |
| targetJobId | string | 목표 직무 taxonomy ID |
| targetJobLabel | string | 화면 표시용 목표 직무명 |
| sourceDomain | string | 현재 직무 산업/도메인 ID |
| targetDomain | string | 목표 직무 산업/도메인 ID |
| yearsOfExperience | number | 총 경력 연수 |
| candidateEvidencePack | object | 이하 참조 |

### 2-2. candidateEvidencePack 구조

```
candidateEvidencePack: {
  hasMetricEvidence: boolean,       // 정량 성과 수치 있음
  hasOwnershipEvidence: boolean,    // 오너십/결정권 경험 있음
  hasCrossFunctional: boolean,      // 타부서 협업/조율 증거 있음
  hasCustomerEvidence: boolean,     // 고객 문제 발견/VOC 분석 증거
  hasStrategyEvidence: boolean,     // 전략/사업판단 증거
  hasRoadmapEvidence: boolean,      // 로드맵/우선순위 결정 증거
  hasProcessImprovement: boolean,   // 프로세스 개선 경험
  hasLeadershipEvidence: boolean,   // 팀리드/관리/의사결정 영향력
  evidenceStrength: 'strong' | 'moderate' | 'weak'
}
```

### 2-3. 선택 입력

| 필드 | 타입 | 설명 |
|---|---|---|
| targetSubType | string | PO/PM 공용 taxonomyId인 경우 세분화 힌트 |
| sourceSubType | string | CS/CX처럼 넓게 묶인 경우 세분화 힌트 |
| achievementMetrics | string[] | 이력서의 구체적 수치 목록 |
| targetIndustryCharacter | string | 'regulated' / 'platform' / 'b2b' / 'b2c' / 'offline' / 'data_heavy' |
| careerTrajectory | string | 'ascending' / 'lateral' / 'descending' (선택) |

---

## 3. Job Group Mapping

sourceJobId / targetJobId를 직접 archetype에 매핑하지 않는다.
중간에 jobGroup을 두어 매핑 유지 비용을 낮춘다.

### 3-1. Job Group 정의

| groupId | roleNature | typicalEvidence | commonTargetGroups | ambiguityRisk |
|---|---|---|---|---|
| service_planning | 기능/UX흐름 기획, 산출물 중심 | IA, 화면설계, 기능정의서 | product_management, business_planning | PM/PO/서비스디자인 혼동 주의 |
| product_management | 문제정의, 우선순위, 출시오너십 | 지표개선, 로드맵, 출시경험 | — (target only) | PM과 PO 구분 필수 |
| product_owner_delivery | 백로그, 스프린트, 개발 실행 책임 | 릴리즈 관리, 스프린트 조율 | — (target only, BLOCKED_TAXONOMY) | PM과 혼용 위험 |
| business_planning | 시장/수익/전략 분석, 의사결정 지원 | 사업계획서, 시장분석, KPI | — (target only) | 사업기획과 경영기획 혼동 |
| business_development | 파트너십, 시장확장, 계약구조 | 딜성사, 파트너십 계약, MOU | — (target only) | 사업기획과 혼동 주의 |
| operations_planning | 운영 프로세스, KPI 관리, 실행 | SOP, KPI 대시보드, 자동화 | product_management, service_planning, business_planning | — |
| performance_marketing | 퍼널, 전환, 실험, 매체운영 | ROAS, 전환율, A/B실험 | product_management, service_planning | PM/마케팅 혼동 |
| data_analytics | 데이터 해석, 리포팅, BI | 대시보드, SQL, 분석보고서 | product_management, business_planning | 분석과 의사결정 혼동 |
| customer_support | 문의 처리, VOC, 반복 이슈 응대 | 문의 해결률, 응대 건수, SOP | service_planning | customer_success와 구분 필수 |
| customer_success | 온보딩, 사용률, 리텐션, 여정 관리 | 온보딩 완료율, NPS, 갱신율 | service_planning | customer_support와 구분 필수 |
| service_design | 리서치, 여정, 사용성, 경험 아키텍처 | 여정지도, 청사진, 사용성 리포트 | — (target only) | 서비스기획과 혼동 금지 |
| accounting | 결산, 비용관리, 세무, 원가 | 결산 완료, 비용 분석, 감사 | finance_planning, management_planning | FP&A와 경영기획 구분 필수 |
| finance_planning | 예산, 실적분석, 사업부 의사결정 지원 | 예산 수립, 실적 검토, 시뮬레이션 | — (target only) | 회계와 경영기획 혼동 |
| management_planning | 전사 경영 관리, 경영진 보고 | 경영보고, 전사 KPI, 예산조율 | — (target only) | finance_planning과 구분 |
| hr_operations | 인사제도, 노무, 급여, 평가관리 | 제도 운영, 규정 관리 | hrbp | recruiting과 구분 필수 |
| recruiting | 채용 프로세스, JD, 후보자 평가 | 채용 목표 달성, JD 작성 | hrbp | hr_operations와 구분 필수 |
| hrbp | 현업 파트너링, 조직 이슈 진단 | 현업 협업, 조직 변화 대응 | — (target only) | — |
| procurement | 공급업체, 단가, 발주, 계약 | 단가협상, 발주 정확도, 공급업체 평가 | business_planning | SCM과 구분 |
| engineering | 개발 구현, 아키텍처, 코드 작성 | 기능 구현, 성능 개선, 코드리뷰 | product_management, service_planning | — |
| technical_support | 고객 기술 이슈 해결, 시스템 지원 | 이슈 해결률, 시스템 안정성 | service_planning | customer_support와 혼동 가능 |
| design | UI/UX 디자인, 시각 설계 | 화면 시안, 프로토타입, 사용성 개선 | service_planning, product_management | service_design과 구분 |
| research | 리서치, 인터뷰, 설문, 시장조사 | 리서치 리포트, 인사이트 문서 | product_management, business_planning | — |
| sales_b2b | B2B 신규 영업, 딜 성사 | 매출 목표 달성, 신규 계약 건수 | business_development, account_management | 사업기획과 혼동 가능 |
| sales_admin | 영업 실적 관리, 데이터 집계, 지원 | 실적 보고서, CRM 관리 | business_planning | sales_b2b와 구분 |
| account_management | 기존 고객 관리, 갱신, 업셀 | 갱신율, NPS, 업셀 건수 | — (target only) | — |
| admin | 경영지원, 총무, 비서, 시설 | 문서 관리, 행사 운영 | business_planning | 전환 거리 가장 멀어 fallback 처리 권장 |
| content_planning | 콘텐츠 기획, 편집, 채널 운영 | 콘텐츠 제작, 조회수, 구독자 | service_planning, business_planning | — |
| brand_marketing | 브랜드 전략, 캠페인, 크리에이티브 | 브랜드 인지도, 캠페인 성과 | service_planning | performance_marketing과 구분 |
| crm_marketing | CRM, LTV, 재구매, 이탈 방지 | LTV 개선, 재구매율, 이탈율 | service_planning, product_management | — |

---

## 4. Archetype Match Rule 표

각 archetype의 자동 선택 조건을 정의한다.
매칭은 (sourceGroup, targetGroup) 조합이 기준이다.

| archetypeId | sourceGroup | targetGroup | blockedWhen | fallbackArchetype |
|---|---|---|---|---|
| PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP | service_planning, content_planning | product_management | targetSubType == "PO" 또는 "delivery" | GENERIC_PRODUCT_PLANNING |
| PLANNING_OUTPUT_TO_DELIVERY_OWNERSHIP | service_planning | product_owner_delivery | **BLOCKED_TAXONOMY** — 자동 발화 금지 | — |
| PLANNING_OUTPUT_TO_BUSINESS_STRATEGY | service_planning, content_planning | business_planning | targetSubType == "PM" | GENERIC_BUSINESS_PLANNING |
| OPERATIONS_TO_PRODUCT_IMPROVEMENT | operations_planning | product_management | — | GENERIC_PRODUCT_PLANNING |
| OPERATIONS_TO_SERVICE_PLANNING | operations_planning | service_planning | — | GENERIC_SERVICE_PLANNING |
| OPERATIONS_TO_BUSINESS_PLANNING | operations_planning | business_planning | — | GENERIC_BUSINESS_PLANNING |
| ANALYTICS_TO_PRODUCT_DECISION | data_analytics | product_management | — | GENERIC_PRODUCT_PLANNING |
| ANALYTICS_TO_BUSINESS_INSIGHT | data_analytics | business_planning, management_planning | — | GENERIC_BUSINESS_PLANNING |
| PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT | performance_marketing | product_management | targetSubType != "growth" 이면 경고 | GENERIC_PRODUCT_PLANNING |
| PERFORMANCE_MARKETING_TO_SERVICE_PLANNING | performance_marketing, crm_marketing, brand_marketing | service_planning | — | GENERIC_SERVICE_PLANNING |
| CX_TO_SERVICE_DESIGN | design, research | service_design | targetGroup != service_design면 발화 금지 | — |
| SALES_TO_BUSINESS_DEVELOPMENT | sales_b2b | business_development | — | GENERIC_BUSINESS_DEV |
| SALES_TO_ACCOUNT_MANAGEMENT | sales_b2b | account_management | — | GENERIC_SALES |
| SALES_ADMIN_TO_BUSINESS_PLANNING | sales_admin | business_planning | — | GENERIC_BUSINESS_PLANNING |
| ACCOUNTING_TO_BUSINESS_FINANCE | accounting | finance_planning | targetSubType == "management_planning" | GENERIC_FINANCE |
| ACCOUNTING_TO_MANAGEMENT_PLANNING | accounting | management_planning | targetSubType == "fpa" | GENERIC_FINANCE |
| HR_OPERATIONS_TO_HRBP | hr_operations | hrbp | sourceSubType == "recruiting" | GENERIC_HRBP |
| RECRUITING_TO_HRBP | recruiting | hrbp | sourceSubType != "recruiting" | GENERIC_HRBP |
| PROCUREMENT_TO_BUSINESS_PLANNING | procurement | business_planning | — | GENERIC_BUSINESS_PLANNING |
| ENGINEERING_TO_PRODUCT_PLANNING | engineering | product_management, service_planning | — | GENERIC_PRODUCT_PLANNING |
| TECH_SUPPORT_TO_SERVICE_PLANNING | technical_support | service_planning | — | GENERIC_SERVICE_PLANNING |
| DESIGN_TO_PRODUCT_PLANNING | design | product_management, service_planning | targetGroup == service_design | GENERIC_SERVICE_PLANNING |
| RESEARCH_TO_PRODUCT_OR_STRATEGY | research | product_management, business_planning | — | GENERIC_PRODUCT_PLANNING |
| ADMIN_TO_BUSINESS_PLANNING | admin | business_planning | — | GENERIC_FALLBACK (최저 신뢰도) |
| CUSTOMER_SUPPORT_TO_SERVICE_PLANNING | customer_support | service_planning | sourceSubType 미분리 시 수동 확인 | GENERIC_SERVICE_PLANNING |
| CUSTOMER_SUCCESS_TO_SERVICE_PLANNING | customer_success | service_planning | **PENDING_TAXONOMY** — 자동 발화 금지 | GENERIC_SERVICE_PLANNING |

### 다중 archetype 후보 충돌 처리

동일 (sourceGroup, targetGroup) 조합에 2개 이상 archetype이 매칭되는 경우:

1. targetSubType이 있으면 subType으로 1개로 좁힌다.
2. sourceSubType이 있으면 sourceSubType으로 1개로 좁힌다.
3. 여전히 2개 이상이면 status == ACTIVE인 archetype 우선.
4. 모두 DRAFT이면 canonicalExample과 가장 가까운 archetype 선택.
5. 판단 불가 시 Generic Fallback.

---

## 5. Modifier Selection Rules

### 5-1. Domain Modifier (1개만 선택)

```
if sourceDomain == targetDomain:
  → same_domain

elif 상위 산업군 일치 (tech↔tech, finance↔finance, retail↔retail 등):
  → adjacent_domain

elif targetIndustryCharacter == 'regulated':
  → regulated_domain

elif targetIndustryCharacter == 'platform':
  → platform_domain

elif targetIndustryCharacter == 'data_heavy':
  → technical_data_heavy_domain

elif targetIndustryCharacter == 'b2b':
  → b2b_saas_domain

elif targetIndustryCharacter == 'b2c':
  → b2c_consumer

elif targetIndustryCharacter == 'offline':
  → offline_operation_heavy

else:
  → different_domain
```

### 5-2. Seniority Modifier (1개만 선택)

```
if yearsOfExperience <= 3:
  → junior

elif yearsOfExperience <= 7:
  if hasLeadershipEvidence:
    → leadership_evidence_present
  else:
    → mid

else (8년 이상):
  if hasOwnershipEvidence AND (hasStrategyEvidence OR hasRoadmapEvidence):
    → senior
  elif hasLeadershipEvidence:
    → leadership_evidence_present
  else:
    → senior_without_ownership_risk
```

### 5-3. Evidence Modifier (최대 2개, 충돌 조합 금지)

```
candidates = []

if evidenceStrength == 'strong' AND hasMetricEvidence:
  candidates.push('metric_evidence')

elif NOT hasMetricEvidence:
  candidates.push('weak_evidence')  # 단, ownership_evidence와 충돌 — 동시 금지

if hasOwnershipEvidence AND NOT candidates.includes('weak_evidence'):
  candidates.push('ownership_evidence')

if hasCrossFunctional:
  candidates.push('crossfunctional_evidence')

if hasCustomerEvidence:
  candidates.push('customer_problem_evidence')

if hasStrategyEvidence:
  candidates.push('strategy_evidence')

if hasRoadmapEvidence:
  candidates.push('roadmap_evidence')

if hasProcessImprovement:
  candidates.push('process_improvement_evidence')

# 우선순위로 2개까지 선택:
# output_only + metric_evidence 조합 금지
# weak_evidence + ownership_evidence 조합 금지
# senior_without_ownership_risk + ownership_evidence 조합 금지
selected = dedup_and_limit(candidates, max=2, conflictTable)
```

충돌 테이블:

| modifier A | modifier B | 처리 |
|---|---|---|
| output_only | metric_evidence | metric_evidence 우선, output_only 제거 |
| weak_evidence | ownership_evidence | ownership_evidence 우선, weak_evidence 제거 |
| metric_evidence | weak_evidence | metric_evidence 우선, weak_evidence 제거 |

### 5-4. Target Role Modifier (1개만 선택)

```
switch targetGroup:
  case product_management:
    if targetSubType == 'growth': → target_growth
    else: → target_product_ownership

  case product_owner_delivery:
    → target_product_ownership (BLOCKED_TAXONOMY 케이스는 이 단계 도달 불가)

  case service_planning:
    → target_service_flow

  case business_planning, management_planning:
    → target_business_strategy

  case finance_planning:
    → target_finance_planning

  case hrbp:
    → target_people_partner

  case business_development, account_management:
    → target_business_strategy (nearest match)

  case operations_planning:
    → target_operations_excellence

  default:
    → null (target role modifier 미적용)
```

---

## 6. Conflict / Co-fire 방지 규칙

### 6-1. 자동 발화 금지 목록

| 조건 | 처리 |
|---|---|
| caseMode == BLOCKED_TAXONOMY | Curated 매칭 스킵, Archetype으로 넘기지 않음 |
| caseMode == PENDING_TAXONOMY | Curated 매칭 스킵. Archetype도 자동 발화 금지. Generic Fallback 또는 수동 처리 |
| targetJobId가 PM/PO 공용 ID인데 targetSubType 없음 | Archetype 선택 중단, subType 입력 요청 또는 Generic Fallback |
| sourceJobId가 CS/CX처럼 혼용 ID인데 sourceSubType 없음 | customer_support vs customer_success 판단 보류, 가장 안전한 Fallback 사용 |

### 6-2. 직무군 간 fallback 금지

아래 targetGroup 사이에서는 서로 fallback이 발생하지 않도록 한다.

| targetGroup A | targetGroup B | 이유 |
|---|---|---|
| product_management | service_planning | PM/서비스기획 산출물 방향이 다름 |
| product_management | business_planning | 제품/사업 판단 기준이 다름 |
| service_planning | service_design | 정책·화면 기획 vs 리서치·경험 설계 |
| service_planning | business_planning | UX흐름 vs 수익·전략 판단 기준 다름 |
| finance_planning | management_planning | FP&A vs 경영기획 역할 구분 |
| hr_operations | hrbp | 제도 운영 vs 현업 파트너링 |
| customer_support | customer_success | VOC 처리 vs 온보딩·리텐션 관리 |

### 6-3. Curated vs Archetype 동시 활성화 방지

```
if curatedCase.status >= LOCKED AND curatedCase.caseMode == CURATED:
  → 즉시 return curated result
  → archetype selection SKIP
  → modifier selection SKIP
```

---

## 7. Output Slot 설계

Resolver가 최종적으로 생성하는 output은 기존 UI slot에 맞춘다.
새 UI는 설계하지 않는다.

### 7-1. 필수 slot

| slot | 소스 |
|---|---|
| jobStructure.lead | archetype axisOverlayTemplate.jobStructure.lead |
| jobStructure.scoreReason | archetype base + seniority/evidence modifier delta |
| jobStructure.criteria | archetype base + target role modifier 보완 |
| responsibilityScope.lead | archetype axisOverlayTemplate.responsibilityScope.lead |
| responsibilityScope.liftOrLimit | archetype base + evidence modifier delta |

### 7-2. 선택 slot

| slot | 소스 |
|---|---|
| domainFit.lead | domain modifier userFacingCopy |
| evidenceQuality.scoreReason | evidence modifier riskCopy |
| resumeRewriteDirection | archetype resumeRewriteDirection + evidence modifier resumeRewriteHint |

### 7-3. Modifier delta 적용 원칙

- archetype의 base `lead` 문구는 변경하지 않는다.
- modifier는 `scoreReason`과 `liftOrLimit`만 조정한다.
- modifier가 2개 이상 선택된 경우 scoreReason에 이어붙이되,
  문장이 중복되면 짧게 병합한다.
- 최종 scoreReason 길이: 문장 2~3개 이내.

### 7-4. Resolver Output 구조

```json
{
  "resolverResult": {
    "tier": 1 | 2 | 3 | 4,
    "curatedCaseKey": "EXPERIENCED_..._V2" | null,
    "archetypeId": "PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP" | null,
    "modifiers": {
      "domain": "same_domain" | null,
      "seniority": "mid" | null,
      "evidence": ["metric_evidence", "crossfunctional_evidence"],
      "targetRole": "target_product_ownership" | null
    },
    "slots": {
      "jobStructure": {
        "lead": "...",
        "scoreReason": "...",
        "criteria": "..."
      },
      "responsibilityScope": {
        "lead": "...",
        "liftOrLimit": "..."
      },
      "domainFit": {
        "lead": "..." | null
      },
      "evidenceQuality": {
        "scoreReason": "..." | null
      },
      "resumeRewriteDirection": "..." | null
    },
    "warnings": [
      "PENDING_TAXONOMY: CUSTOMER_SUCCESS sourceId 미분리",
      "LOW_CONFIDENCE: sourceGroup == admin"
    ]
  }
}
```

---

## 8. 예시 5개 (Resolver Trace)

---

### 예시 A: 서비스기획 → PM (Curated Override)

```
입력:
  sourceJobId: JOB_SERVICE_PLANNING_001
  targetJobId: JOB_IT_PRODUCT_MANAGEMENT_001
  sourceDomain: ecommerce
  targetDomain: ecommerce
  yearsOfExperience: 4
  candidateEvidencePack:
    hasMetricEvidence: true
    hasRoadmapEvidence: true
    evidenceStrength: 'moderate'

Step 1: Curated Case 조회
  → matrix 검색: sourceJobId + targetJobId
  → EXPERIENCED_SERVICE_PLANNING_TO_PRODUCT_MANAGER_V2 발견
  → status: VERIFIED, caseMode: CURATED
  → 즉시 return

결과:
  tier: 1
  curatedCaseKey: EXPERIENCED_SERVICE_PLANNING_TO_PRODUCT_MANAGER_V2
  archetypeId: null (curated override)
  modifiers: 모두 null (curated 우선)
  warnings: []
```

---

### 예시 B: 영업관리 → 사업기획 (Archetype + Modifier)

```
입력:
  sourceJobId: JOB_SALES_ADMIN_001
  targetJobId: JOB_BUSINESS_PLANNING_001
  sourceDomain: retail
  targetDomain: ecommerce
  yearsOfExperience: 5
  candidateEvidencePack:
    hasMetricEvidence: false
    hasProcessImprovement: true
    hasCrossFunctional: false
    evidenceStrength: 'weak'

Step 1: Curated Case 조회 → 없음
Step 2: sourceGroup 변환 → sales_admin
         targetGroup 변환 → business_planning
         archetypeMatchTable 조회 → SALES_ADMIN_TO_BUSINESS_PLANNING (DRAFT)
         blockedWhen 확인 → 없음
         → 매칭 성공

Step 3: Modifier 선택
  Domain: retail ≠ ecommerce, 같은 상위 유통군 → adjacent_domain
  Seniority: 5년 → mid
  Evidence:
    hasMetricEvidence: false → weak_evidence 후보
    hasProcessImprovement: true → process_improvement_evidence
    → 2개 선택: weak_evidence + process_improvement_evidence
      (충돌 없음)
  TargetRole: business_planning → target_business_strategy

결과:
  tier: 3
  archetypeId: SALES_ADMIN_TO_BUSINESS_PLANNING
  modifiers:
    domain: adjacent_domain
    seniority: mid
    evidence: [weak_evidence, process_improvement_evidence]
    targetRole: target_business_strategy
  warnings: ["ARCHETYPE_STATUS: DRAFT — curated case 없음. 문구 품질 수동 검토 권장"]
```

---

### 예시 C: 회계 → FP&A (Archetype Match — curated TODO 처리)

```
입력:
  sourceJobId: JOB_ACCOUNTING_001
  targetJobId: JOB_FINANCE_FPA_001
  sourceDomain: manufacturing
  targetDomain: manufacturing
  yearsOfExperience: 3
  candidateEvidencePack:
    hasMetricEvidence: false
    hasStrategyEvidence: false
    evidenceStrength: 'weak'

Step 1: Curated Case 조회
  → EXPERIENCED_ACCOUNTING_TO_FPA_V1 발견
  → status: TODO, caseMode: CURATED
  → TODO는 LOCKED 미만 → curated override 불가, 다음 단계로

Step 2: sourceGroup → accounting
         targetGroup → finance_planning
         archetypeMatchTable → ACCOUNTING_TO_BUSINESS_FINANCE (DRAFT)
         blockedWhen: targetSubType == "management_planning" → 해당 없음
         → 매칭 성공

Step 3: Modifier 선택
  Domain: manufacturing == manufacturing → same_domain
  Seniority: 3년 → junior
  Evidence:
    hasMetricEvidence: false → weak_evidence
    evidenceStrength: 'weak' → output_only 후보
    → output_only + weak_evidence는 중복 효과, output_only 1개 선택
  TargetRole: finance_planning → target_finance_planning

결과:
  tier: 2 (Exact Match, modifiers 부가)
  archetypeId: ACCOUNTING_TO_BUSINESS_FINANCE
  modifiers:
    domain: same_domain
    seniority: junior
    evidence: [output_only]
    targetRole: target_finance_planning
  warnings:
    - "CURATED_TODO: EXPERIENCED_ACCOUNTING_TO_FPA_V1 설계 대기 중"
    - "ARCHETYPE_STATUS: DRAFT"
```

---

### 예시 D: CS/고객지원 → 서비스기획 (CUSTOMER_SUPPORT archetype)

```
입력:
  sourceJobId: JOB_CS_SUPPORT_001
  sourceSubType: "customer_support"  ← 분리된 subType 있음
  targetJobId: JOB_SERVICE_PLANNING_001
  sourceDomain: fintech
  targetDomain: fintech
  yearsOfExperience: 4
  candidateEvidencePack:
    hasCustomerEvidence: true
    hasProcessImprovement: true
    hasMetricEvidence: false
    evidenceStrength: 'moderate'

Step 1: Curated Case 조회
  → EXPERIENCED_CX_TO_SERVICE_PLANNING_V1 발견
  → caseMode: PENDING_TAXONOMY
  → PENDING_TAXONOMY → curated 자동 발화 금지

Step 2: sourceGroup → customer_support (sourceSubType으로 분리 판단)
         targetGroup → service_planning
         archetypeMatchTable → CUSTOMER_SUPPORT_TO_SERVICE_PLANNING (DRAFT)
         blockedWhen: sourceSubType 미분리 시 수동 확인
           → sourceSubType == "customer_support" 있음 → 진행 가능
         → 매칭 성공

Step 3: Modifier 선택
  Domain: fintech == fintech → same_domain → regulated_domain 검토
    fintech는 규제 도메인이므로 → regulated_domain
  Seniority: 4년 → mid
  Evidence: customer_problem_evidence, process_improvement_evidence → 2개 선택
  TargetRole: service_planning → target_service_flow

결과:
  tier: 2
  archetypeId: CUSTOMER_SUPPORT_TO_SERVICE_PLANNING
  modifiers:
    domain: regulated_domain
    seniority: mid
    evidence: [customer_problem_evidence, process_improvement_evidence]
    targetRole: target_service_flow
  warnings:
    - "PENDING_TAXONOMY: EXPERIENCED_CX_TO_SERVICE_PLANNING_V1 taxonomyId 미분리"
    - "ARCHETYPE_STATUS: DRAFT — 수동 검토 권장"
```

---

### 예시 E: CX/Customer Success → 서비스기획 (PENDING_TAXONOMY — 자동 발화 금지)

```
입력:
  sourceJobId: JOB_CX_CS_001  ← CS/CX 공용 taxonomy ID
  sourceSubType: "customer_success"  ← 분리 시도
  targetJobId: JOB_SERVICE_PLANNING_001
  sourceDomain: b2b_saas
  targetDomain: b2b_saas
  yearsOfExperience: 6

Step 1: Curated Case 조회
  → EXPERIENCED_CX_TO_SERVICE_PLANNING_V1 발견
  → caseMode: PENDING_TAXONOMY
  → 자동 발화 금지

Step 2: sourceGroup 변환 시도
  → sourceJobId: JOB_CX_CS_001 → 공용 ID
  → sourceSubType: "customer_success" → customer_success 그룹으로 판단
  → archetypeMatchTable → CUSTOMER_SUCCESS_TO_SERVICE_PLANNING
  → blockedWhen 확인: PENDING_TAXONOMY → 자동 발화 금지

Step 3: 자동 발화 불가

결과:
  tier: 4 (Generic Fallback)
  archetypeId: null
  modifiers: null
  slots:
    jobStructure.lead:
      "CSM/고객성공 경험은 서비스기획과 연결될 수 있는 부분이 있습니다."
    jobStructure.scoreReason:
      "다만 서비스기획은 고객 성공을 지원하는 역할이 아니라,
       고객이 사용하는 서비스의 흐름·기능·정책을 직접 설계하는 역할입니다.
       온보딩 경험이 어떤 화면 흐름이나 기능 요구사항으로 연결되었는지가
       핵심 판단 기준입니다."
    resumeRewriteDirection:
      "온보딩 지원 경험을 서비스 흐름 개선 관점으로 재작성 필요."
  warnings:
    - "PENDING_TAXONOMY: CUSTOMER_SUCCESS sourceId(JOB_CX_CS_001) 미분리"
    - "ARCHETYPE_BLOCKED: CUSTOMER_SUCCESS_TO_SERVICE_PLANNING PENDING_TAXONOMY"
    - "GENERIC_FALLBACK 적용됨 — taxonomy 분리 후 archetype 자동 선택 가능"
```

---

## 9. 구현 전 Smoke 체크리스트

Resolver 코드 구현 전에 아래 항목을 문서 수준에서 확인한다.

### 필수 확인

- [ ] sourceJobId → sourceGroup 매핑 테이블 완성 (taxonomy 기반)
- [ ] targetJobId → targetGroup 매핑 테이블 완성
- [ ] PM/PO 공용 taxonomyId 분리 상태 확인 (BLOCKED_TAXONOMY 해제 시점)
- [ ] CS/CX 공용 taxonomyId 분리 상태 확인 (PENDING_TAXONOMY 해제 시점)
- [ ] DRAFT archetype 26개 중 axisOverlayTemplate 없는 archetype 목록 파악
  (현재 ACTIVE 6개만 overlay 있음. DRAFT 20개는 Covers/Not Covers/Resume Direction만 있음)

### 코드 구현 가능 조건

아래 조건이 모두 충족된 후 코드 구현 진행:

1. sourceJobId/targetJobId → jobGroup 매핑 테이블 완성
2. ACTIVE archetype 6개의 axisOverlayTemplate이 코드 slot에 매핑됨
3. modifier delta 적용 함수 설계 완료
4. BLOCKED/PENDING_TAXONOMY 케이스 처리 로직 확정

### 코드 구현 없이 문서만 더 보강할 조건

- DRAFT archetype의 axisOverlayTemplate이 없는 경우
- jobGroup → taxonomyId 매핑 테이블이 미완성인 경우
- modifier delta 적용 방식이 기존 UI slot과 호환성이 불명확한 경우

---

## 10. 구현 권장 순서

Phase 1 — 문서 완성 (지금)
1. ✅ ARCHETYPE_RESOLVER_DESIGN.md (이 문서)
2. ✅ JOB_GROUP_TAXONOMY_MAP.md 작성 — CONFIRMED 16개, UNKNOWN 10개 (2026-05-01)
3. ✅ DRAFT archetype 16개에 Overlay Seed 작성 (2026-05-01)
   - CONFIRMED: OPERATIONS_TO_SERVICE_PLANNING, OPERATIONS_TO_BUSINESS_PLANNING,
     ANALYTICS_TO_BUSINESS_INSIGHT, SALES_TO_ACCOUNT_MANAGEMENT,
     SALES_ADMIN_TO_BUSINESS_PLANNING, ACCOUNTING_TO_MANAGEMENT_PLANNING,
     HR_OPERATIONS_TO_HRBP, RECRUITING_TO_HRBP, PROCUREMENT_TO_BUSINESS_PLANNING,
     ENGINEERING_TO_PRODUCT_PLANNING, TECH_SUPPORT_TO_SERVICE_PLANNING,
     DESIGN_TO_PRODUCT_PLANNING, RESEARCH_TO_PRODUCT_OR_STRATEGY,
     ADMIN_TO_BUSINESS_PLANNING, CUSTOMER_SUPPORT_TO_SERVICE_PLANNING,
     CUSTOMER_SUCCESS_TO_SERVICE_PLANNING

Phase 2 — Smoke 설계 ✅ 완료 (2026-05-01)
4. ✅ Resolver 입력/출력 계약 정의 (ARCHETYPE_RESOLVER_SMOKE_SPEC.md §2~3)
5. ✅ Axis Slot Rule 정의 (ARCHETYPE_RESOLVER_SMOKE_SPEC.md §4)
6. ✅ Smoke Case 12개 작성 (ARCHETYPE_RESOLVER_SMOKE_SPEC.md §5)
7. ✅ Nonfire Rule 정의 (ARCHETYPE_RESOLVER_SMOKE_SPEC.md §6)
8. ✅ Implementation Readiness Gate 정의 (ARCHETYPE_RESOLVER_SMOKE_SPEC.md §7)

Phase 3 — 코드 구현
8. [ ] careerTransitionArchetypeResolver.js 신규 작성
9. [ ] 기존 careerTransitionCaseProfiles.js와 Resolver 연동
10. [ ] 단위 테스트: 예시 A~E trace 검증
11. [ ] 화면 smoke 테스트

---

## 다음 액션 판단

| 옵션 | 조건 | 권장도 |
|---|---|---|
| A: 문서 보강 | DRAFT archetype Overlay Seed 없음 | ✅ 완료 (2026-05-01) |
| B: jobGroup ↔ taxonomyId 테이블 | taxonomy ID 구조 확인 필요 | ✅ 완료 (2026-05-01) |
| C: Smoke 설계 | 입력/출력 계약 및 smoke case | ✅ 완료 (2026-05-01) |
| D: UNKNOWN ID 확인 | ✅ CONFIRMED 6개 + PARTIAL 4개 완료 (Phase 2.5) | ★★★ 완료 |
| D.5: SC-E12 결정 | ✅ JOB_DESIGN_UX_DESIGN 임시 사용 확정. 교차 fallback 금지 테스트로 한정 (Phase 2.6) | ★★★ 완료 |
| E: 코드 구현 | careerTransitionArchetypeResolver.js | ★★ 즉시 진입 가능 |

현재 상태: **Phase 2.6 완료. 전체 12개 smoke case CONFIRMED. Phase 3 진입 가능.**

코드 구현(Phase 3) 진입 조건:
1. ✅ JOB_GROUP_TAXONOMY_MAP.md UNKNOWN 10개 → CONFIRMED 6개 + PARTIAL 4개 (Phase 2.5 완료)
2. ✅ SC-D7, SC-D10 CONFIRMED 승격 완료 (JOB_SALES_SALES_OPERATIONS, JOB_HR_ORGANIZATION_HR_OPS, JOB_HR_ORGANIZATION_HRBP)
3. ✅ SC-E12 CONFIRMED — JOB_DESIGN_UX_DESIGN 임시 사용, 교차 fallback 금지 테스트 확정 (Phase 2.6)
   - service_design taxonomy는 추후 별도 정교화 가능
   - Phase 3 최소 구현에서 SC-E12는 fallback/block 테스트로만 사용
   - CX_TO_SERVICE_DESIGN archetype 자동 발화는 Phase 3에서도 제한
4. ✅ ARCHETYPE_RESOLVER_SMOKE_SPEC.md §7 Implementation Readiness Gate 전체 조건 충족

---

Version: 1.3.0
Updated: 2026-05-01
Changes: Phase 2.6 완료 반영. SC-E12 CONFIRMED. 전체 12개 smoke case CONFIRMED. Phase 3 진입 가능으로 상태 변경.
Created: 2026-05-01
