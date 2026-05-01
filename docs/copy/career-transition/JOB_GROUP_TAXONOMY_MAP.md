# Job Group → Taxonomy ID Map

## Purpose

Archetype Resolver가 sourceJobId / targetJobId를 jobGroup으로 변환할 때 사용하는 매핑 테이블.

이 파일의 taxonomyId는 `careerTransitionCaseProfiles.js`와 `jobExtensions/*.js`에서 실측 추출한 값만 CONFIRMED로 표기한다.
일부만 확인된 경우 PARTIAL로 표기한다. 코드에서 미확인 ID는 UNKNOWN으로 표기하며, 코드 적용 전 실제 값으로 교체해야 한다.

---

## 추출 원칙

- **CONFIRMED**: `careerTransitionCaseProfiles.js` 또는 `jobExtensions/*.js`에서 직접 확인된 값
- **PARTIAL**: 일부 ID만 확인됨. candidateJobIds에 후보를 기재하며, 코드 적용 전 전체 범위 검증 필요
- **UNKNOWN**: 코드에서 미확인. 실제 코드 적용 전 확인 필요
- **BLOCKED**: 동일 taxonomyId를 공유하는 역할이 있어 자동 발화 불가 (예: PM/PO)
- **PENDING**: taxonomyId가 코드에 존재하나 아직 별도 처리 로직 없음

---

## Job Group Map (26 groups)

| groupId | label | confirmedJobIds | status | notes |
|---|---|---|---|---|
| service_planning | 서비스기획 | `JOB_BUSINESS_SERVICE_PLANNING` | CONFIRMED | |
| operations_planning | 운영기획 | `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING`, `JOB_BUSINESS_OPERATIONS_MANAGEMENT` | CONFIRMED | 두 ID 모두 operations_planning으로 매핑 |
| data_analytics | 데이터분석 | `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS` | CONFIRMED | |
| performance_marketing | 퍼포먼스마케팅 | `JOB_MARKETING_PERFORMANCE_MARKETING` | CONFIRMED | |
| product_management | PM/Product Manager | `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT` | CONFIRMED / BLOCKED | PM과 PO가 동일 ID 공유. PO 전용 ID 분리 전까지 PO 자동 발화 불가 |
| accounting | 회계 | `JOB_FINANCE_ACCOUNTING_ACCOUNTING` | CONFIRMED | |
| finance_planning | FP&A | `JOB_FINANCE_ACCOUNTING_FP_AND_A` | CONFIRMED | 경영기획과 구분 필요 |
| sales_b2b | B2B영업 | `JOB_SALES_B2B_SALES`, `JOB_SALES_PROPOSAL_SALES` | CONFIRMED | |
| business_development | 사업개발/BD | `JOB_BUSINESS_BUSINESS_DEVELOPMENT` | CONFIRMED | |
| business_planning | 사업기획 | `JOB_BUSINESS_BUSINESS_PLANNING` | CONFIRMED | |
| procurement | 구매/조달 | `JOB_PROCUREMENT_SCM_PROCUREMENT`, `JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING`, `JOB_PROCUREMENT_SCM_PURCHASING` | CONFIRMED | 세 ID 모두 procurement로 매핑 |
| admin | 경영지원/총무 | `JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION` | CONFIRMED | |
| manufacturing_qa | 제조/품질 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA` | CONFIRMED | |
| tech_support | 기술지원 | `JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING` | CONFIRMED | |
| customer_support | CS/고객지원 | `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS` | CONFIRMED | |
| customer_success | CSM/고객성공 | `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS` | PENDING | 코드에 존재하나 별도 archetype 처리 로직 없음 |
| cx_design_research | CX디자이너/UX리서처 | — | PARTIAL | 전용 ID 없음. SC-E12에 `JOB_DESIGN_UX_DESIGN` 임시 사용 확정 (Phase 2.6). service_design taxonomy 정교화는 Phase 3 이후. |
| sales_admin | 영업관리/영업지원 | `JOB_SALES_SALES_OPERATIONS` | CONFIRMED | SALES_ADMIN_TO_BUSINESS_PLANNING archetype의 source group. SC-D7 STUB 제거. |
| hr_operations | 인사운영 | `JOB_HR_ORGANIZATION_HR_OPS` | CONFIRMED | HR_OPERATIONS_TO_HRBP archetype의 source group. SC-D10 sourceJobId STUB 제거. |
| recruiting | 채용담당/TA | `JOB_HR_ORGANIZATION_RECRUITING` | CONFIRMED | RECRUITING_TO_HRBP archetype의 source group. |
| hrbp | HRBP | `JOB_HR_ORGANIZATION_HRBP` | CONFIRMED | HR 계열 archetype의 target group. SC-D10 targetJobId STUB 제거. |
| scm | SCM | `JOB_PROCUREMENT_SCM_SCM` | CONFIRMED | PROCUREMENT_TO_SCM 전환의 target group. |
| engineering | 개발자 | `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`, `JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT`, `JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT` | PARTIAL | Dev 3종 확인. 전체 개발 직군 포함 여부 미확정. 상세 조사 결과 섹션 참조. |
| ux_design | UX/UI디자이너 | `JOB_DESIGN_UX_DESIGN` | PARTIAL | Primary 확인. candidateJobIds: `JOB_DESIGN_UI_DESIGN`, `JOB_DESIGN_PRODUCT_DESIGN`. 상세 조사 결과 섹션 참조. |
| research | UX리서처/마케팅리서처 | `JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH`, `JOB_MARKETING_MARKETING_RESEARCH` | PARTIAL | 2종 확인. UX리서처는 `JOB_DESIGN_UX_DESIGN`과 겹침. 상세 조사 결과 섹션 참조. |
| account_management | 키어카운트/AM | `JOB_SALES_KEY_ACCOUNT_MANAGEMENT` | CONFIRMED | SALES_TO_ACCOUNT_MANAGEMENT archetype의 target group. |

---

## BLOCKED 상세 — PM/PO 동일 ID 문제

```
taxonomyId: JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT
  → PM/Product Manager 역할 (CURATED 케이스 정상 발화 가능)
  → PO/Product Owner 역할 (BLOCKED — 동일 ID 공유로 자동 발화 불가)

해결 조건: PO 전용 taxonomyId 신설 또는 코드 레벨 role 구분자 추가 후 적용 가능
관련 case: EXPERIENCED_SERVICE_PLANNING_TO_PO_V1 (caseMode: BLOCKED_TAXONOMY)
```

---

## PENDING 상세 — customer_success 처리

```
taxonomyId: JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS
  → 코드에 ID가 존재하나 CUSTOMER_SUCCESS_TO_SERVICE_PLANNING archetype 로직 미구현
  → PENDING_TAXONOMY 상태로 처리, Generic Fallback으로 fallthrough

해결 조건: Archetype Resolver 코드 구현 시 이 ID를 customer_success jobGroup으로 매핑
관련 case: EXPERIENCED_CX_TO_SERVICE_PLANNING_V1 (caseMode: PENDING_TAXONOMY)
```

---

## Phase 2.5 조사 결과 — 신규 확인 항목

조사 출처: `src/data/workRecord/jobExtensionRegistry.js`, `src/data/workRecord/jobExtensions/*.js`

### CONFIRMED 그룹 (6개)

| groupId | confirmedJobIds | evidenceSource | resolverDecision |
|---|---|---|---|
| sales_admin | `JOB_SALES_SALES_OPERATIONS` | jobExtensions/sales_operations.js | 즉시 사용 가능. SC-D7 STUB 제거 완료. |
| hr_operations | `JOB_HR_ORGANIZATION_HR_OPS` | jobExtensions/hr_ops.js | 즉시 사용 가능. SC-D10 sourceJobId STUB 제거 완료. |
| recruiting | `JOB_HR_ORGANIZATION_RECRUITING` | jobExtensions/hr_recruiting.js | 즉시 사용 가능. |
| hrbp | `JOB_HR_ORGANIZATION_HRBP` | jobExtensions/hrbp.js | 즉시 사용 가능. SC-D10 targetJobId STUB 제거 완료. |
| scm | `JOB_PROCUREMENT_SCM_SCM` | jobExtensions/scm.js | 즉시 사용 가능. |
| account_management | `JOB_SALES_KEY_ACCOUNT_MANAGEMENT` | jobExtensions/key_account_management.js | 즉시 사용 가능. |

### PARTIAL 그룹 (4개) — 코드 적용 전 범위 확정 필요

#### engineering — 개발자

| 필드 | 값 |
|---|---|
| taxonomyStatus | PARTIAL |
| confirmedJobIds | `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`, `JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT`, `JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT` |
| candidateJobIds | `JOB_IT_DATA_DIGITAL_MOBILE_DEVELOPMENT`, `JOB_IT_DATA_DIGITAL_DEVOPS` 등 추가 개발 직군 존재 가능 |
| confidence | medium |
| evidenceSource | jobExtensionRegistry.js (IT dev 계열 3종 확인) |
| resolverDecision | Dev 3종으로 제한 사용 가능. 전체 개발자 범위는 추가 확인 필요. |
| notes | ENGINEERING_TO_PRODUCT_PLANNING archetype source. 풀스택/백엔드/프론트엔드 중심. |

#### ux_design — UX/UI디자이너

| 필드 | 값 |
|---|---|
| taxonomyStatus | PARTIAL |
| confirmedJobIds | `JOB_DESIGN_UX_DESIGN` (primary) |
| candidateJobIds | `JOB_DESIGN_UI_DESIGN`, `JOB_DESIGN_PRODUCT_DESIGN` |
| confidence | medium |
| evidenceSource | jobExtensions/ux_design.js (UX_DESIGN 확인) |
| resolverDecision | `JOB_DESIGN_UX_DESIGN`로 우선 사용. UI/Product Design 포함 범위는 추가 확인 후. |
| notes | DESIGN_TO_PRODUCT_PLANNING archetype source. UX리서처(research group)와 겹침 주의. |

#### research — UX리서처/마케팅리서처

| 필드 | 값 |
|---|---|
| taxonomyStatus | PARTIAL |
| confirmedJobIds | `JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH`, `JOB_MARKETING_MARKETING_RESEARCH` |
| candidateJobIds | UX Research는 `JOB_DESIGN_UX_DESIGN` 하위에 포함될 가능성 있음 |
| confidence | low |
| evidenceSource | jobExtensionRegistry.js (Market Research, Marketing Research 확인) |
| resolverDecision | 시장/마케팅 리서처 2종 사용 가능. UX리서처는 `JOB_DESIGN_UX_DESIGN`와 겹쳐 추가 구분 필요. |
| notes | RESEARCH_TO_PRODUCT_OR_STRATEGY archetype source. UX리서처와 시장리서처 분리 기준 확인 필요. |

#### cx_design_research — CX디자이너/UX리서처

| 필드 | 값 |
|---|---|
| taxonomyStatus | PARTIAL |
| confirmedJobIds | — (전용 ID 없음) |
| candidateJobIds | `JOB_DESIGN_UX_DESIGN` (가장 근접한 후보) |
| confidence | low |
| evidenceSource | jobExtensionRegistry.js (CX 전용 ID 없음 확인) |
| resolverDecision | SC-E12 교차 fallback 금지 테스트에 `JOB_DESIGN_UX_DESIGN` 임시 사용 확정 (Phase 2.6). CX 전용 ID 신설은 Phase 3 이후 과제. `JOB_DESIGN_UX_DESIGN` is used as temporary ambiguity target for SC-E12 smoke only. It must not be treated as full CX/service design taxonomy coverage. |
| notes | CX_TO_SERVICE_DESIGN archetype source. SC-E12 CONFIRMED (Phase 2.6). service_design taxonomy 정교화 추후 별도 진행. |

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| ARCHETYPE_RESOLVER_DESIGN.md | Resolver 설계 명세 — jobGroup 매핑 규칙, archetype 선택 규칙 |
| ARCHETYPE_REGISTRY.md | 전환 유형 템플릿 등록 |
| src/lib/analysis/careerTransitionCaseProfiles.js | taxonomyId 실측 출처 (read-only) |

## 추출 출처

### Phase 1 (2026-05-01)
- 파일: `src/lib/analysis/careerTransitionCaseProfiles.js`
- 추출 방식: 각 프로파일의 `sourceId`, `targetId` 필드 직접 확인 (read-only)
- 결과: 16개 groupId CONFIRMED, 10개 UNKNOWN

### Phase 2.5 (2026-05-01)
- 파일: `src/data/workRecord/jobExtensionRegistry.js`, `src/data/workRecord/jobExtensions/*.js`
- 추출 방식: jobExtensionRegistry.js 전체 검색 + 각 jobExtension 파일 read-only 확인
- 결과: UNKNOWN 10개 → CONFIRMED 6개 + PARTIAL 4개

### 현재 상태 (Phase 2.5 완료)
- CONFIRMED: 22개 groupId
- PARTIAL: 4개 groupId (engineering, ux_design, research, cx_design_research)
- BLOCKED: 1개 (product_management/PO 공유 ID)
- PENDING: 1개 (customer_success)
- UNKNOWN: 0개

---

Version: 1.2.0
Updated: 2026-05-01
Changes: Phase 2.6 반영. cx_design_research SC-E12 임시 결정 확정. JOB_DESIGN_UX_DESIGN ambiguity target note 추가.
