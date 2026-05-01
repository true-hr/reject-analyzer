# PASSMAP Accuracy QA Log

## TSQ-RND-20260419-AXIS1-OPERATION-PRINCIPLE-LOCK

- date: 2026-04-19
- round_type: SAFE INVESTIGATION — 조사/정리/문서화 (코드 패치 없음)
- scope: 축1 운영 원칙 잠금, 직무 A/B/C 분류표 완성, 복수전공 상태 확인

### 이번 라운드 검증 사항

**1. 코드 owner 확인**
실제 코드 기준으로 확인된 live anchor:
- scoreJobFit(): buildNewgradAxisPack.js L892 — LIVE
- _applyJobMajorDependencyToJobFit(): buildNewgradAxisPack.js L485 — LIVE
- resolveNewgradAxis1MajorPrior(): newgradAxis1MajorPriorRegistry.js — LIVE
- getJobMajorDependencyProfile(): jobMajorDependencyRegistry.js — LIVE
- buildNewgradJobFitExplanation(): axisExplanationRegistry.js L972 — LIVE
- resolveNewgradAxis1MajorPriorBest(): newgradAxis1MajorPriorRegistry.js L396 — **DEAD CODE** (callsite 없음)

**2. explanation signal 경로 확인**
- resolutionMode="unknown_major_fallback" → axisExplanationRegistry.js L1020 소비 — LIVE
- matchedBy="override" → axisExplanationRegistry.js L1027 소비 — LIVE
- resolutionMode="double_major" → axisExplanationRegistry.js L1014 소비 경로 존재하나 dead code 경로에서만 생성 → **현재 도달 불가**

**3. 복수전공 상태**
- UI 입력: 없음
- payload: secondMajor 키 없음
- resolver: dead code (resolveNewgradAxis1MajorPriorBest L396)
- scorer: DOUBLE_MAJOR key → ALL_WEAK_PRIOR_MAP → weak(1) fallback
- explanation: double_major branch 도달 불가
- **최종: 미완성/비지원 상태. "부분 지원" 표현 금지.**

**4. A/B/C 분류 결과**
- A 완료: 8개 (모두 HIGH 패치 완료)
- B 구조 문제: 5개 (TECHNICAL_RESEARCH, LEGAL, REGULATORY_AFFAIRS, PATENT_IP, EHS)
- C 경험 중심: 6개 (QC, QA, 설비보전, MARKET_INDUSTRY_RESEARCH, EXPERT_REVIEW, CONSULTING)
- 추가 조사 필요: 3개 (PRODUCTION_MANAGEMENT, MANUFACTURING_INNOVATION, MEDIA override 대상)

### 다음 라운드 우선 선택지
- A유형 라운드: PRODUCTION_MANAGEMENT, MANUFACTURING_INNOVATION A/B/C 재분류 확정
- 구조 라운드: 이공계 세분류 category 설계 (높음), LAW/PHARMACY category (중)

---

## TSQ-RND-20260419-DEPENDENCY-TIER-FINANCE-ACCOUNTING

- date: 2026-04-19
- round_type: SAFE PATCH — dependencyTier high 승격
- patched_ids:
  - JOB_FINANCE_ACCOUNTING_ACCOUNTING: medium(DEFAULT) → high
  - JOB_FINANCE_ACCOUNTING_TAX: medium(DEFAULT) → high

### 대표 케이스 표

| # | canonical job id | 전공 | 패치 전 tier | 패치 후 tier | 기대 score 변화 | 이유 | regression risk |
|---|---|---|---|---|---|---|---|
| 1 | JOB_FINANCE_ACCOUNTING_ACCOUNTING | 회계학 (direct) | medium | high | +1 보너스 (4→5) | 전공 직결 직무, 회계 전공 direct 매칭 | 없음 |
| 2 | JOB_FINANCE_ACCOUNTING_TAX | 세무회계 (direct) | medium | high | +1 보너스 (4→5) | 세무 전공과 직무 연결 선명 | 없음 |
| 3 | JOB_FINANCE_ACCOUNTING_ACCOUNTING | 경제/금융 (adjacent) | medium | high | 점수 변화 없음 (light_bonus only) | high tier에서 adjacent는 score 무변화 | 없음 |
| 4 | JOB_FINANCE_ACCOUNTING_ACCOUNTING | 경영학 (weak) | medium | high | role evidence 없으면 -1 | weak+no role → strong_penalty | 경영학→회계 지원자 패널티 납득성 확인 필요 |
| 5 | JOB_FINANCE_ACCOUNTING_ACCOUNTING | 비관련 전공 (mismatch) | medium | high | role evidence 없으면 -1 | mismatch 엄격 반영 의도적 | 없음 |
| 6 | JOB_FINANCE_ACCOUNTING_FINANCE | 경제/금융 (direct) | medium | medium(유지) | 변화 없음 | 기획성 재무 medium 유지 | 없음 |
| 7 | JOB_FINANCE_ACCOUNTING_TAX | 비관련 전공 (mismatch) | medium | high | role evidence 없으면 -1 | 세무 직무 엄격 반영 | 없음 |

### before/after 기대값
- before: 회계 전공 → 회계 직무: majorWeightApplied=light_bonus (medium direct)
- after: 회계 전공 → 회계 직무: majorWeightApplied=strong_bonus (high direct, +1)

## TSQ-RND-20260419-POLICY-RESEARCH-DEPENDENCY-TIER

- date: 2026-04-19
- round_type: SAFE INVESTIGATION → SAFE PATCH
- patched_ids:
  - JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH: medium(DEFAULT) → high

### POLICY_RESEARCH QA 샘플

| 전공 | base | prior label | 패치 전 score | 패치 후 score | 납득 | 회귀 위험 |
|---|---|---|---|---|---|---|
| PUBLIC_POLICY(공공정책) | 3 | direct | 4 | **5** (+1) | ✅ | 없음 |
| SOCIOLOGY(사회학) | 2 | adjacent | 3 | 3 (no change) | ✅ | 없음 |
| ECONOMICS(경제학) | 2 | adjacent | 3 | 3 (no change) | ✅ | 없음 |
| BUSINESS_ADMIN(경영) | 2 | adjacent | 3 | 3 (no change) | ✅ | 없음 |
| CS(컴공) | 2 | adjacent | 3 | 3 (no change) | ✅ | 없음 |
| INDUSTRIAL_ENGINEERING | 2 | adjacent | 3 | 3 (no change) | ✅ | 없음 |
| ACCOUNTING_TAX(회계세무) | 1 | weak | 2 | **1** (-1, no role evidence) | ✅ | 없음 |
| OTHER_HUMANITIES(기타인문) | 1 | weak | 2 | **1** (-1) | ✅ | 없음 |
| VISUAL_DESIGN / 디자인 | 1 | weak | 2 | **1** (-1) | ✅ | 없음 |
| 미등록전공 (fallback) | 1 | weak | 2 | **1** (-1) | ✅ | 없음 |

### RESEARCH_PROFESSIONAL 구조 분류 (QA 참고)

| 직무 | 분류 | 해결 방법 |
|---|---|---|
| POLICY_RESEARCH | **A** (tier 누락) | ✅ 이번 라운드 패치 |
| TECHNICAL_RESEARCH | **B** (이공계 major base=2 구조 문제, PUBLIC_POLICY HIGH시 왜곡) | major category 확장 + base 보정 |
| LEGAL | **B** (LAW major 부재) | major category 확장 |
| REGULATORY_AFFAIRS | **B** (PHARMACY/MEDICINE major 부재) | major category 확장 |
| PATENT_INTELLECTUAL_PROPERTY | **B** (LAW 부재 주원인) | major category 확장 |
| MARKET_INDUSTRY_RESEARCH | **C** (경험 중심) | 수정 불필요 |
| EXPERT_REVIEW_EVALUATION | **C** (전공 풀 넓음) | 수정 불필요 |
| CONSULTING | **C** (경험/스킬 중심) | 수정 불필요 |

## TSQ-RND-20260419-MANUFACTURING-DEPENDENCY-TIER

- date: 2026-04-19
- round_type: SAFE INVESTIGATION → SAFE PATCH
- patched_ids:
  - JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING: medium(DEFAULT) → high
  - JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING: medium(DEFAULT) → high

### 조사 범위
- RESEARCH_PROFESSIONAL 8개 직무: 전체 HIGH 후보 없음 (base matrix 구조 제약)
- MANUFACTURING_QUALITY_PRODUCTION 8개 직무: 2개 HIGH 승격

### high 후보 QA 샘플

| # | 전공 | 대상 직무 | base | prior label | 패치 전 score | 패치 후 score | tier 효과 | 회귀 위험 |
|---|---|---|---|---|---|---|---|---|
| 1 | 산업공학 | PROCESS_ENGINEERING | 3 | direct | 4 (medium) | **5** (+1, high+direct) | strong_bonus | 없음 |
| 2 | 전기전자 | PROCESS_ENGINEERING | 2 | adjacent | 3 | 3 (no change) | light_bonus | 없음 |
| 3 | 경영학 | PROCESS_ENGINEERING | 1 | weak | 2 | **1** (-1, high+weak, no role evidence) | strong_penalty | 경영학 지원자 하락 — 납득 가능 |
| 4 | CS(컴공) | PROCESS_ENGINEERING | 0 | mismatch | 1 | **0** (-1) | strong_penalty | 없음 |
| 5 | 산업공학 | PRODUCTION_ENGINEERING | 3 | direct | 4 | **5** | strong_bonus | 없음 |
| 6 | 기타공학 | PRODUCTION_ENGINEERING | 2 | adjacent | 3 | 3 (no change) | light_bonus | 없음 |
| 7 | 경영학 | PRODUCTION_ENGINEERING | 1 | weak | 2 | **1** (-1) | strong_penalty | 납득 가능 |

### RESEARCH_PROFESSIONAL HIGH 후보 없는 이유 (QA 근거)

| 직무 | 이유 |
|---|---|
| TECHNICAL_RESEARCH | 이공계 전공 RESEARCH_PROFESSIONAL base=2(adjacent). HIGH 승격 시 이공계 보너스 없고, PUBLIC_POLICY(base=3)만 +1 — 의도치 않은 결과 |
| LEGAL | 법학 전공 MAJOR category 미존재. base matrix에 법학→RESEARCH_PROFESSIONAL direct 경로 없음 |
| REGULATORY_AFFAIRS | 약학/법학/RA 특화 전공 MAJOR 미존재 |
| 나머지 5개 | 전공 풀 넓음, 경험 중심, 또는 동일 구조적 제약 |

## TSQ-RND-20260419-AXIS1-QA-AND-EXCEPTION-AUDIT

- date: 2026-04-19
- round_type: QA validation + exception landscape documentation
- scope: axis1 전체 예외 보정 / 정책성 수정 / dependencyTier 변경 검증 및 기록

---

### 오류 수정 노트 (기존 표 row 4)

기존 TSQ-RND-20260419-DEPENDENCY-TIER-FINANCE-ACCOUNTING 표 row 4의 "경영학 (weak)" 분류는 오류다.
- 실제: BUSINESS_ADMIN→FINANCE_ACCOUNTING base=2 → prior label=**adjacent** (not weak)
- HIGH+adjacent = no score change (light_bonus only, 패널티 없음)
- 수정: 경영학→회계 지원자에게 -1 패널티는 부과되지 않는다. score=3 유지.

---

### A. 15-케이스 QA 표

| # | 전공 | 대상 직무 | prior base | exception/override | prior final | prior label | dependencyTier | score base | tier 효과 | score final | QA 판정 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | CS(컴공) | SW_DEVELOPMENT (일반) | 2 (ENG_DEV) | 없음 | 2 | adjacent | high | 3 | +0 (high+adjacent=light_bonus) | 3 | PASS |
| 2 | CS(컴공) | SERVICE_PLANNING | 1 (BUSINESS) | exception+1 | 2 | adjacent | medium | 3 | +0 | 3 | PASS |
| 3 | BUSINESS_ADMIN(경영) | MARKETING (일반) | 3 (MARKETING) | 없음 | 3 | direct | medium(DEFAULT) | 4 | +0 | 4 | PASS |
| 4 | BUSINESS_ADMIN(경영) | DATA_ANALYSIS | 1 (IT_DATA) | exception+1 | 2 | adjacent | medium | 3 | +0 | 3 | PASS |
| 5 | ECONOMICS/FINANCE(경제/금융) | B2B_SALES | 1 (SALES) | exception+1 | 2 | adjacent | low | 3 | +0 | 3 | PASS |
| 6 | PSYCHOLOGY_COUNSELING(심리) | HR_OPS | 3 (HR_ORG) | 없음 | 3 | direct | low | 4 | +0 (low+direct=light_bonus) | 4 | PASS |
| 7 | INDUSTRIAL_ENGINEERING(산업공학) | SCM | 3 (PROCUREMENT_SCM) | 없음 | 3 | direct | medium(DEFAULT) | 4 | +0 | 4 | PASS |
| 8 | ACCOUNTING_TAX(회계/세무) | ACCOUNTING | 3 (FIN_ACCT) | override+1 → capped 3 | 3 | direct | **high** | 4 | **+1** (high+direct=strong_bonus) | **5** | PASS ★ 핵심 패치 케이스 |
| 9 | ACCOUNTING_TAX(회계/세무) | TAX | 3 (FIN_ACCT) | override+1 → capped 3 | 3 | direct | **high** | 4 | **+1** | **5** | PASS ★ |
| 10 | BUSINESS_ADMIN(경영) | ACCOUNTING | 2 (FIN_ACCT) | 없음 | 2 | **adjacent** | high | 3 | +0 (high+adjacent=light_bonus) | 3 | PASS (패널티 없음) |
| 11 | ECONOMICS/FINANCE(경제/금융) | FINANCE (재무) | 3 (FIN_ACCT) | 없음 | 3 | direct | medium(DEFAULT) | 4 | +0 | 4 | PASS |
| 12 | ECONOMICS/FINANCE(경제/금융) | ACCOUNTING | 3 (FIN_ACCT) | 없음 | 3 | direct | **high** | 4 | **+1** | **5** | PASS |
| 13 | 미등록전공(unknown) | 임의직무 | fallback=1 | 없음 | 1 | weak | medium(DEFAULT) | 2 | +0 | 2 | PASS (unknown_major_fallback, 사용자 미노출) |
| 14 | 복수전공(DOUBLE_MAJOR) | 임의직무 | all_weak=1 | 없음 | 1 | weak | medium(DEFAULT) | 2 | +0 | 2 | PASS — 단 resolveNewgradAxis1MajorPriorBest() dead code 주의 |
| 15 | SOFTWARE(SW) | BUSINESS 일반 | 1 (BUSINESS) | exception+1 | 2 | adjacent | medium(DEFAULT) | 3 | +0 | 3 | PASS |

---

### B. QA 질문 답변

**B-1: 회계/세무 HIGH 승격 타당성**
타당하다. ACCOUNTING_TAX→FINANCE_ACCOUNTING base=3(direct)이므로 prior=direct는 패치 전후 동일하다. HIGH 승격은 prior=direct 케이스에 +1을 추가하는 것으로, 전공 직결도가 높은 회계/세무 직무에서 실무 적합성 강화를 정확히 반영한다. 다른 HIGH tier(개발, 기계설계, 회로설계)와 동일한 근거 구조다.

**B-2: 경영학→회계 weak 납득성 (오류 수정)**
"weak"가 아니다. BUSINESS_ADMIN→FINANCE_ACCOUNTING=2 → prior label=**adjacent**. HIGH+adjacent=no score change(light_bonus). 경영학→회계 지원자에게 패널티가 부과되지 않는다 — score=3 유지. 기존 QA 표 row 4의 "weak" 표기가 오류였다.

**B-3: 예외 보정 5종 타당성**
전체 5종(CS→BUSINESS, SW→BUSINESS, BUSINESS_ADMIN→IT_DATA, ECONOMICS→SALES, FINANCE→SALES) 모두 타당하다. 이유: 실제 지원 패턴에서 underscored되는 조합에 대한 최소 보정(+1), Math.max로 스태킹 차단, 최대치 capping으로 범위 통제. 삭제 시 해당 조합이 adjacent→weak로 하락하며 현실 분리를 유발한다.

**B-4: 축1/축3 분리 유지 여부**
분리 유지됨. 축1=전공 prior(resolveNewgradAxis1MajorPrior), 축3=경험 깊이(별도 경로). _applyJobMajorDependencyToJobFit의 hasDirectRoleEvidence/hasAdjacentRoleEvidence 파라미터는 HIGH 페널티 ceiling 완화용 보조 신호일 뿐, major prior score의 primary driver는 아니다. 역할 증거가 축1 score를 직접 올리는 경로는 없다.

**B-5: 복수전공 상태 확인**
resolveNewgradAxis1MajorPriorBest()는 dead code(active callsite 없음). 복수전공 선택 시 단일 major 경로(resolveNewgradAxis1MajorPrior)로 낙하한다. DOUBLE_MAJOR key가 AXIS1_MAJOR_PRIOR_BASE에 등록되어 있으면 all_weak(1)=weak, 미등록이면 unknown_major_fallback(1)=weak — 결과 동일. 현재 상태: 복수전공 지원 미완성. 사용자 UI에 복수전공 전용 입력 경로 없음. 추후 Best 함수 활성화 시 별도 패치 필요.

---

### C. Axis1 예외 보정 / 정책 수정 전체 목록 (15항목)

| # | 항목명 | 분류 | owner file | 현재 상태 | 왜 존재하는가 | 절대 건드리면 안 되는 포인트 | 다음 액션 필요 |
|---|---|---|---|---|---|---|---|
| 1 | CS→BUSINESS +1 | exceptionAdjustment | newgradAxis1MajorPriorRegistry.js | 활성 (base1→final2, adjacent) | CS 출신 기획/비즈니스 지원 현실 반영 | 삭제 시 CS→기획 weak 하락 | 불필요 |
| 2 | SW→BUSINESS +1 | exceptionAdjustment | newgradAxis1MajorPriorRegistry.js | 활성 | CS와 동일 근거 | 동상 | 불필요 |
| 3 | BUSINESS_ADMIN→IT_DATA_DIGITAL +1 | exceptionAdjustment | newgradAxis1MajorPriorRegistry.js | 활성 (base1→final2) | 경영학→데이터/IT 지원 현실 반영 | 삭제 시 경영학→데이터 weak 하락 | 불필요 |
| 4 | ECONOMICS→SALES +1 | exceptionAdjustment | newgradAxis1MajorPriorRegistry.js | 활성 (base1→final2) | 경제학→영업 맥락 자연스러움 | 삭제 시 경제→영업 weak 유지 | 불필요 |
| 5 | FINANCE→SALES +1 | exceptionAdjustment | newgradAxis1MajorPriorRegistry.js | 활성 (base1→final2) | 금융학→금융영업 맥락 | 동상 | 불필요 |
| 6 | CS/SW override: BACKEND/FRONTEND/FULLSTACK/MOBILE/DATA_ENG/DEVOPS/SECURITY +1 | override(subcategory) | newgradAxis1MajorPriorRegistry.js | 활성 (base2→final3, direct) | 세부 개발 직무 CS 직결성 강화 | 삭제 시 세부 개발 adjacent 하락 | 불필요 |
| 7 | ACCOUNTING_TAX override: ACCOUNTING +1 | override(subcategory) | newgradAxis1MajorPriorRegistry.js | 활성(no-op: base3+1→capped3) | 직결성 강조 마킹, 기능적 no-op | 기능 변화 없음, 의미 마킹 유지 | 불필요 |
| 8 | ACCOUNTING_TAX override: TAX +1 | override | newgradAxis1MajorPriorRegistry.js | 활성(no-op) | 동상 | 동상 | 불필요 |
| 9 | ACCOUNTING_TAX override: INTERNAL_CONTROL +1 | override | newgradAxis1MajorPriorRegistry.js | 활성(no-op) | 동상 | 동상 | 불필요 |
| 10 | INDUSTRIAL_ENGINEERING override: PROJECT_MANAGEMENT +1 | override | newgradAxis1MajorPriorRegistry.js | 활성(no-op: BUSINESS base=3 already) | 직결성 마킹 | 기능 변화 없음 | 불필요 |
| 11 | PSYCHOLOGY_COUNSELING override: RECRUITING +1 | override | newgradAxis1MajorPriorRegistry.js | 활성(no-op: HR_ORG base=3 already) | 동상 | 동상 | 불필요 |
| 12 | MEDIA override: CONTENT_MARKETING/PR_COMMUNICATIONS +1 | override | newgradAxis1MajorPriorRegistry.js | 활성(base 확인 필요) | 미디어 전공→마케팅 세부직무 연결 강화 | MARKETING base 확인 후 실효성 판단 | 향후 검토 가능 |
| 13 | BUSINESS_ADMIN override: CRM_MARKETING/PMM +1 | override | newgradAxis1MajorPriorRegistry.js | 활성(no-op: MARKETING base=3 already) | 마킹 목적 | 기능 변화 없음 | 불필요 |
| 14 | JOB_FINANCE_ACCOUNTING_ACCOUNTING: medium→high | dependencyTier | jobMajorDependencyRegistry.js | **활성(2026-04-19 패치)** | 회계 전공 직결 직무 고의존성 반영 | 삭제 시 high+direct +1 bonus 사라짐 | 불필요 |
| 15 | JOB_FINANCE_ACCOUNTING_TAX: medium→high | dependencyTier | jobMajorDependencyRegistry.js | **활성(2026-04-19 패치)** | 세무회계 전공 직결 | 동상 | 불필요 |

---

### D. 설명문 / Consumer QA

검증 대상: `_buildJobMajorImpactSummary()` (buildNewgradAxisPack.js:523)

| 조건 | 출력 텍스트 | 내부 용어 노출 | 판정 |
|---|---|---|---|
| high+direct | "전공 의존도가 높은 직무로, 전공 적합성이 강점으로 작동해 직무 연결성이 유리하게 반영되었습니다." | 없음 | PASS |
| high+present+weak/mismatch | "전공 의존도가 높은 직무에서 전공 연결성이 약하게 읽혀, 프로젝트나 인턴십 등 직무 연결 근거를 보완하는 것이 중요합니다." | 없음 | PASS |
| medium+direct | "전공 적합성이 비교적 잘 맞아, 직무 방향성에서 긍정적인 신호로 반영되었습니다." | 없음 | PASS |
| medium+present+weak/mismatch | "전공 연결성이 약하게 읽히지만, 실제 직무 경험 근거가 있다면 이를 중심으로 보완할 수 있습니다." | 없음 | PASS |
| low+non-light_bonus | "전공보다 실제 직무 수행 경험과 역할 맥락을 더 중요하게 보는 직무로, 전공 연결성은 이차적으로 판단합니다." | 없음 | PASS |
| low+direct | "전공보다 실제 직무 수행 경험이 더 중요하게 작동하지만, 전공 방향성이 참고 신호로 긍정적으로 반영되었습니다." | 없음 | PASS |

- `exceptionAdjustment`, `resolutionMode`, `unknown_major_fallback`, `override` 등 내부 용어 미노출 확인됨 ✓
- 복수전공/미등록전공 fallback 경로 사용자에게 미노출 ✓
- 모든 텍스트 컨설턴트 설명 가능 수준 ✓

---

## TSQ-RND-20260405-AXIS1-MAJOR-PRIOR-ACCEPT
- date: 2026-04-05
- round_type: documentation lock
- accepted_summary:
  - explicit mapping correctness: pass
  - weak/mismatch major corrected by direct role evidence: pass
  - explanation tone on task linkage: pass
  - no source tuning performed in QA round
- lock_result:
  - current baseline accepted
  - immediate source fix unnecessary
  - remaining issue class is later calibration review only

## TSQ-RND-20260405-AXIS1-MAJOR-PRIOR-QA
- date: 2026-04-05
- cases_run: 23
- scope:
  - direct prior + aligned role evidence
  - weak/mismatch prior
  - weak/mismatch prior corrected by role evidence
  - direct prior but weak role evidence
  - override checks
- explanation_consistency:
  - prior language stayed on starting direction / task linkage
  - no Axis 3 style outcome/duration/responsibility wording was observed
- major_findings:
  - base/override/final/label signals were populated as expected on explicit mapping cases
  - mismatch major did not hard-lock the final score when direct role evidence existed
  - direct major did not auto-promote to high without role evidence
- borderline_cases:
  - none marked as broken
  - direct prior + one aligned role clustering at `mid_high` is noted for later calibration review, not as an immediate bug
- false_high_count: 0
- false_low_count: 0
- major_fail_cases: none
- action:
  - no source tuning in this QA round
  - keep any next step limited to calibration review unless a concrete bug appears

## 목적
- 각 QA 라운드의 실행 결과를 append-only로 기록한다.
- 결과가 좋지 않은 라운드도 남겨서 historical comparison과 회귀 추적이 가능하게 한다.

## 언제 이 문서를 쓰는가
- scoring QA를 한 번 실행할 때마다 바로 기록한다.
- 라운드 간 hit rate와 false high / false low 추세를 비교할 때 본다.

## 다른 문서와의 관계
- 라운드 기준은 `02_Product/Accuracy_QA/Transition_Scoring_QA_Framework.md`를 따른다.
- 실행 대상 케이스는 `02_Product/Accuracy_QA/Transition_Scoring_Gold_Set.md`를 따른다.
- 조정 필요 판단이 생기면 `Scoring_Calibration_Log.md`로 연결한다.

## 사용 규칙
- 모든 QA 실행은 결과가 나쁘더라도 반드시 기록한다.
- 기존 라운드 기록을 수정하지 말고, 정정이 필요하면 새 entry를 append한다.
- `major_fail_cases`에는 치명 오류 케이스 ID를 우선 적는다.

## 라운드 로그 템플릿
```md
## TSQ-RND-20260402-01
- date:
- cases_run:
- hit_rate_within_range:
- hit_rate_within_one_band:
- ranking_agreement:
- explanation_consistency:
- false_high_count:
- false_low_count:
- major_fail_cases:
- next_action:
```

## Append-Only Log

## NGA2-RND-20260405-02
- date: 2026-04-05
- round_name: Newgrad Axis 2 second calibration batch
- cases_run: 8 (`NGA2-CASE-20260405-011`, `012`, `013`, `014`, `015`, `016`, `017`, `018`)
- match_count: 0
- soft_mismatch_count: 5
- hard_mismatch_count: 3
- pattern_A_repeated: yes
- pattern_B_repeated: yes
- high_level_finding: first batch의 A/B 패턴이 noise가 아니라는 방향으로 반복 확인됐다. A는 very_low 기대 bucket이 low~mid로 올라가는 현상이 반복됐고, B는 related major가 기대만큼 lift를 만들지 못하는 현상이 다시 나타났다.
- final_decision: repeated evidence is now strong enough to justify narrow implementation investigation of `scoreDomainInterest()`
- major_fail_cases: NGA2-CASE-20260405-012, NGA2-CASE-20260405-013, NGA2-CASE-20260405-014
- next_action: 다음 단계는 의미 재설계가 아니라 `scoreDomainInterest()`만 좁게 조사하는 implementation investigation이다.

## NGA2-RND-20260405-01
- date: 2026-04-05
- round_name: Newgrad Axis 2 first actual verification run
- cases_run: 9 (`NGA2-CASE-20260405-001`, `002`, `003`, `004`, `005`, `006`, `007`, `009`, `010`)
- match_count: 3
- soft_mismatch_count: 5
- hard_mismatch_count: 1
- high_level_finding: certification-only / weak-project-only / internship-only는 대체로 SSOT와 맞았지만, low-signal bucket의 low~mid floor와 related-major under-lift 패턴이 반복됐다.
- axis2_status: usable but needs calibration follow-up
- major_findings:
  - unrelated major 또는 typed support가 very_low bucket을 low~mid로 끌어올리는 패턴이 보였다.
  - related major가 들어간 case가 expectation만큼 lift되지 않아 major contribution이 약하게 읽혔다.
  - direct internship context 1건은 mid까지 정상 반영됐다.
- major_fail_cases: NGA2-CASE-20260405-010
- next_action: second Axis 2 calibration batch로 low-signal floor와 related-major lift를 재검증한 뒤, 반복되면 `scoreDomainInterest()` 좁은 implementation investigation으로 넘긴다.

## TSQ-RND-20260404-01
- date: 2026-04-04
- cases_run: TSG-AX12345-011, TSG-AX12345-007, TSG-AX12345-003, TSG-AX12345-009, TSG-AX12345-013
- run_type: HUMAN_REASONING_PASS (buildAxisConnectivityPack() 직접 호출 전 사람 기준 판정)
- hit_rate_within_range: 5/5 (100%) — 모든 케이스 expected band와 human actual band 일치
- hit_rate_within_one_band: 5/5 (100%)
- ranking_agreement: 해당 없음 (이번 라운드는 band 기준)
- explanation_consistency: 5/5 — reasoning 방향과 band 방향 일치
- false_high_count: 0
- false_low_count: 0
- major_fail_cases: 없음
- taxonomy_guard_result: 5/5 통과. 케이스별 raw label → PASSMAP 대분류 매핑 기록 (상세 COMM_PATCH_NOTES 참조)
- key_observation:
  - TSG-AX12345-007: 동일 직무명(백엔드개발)이어도 산업 교차(AI/클라우드→게임)시 Axis4 low — 원축 독립성 교정 효과 확인
  - TSG-AX12345-003: Axis1 mid_high이지만 Axis4 low — B2B→B2C 고객 유형 반전이 Axis4를 독립적으로 낮춤
  - TSG-AX12345-009: 같은 산업/유사 직무명이어도 Axis5 low — 일의 결(프로그램 실행→조직 진단/변화)이 직무 성격 연결성을 결정
  - TSG-AX12345-013: Axis4 very_low + Axis5만 mid — cross-transition에서 false high 발생하기 쉬운 패턴 확인
- next_action: buildAxisConnectivityPack() 직접 호출로 engine actual band 기록 후 human pass와 비교

## TSQ-RND-YYYYMMDD-01
- date:
- cases_run:
- hit_rate_within_range:
- hit_rate_within_one_band:
- ranking_agreement:
- explanation_consistency:
- false_high_count:
- false_low_count:
- major_fail_cases:
- next_action:

## ROUND-2026-04-02-A
- date: 2026-04-02
- status: execution pending
- cases_run: 20 planned / 0 completed
- hit_rate_within_range: pending
- hit_rate_within_one_band: pending
- ranking_agreement: pending
- explanation_consistency: pending
- false_high_count: pending
- false_low_count: pending
- major_fail_cases: pending
- next_action: TSG-001 ~ TSG-020 각각에 대한 PASSMAP 실행 입력 payload를 먼저 수집하고 실제 model_score / model_grade / explanation 요약을 채운다.

### why execution is pending
- 현재 Gold Set 20건은 전문가 기대값 registry로는 충분하지만 PASSMAP actual output을 뽑기 위한 실행 입력 payload가 없다.
- 각 케이스에 대해 현재 직무/산업, 목표 직무/산업, 경력 요약은 있으나 엔진에 직접 넣을 구조화 입력 또는 실제 resume/JD 텍스트가 없다.
- 따라서 이번 라운드에서는 model_score를 fabricate하지 않고 execution pending으로 기록한다.

### exact missing dependency
- TSG-001 ~ TSG-020 각각에 대한 PASSMAP 실행 입력
  - 최소 필요값 예시: current_job, current_industry, target_job, target_industry, years_of_experience, structured evidence fields 또는 equivalent resume/JD style input
- 실행 결과에서 추출할 actual output
  - model_score
  - model_grade
  - explanation summary 또는 equivalent reasoning text

### ready-to-fill per-case structure
| case_id | model_score | model_grade | within_range | within_one_band | explanation_consistent | false_high | false_low | short_note |
|---|---|---|---|---|---|---|---|---|
| TSG-001 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-002 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-003 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-004 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-005 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-006 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-007 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-008 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-009 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-010 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-011 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-012 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-013 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-014 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-015 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-016 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-017 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-018 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-019 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |
| TSG-020 | pending | pending | pending | pending | pending | pending | pending | input payload 필요 |

### payload build progress
- payload_asset_prepared: 5 cases (`TSG-001` ~ `TSG-005`)
- mapping_confirmed: 14 rows
- mapping_needs_confirmation: 1 row (`전기전자 제조`)
- round_status_note: Round 1 payload layer는 owner doc에 기록됐지만 actual PASSMAP output은 아직 수집하지 않았다.

### remaining blocker after payload build
- `TSG-006` 이후 케이스의 canonical mapping table이 아직 비어 있다.
- `전기전자 제조`처럼 Gold Set visible label과 industry registry granularity가 정확히 맞지 않는 케이스는 exact canonical 결정이 더 필요하다.
- 실제 실행은 가능해져도 아직 per-case 결과 수집을 돌리지 않았으므로 `model_score`, `model_grade`, `explanation_consistent`는 비어 있어야 한다.

### exact next step after this round
1. `TSG-006` ~ `TSG-020`까지 동일 형식으로 payload asset을 확장한다.
2. unresolved industry label을 canonical registry 기준으로 잠근다.
3. 그 다음 실제 PASSMAP 실행 결과를 수집해 현재 pending table을 채운다.

### execution probe result
- execution_probe_status: partial measured probe completed
- measured_cases: 3 (`TSG-001`, `TSG-011`, `TSG-016`)
- why_round_is_still_pending: `analyze()`에서 `vm.score`와 `hireability.final.hireabilityScore`는 얻었지만 Gold Set 계약의 5-band `model_grade`는 직접 surface되지 않았다.

| case_id | expert_score_range | model_score (`vm.score`) | score_100 (`hireability`) | raw_band | within_range | explanation_consistent | false_high | false_low | short_note |
|---|---|---|---|---|---|---|---|---|---|
| TSG-001 | 78-88 | 75 | 45 | 근거 확인 필요 | N | Y | N | N | grounded payload로 실행은 됐지만 expert range보다 낮게 나왔다. raw band는 QA grade contract와 직접 대응되지 않는다. |
| TSG-011 | 10-20 | 77 | 45 | 근거 확인 필요 | N | N | Y | N | hard negative control인데 score가 높게 나왔다. top risk는 연결 약함을 말하지만 점수는 높아 explanation mismatch로 본다. |
| TSG-016 | 55-70 | 76 | 45 | 근거 확인 필요 | N | N | N | N | adjacent transition boundary case인데 score는 높고 raw band는 `근거 확인 필요`라 score/band 정합성이 약하다. |

### tighter blocker after execution probe
- Round 1의 formal comparison field인 `model_grade`를 현재 output surface에서 직접 읽지 못한다.
- `vm.score`와 `hireabilityScore` 중 어떤 값을 Gold Set의 `expert_score_range`와 공식 비교할 score owner로 잠글지 아직 문서화가 더 필요하다.
- payload는 20건 전부 문서화됐지만 readiness가 `partial`인 12건은 canonical ambiguity가 남아 있다.

### output contract lock after probe
- official_score_source: `reportPack.simulationViewModel.score`
- official_score_source_alias: `vm.score`
- rejected_alt_score_source: `hireability.final.hireabilityScore`
- model_grade_contract: provisional
- provisional_grade_basis: `vm.score` -> `getBaseBandLabel(score)` -> QA 5-band collapse
- round_status_note: measured subset은 이 계약으로 비교를 formalize하지만 Round 1 전체 상태는 계속 `execution pending`이다.

### partial measured cases formalized
| case_id | expert_score_range | official_score_source_value | derived_model_grade | within_range | within_one_band | explanation_consistent | false_high | false_low | short_note |
|---|---|---|---|---|---|---|---|---|---|
| TSG-001 | 78-88 | 75 | 중간 (provisional) | N | Y | Y | N | N | 공식 비교값은 `vm.score` 75다. `raw_band`는 `근거 확인 필요`였고 score grade로 직접 쓰지 않았다. |
| TSG-011 | 10-20 | 77 | 중간 (provisional) | N | N | N | Y | N | hard negative control인데 `vm.score`가 높게 남아 false high candidate로 formalize했다. |
| TSG-016 | 55-70 | 76 | 중간 (provisional) | N | Y | N | N | N | adjacent transition 경계 케이스인데 score는 중간 상단, raw band는 `근거 확인 필요`라 surface mismatch를 분리 기록한다. |

### exact next action after partial formalization
1. ready 8건부터 같은 계약으로 `vm.score`를 추가 수집한다.
2. measured subset에서 provisional grade와 raw `vm.band` 괴리를 별도 체크한다.
3. partial 12건은 canonical ambiguity를 더 줄인 뒤 같은 비교 계약으로 확장한다.

## 2026-04-05 Newgrad 5Axis Radar Audit / Test Design Round

### classification
- safe investigation
- newgrad report 5axis radar scoring audit
- test design only
- no source patch

### files read for owner tracing
- `src/components/input/NewgradTransitionLiteInput.jsx`
- `src/App.jsx`
- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- `src/lib/analysis/buildNewgradAxisPack.js`
- `src/components/report/TransitionLiteResult.jsx`

### confirmed
- newgrad 5축 radar score owner는 `buildNewgradAxisPack()`이다.
- `buildNewgradTransitionLiteResult()`는 normalization + vm assembly owner다.
- `TransitionLiteResult.jsx`는 radar consumer / short label / narrative owner다.
- score와 narrative는 같은 owner가 아니다.
- 5축 모두 heuristic 기반이며, 축별 입력 의존성이 다르다.

### main audit risk
- newgrad path와 experienced path를 consumer 레벨에서 혼동할 위험이 크다.
- visible label만 보고 internal key를 오판할 수 있다.
- raw input shape와 scoring normalized shape가 다르므로 input fixture를 그대로 score contract라고 보면 안 된다.

### test design decision
- Layer 1: 축 단독 `high / mid / low / boundary`
- Layer 2: signal impact 분리 테스트
- Layer 3: 실제 사용자형 조합 시나리오
- Layer 4: band-first gold set + calibration log

### next recommended round
1. Axis 2는 별도로 `scoreDomainInterest()` 좁은 구현 조사를 진행한다.
2. 5축 전체는 Axis 1/3 우선으로 test repository skeleton을 만든다.
3. score drift와 narrative drift를 분리해 기록한다.

## 2026-04-05 Newgrad 5Axis QA Skeleton Lock / Axis 1-3 Priority Design

### classification
- safe investigation
- qa skeleton lock
- axis 1 / axis 3 priority gold set design
- axis 2 narrow implementation audit
- no source patch

### structure decision
- option 1 rejected
  - `Accuracy_QA_Log.md` 한 문서에 test case, execution, drift를 모두 넣으면 append는 쉽지만 누적 관리와 handoff 가독성이 급격히 나빠진다.
- option 2 accepted
  - framework / gold set / calibration log를 분리 유지한다.
  - 기존 newgrad 문서 체계와 충돌하지 않는다.

### locked owners for operations
- test case definition: `02_Product/Accuracy_QA/Newgrad_Transition_Lite_Gold_Set.md`
- execution round summary: `05_Execution/Accuracy_QA_Log.md`
- calibration memo + drift split: `05_Execution/Newgrad_Calibration_Log.md`

### axis 1 / axis 3 design note
- Axis 1은 target job direct role 반복과 major support 조합을 먼저 보는 축으로 잠갔다.
- Axis 3은 evidence group / item count와 outcome / duration lift를 먼저 보는 축으로 잠갔다.
- starter gold set은 숫자 exact match보다 `high / mid / low + reasoning` 우선으로 시작한다.

### axis 2 narrow audit note
- `scoreDomainInterest()`는 Axis 2의 단독 score owner function으로 본다.
- 다만 helper dependency는 `_getIndustryPrepProfile`, major/cert/project/context helper에 의존한다.
- 현재 재확인 포인트는 unrelated major floor, weak project support, invalid targetIndustry profile, major under-lift다.

### next recommended round
1. Axis 1 / Axis 3 starter cases를 실제 payload 가능한 case로 채운다.
2. same round에서 score drift / narrative drift를 분리 기록한다.
3. Axis 2는 pattern A/B 재검증용 추가 케이스 6건 이상을 먼저 실행한다.

## 2026-04-05 Newgrad Axis 1/3 First Run + Axis 2 Targeted Expansion

### classification
- safe qa execution
- newgrad axis 1 / axis 3 starter goldset first run
- axis 2 targeted case expansion
- no source patch

### execution path
- safe harness path: `buildNewgradTransitionLiteResult(payload)` 직접 호출
- actual score source: `vm.axisPack.axes.<axis>`
- visible narrative source: `TransitionLiteResult.jsx`의 same mapping을 임시 harness에서 복제

### executed counts
- Axis 1 `jobStructure`: 6건 실행
- Axis 3 `responsibilityScope`: 6건 실행
- Axis 2 `industryContext` targeted expansion: 6건 실행
- total executed: 18건

### drift summary
- match: 15
- score drift: 3
- narrative drift: 0
- both: 0

### axis 1 summary
- total executed: 6
- match: 5
- score drift: 1
- repeated pattern: single direct project role 1건이 3-band 기준 `high`로 읽혔다.

### axis 3 summary
- total executed: 6
- match: 4
- score drift: 2
- repeated pattern: `project 1 + activity 1`, `project 1 + short internship 1` 조합이 예상보다 빨리 `high` 측으로 올라갔다.

### axis 2 summary
- total executed: 6
- match: 6
- score drift: 0
- repeated pattern:
  - weak project only low cap 유지
  - cert only low cap 유지
  - strong internship support mid lift 확인
  - related major only retest가 `mid`로 나와 prior under-lift 기록과 충돌

### immediate reading
- 이번 batch에서는 Axis 1/3의 mid-upper boundary가 더 먼저 문제로 드러났다.
- Axis 2는 targeted expansion 기준으로는 안정적이었지만, old case 기록과 충돌하는 retest가 있어 prior evidence 재대조가 필요하다.
- 따라서 다음 round priority는 Axis 1/3 경계 케이스 확장과 Axis 2 old/new payload 비교다.

## 2026-04-05 Newgrad Axis 1/3 Boundary Stress Run + Axis 2 Repro Check

### classification
- safe qa execution
- newgrad axis 1 / axis 3 boundary stress run
- axis 2 old mismatch repro check
- no source patch

### executed counts
- Axis 3 boundary stress: 6건 실행
- Axis 1 boundary stress: 6건 실행
- Axis 2 mismatch repro: 3건 실행
- total executed: 15건

### axis 3 summary
- total executed: 6
- match: 4
- score drift: 2
- narrative drift: 0
- both: 0
- repeated pattern: upper-mid boundary 2건이 다시 high-side로 상승
- readiness judgment: `boundary_ready`

### axis 1 summary
- total executed: 6
- match: 4
- score drift: 2
- narrative drift: 0
- both: 0
- repeated pattern:
  - single direct role only -> high-side 반복
  - repeated adjacent signals -> low 유지
- readiness judgment: `boundary_ready`

### axis 2 repro summary
- total executed: 3
- conflict: 2
- no_conflict: 1
- repeated pattern: prior under-lift 2건이 same harness에서 재현되지 않음
- readiness judgment: `not_ready`

### round reading
- Axis 3는 전체 threshold가 공격적이라기보다 upper-mid boundary가 high로 붙는 패턴이 반복됐다.
- Axis 1는 single direct role 1건이면 high-side, repeated adjacent는 low라는 현재 규칙이 더 선명해졌다.
- Axis 2는 repro conflict가 남아 있어 patch-ready로 보지 않는다.
## 2026-04-05 Newgrad Axis 3 Micro-Boundary + Axis 1 Clarification + Axis 2 Raw Repro Narrowing

### classification
- safe QA execution
- axis 3 micro-boundary confirmation
- axis 1 expectation contract clarification
- axis 2 raw repro narrowing

### execution summary
- Axis 3 micro-boundary: 6건 실행
- Axis 1 expectation review: 4건 실행
- Axis 2 raw repro narrowing: 2건 실행
- total: 12건 실행

### axis 3 summary
- match: `4`
- score drift: `2`
- narrative drift: `0`
- both: `0`
- repeated pattern: `project + internship` upper-mid 조합이 다시 high-side로 상승
- readiness judgment: `patch_ready`

### axis 1 summary
- match: `4`
- score drift: `0`
- narrative drift: `0`
- both: `0`
- repeated pattern: single direct role high-side / adjacent repetition low-side
- gate judgment: `guideline_first`

### axis 2 summary
- repro cases: `2`
- same harness result: old `low / 40` 재현
- repeated pattern: `raw major payload shape`가 low 재현을 만든다
- gate judgment: `repro_first`

### round conclusion
- Axis 3는 calibration patch review 직전이 아니라, 이미 boundary evidence가 충분해 `patch_ready`로 올릴 수 있다.
- Axis 1은 구현 변경보다 reviewer expectation guideline 업데이트가 먼저다.
- Axis 2는 logic review보다 raw payload / normalization 기록 대조가 먼저다.
## 2026-04-05 Newgrad Certification Signal Audit + Job-Specific Coverage Gap Check

### classification
- safe investigation
- newgrad certification signal audit
- job-specific certification coverage gap check

### confirmed owner reading
- input owner: `NewgradTransitionLiteInput.jsx`
- normalization owner: `buildNewgradTransitionLiteResult.js`
- scoring owner: `buildNewgradAxisPack.js > scoreDomainInterest()`
- display owner: `TransitionLiteResult.jsx`

### key findings
- newgrad path에서 certification direct scoring usage는 사실상 Axis 2 전용이다.
- current scoring은 target industry별 category/keyword heuristic은 있으나 target job별 cert weighting은 없다.
- cert ontology asset(`cert_catalog`, `cert_rules`, `role_cert_matrix`)은 존재하지만 current newgrad UI/scoring path에는 직접 연결되지 않는다.
- 따라서 현재 상태 분류는 `industry_specific_cert_signal` + `weak_cert_signal_only` + `coverage_gap_dominant`다.

### coverage severity summary
- high: cloud / security / procurement_scm / HR
- medium: finance / data / marketing
- low: design / content 계열

### next recommendation
- certification QA는 case 실행 전에 UI option gap / canonical mapping gap / scoring usage gap를 분리한 reviewer 기준부터 잠그는 것이 맞다.
## 2026-04-05 Axis 3 Calibration Patch Design Review

### classification
- safe patch review
- newgrad Axis 3 calibration patch design
- no patch apply yet

### review conclusion
- Axis 3 inflation cause는 `threshold_issue` 단독보다 `mixed`가 더 타당하다.
- `project + internship` 조합이 `base 4`를 열고, medium outcome / duration lift가 붙으며 `5`로 밀리는 구조가 반복됐다.
- patch option 3개를 비교했고, 가장 안전한 추천안은 `option B`다.

### options reviewed
- option A: base 4 threshold 미세 상향
- option B: base 4 상태의 semantic lift 결합만 미세 조정
- option C: upper-mid high 진입 guard / cap 추가

### recommended option
- `option B`
- reason:
  - lower-mid / true-mid 안정 구간을 덜 건드린다.
  - repeated upper-mid inflation 패턴만 더 직접적으로 겨냥한다.
  - high control regression 관리가 상대적으로 쉽다.

## 2026-04-05 Axis 3 Semantic Lift Micro-Calibration Postcheck

- classification:
  - safe patch
  - Axis 3 postcheck
  - owner-block formula harness
- patch target:
  - `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth(input)`
- harness note:
  - 엔진 전체 consumer/UI가 아니라 owner block의 base/lift/guard 경로를 직접 비교했다.
  - 이번 라운드는 semantic lift micro-calibration만 검증하는 목적에 맞춘다.
- case rows:
  - `NG5A3-CASE-20260405-025`
    - expected direction: high-side -> mid_high boundary
    - actual after patch: `80 / mid_high`
    - changed / unchanged: changed
    - quick verdict: improved
  - `NG5A3-CASE-20260405-026`
    - expected direction: high-side -> mid_high boundary
    - actual after patch: `80 / mid_high`
    - changed / unchanged: changed
    - quick verdict: improved
  - `NG5A3-CASE-20260405-035`
    - expected direction: true high control preserved
    - actual after patch: `100 / high`
    - changed / unchanged: unchanged
    - quick verdict: preserved
  - `NG5A3-CASE-20260405-036`
    - expected direction: true high control preserved
    - actual after patch: `100 / high`
    - changed / unchanged: unchanged
    - quick verdict: preserved
  - `NG5A3-CASE-20260405-022`
    - expected direction: lower-mid / true-mid stable
    - actual after patch: `60 / mid`
    - changed / unchanged: unchanged
    - quick verdict: preserved
  - `NG5A3-CASE-20260405-023`
    - expected direction: lower-mid / true-mid stable
    - actual after patch: `60 / mid`
    - changed / unchanged: unchanged
    - quick verdict: preserved
- summary:
  - base 4 + combo + medium-lift 케이스만 `100/high -> 80/mid_high`로 내려왔다.
  - high outcome control은 유지되었다.
  - lower-mid / true-mid 대표 케이스는 유지되었다.
## 2026-04-05 Newgrad Axis 3 Post-Patch Engine Replay

- classification: `SAFE QA EXECUTION / AXIS 3 POST-PATCH ENGINE REPLAY / REGRESSION FIXTURE LOCK`
- harness: `buildNewgradTransitionLiteResult(payload)`
- before baseline: same normalized input + pre-patch `scoreExecutionDepth()` formula replay
- after baseline: current patched engine
- replay count: `12`
- patched target fixtures: `4`
- true high controls: `3`
- stable mid controls: `3`
- low controls: `2`
- outcome:
  - patched target `4 / 4` 개선
  - controls `8 / 8` 유지
  - undesired regression `0`
- user-facing read:
  - `100/high -> 80/mid_high`로 내려오며 narrative도 한 단계 완화
  - coarse 3-band는 high 쪽이 남아 있어 `keep_with_watch`
- verdict: `keep_with_watch`
- fixed regression fixtures:
  - `NG5A3-CASE-20260405-025`
  - `NG5A3-CASE-20260405-026`
  - `NG5A3-CASE-20260405-033`
  - `NG5A3-CASE-20260405-034`
  - `NG5A3-CASE-20260405-011`
  - `NG5A3-CASE-20260405-035`
  - `NG5A3-CASE-20260405-022`
  - `NG5A3-CASE-20260405-015`
## 2026-04-05 Newgrad Axis 1 Reviewer Guideline Lock

- classification: `SAFE DOCUMENTATION PATCH / NEWGRAD AXIS 1 REVIEWER GUIDELINE LOCK`
- owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreJobFit()`
- why guideline first:
  - `single direct role only`는 current contract상 high-side가 맞다.
  - `repeated adjacent only`는 current contract상 low에 머무는 쪽이 자연스럽다.
  - `major-only`는 low보다 mid가 current contract에 맞다.
- expectation correction:
  - single direct role 1건을 mid로 두던 reviewer expectation은 과보수적이었다.
  - repeated adjacent 반복을 mid까지 올려 보던 해석은 current contract와 어긋났다.
  - major-only는 low가 아니라 mid 기본값으로 읽어야 한다.
- decision: `guideline_locked`
- next:
  - Axis 1은 추가 patch가 아니라 locked guideline 기준으로 QA reviewer interpretation을 통일한다.
  - 다음 우선순위는 Axis 2 raw payload snapshot comparison 준비 여부 점검이다.
## 2026-04-05 Newgrad Axis 2 Raw Payload Snapshot Comparison

- classification: `SAFE INVESTIGATION / AXIS 2 RAW PAYLOAD SNAPSHOT COMPARISON`
- compared cases:
  - `NGA2-CASE-20260405-002`
  - `NGA2-CASE-20260405-006`
  - `NGA2-CASE-20260405-007`
- compared layers:
  - raw payload
  - normalized input
  - Axis 2 scorer consumption
- same harness variants: `8`
- repro succeeded:
  - `002-object-category-only` -> `low / 40`
  - `006-object-category-only-weak-project` -> `low / 40`
- control consistency:
  - `002-string-major-control` -> `mid / 60`
  - `006-string-major-weak-project` -> `mid / 60`
  - `007` direct internship context variants -> `mid / 60`
- strongest conflict point:
  - raw `major` object에서 `label/subcategory`가 비고 `category code`만 남는 경우 normalization 후 related-major lift가 사라진다.
- readiness judgment: `contract_fix_candidate`
- next:
  - Axis 2는 scoring patch review보다 `major` normalization / payload contract 정리가 먼저다.
## 2026-04-05 Newgrad Certification Asset Expansion Priority Lock

- classification: `SAFE INVESTIGATION / CERTIFICATION ASSET EXPANSION PRIORITY LOCK`
- current reading:
  - UI cert option은 hardcoded다.
  - canonical cert asset(`catalog / rules / matrix`)은 richer하지만 current newgrad path와 직접 연결되지 않는다.
  - current cert scoring direct usage는 사실상 Axis 2 heuristic뿐이다.
- tier_1_immediate:
  - `cloud`
  - `security`
  - `procurement_scm`
  - `HR`
- tier_2_next:
  - `finance`
  - `data`
- tier_3_later:
  - `marketing`
- recommended order:
  - 먼저: tier 1 family UI option shortlist
  - 다음: canonical mapping crosswalk
  - 나중: weighting / relevance 연결
- decision note:
  - 이번 라운드는 weighting 설계가 아니라 expansion priority lock이다.
  - 추천 시작 직무군은 `cloud`, `security`다.
## 2026-04-05 Newgrad Job-Specific Cert Weighting Contract Design

- classification: `SAFE DESIGN / JOB-SPECIFIC CERT WEIGHTING CONTRACT DESIGN`
- current state:
  - current newgrad path는 cert weighting 미연결
  - current direct cert scoring은 사실상 Axis 2 heuristic
- design lock:
  - conservative relevance tier
  - cert only cap
  - stacking cap
  - cloud/security sample contracts
- integration order:
  - 1. UI option
  - 2. canonical mapping
  - 3. weighting linkage
- readiness judgment: `design_locked_waiting_for_linkage`
- next:
  - Axis 2 normalization / payload contract 먼저
  - 그 다음 cloud/security phase 1 linkage 설계

## 2026-04-05 SAFE INVESTIGATION / Cert Mapping Bridge Audit

- classification
  - `SAFE INVESTIGATION`
- files read
  - `src/components/input/NewgradTransitionLiteInput.jsx`
  - `src/App.jsx`
  - `src/lib/analysis/buildNewgradAxisPack.js`
  - `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
  - `src/lib/ontology/certs/cert_catalog.v0.json`
  - `src/lib/ontology/certs/cert_rules.v0.json`
  - `src/lib/ontology/certs/role_cert_matrix.v0.json`
- what was investigated
  - UI cert option owner / payload shape
  - UI label -> cert catalog canonical mapping 가능성
  - target job key -> role matrix role key linkage 가능성
  - current cert call path와 future integration point
- what was confirmed
  - UI option은 hardcoded이며 canonical-like key가 없다.
  - `ADsP`, `ADP`, `SQLD`, `SQLP`는 catalog exact match 가능하다.
  - cloud/security 관련 cert asset은 catalog와 matrix에 존재한다.
  - current cert 반영은 Axis 2 industry heuristic 수준이다.
- what remains uncertain
  - generic UI label의 alias bridge 방식
  - `JOB_*` target job key를 `role:*` family로 변환하는 adapter contract
- final judgment
  - `design_locked_waiting_for_linkage`
- next recommended round
  - linkage bridge patch 전 조사 결과를 기준으로 `normalization contract + cert mapping helper + role bridge adapter` 범위를 잠가라.

## 2026-04-05 SAFE DESIGN / Cloud-Security Bridge Contract Closure

- classification
  - `SAFE DESIGN`
- what contract was closed
  - cert mapping bridge input / output / status enum
  - cloud/security phase1 raw label mapping table
  - role adapter input / output / status enum
  - `JOB_IT_DATA_DIGITAL_DEVOPS_INFRA -> role:cloud`
  - `JOB_IT_DATA_DIGITAL_SECURITY -> role:security`
  - helper owner / insertion point / downstream read contract
- what remains before apply
  - Axis 2 normalization contract fix
  - helper implementation patch
  - unresolved generic label을 유지하는 phase1 guardrail 적용
- final judgment
  - `bridge_contract_locked_but_waiting_for_normalization_fix`
- next recommended round
  - normalization fix를 먼저 잠그고, 이후 cloud/security 한정 phase1 apply patch로 간다.

## 2026-04-16 SAFE DOC UPDATE - newgrad Axis 1 major prior adjacent rescue QA 정리

### classification
- `SAFE DOC UPDATE / QA SUMMARY`

### verified before / after cases
| case | 코드 기준 before | 코드 기준 after | 이번 라운드 판정 | 비고 |
| --- | --- | --- | --- | --- |
| CS + BUSINESS | weak (`base=1`) | adjacent (`final=2`) | 의도된 변화 | `exceptionAdjustment +1` |
| SOFTWARE + BUSINESS | weak (`base=1`) | adjacent (`final=2`) | 의도된 변화 | `exceptionAdjustment +1` |
| 경영 + IT_DATA_DIGITAL | weak (`base=1`) | adjacent (`final=2`) | 의도된 변화 | `exceptionAdjustment +1` |
| 경제 + SALES | weak (`base=1`) | adjacent (`final=2`) | 의도된 변화 | `exceptionAdjustment +1` |
| 금융 + SALES | weak (`base=1`) | adjacent (`final=2`) | 의도된 변화 | `exceptionAdjustment +1` |
| CS + ENGINEERING_DEV | adjacent (`base=2`) | adjacent (`final=2`) | 의도되지 않은 변화 없음 | 기존 유지 |
| 산업공학 + BUSINESS | direct (`base=3`) | direct (`final=3`) | 의도되지 않은 변화 없음 | 기존 유지 |
| 미등록전공 | weak fallback (`safeBase=1`) | weak fallback (`final=1`) | 의도된 변화 없음 | explanation에 `unknown_major_fallback` 추가 |
| override + exception 동시 케이스 | 구조 rule only | `boost = Math.max(override, exceptionAdjustment)` | 의도된 보호 장치 | 누적 +2 금지, 대표 실케이스는 별도 고정 필요 |

### what changed as intended
- weak로 과소평가되던 일부 high-frequency 조합이 adjacent로 상향됐다.
- direct 증설 없이 adjacent rescue만 적용됐다.
- 미등록전공은 score 유지, explanation signal만 확장됐다.
- override와 exception 동시 적용 시 2단계 상승이 막히도록 no-stacking rule이 확인됐다.

### unintended change check
- 이번 문서 라운드 기준으로 확인된 대표 unchanged 케이스는 `CS + ENGINEERING_DEVELOPMENT`, `산업공학 + BUSINESS`, `미등록전공 fallback`이다.
- 즉, 기존 adjacent/direct/weak 유지 케이스까지 광범위하게 흔드는 전면 retune은 발생하지 않은 것으로 기록한다.

### verified this round
- exception adjustment 대상 majorCategory 조합 5개
- `unknown_major_fallback` explanation signal 추가
- `major_override_applied`, `major_exception_adjusted`, `major_double_selected` explanation signal 추가
- no-stacking rule (`Math.max`) 적용

### still under-verified
- 실제 payload/UI에서 복수전공 입력이 active callsite까지 연결되는지 여부
- override + exception 동시 조건의 사용자 경로 실케이스 fixture
- dependencyTier 재분류 후 score 체감 변화
- adjacent rescue가 high/medium/low tier별로 explanation 톤과 얼마나 잘 맞는지 여부

### next QA candidates
- `double_major` payload 연결 시 우선 선택 major가 예상대로 고르는지 확인
- `unknown_major_fallback` 사용자 안내 문구 체감 확인
- `dependencyTier` high / medium / low 재분류 후 Axis1 재측정
- `CS/SW -> BUSINESS`, `경영 -> IT_DATA_DIGITAL`, `경제/금융 -> SALES`를 target job subcategory 수준 fixture로 고정

## 2026-04-17 newgrad Axis 1 read path major-only 정렬 QA

### classification
- `SAFE PATCH + QA SUMMARY`

### 패치 범위
| 라운드 | 수정 함수 | 수정 내용 |
| --- | --- | --- |
| 1차 | `buildAxis1ComparisonBlock()` | project/internship row → major_job_relevance only |
| 1차 | `buildNewgradJobFitExplanation()` 계열 | explanation major-only 계약 정렬 |
| 2차 | `buildNewgradWhyThisReadFromPacks()` | axis1 항목에서 project/work 라벨 제거, majorLabel-only |
| 2차 | `buildInputEvidenceReadFromPacks()` | jobStructure item에서 axis1ProjectLabel/WorkLabel 제거, majorLabel-only |
| 2차 | `buildAxisReadSummaryFromPacks()` | summaryByAxis.jobStructure에서 project/work 라벨 제거, majorLabel-only |

### 코드 패스 기준 점검 결과
| 경로 | 잔존 여부 | 근거 |
| --- | --- | --- |
| comparisonBlock | ✅ 없음 | 1차 패치 완료 |
| explanation | ✅ 없음 | 1차 패치 완료 |
| whyThisRead | ✅ 제거됨 | 2차 패치, `buildNewgradWhyThisReadFromPacks()` |
| inputEvidenceRead | ✅ 제거됨 | 2차 패치, `buildInputEvidenceReadFromPacks()` |
| axisReadSummary | ✅ 제거됨 | 2차 패치, `buildAxisReadSummaryFromPacks()` |
| axis2~5 | ✅ 영향 없음 | 미수정 |
| consumer help text | ✅ consumer leak 없음 | `TransitionLiteResult.jsx` defaultActionMap은 정적 UI 제안 문구, evidence 아님 |

### 미검증 항목
- 사용자 환경 빌드: bash 환경 node 미설치로 `npm run build` 직접 실행 불가. 사용자 환경에서 별도 확인 필요.
- old version helper (`buildAxisReadSummary()`, `buildInputEvidenceRead()`) 내 동일 패턴 잔존 — 현재 런타임 미호출이므로 user-facing 영향 없음.

### next QA candidates
- 사용자 환경 빌드 후 whyThisRead / inputEvidenceRead / axisReadSummary 출력에 project/internship 문구 제거됐는지 확인
- old version helper 호출 경로 추가 여부 주기적 점검

---

## NGA1-RND-20260417-01
- date: 2026-04-17
- round_name: Newgrad Axis 1 dependencyTier investigation + majorImpactSummary mojibake fix
- scope: investigation + 1 safe patch
- patch_file: `src/lib/analysis/buildNewgradAxisPack.js`
- patch_target: `_buildJobMajorImpactSummary()` — 6개 mojibake 문자열 → 올바른 UTF-8 한글

### 대표 케이스 검증 표 (2026-04-17 기준 기대값)

| # | 전공 | 목표직무 | expected prior label | dependencyTier | 점수 경로 | explanation 핵심 | 현재 리스크 |
|---|------|---------|---------------------|---------------|---------|---------------|------------|
| 1 | 컴공 | 개발(SW) | direct (base=3) | high | score 4 → +1 → 5 | major_direct + majorImpactSummary "전공 의존도가 높은 직무로, 전공 적합성이 강점으로 작동해..." | 없음 |
| 2 | 컴공 | 서비스기획 | adjacent (base=1+exception=1→2) | DEFAULT medium | score 3, no tier adjustment | major_adjacent + major_exception_adjusted | 없음 |
| 3 | 경영 | 마케팅 | direct (base=3) | DEFAULT medium | score 4, light_bonus label만 | major_direct + majorImpactSummary "전공 적합성이 비교적 잘 맞아..." | 없음 |
| 4 | 경영 | 데이터분석 | adjacent (base=1+exception=1→2) | medium | score 3, no tier score adj | major_adjacent + major_exception_adjusted | 없음 |
| 5 | 산업공학 | SCM | direct (base=3, PROCUREMENT_SCM=3) | DEFAULT medium | score 4, no +1 (medium tier) | major_direct | HIGH tier 아닌 것이 아쉬울 수 있음 |
| 6 | 산업공학 | 기획 | direct (base=3, BUSINESS=3) | DEFAULT medium | score 4 | major_direct | HIGH tier 아닌 것이 아쉬울 수 있음 |
| 7 | 심리 | HR | direct (base=3) | low | score 4, light_bonus label (low+direct) | major_direct + majorImpactSummary "전공보다 실제 직무 수행 경험이 더 중요하게 작동하지만..." | 없음 |
| 8 | 경제/금융 | 재무/회계 | direct (base=3, FINANCE_ACCOUNTING=3) | DEFAULT medium | score 4, no +1 | major_direct | HIGH tier 미등록으로 +1 보너스 누락 |
| 9 | 경제/금융 | 세일즈 | adjacent (base=1+exception=1→2) | low | score 3, low tier는 점수 무영향 | major_adjacent + major_exception_adjusted | 없음 |
| 10 | 미등록전공 | 임의직무 | none (resolutionMode: unknown_major_fallback) | DEFAULT medium | score 1, base=0 fallback | major_unknown_fallback "입력하신 전공은 유사 전공군 기준으로 보수적으로 판단했습니다." | 없음 |
| 11 | 복수전공 선택 (케이스1) | 개발(SW) | weak (DOUBLE_MAJOR → ALL_WEAK=1) | high | score 2 → high+weak → no role evidence → -1 → score 1 | major_weak | DOUBLE_MAJOR 불이익 구조. resolveNewgradAxis1MajorPriorBest 미연결 |
| 12 | 복수전공 선택 (케이스2) | 마케팅 | weak (DOUBLE_MAJOR → ALL_WEAK=1) | DEFAULT medium | score 2, no tier score adj | major_weak | 복수전공 불이익 미해소. major_double_selected UNREACHABLE |

### 패치 전후 비교
- before (line 525): mojibake 문자열 → 사용자 리포트에 `??吏곷Т???` 류 깨진 문자 노출
- after (line 525): `"전공 의존도가 높은 직무로, 전공 적합성이 강점으로 작동해 직무 연결성이 유리하게 반영되었습니다."`
- 6개 브랜치 전부 동일 방식으로 교체. 브랜치 조건 무변경.

## 2026-04-19 SAFE INVESTIGATION ONLY - Axis1 unresolved 3건 QA lock
- 신규 patch 없음. current registry/live path/ontology 기준 판정만 확정.

### QA lock 결과
- `PRODUCTION_MANAGEMENT`: `C`
  - prior 구조: IE=direct(3), ELECTRICAL_ELECTRONIC/OTHER_ENGINEERING=adjacent(2), BUSINESS_ADMIN=weak(1)
  - HIGH 가정 시 영향: direct +1 가능, weak/mismatch는 no-role-evidence 조건에서 -1 가능
  - 판정 이유: 생산계획·현장운영·공정개선·조정 혼합형으로 전공 직결 HIGH 직무보다는 운영/경험 비중이 크다.
- `MANUFACTURING_INNOVATION`: `C`
  - prior 구조: IE=direct(3), 전기/기타 공학=adjacent(2), BUSINESS_ADMIN=weak(1)
  - HIGH 가정 시 영향: direct 보너스보다 weak/mismatch 과벌점 위험이 큼
  - 판정 이유: Lean/Six Sigma, 디지털화, 표준화, transformation이 함께 정의된 개선/방법론형이라 축1 HIGH 부적절
- `MEDIA override (CONTENT_MARKETING, PR_COMMUNICATIONS)`: `정리 후보`
  - base matrix 비교: MEDIA -> MARKETING base=3, override +1 적용 전후 final=3 동일
  - no-op 여부: current live path 기준 no-op 확인

### 상태 업데이트
- unresolved 3건 해소
- A/B/C 분류표 업데이트:
  - A 추가 없음
  - B 추가 없음
  - C 추가: `PRODUCTION_MANAGEMENT`, `MANUFACTURING_INNOVATION`
  - override 정리 후보: `MEDIA -> CONTENT_MARKETING`, `MEDIA -> PR_COMMUNICATIONS`

### follow-up
- 구조 패치 라운드로 넘길 항목 없음
- explanation-only 검토 후보:
  - 생산관리
  - 제조혁신
- override 정리 검토 후보:
  - MEDIA marketing no-op override
