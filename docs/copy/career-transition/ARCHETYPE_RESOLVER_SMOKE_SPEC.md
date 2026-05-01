# ARCHETYPE_RESOLVER_SMOKE_SPEC

## 1. Purpose

Archetype Resolver 코드 구현 전, 입력/출력 계약과 경계 조건을 문서로 확정하는 smoke spec이다.

이 문서는 계약 문서다. TypeScript 코드 파일이 아니며, 구현 의도를 명시하는 설계 계약이다.
코드 구현은 이 문서가 검토 완료된 이후에 시작한다.

관련 문서:
- ARCHETYPE_RESOLVER_DESIGN.md — 전체 설계 명세, Job Group 매핑, archetype 매치 규칙
- ARCHETYPE_REGISTRY.md — 26개 archetype 카탈로그 및 Overlay Seed
- MODIFIER_REGISTRY.md — 32개 modifier 카탈로그
- JOB_GROUP_TAXONOMY_MAP.md — jobGroup ↔ taxonomyId 매핑, CONFIRMED/UNKNOWN 목록
- CAREER_TRANSITION_COPY_MATRIX.md — curated case 파이프라인 상태

---

## 2. Resolver Input Contract

```typescript
// 계약 문서용 인터페이스 정의 — 실제 파일 생성 금지
interface ResolverInput {
  // 필수
  sourceJobId: string;          // 현재 직무 taxonomy ID (예: JOB_BUSINESS_SERVICE_PLANNING)
  targetJobId: string;          // 목표 직무 taxonomy ID (예: JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT)

  // 선택 — 분기 정확도를 높임
  sourceIndustryId?: string;    // 현재 직무 산업 ID (domain modifier 선택에 사용)
  targetIndustryId?: string;    // 목표 직무 산업 ID
  yearsOfExperience?: number;   // 총 경력 연수 (seniority modifier 선택에 사용)
  targetJobLabel?: string;      // 화면 표시용 목표 직무명 (예: "PM/Product Manager")
  targetSubType?: string;       // PO/PM 분기, 경영기획/FP&A 분기 등 세분화 힌트
  sourceSubType?: string;       // CS/고객지원 vs 고객성공 분기 등 세분화 힌트
  candidateEvidencePack?: CandidateEvidencePack;
}

interface CandidateEvidencePack {
  hasMetricEvidence: boolean;            // 정량 성과 수치 있음 (예: 전환율 N% 개선)
  hasWeakMetricEvidence: boolean;        // 정량 수치가 있으나 역할 기여 불명확
  hasExecutionOnlyEvidence: boolean;     // 실행 중심 산출물만 있음, 판단/오너십 근거 없음
  hasCrossFunctionalEvidence: boolean;   // 타부서 협업/조율 증거 있음
  hasCustomerProblemEvidence: boolean;   // 고객 문제 발견·VOC 분석 증거 있음
  hasStrategyEvidence: boolean;          // 전략/사업 판단 기여 증거 있음
  hasRoadmapEvidence: boolean;           // 로드맵/우선순위 결정 증거 있음
  hasProcessImprovementEvidence: boolean;// 프로세스 개선 경험 있음
  hasLeadershipEvidence: boolean;        // 팀리드/의사결정 영향력 증거 있음
  evidenceSummary?: string;              // 자유 텍스트 요약 (optional)
}
```

### 입력값 처리 원칙

| 상황 | 처리 |
|---|---|
| sourceJobId가 JOB_GROUP_TAXONOMY_MAP.md에 없음 | FALLBACK 직행 |
| targetJobId가 JOB_GROUP_TAXONOMY_MAP.md에 없음 | FALLBACK 직행 |
| targetJobId가 PM/PO 공용 ID인데 targetSubType 없음 | BLOCKED_TAXONOMY |
| sourceJobId가 PENDING taxonomy (customer_success)인데 subType 없음 | PENDING_TAXONOMY |
| candidateEvidencePack 없음 | seniority modifier만 적용, evidence modifier 미적용 |
| yearsOfExperience 없음 | seniority modifier 미적용 |

---

## 3. Resolver Output Contract

```typescript
// 계약 문서용 출력 타입 정의 — 실제 파일 생성 금지
interface ResolverOutput {
  // 처리 결과 상태
  resolutionStatus:
    | 'CURATED_MATCH'          // 1순위: curated case 직접 매칭
    | 'ARCHETYPE_MATCH'        // 2순위: archetype 단독 매칭
    | 'ARCHETYPE_WITH_MODIFIER'// 3순위: archetype + modifier 조합
    | 'BLOCKED_TAXONOMY'       // taxonomy 충돌로 자동 발화 불가
    | 'PENDING_TAXONOMY'       // taxonomy 미분리로 자동 발화 보류
    | 'FALLBACK';              // 4순위: 범용 fallback

  // 선택 결과
  selectedCaseId?: string;       // CURATED_MATCH 시 case 키 (예: EXPERIENCED_SERVICE_PLANNING_TO_PRODUCT_MANAGER_V2)
  selectedArchetypeId?: string;  // 선택된 archetype (예: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP)
  selectedModifiers: string[];   // 적용된 modifier 목록 (CURATED_MATCH 시 비어있음)

  // 경로 추적
  sourceGroup?: string;          // 매핑된 source jobGroup (예: service_planning)
  targetGroup?: string;          // 매핑된 target jobGroup (예: product_management)
  blockedReason?: string;        // BLOCKED/PENDING_TAXONOMY 시 이유 명시

  // 신뢰도
  confidence: 'high' | 'medium' | 'low';

  // 실제 overlay 출력
  overlays: {
    jobStructure: {
      lead: string;
      scoreReason: string;
      criteria: string;
    };
    [secondaryAxis: string]: {   // secondaryAxis는 archetype별로 다름 (아래 §4 참조)
      lead: string;
      liftOrLimit: string;
    };
  };
}
```

---

## 4. Axis Slot Rule

### 필수 규칙

- 모든 resolver 결과는 `jobStructure` 3개 slot을 반드시 포함해야 한다 (lead, scoreReason, criteria).
- CURATED_MATCH 시 overlay는 curated case 전문에서 가져온다.
- ARCHETYPE_MATCH / ARCHETYPE_WITH_MODIFIER 시 overlay는 archetype Overlay Seed에서 가져온다.
- BLOCKED_TAXONOMY / PENDING_TAXONOMY / FALLBACK 시 overlay는 Generic Fallback 문구를 사용하되, 빈 문장 금지.

### secondaryAxis 선택 규칙

| 적용 조건 | secondaryAxis |
|---|---|
| 기본 (대부분의 경우) | responsibilityScope |
| 고객 접점/영업/CS/기술지원 계열 | customerType |
| 산업 전환 거리가 핵심 판단 요소인 경우 | domainFit |
| 증거 품질 차이가 전환 가능성의 유일한 기준인 경우 | evidenceQuality |

### secondaryAxis 허용 값

| axisKey | 사용 가능 여부 | 비고 |
|---|---|---|
| responsibilityScope | 허용 (기본값) | |
| customerType | 허용 | CS/기술지원/영업 계열 전용 |
| domainFit | 허용 | 도메인 전환이 판단 핵심일 때만 |
| evidenceQuality | 허용 | 증거 품질 차이가 결정적일 때만 |
| industryContext | 조건부 허용 | 기존 ACTIVE curated case의 기존 slot 유지용 |
| jobStructure | 금지 (primary 중복) | |
| roleCharacter | 주의 — UI 렌더 가능 여부 확인 필요 | ACTIVE curated case에 없으면 미사용 |

### Fallback 규칙

UI 렌더 가능 여부가 불확실한 axisKey는 `responsibilityScope`로 fallback한다.
신규 axisKey 사용 전 UI 컴포넌트 연결 여부를 먼저 확인한다.

---

## 5. Smoke Cases

총 12개. A~E 그룹으로 분류.

---

### SC-A1: 서비스기획 → PM (Curated 정상 발화)

```yaml
id: SC-A1
group: A_Curated_Normal
description: 가장 많이 사용되는 CURATED_MATCH 케이스. overlay가 curated case에서 오는지 확인한다.

input:
  sourceJobId: JOB_BUSINESS_SERVICE_PLANNING
  targetJobId: JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT
  targetSubType: null                    # PO가 아님
  yearsOfExperience: 5
  sourceIndustryId: INDUSTRY_IT_PLATFORM
  targetIndustryId: INDUSTRY_IT_PLATFORM
  candidateEvidencePack:
    hasMetricEvidence: true
    hasWeakMetricEvidence: false
    hasExecutionOnlyEvidence: false
    hasCrossFunctionalEvidence: true
    hasCustomerProblemEvidence: false
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: false
    hasLeadershipEvidence: false

expected:
  resolutionStatus: CURATED_MATCH
  selectedCaseId: EXPERIENCED_SERVICE_PLANNING_TO_PRODUCT_MANAGER_V2
  selectedArchetypeId: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP
  selectedModifiers: []                  # CURATED_MATCH 시 modifier 미적용
  sourceGroup: service_planning
  targetGroup: product_management
  secondaryAxis: responsibilityScope
  confidence: high
  requiredPhrases:
    - 문제정의
    - 우선순위
    - 제품 오너십
  forbiddenPhrases:
    - 백로그 관리                         # PO 문구 혼용 금지
    - 스프린트
    - 수익모델                            # 사업기획 문구 혼용 금지
    - 시장 전략
```

---

### SC-A2: 서비스기획 → 사업기획 (Curated 정상 발화)

```yaml
id: SC-A2
group: A_Curated_Normal
description: 서비스기획→사업기획 CURATED_MATCH. PM 케이스와 overlay가 교차하지 않는지 확인한다.

input:
  sourceJobId: JOB_BUSINESS_SERVICE_PLANNING
  targetJobId: JOB_BUSINESS_BUSINESS_PLANNING
  targetSubType: null
  yearsOfExperience: 6
  sourceIndustryId: INDUSTRY_IT_PLATFORM
  targetIndustryId: INDUSTRY_IT_PLATFORM
  candidateEvidencePack:
    hasMetricEvidence: false
    hasWeakMetricEvidence: true
    hasExecutionOnlyEvidence: false
    hasCrossFunctionalEvidence: true
    hasCustomerProblemEvidence: false
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: false
    hasLeadershipEvidence: false

expected:
  resolutionStatus: CURATED_MATCH
  selectedCaseId: EXPERIENCED_SERVICE_PLANNING_TO_BUSINESS_PLANNING_V1
  selectedArchetypeId: PLANNING_OUTPUT_TO_BUSINESS_STRATEGY
  selectedModifiers: []
  sourceGroup: service_planning
  targetGroup: business_planning
  secondaryAxis: responsibilityScope
  confidence: high
  requiredPhrases:
    - 시장
    - 수익모델
    - 사업 성과
  forbiddenPhrases:
    - 기능 개선                           # PM 문구 혼용 금지
    - 제품 출시
    - 지표 개선                           # PM overlay 금지
    - 백로그                              # PO 문구 혼용 금지
```

---

### SC-B3: 퍼포먼스마케팅 → 서비스기획 (Curated, PM 문구 nonfire 확인)

```yaml
id: SC-B3
group: B_Curated_Profile
description: CURATED LOCKED 케이스. overlay가 PM/그로스 언어 없이 서비스기획 언어로만 구성되는지 확인.

input:
  sourceJobId: JOB_MARKETING_PERFORMANCE_MARKETING
  targetJobId: JOB_BUSINESS_SERVICE_PLANNING
  targetSubType: null
  yearsOfExperience: 4
  sourceIndustryId: INDUSTRY_ECOMMERCE
  targetIndustryId: INDUSTRY_ECOMMERCE
  candidateEvidencePack:
    hasMetricEvidence: true
    hasWeakMetricEvidence: false
    hasExecutionOnlyEvidence: false
    hasCrossFunctionalEvidence: false
    hasCustomerProblemEvidence: true
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: false
    hasLeadershipEvidence: false

expected:
  resolutionStatus: CURATED_MATCH
  selectedArchetypeId: PERFORMANCE_MARKETING_TO_SERVICE_PLANNING
  selectedModifiers: []
  sourceGroup: performance_marketing
  targetGroup: service_planning
  secondaryAxis: customerType
  confidence: medium             # LOCKED 상태 — 아직 VERIFIED 아님
  requiredPhrases:
    - 퍼널
    - 사용자 흐름
    - 서비스 구조
  forbiddenPhrases:
    - ROAS                                # 마케팅 지표 그대로 사용 금지
    - 전환율 최적화                        # 마케팅 KPI 금지
    - 로드맵                              # PM 문구 금지
    - 제품 PM
    - 그로스
```

---

### SC-B4: CS/고객지원 → 서비스기획 (Archetype 발화, 서비스디자인 nonfire)

```yaml
id: SC-B4
group: B_Curated_Profile
description: |
  고객지원 출신의 서비스기획 전환. CUSTOMER_SUPPORT_TO_SERVICE_PLANNING archetype 매칭.
  서비스디자인 언어(여정 지도, 사용성 테스트, 경험 아키텍처)가 섞이면 실패.
  고객성공(온보딩, 리텐션) 언어도 금지.

input:
  sourceJobId: JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS
  targetJobId: JOB_BUSINESS_SERVICE_PLANNING
  sourceSubType: customer_support        # 고객지원(CS) 명시 — 고객성공 아님
  yearsOfExperience: 4
  sourceIndustryId: INDUSTRY_FINTECH
  targetIndustryId: INDUSTRY_FINTECH
  candidateEvidencePack:
    hasMetricEvidence: false
    hasWeakMetricEvidence: false
    hasExecutionOnlyEvidence: false
    hasCrossFunctionalEvidence: false
    hasCustomerProblemEvidence: true
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: true
    hasLeadershipEvidence: false

expected:
  resolutionStatus: ARCHETYPE_MATCH
  selectedArchetypeId: CUSTOMER_SUPPORT_TO_SERVICE_PLANNING
  selectedModifiers:
    - customer_problem_evidence
    - process_improvement_evidence
  sourceGroup: customer_support
  targetGroup: service_planning
  secondaryAxis: customerType
  confidence: medium
  requiredPhrases:
    - VOC
    - 반복 문의
    - 서비스 구조
    - 정책 개선
  forbiddenPhrases:
    - 여정 지도                           # 서비스디자인 언어 금지
    - 사용성 테스트                        # 서비스디자인 언어 금지
    - 경험 아키텍처                        # 서비스디자인 언어 금지
    - 온보딩                              # 고객성공 언어 금지
    - 리텐션                              # 고객성공 언어 금지
    - NPS                                # 고객성공 KPI 금지
```

---

### SC-C5: 서비스기획 → PO (BLOCKED_TAXONOMY)

```yaml
id: SC-C5
group: C_Taxonomy_Block
description: |
  PO 전환은 PM과 동일 taxonomyId를 공유하므로 자동 발화 불가.
  targetSubType이 'PO'로 명시되었을 때 BLOCKED_TAXONOMY를 반환하는지 확인.

input:
  sourceJobId: JOB_BUSINESS_SERVICE_PLANNING
  targetJobId: JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT
  targetSubType: PO                      # PO 명시
  yearsOfExperience: 5
  sourceIndustryId: INDUSTRY_IT_PLATFORM
  targetIndustryId: INDUSTRY_IT_PLATFORM

expected:
  resolutionStatus: BLOCKED_TAXONOMY
  selectedCaseId: EXPERIENCED_SERVICE_PLANNING_TO_PO_V1
  selectedArchetypeId: null              # archetype 자동 발화 금지
  selectedModifiers: []
  sourceGroup: service_planning
  targetGroup: null                      # product_owner_delivery 분리 전 판단 불가
  blockedReason: PM/PO 공용 taxonomyId(JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT). targetSubType PO 분리 완료 전 자동 발화 불가.
  confidence: low
  requiredPhrases: []
  forbiddenPhrases:
    - 문제정의                            # PM overlay 금지
    - 제품 오너십                          # PM overlay 금지
    - 지표 개선
```

---

### SC-C6: 고객성공/CSM → 서비스기획 (PENDING_TAXONOMY)

```yaml
id: SC-C6
group: C_Taxonomy_Block
description: |
  customer_success sourceJobId는 taxonomy 처리 로직이 미구현 상태.
  CUSTOMER_SUCCESS_TO_SERVICE_PLANNING archetype이 자동 발화하면 실패.
  Generic Fallback 또는 PENDING_TAXONOMY 반환 필요.

input:
  sourceJobId: JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS
  targetJobId: JOB_BUSINESS_SERVICE_PLANNING
  sourceSubType: null                    # subType 미제공
  yearsOfExperience: 4
  sourceIndustryId: INDUSTRY_B2B_SAAS
  targetIndustryId: INDUSTRY_B2B_SAAS

expected:
  resolutionStatus: PENDING_TAXONOMY
  selectedArchetypeId: null              # 자동 발화 금지
  selectedModifiers: []
  sourceGroup: customer_success
  targetGroup: service_planning
  blockedReason: JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS는 PENDING_TAXONOMY. CUSTOMER_SUCCESS_TO_SERVICE_PLANNING archetype 자동 발화 불가. 수동 처리 또는 GENERIC_FALLBACK 사용.
  confidence: low
  requiredPhrases: []
  forbiddenPhrases:
    - 온보딩 병목                         # CUSTOMER_SUCCESS 전용 overlay 금지 (자동 발화 불가)
    - 리텐션 데이터 분석
    - 고객 여정
```

---

### SC-D7: 영업관리 → 사업기획 (Archetype + Modifier)

```yaml
id: SC-D7
group: D_Archetype_Modifier
description: |
  sales_admin jobGroup taxonomyId Phase 2.5에서 CONFIRMED (JOB_SALES_SALES_OPERATIONS).
  archetype 선택 및 modifier 조합 로직의 계약을 검증한다.

input:
  sourceJobId: JOB_SALES_SALES_OPERATIONS  # Phase 2.5 확정. jobExtensions/sales_operations.js 확인.
  targetJobId: JOB_BUSINESS_BUSINESS_PLANNING
  targetSubType: null
  yearsOfExperience: 5
  sourceIndustryId: INDUSTRY_MANUFACTURING
  targetIndustryId: INDUSTRY_MANUFACTURING
  candidateEvidencePack:
    hasMetricEvidence: false
    hasWeakMetricEvidence: true
    hasExecutionOnlyEvidence: false
    hasCrossFunctionalEvidence: false
    hasCustomerProblemEvidence: false
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: true
    hasLeadershipEvidence: false

expected:
  resolutionStatus: ARCHETYPE_WITH_MODIFIER
  selectedArchetypeId: SALES_ADMIN_TO_BUSINESS_PLANNING
  selectedModifiers:
    - mid                                # 연차 5년 → mid
    - same_domain                        # 제조→제조 동일 도메인
    - process_improvement_evidence       # hasProcessImprovementEvidence=true
  sourceGroup: sales_admin
  targetGroup: business_planning
  secondaryAxis: responsibilityScope
  confidence: medium
  requiredPhrases:
    - 영업 데이터
    - 사업 인사이트
    - 전략적 해석
  forbiddenPhrases:
    - 딜 성사                             # SALES_TO_BUSINESS_DEVELOPMENT 언어 금지
    - 파트너십
    - 신규 사업 발굴
    - 분석 인사이트                        # ANALYTICS_TO_BUSINESS_INSIGHT 언어 금지

note: CONFIRMED. JOB_SALES_SALES_OPERATIONS (Phase 2.5 확정, 2026-05-01).
```

---

### SC-D8: 구매 → 사업기획 (Archetype + Modifier)

```yaml
id: SC-D8
group: D_Archetype_Modifier
description: procurement → business_planning 전환. 도메인이 다를 때 modifier 조합 확인.

input:
  sourceJobId: JOB_PROCUREMENT_SCM_PROCUREMENT
  targetJobId: JOB_BUSINESS_BUSINESS_PLANNING
  targetSubType: null
  yearsOfExperience: 6
  sourceIndustryId: INDUSTRY_LOGISTICS
  targetIndustryId: INDUSTRY_IT_PLATFORM  # 도메인 전환 있음
  candidateEvidencePack:
    hasMetricEvidence: true
    hasWeakMetricEvidence: false
    hasExecutionOnlyEvidence: false
    hasCrossFunctionalEvidence: false
    hasCustomerProblemEvidence: false
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: true
    hasLeadershipEvidence: false

expected:
  resolutionStatus: ARCHETYPE_WITH_MODIFIER
  selectedArchetypeId: PROCUREMENT_TO_BUSINESS_PLANNING
  selectedModifiers:
    - mid                                # 연차 6년 → mid
    - different_domain                   # 물류→IT 다른 도메인
    - metric_evidence                    # hasMetricEvidence=true, strong 신호
  sourceGroup: procurement
  targetGroup: business_planning
  secondaryAxis: responsibilityScope
  confidence: medium
  requiredPhrases:
    - 원가 구조
    - 수익성
    - 사업 판단
  forbiddenPhrases:
    - 딜 성사                             # sales_b2b 언어 금지
    - 파트너십                            # business_development 언어 금지
    - 분석 대시보드                        # analytics 언어 금지
```

---

### SC-D9: 회계 → FP&A (Archetype 매칭)

```yaml
id: SC-D9
group: D_Archetype_Modifier
description: |
  accounting → finance_planning 전환. EXPERIENCED_ACCOUNTING_TO_FPA_V1이 TODO 상태이므로
  CURATED_MATCH 아님. Archetype ACCOUNTING_TO_BUSINESS_FINANCE로 처리됨.
  경영기획(management_planning) 문구와 교차 금지.

input:
  sourceJobId: JOB_FINANCE_ACCOUNTING_ACCOUNTING
  targetJobId: JOB_FINANCE_ACCOUNTING_FP_AND_A
  targetSubType: fpa                     # FP&A 명시 (경영기획 아님)
  yearsOfExperience: 6
  sourceIndustryId: INDUSTRY_FINANCE
  targetIndustryId: INDUSTRY_FINANCE
  candidateEvidencePack:
    hasMetricEvidence: false
    hasWeakMetricEvidence: true
    hasExecutionOnlyEvidence: true
    hasCrossFunctionalEvidence: false
    hasCustomerProblemEvidence: false
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: false
    hasLeadershipEvidence: false

expected:
  resolutionStatus: ARCHETYPE_MATCH
  selectedArchetypeId: ACCOUNTING_TO_BUSINESS_FINANCE
  selectedModifiers:
    - mid
    - same_domain                        # 재무→재무 동일 도메인
  sourceGroup: accounting
  targetGroup: finance_planning
  secondaryAxis: responsibilityScope
  confidence: medium
  requiredPhrases:
    - 예산
    - 실적 분석
    - 사업부 의사결정
  forbiddenPhrases:
    - 경영진 보고서                        # 경영기획 overlap 금지
    - 전사 KPI                            # management_planning 언어 금지
    - 결산을 완료했다                       # 회계 원래 역할 표현 그대로 금지
```

---

### SC-D10: 인사운영 → HRBP (Archetype + Modifier)

```yaml
id: SC-D10
group: D_Archetype_Modifier
description: |
  hr_operations (JOB_HR_ORGANIZATION_HR_OPS)과 hrbp (JOB_HR_ORGANIZATION_HRBP) 모두 Phase 2.5 CONFIRMED.
  채용담당(recruiting) 출신과 혼용되지 않는지 확인한다.
  sourceSubType 으로 hr_operations 명시.

input:
  sourceJobId: JOB_HR_ORGANIZATION_HR_OPS   # Phase 2.5 확정. jobExtensions/hr_ops.js 확인.
  targetJobId: JOB_HR_ORGANIZATION_HRBP     # Phase 2.5 확정. jobExtensions/hrbp.js 확인.
  sourceSubType: hr_operations            # 채용(recruiting)이 아님을 명시
  yearsOfExperience: 5
  sourceIndustryId: INDUSTRY_IT_PLATFORM
  targetIndustryId: INDUSTRY_IT_PLATFORM
  candidateEvidencePack:
    hasMetricEvidence: false
    hasWeakMetricEvidence: false
    hasExecutionOnlyEvidence: false
    hasCrossFunctionalEvidence: true
    hasCustomerProblemEvidence: false
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: true
    hasLeadershipEvidence: false

expected:
  resolutionStatus: ARCHETYPE_WITH_MODIFIER
  selectedArchetypeId: HR_OPERATIONS_TO_HRBP
  selectedModifiers:
    - mid
    - same_domain
    - process_improvement_evidence
    - crossfunctional_evidence
  sourceGroup: hr_operations
  targetGroup: hrbp
  secondaryAxis: responsibilityScope
  confidence: medium
  requiredPhrases:
    - 인사 제도
    - 현업 파트너링
    - 조직 이슈
  forbiddenPhrases:
    - 채용 목표                           # RECRUITING_TO_HRBP 언어 금지
    - 채용 프로세스
    - JD 작성                             # 채용 언어 금지

note: CONFIRMED. hr_operations = JOB_HR_ORGANIZATION_HR_OPS, hrbp = JOB_HR_ORGANIZATION_HRBP (Phase 2.5 확정, 2026-05-01).
```

---

### SC-E11: UNKNOWN source → PM (Generic Fallback, 빈 문장 금지)

```yaml
id: SC-E11
group: E_Fallback
description: |
  sourceJobId가 JOB_GROUP_TAXONOMY_MAP.md에 없는 완전 미등록 ID.
  FALLBACK으로 처리하되, 빈 문장("연결성이 있습니다") 금지.
  현재 직무 경험과 목표 직무 요구의 구체적 차이 최소 1개를 명시해야 한다.

input:
  sourceJobId: JOB_COMPLETELY_UNKNOWN_UNREGISTERED   # 등록되지 않은 taxonomyId
  targetJobId: JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT
  targetSubType: null
  yearsOfExperience: 4
  sourceIndustryId: INDUSTRY_UNKNOWN
  targetIndustryId: INDUSTRY_IT_PLATFORM

expected:
  resolutionStatus: FALLBACK
  selectedArchetypeId: null
  selectedModifiers: []
  sourceGroup: null                      # 매핑 불가
  targetGroup: product_management
  confidence: low
  requiredPhrases:
    - 문제 정의                           # PM이 요구하는 역량 최소 1개 명시
    - 차이                               # 구체적 차이 또는 필요 경험 언급 필수
  forbiddenPhrases:
    - 연결성이 있습니다                    # 빈 문장 금지
    - 전환이 가능합니다                    # 근거 없는 긍정 금지
    - 직접적인 연결이 있습니다
```

---

### SC-E12: 서비스기획 → UX디자인 (Fallback, service_planning↔service_design 교차 금지)

```yaml
id: SC-E12
group: E_Fallback
description: |
  service_planning → UX_DESIGN 입력 시 서비스디자인으로의 자동 발화 금지 테스트.
  JOB_DESIGN_UX_DESIGN은 service_design 전체 대표 ID가 아니며,
  이 케이스에서는 service_planning과 service_design의 교차 fallback 금지 테스트용으로만 사용한다.

  이 케이스는 UX/UI 디자인 직무 전체를 대표하는 테스트가 아니라,
  service_planning과 service_design의 교차 fallback 금지 테스트다.

  targetSubType이 ambiguous_service_design이므로 어떤 archetype도 자동 발화 불가.
  두 방향의 overlay가 동시에 섞이면 실패.

input:
  sourceJobId: JOB_BUSINESS_SERVICE_PLANNING    # service_planning source (명확)
  targetJobId: JOB_DESIGN_UX_DESIGN            # SC-E12 교차 fallback 테스트용 ambiguity target (임시 사용)
  sourceSubType: service_planning
  targetSubType: ambiguous_service_design       # 서비스기획인지 서비스디자인인지 불명확
  yearsOfExperience: 4
  sourceIndustryId: INDUSTRY_IT_PLATFORM
  targetIndustryId: INDUSTRY_IT_PLATFORM
  candidateEvidencePack:
    hasMetricEvidence: false
    hasWeakMetricEvidence: false
    hasExecutionOnlyEvidence: false
    hasCrossFunctionalEvidence: false
    hasCustomerProblemEvidence: false
    hasStrategyEvidence: false
    hasRoadmapEvidence: false
    hasProcessImprovementEvidence: false
    hasLeadershipEvidence: false

expected:
  resolutionStatus: FALLBACK
  selectedArchetypeId: null              # CX_TO_SERVICE_DESIGN 자동 발화 금지
  selectedModifiers: []
  sourceGroup: service_planning
  targetGroup: null                      # targetSubType 미분리로 판단 불가
  blockedReason: targetSubType ambiguous_service_design — service_planning과 service_design 분기 불가. CX_TO_SERVICE_DESIGN 자동 발화 금지.
  confidence: low
  secondaryAxis: responsibilityScope
  requiredPhrases:
    - 목표 직무가 서비스기획인지 서비스디자인인지 불명확하면 자동 해석을 제한해야 한다
    - 화면/기능 요구사항과 리서치/경험설계는 구분해야 한다
  forbiddenPhrases:
    - 서비스기획 경험은 서비스디자인과 자연스럽게 연결됩니다  # 교차 자동 발화 금지
    - VOC를 기반으로 고객 여정을 설계하면 됩니다             # CS/CX overlay 금지
    - 여정 지도                           # 서비스디자인 언어 단독 사용 금지
    - 화면 흐름                           # 서비스기획 언어 확정 없이 사용 금지
    - 문제정의                            # PM overlay 금지
    - 제품 오너십                          # PM overlay 금지

note: |
  CONFIRMED. JOB_DESIGN_UX_DESIGN은 SC-E12 교차 fallback 금지 테스트용으로만 사용 (Phase 2.6, 2026-05-01).
  service_design 전체 taxonomy 대표 ID가 아님.
  CX_TO_SERVICE_DESIGN archetype 자동 발화는 Phase 3에서도 제한.
  service_design taxonomy 정교화는 추후 별도 진행.
  교차 fallback (서비스기획→서비스디자인 fallback 또는 역방향)은 절대 금지.
```

---

## 6. Nonfire Rules

아래 조건 중 하나라도 위반하면 resolver 출력이 유효하지 않다.

| 위반 조건 | 처리 |
|---|---|
| PM overlay 문구가 서비스기획/사업기획 케이스 결과에 포함됨 | 실패 |
| 사업기획 overlay 문구가 PM 케이스 결과에 포함됨 | 실패 |
| 서비스디자인 언어(여정 지도, 사용성 테스트, 경험 아키텍처)가 서비스기획 케이스 결과에 포함됨 | 실패 |
| 서비스기획 언어(정책 문서, 화면 흐름)가 서비스디자인 케이스 결과에 포함됨 | 실패 |
| CS(VOC 응대) 언어가 고객성공(온보딩·리텐션) 케이스 결과에 그대로 재사용됨 | 실패 |
| BLOCKED_TAXONOMY 케이스에서 archetype overlay가 자동 발화됨 | 실패 |
| PENDING_TAXONOMY 케이스에서 archetype overlay가 자동 발화됨 | 실패 |
| FALLBACK 결과에서 "연결성이 있습니다" 같은 빈 문장이 포함됨 | 실패 |
| UNKNOWN_TAXONOMY_ID를 임의 확정 값처럼 사용해 archetype이 선택됨 | 실패 |
| 동일 (sourceGroup, targetGroup)에 2개 이상 archetype이 동시 발화됨 | 실패 |
| CURATED_MATCH 결과에서 archetype modifier가 함께 적용됨 | 실패 |

---

## 7. Implementation Readiness Gate

아래 조건이 모두 충족되어야 코드 구현 가능 상태로 전환한다.

| 조건 | 상태 |
|---|---|
| 최소 12개 smoke case 정의 완료 | ✅ 완료 (12개) |
| 각 smoke case에 requiredPhrases/forbiddenPhrases 포함 | ✅ 완료 |
| secondaryAxis 허용 규칙 정의 완료 | ✅ 완료 (§4) |
| BLOCKED_TAXONOMY 테스트 포함 (SC-C5) | ✅ 완료 |
| PENDING_TAXONOMY 테스트 포함 (SC-C6) | ✅ 완료 |
| UNKNOWN_TAXONOMY fallback 테스트 포함 (SC-E11) | ✅ 완료 |
| jobGroup map의 UNKNOWN_TAXONOMY_ID를 임의 사용하지 않음 | ✅ STUB__ 접두사 구분. 전체 UNKNOWN 0개 (Phase 2.5 완료) |
| STUB ID를 사용하는 smoke case에 note 명시 | ✅ SC-D7, SC-D10 CONFIRMED. SC-E12 Phase 2.6 CONFIRMED |
| 서비스기획 vs 서비스디자인 교차 fallback 금지 조건 포함 | ✅ SC-E12, Nonfire Rule |
| CS vs 고객성공 교차 금지 조건 포함 | ✅ SC-B4, SC-C6, Nonfire Rule |

**현재 상태: Phase 2.6 완료. 전체 12개 smoke case CONFIRMED. Phase 3 진입 가능.**

CONFIRMED smoke case: **12개** (SC-A1, SC-A2, SC-B3, SC-B4, SC-C5, SC-C6, SC-D7, SC-D8, SC-D9, SC-D10, SC-E11, SC-E12)
STUB 잔존: **0개**

Phase 3 코드 구현 조건:
1. ✅ JOB_GROUP_TAXONOMY_MAP.md UNKNOWN 10개 → CONFIRMED 6개 + PARTIAL 4개 (Phase 2.5 완료)
2. ✅ SC-D7, SC-D10 CONFIRMED 승격 완료 (Phase 2.5)
3. ✅ SC-E12 CONFIRMED — JOB_DESIGN_UX_DESIGN 임시 사용, 교차 fallback 금지 테스트 확정 (Phase 2.6)
   - service_design taxonomy는 추후 별도 정교화 가능
   - Phase 3 최소 구현에서 SC-E12는 fallback/block 테스트로만 사용
   - CX_TO_SERVICE_DESIGN archetype 자동 발화는 Phase 3에서도 제한
4. ✅ §7 Implementation Readiness Gate 전체 조건 충족

---

## 8. STUB Smoke Case 목록

모든 STUB smoke case Phase 2.5~2.6에서 CONFIRMED 승격 완료.

| smoke case | STUB jobGroup | 확정 후 교체 위치 | 상태 |
|---|---|---|---|
| ~~SC-D7~~ | ~~sales_admin~~ | ~~sourceJobId 교체~~ | ✅ Phase 2.5 CONFIRMED |
| ~~SC-D10~~ | ~~hr_operations, hrbp~~ | ~~sourceJobId, targetJobId 교체~~ | ✅ Phase 2.5 CONFIRMED |
| ~~SC-E12~~ | ~~cx_design_research, service_planning/design 미분리~~ | ~~sourceJobId, targetJobId 교체~~ | ✅ Phase 2.6 CONFIRMED |

**STUB 잔존: 0개. 전체 12개 smoke case CONFIRMED.**

---

Version: 1.2.0
Updated: 2026-05-01
Phase: 2.6 완료 — SC-E12 CONFIRMED. 전체 12개 smoke case CONFIRMED. Phase 3 진입 가능.
