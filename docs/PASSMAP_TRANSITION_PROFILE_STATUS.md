# PASSMAP Transition Profile Status

> career mode F-layer transition profile 구현 상태 트래킹
> 마지막 업데이트: 2026-05-01 (F-INFRA-2B)

---

## Smoke Runner

```bash
# career F-layer smoke (F-INFRA-2A 이후)
node scripts/regression/run-career-transition-profile-smoke.mjs

# D/E 신입 smoke (baseline, 독립 유지)
"D:\잡다\node.exe" scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs
```

현재 smoke 기준선: D/E 12 PASS (마감), career LOCKED 8케이스 PASS

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

## Pending Profiles

### PERFORMANCE_MARKETING_TO_SERVICE_PLANNING

| 항목 | 내용 |
|---|---|
| 구현 상태 | `PENDING` |
| 대상 케이스 | `JOB_MARKETING_PERFORMANCE_MARKETING` → `JOB_BUSINESS_SERVICE_PLANNING` |
| 우선순위 | P1 |
| F-1 probe 결과 | jobStructure(very_low), roleCharacter(low) gap 확인 |
| 구현 전 확인 필요 | SPECIAL_PERFORMANCE_MARKETING_TO_PMM boundary 분리 확인 |
| 구현 가능 조건 | career smoke PASS + D/E smoke 12 PASS 유지 + nonfire case 통과 |
| fixture 파일 | `career-transition-case-matrix.js`에 PROPOSED 등록됨 |

---

## Profile Conflict Guard (F-INFRA-2B)

`scripts/regression/run-career-transition-profile-smoke.mjs` 실행 시 smoke 결과 후 자동 출력.

### 현재 구현 profile 2개 conflict 상태

| 항목 | 내용 |
|---|---|
| overlappingTargetJobIds | none |
| sharedAxisSlots | jobStructure.lead, jobStructure.scoreReason, jobStructure.criteria (정보성 — 다른 target, co-fire 불가) |
| highRiskConflicts | none |
| mediumRiskConflicts | none |
| overallRisk | **LOW** |

### F-2C 구현 전 주의 (Marketing profile)

- `PERFORMANCE_MARKETING_TO_SERVICE_PLANNING`의 targetJobId = `JOB_BUSINESS_SERVICE_PLANNING`
- `CUSTOMER_SUPPORT_TO_SERVICE_PLANNING`과 **같은 target** → 동일 입력에서 co-fire 가능
- 같은 axis/slot 사용 시 text overwrite → HIGH risk 도달 가능
- runner가 PENDING PRECHECK WARN으로 사전 경고 중

#### F-2C 구현 시 필수 분리 조건

| 항목 | CS profile | Marketing profile (예정) |
|---|---|---|
| bridge | VOC, 반복 문의, 고객 불편 | 퍼널, 전환율, 캠페인 성과, 고객 행동 데이터 |
| evidence | VOC 분석표, 화면흐름도 | A/B test 리포트, 전환율 개선 산출물 |
| 금지 | — | CS profile의 "고객 불편/VOC" 문구 재사용 금지 |

### F-2C 진행 조건

1. career smoke 8 PASS 유지
2. conflict summary overallRisk LOW 확인 (Marketing 추가 후 MEDIUM 전환 시 slot isolation 적용)
3. D/E newgrad smoke 12 PASS 유지
4. Marketing 구현 시 CS profile axis/slot 사용 현황 재확인 필수

---

## Smoke Case 목록

| caseId | caseType | profile | status |
|---|---|---|---|
| TR-PROFILE-CS-TO-SERVICE-001 | ACTIVATION | CUSTOMER_SUPPORT_TO_SERVICE_PLANNING | LOCKED |
| TR-BOUNDARY-CS-TO-SERVICE-001 | BOUNDARY_COPY | CUSTOMER_SUPPORT_TO_SERVICE_PLANNING | LOCKED |
| TR-NONFIRE-FINANCE-TO-DATA-001 | NONFIRE | (CS profile 미발화) | LOCKED |
| TR-NONFIRE-MARKETING-TO-PRODUCT-001 | NONFIRE | (CS profile 미발화) | LOCKED |
| TR-PROFILE-FINANCE-TO-DATA-001 | ACTIVATION | FINANCE_ACCOUNTING_TO_DATA_ANALYSIS | LOCKED |
| TR-BOUNDARY-FINANCE-TO-DATA-001 | BOUNDARY_COPY | FINANCE_ACCOUNTING_TO_DATA_ANALYSIS | LOCKED |
| TR-NONFIRE-CS-TO-SERVICE-FINANCE-PROFILE-001 | NONFIRE | (Finance profile 미발화) | LOCKED |
| TR-NONFIRE-MARKETING-TO-PRODUCT-FINANCE-PROFILE-001 | NONFIRE | (Finance profile 미발화) | LOCKED |
| TR-PROFILE-MARKETING-TO-PRODUCT-001 | ACTIVATION | PERFORMANCE_MARKETING_TO_SERVICE_PLANNING | PROPOSED |

---

## 다음 구현 전 필수 조건

1. `run-career-transition-profile-smoke.mjs` LOCKED 8케이스 PASS
2. conflict guard: overallRisk LOW 유지 (또는 MEDIUM 전환 시 slot isolation 적용 완료)
3. `run-newgrad-ui-insight-surface-smoke.mjs` 12 PASS 유지
4. pending profile의 bridge 분리 확인 완료 (Profile Conflict Guard 섹션 참조)
5. copy backlog 승인 완료

---

## 참조 문서

| 문서 | 역할 |
|---|---|
| `docs/PASSMAP_TRANSITION_CASE_TEST_STRATEGY.md` | F-0A 전략 |
| `docs/PASSMAP_TRANSITION_CASE_MATRIX_P0.md` | F-0B P0 케이스 matrix |
| `docs/PASSMAP_TRANSITION_CASE_PROBE_F1.md` | F-1 probe 결과 |
| `docs/PASSMAP_TRANSITION_CASE_INFRA_PLAN.md` | F-INFRA-1 설계 |
| `scripts/regression/career-transition-case-matrix.js` | smoke fixture |
| `src/lib/analysis/careerTransitionCaseOverlays.js` | profile engine + data |
