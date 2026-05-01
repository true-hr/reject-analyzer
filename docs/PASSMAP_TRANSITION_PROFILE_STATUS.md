# PASSMAP Transition Profile Status

> career mode F-layer transition profile 구현 상태 트래킹
> 마지막 업데이트: 2026-05-01 (F-CLEANUP-1)

---

## Smoke Runner

```bash
# career F-layer smoke (F-INFRA-2A 이후)
node scripts/regression/run-career-transition-profile-smoke.mjs

# D/E 신입 smoke (baseline, 독립 유지)
"D:\잡다\node.exe" scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs
```

현재 smoke 기준선: D/E 12 PASS (마감), career auto 90케이스 PASS (registry 기반, F-CLEANUP-1)

### F-UI-2 overlay 문구 차별화 변경 내역 (2026-05-01)

비SERVICE_PLANNING target 4개 profile의 UI-visible overlay 문구를 source별로 차별화함.
GENERAL_ADMIN smoke shouldMention/nonfire 갱신. PROCUREMENT shouldNotMention 연동 갱신.

| Profile | lead 핵심 변경 | 차별화 포인트 |
|---------|---------------|--------------|
| FINANCE_ACCOUNTING | "숫자와 지표를 해석해 의사결정 자료로 정리" → "손익·비용·매출 구조, 정합성 검토, 데이터분석의 지표 해석·보고 구조 이해" / industryContext.lead "도움이 됩니다" → 정합성 감각·지표 기준 이해의 실질 강점 | 회계 고유: 손익·비용·매출 구조 판독 능력 명시 |
| GENERAL_ADMIN | "기획 실행의 운영 측면" → "부서 간 요청과 일정을 조율, 내부 실행 관리·운영 구조 이해" / scoreReason에 "시장·고객·비용 구조 분석" 갭 추가 | 행정 고유: 조직 전체 운영 흐름 지원·조율 관점 |
| SALES_TO_BD | "거래를 성사시킨 경험이" → "시장 반응을 읽으며 거래 조건을 협상해온 점에서" / scoreReason "판매 성사" → "개별 판매 성사나 매출 달성" / responsibilityScope "영업 경험을" → "개인 매출 달성을 넘어 채널·제휴 가능성 제안" | 영업→BD: 단순 판매 실적 vs 파트너십·시장 확장 구조화 |
| PROCUREMENT | "구조 분석과 실행 계획 수립" → "외부 공급망, 비용 구조 분석·리스크 기반 의사결정" / scoreReason "의사결정을 구조화" → "시장·경쟁 분석 포함·전략적 의사결정" | 조달 고유: 외부 공급망 비용·리스크 구조화 관점 (GENERAL_ADMIN 내부 운영과 차별화) |

### F-UI-1 overlay 문구 차별화 변경 내역 (2026-05-01)

SERVICE_PLANNING target 5개 profile의 UI-visible overlay 문구를 source별로 차별화함.
smoke shouldMention/nonfire.shouldNotMention도 새 핵심 구문에 맞게 업데이트.

| Profile | lead 핵심 변경 | responsibilityScope 핵심 변경 |
|---------|---------------|-------------------------------|
| CUSTOMER_SUPPORT | "고객 응대 경험은 서비스기획과 연결될 수 있습니다" → "CS·고객 응대 경험은…바로 같은 일은 아니지만, 문제의 빈도와 패턴" | "VOC 분석이나 개선안으로 정리" → "반복 문의와 고객 불편을 문제 패턴 정리 산출물로 전환" |
| PERFORMANCE_MARKETING | "마케팅 경험은" → "퍼포먼스마케팅 경험은…퍼널과 전환율 데이터, A/B 테스트로 개선 가설 검증" | "성과 지표를 제품 개선 가설이나 기능 제안으로" → "전환율·클릭률 지표에서 사용자 행동 가설 도출" |
| OPERATIONS | "서비스기획의 문제 발견과 운영 개선 단계" → "운영관리 경험은…운영 정책 개선과 내부 프로세스 설계" | "프로세스 병목이나 서비스 이슈를 발견" → "반복되는 프로세스 병목이나 내부 협업 이슈, 정책·절차 개선 방향" |
| MANUFACTURING_QUALITY | "제품 결함과 고객 클레임을 구조적으로 분석" → "불량 원인과 결함 패턴을 품질 기준에 따라, 공정·현장 수준의" | "품질 이슈를 발견하는 것에서 한 발 나아가 고객 요구와 연결" → "결함 패턴이나 품질 기준 갭을 사양 개선안으로 연결" |
| TECHNICAL_SUPPORT | "기획의 문제 발견과 개선 방향 도출" → "실제 사용 환경에서 겪는 기술 이슈와 기능 제약…요구사항 발굴과 사용자 시나리오 구체화" | "반복 이슈의 원인을 구조화" → "기술 이슈의 원인과 사용 환경 갭을 구조화하고 기능 개선 요구사항으로 정리" |

F-SCALE-1 이후 구조:
- profile data: `src/lib/analysis/careerTransitionCaseProfiles.js`
- engine: `src/lib/analysis/careerTransitionCaseOverlays.js`
- auto smoke: registry에서 activation/boundary/cross-nonfire 자동 생성
- supplemental: `career-transition-case-matrix.js` (SUPPLEMENTAL_LOCKED, 모두 auto-covered)

---

## 구현된 Profiles

### CUSTOMER_SUPPORT_TO_SERVICE_PLANNING

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | 0049e89 (F-2A) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseOverlays.js` |
| 연결 파일 | `src/lib/transitionLite/buildTransitionLiteResult.js` |
| 적용 axis | `jobStructure`, `responsibilityScope` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / responsibilityScope: lead, liftOrLimit |
| trigger | `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS` → `JOB_BUSINESS_SERVICE_PLANNING` |
| trigger 방식 | currentJobId + targetJobId 직접 매칭 (classifyTransition 미사용) |
| smoke status | LOCKED (4케이스: ACTIVATION + BOUNDARY_COPY + NONFIRE×2) |

**D/E 패턴과의 관계**:
- D/E `CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT`는 신입 모드 전용 (currentJobId 없음)
- F profile은 career 모드 전용 (currentJobId 필수)
- 모드 분리로 구조적 충돌 없음 확인됨

---

### FINANCE_ACCOUNTING_TO_DATA_ANALYSIS

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | (F-2B) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseOverlays.js` |
| 연결 파일 | `src/lib/transitionLite/buildTransitionLiteResult.js` |
| 적용 axis | `jobStructure`, `industryContext` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / industryContext: lead, liftOrLimit |
| trigger | `JOB_FINANCE_ACCOUNTING_ACCOUNTING` 또는 `JOB_FINANCE_ACCOUNTING_FP_AND_A` → `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS` |
| trigger 방식 | currentJobId + targetJobId 직접 매칭 (classifyTransition 미사용) |
| smoke status | LOCKED (8케이스: ACTIVATION + BOUNDARY_COPY + NONFIRE×2 포함)

**D/E 패턴과의 관계**:
- D/E 데이터분석 케이스는 신입 모드 (currentJobId 없음)
- F profile은 career 모드 (currentJobId 필수)
- responsibilityScope/roleCharacter는 이미 high(100) — F-2B에서 건드리지 않음 (과잉 설명 위험)

---

### PERFORMANCE_MARKETING_TO_SERVICE_PLANNING

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | (F-2C) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseOverlays.js` |
| 연결 파일 | `src/lib/transitionLite/buildTransitionLiteResult.js` |
| 적용 axis | `jobStructure`, `responsibilityScope` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / responsibilityScope: lead, liftOrLimit |
| trigger | `JOB_MARKETING_PERFORMANCE_MARKETING` → `JOB_BUSINESS_SERVICE_PLANNING` |
| trigger 방식 | currentJobId + targetJobId 직접 매칭 (classifyTransition 미사용) |
| smoke status | LOCKED (4케이스: ACTIVATION + BOUNDARY_COPY + NONFIRE×2) |

**CS profile과의 관계**:
- 같은 targetJobId (`JOB_BUSINESS_SERVICE_PLANNING`) → conflict guard MEDIUM 상태
- source set 분리로 co-fire 불가 (MEDIUM = 설계 시점 경고, HIGH 아님)
- bridge 완전 분리: CS(VOC/반복문의/고객불편) vs Marketing(퍼널/전환율/캠페인/A/B테스트)

---

### GENERAL_ADMIN_TO_BUSINESS_PLANNING

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | (F-3A) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseOverlays.js` |
| 연결 파일 | `src/lib/transitionLite/buildTransitionLiteResult.js` |
| 적용 axis | `jobStructure`, `responsibilityScope` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / responsibilityScope: lead, liftOrLimit |
| trigger | `JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION` → `JOB_BUSINESS_BUSINESS_PLANNING` |
| trigger 방식 | currentJobId + targetJobId 직접 매칭 (classifyTransition 미사용) |
| smoke status | LOCKED (6케이스: auto ACTIVATION + BOUNDARY + 4×NONFIRE) |

**axis 선택 근거**:
- `industryContext`, `customerType`, `roleCharacter`는 band 높음 — 과잉 설명 방지를 위해 미적용
- `jobStructure`(very_low/low)와 `responsibilityScope`(low)만 overlay 대상

---

### SALES_TO_BUSINESS_DEVELOPMENT

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | (F-3A) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseOverlays.js` |
| 연결 파일 | `src/lib/transitionLite/buildTransitionLiteResult.js` |
| 적용 axis | `jobStructure`, `responsibilityScope` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / responsibilityScope: lead, liftOrLimit |
| trigger | `JOB_SALES_B2B_SALES` 또는 `JOB_SALES_PROPOSAL_SALES` → `JOB_BUSINESS_BUSINESS_DEVELOPMENT` |
| trigger 방식 | currentJobId + targetJobId 직접 매칭 (classifyTransition 미사용) |
| smoke status | LOCKED (6케이스: auto ACTIVATION + BOUNDARY + 4×NONFIRE) |

**axis 선택 근거**:
- `industryContext`, `customerType`, `roleCharacter`는 band 높음 — 과잉 설명 방지를 위해 미적용
- sourceJobIds에 `JOB_SALES_B2B_SALES`, `JOB_SALES_PROPOSAL_SALES` 2개 포함

---

### OPERATIONS_TO_SERVICE_PLANNING

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | (F-3B) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseProfiles.js` |
| 연결 파일 | `src/lib/transitionLite/buildTransitionLiteResult.js` |
| 적용 axis | `jobStructure`, `responsibilityScope` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / responsibilityScope: lead, liftOrLimit |
| trigger | `JOB_BUSINESS_OPERATIONS_MANAGEMENT` → `JOB_BUSINESS_SERVICE_PLANNING` |
| trigger 방식 | currentJobId + targetJobId 직접 매칭 (classifyTransition 미사용) |
| smoke status | LOCKED (14케이스: auto ACTIVATION + BOUNDARY + 12×NONFIRE) |

**bridge 분리 근거**:
- bridge: 운영 흐름, 프로세스 병목, 이슈 처리, 내부 협업, 서비스 안정화
- CS profile(VOC/반복문의/고객불편), Marketing profile(퍼널/전환율/캠페인) 문구 완전 분리

---

### MANUFACTURING_QUALITY_TO_PRODUCT_PLANNING

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | (F-3B) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseProfiles.js` |
| 연결 파일 | `src/lib/transitionLite/buildTransitionLiteResult.js` |
| 적용 axis | `jobStructure`, `responsibilityScope` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / responsibilityScope: lead, liftOrLimit |
| trigger | `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA` 또는 `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL` → `JOB_BUSINESS_SERVICE_PLANNING` |
| trigger 방식 | currentJobId + targetJobId 직접 매칭 (classifyTransition 미사용) |
| smoke status | LOCKED (14케이스: auto ACTIVATION + BOUNDARY + 12×NONFIRE) |

**bridge 분리 근거**:
- bridge: 품질 이슈 → 고객 불편/요구 → 제품 개선 요구사항 흐름
- sourceJobIds에 QA/QC 2개 포함. 'QA하면 기획 가능' 과대해석 금지
- smokeInput: `IND_MANUFACTURING_ELECTRONICS_APPLIANCES` → `IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM`

---

### TECHNICAL_SUPPORT_TO_SERVICE_PLANNING

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | (F-3C) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseProfiles.js` |
| 적용 axis | `jobStructure`, `responsibilityScope` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / responsibilityScope: lead, liftOrLimit |
| trigger | `JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING` → `JOB_BUSINESS_SERVICE_PLANNING` |
| smoke status | LOCKED (18케이스: auto ACTIVATION + BOUNDARY + 16×NONFIRE) |

**bridge**: 고객 기술 이슈 분석, 장애 원인 구조화, 제품 개선 요청 파악, 사용 환경 갭 발견  
단순 장애 처리만으로는 기획 근거 약함을 명시. CS/Operations/MFG 문구와 분리.

---

### PROCUREMENT_TO_BUSINESS_PLANNING

| 항목 | 내용 |
|---|---|
| 구현 상태 | `IMPLEMENTED` |
| 구현 커밋 | (F-3C) |
| 구현 파일 | `src/lib/analysis/careerTransitionCaseProfiles.js` |
| 적용 axis | `jobStructure`, `responsibilityScope` |
| 적용 slot | jobStructure: lead, scoreReason, criteria / responsibilityScope: lead, liftOrLimit |
| trigger | `JOB_PROCUREMENT_SCM_PROCUREMENT` 또는 `JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING` 또는 `JOB_PROCUREMENT_SCM_PURCHASING` → `JOB_BUSINESS_BUSINESS_PLANNING` |
| smoke status | LOCKED (18케이스: auto ACTIVATION + BOUNDARY + 16×NONFIRE) |

**bridge**: 비용 구조 분석, 공급사 조건 협상, 계약·납기·리스크 관리, 운영 효율화  
sourceJobIds 3개 포함. Admin bridge(운영 흐름/문서·일정) 문구와 분리.

---

## Pending Profiles

### RECRUITING_OR_HR_OPERATIONS_TO_BUSINESS_PLANNING (보류)

| 항목 | 내용 |
|---|---|
| 보류 이유 | F-3C 최대 2개 제한으로 구현 제외. 3순위 후보 |
| sourceJobId 확인 | `JOB_HR_ORGANIZATION_RECRUITING`, `JOB_HR_ORGANIZATION_HR_OPS` ✅ 존재 확인 |
| targetJobId 후보 | `JOB_BUSINESS_BUSINESS_PLANNING` 또는 `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING` |
| 다음 라운드 조건 | target 선택 확정 후 구현 가능 |

---

## Profile Conflict Guard (F-INFRA-2B)

`scripts/regression/run-career-transition-profile-smoke.mjs` 실행 시 smoke 결과 후 자동 출력.

### 현재 구현 profile 9개 conflict 상태 (F-CLEANUP-1 이후)

| 항목 | 내용 |
|---|---|
| overlappingTargetJobIds | `JOB_BUSINESS_SERVICE_PLANNING`: [CS, Marketing, Operations, MFG_QA, TechSupport] / `JOB_BUSINESS_BUSINESS_PLANNING`: [Admin, Procurement] |
| sharedAxisSlots | jobStructure.{lead,scoreReason,criteria}, responsibilityScope.{lead,liftOrLimit} (정보성 — source 분리로 co-fire 불가) |
| highRiskConflicts | none |
| mediumRiskConflicts | SERVICE_PLANNING group 10쌍, BUSINESS_PLANNING group 1쌍 — source set 분리로 실제 co-fire 불가 |
| overallRisk | **MEDIUM** (설계 시점 경고 수준, runtime 위험 없음) |

**MEDIUM 판정 근거**: 5개 SERVICE_PLANNING target profile 모두 source가 달라 동일 입력에서 동시 발화 불가 (+ BUSINESS_PLANNING 2개 분리). slot isolation 불필요.

**bridge 분리 확인 완료**:

| 항목 | CS profile | Marketing profile | Operations profile | MFG QA profile | TechSupport profile |
|---|---|---|---|---|---|
| bridge | VOC, 반복 문의, 고객 불편 | 퍼널, 전환율, A/B 테스트 | 운영 흐름, 프로세스 병목, 이슈 처리 | 불량 원인, 결함 패턴, 품질 기준 | 기술 이슈, 사용 환경 갭, 기능 제약 |
| evidence | VOC 분석표, 화면흐름도 | A/B 테스트 결과, 전환율 개선 산출물 | 요구사항 정의서, 기능 개선안, 프로세스 개선안 | 사양 개선안, 제품 요구사항 정의서 | 기능 요구사항 정의서, 사용자 시나리오 |

---

## Smoke Case 목록 (F-SCALE-1 이후 — auto-generated)

F-SCALE-1부터 smoke case는 registry에서 자동 생성됨.
각 IMPLEMENTED profile에 대해 자동 생성되는 case (profile 1개당 2 + (N-1) cross-nonfire):
- `AUTO-ACTIVATION-{PROFILE_ID}` (activation)
- `AUTO-BOUNDARY-{PROFILE_ID}` (boundary copy)
- `AUTO-NONFIRE-FROM-{PROFILE_A_ID}-BLOCKS-{PROFILE_B_ID}` (cross-nonfire, 모든 pair)

현재 auto case 90개 (9 profiles × (2 + 8)):
| caseId | caseType |
|---|---|
| AUTO-ACTIVATION-CUSTOMER_SUPPORT_TO_SERVICE_PLANNING | ACTIVATION |
| AUTO-BOUNDARY-CUSTOMER_SUPPORT_TO_SERVICE_PLANNING | BOUNDARY_COPY |
| AUTO-ACTIVATION-FINANCE_ACCOUNTING_TO_DATA_ANALYSIS | ACTIVATION |
| AUTO-BOUNDARY-FINANCE_ACCOUNTING_TO_DATA_ANALYSIS | BOUNDARY_COPY |
| AUTO-ACTIVATION-PERFORMANCE_MARKETING_TO_SERVICE_PLANNING | ACTIVATION |
| AUTO-BOUNDARY-PERFORMANCE_MARKETING_TO_SERVICE_PLANNING | BOUNDARY_COPY |
| AUTO-ACTIVATION-GENERAL_ADMIN_TO_BUSINESS_PLANNING | ACTIVATION |
| AUTO-BOUNDARY-GENERAL_ADMIN_TO_BUSINESS_PLANNING | BOUNDARY_COPY |
| AUTO-ACTIVATION-SALES_TO_BUSINESS_DEVELOPMENT | ACTIVATION |
| AUTO-BOUNDARY-SALES_TO_BUSINESS_DEVELOPMENT | BOUNDARY_COPY |
| AUTO-ACTIVATION-OPERATIONS_TO_SERVICE_PLANNING | ACTIVATION |
| AUTO-BOUNDARY-OPERATIONS_TO_SERVICE_PLANNING | BOUNDARY_COPY |
| AUTO-ACTIVATION-MANUFACTURING_QUALITY_TO_PRODUCT_PLANNING | ACTIVATION |
| AUTO-BOUNDARY-MANUFACTURING_QUALITY_TO_PRODUCT_PLANNING | BOUNDARY_COPY |
| AUTO-ACTIVATION-TECHNICAL_SUPPORT_TO_SERVICE_PLANNING | ACTIVATION |
| AUTO-BOUNDARY-TECHNICAL_SUPPORT_TO_SERVICE_PLANNING | BOUNDARY_COPY |
| AUTO-ACTIVATION-PROCUREMENT_TO_BUSINESS_PLANNING | ACTIVATION |
| AUTO-BOUNDARY-PROCUREMENT_TO_BUSINESS_PLANNING | BOUNDARY_COPY |
| AUTO-NONFIRE-FROM-CS-BLOCKS-{others ×8} | NONFIRE ×8 |
| AUTO-NONFIRE-FROM-FINANCE-BLOCKS-{others ×8} | NONFIRE ×8 |
| AUTO-NONFIRE-FROM-MARKETING-BLOCKS-{others ×8} | NONFIRE ×8 |
| AUTO-NONFIRE-FROM-ADMIN-BLOCKS-{others ×8} | NONFIRE ×8 |
| AUTO-NONFIRE-FROM-SALES-BLOCKS-{others ×8} | NONFIRE ×8 |
| AUTO-NONFIRE-FROM-OPERATIONS-BLOCKS-{others ×8} | NONFIRE ×8 |
| AUTO-NONFIRE-FROM-MFG_QA-BLOCKS-{others ×8} | NONFIRE ×8 |
| AUTO-NONFIRE-FROM-TECH_SUPPORT-BLOCKS-{others ×8} | NONFIRE ×8 |
| AUTO-NONFIRE-FROM-PROCUREMENT-BLOCKS-{others ×8} | NONFIRE ×8 |

Supplemental manual cases (12개, 모두 SUPPLEMENTAL_LOCKED — auto-covered):
`career-transition-case-matrix.js` 참조. 이력 보존 및 edge case 확장용.

---

## 다음 profile 추가 절차 (F-SCALE-1 이후)

1. `src/lib/analysis/careerTransitionCaseProfiles.js`에 profile object 1개 추가
   - `status: "IMPLEMENTED"`, sourceJobIds, targetJobIds, overlays, smokeInput, smoke(activation/boundaryCopy/nonfire), conflict
2. `"D:\잡다\node.exe" scripts/regression/run-career-transition-profile-smoke.mjs` 실행
   - auto smoke가 새 profile을 자동 포함해서 검증
   - 기대: 새 PASS 케이스 추가됨, 0 FAIL
3. `"D:\잡다\node.exe" scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs` 실행
   - 기대: 12 PASS 유지
4. conflict summary 확인 (overallRisk MEDIUM 이하 유지)
5. status 문서 갱신

## 다음 구현 전 필수 조건

1. `run-career-transition-profile-smoke.mjs` auto 12케이스 PASS 유지
2. conflict guard: overallRisk MEDIUM 이하 유지 (HIGH 전환 시 slot isolation 필수)
3. `run-newgrad-ui-insight-surface-smoke.mjs` 12 PASS 유지
4. 신규 profile bridge 분리 확인 완료 (Profile Conflict Guard 섹션 참조)
5. copy backlog 승인 완료

---

## 참조 문서

| 문서 | 역할 |
|---|---|
| `docs/PASSMAP_TRANSITION_CASE_TEST_STRATEGY.md` | F-0A 전략 |
| `docs/PASSMAP_TRANSITION_CASE_MATRIX_P0.md` | F-0B P0 케이스 matrix |
| `docs/PASSMAP_TRANSITION_CASE_PROBE_F1.md` | F-1 probe 결과 |
| `docs/PASSMAP_TRANSITION_CASE_INFRA_PLAN.md` | F-INFRA-1 설계 |
| `src/lib/analysis/careerTransitionCaseProfiles.js` | profile data registry (F-SCALE-1) |
| `src/lib/analysis/careerTransitionCaseOverlays.js` | profile engine (F-SCALE-1) |
| `scripts/regression/career-transition-case-matrix.js` | supplemental manual fixture |
