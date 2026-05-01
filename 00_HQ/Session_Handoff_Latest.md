# Session Handoff Latest

## 2026-04-19 SAFE PATCH — dependencyTier FINANCE_ACCOUNTING ACCOUNTING/TAX high 승격

### 이번 라운드 조사 목적
- FINANCE_ACCOUNTING 계열 직무의 dependencyTier 미등록으로 인해 accounting/finance 전공 직접 매칭 시 +1 보너스가 누락되는 문제 해소
- 조사 대상: FINANCE_ACCOUNTING 대분류 전체 8개 직무

### exact job ID 조사 결과
- 조사된 FINANCE_ACCOUNTING canonical job IDs (전체):
  - JOB_FINANCE_ACCOUNTING_ACCOUNTING (회계)
  - JOB_FINANCE_ACCOUNTING_TAX (세무)
  - JOB_FINANCE_ACCOUNTING_FINANCE (재무)
  - JOB_FINANCE_ACCOUNTING_TREASURY (자금)
  - JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING (관리회계)
  - JOB_FINANCE_ACCOUNTING_FP_AND_A (재무기획·FP&A)
  - JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE (IR/공시)
  - JOB_FINANCE_ACCOUNTING_INTERNAL_CONTROL (내부통제)
- 조사 전 등록 상태: 전체 8개 미등록 → DEFAULT medium fallback

### high 승격 후보 및 판정
- JOB_FINANCE_ACCOUNTING_ACCOUNTING → **high** (승격 완료)
  - 이유: 회계학/세무회계 전공이 direct major일 때 직무 수행 기반 직결. 전공 의존도 가장 선명.
- JOB_FINANCE_ACCOUNTING_TAX → **high** (승격 완료)
  - 이유: 세무회계 전공과 세무 신고·리스크 직무 연결이 선명. 세무사 등 전문 자격과도 연동.
- JOB_FINANCE_ACCOUNTING_FINANCE → **medium 유지** (넓은 재무 기획성 직무, 전공 의존도 중간)
- JOB_FINANCE_ACCOUNTING_TREASURY → **medium 유지** (운영성 직무, 실무 경험 중심)
- JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING → **medium 유지** (회계+경영 복합)
- JOB_FINANCE_ACCOUNTING_FP_AND_A → **medium 유지** (다양한 전공 진입 가능한 기획성 직무)
- JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE → **medium 유지** (복합 역량 직무)
- JOB_FINANCE_ACCOUNTING_INTERNAL_CONTROL → **medium 유지** (감사/리스크/프로세스 복합)

### 패치 여부
- SAFE PATCH 실행 완료
- 수정 파일: src/data/transitionLite/jobMajorDependencyRegistry.js
- 변경 내용: JOB_FINANCE_ACCOUNTING_ACCOUNTING, JOB_FINANCE_ACCOUNTING_TAX high 등록 추가

### 다음 액션 (완료)
- 1순위: ✅ 검증 케이스 QA 완료 — TSQ-RND-20260419-AXIS1-QA-AND-EXCEPTION-AUDIT 참조
- 2순위: ✅ 경영학→회계 패널티 납득성 확인 — "weak" 오류 수정됨, 실제 prior=adjacent, 패널티 없음
- 3순위: 보류 (별도 라운드 지시 없음)

---

## 2026-04-19 SAFE PATCH — POLICY_RESEARCH high 승격 + RESEARCH_PROFESSIONAL 구조 분리 완료

### 이번 라운드 조사 목적
- POLICY_RESEARCH 단독 HIGH 후보 적합성 검증
- RESEARCH_PROFESSIONAL 나머지 7개 직무의 미승격 원인을 구조적으로 분리

### POLICY_RESEARCH 결과
- **canonical job ID**: `JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH`
- **패치 완료**: medium(DEFAULT) → **high**
- **근거**: PUBLIC_POLICY(공공정책/행정학) base=3(direct). HIGH 승격 시 PUBLIC_POLICY→정책연구 +1(score=5) 의도 그대로 작동. adjacent 전공들 score=3 유지, 왜곡 없음.

### RESEARCH_PROFESSIONAL 구조 분리 결과
- **분류 A (dependencyTier로 해결)**: POLICY_RESEARCH — 이번 라운드 완료
- **분류 B (major category 부재)**: TECHNICAL_RESEARCH, LEGAL, REGULATORY_AFFAIRS, PATENT_INTELLECTUAL_PROPERTY
  - 이공계 세부전공(화학/생물/재료), 법학(LAW), 약학(PHARMACY) MAJOR category 없음
  - dependencyTier 패치로 해결 불가 — major category 확장 + base matrix 보정 라운드 필요
- **분류 C (경험 중심, HIGH 부적절)**: MARKET_INDUSTRY_RESEARCH, EXPERT_REVIEW_EVALUATION, CONSULTING
  - 전공 풀 넓음, 경험/스킬 중심 직무 — 수정 불필요

### 현재 HIGH tier 등록 직무 전체 (8개)
- JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT
- JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN
- JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN
- JOB_FINANCE_ACCOUNTING_ACCOUNTING
- JOB_FINANCE_ACCOUNTING_TAX
- JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING
- JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING
- **JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH** (신규)

### 다음 라운드 후보
- RESEARCH_PROFESSIONAL 분류 B 직무들: LAW/PHARMACY/이공계 세부전공 MAJOR category 추가 시 LEGAL/RA/TECHNICAL_RESEARCH HIGH 기반 마련 (별도 대형 라운드)
- MANUFACTURING QC/QA HIGH 재검토 (경험 중심 여부 재평가 필요 시)
- BASE matrix 이공계 세분화 검토 (RESEARCH_PROFESSIONAL 이공계 base 2→3 필요 직무 존재 시)

## 2026-04-19 SAFE PATCH — MANUFACTURING dependencyTier PROCESS/PRODUCTION_ENGINEERING high 승격

### 이번 라운드 조사 목적
- RESEARCH_PROFESSIONAL / MANUFACTURING_QUALITY_PRODUCTION 계열 HIGH 후보 존재 여부 확인

### RESEARCH_PROFESSIONAL 조사 결과
- 8개 직무 전체 조사
- **HIGH 후보 없음**: RESEARCH_PROFESSIONAL base matrix에서 이공계 전공 전체 adjacent(2), direct(3)는 PUBLIC_POLICY 하나뿐
- HIGH 승격 시 의도된 이공계 보너스 없이 공공정책 전공만 +1이 되는 구조
- 법학/약학 전공 MAJOR category 미존재 → LEGAL/REGULATORY_AFFAIRS HIGH 근거 없음
- 이번 라운드 패치 없음. POLICY_RESEARCH 단독 HIGH는 별도 라운드 검토 대상.

### MANUFACTURING_QUALITY_PRODUCTION 조사 결과
- 8개 직무 전체 조사
- **HIGH 승격 완료 (2개)**:
  - `JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING` (공정기술): medium → **high**
  - `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING` (생산기술): medium → **high**
- 근거: 산업공학(IE) base=3(direct) → +1 보너스 타당, 비이공계 weak/mismatch -1 납득 가능
- 보류(6개): QUALITY_CONTROL, QUALITY_ASSURANCE_QA, EQUIPMENT_MAINTENANCE, PRODUCTION_MANAGEMENT, MANUFACTURING_INNOVATION, ENVIRONMENT_HEALTH_SAFETY

### 패치 파일
- `src/data/transitionLite/jobMajorDependencyRegistry.js`

### 현재 HIGH tier 등록 직무 전체 (7개)
- JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT
- JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN
- JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN
- JOB_FINANCE_ACCOUNTING_ACCOUNTING
- JOB_FINANCE_ACCOUNTING_TAX
- **JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING** (신규)
- **JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING** (신규)

### 다음 라운드 후보
- RESEARCH_PROFESSIONAL_POLICY_RESEARCH HIGH 검토 (PUBLIC_POLICY base=3 구조 재확인 후)
- MANUFACTURING QC/QA HIGH 재검토 (경험 중심 여부 재평가 필요 시)
- 법학/약학 전공 MAJOR category 추가 검토 (LEGAL/RA HIGH 기반 조건)

## 2026-04-19 QA ROUND — Axis1 예외 보정 전체 검증 완료

### 이번 라운드 성과
- 15-케이스 QA 표 작성 및 검증 (모든 케이스 PASS)
- 핵심 검증: ACCOUNTING_TAX→ACCOUNTING/TAX score=5 (high+direct+1) ✓
- 오류 발견 및 수정: 기존 BUSINESS_ADMIN→ACCOUNTING "weak" → 실제 "adjacent", 패널티 없음
- Axis1 exception/override 15항목 전체 목록화 완료
- 설명문(consumer) 7개 branch 내부 용어 미노출 확인

### 현재 Axis1 상태 요약
- dependencyTier HIGH 등록: SOFTWARE_DEVELOPMENT, MECHANICAL_DESIGN, CIRCUIT_DESIGN, **ACCOUNTING**, **TAX** (5개)
- exception adjustments 활성: CS/SW→BUSINESS, BUSINESS_ADMIN→IT_DATA, ECONOMICS/FINANCE→SALES (5종)
- override 활성: CS/SW 세부 개발 직무 7종 (+1, base2→3), 기타 no-op 마킹 다수
- 복수전공 처리: dead code 경로, weak(1) fallback, UI 미완성 → 동결

### 다음 액션 후보
- RESEARCH_PROFESSIONAL, MANUFACTURING_QUALITY_PRODUCTION 계열 high 후보 별도 라운드 (저우선순위)
- 복수전공 UI 기능 추가 시 resolveNewgradAxis1MajorPriorBest() 활성화 필요
- MEDIA override 실효성 검토 (MARKETING base 확인 후)

## 2026-04-16 SAFE DOC UPDATE - newgrad Axis 1 major-centric scoring handoff

### Current Status
- 신입 축1 `전공과 직무의 연결성`은 현재 `scoreJobFit()`에서 전공 prior를 base score의 1차 owner로 읽는 구조다.
- project / internship role evidence는 제거되지 않았지만, base score를 직접 결정하는 owner가 아니라 signal export / overlap guard / explanation 보조 근거로 남아 있다.
- 전공 prior는 `resolveNewgradAxis1MajorPrior()`가 계산하며, `direct | adjacent | weak | mismatch` label은 `toPriorLabel()` 임계값(`3/2/1/0`)으로 고정된다.
- 현재 prior 판정 구조는 전공 대분류 22 x 직무 대분류 14 base matrix(0~3) + 세부직군 override(+1) + 제한적 exception adjustment(+1) 구조다.

### What Changed This Round
- high-frequency 과소평가 조합을 위해 majorCategory-level exception adjustment 레이어가 추가됐다.
- 대표 보정 조합은 다음 다섯 가지로 확인됐다.
  - `COMPUTER_SCIENCE -> BUSINESS`: `weak -> adjacent`
  - `SOFTWARE -> BUSINESS`: `weak -> adjacent`
  - `BUSINESS_ADMIN -> IT_DATA_DIGITAL`: `weak -> adjacent`
  - `ECONOMICS -> SALES`: `weak -> adjacent`
  - `FINANCE -> SALES`: `weak -> adjacent`
- `override`와 `exceptionAdjustment`가 동시에 존재하더라도 `boost = Math.max(override, exceptionAdjustment)`로 처리해 2단계 과보정이 나지 않도록 누적 차단이 들어갔다.
- 반환 payload는 `exceptionAdjustment`, `resolutionMode`, `matchedBy`, `selectedMajorKey`, `comparedMajorKeys`까지 포함하도록 확장되어 explanation과 후속 QA가 prior 계산 근거를 직접 읽을 수 있게 됐다.
- explanation producer는 `unknown_major_fallback`, `major_override_applied`, `major_exception_adjusted`, `major_double_selected` signal을 읽어 축1 문구에 반영할 수 있게 됐다.

### Why It Changed
- 기존 구조는 project / internship role evidence가 축1 체감에 너무 강하게 읽혀, 축1과 축3 경계가 흐려질 위험이 있었다.
- 이번 라운드의 목적은 축1을 전공 중심으로 다시 잠그되, 이미 explicit하게 확인된 under-score 조합만 adjacent 쪽으로 구제하는 것이었다.
- base matrix 전체 재작성이나 direct 확대는 회귀 위험이 커서 열지 않았고, 설명 가능성이 높은 예외 보정층만 추가했다.

### Remaining Risks
- `dependencyTier` 분류 자체는 이번 라운드에서 재분류하지 않았다. 현재 최우선 후속 작업은 dependencyTier 재분류다.
- 복수전공은 `resolveNewgradAxis1MajorPriorBest()` 인프라가 있으나, active callsite와 실제 payload / UI 계약이 아직 single-major 기준이라 다음 라운드 재확인이 필요하다.
- 미등록전공은 여전히 weak fallback을 유지하므로 점수는 보수적이다. 이번 라운드에서 추가된 것은 score 상향이 아니라 explanation signal(`unknown_major_fallback`)이다.

### Next Priority
- 1순위: `jobMajorDependencyRegistry` / `dependencyTier` 재분류
- 2순위: 복수전공 payload/UI 연결 여부 확인
- 3순위: 대표 케이스 fixture formalization과 후속 QA 케이스 잠금

### Guardrails
- base matrix 전체 재작성 금지
- `toPriorLabel()` 임계값 변경 금지
- direct 남발 금지
- adjacent 구제 중심 유지
- 축1=전공 / 축3=경험 분리 유지
- explanation signal은 score 근거 번역용으로만 확장하고, UI나 explanation에서 독자 판정을 추가하지 말 것

### Key Files
- score owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreJobFit()`
- prior owner: `src/data/transitionLite/newgradAxis1MajorPriorRegistry.js > resolveNewgradAxis1MajorPrior()`
- dependency owner: `src/data/transitionLite/jobMajorDependencyRegistry.js > getJobMajorDependencyProfile()`
- explanation owner: `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradJobFitExplanation()`
- input/UI consumer: `src/components/input/NewgradTransitionLiteInput.jsx`, `src/components/report/TransitionLiteResult.jsx`

## 2026-04-19 SAFE INVESTIGATION — 축1 운영 원칙 잠금 + A/B/C 분류표 완성

### 이번 라운드 성격
코드 패치 없음. 조사/정리/문서화 라운드.
목적: 판단 기준을 잠그고, 다음 라운드에서 무엇을 패치할 수 있고 무엇을 건드리면 안 되는지 지도화.

### 코드 owner 확인 (실제 코드 기준)

| Owner | 파일 | Anchor | 상태 |
|---|---|---|---|
| 축1 점수/밴드 | buildNewgradAxisPack.js | scoreJobFit() L892 + _applyJobMajorDependencyToJobFit() L485 | LIVE |
| major prior | newgradAxis1MajorPriorRegistry.js | resolveNewgradAxis1MajorPrior() | LIVE |
| dependencyTier | jobMajorDependencyRegistry.js | getJobMajorDependencyProfile() | LIVE (HIGH 8개) |
| exception/override | newgradAxis1MajorPriorRegistry.js | L365 exceptionAdjustment + Math.max 스태킹 차단 | LIVE |
| explanation signal | axisExplanationRegistry.js | buildNewgradJobFitExplanation() L972 | LIVE |
| report consumer | TransitionLiteResult.jsx | 축1 band 렌더 | LIVE |
| 복수전공 resolver | newgradAxis1MajorPriorRegistry.js | resolveNewgradAxis1MajorPriorBest() L396 | DEAD CODE |

### explanation signal 생산/소비 경로
- exceptionAdjustment → newgradAxis1MajorPriorRegistry.js:365 생산 → buildNewgradAxisPack.js:2898 전달
- resolutionMode → newgradAxis1MajorPriorRegistry.js:370 생산 → axisExplanationRegistry.js:1020 소비 (unknown_major_fallback branch)
- matchedBy → newgradAxis1MajorPriorRegistry.js:371 생산 → axisExplanationRegistry.js:1027 소비 (override branch)
- resolutionMode="double_major" → axisExplanationRegistry.js:1014 소비 경로 존재하나 현재 도달 불가 (dead code 경로에서만 생성됨)

### A/B/C 분류 결과 요약
- **A (tier 해결 — 완료)**: ACCOUNTING, TAX, PROCESS_ENGINEERING, PRODUCTION_ENGINEERING, POLICY_RESEARCH, SOFTWARE_DEVELOPMENT, MECHANICAL_DESIGN, CIRCUIT_DESIGN (8개)
- **B (구조 문제)**: TECHNICAL_RESEARCH, LEGAL, REGULATORY_AFFAIRS, PATENT_IP, EHS (5개)
  - 공통 원인: direct major category 미등록 (LAW/PHARMACY/이공계 세분류)
- **C (경험 중심, HIGH 부적절)**: QC, QA, EQUIPMENT_MAINTENANCE, MARKET_INDUSTRY_RESEARCH, EXPERT_REVIEW_EVALUATION, CONSULTING (6개)
- **추가 조사 필요**: PRODUCTION_MANAGEMENT, MANUFACTURING_INNOVATION, MEDIA override 대상 직무 (3개)

### 복수전공 상태 (최종 확인)
- UI: secondMajor 입력 없음
- payload: secondMajor 키 없음
- resolver: resolveNewgradAxis1MajorPriorBest() L396 — DEAD CODE (active callsite 없음)
- scorer: DOUBLE_MAJOR → ALL_WEAK_PRIOR_MAP → weak(1) fallback
- explanation: double_major branch 존재하나 도달 불가
- **결론: 미완성/비지원 상태. "부분 지원"으로 표현 금지.**

### 구조 라운드 안건 (B유형)
1. LAW category 추가 → LEGAL, PATENT_IP high 기반 마련
2. PHARMACY category 추가 → REGULATORY_AFFAIRS
3. 이공계 세분류 major category → TECHNICAL_RESEARCH, EHS
4. RESEARCH_PROFESSIONAL base matrix 보정 → 이공계 세분류 선행 후 연동
5. MEDIA override 실효성 점검 → MARKETING base 확인 필요
6. 복수전공 정책 결정 → UI/payload/resolver 전 계층 연결 필요, 현재 동결

### 다음 라운드 권장 순서
- **다음 A유형 라운드**: PRODUCTION_MANAGEMENT, MANUFACTURING_INNOVATION 추가 조사 (A/B/C 분류 확정)
- **이후 구조 라운드**: LAW+PHARMACY category 추가 (우선순위 중), 이공계 세분류 (우선순위 높음)
- **복수전공**: 기능 요청 있을 때까지 동결 유지

### 축1 운영 원칙 (잠금)
1. 축1 = 전공-직무 연결성 축
2. 프로젝트/인턴/경험 양질/지속성 = 축3 담당
3. 경험 자산 때문에 축1이 올라가면 안 됨
4. 완벽한 매핑보다 설명 가능한 일관성과 고빈도 오판 최소화 우선
5. major prior / exception / override / dependencyTier / explanation signal까지만 축1 보정 허용
6. 이 범위 초과 문제 = 구조 라운드(B유형)로 분리
7. 경험 중심 직무에 HIGH 남발로 축1 경험 축 오염 금지
8. 복수전공은 미완성/비지원 상태 — "부분 지원"처럼 표현 금지

## 2026-04-06 patch round 1 - 신입 리포트 핵심 보강 포인트 + 강점 연결 근거

### Completed
- `buildNewgradTransitionLiteResult.js`: buildTopRepairSignals / buildStrengthEvidenceRead helper 추가, makeEmptyVm 기본값 확장, return에 두 필드 추가
- `TransitionLiteResult.jsx`: 두 신설 섹션 render 추가 (5축 레이더 앞), 기존 strengths 섹션 중복 방지 guard, openSections 기본 열림 확장
- scorer 변경 없음, experienced path 영향 없음

### 다음 판단 포인트
- 먼저 검증될 포인트 섹션 (소형 helper 필요)
- whyThisRead 구조화 여부

---

## 2026-04-06 investigation lock - newgrad 리포트 surface 조사

### 조사 목적
신입 리포트 surface 빈약 원인 분석 및 저비용 고효율 확장 후보 탐색. 코드 변경 없이 조사만 수행.

### 핵심 판단 (확정)
- dead UI path 3개: `coursework`, `extracurriculars` (UI에서 전달 안 함), `domainInterestEvidence` (하드코딩 `[]`)
- topRisks/validationReadBlock/buyingMotionPanel이 항상 empty/null
- `!isNewgradReport` 게이트로 transitionReadBlock 완전 차단
- explanation.gaps[], matchedStrengthLabels[], majorImpactSummary 등 이미 계산된 풍부한 signal이 expanded detail 안에만 묻혀 있음

### 1차 추천 surface 후보 (판단)
1. 핵심 보강 포인트 (무엔진 A) - explanation.gaps[] aggregation
2. 강점 연결 근거 (무엔진 A) - matchedStrengthLabels[] 분리 노출
3. 먼저 검증될 포인트 (소형 엔진 B) - targetJobRead.bullets + 낮은 band 축 크로스링크

### 다음 라운드 설계 쟁점
- 핵심 보강 포인트 섹션의 topRisks 재사용 vs 신설 render 결정
- matchedStrengthLabels를 vm top-level로 올릴지, axisPack에서 직접 읽을지 결정
- 먼저 검증될 포인트 assembly helper 설계 (job bullets generic 과장 방지 caveat 구조)

---

## 2026-04-06 investigation lock - newgrad 실전 경험 input audit

### 조사 목적
- 신입 분석의 실전 경험 입력 `프로젝트 / 인턴·현장실습 / 계약직·단기 실무`가 어디서 렌더되고 어떤 key로 submit/normalize/score/explanation/render까지 이어지는지 닫는 라운드였다.

### true owner 요약
- UI/state/payload owner: `src/components/input/NewgradTransitionLiteInput.jsx`
- submit owner: `src/App.jsx > handleSubmitTransitionLite()`
- normalize/result owner: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- score owner: `src/lib/analysis/buildNewgradAxisPack.js`
- explanation owner: `src/data/transitionLite/axisExplanationRegistry.js`
- render consumer: `src/components/report/TransitionLiteResult.jsx`

### input contract 요약
- 프로젝트
  - state key: `uiState.projects`
  - payload key: `projects`
  - row shape: `{ type, role, outcomeLevel, summary: "" }`
- 인턴 / 현장실습
  - state key: `uiState.internships`
  - payload key: `internships`
  - row shape: `{ type, roleFamily, stakeholderType, duration, summary: "" }`
- 계약직 / 단기 실무
  - state key: `uiState.contractExperiences`
  - payload key: `contractExperiences`
  - alias key: `partTimeExperience`
  - row shape: `{ type, roleFamily, stakeholderType, duration, summary: "" }`
- normalization은 `validateNewgradTransitionLiteInput()`의 `normalizeEvidenceArray()`가 담당하며 canonical remap은 없다.

### axis impact 핵심
- Axis 1: 프로젝트 `role`, 인턴/계약직 `roleFamily` 사용
- Axis 2: 프로젝트 `type`, 인턴/계약직 `type + stakeholderType` 사용
- Axis 3: 프로젝트 `outcomeLevel`, 인턴/계약직 `duration`, 실전 경험 row count 사용
- Axis 4: 인턴/계약직 `stakeholderType`, 실전 경험 row count 사용
- Axis 5: 실전 경험 필드 direct read 없음

### taxonomy / asset 유무
- newgrad 실전 경험 전용 canonical option registry / taxonomy / mapping asset은 확인되지 않았다.
- scorer 연결은 `buildNewgradAxisPack.js` 내부 하드코딩 map / Set / 문자열 exact match 중심이다.
- Axis 1 전공 prior용 `newgradAxis1MajorPriorRegistry.js`는 존재하나 실전 경험 taxonomy는 아니다.

### 다음 라운드 설계 쟁점
- 프로젝트 유형 taxonomy 부재
- role / roleFamily canonical mapping 부재
- stakeholder taxonomy 부재
- duration / outcome contract 부재
- Axis 2가 weak heuristic 중심
- 계약직과 인턴의 Axis 2 runtime 처리 분리도 낮음

## 2026-04-06 design draft - newgrad strengths / workStyle taxonomy SSOT

### Confirmed for next patch planning
- `strengths` / `workStyleNotes`? ?? runtime live input??? ?? registry? ??.
- `strengths`? Axis 5 direct ??, `workStyle`? Axis 5 direct + Axis 4 ??? direct ??? ???? ??? ? ??? ??.
- Axis 4? ?? `workStyleNotes` presence/count ??? ???? ?? ??? ????.

### Next judgment point
- ?? ?? ?? `strengths` / `workStyle` canonical key registry? ?? ???, ? ? normalization ? scorer ?? ??? ?? ?? ????.


## 2026-04-05 audit - newgrad strengths / workStyle runtime trace

### Confirmed
- 신입 입력 UI owner는 `src/components/input/NewgradTransitionLiteInput.jsx`다.
- UI state는 `strengthsSelected`, `workStyleSelected`로 저장되고 submit payload는 `strengths` 배열, `workStyleNotes` 문자열로 전달된다.
- runtime 분석 owner는 `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`와 `src/lib/analysis/buildNewgradAxisPack.js`다.
- `strengths`는 Axis 5 점수와 Axis 5 explanation에 직접 들어가고, 결과 VM의 `strengths` 섹션에도 그대로 노출된다.
- `workStyleNotes`는 Axis 4 점수/설명과 Axis 5 점수/설명에 들어간다.

### Taxonomy / Mapping Audit
- 독립된 strengths/workStyle registry 파일은 없다.
- UI 선택지는 `NewgradTransitionLiteInput.jsx` 내부 상수다.
- Axis 5 연결은 `buildNewgradAxisPack.js` 내부 `_AXIS5_TARGET_TRAITS` 하드코딩 매핑이다.
- `workStyleNotes`는 payload에서 comma-separated string으로 받고 `_splitWorkStyleNotes()`로만 분해한다.

### Judgment
- 두 입력 모두 dead input은 아니다.
- 다만 registry/ontology 기반이 아니라 내부 상수 + exact string match + count heuristic 기반이다.
- 다음 라운드 판단 포인트는 mapping 설계를 먼저 할지, taxonomy/registry SSOT를 먼저 만들지다.

## 2026-04-05 maintenance lock - PASSMAP 5-axis document maintenance rules applied

### Completed
- 5축 문서화 이후 유지보수 규칙까지 잠금 완료
- 변경 유형별 문서 세트 갱신 규칙 반영 완료

### Next
- 다음 액션 후보
- 축별 QA 문서 연결
- experienced/newgrad 5축 샘플 케이스 링크
- 추후 score patch 시 문서 동반 갱신 강제

## 2026-04-05 documentation lock - PASSMAP 5-axis write-up applied

### Completed
- 5축 owner audit 이후 문서화 반영 완료
- HQ owner map 반영
- Product guide 신규 작성
- Execution log / handoff / working memo / comm patch notes 동기화

### Guardrail
- 이번 라운드는 문서화 반영만 수행했다
- source code change 없음
- scoring patch 없음
- UI patch 없음
- 문서는 코드 mirror이며 runtime SSOT를 대체하지 않는다

### Next
- 다음 액션 후보는 문서 유지보수 규칙 잠금 또는 축별 QA 문서 연결이다

## 2026-04-05 investigation lock - PASSMAP 5-axis documentation owner audit

### Round Type
- investigation / documentation design round only
- no source logic change
- no scoring patch
- no UI patch

### Confirmed This Round
- experienced 5-axis final score owner is `src/lib/analysis/buildAxisConnectivityPack.js`
- newgrad 5-axis final score owner is `src/lib/analysis/buildNewgradAxisPack.js`
- explanation owner remains `src/data/transitionLite/axisExplanationRegistry.js`
- UI render owner remains `src/components/report/TransitionLiteResult.jsx`
- experienced Axis 3/5 must be documented with upstream `classifyTransition()` owner included
- newgrad Axis 1 must be documented with `resolveNewgradAxis1MajorPrior()` included
- newgrad Axis 2 must be documented with phase1 cert normalization / relevance bridge included

### Documentation Lock
- final Obsidian body docs are not written yet
- only storage structure proposal is locked this round
- existing notes must not be treated as runtime SSOT without code comparison

## 2026-04-05 acceptance lock - Axis 1 major prior baseline accepted

### Accepted Baseline
- Axis 1 now uses `major` as a prior.
- `major` is not the final verdict.
- `coursework`, `project role`, and `internship roleFamily` still remain the correction path.
- mismatch major is not a hard floor.
- explanation tone stayed on task-linkage language and did not borrow Axis 3 semantics.

### Accepted Implementation Shape
- base prior:
  - `major subcategory -> job majorCategory`
- override:
  - `major subcategory -> job subcategory`
- final:
  - `min(base + override, 3)`
- label:
  - `direct | adjacent | weak | mismatch`

### Acceptance Judgment
- correctness: OK on explicit mapping scope
- immediate patch: unnecessary
- current open topic: later calibration candidate only

### Later Calibration Candidate
- `direct prior alone -> mid`
- `direct prior + one aligned direct role -> mid_high`
- this is not treated as a bug in the current baseline

## 2026-04-05 lock - Axis 1 major prior QA round completed

### QA Result
- major prior base / override / final / label structure worked on the explicit mapping scope
- direct prior cases produced strong-mid (`mid_high`) when aligned role evidence was present
- direct prior alone stayed `mid`, so major did not auto-create `high`
- weak / mismatch major could still be corrected by direct role evidence

### Ceiling / Floor Review
- `majorPriorFinal = 3` currently acts as a stable starting lift to `mid`, not a high-band shortcut
- `majorPriorFinal = 0` is not a hard floor because direct role evidence still lifts to `mid_high`
- no broad tuning was applied in this QA round

### Risk Notes
- direct prior + one aligned role currently lands in `mid_high`, not `high`
- this looks calibration-related, not like a broken resolver path
- no override expansion was added beyond the explicit prompt scope

### Next
- if follow-up is needed, keep it as calibration review only
- likely next safe step: Axis 1 QA case expansion or narrow score calibration discussion

## 2026-04-05 lock - Axis 1 major prior implementation completed

### What Changed
- Axis 1 now reads `major` as a starting prior, not as a final verdict.
- implementation uses:
  - base prior by `major subcategory -> job majorCategory`
  - override by `major subcategory -> job subcategory`
  - cap rule: `min(base + override, 3)`
- coursework / project role / internship roleFamily still remain the final correction path.

### Contract Guard
- direct major prior does not auto-create high band
- weak or mismatch major prior can still be corrected by direct role evidence
- Axis 1 still excludes duration / outcome / execution depth / self-report traits

### Scope Applied
- implemented only the explicitly requested base mappings and override mappings
- intentionally did not add extra "possible" overrides outside the prompt
- no App patch
- no UI patch
- no Axis 2 / 3 / 4 / 5 redesign

### Review Lock
- direct prior examples now surface as `majorPriorFinal = 3`
- weak prior examples stay weak without role evidence
- mismatch-like major can still be overridden by strong role evidence

## 2026-04-05 lock - Axis 1 fallback narrowing patch completed

### What Changed
- Axis 1 direct role-based path was kept as-is.
- only fallback semantics were narrowed.
- count-only fallback no longer scales upward from repeated project/intern presence when task linkage is unresolved.
- Axis 1 explanation fallback copy now stays on task linkage language instead of sounding like depth / responsibility evidence.

### What Was Not Changed
- no App patch
- no Axis 2 / Axis 3 / Axis 4 / Axis 5 patch
- no UI structure change
- no broad scoring redesign

### Review Lock
- major-only case now stays low with limited-linkage summary
- internship-presence-only case reads as limited job-task linkage, not execution depth
- direct role alignment case stayed on the existing high path

### Next
- next likely follow-up: Axis 1 QA case expansion
- residual wording issue outside this patch scope may remain in some high mixed summary branches

## 2026-04-05 lock - Axis 1 include/exclude evidence boundary precheck

### Current Lock
- Axis 1 true score owner confirmed: `scoreJobFit()` in `src/lib/analysis/buildNewgradAxisPack.js`
- current call path confirmed:
  - `NewgradTransitionLiteInput.jsx` payload
  - `buildNewgradTransitionLiteResult.js` normalization
  - `buildNewgradAxisPack.js` scoring + signals
  - `axisExplanationRegistry.js` explanation
  - `TransitionLiteResult.jsx` pass-through render

### Boundary Decision Draft
- Axis 1 official meaning: `task-role linkage`
- Axis 1 retain:
  - `major`
  - `coursework`
  - `projects[].role`
  - `internships[].roleFamily`
  - `partTimeExperience[].roleFamily`
- Axis 1 exclude / avoid ownership:
  - `projects[].outcomeLevel`
  - `internships[].duration`
  - `partTimeExperience[].duration`
  - repeated activity count as depth evidence
  - responsibility / execution depth style evidence
  - `strengths`
  - `workStyleNotes`

### Conflict Summary
- highest-priority conflict remains Axis 1 vs Axis 3
- current direct score path already leans role-based, but fallback branches still use project/intern count as weak evidence
- next safe patch should tighten fallback ownership without broad redesign

### Next Entry Point
- next safe patch can stay local to:
  - `src/lib/analysis/buildNewgradAxisPack.js`
  - optionally `src/data/transitionLite/axisExplanationRegistry.js`
- no App-level or UI patch needed first

## 2026-04-05 lock - Axis 3 append-only patch completed

### Current Status
- Axis 3 (`responsibilityScope`) producer-side signal append-only upgrade completed.
- scorer-side semantic context is now exposed to the explanation builder.
- consumer / UI structure unchanged.

### New Axis 3 Signal Contract
- existing count signals preserved
- append-only fields added:
  - `evidenceGroupCount`
  - `evidenceItemCount`
  - `projectOutcomeLevel`
  - `experienceDurationLevel`
  - `comboEvidence`
  - `comboGuarded`
  - `semanticLift`
  - `evidenceStrength`

### Explanation Contract
- high-side explanation now surfaces outcome / duration / combo rationale
- mixed cases now use mixed summary tone instead of inflated strong wording
- low / very_low now keep gaps aligned with weak summary direction

### Validation Lock
- required CASE A~F replay completed against current working tree
- build passed after patch
- no Axis 1 / Axis 2 producer change

### Next Entry Point
- Axis 4 precheck can start if no extra Axis 3 micro QA is requested
- if a follow-up is needed, keep it local to `axisExplanationRegistry.js`

## Obsidian Operating Docs
- 큰 작업 전에는 관련 문서만 제한적으로 읽는다.
- 옵시디언 전체를 매번 훑지 않는다.
- `05_Execution/Decision_Log.md`
  - 중요한 작업 판단, 변경 이유, 이번 라운드에서 의도적으로 안 건드린 범위를 기록한다.
- `05_Execution/Failure_Patterns.md`
  - 반복 버그/실수/조사 낭비 패턴을 증상-원인-재발방지 기준으로 누적한다.
- `00_HQ/SSOT_Map.md`
  - true owner / producer / consumer / adapter owner를 구분해서 본다.
- 큰 작업이면 위 3개 문서 중 필요한 것만 참고하고 필요한 것만 갱신한다.
- 사소한 문구 수정이나 단순 메모 수준 작업은 무조건 업데이트하지 않는다.
- owner 판단이 확정되지 않으면 `uncertain`으로 남긴다.
- 작업 프롬프트에는 관련 문서만 지정해서 토큰 사용을 통제한다.

## 2026-04-05 newgrad Axis 2 precheck — Decision C

### Decision
Axis 2 signal richness upgrade 필요. Decision C (signal append-only).

### Signal Loss (critical)
- `majorAligned` missing → builder can't distinguish aligned vs present major
- `projectIndustrySupportCount` missing → label "산업 관련 프로젝트" is a mislabel (all projects labeled as industry-relevant)
- `internContextStrength` missing → strong vs weak intern context invisible
- `certDirectCount` missing → cert direct relevance invisible

### Critical Issue
`projectCount = normalized.projectsRaw.length` (전체 프로젝트). Label "산업 관련 프로젝트 경험이 있습니다." — mislabel. Micro hotfix 가능 (1줄).

### Next
- **Axis 2 signal append-only upgrade** (같은 2파일 방식: buildNewgradAxisPack.js + axisExplanationRegistry.js)
- micro hotfix 선행 선택 가능

---

## 2026-04-05 SAFE PATCH - NEWGRAD AXIS 1 LOCAL RENDER QA FOLLOW-UP

### Goal
- 이번 라운드는 newgrad Axis 1 explanation/render 품질 보수 패치다.
- score/band 산식이나 App-level flow는 건드리지 않고 producer-owned explanation contract만 국소 정리했다.

### Precheck
- true producer owner: `src/data/transitionLite/axisExplanationRegistry.js`의 `buildNewgradJobFitExplanation()`
- consumer owner: `src/components/report/TransitionLiteResult.jsx`는 `explanation.summary` / `explanation.positives` / `explanation.gaps`를 그대로 렌더하고, explanation이 없을 때만 `getAxisScoreNarrative()`로 fallback 한다.
- current contract:
  - `majorLinkType`: `buildNewgradAxisPack.js` 기준 `"direct" | "none"`
  - `projectBestLinkType`: `"direct" | "adjacent" | "none"`
  - `internshipLinkType`: `"direct" | "industry_only" | "none"`

### Issue Result
1. `intern_industry`
   - strength bucket 승격 없이 제한형 문장으로 `gap` 성격에 맞게 조정했다.
   - industry-only internship는 실무 환경 이해 신호로만 읽고 direct evidence로 승격하지 않았다.
2. `proj_adjacent only`
   - 현재 working tree 기준 builder에 이미 weak supportive positive + gap 분리가 들어와 있었다.
   - 이번 패치에서는 그 conservative shape를 유지하고 overclaim 없이 문서화만 추가했다.
3. `majorLinkType === "adjacent"` dead branch
   - 현재 working tree 기준 dead branch는 제거되고, normalized contract상 unreachable이라는 주석만 남아 있었다.
   - `majorLinkType` 재활성화는 근거 없이는 하지 않았다.

### Why This Is Not A Score Redesign
- Axis 1 numeric score, threshold, band meaning은 유지했다.
- 수정 범위는 explanation payload의 visible copy와 bucket 정합성만 다뤘다.

### Next
1. Axis 2 확장 검토
2. `getAxisScoreNarrative()` 제거는 보류 유지

## 2026-04-05 newgrad Axis 1 explanation micro fix — 완료

### Decision
- Axis 1 QA에서 확정된 3개 이슈 처리 완료
- `axisExplanationRegistry.js` 1파일 국소 수정

### Changes
- `intern_industry`: 강점 섹션에 "제한적입니다" 문장 제거 → clean positive
- `proj_adjacent`: positive+negative split → adjacent only 케이스 positives 공백 해소
- `majorLinkType === "adjacent"` dead branch 제거

### Status
- Axis 1: 안정. 더 이상 추가 패치 불필요.
- `primaryEvidenceSource`: `buildNewgradJobFitSummary`에서 이미 사용 중.
- scoring/band/consumer 미수정.

### Next Priority
- **Axis 2 signal richness 조사** — Axis 1과 동일 패턴 적용 가능 여부 확인 필요
- getAxisScoreNarrative 제거 보류 유지

---

## 2026-04-05 newgrad Axis 1 render QA — 국소 패치 필요 확정

### Findings
케이스 A~F 코드 추적 완료. 주요 개선 확인됨 + 잔존 이슈 3개 발견.

### Remaining Issues (후속 패치 대상)
1. `intern_industry` direction="positive": 문장은 제한형인데 강점 섹션에 표시됨
2. `proj_adjacent`만 있는 케이스: positives=[] — 사용자 프로젝트가 강점에 전혀 안 보임
3. builder `majorLinkType === "adjacent"` 분기: dead branch, 현재 도달 불가

### Patch Necessity
국소 카피/분기 패치 필요 (`axisExplanationRegistry.js` 1파일)

### Dead Payload
`primaryEvidenceSource` — signals에 있으나 builder에서 안 읽힘. 주석 처리 또는 미래 활용 표시 필요.

### Next
- newgrad Axis 1 국소 패치 (위 3개)
- 그 다음 Axis 2 확장 검토

---

## 2026-04-05 newgrad Axis 1 signal contract consistency fix

### Decision
- `buildNewgradAxisPack.js` + `axisExplanationRegistry.js` 2파일 최소 수정
- majorLinkType owner contamination 제거 + fallback dead branch 복구

### Changes
- `majorLinkType`: `_jobFitMajorRelevant ? "direct" : "none"` (전공 신호만. adjacent 없앰)
- builder fallback: `"none"` 명시 조건 추가 (projectBestLinkType / internshipLinkType)

### Owner Map 변화 없음

### Next
- newgrad Axis 1 실제 렌더 품질 점검
- Axis 2 확장 여부는 Axis 1 QA 후 판단

---

## 2026-04-05 newgrad Axis 1 signal richness append-only upgrade

### Decision
- `buildNewgradAxisPack.js` + `axisExplanationRegistry.js` 2파일
- Axis 1 signals에 contextual field 5개 append-only 추가
- explanation builder에서 새 signal 기반 context-aware label 분기 추가

### Changes
- signals.jobFit에 추가된 필드:
  - `majorLinkType`: "direct" | "adjacent" | "none"
  - `projectDirectCount`: 직접형 프로젝트 수
  - `projectBestLinkType`: "direct" | "adjacent" | "none"
  - `internshipLinkType`: "direct" | "industry_only" | "none"
  - `primaryEvidenceSource`: "major" | "project" | "internship" | "mixed" | "none"
- `buildNewgradJobFitExplanation`: presence echo → 연결 질 해석형 label로 전환 (fallback 유지)

### Owner Map 변화 없음
- score/band: `buildNewgradAxisPack.js`
- explanation builder: `axisExplanationRegistry.js`
- row/detail render: `TransitionLiteResult.jsx` (미수정)

### Next
- newgrad Axis 1 실제 렌더 품질 점검
- Axis 2 확장 여부 판단 (같은 방식 적용 가능한지)
- getAxisScoreNarrative() 제거 보류 유지

---

## 2026-04-05 experienced Axis 3/5 detail duplication fix

### Decision
- `axisExplanationRegistry.js` 1파일, experienced Axis 3/5 explanation payload duplication 제거
- summary 유지, detail label만 교체

### Changes
- Axis 3 `buildResponsibilityScopeExplanation`: shift별 positives/gaps label → 보조 근거형으로 교체
- Axis 5 `buildRoleCharacterExplanation`: `ROLE_WEIGHT_SHIFT_DETAIL` 상수 추가, reasons label에서 summary 재사용 끊음

### Owner Map 변화 없음
- score/band: `buildAxisConnectivityPack.js`
- explanation builder: `axisExplanationRegistry.js`
- row/detail render: `TransitionLiteResult.jsx`

### Next
- newgrad explanation signal richness 개선 (presence echo → context-aware label)
- getAxisScoreNarrative() 제거 보류 유지

---

## 2026-04-05 getAxisScoreNarrative 제거 조사 — 보류 확정

### Decision
- `getAxisScoreNarrative()` + `narrativeMap` 제거 보류 (실사용 경로 살아 있음)

### 조사 결과
- `axisExplanationRegistry.js` 각 builder가 `available: false`를 반환하는 조건이 다수 존재
  - experienced Axis 3: `!signals.responsibilityShift`
  - experienced Axis 5: `roleWeightShift` 없음
  - newgrad 5축 전부: `positives.length === 0 && gaps.length === 0`
- `TransitionLiteResult.jsx:1158` fallback 경로: `explanation ? explanation.summary : narrative`
- `narrative` = `getAxisScoreNarrative()` 결과 — 위 조건 hit 시 실사용됨

### 이전 기록 수정
- 이전 "newgrad 5축 모두 explanation.available=true → 제거 가능" 판단은 조건부 true임을 확인
- 실제로는 builder마다 false 반환 경로가 살아 있음 → 아직 제거 불가

### 제거 선행 조건 (다음 라운드)
1. 각 builder에서 `available: false` 케이스가 실제 사용자 화면에서 발생하는지 per-builder 검증
2. 또는: `getAxisScoreNarrative()` 없이 `tone` 직접 pass-through 또는 band-level generic 1줄로 교체

### Next
- newgrad explanation signal richness 개선이 먼저 — richness가 올라가야 `available: false` 케이스 감소
- action hint는 explanation 품질 개선 이후 단계

---

## 2026-04-05 newgrad 5축 explainability 확장

### Decision
- newgrad 5축에 producer explanation 추가 — experienced 5축과 동일 contract
- `buildNewgradAxisPack.js`: pre-compute + spread + explanation wiring 패턴
- `axisExplanationRegistry.js`: 5개 newgrad builder 추가 (Grade B — count/presence 기반)

### `getAxisScoreNarrative()` 상태 변화
- 이번 라운드로 experienced 5축 + newgrad 5축 모두 explanation.available=true
- `getAxisScoreNarrative()` 실사용 경로 소멸 → 다음 라운드 제거 가능

### Owner Map (전체 확정)
- score/band: `buildAxisConnectivityPack.js` (experienced) / `buildNewgradAxisPack.js` (newgrad)
- explanation builder: `axisExplanationRegistry.js` (experienced 5 + newgrad 5 = 10 builders)
- row 텍스트 / fallback 정책: `TransitionLiteResult.jsx`
- detail UI: `TransitionLiteResult.jsx`

### What Was NOT Changed
- 점수 계산 로직
- `getAxisScoreNarrative()` 함수 (dead code 예비, 아직 제거 안 함)
- `TransitionLiteResult.jsx` (generic consumer, 변경 불필요)

### Next
- `getAxisScoreNarrative()` + narrativeMap 제거 (안전, 실사용 경로 없음)

---

## 2026-04-05 axis row/detail 역할 분리 — narrative debt 1차 정리

### Decision
- row 문구 소스를 `getAxisScoreNarrative()` → `explanation.summary` (producer pass-through)로 교체
- detail 패널에서 `explanation.summary` 제거 → positives + gaps 근거만 표시
- "강점 신호" / "보완 포인트" 섹션 헤더 추가 (시각 위계 명확화)
- 버튼 노출 조건: `explanation.available` → `explanation && (positives.length > 0 || gaps.length > 0)`

### Role Contract (잠금)
- score/band: `buildAxisConnectivityPack.js`
- explanation.summary / positives / gaps: `axisExplanationRegistry.js` (producer)
- row 텍스트 우선순위 조율 / fallback 정책: `TransitionLiteResult.jsx`
- detail expand/collapse UI: `TransitionLiteResult.jsx`

### What Was NOT Changed
- `getAxisScoreNarrative()` 함수 자체 유지 (newgrad 축 / explanation 없는 경로 fallback)
- 점수 계산 / 레이더 / 배지
- explanation contract shape

### Next
- `getAxisScoreNarrative()` experienced 5축 항목은 이제 dead code 예비 상태
- newgrad axis explanation 확장 후 narrative 전면 제거 가능해짐

---

## 2026-04-05 전환 연결 레이더 axis 상세보기 — explainability 계약 파일럿

### Decision
- Producer-first explainability: UI가 score를 해석해 문구 만드는 패턴 제거 방향으로 계약 추가
- Pilot axis: `industryContext` (산업 맥락 연결성)
- Contract shape: `{ available, summary, positives, gaps, reasons, detailVersion }`
- 나머지 4축은 `{ available: false }` placeholder

### Owner Map (확정)
- score owner: `buildAxisConnectivityPack.js`
- explanation raw reason owner: `src/data/transitionLite/axisExplanationRegistry.js` (신규)
- user-facing copy owner: `axisExplanationRegistry.js` (producer side)
- detail toggle owner: `TransitionLiteResult.jsx`

### What Was NOT Changed
- 점수 계산 로직 전혀 건드리지 않음
- `getAxisScoreNarrative()` 유지 (하위 호환, 5축 완성 후 제거 검토)
- 기존 레이더 점수 표시 동작

### Next
- 나머지 4축 explanation 구현
- `getAxisScoreNarrative()` 제거 검토 (5축 완성 후)

## 2026-04-05 리포트 하단 CTA 섹션 액션 카드 개편 (Round 2 — owner 재확인)

### Failure Root Cause (Round 1)
- Round 1에서 `src/App.jsx:10456` IIFE를 true owner로 판정했으나, 이는 experienced-only dead/parallel branch였음
- 실제 사용자 화면은 `TransitionLiteResult.jsx`를 통해 렌더됨 (transition-lite 경로)
- Round 1 패치는 화면에 반영되지 않은 dead code 수정이었음

### True Owner (Round 2 확정)
- `src/components/report/TransitionLiteResult.jsx:1334–1396`
- 핸들러: `onOpenTransitionLiteNextStep` / `onOpenTransitionLitePrecisePath` (onClick — href 없음)
- Card 1 (미니 컨설팅) → `onOpenTransitionLitePrecisePath`
- Card 2 (취업 컨설팅, primary) → `onOpenTransitionLiteNextStep`

### New Structure
- 섹션 헤더: 분석 결과를 실제 합격 전략으로 바꿔보세요
- Card 1 (미니 컨설팅): 배지 15분/빠른 점검, CTA "빠르게 피드백 받기"
- Card 2 (취업 컨설팅): 추천 배지, border-2, primary CTA "1:1 컨설팅 신청하기"
- 레이아웃: 모바일 1열, 데스크탑 2열 (sm:grid-cols-2)
- "이력서 등록" 블록 및 footer text 유지 (건드리지 않음)

### Principle Lock (다음 UI 패치 선행 원칙)
- "보이는 문자열 exact-search → 최종 consumer 검증 → render condition 확인" 선행 필수
- onClick handler 기반 섹션은 href 기반과 다르게 추적해야 함

### What Was NOT Changed
- scoring / analyzer / report logic
- onClick handler 시그니처
- 이력서 등록 블록 / footer text
- 상위 App state / routing 구조

## 2026-04-05 Newgrad Axis 2 Redefinition Lock

### Decision
- Newgrad Axis 2 해석을 `산업 분야 이해도`로 다시 잠근다.
- 이전 방향이었던 `산업 맥락 접점 / industry-context exposure` 중심 해석은 현재 라운드 기준 폐기한다.
- Axis 2는 새 입력을 받기보다 기존 입력에서 보수적으로 추론하는 축으로 둔다.

### Why This Changed
- 현재 newgrad 입력만으로는 "실제 산업 현장에 직접 닿아봤는가"를 강하게 증명하기 어렵다.
- 반면 기존 입력만으로도 산업 이해 신호를 제한적으로 읽는 것은 가능하다.
- 이 해석이 불필요한 Step 3 확장을 막고, Axis 1 / 2 / 3 경계를 더 현실적으로 유지한다.

### Boundary Lock
- Axis 1 = 직무/과업 유사성
- Axis 2 = 산업 분야 이해도
- Axis 3 = 실행 깊이 / 얼마나 끝까지 해봤는가
- Axis 2는 direct industry exposure proof도 아니고, role similarity도 아니고, execution depth도 아니다.

### Evidence Lock
- Axis 2는 우선 기존 입력의 다음 신호를 사용한다.
  - `major`
  - `certifications`
  - project의 target industry 관련성
  - internship type / stakeholder / industry-adjacent context
  - contract experience context where available
  - `targetIndustryId`는 비교 anchor로만 사용
- Axis 2는 다음 항목에 1차적으로 기대지 않는다.
  - role similarity only
  - duration only
  - outcome depth only

### Scoring Intent Lock
- 1 = 산업 이해 관련 신호 거의 없음
- 2 = 약한 관련 신호 1개 정도
- 3 = 약한 관련 신호 2개 이상 또는 일부 관련성 확인
- 4 = 비교적 명확한 관련 신호가 2개 이상 같은 방향으로 모임
- 5 = 전공/자격/프로젝트/인턴 등 여러 축이 반복적으로 같은 산업 이해 흐름으로 수렴
- 핵심 뉘앙스는 "이 산업 현장에 직접 닿아봤는가"가 아니라 "이 산업을 이해하고 준비해왔을 가능성이 얼마나 쌓여 있는가"다.

### Input Design Lock
- 현 시점에서는 new Step 3 field를 추가하지 않는다.
- existing inputs first 원칙으로 간다.
- 실제 scoring failure가 확인될 때만 입력 확장을 재검토한다.

### Internal Contract Lock
- internal names는 당분간 유지한다.
  - `industryContext`
  - `domainInterestEvidence`
  - `scoreDomainInterest`
- 지금은 rename보다 semantics reinterpretation이 우선이다.

### Next Patch Direction
- 다음 구현 라운드는 Axis 2 scoring/model을 `산업 분야 이해도` 기준으로 재설계해야 한다.
- direct industry exposure proof를 전제로 한 모델로 다시 돌아가지 않는다.
- future round에서 Step 3 확장을 다시 열려면 실제 실패 사례가 먼저 제시되어야 한다.

## 2026-04-04 Newgrad Axis 2 Non-Copy Alignment + Obsidian Update

### Current Axis 2 Status
- current visible Axis 2 title is `산업 연관성`
- current visible Axis 2 description is `설명 의도:전공, 프로젝트, 인턴, 대외활동 등이 목표 산업의 실제 문법과 얼마나 맞닿아 있는가`
- current visible 1~5 narrative owner is `src/components/report/TransitionLiteResult.jsx`
- current internal score owner is `src/lib/analysis/buildNewgradAxisPack.js` `scoreDomainInterest()`
- current internal axis key is still `industryContext`
- current normalized input owner is `buildNewgradAxisPack.js` and it still normalizes `domainInterestEvidence`

### Confirmed Gap Judgment
- visible copy lock was already reflected in producer label/description
- but `TransitionLiteResult.jsx` still routed newgrad Axis 2 narrative by old label `산업 분야 이해도`
- because the producer label is now `산업 연관성`, Axis 2 could fall through generic narrative routing
- Axis 2 scoring is still interest/count-oriented
  - it reads `domainInterestEvidence`, `projects`, `coursework`, `major`
  - it does not actually infer target-industry adjacency from project/internship structure
- newgrad result support wording still exposed legacy phrasing like `도메인 관심 근거`, `관심 증거`

### This Round Patch Judgment
- minimal code patch was justified
  - fix Axis 2 label-to-narrative routing in `TransitionLiteResult.jsx`
  - update stale user-facing support wording in `buildNewgradTransitionLiteResult.js`
- no scoring refactor in this round
- no payload/input expansion in this round
- internal legacy names were intentionally kept for now
  - `industryContext`
  - `domainInterestEvidence`
  - `scoreDomainInterest`

### Next Priority
1. Axis 2 scoring/input round is still needed
2. target-industry adjacency evidence path needs explicit design
3. internal renaming is deferred until scoring/input shape is settled

## 2026-04-04 Newgrad 5축 연결 조사 및 Round 1 패치

### Confirmed Owner Map

- NEWGRAD 입력 UI: `src/components/input/NewgradTransitionLiteInput.jsx`
- NEWGRAD 결과 빌드: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- 5축 팩 빌드: `src/lib/analysis/buildNewgradAxisPack.js`
- 결과 UI 렌더: `src/components/report/TransitionLiteResult.jsx`

### 현재 상태

- 5축 모두 사실상 count-only였음
- payload에서 `domainInterestEvidence`, `strengths`, `workStyleNotes`가 hardcoded 빈값
- 수집된 `stakeholderType`, `outcomeLevel`, `duration`, `roleFamily`가 scoring에 미반영

### Round 1 패치 완료

- `buildNewgradAxisPack.js` 1파일 수정
- Axis 4 (타겟 커뮤니케이션 연결성): `stakeholderType` semantic lift 추가
  - "고객 / 사용자", "외부 파트너" → base score + lift (clamped 5)
  - "내부 팀원"만 → lift 없음

### 다음 우선순위

1. Round 2: Axis 3 — `outcomeLevel`/`duration` 연결 (ChatGPT 설계 후)
2. Round 3: Axis 1 — `project.role`/`internship.roleFamily` vs targetJob 매핑
3. Round 4: Axis 5 — `strengths` UI 입력 추가
4. Round 5: Axis 2 — `domainInterestEvidence` UI 입력 추가

### Uncertainties

- Axis 1 job-task 매핑 깊이 미확정
- certifications axis 연결 의도 불명확
- extracurriculars/coursework 수집 계획 불명확

---

## 2026-04-02 Width Contract Handoff

### Current Issue Redefinition
- 현재 핵심 이슈는 `이력서 보기 / 이력서 설계 업데이트 하기` 계열 화면군의 width contract 재정렬이다.
- 처음에는 result 화면 우측 공백, input(today/weekly) 화면 캘린더 오른쪽 공백을 각개 문제처럼 봤지만, 최종적으로는 `PmMvpView` 계열 screen branch 전반의 contract 문제로 재정의했다.
- 핵심 root cause는 `App.jsx` 상위 wrapper cap(`jobSidebarView === "resume"` / `"resume-update"` 구간의 `max-w-6xl`) + `PmMvpView` branch별 width owner/max-width 혼재였다.
- result는 내부 문서폭 cap 중첩이 있었고, input은 캘린더 고정폭 문제가 아니라 상위 shell cap 영향이 더 직접적이었다.

### Judgment Shift
- 1차: 캘린더/결과 카드 개별 문제
- 2차: currentScreen별 owner 재조사 필요
- 3차: `PmMvpView` 전체 screen branch(`today`, `weekly`, `result`, `readiness`) width contract audit 필요
- 4차: App 상위 wrapper cap + branch별 width 규칙 혼재가 공통 root cause라는 결론

### Next Session Verification
- 실제 사용자 경로 기준 QA를 다시 해야 한다.
- `업무 관리 / today / weekly / result` 화면을 같은 세션에서 비교한다.
- branch별 width contract 재발 여부를 확인한다.
- 빈 aside / 상위 wrapper cap / branch 내부 max-width 중첩 재등장 여부를 확인한다.
- headless 측정값과 실제 스크린샷 체감을 분리해서 읽는다.

### Lesson
- 입력 화면 문제와 결과 화면 문제를 같은 branch 문제로 섞으면 진단이 쉽게 빗나간다.
- 현재 보는 스크린샷이 어느 branch인지, 공백 owner가 parent인지 child인지를 먼저 나눠야 한다.
- 레이아웃 QA는 실제 앱 경로에서 해야 한다.

## 이번 라운드 후속 반영

- `이력서 보기` 상단 군더더기 제거가 실제 코드 반영까지 완료되었다.
- 제거/비노출 완료 대상은 다음과 같다.
  - `이력서 보기`
  - `문서형 프리뷰`
  - 긴 설명문
  - `이력서 결과`
  - `최근 기록 기반 이력서 초안`
  - `오늘 기록 기준`
- 현재 `이력서 보기`는 `이력서 초안` 제목 + 짧은 1줄 설명 + 우측 액션 버튼 3개 + 바로 이어지는 실제 이력서 본문 구조로 정리되었다.
- 액션 버튼 라벨 변경도 반영 완료되었다.
  - `이력서 가져오기`
  - `이력서 내보내기`
  - `이력서 다운로드`
- 버튼 배치는 작은 폭에서도 자연스럽게 줄바꿈되도록 `flex-wrap` 구조를 유지한다.

### Current Truth
- `이력서 보기`는 상단 배지/설명/탭을 반복 노출하는 화면이 아니라, 제목과 최소 액션만 둔 뒤 실제 이력서 본문이 빠르게 시작되는 화면이어야 한다.
- 이 변경으로 `이력서 보기`는 상단 설명/배지/탭 화면이 아니라 실제 이력서 초안 화면 쪽으로 더 명확하게 이동했다.
- 현재 `이력서 보기`의 다음 개선 우선순위는 정보구조가 아니라, 소개/경력/성과 문장의 실무적 설득력 보강이다.

### Next Priority
- 소개 문단 다듬기
- 경력 bullet 실무형 보강
- 성과 문장 표현 개선
- 액션 버튼 라벨은 정리됐지만, `가져오기 / 내보내기 / 다운로드` 실제 동작 정의는 추후 구체화가 필요하다.

## Current Status
- JOB shell-level left rail은 해결 완료.
- centered wrapper 내부 카드형 사이드바 접근은 폐기.
- 현재 구조는 Shell-level left rail + right content.

## View Width Status
- `analysis`는 landing / entry 화면이라 현재 wide가 과하다.
- `work`는 dashboard 성격이라 현재 wide가 자연스럽다.
- `resume`은 현 상태 유지 중이다.

## Next Priority
- 다음 우선순위는 `analysis`에만 inner max-width를 재도입하는 것이다.
- `work`는 wide 유지.
- `resume`은 유지 또는 중간 폭 검토.

## 현재 상태
- JOB 레이아웃 문제는 JOB 내부 카드 배치가 아니라 Shell-level centered wrapper(`mx-auto + max-w-6xl`) 문제였다.
- centered wrapper 내부 사이드바 접근은 폐기했고, Shell-level left rail + right content 구조를 채택했다.
- `work` 화면은 월간 캘린더 + records 기반 구조로 전환 완료됐다.
- 선택 날짜 자산화 카드와 이번 달 자산 요약까지 반영된 상태다.

## 이번 라운드 핵심 판단
- JOB 내부 2열 패치만으로는 width bottleneck을 풀 수 없었고, Shell anchor를 먼저 바꿔야 했다.
- `analysis`는 entry/landing 성격, `work`는 dashboard 성격이므로 width policy를 동일하게 두지 않는다.
- `src/App.jsx` 같은 큰 orchestration 파일은 대형 레이아웃 교체보다 exact-anchor 기준 국소 패치가 안전하다.
- 국소 패치 한계가 보이면 UI 내부 조정보다 Shell/anchor 문제를 먼저 의심해야 한다.

## 다음 우선순위
- 다음 단계는 자산화 결과를 실제 반영 후보(이력서/포트폴리오)로 연결하는 것이다.
- `work`에서 reflected sentence와 강점 신호를 이번 달 반영 후보 카드로 승격할 필요가 있다.
- Notion / Google Calendar 실제 adapter 연결 전까지는 records 중심 contract와 derived summary 구조를 유지한다.

## Work Record Taxonomy Next
- PM 전용으로 박혀 있는 work record 입력 taxonomy는 공통 레이어 + 직무별 확장 레이어 구조로 분리 설계에 들어간다.
- 공통 3축은 유지한다.
  - 업무 유형
  - 협업 맥락
  - 결과/후속 메모
- job ontology는 해석용 공통 자산으로 유지하고, 입력 taxonomy는 별도 `workRecord` data layer로 분리한다.
- 현재 PM-only 하드코딩 owner는 `src/components/mvp/PmRecordInput.jsx`다.
- 현재 가장 적은 수정으로 붙일 수 있는 consumer 지점은 `src/components/mvp/PmRecordInput.jsx`와 이를 감싸는 `src/components/mvp/PmMvpView.jsx`다.
- 다음 구현 라운드에서는 `job id -> input preset registry`와 공통 taxonomy 파일을 먼저 만들고, UI 동작 변경은 그 이후에 최소 범위로 붙인다.

## 2026-04-02 PASSMAP UI/UX Decision Update

### 이번 라운드 핵심 변경
- 업무 관리 홈 요약 카드 방향은 아래 4개로 정리하는 방향이 확정됐다.
  - 오늘 기록 상태
  - 이번 주 해낸 일
  - 이번 주 만든 이력서 문장
  - 쌓이고 있는 커리어 방향
- 홈의 핵심은 시스템 메트릭 확인이 아니라, 기록이 이력서와 커리어 방향으로 이어지는 체감을 주는 것이다.
- 상단 대형 CTA 3카드는 메인 hero가 아니라 secondary quick actions로 축소/재배치하는 방향을 기준으로 삼는다.
- 사이드바는 현재 기준 직무를 persistent context로 보여주고, `홈 / 업무 관리 / 이력서 쉽게 업데이트 하기 / 해석 결과 / 연결 포인트 / 설정` 구조를 기준 IA로 삼는다.
- `[이력서 쉽게 업데이트 하기]`는 풍성한 결과 화면보다 빠른 기록 입력 화면으로 다시 정의한다.
- 기록 캘린더는 work/resume 각자 별도 시스템처럼 보이지 않도록 공용 `RecordCalendarCard` 기준으로 맞춘다.

### 폐기된 방향 / 수정된 판단
- `PmRecordInput`에서 큰 입력 블록 자체를 숨기기/복구하는 방향은 폐기했다.
- 사용자 의도는 입력 구조 제거가 아니라, 섹션 내부 chip을 더 유연하게 편집하는 것이었다.
- 최종 기준은 section hide/show가 아니라 chip editor 방식이다.
- 자유서술 textarea는 상단보다 하단이 더 적합하다. 먼저 chip 기반 단서를 고르고, 마지막에 오늘 한 일을 정리하는 흐름을 기준으로 삼는다.
- 기존 시스템 메트릭 중심 카드(`기록 수 / 반영 자산 / 보완 포인트`)는 홈 핵심 카드 방향에서 폐기한다.
- resume 화면 캘린더가 답답하게 보인 것은 공용화 실패가 아니라 density tuning 부족 문제로 기록한다.
- 섹션 제목과 내부 라벨이 같은 의미를 반복하는 방식은 무겁게 느껴지므로 중복 라벨/설명은 줄이는 방향을 기준으로 삼는다.

### 현재 기준 컴포넌트 / owner
- 홈 요약/캘린더 흐름 기준 owner: `src/components/home/HomeDashboard.jsx`
- 공용 기록 캘린더 기준 컴포넌트: `src/components/home/RecordCalendarCard.jsx`
- 이력서 쉽게 업데이트 입력 기준 owner: `src/components/mvp/PmRecordInput.jsx`
- resume 화면 캘린더 consumer: `src/components/mvp/PmMvpView.jsx`
- 사이드바 / 현재 기준 직무 / settings shell 기준 owner: `src/App.jsx`

### 구현 완료 vs 확인 대기
- 구현/빌드 완료
  - 업무 관리 홈 4개 카드 방향 확정
  - 사이드바 IA 보강
  - settings / 알림 설정 shell 추가
  - chip 삭제/추가
  - textarea 하단 이동
  - 공용 캘린더 카드 연동
  - resume 입력 화면 재정의 필요성 확정
  - build 통과
- 확인 대기
  - 브라우저 실제 클릭 UX 최종 확인
  - resume/work 화면 캘린더 체감 일관성 확인
  - 업무 관리 홈 상단 CTA 축소/재배치 최종 반영 여부 확인
  - resume 화면 compact layout 실제 반영 검토
  - 현재 기준 직무 taxonomy 2단 선택 fully wired 여부 확인

### 다음 라운드 연결 포인트
- 브라우저에서 chip 삭제/추가 실제 UX를 먼저 확인한다.
- `RecordCalendarCard`를 기준으로 work/resume 화면의 캘린더 체감 차이를 점검한다.
- 홈 상단 CTA 축소 방향은 설계 판단은 확정됐지만, 최종 UI 반영 상태는 별도 확인이 필요하다.
- 현재 기준 직무는 PASSMAP taxonomy의 대분류 / 중분류 구조로 정렬해야 하며, 기존 혼합 라벨은 장기 기준으로 유지하지 않는다.
- resume 화면은 왼쪽 빠른 입력, 오른쪽 compact 보조 캘린더 / 선택 날짜 요약 구조로 다듬는 후속 라운드가 필요하다.

## 이번 라운드 핵심 판단
- `이력서 보기`는 이력서 생성 결과 대시보드가 아니라, 실제 이력서 문서처럼 읽히는 화면이어야 한다.
- `이력서 업데이트`는 기록 입력 / 수정 / 추가 / 반영 준비를 담당하는 별도 화면이어야 한다.
- `이력서 보기`는 분석 화면이 아니라 제출물 프리뷰이고, `이력서 업데이트`는 작업 화면이다.

## 잘못 잡았던 방향과 교정
- 이전에는 `before / after 비교`, `강점 카드`, `최종 결과 카드`가 중심인 결과 대시보드형 구조를 밀었다.
- 이 방향은 이름은 `이력서 보기`인데 실제 체감은 `이력서 생성 결과 대시보드`에 가까웠다.
- 현재 판단은 위 요소들을 주인공으로 두지 않고 축소 / 보조화하는 것이다.

## 이력서 보기 / 이력서 업데이트 역할 분리
- `이력서 보기`
  - 실제 이력서 문서 프리뷰
  - 문서 제목, 액션 버튼, 바로 이어지는 본문이 중심
  - 이름 / 연락처 / 소개 / 경력 / 주요 성과 / 학력 / 보유 역량 / 기타 구조가 보여야 한다
- `이력서 업데이트`
  - 오늘 기록 / 이번 주 기록 입력
  - 수정 / 추가 / 반영 준비
  - 비교 블록이 필요하면 여기에서 보조 기능으로 다룬다

## 화면 상단 군더더기 제거 원칙
- `이력서 보기`
- `문서형 프리뷰`
- 긴 설명문
- `이력서 결과`
- `최근 기록 기반 이력서 초안`
- `오늘 기록 기준`
- 위 반복 요소들은 상단에서 힘을 주지 않는다.
- 상단은 문서 제목, 우측 액션 버튼, 바로 이어지는 실제 이력서 본문 정도로 단순화한다.

## 액션 버튼 라벨 변경
- `복사/저장 준비` -> `이력서 가져오기`
- `이력서 업데이트` -> `이력서 내보내기`
- 신규 액션 -> `이력서 다운로드`
- 내부 작업 느낌보다 사용자 기준 액션 라벨을 우선한다.

## 다음 실행 우선순위
1. `이력서 보기` 상단 군더더기 제거
2. 액션 버튼을 `이력서 가져오기 / 이력서 내보내기 / 이력서 다운로드`로 정리
3. 이력서 본문 구조는 유지하되 소개 / 경력 bullet / 성과 문장을 실무형으로 더 다듬기

## 2026-04-03 Transition 5-Axis Radar Redesign Lock

### 이번 라운드 핵심 판단
- PASSMAP 전환 분석 5축 레이더 이슈는 copy tuning 문제가 아니라 scoring redesign 성격이 강하다.
- 현재 5축은 같은 종류의 축이 아니다.
  - 직무 ontology 거리
  - 산업 registry 거리
  - responsibility profile rank 차이
  - customerMarket 타입 차이
  - role weight profile 이동
- 그래서 사용자 피드백인 "축 의미가 직관적으로 안 와닿고 설명하기 어렵다"는 단순 설명 부족이 아니라 엔진 contract와 visible naming 사이 간극에서 나온 것으로 본다.
- 이번 round의 공식 원칙은 consumer copy보다 producer contract를 먼저 재정의하는 것이다.

### 현재 엔진 정의 요약
- 1축 `직무 구조 연결성`
  - 현재 엔진은 현재/목표 job ontology의 `jobDistance`, family adjacency, shared family를 점수화한다.
  - 즉 핵심 업무 유사성이라기보다 직무 taxonomy 거리 축이다.
- 2축 `산업 맥락 연결성`
  - 현재 엔진은 industry registry의 `industryDistance`, `sameSector`, `sameSubSector`를 점수화한다.
  - adjacent 판정에는 `customerMarket`, `valueChainPosition`, `coreContext`, `jobInteractionHints` 토큰 overlap이 쓰인다.
- 3축 `역할 범위 연결성`
  - 현재 엔진은 `JOB_RESPONSIBILITY_PROFILE_MAP` 기반 rank 차이를 `similar / slightly_up / meaningfully_up / down_or_narrower`로 점수화한다.
- 4축 `고객 유형 연결성`
  - 현재 엔진은 industry `customerMarket` flip 여부와 sameSector 보정만 사용한다.
  - 실제 buyer/stakeholder/decision complexity는 현재 producer 점수에 들어가지 않는다.
- 5축 `직무 성격 연결성`
  - 현재 엔진은 `JOB_ROLE_WEIGHT_PROFILE_MAP` 기반 `strategy/execution/operator/coordinator` 이동만 점수화한다.
  - 일하는 방식 전반보다는 역할 weight 이동 축에 가깝다.

### 목표 정의 방향
- 1축 목표: 핵심 업무 유사성
  - ontology distance보다 `strongSignals`, `mediumSignals`, `responsibilityHints`, role summary, output/task 문장 overlap 중심으로 재정의한다.
- 2축 목표: 산업 배경 유사성
  - 현재 industry registry 거리 구조를 유지하되 `coreContext`, `valueChainPosition`, `jobInteractionHints`, `decisionStructure` 해석력을 더 분명히 쓴다.
- 3축 목표: 책임 수준/범위 유사성
  - 현재 responsibility profile rank 구조를 기본 재사용 후보로 본다.
- 4축 목표: 상대 고객 유사성
  - `customerMarket` 단일 축을 넘어서 stakeholder/buying/decision proxy까지 포함하는 고객 구조 축으로 확장한다.
- 5축 목표: 일하는 방식/역할 성향 유사성
  - role weight 단일 축보다 mission/output/stakeholder/metric/horizon 메타와 job summary/hints를 포함하는 방식으로 확장한다.

### 공식 실행 플로우
- Phase A. 정의 고정
  - 축별로 `무엇을 측정하는가 / 무엇을 측정하지 않는가 / 어떤 signal을 쓸 것인가 / 1~5점 상태 정의`를 먼저 잠근다.
- Phase B. 현재 엔진과 차이 조사
  - owner map, signal, score 함수, bucket/band, fallback을 코드 기준으로 고정한다.
- Phase C. 새 점수 체계 설계 입력 확보
  - 기존 자산으로 재사용 가능한 signal, 자산 부족 지점, 축별 재설계 난이도와 우선순위를 정리한다.
- Phase D. 패치 라운드 준비
  - 1축부터 시작한다.
  - `1축 signal 설계 -> scoreAxis1 설계 -> band 검토 -> QA`
  - 이후 `4축 -> 5축 -> 2축 -> 3축` 순으로 진행한다.

### 축별 우선순위
- 1순위: 1축 `직무 구조 연결성`
  - 현재 의미와 사용자 기대 차이가 가장 크다.
  - 현재는 ontology distance 중심이지만 목표는 핵심 업무 유사성이다.
- 2순위: 4축 `고객 유형 연결성`
  - 현재는 customerMarket flip 중심이라 고객 구조를 지나치게 좁게 읽는다.
- 3순위: 5축 `직무 성격 연결성`
  - 현재는 role weight 중심인데 목표는 일하는 방식/역할 성향이다.
- 4순위: 2축 `산업 맥락 연결성`
  - 현재 구조가 완전히 틀린 것은 아니지만 더 정교한 signal 사용이 가능하다.
- 5순위: 3축 `역할 범위 연결성`
  - 현재 정의와 엔진이 가장 잘 맞는 축이다.

### 패치 금지 원칙
- 문구를 먼저 바꾸지 않는다.
- 5축을 한 번에 수정하지 않는다.
- 1축만 먼저 설계/조사/패치/QA 한다.
- `src/lib/analysis/buildAxisConnectivityPack.js` producer를 중심으로 접근한다.
- consumer보다 producer 먼저 본다.
- raw score뿐 아니라 band/bucket까지 함께 검토한다.

### 1축 contract lock 상태
- 1축 draft contract는 `핵심 업무 유사성` 기준으로 더 좁혔다.
- 현재 잠정 기준은 아래와 같다.
  - primary: `strongSignals`, `responsibilityHints`
  - secondary: `mediumSignals`, `missionType`, `outputType`
  - modifier only: `jobDistance`, `familyDistance`, `sharedFamiliesCount`
  - evidence-only: `summaryTemplate`, `levelHints`, `boundarySignals`
- 이 판단은 아직 patch가 아니라 contract lock 단계다.

### 4축 contract lock 상태
- 4축 draft contract는 `customerMarket flip` 단일 축이 아니라 `상대 고객 / 이해관계자 / buying / decision 구조 유사성` 축으로 잠정 확장한다.
- 현재 잠정 기준은 아래와 같다.
  - primary: `customerMarket`
  - secondary: `buyingMotion`, `decisionStructure`
  - evidence-only: `stakeholderPrimary`, `customerStructure`, `jobInteractionHints`, `coreContext`
- 이유:
  - `customerMarket`는 현재도 producer가 쓰는 가장 정규화된 source다.
  - `buyingMotion`은 구조 비교가 가능하지만 범위가 더 좁아 secondary가 적절하다.
  - `decisionStructure`와 `stakeholderPrimary`는 설명력은 높지만 heuristic/job-meta 성격이 강해 co-primary로 올리기 위험하다.
- 이 판단도 아직 patch가 아니라 contract lock 단계다.

## 2026-04-03 Axis 4 Calibration Memo Lock

### Lock Summary
- Axis 4는 1차 운영 가능하다.
- 재설계 필요는 없다.
- 다음 단계는 `Axis 4 calibration memo 잠금 -> safe patch 여부 결정`이다.

### Locked Calibration Priorities
- `customerMarket broad_group_match` 재검토 필요
  - 특히 `B2B`와 `B2G`를 같은 broad 묶음으로 허용하는 범위는 다시 잠가야 한다.
- `MIXED exact` / `MIXED partial` 간격 확대 검토 필요
  - 현재는 mixed 계열이 다소 후하게 남는 경향이 있다.
- `buyingMotion`은 secondary 유지
- `decisionStructure`는 weak secondary 유지

### Reconfirmed Exclusions
- `sameSector` direct scoring 재도입 금지
- `industryDistance` direct scoring 재도입 금지
- `stakeholderPrimary` modifier 제안 금지

### Next Safe Patch Question
- `exact > broad` 간격을 어느 수준까지 벌릴지
- `B2B ~ B2G broad`를 유지할지 축소할지
- `MIXED exact`와 `MIXED partial`의 raw 간격을 얼마나 벌릴지

## 2026-04-03 Axis 5 Calibration Memo Lock

### Lock Summary
- Axis 5는 재설계 필요가 없다.
- Axis 5는 roleWeightShift 중심 축으로 유지한다.
- missionType / successMetricType / horizonType structured meta 보강을 유지한다.
- outputType은 weak secondary로 유지한다.
- forbidden signal 재유입 금지를 다시 잠근다.

### Locked Calibration Priorities
- `similar` 구간은 high 후보로 읽히는 구조를 유지한다.
  - 다만 meta가 대부분 달라도 무조건 high로 고정되는지는 후속 검토 포인트로 남긴다.
- `operator_to_coordinator` / `coordinator_to_operator`는 현재 `52~61` 수준이면 방향이 적절하므로 유지 우선이다.
- `strategy_to_execution` / `execution_to_strategy`는 현재 `30~36` 수준이면 의도 범위 내이므로 low~mid ceiling 유지 원칙을 확인한다.
- `outputType`은 weak secondary 유지
  - 1축 overlap 위험 때문에 영향 확대 금지

### Reconfirmed Exclusions
- 아래 신호들의 Axis 5 raw scoring 재유입 금지
  - `stakeholderPrimary`
  - `customerMarket`
  - `buyingMotion`
  - `decisionStructure`
  - `responsibilityHints`
  - `strongSignals`
  - `mediumSignals`
  - `levelHints`
  - `industryDistance`
  - `sameSector`

### Next Safe Patch Questions
- `similar` high stickiness가 실제 사용자 체감상 과한지
- 필요하다면 `similar` band floor를 조정할지, 아니면 narrative 해석으로 흡수할지
- meta mismatch 감점폭을 미세 조정할 필요가 있는지
- Axis 5는 여기서 lock now로 갈지, 아니면 one more minor patch로 갈지

## 2026-04-03 Axis 2 Contract Lock

### Lock Summary
- Axis 2는 `산업 배경 유사성 / 산업 이해 전환 부담` 축으로 잠근다.
- true score owner는 `buildAxisConnectivityPack.js`의 `scoreAxis2()`다.
- upstream classification owner는 `classifyTransition.js`의 `classifyIndustryDistance()`다.
- 가장 안전한 contract는 `industryDistance` primary 유지 + 산업 배경 structured signal 보강형이다.

### Recommended Contract
- primary
  - `industryDistance`
- secondary
  - `valueChainPosition`
  - `coreContext`
  - `regulationBarrier`
- modifier
  - `sameSector`
  - `sameSubSector`
  - `salesCycle`
- evidence-only
  - `offeringModel`
  - `boundaryHints`
  - `proofSignals`
  - `support_industry_traits.businessStructure`
  - `support_industry_traits.operatingLanguage`
  - `support_industry_traits.problemTypes`

### Reconfirmed Exclusions
- Axis 2 direct scoring 제외
  - `customerMarket`
  - `buyingMotion`
  - `decisionStructure`
  - `responsibilityHints`
  - `levelHints`
  - `roleWeightShift`
  - `jobInteractionHints`

### Current Risk
- `industryDistance` 내부에 legacy `customerMarket` 영향이 남아 있어 4축과 완전 분리되지는 않는다.
- 다음 safe patch는 Axis 2 helper를 로컬 append로 시작하고, upstream adjacency 분리는 후속 minor round로 분리하는 편이 안전하다.

## 2026-04-03 5-Axis Documentation Lock Handoff

### Current Status
- 새 5축 체계 기준 문서 잠금 완료.
- 당시 1차 잠금 범위는 Axis 1 / Axis 4 / Axis 5였다.
- 아직 코드 수정 없음.
- 테스트 러너 파일도 아직 만들지 않음.

### Next Priority
1. gold set skeleton
2. runner input/output shape 정의
3. 최소 runner 설계

### Guardrail
- 과거 테스트 러너가 있더라도 직접 재사용하지 말고 참고 수준으로만 취급한다.
- 새 runner는 과거 axis 체계를 전제로 하지 않고 새 5축 계약에 맞춰 별도 설계한다.

## 2026-04-04 Runner Contract Documentation Lock

### Current Status
- 5축 baseline 문서 잠금 완료.
- runner input/output contract 문서 잠금 완료.
- 아직 코드 수정 없음.
- 아직 테스트 러너 구현 없음.

### Next Priority
1. gold set skeleton 실케이스 채우기
2. Axis 1~5 baseline을 읽는 minimal runner 설계

### Guardrail
- old runner 직접 재사용 금지
- contract 없이 runner부터 만들지 말 것
## 2026-04-04 Gold Set Baseline Real-Case Fill

### Current Status
- 5축 baseline 문서 잠금 완료.
- runner input/output contract 문서 잠금 완료.
- gold set baseline 실제 케이스 16건 1차 적재 완료.
- 이번 라운드 정본 범위는 Axis 1~5 전체다.
- 모든 케이스는 `focusAxes: [1,2,3,4,5]`를 사용한다.
- expected는 exact score 없이 `axis1~axis5 band + reasoningHints` 기준이다.

### Next Priority
1. minimal runner 설계
2. 첫 QA run 흐름 정리
3. disagreement 처리 기준 다듬기

### Guardrail
- exact score calibration으로 성급히 넘어가지 말 것
- old runner 직접 재사용 금지
- baseline case coverage 부족 상태에서 러너 일반화 금지

## 2026-04-04 Gold Set Baseline Axis 1~5 Expansion

### Current Status
- 5축 baseline 문서 잠금 완료.
- runner contract 문서 잠금 완료.
- Axis 1~5 기준 gold set baseline 실제 케이스 16건 1차 적재 완료.
- 이번 라운드 적재는 PASSMAP 입력 SSOT 고정 상태에서 수행했다.
- 모든 케이스는 `focusAxes: [1,2,3,4,5]`와 `axis1~axis5 band + reasoningHints` 형식으로 잠갔다.

### Next Priority
1. minimal runner 설계
2. 첫 QA run 흐름 정리
3. disagreement 처리 기준 다듬기

### Guardrail
- old runner 직접 재사용 금지
- PASSMAP 입력 SSOT 외 taxonomy 혼입 금지
- exact score calibration으로 성급히 넘어가지 말 것

## 2026-04-04 Minimal Runner Design Handoff

### Current Status
- minimal runner true owner 조사 완료.
- axis actual producer는 `src/lib/analysis/buildAxisConnectivityPack.js`의 `buildAxisConnectivityPack()`으로 정리했다.
- label resolve 진입점은 `src/lib/adapters/buildJobContext.js`의 `mapUiJobSubToOntologyId()`, `src/lib/adapters/buildIndustryContext.js`의 `mapUiIndustrySubToRegistryId()`로 정리했다.
- 이번 라운드는 코드 생성 없이 설계/실행안 문서화까지 우선한다.

### Recommended Flow
1. gold set 16건을 문서 기준으로 읽는다
2. PASSMAP SSOT label을 adapter로 id resolve한다
3. `buildAxisConnectivityPack()` 호출 결과를 axis1~axis5 actual로 기록한다
4. expected vs actual / disagreement를 row 단위로 남긴다

### Guardrail
- analyzer 전체 호출로 범위를 넓히지 말 것
- production scoring formula 수정 금지
- old runner 직접 재사용 금지
- fixture 파일 복제는 첫 수동 QA run 이후 결정

## 2026-04-04 Axis 1~5 User-Facing Copy Handoff

### Current Status
- 최신 5축 기준 노출 문구 정렬 완료.
- label true owner는 `src/lib/analysis/buildAxisConnectivityPack.js`, narrative true owner는 `src/components/report/TransitionLiteResult.jsx`로 확인했다.
- `고객 유형 연결성`, `직무 성격 연결성`은 독립 축으로 남기지 않고 Axis 4 / Axis 5 설명 안으로 흡수했다.

### Guardrail
- scoring formula, threshold, axis order 변경 금지
- user-facing copy 외 구조 수정 금지

## 2026-04-04 First Manual QA Run Complete

### Current Status
- 첫 manual QA run 실행 완료 (human reasoning pass, 5건)
- 결과: 전 케이스 match. expected band와 human actual band 일치
- Taxonomy guard: 5/5 통과

### 핵심 발견
- Axis 4 (고객 유형 연결성): 직무명이 동일해도 산업 교차/고객 반전 시 독립적으로 낮아짐 — 교정 효과 확인
- Axis 5 (직무 성격 연결성): 동일 산업/유사 직무명이어도 일의 결 차이로 독립적으로 낮아짐 — 교정 효과 확인
- human reasoning 수준에서는 원축 5개 기준이 일관되게 적용됨

### 현재 문제의 본체
> scoring/taxonomy/docs 모두 human pass 기준으로 안정. 다음 단계는 engine actual 비교

### Next Priority
- buildAxisConnectivityPack() 직접 호출로 engine actual band 기록
- human pass 결과(expected)와 engine actual band 비교
- disagreement가 발생하면 scoring 보정이 필요한 지점 식별

---

## 2026-04-04 Starter Set Concrete Selection Complete

### Current Status
- starter set concrete case selection 완료
- 16건 중 5건 선정: TSG-AX12345-011, -007, -003, -009, -013
- selection rationale은 `Transition_Scoring_Gold_Set.md` `## 2026-04-04 Starter Set Concrete Selection` 섹션에 잠김

### Manual QA 준비 상태 요약
- visible contract: 원축 5개 기준 복구 완료 ✅
- QA Framework Per-Axis Reasoning Fields: 원축 기준 재잠금 완료 ✅
- gold set 16건 baseline: 잠금 완료 ✅
- starter set 5건 선정: 완료 ✅
- runner 구현: 아직 없음
- 다음: 선정된 5건으로 첫 manual QA run 실행 (각 케이스 actual band 기록 + expected vs actual disagreement 수집)

### Next Priority
- 5건 starter set으로 첫 manual QA run 실행
- 각 케이스별로 `buildAxisConnectivityPack()` 호출 결과를 actual band로 기록하거나, 사람이 직접 읽어 band 판정 후 expected와 비교
- disagreement 패턴이 어느 축에서 먼저 나오는지 확인

### Guardrail
- 이번 runner 구현 없이 반수동으로 시작할 것
- exact score calibration 단계 아님
- band + reasoning 불일치 패턴 수집이 목표

---

## 2026-04-04 QA Framework Per-Axis Reasoning Fields Relock

### Current Status
- QA contract drift 중 최우선 correction 완료
- `Transition_Scoring_QA_Framework.md` `Per-Axis Reasoning Minimum Fields` 섹션을 원축 5개 기준으로 재잠금했다
- Axis 4 (고객 유형 연결성) / Axis 5 (직무 성격 연결성) sub-criteria 원축 기준 복구 완료

### 이제 가능한 것
- starter set / manual QA template 설계 시 이 corrected contract를 기준으로 진행 가능
- runner 설계 시 Axis 4/5 판정 기준을 원축 기준으로 사용 가능

### Next Priority
- starter set concrete case selection
- gold set 기존 16건을 corrected per-axis reasoning 기준으로 읽어 첫 manual QA run 준비

### Guardrail
- 아직 runner 구현 없음
- exact score calibration 단계 아님
- band + reasoning 기준으로 먼저 맞추는 것이 목표

---

## 2026-04-04 5-Axis Drift Audit After Visible Contract Restore

### Current Status
- visible contract는 직전 라운드에서 사용자 제공 원축 5개 기준으로 복구 완료됨
  - 직무 구조 연결성 / 산업 맥락 연결성 / 역할 범위 연결성 / 고객 유형 연결성 / 직무 성격 연결성
- 이번 라운드에서 runtime source가 아닌 운영 문서/QA 자산의 drift 여부를 일괄 감사함

### Drift 감사 결과 요약
- Runtime source: 안전. buildAxisConnectivityPack.js와 TransitionLiteResult.jsx 모두 원축 기준으로 잠겨 있음
- Docs drift 발견:
  - `Scoring_Calibration_Log.md:103` — 원축(`고객 유형 연결성`, `직무 성격 연결성`)을 "구버전 독립축"으로 잘못 기록. 복구 전 중간 상태 기준의 오기록
  - `끄적.md:85-87` — 동일 오기록. "구버전 축 이름"으로 잘못 표현됨
  - 이 handoff 파일 내 "2026-04-04 Axis 1~5 User-Facing Copy Handoff" 섹션 — 흡수 기록이 후속 "User-Provided 5-Axis Contract Restore" 섹션과 내부 충돌
- Runner/QA contract drift 발견:
  - `Transition_Scoring_QA_Framework.md` "Per-Axis Reasoning Minimum Fields" 섹션 — Axis 4 sub-criteria에 `산업 맥락`이, Axis 5 sub-criteria에 `역할 폭/책임 수준`이 잡혀 있음. 원축 기준과 충돌

### 현재 가장 위험한 지점
- Runner/QA contract drift: QA Framework의 Per-Axis sub-criteria가 원축이 아닌 신축 체계 기준으로 잠겨 있어, 미래 manual QA 또는 runner 설계 시 Axis 4/5 판정이 잘못된 기준으로 흐를 수 있음

### Next Round Priority
- `Transition_Scoring_QA_Framework.md` "Per-Axis Reasoning Minimum Fields" 섹션을 원축 5개 기준으로 재잠금:
  - Axis 4 (고객 유형 연결성): 고객 구조 / buying motion / customer market 중심
  - Axis 5 (직무 성격 연결성): 일의 결 / mission type / role weight / work character 중심

---

## 2026-04-04 User-Provided 5-Axis Contract Restore

### Current Status
- 기존 사용자 제공 5축 계약이 visible consumer path에서 깨져 있었고, `문제 해결 방식 연결성`, `산출물 연결성` 같은 신축 체계가 레이더와 하단 설명에 노출되고 있었다.
- true owner는 `src/lib/analysis/buildAxisConnectivityPack.js`의 axis label과 `src/components/report/TransitionLiteResult.jsx`의 radar short label / 1~5점 narrative였다.
- 이번 round에서 visible axis system을 사용자 제공 원문 기준 `직무 구조 연결성 / 산업 맥락 연결성 / 역할 범위 연결성 / 고객 유형 연결성 / 직무 성격 연결성`으로 복구했다.
- 1~5점 narrative도 사용자 제공 문장을 그대로 다시 반영했다.
- 조사 결과 이번 계약 위반은 우선 consumer-visible label / narrative path에 집중되어 있었고, scoring formula 변경은 수행하지 않았다.

### Next Check
1. runner 쪽 axis name drift 확인
2. gold set / QA template 문서의 axis contract drift 확인
3. handoff / patch note / ops memo 재동기화

### Guardrail
- scoring formula / threshold / axis order 변경 금지
- visible contract 복구와 runner / QA drift audit를 분리해서 진행할 것

---

## 2026-04-04 Newgrad Input Redesign Handoff

### 이번 채팅에서 확정된 설계 원칙

1. **empty-state 원칙 (확정)**
   - 프로젝트, 인턴, 자격증, 계약직 경험은 없어도 되는 자산
   - absence는 자동 패널티가 아니라 정상 empty-state
   - minimum required는 `targetJobId`, `targetIndustryId`, `major` 방향
   - 이 원칙은 현재도 유효하며 코드에도 반영되어 있음 (`buildNewgradTransitionLiteResult.js` 주석 확인)

2. **taxonomy 설계 자산 (설계 자산으로 보존)**
   - major taxonomy, certifications taxonomy, projects taxonomy, internships taxonomy, contractExperiences 방향이 이번 채팅에서 설계됨
   - 단, 이 taxonomy 설계는 참고 자산이며 최종 UI와 1:1 대응하지 않을 수 있음

3. **true owner 파일 (확정)**
   - newgrad 입력 UI: `src/components/input/NewgradTransitionLiteInput.jsx`
   - newgrad 분석 결과 빌더: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
   - experienced 입력 UI: `src/components/input/TransitionLiteInput.jsx`

### 적용 보고가 있었으나 현재 재검토가 필요한 사항

- 6-step newgrad flow: **코드 조사 결과 현재 3단계**. 6단계는 이전에 설계/논의되었으나 현재 코드에 없음
- `관심 근거` / `강점/스타일` / `전환 유형` step 추가: **코드 조사 결과 현재 없음**. 사용자 요구로 제거됨
- `브리지형 신입` -> `중고신입` 변경: **코드 조사 결과 visible copy 없음**. payload 필드(`bridgeCandidate: false`)만 존재. visible 라벨로 노출된 흔적 없음 — 재검증 필요
- structured payload normalize 적용 여부: build 파일에서 normalizeArray, compactObject 등 정규화 로직은 확인됨. UI에서 structured 형태로 전달하는 것도 확인됨
- experienced side step alignment: `TransitionLiteInput.jsx` 4단계 구조 확인됨

### 실제 화면 기준 실패/문제 확인 사항

- **escaped unicode 한글 깨짐**: `TransitionLiteInput.jsx`에 `\uBAA9\uD45C`, `\uBBF8\uC120\uD0DD` 등 escaped unicode literal 대거 존재. 렌더링 시 한글로 출력되지만 소스 레벨에서 미가공 상태
- **영어 visible badge**: `TransitionLiteInput.jsx`(experienced 쪽)에 `TRANSITION LITE`, `STEP 1`, `STEP 2` 영어 라벨 visible하게 존재
- **newgrad UI가 제품 수준이 아닌 덧댄 느낌**: 사용자 직접 불만 확인됨
- **불필요한 step 4~6**: 현재 코드에는 없으나 이전 채팅에서 과도하게 설계되었다가 제거된 이력
- **자유 텍스트 입력 잔존 가능성**: 코드 조사 결과 NewgradTransitionLiteInput.jsx에는 text input/textarea 없음 — newgrad 쪽은 현재 select-only 확인됨

### 현재 최종 사용자 요구

아래 5개를 최우선으로 잠금:

1. **newgrad 3단계만** — 1.목표 직무/산업, 2.학업 기반, 3.실전 경험
2. **제거된 step**: 관심 근거, 강점/스타일, 전환 유형
3. **유저 직접 텍스트 입력 전부 제거** — text input/textarea 없이 선택만으로
4. **영어 visible label 제거** — `TRANSITION LITE / NEWGRAD` 등 제거
5. **`브리지형 신입` 대신 `중고신입`** — visible copy 확인 및 적용 필요

**코드 조사 결과: 1~3은 NewgradTransitionLiteInput.jsx에서 이미 반영된 상태. 4는 experienced 쪽(TransitionLiteInput.jsx)에 여전히 영어 라벨 존재. 5는 visible copy 없음 — 재확인 필요.**

### 다음 액션 우선순위

1. 현재 코드 실제 상태 재확인 (이번 채팅에서 조사 완료 — 위 내용 기준)
2. `TransitionLiteInput.jsx` (experienced) 영어 라벨 제거 (`TRANSITION LITE`, `STEP N`)
3. `TransitionLiteInput.jsx` escaped unicode literal 정리
4. newgrad에서 `중고신입` visible copy 적용 여부 확인 및 필요시 추가
5. 이후에만 추가 taxonomy/UI polish 검토

## 2026-04-05 Newgrad Axis 2 Scoring Contract Lock

### Definition Lock
- Newgrad Axis 2는 `산업 분야 이해도`다.
- 질문은 "이 지원자가 목표 산업을 이해하고 준비해왔을 가능성이 얼마나 축적되어 있는가"다.
- direct field exposure proof, 직무 유사도, 실행 깊이 점수로 다시 해석하지 않는다.

### Evidence Whitelist
- primary evidence
  - target industry와 방향이 맞는 `major`
  - `internships`의 `type + stakeholderType` 조합
  - `contractExperiences`의 `type + stakeholderType` 조합
- secondary support
  - `certifications`
  - internship / contract의 반복 횟수
  - project의 존재 자체가 아니라 다른 산업 이해 신호를 보강하는 보조 맥락
- weak support only
  - `project.type`
  - generic `major`
  - generic `certifications`
  - `stakeholderType` 단독
- excluded from core scoring
  - `project.role`
  - `project.outcomeLevel`
  - `internship.roleFamily`
  - `internship.duration`
  - `contractExperiences.roleFamily`
  - `contractExperiences.duration`
  - `targetIndustryId` 자체는 점수 증거가 아니라 comparison anchor only

### Boundary Enforcement
- Axis 1 = 직무/과업 유사성
- Axis 2 = 산업 분야 이해도
- Axis 3 = 실행 깊이 / 얼마나 끝까지 해봤는가
- exclusion rules
  - role similarity alone must not raise Axis 2 strongly
  - duration alone must not raise Axis 2 strongly
  - outcome depth alone must not raise Axis 2 strongly
  - current input의 project role / internship roleFamily는 Axis 1 쪽 신호로 우선 본다
  - outcomeLevel / duration은 Axis 3 쪽 신호로 우선 본다

### Evidence Tier Summary
- strong
  - applied context가 있는 primary evidence가 2개 이상 같은 방향으로 수렴
  - 예: target industry와 맞는 major + industry-adjacent internship / contract context
  - 예: internship / contract가 반복되고 stakeholderType도 외부 맥락 쪽으로 모임
- medium
  - primary evidence 1개 + secondary support 1개 이상
  - 또는 weak/secondary signal이 2개 이상 서로 충돌 없이 모임
- weak
  - generic major only
  - certifications only
  - project.type only
  - stakeholderType only

### Score 1~5 Intent
- 1 = 산업 이해 신호가 사실상 없거나, 남아 있는 신호가 role/duration/outcome 같은 타 축 신호뿐인 상태
- 2 = 약한 신호 1개 또는 모호한 보조 신호만 있는 상태
- 3 = clear primary evidence 1개 또는 weak/secondary 신호가 2개 이상 모여 최소한의 산업 준비 흔적이 읽히는 상태
- 4 = at least one applied-context primary evidence + another aligned support가 필요하며, vague generic 신호만으로는 도달 금지
- 5 = 3개 이상 독립 근거가 반복적으로 같은 산업 방향으로 수렴하고, 그 안에 applied-context evidence가 2개 이상 포함될 때만 허용

### Cap Rules
- generic major only -> max 2
- certifications only -> max 2
- role similarity only -> max 1
- duration / outcome only -> max 1
- multiple weak signals only -> max 3
- 4 이상은 applied-context primary evidence 없이 금지
- 5는 repeated convergence + applied-context 2개 이상 + non-applied support 1개 이상이 있어야 허용

### Conflict / Tiebreak
- consistency first: 서로 다른 자산이 같은 산업 방향으로 모이는지 먼저 본다
- directness second: major/cert보다 internship/contract applied context를 더 강하게 본다
- repetition third: 단발 신호보다 반복 신호를 우선한다
- conservative downgrade
  - major relevant but projects / internships / contracts unrelated -> 2 또는 3에서 보수 판정
  - certifications relevant but no applied evidence -> 2 상한, 예외적으로 major까지 정렬되면 3 가능
  - one strong internship / contract but others weak -> 기본 3, major/cert support가 붙어야 4 검토
  - activities are many but mostly generic / cross-industry -> quantity만으로 가산하지 않는다

### Internal Contract Decision
- keep for now
  - `industryContext`
  - `domainInterestEvidence`
  - `scoreDomainInterest`
- 지금은 rename보다 scoring semantics correction이 우선이다.
- naming cleanup은 implementation stability가 확인된 뒤 별도 라운드로 미룬다.

### Next Implementation Direction
- smallest correct next step은 `buildNewgradAxisPack.js`의 Axis 2만 국소 재설계하는 것이다.
- current count-based `scoreDomainInterest()`를 버리고, major / internship / contract / certifications 중심의 whitelist + cap + tiebreak contract를 반영한다.
- project.role / roleFamily / duration / outcomeLevel은 Axis 2 가산 근거가 아니라 guardrail로 먼저 제외해야 한다.

## 2026-04-05 5축 점수 계약 감사 결과

### Audit Result
- 현재 5축 중 `완전 LOCKED`로 부를 수 있는 축은 없다.
- 의미 정의와 QA baseline은 여러 축에서 잠겨 있지만, evidence boundary + cap rule + conflict handling + implementation reopening 방지 수준까지 같이 잠긴 축은 아직 부족하다.
- 가장 가까운 축은 Axis 4 / Axis 5지만, 이들도 strict 기준에서는 `PARTIAL`로 본다.
- Axis 2는 newgrad 재정의 이후 기존 5축 문서와 계약 성숙도가 가장 크게 벌어져 있어 `NEEDS RELOCK`가 맞다.

### Axis Status Summary
- Axis 1 = PARTIAL
- Axis 2 = NEEDS RELOCK
- Axis 3 = PARTIAL
- Axis 4 = PARTIAL
- Axis 5 = PARTIAL

### Why Axis 2 Is Highest Priority
- 기존 5축 문서의 Axis 2는 `산업 맥락 연결성` / industry background distance 축으로 남아 있다.
- 반면 recent newgrad lock은 Axis 2를 `산업 분야 이해도`로 재정의했다.
- 즉 meaning, evidence whitelist, cap rule, implementation start point가 path별로 어긋날 위험이 가장 크다.
- 이 상태에서 구현을 열면 old taxonomy-distance 해석과 newgrad evidence-bounded 해석이 다시 섞일 수 있다.

### Axis-by-Axis Working Judgment
- Axis 1
  - meaning은 비교적 선명하다.
  - 그러나 primary/secondary evidence, cap, tie-break가 redesign memo candidate 수준에 머문다.
  - implementation은 가능하지만 core meaning을 다시 열 가능성이 아직 남아 있다.
- Axis 2
  - old 5-axis contract와 newgrad contract가 같은 maturity level로 정렬되지 않았다.
  - experienced/main path 기준으로는 old industry-distance contract가 남아 있고, newgrad path는 새 meaning 잠금이 추가됐다.
  - strict status는 `NEEDS RELOCK`다.
- Axis 3
  - meaning과 QA reasoning field는 있다.
  - 하지만 evidence 제외 규칙, upper bound, conflict rule, calibration memo가 약하다.
  - gap이 작더라도 문서상 contract는 아직 partial이다.
- Axis 4
  - customerMarket primary, buyingMotion secondary, decisionStructure weak secondary, forbidden drift memo까지 비교적 잘 정리돼 있다.
  - human QA anchor도 있다.
  - 다만 explicit 1~5 scoring contract와 cap rule이 별도 SSOT로 잠겨 있지 않아 strict LOCKED는 아니다.
- Axis 5
  - roleWeightShift primary, mission/successMetric/horizon 보강, forbidden signal lock, calibration memo가 있다.
  - human QA에서도 독립성 교정이 확인됐다.
  - 하지만 explicit evidence tier / 1~5 / tie-break SSOT는 부족해 strict 기준에서는 PARTIAL이다.

### Recommended Lock Order
1. Axis 2
2. Axis 1
3. Axis 3
4. Axis 4
5. Axis 5

## 2026-04-05 Newgrad Axis 2 Final SSOT Relock

### Final Normalization
- Newgrad Axis 2의 최종 SSOT는 `산업 분야 이해도`다.
- old direction이었던 `산업 맥락 접점 / direct field exposure proof`는 historical / superseded interpretation으로 둔다.
- existing inputs first 원칙을 유지한다.
- new Step 3 field는 지금 추가하지 않는다.
- 이 섹션 이후 Newgrad Axis 2의 SSOT는 본 relock 섹션을 우선 참조한다.

### What Was Still Unstable
- recent 문서에는 Axis 2 redefinition lock과 scoring contract lock이 이미 있었지만,
- 5축 audit에서는 기존 5축 문서의 Axis 2(`산업 맥락 연결성` / industry-distance 해석)가 함께 남아 있어 `NEEDS RELOCK`로 기록됐다.
- 즉 문제의 본체는 새 contract 부재가 아니라, newgrad Axis 2의 우선 SSOT가 문서상 단일 문장으로 정규화되지 않았던 점이다.

### Historical / Superseded for Newgrad Axis 2
- 아래 해석은 newgrad Axis 2의 final SSOT가 아니다.
  - `산업 맥락 연결성`
  - `industry background distance`
  - `industry-context exposure`
  - `직접 field exposure 증명`
- 위 해석들은 older 5-axis baseline 또는 redesign investigation의 historical context로만 읽고, newgrad Axis 2 구현 기준으로 직접 참조하지 않는다.

### Final Meaning
- 질문은 `이 지원자가 목표 산업을 이해하고 준비해왔을 가능성이 얼마나 축적되어 있는가`다.
- Axis 2는 직무 유사도 축이 아니다.
- Axis 2는 실행 깊이 축이 아니다.
- Axis 2는 direct field exposure proof 축이 아니다.

### Final Evidence Whitelist
- primary evidence
  - target industry와 방향이 맞는 `major`
  - `internships`의 `type + stakeholderType + context`
  - `contractExperiences`의 `type + stakeholderType + context`
- secondary support
  - `certifications`
  - internship / contract의 반복성
  - project 존재 자체가 아니라 다른 산업 이해 신호를 보강하는 보조 맥락
- weak support only
  - `project.type`
  - generic `major`
  - generic `certifications`
  - `stakeholderType` 단독
- excluded evidence
  - `project.role`
  - `project.outcomeLevel`
  - `internship.roleFamily`
  - `internship.duration`
  - `contractExperiences.roleFamily`
  - `contractExperiences.duration`
  - `targetIndustryId` 자체는 점수 증거가 아니라 comparison anchor only

### Evidence Strength Tier
- strong
  - applied context가 있는 primary evidence가 2개 이상 같은 방향으로 수렴
- medium
  - primary evidence 1개 + secondary support 1개 이상
  - 또는 weak/secondary signal 2개 이상이 충돌 없이 모임
- weak
  - generic major only
  - certifications only
  - project.type only
  - stakeholderType only

### Final 1~5 Scoring Intent
- 1 = 산업 이해 신호가 사실상 없거나, 남아 있는 신호가 role/duration/outcome 같은 타 축 신호뿐인 상태
- 2 = 약한 신호 1개 또는 모호한 보조 신호만 있는 상태
- 3 = clear primary evidence 1개 또는 weak/secondary 신호 2개 이상이 모여 최소한의 산업 준비 흔적이 읽히는 상태
- 4 = applied-context primary evidence 1개 이상 + aligned support가 추가로 필요하며, vague generic 신호만으로는 도달 금지
- 5 = 3개 이상 독립 근거가 반복적으로 같은 산업 방향으로 수렴하고, applied-context evidence가 2개 이상 포함될 때만 허용

### Cap / Tiebreak / Fallback
- cap rules
  - generic major only -> max 2
  - certifications only -> max 2
  - role similarity only -> max 1
  - duration / outcome only -> max 1
  - multiple weak signals only -> max 3
  - 4 이상은 applied-context primary evidence 없이 금지
  - 5는 repeated convergence + applied-context 2개 이상 + non-applied support 1개 이상이 있어야 허용
- conflict / tiebreak
  - consistency first
  - directness second
  - repetition third
  - conflicting/generic evidence는 보수 하향
- fallback stance
  - evidence가 thin하면 억지로 3~4로 올리지 말고 낮게 유지한다.
  - thin evidence 상태의 기본 태도는 conservative low-to-mid다.

### Internal Contract Decision
- keep for now
  - `industryContext`
  - `domainInterestEvidence`
  - `scoreDomainInterest`
- rename은 blocker가 아니며, semantics correction 이후로 미룬다.

### Implementation Readiness
- Newgrad Axis 2는 이제 문서 기준 implementation-ready로 본다.
- 다음 라운드는 의미 재정의가 아니라 `buildNewgradAxisPack.js`의 scoring implementation round다.
- 이후 ambiguity를 다시 여는 조건은 code-level contradiction 또는 real scoring failure뿐이다.

## 2026-04-05 Newgrad Axis 2 Scoring Implementation Applied

### Patch Result
- `buildNewgradAxisPack.js` 1파일만 수정해서 newgrad Axis 2 scoring을 실제 코드에 반영했다.
- true owner는 그대로 `scoreDomainInterest()`이며 internal names도 유지했다.

### Confirmed Implementation Match
- old count-based `domainInterestEvidence + projects + coursework + major` 방식은 제거했다.
- target industry anchor는 `targetIndustryId -> industry registry sector` 기준으로 읽는다.
- Axis 2는 이제 아래 신호를 보수적으로 사용한다.
  - `major`
  - industry-linked `certifications`
  - internship / contract의 `type + stakeholderType` 기반 context
  - weak `project.type` support
- 아래 신호는 Axis 2 direct raise에서 제외했다.
  - `project.role`
  - `project.outcomeLevel`
  - `internship.roleFamily`
  - `contractExperiences.roleFamily`
  - `internship.duration`
  - `contractExperiences.duration`

### Guardrail Outcome
- role similarity 단독으로 Axis 2가 올라가지 않게 막았다.
- duration / outcome depth 단독으로 Axis 2가 올라가지 않게 막았다.
- thin evidence는 low~mid로 묶는 cap를 넣었다.

### Next Check
- 다음 라운드는 의미 재논의가 아니라 actual score behavior QA다.
- 확인 포인트는 sector-level keyword map의 과대/과소 반응 여부다.

## 2026-04-05 Newgrad Axis 2 Test Operation Lock

### Current Stage Lock
- Newgrad Axis 2는 이제 의미 설계 단계가 아니라 검증 / calibration 단계다.
- 이번 라운드에서 다시 열지 않는 것:
  - Axis 2 의미 재논의
  - Step 3 field 논의
  - internal key rename
  - UI / input redesign

### File Locations
- test case repository: `02_Product/Accuracy_QA/Newgrad_Axis2_Test_Cases.md`
- calibration log: `05_Execution/Scoring_Calibration_Log.md`
- handoff / operating memo: `00_HQ/Session_Handoff_Latest.md`, `docs/끄적.md`
- generic execution round log는 계속 `05_Execution/Accuracy_QA_Log.md`에 남긴다.

### Dedup Rules
- 새 Axis 2 테스트는 `case_id` 없이 만들지 않는다.
- case format은 `NGA2-CASE-YYYYMMDD-###`로 고정한다.
- rerun은 새 case를 만들지 않고 기존 case의 `run_history`에 누적한다.
- expectation이나 판정 이유가 바뀌면 case 본문을 조용히 덮어쓰지 말고 `case_revision_note`와 calibration log를 함께 남긴다.
- one-case-one-purpose 원칙을 유지한다.
  - 한 case에는 하나의 핵심 판정 질문만 둔다.
  - 여러 bucket을 한 case에 섞지 않는다.
- Axis 2 전용 검증은 generic 5-axis gold set과 분리한다.
  - 5축 전반 비교용 케이스로 흡수하지 않는다.
  - Axis 2 점수 behavior 확인이 목적이면 전용 repository를 우선 사용한다.

### Starter Buckets
- `관련 신호 거의 없음`
- `전공만 관련`
- `자격만 관련`
- `프로젝트만 관련`
- `인턴만 관련`
- `전공 + 프로젝트`
- `전공 + 인턴`
- `자격 + 프로젝트 + 인턴`
- `role similarity 높지만 산업 이해 낮음`
- `duration/outcome 강하지만 산업 이해 약함`
- bucket은 section title이 아니라 고정 `bucket` label로 관리한다.

### Next Execution Order
1. 전용 test case repository와 calibration log template를 먼저 잠근다.
2. bucket별 starter case를 case id 기준으로 등록한다.
3. 첫 verification batch를 small set으로 실행한다.
4. mismatch는 case 본문을 고치지 말고 calibration log에 연결한다.
5. 동일 패턴 mismatch가 반복될 때만 contract issue / implementation issue를 분리 논의한다.

## 2026-04-05 Newgrad Axis 2 First Test Run

### Round Summary
- first actual verification batch 9건 실행 완료
  - `NGA2-CASE-20260405-001`
  - `NGA2-CASE-20260405-002`
  - `NGA2-CASE-20260405-003`
  - `NGA2-CASE-20260405-004`
  - `NGA2-CASE-20260405-005`
  - `NGA2-CASE-20260405-006`
  - `NGA2-CASE-20260405-007`
  - `NGA2-CASE-20260405-009`
  - `NGA2-CASE-20260405-010`
- 결과 집계
  - match: 3
  - soft mismatch: 5
  - hard mismatch: 1

### Confirmed Pattern
- certification-only / weak-project-only / direct-internship-only는 대체로 SSOT와 맞았다.
- 그러나 아래 두 패턴이 반복 확인됐다.
  - low-signal bucket에서 unrelated major 또는 typed support가 low~mid floor를 만든다.
  - related major가 있어도 expected lift가 약하거나 거의 보이지 않는다.

### Current Judgment
- Axis 2는 `완전 stable`로 보지 않는다.
- 현재 판정은 `partially stable but needs calibration follow-up`이다.
- 의미 재설계까지 다시 열 단계는 아니지만, next round는 calibration batch가 우선이다.

### Next Step Lock
1. second Axis 2 calibration batch를 실행한다.
2. low-signal floor 패턴과 related-major under-lift 패턴이 반복되는지 확인한다.
3. 반복되면 `scoreDomainInterest()`의 weak/support/major contribution만 좁게 조사한다.
4. 그 전에는 Axis 2 meaning / Step 3 / rename 논의를 다시 열지 않는다.

## 2026-04-05 Newgrad Axis 2 Second Calibration Batch

### Retest Scope
- retest target은 first batch의 두 패턴이었다.
  - Pattern A: unrelated major / weak typed support가 very_low bucket을 low~mid로 끌어올리는지
  - Pattern B: related major가 expected lift를 만들지 못하는지
- second batch 8건 실행 완료
  - Pattern A: `NGA2-CASE-20260405-011`, `012`, `013`, `014`
  - Pattern B: `NGA2-CASE-20260405-015`, `016`, `017`, `018`

### Round Result
- match: 0
- soft mismatch: 5
- hard mismatch: 3
- Pattern A repeated: yes
- Pattern B repeated: yes

### Locked Judgment
- 이번 시점의 결론은 `one more QA batch`가 아니라 `narrow implementation investigation justified`다.
- 이유:
  - Pattern A가 4/4로 반복됐다.
  - Pattern B도 4/4로 반복됐다.
  - 방향이 모두 locked Axis 2 contract와 같은 방향으로 충돌한다.

### Next Step
1. 다음 단계는 `scoreDomainInterest()`만 좁게 조사한다.
2. 의미 재설계는 열지 않는다.
3. UI / input / Step 3 논의도 열지 않는다.
4. 조사 포인트는 `majorAligned`, `Boolean(input.major)`, `supportContextCount`, non-linked certification 처리, weakSignalCount 결합이다.

## 2026-04-05 Newgrad 5Axis Radar Scoring Audit + Test Design

### 조사 요약
- 신입 5축 레이더의 true score owner는 `src/lib/analysis/buildNewgradAxisPack.js`다.
- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`는 input normalization + VM assembly owner다.
- `src/components/report/TransitionLiteResult.jsx`는 radar render / short label / narrative consumer owner다.
- `src/App.jsx`는 submit orchestration owner이며 score owner가 아니다.
- newgrad path는 experienced path와 분리되어 있고, 같은 consumer를 공유하더라도 score contract는 분리해서 읽어야 한다.
- score와 narrative는 같은 owner가 아니다.
- raw UI input shape는 `NewgradTransitionLiteInput.jsx`에서 object/array 형태로 만들어지고, scoring input shape는 `validateNewgradTransitionLiteInput()`에서 일부 string/normalized array로 바뀐다.
- 5축 모두 ML이 아니라 rule-based + heuristic 조합형이다.
- Axis 2는 이미 별도 calibration 이력이 있으므로 이번 라운드는 5축 전체 owner lock + test design SSOT 정리에 집중한다.

### 5축 Owner Lock
- Axis 1
  - visible label: `전공과 직무의 연결성`
  - internal key: `jobStructure`
  - score owner: `buildNewgradAxisPack()` -> `scoreJobFit()`
  - main inputs: `targetJobId`, `major`, `projects.role`, `internships.roleFamily`
  - type: 직무 카테고리 매핑 + role/major heuristic
  - narrative owner: `TransitionLiteResult.jsx` -> `getAxisScoreNarrative()`
- Axis 2
  - visible label: `산업 연관성`
  - internal key: `industryContext`
  - score owner: `buildNewgradAxisPack()` -> `scoreDomainInterest()`
  - main inputs: `targetIndustryId`, `major`, `certifications`, `projects`, `internships`, `contractExperiences`
  - type: 산업 prep profile 기반 heuristic + cap
  - narrative owner: `TransitionLiteResult.jsx` -> `getAxisScoreNarrative()`
- Axis 3
  - visible label: `유사한 경험이 있는가?`
  - internal key: `responsibilityScope`
  - score owner: `buildNewgradAxisPack()` -> `scoreExecutionDepth()`
  - main inputs: `projects`, `internships`, `extracurriculars`, `partTimeExperience`, `project.outcomeLevel`, `duration`
  - type: evidence count + outcome/duration semantic lift
  - narrative owner: `TransitionLiteResult.jsx` -> `getAxisScoreNarrative()`
- Axis 4
  - visible label: `고객 커뮤니케이션 적합성`
  - internal key: `customerType`
  - score owner: `buildNewgradAxisPack()` -> `scoreInteractionFit()`
  - main inputs: `internships`, `projects`, `extracurriculars`, `partTimeExperience`, `workStyleNotes`, `stakeholderType`
  - type: evidence count + stakeholder semantic lift
  - narrative owner: `TransitionLiteResult.jsx` -> `getAxisScoreNarrative()`
- Axis 5
  - visible label: `강점과 재능`
  - internal key: `roleCharacter`
  - score owner: `buildNewgradAxisPack()` -> `scoreSoftSkillMatch()`
  - main inputs: `targetJobId`, `strengths`, `workStyleNotes`
  - type: target job major category -> trait map heuristic
  - narrative owner: `TransitionLiteResult.jsx` -> `getAxisScoreNarrative()`

### Actual Call Path Lock
1. input component: `src/components/input/NewgradTransitionLiteInput.jsx`
2. submit/build trigger: `src/App.jsx` -> `handleSubmitTransitionLite()`
3. audience branch: `src/App.jsx` -> `resolveTransitionLiteAudience()`
4. normalization layer: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` -> `validateNewgradTransitionLiteInput()`
5. scoring builder: `src/lib/analysis/buildNewgradAxisPack.js`
6. vm assembly: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
7. report consumer: `src/components/report/TransitionLiteResult.jsx`
8. radar rendering point: `TransitionLiteResult.jsx` 내부 `axisEntries` -> `getRadarAxisShortLabel()` / `toAxisUiScore5()` / radar svg

### 혼동 방지 Lock
- newgrad score owner를 experienced radar owner로 착각하지 말 것.
- visible label만 보고 internal key를 추정하지 말 것.
- `TransitionLiteResult.jsx`는 score 계산기가 아니라 consumer + narrative owner다.
- raw input shape와 scoring normalized shape를 같은 것으로 취급하지 말 것.

### 테스트 설계 Lock
- Layer 1. 축 단독 테스트
  - 각 축마다 `high / mid / low / boundary ambiguous` 최소 4유형
- Layer 2. 입력 신호 영향도 테스트
  - `major`, `certifications`, `projects`, `internships`, `activities`, `targetJobId`, `targetIndustryId` 분리 주입
- Layer 3. 조합 시나리오 테스트
  - 전공만 맞음 / 전공 다르지만 실무 신호 강함 / 직무는 맞지만 산업 다름 / 산업은 맞지만 직무 다름 / 표면상 유사한 경계 케이스
- Layer 4. 골드셋/운영 QA
  - case id 기반
  - expected는 숫자 고정보다 `band + reasoning` 우선
  - disagreement는 별도 calibration log 연결

### 추천 우선순위
1. Axis 2 `industryContext`
2. Axis 1 `jobStructure`
3. Axis 3 `responsibilityScope`
4. Axis 4 `customerType`
5. Axis 5 `roleCharacter`

### 우선순위 이유
- Axis 2는 이미 반복 mismatch 근거가 누적되어 있다.
- Axis 1은 target job category + major/role heuristic drift 가능성이 높다.
- Axis 3은 duration/outcome semantic lift가 false high를 만들기 쉽다.
- Axis 4는 stakeholderType 품질에 따라 흔들릴 수 있다.
- Axis 5는 비교적 owner가 단순하지만 trait map upstream quality에 의존한다.

### 다음 라운드
1. Axis 2 narrow implementation investigation과 별개로 5축 test repository skeleton을 설계한다.
2. Axis 1/3 우선으로 high-low-boundary case를 추가한다.
3. score owner와 narrative owner drift를 분리 기록한다.

## 2026-04-05 Newgrad 5Axis QA Skeleton Lock + Axis 1/3 Gold Set Design

### 이번 라운드에서 잠근 것
- newgrad 5axis QA 운영 구조는 option 1이 아니라 option 2로 잠근다.
- 즉, `Accuracy_QA_Log` 한 문서에 몰아넣지 않고 아래처럼 역할을 분리한다.
  - test case definition owner: `02_Product/Accuracy_QA/Newgrad_Transition_Lite_Gold_Set.md`
  - execution round owner: `05_Execution/Accuracy_QA_Log.md`
  - calibration / drift owner: `05_Execution/Newgrad_Calibration_Log.md`
- score drift와 narrative drift는 같은 entry 안에서도 `driftType`으로 분리 기록한다.

### 왜 Axis 1 / Axis 3가 우선인가
- Axis 2는 이미 반복 mismatch evidence가 있어 먼저 구현 audit을 좁게 보는 편이 맞다.
- 반면 5축 전체 gold set skeleton은 Axis 1 / Axis 3부터 잠그는 편이 테스트 효율이 높다.
- Axis 1은 target job relevance heuristic의 false high / false low를 잘 드러낸다.
- Axis 3은 execution depth와 participation를 분리하는 기준이 중요해 초기 gold set 가치가 높다.

### Axis 1 / Axis 3 starter lock
- Axis 1 `jobStructure`
  - high: repeated direct role evidence
  - mid: major-only 또는 adjacent role + major
  - low: adjacent-only 또는 weak evidence
- Axis 3 `responsibilityScope`
  - high: multi-group evidence + outcome/duration lift
  - mid: 수행 흔적은 있으나 ownership 강도 제한
  - low: 참여 group은 있으나 산출물/반복성 약함

### Axis 2 narrow implementation audit lock
- 좁은 audit 범위는 `buildNewgradAxisPack.js`의 `scoreDomainInterest()`만 본다.
- Axis 2 score owner는 이 함수이며, upstream helper는 아래에 한정된다.
  - `_getIndustryPrepProfile()`
  - `_scoreIndustryMajorRelevance()`
  - `_scoreIndustryCertificationRelevance()`
  - `_scoreIndustryProjectSupport()`
  - `_classifyContextEvidence()`
- downstream은 `makeAxis()`와 consumer narrative일 뿐 점수 산정 owner는 아니다.

### Axis 2 리스크 요약
- `Boolean(input.major)`가 weak signal count와 low floor에 동시에 관여해 unrelated major가 floor를 만드는지 계속 의심된다.
- `project.type`는 약한 신호인데 support count와 weakSignalCount를 통해 과대 작동할 위험이 있다.
- `targetIndustryId`가 invalid면 profile 기반 major/cert relevance는 죽지만, weak/support 신호만으로도 `2` 또는 `3`이 나올 여지가 있다.
- major가 primary usable signal이어도 실제 uplift는 `majorStrength >= 2` 조건과 후속 gate에 막혀 under-lift가 날 수 있다.

### 다음 실행 순서
1. `Newgrad_Transition_Lite_Gold_Set.md`의 Axis 1 / Axis 3 starter case를 실제 payload 가능한 케이스로 채운다.
2. `Newgrad_Calibration_Log.md`의 drift template으로 score / narrative를 분리 기록한다.
3. Axis 2는 `scoreDomainInterest()`의 pattern A/B 관련 입력 조합을 추가 케이스로 재검증한다.

## 2026-04-05 Newgrad Axis 1/3 First Run + Axis 2 Targeted Expansion

### 실행 경로 확정
- source patch 없이 `buildNewgradTransitionLiteResult(payload)` 직접 호출 경로로 first batch를 실행했다.
- actual axis score owner는 계속 `buildNewgradAxisPack.js`다.
- visible narrative는 `TransitionLiteResult.jsx`의 same mapping을 안전한 임시 harness에서 재현해 읽었다.

### 실행 결과 요약
- Axis 1 starter 6건 실행
  - match 5
  - score drift 1
- Axis 3 starter 6건 실행
  - match 4
  - score drift 2
- Axis 2 targeted expansion 6건 실행
  - match 6
  - score drift 0
- 총계
  - executed 18
  - match 15
  - score drift 3
  - narrative drift 0
  - both 0

### 가장 중요한 반복 패턴
- Axis 1
  - single direct project role 1건이 3-band 기준 `mid`가 아니라 `high`로 읽혔다.
- Axis 3
  - `project 1 + activity 1`
  - `project 1 + short internship 1`
  - 위 두 조합이 모두 예상보다 빨리 `high` 측으로 올라갔다.
- Axis 2
  - targeted expansion에서는 weak project only / cert only cap이 정상 동작했다.
  - strong internship support도 mid lift를 만들었다.
  - 다만 related-major-only retest가 `mid`로 나와 prior under-lift 기록과 직접 충돌했다.

### 현재 판단
- 지금 당장 calibration 우선순위는 Axis 1보다 Axis 3가 더 높다.
- 이유는 Axis 3에서 same-direction score drift가 2건 반복됐기 때문이다.
- Axis 1의 single-direct-role 상향은 rule 의도일 가능성도 있어 기대치 조정 검토가 먼저다.
- Axis 2는 구현 감사보다 old case payload / raw result 재대조가 먼저다.

### 다음 라운드 우선순위
1. Axis 3 mid-upper boundary 케이스를 4~6건 더 추가한다.
2. Axis 1 single direct role / major-only / adjacent-role 경계 케이스를 더 촘촘히 돌린다.
3. Axis 2는 prior mismatch case와 이번 targeted case의 payload 차이를 정리해 old/new 재실행 비교를 한다.
4. expected baseline은 아직 3-band 유지가 맞고, 5-band 세분화는 다음 실행 batch 이후로 미룬다.

## 2026-04-05 Newgrad Axis 1/3 Boundary Stress + Axis 2 Repro

### 왜 이번 순서로 했는가
- Axis 3를 먼저 본 이유:
  - first run에서 same-direction score drift가 2건 반복돼 가장 먼저 stress test가 필요한 축이었다.
- Axis 1에서 single direct role 검증이 핵심인 이유:
  - first run drift 1건이 이 패턴이었고, current rule 의도인지 reviewer 기대 보수성인지 분리가 필요했다.
- Axis 2에서 신규 확장보다 old mismatch repro가 우선인 이유:
  - targeted expansion은 안정적이었는데 old mismatch 기록과 충돌했기 때문이다.

### 이번 실행 결과
- Axis 3 boundary stress 6건
  - lower-mid 2건 중 1 low / 1 mid
  - true mid 2건 모두 mid
  - upper-mid 2건 모두 high-side
- Axis 1 boundary stress 6건
  - major only -> mid
  - adjacent only -> low
  - single direct role only -> high-side
  - single direct role + major support -> high-side
  - repeated adjacent signals -> low
  - generic activity only -> low
- Axis 2 repro 3건
  - old mismatch 2건은 same harness에서 재현 안 됨
  - old match 1건은 same harness에서도 일치

### repeated direction lock
- Axis 3
  - repeated direction: `upper-mid inflation`
  - readiness: `boundary_ready`
- Axis 1
  - repeated direction: `single direct role high-side` + `adjacent repetition under-lift`
  - readiness: `boundary_ready`
- Axis 2
  - repeated direction: `mixed / repro conflict`
  - readiness: `not_ready`

### 현재 해석
- Axis 3는 patch-ready까지는 아니지만 boundary calibration 검토는 가능한 수준이다.
- Axis 1도 rule shape가 더 분명해졌지만 기대치 조정과 calibration을 먼저 논의하는 편이 맞다.
- Axis 2는 old payload / raw result 재대조 없이 버그 확정 금지다.

### 다음 라운드
1. Axis 3 upper-mid boundary만 더 좁힌 micro batch를 한 번 더 실행한다.
2. Axis 1 single direct role / repeated adjacent expectation을 재정리한다.
3. Axis 2 old case payload 복원 가능 범위를 더 좁혀 same harness로 다시 비교한다.
## 2026-04-05 Newgrad Axis 3 Micro-Boundary Confirmation + Axis 1 Clarification + Axis 2 Raw Repro Narrowing

### what was executed
- Axis 3 micro-boundary 6건
- Axis 1 expectation clarification 4건
- Axis 2 raw repro narrowing 2건

### locked reading
- Axis 3:
  - `project + internship` upper-mid 조합이 반복적으로 high-side로 상승했다.
  - lower-mid / true-mid / high control은 안정적이다.
  - gate: `patch_ready`
- Axis 1:
  - `single direct role only`는 current contract상 high-side가 맞다.
  - `repeated adjacent only`는 low에 머무는 것이 구조상 설명된다.
  - gate: `guideline_first`
- Axis 2:
  - old mismatch 2건은 raw-object `major.category` shape를 쓰면 old `low / 40`이 재현된다.
  - gate: `repro_first`

### next action lock
- Axis 3는 calibration patch review round로 넘어가도 된다.
- Axis 1은 reviewer guideline 문장부터 고쳐라. 구현 drift로 몰지 말 것.
- Axis 2는 old raw payload / normalization snapshot 대조를 먼저 하라.

### reviewer guideline draft
- single direct role 1건은 추가 major support가 없어도 high-side 후보로 본다.
- repeated adjacent signal은 direct role 부재를 보완하지 못하므로 low 우선으로 본다.
- major-only는 mid 기본값으로 본다.
## 2026-04-05 Newgrad Certification Signal Audit + Coverage Gap Check

### confirmed
- certification input owner는 `src/components/input/NewgradTransitionLiteInput.jsx`다.
- normalization owner는 `buildNewgradTransitionLiteResult.js`이며 canonical alias 변환 없이 raw object array를 넘긴다.
- scoring owner는 `buildNewgradAxisPack.js > scoreDomainInterest()`다.
- current newgrad path에서 certification direct scoring 영향은 사실상 Axis 2 전용이다.

### important distinction
- input 존재 여부와 job-specific relevance 반영 여부를 분리해서 봐야 한다.
- cert ontology asset(`cert_catalog`, `cert_rules`, `role_cert_matrix`)이 있어도 current newgrad path가 그 자산을 직접 읽지 않으면 scoring coverage는 없는 것과 가깝다.

### coverage gap lock
- high severity
  - cloud / infra / devops
  - security / privacy / compliance
  - procurement / SCM / logistics
  - HR
- medium severity
  - finance
  - data
  - marketing
- note:
  - finance / data는 일부 UI coverage가 있으나 richer canonical asset과 role-specific weighting이 연결되지 않는다.

### next action
- 다음 라운드는 certification calibration batch를 바로 돌리기보다, cert-focused QA case를 UI-asset 기준과 canonical-asset 기준으로 나눠 실행하는 쪽이 안전하다.
## 2026-04-05 Axis 3 Calibration Patch Design Review

### confirmed reading
- Axis 3 exact owner block은 `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth(input)`다.
- 핵심 anchor는 아래 4개다.
  - `function scoreExecutionDepth(input) {`
  - `else if (evidenceGroupCount >= 2 && evidenceItemCount >= 3) base = 4;`
  - `const semanticLift = Math.min(2, projectOutcomeLift + durationLift);`
  - `return Math.min(5, base + semanticLift);`

### cause judgment
- 단일 threshold 문제로 보지 않는다.
- `project + internship` upper-mid 조합이 `base 4`를 열고, medium outcome / duration lift가 붙으며 `5`로 넘어가는 `mixed` 쪽이 더 그럴듯하다.

### patch options
- option A: base 4 threshold를 미세 상향
- option B: base 4 상태의 semantic lift 결합만 미세 조정
- option C: high 진입 guard / cap 추가

### recommended option
- `option B`
- 이유:
  - lower-mid / true-mid 안정 구간을 건드릴 위험이 가장 낮다.
  - true high control을 유지하면서 upper-mid inflation만 겨냥하기 쉽다.

### next round lock
- 다음 라운드는 Axis 3 only calibration patch apply review로 진행 가능
- apply 전 regression 기준:
  - `NG5A3-CASE-20260405-033`, `034`, `025`, `026` 하향 확인
  - `NG5A3-CASE-20260405-035`, `036` 유지 확인

## 2026-04-05 Newgrad Axis 3 Semantic Lift Micro-Calibration

### Decision
- Axis 3 patch owner는 `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth()`로 고정한다.
- 이번 라운드는 threshold 전체 조정이 아니라 semantic lift micro-calibration만 적용한다.
- option B를 택한 이유는 `base 4 + semantic lift` 결합부만 줄이는 것이 가장 보수적이기 때문이다.

### Exact Change
- `project + internship` 조합이면서 `base === 4`인 경우만 본다.
- `projectOutcomeLift < 2`이면 semantic lift를 1단계 감산한다.
- high outcome 기반 true high control은 guard 대상에서 제외한다.

### Preserved
- Axis 1 / Axis 2 / 다른 축 로직은 건드리지 않는다.
- threshold 조건식과 final cap/band conversion은 유지한다.
- UI / copy / consumer는 수정하지 않는다.

### Postcheck Docs
- calibration log: `05_Execution/Newgrad_Calibration_Log.md`
- postcheck QA log: `05_Execution/Accuracy_QA_Log.md`
- working memo: `docs/끄적.md`
- rollback/review 시 먼저 위 3개 문서를 본다.
## 2026-04-05 Newgrad Axis 3 Post-Patch Replay Lock

- Axis 3 patched owner는 여전히 `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth()`다.
- same engine harness `buildNewgradTransitionLiteResult(payload)`로 post-patch replay를 다시 돌렸다.
- target fixture 4건은 모두 `100/high -> 80/mid_high`로 내려왔다.
- true high 3건, stable mid 3건, low 2건은 모두 유지됐다.
- 새 narrative drift는 보이지 않았고, narrative는 `실제 인턴/산학협력 책임`에서 `특정 프로젝트 핵심 역할` 쪽으로 완화됐다.
- 다만 coarse 3-band 체감은 여전히 high 쪽이므로 최종 verdict는 `keep_with_watch`다.

### fixed regression fixtures
- inflation target
  - `NG5A3-CASE-20260405-025`
  - `NG5A3-CASE-20260405-026`
  - `NG5A3-CASE-20260405-033`
  - `NG5A3-CASE-20260405-034`
- true high preserve
  - `NG5A3-CASE-20260405-011`
  - `NG5A3-CASE-20260405-035`
- stable / low preserve
  - `NG5A3-CASE-20260405-022`
  - `NG5A3-CASE-20260405-015`

### next lock
- Axis 3 추가 수정 전에는 위 8건을 같은 harness로 먼저 재실행한다.
- Axis 1 / Axis 2는 이번 라운드에서 건드리지 않는다.
## 2026-04-05 Newgrad Axis 1 Reviewer Guideline Lock

- Axis 1 `jobStructure`는 current contract상 role directness를 가장 먼저 보는 축이다.
- `single direct role only`는 구현 이상이 아니라 current contract상 high-side 후보로 읽는 것이 맞다.
- `repeated adjacent only`는 direct role 부재를 메우지 못하므로 low 우선으로 읽는다.
- `major-only`는 low보다 mid 기본값으로 읽는다.
- `generic activity only`는 low cap으로 본다.

### reviewer lock
- direct role 1건을 과소평가하지 말 것
- adjacent 반복을 direct role과 동급으로 올려 읽지 말 것
- 전공 일치만으로 structural role fit을 과대추정하지 말 것
- Axis 1은 현재 `guideline_first`가 끝났고 verdict는 `guideline_locked`다.

### next handoff
- Axis 1은 locked guideline으로 유지하고, 다음 문서/실행 우선순위는 Axis 2 raw payload snapshot comparison 준비 여부다.
## 2026-04-05 Newgrad Axis 2 Raw Payload Snapshot Comparison

- Axis 2는 이번 라운드에서도 `repro_first` 원칙으로 봤다.
- old mismatch 재현 여부를 raw payload / normalized input / scorer consumption 3단으로 다시 비교했다.
- 핵심 충돌 후보는 `major object` 자체가 아니라 normalization 후 남는 `major` 문자열이다.
- `"컴퓨터공학"`, `"경영학"`처럼 label이 보존되면 `mid / 60`이 나온다.
- `{ category: "engineering_it", label: "" }`, `{ category: "business_economics", label: "" }`처럼 category code만 남으면 old `low / 40`이 same harness에서 재현된다.
- direct internship context control(`007`)은 string/object-category variant 모두 `mid / 60`으로 유지됐다.

### gate
- Axis 2 verdict: `contract_fix_candidate`
- 이유:
  - same normalized input 자체가 흔들리는 evidence는 아직 없다.
  - 현재는 scorer bug보다 raw -> normalized contract 차이가 더 유력하다.

### next handoff
- Axis 2는 patch review로 바로 가지 말고, `major` normalization / payload snapshot contract를 먼저 고정해라.
## 2026-04-05 Newgrad Certification Asset Expansion Priority Lock

- current newgrad cert state는 `UI hardcoded + canonical asset disconnected + Axis 2 heuristic only`로 요약된다.
- 즉, 지금 필요한 것은 scoring 변경보다 expansion priority를 먼저 잠그는 일이다.

### tier lock
- `tier_1_immediate`
  - `cloud`
  - `security`
  - `procurement_scm`
  - `HR`
- `tier_2_next`
  - `finance`
  - `data`
- `tier_3_later`
  - `marketing`

### why this order
- tier 1은 gap severity와 사용자 체감이 높고, canonical asset / role matrix 재사용성이 좋다.
- tier 2는 asset coverage는 비교적 좋아서 UI / mapping 정리 후 붙이는 편이 효율적이다.
- marketing은 cert 중요도와 scoring 영향도가 상대적으로 낮아 later가 맞다.

### next handoff
- 다음 cert round는 `cloud`, `security`부터 UI option shortlist와 canonical mapping crosswalk 초안으로 시작해라.
- weighting 연결은 그 다음 단계다.
## 2026-04-05 Newgrad Job-Specific Cert Weighting Contract Design

- job-specific cert weighting은 필요하지만, 지금 바로 apply하면 안 된다.
- current newgrad path는 cert ontology / role matrix와 직접 연결되지 않는다.
- 그래서 이번 라운드는 cloud/security 한정 conservative contract만 잠갔다.

### locked principles
- cert는 direct role / internship / project보다 약하다.
- cert only는 high를 만들지 않는다.
- unrelated cert는 zero 또는 near-zero로 본다.
- same-family multi-cert stacking에는 cap을 둔다.

### tier 1 sample focus
- cloud
  - `AWS SAA`, `CKA` 중심 `strong_support`
  - `AZ-104`, `GCP ACE`, `AWS SOA`는 `support`
- security
  - `ISMS-P`는 `strong_support`
  - `CPPG`, `CISSP`, `AWS Security Specialty`는 `support`
  - `CEH`는 `weak_support`

### gate
- readiness: `design_locked_waiting_for_linkage`
- next handoff:
  - 먼저 Axis 2 normalization / payload contract를 정리하고, 그 다음 cloud/security cert linkage phase 1로 넘어가라.

## 2026-04-05 Newgrad Cert Mapping Bridge / Apply Readiness Handoff

### 판단 로그
- 이번 라운드는 weighting apply보다 mapping bridge closure가 먼저다.
- 이유는 current newgrad UI cert input이 canonical cert key 없이 generic label만 내려보내고, current target job key도 role matrix key와 직접 맞지 않기 때문이다.
- cloud/security를 먼저 본 이유는 tier 1 priority이면서 catalog asset과 role matrix asset coverage가 가장 빨리 닫히기 때문이다.
- 이번 final judgment는 `design_locked_waiting_for_linkage`다.
- 이유는 설계 원칙은 충분히 잠겼지만, UI label bridge와 role linkage adapter가 아직 실제 경로로 닫히지 않았기 때문이다.

### 반복 실수 사전
- UI label만 보고 canonical match라고 오판하지 말 것.
- role matrix role key와 target job key를 같은 체계라고 가정하지 말 것.
- Axis 2 normalization 미정 상태에서 weighting apply를 먼저 붙이지 말 것.

### SSOT 지도
- UI cert option owner
  - `src/components/input/NewgradTransitionLiteInput.jsx`
- cert catalog owner
  - `src/lib/ontology/certs/cert_catalog.v0.json`
- role cert matrix owner
  - `src/lib/ontology/certs/role_cert_matrix.v0.json`
- readiness judgment / future apply 참고 문서
  - `docs/끄적.md`
  - `02_Product/Accuracy_QA/Newgrad_Transition_Lite_QA_Framework.md`
  - `05_Execution/Newgrad_Calibration_Log.md`

### next handoff
- 다음 라운드는 weighting 확대가 아니라 `cloud/security 한정 cert mapping bridge + JOB_* -> role:* adapter contract closure` 범위로 가라.

## 2026-04-05 Bridge Contract Closure Handoff

### 판단 로그
- mapping bridge contract closure가 apply보다 먼저인 이유는 현재 raw UI cert와 current target job taxonomy가 scorer가 바로 읽을 수 있는 canonical shape가 아니기 때문이다.
- cloud/security만 phase1 scope로 잠근 이유는 catalog asset과 role matrix asset coverage가 확인됐고, generic label 과매핑 리스크를 가장 좁게 통제할 수 있기 때문이다.
- insertion point를 `buildNewgradTransitionLiteResult.js` normalization 이후로 잠근 이유는 raw UI label 해석을 scorer 내부에 섞지 않고 producer-owned normalized field로 고정할 수 있기 때문이다.

### 반복 실수 사전
- generic raw label을 canonical cert로 과매핑하지 말 것.
- unresolved를 억지 해석해서 scorer에 반영하지 말 것.
- role adapter를 문자열 추론으로 만들지 말 것.
- helper owner를 scorer 내부로 섞지 말 것.

### SSOT 지도
- UI cert input owner
  - `src/components/input/NewgradTransitionLiteInput.jsx`
- cert mapping bridge owner
  - `src/lib/transitionLite/newgradCertMappingBridge.js` 후보
- role adapter owner
  - `src/lib/transitionLite/newgradRoleCertAdapter.js` 후보
- future phase1 apply read owner
  - `src/lib/analysis/buildNewgradAxisPack.js`
- 관련 문서 위치
  - `docs/끄적.md`
  - `02_Product/Accuracy_QA/Newgrad_Transition_Lite_QA_Framework.md`
  - `05_Execution/Newgrad_Calibration_Log.md`

### next handoff
- 다음 라운드는 `normalization contract fix -> helper 2개 구현 -> cloud/security limited apply read path` 순서로 가고, scope는 계속 cloud/security로 유지하라.

<!-- PASSMAP_CERT_NORMALIZATION_FIX_START -->
## 2026-04-05 Newgrad Cert Normalization Contract Fix

### Decision
- 이번 라운드는 cert weighting apply가 아니라 producer-owned normalization contract fix만 수행했다.
- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`에서 `buildNewgradAxisPack(validated.input)` 직전에 `validated.input.normalizedCertSelections`를 생산한다.
- scorer(`src/lib/analysis/buildNewgradAxisPack.js`)는 이번 라운드에서 그대로 두고 기존 `certificationsRaw` 읽기만 유지한다.

### Locked Scope
- 유지: UI 입력 방식, option 목록, `buildNewgradAxisPack.js` scoring 의미, full job family expansion.
- 미적용: `newgradCertMappingBridge.js`, `newgradRoleCertAdapter.js`, cloud/security phase1 weighting apply.
- intermediate field는 raw source 보존, item별 status 노출, unresolved/malformed 수용을 우선한다.

### Next Priority
- 다음 라운드 1순위는 `newgradCertMappingBridge.js`다.
- 이유는 현재 producer layer에 `normalizedCertSelections`가 생겼지만 canonical cert id를 안전하게 채우는 bridge가 아직 없어서 role adapter보다 먼저 raw UI label과 cert asset 사이의 exact mapping 안정화가 필요하기 때문이다.
<!-- PASSMAP_CERT_NORMALIZATION_FIX_END -->

<!-- PASSMAP_CERT_MAPPING_BRIDGE_PHASE1_START -->
## 2026-04-05 Newgrad Cert Mapping Bridge Phase1

### Decision
- 이번 라운드는 role adapter나 weighting apply가 아니라 producer-owned cert mapping bridge phase1만 수행했다.
- canonical mapping 책임은 `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`의 producer layer로 이동했다.
- phase1 범위는 cloud/security cert로 제한했고, scorer(`buildNewgradAxisPack.js`)는 건드리지 않았다.

### Locked Scope
- 유지: UI 입력 구조, `buildNewgradAxisPack.js`, role adapter, weighting apply.
- 성공 기준은 exact catalog canonical/alias 계열만 mapped 처리하는 보수적 bridge다.
- `cert_rules.v0.json`의 rules-only keyword는 성공 근거가 아니라 ambiguous 판정 보조로만 사용했다.

### Next Priority
- 다음 라운드 1순위는 `newgradRoleCertAdapter.js` 검토다.
- 이유는 producer intermediate에 phase1 `canonicalHint`, `mappingStatus`, `phase1RoleFamilies`가 생겨서 이제 raw label을 scorer가 직접 해석하지 않고도 limited read path 설계를 시작할 수 있기 때문이다.
<!-- PASSMAP_CERT_MAPPING_BRIDGE_PHASE1_END -->

<!-- PASSMAP_ROLE_CERT_ADAPTER_PHASE1_START -->
## 2026-04-05 Newgrad Role Cert Adapter Phase1

### Decision
- 이번 라운드는 weighting apply가 아니라 producer-owned role cert adapter phase1만 수행했다.
- canonical mapping을 다시 수행하지 않고 `normalizedCertSelections.items`의 `canonicalHint` / `mappingStatus` / `phase1RoleFamilies`를 target job relevance로 연결했다.
- phase1 explicit target job은 `JOB_IT_DATA_DIGITAL_DEVOPS_INFRA -> cloud`, `JOB_IT_DATA_DIGITAL_SECURITY -> security` 두 개로만 제한했다.

### Locked Scope
- 유지: `buildNewgradAxisPack.js`, weighting apply, UI, broader role-family expansion.
- relevance는 `direct_relevant`, `non_target`, `unsupported`, `malformed` 중심으로만 잠갔다.
- adjacent는 현재 근거가 약해서 이번 라운드에서는 열지 않았다.

### Next Priority
- 다음 라운드 1순위는 weighting apply limited read path 검토다.
- 이유는 producer가 이제 canonical mapping과 target job relevance routing을 둘 다 제공하므로 scorer는 raw label 해석 없이 이 intermediate만 제한적으로 읽을 수 있기 때문이다.
<!-- PASSMAP_ROLE_CERT_ADAPTER_PHASE1_END -->

<!-- PASSMAP_CERT_WEIGHTING_LIMITED_READ_PHASE1_START -->
## 2026-04-05 Newgrad Cert Weighting Apply Limited Read Path Phase1

### Decision
- 이번 라운드는 cert weighting apply limited read path phase1이었다.
- scorer는 raw label이 아니라 producer-owned `certRoleRelevancePack`만 읽게 바꿨다.
- cert는 secondary signal only 원칙을 유지했고, phase1 범위는 cloud/security의 `mapped + direct_relevant` item으로 제한했다.

### Locked Scope
- 유지: UI, full expansion, adjacent relevance, broader weighting redesign.
- stacking cap은 매우 보수적으로 1개 support count로 잠갔다.
- cert-only는 기존 Axis 2 ceiling(`max 2`)을 그대로 유지한다.

### Next Priority
- 다음 라운드 1순위는 calibration / QA execution이다.
- 이유는 limited read path는 열렸지만 실제 fixture에서 band drift가 없는지 먼저 확인해야 explanation copy alignment보다 안전하게 다음 단계를 열 수 있기 때문이다.
<!-- PASSMAP_CERT_WEIGHTING_LIMITED_READ_PHASE1_END -->

<!-- PASSMAP_MANUFACTURING_CERT_PRIORITY_PLAN_START -->
## 2026-04-05 Manufacturing Quality Cert Expansion Priority Planning

### Decision
- manufacturing_quality는 통짜 확장이 아니라 직무군별 rollout으로 여는 것이 맞다.
- 현재 ontology는 안전환경, 설비관리/유지보수, 생산기술, 공정기술, 생산관리, 품질관리(QC), 품질보증(QA), 제조혁신으로 이미 충분히 분해되어 있다.
- 반면 cert asset(`cert_catalog.v0.json`, `role_cert_matrix.v0.json`, `cert_rules.v0.json`)은 manufacturing 전용 coverage가 사실상 비어 있어 즉시 scorer 확장보다 우선순위와 자산 보강 대상을 먼저 잠그는 편이 안전하다.

### Locked Priority
- Tier 1: 안전/환경, 설비/공무/보전
- Tier 2: 생산기술/공정기술
- Tier 3: 생산관리/공정관리, 품질관리/품질보증/시험분석
- 이유는 direct relevance가 가장 선명한 자격증 묶음이 안전환경과 설비보전 쪽이고, 생산관리와 품질은 자격증 하나를 여러 세부 역할에 과대반영할 위험이 더 크기 때문이다.

### Risk Lock
- 산업안전기사와 위험물 계열은 제조 전반 공통 direct signal로 열면 안 된다.
- 안전환경에서는 direct 후보가 될 수 있지만 설비, 생산, 품질에는 supportive 또는 non-target로 남길 가능성이 더 높다.
- 품질경영기사, ISO 내부심사원, 6시그마 계열은 중요하지만 QC/QA/혁신/생산기술에 걸쳐 해석 범위가 넓어 phase1 첫 타자로 열기엔 보수적으로 접근해야 한다.

### Next Patch Candidate
- 다음 patch는 weighting 확장이 아니라 manufacturing cert asset coverage 보강이 먼저다.
- 먼저 catalog/rules/matrix에 안전환경과 설비보전 중심 cert를 좁게 추가한 뒤, 그 다음 manufacturing phase1 mapping bridge를 설계하는 순서가 안전하다.
<!-- PASSMAP_MANUFACTURING_CERT_PRIORITY_PLAN_END -->

<!-- PASSMAP_MANUFACTURING_TIER1_CERT_ASSET_EXPANSION_START -->
## 2026-04-05 Manufacturing Tier1 Cert Asset Coverage Expansion

### Decision
- 이번 라운드는 manufacturing Tier1 asset coverage expansion이다.
- 범위는 `ENVIRONMENT_HEALTH_SAFETY`와 `EQUIPMENT_MAINTENANCE`에만 한정했다.
- source code, mapping bridge, role adapter, weighting apply는 건드리지 않았다.

### Asset Lock
- `cert_catalog.v0.json`에 EHS/설비보전용 canonical cert entry를 추가했다.
- `cert_rules.v0.json`에는 exact title 중심 keyword만 추가했다.
- `role_cert_matrix.v0.json`에는 `role:mfg_ehs`, `role:mfg_equipment_maintenance` 두 family만 추가했다.
- 제조 전반 공통 direct는 열지 않았다.

### Boundary Lock
- 산업안전기사는 EHS direct substrate로만 넣었고 설비/생산관리/품질 direct는 열지 않았다.
- 위험물 기사/산업기사는 EHS에서도 `optionalPlus` 수준으로만 넣었다.
- 전기기사는 설비보전/유틸리티 direct substrate로만 넣었고 품질 direct는 열지 않았다.
- 품질/생산관리/공정기술 확장은 이번 라운드에서 보류했다.

### Next Priority
- 다음 라운드는 manufacturing phase1 mapping bridge 설계가 1순위다.
- 이제 Tier1 canonical asset과 matrix substrate가 생겼기 때문에 producer layer에서 exact mapping과 direct/supportive status contract를 좁게 설계할 수 있다.
<!-- PASSMAP_MANUFACTURING_TIER1_CERT_ASSET_EXPANSION_END -->

<!-- PASSMAP_AXIS1_RENDER_QUALITY_QA_START -->
## 2026-04-05 Newgrad Axis 1 Render Quality QA

### Decision
- 이번 라운드는 Axis 1 render quality QA였다.
- signal contract consistency fix 이후 실제 화면에서 summary/detail 문장이 더 잘 읽히는지 점검했고, 최소 범위의 copy tuning만 적용했다.
- scoring, signal shape, `getAxisScoreNarrative` fallback은 건드리지 않았다.

### Patch Scope
- `src/data/transitionLite/axisExplanationRegistry.js` 한 파일만 수정했다.
- `primaryEvidenceSource`를 summary 분기에 연결해 summary가 더 source-aware 하게 읽히도록 했다.
- detail에서는 presence echo가 강하던 문장 몇 개만 더 구체적이고 덜 반복적으로 바꿨다.

### Locked Outcome
- summary는 핵심 판단, detail은 근거 보강 역할을 더 분리했다.
- `internshipLinkType = industry_only`는 direct처럼 과장하지 않는 문장을 유지했다.
- Axis 2, scoring, consumer 구조, fallback narrative는 그대로 유지했다.

### Next Priority
- 다음 우선순위는 Axis 2 확장 판단이다.
- Axis 1은 richer signal을 실제 copy에 연결했을 때도 rendering quality가 무너지지 않는다는 점을 확인했으므로, 이제 Axis 2가 비슷한 확장을 받을 준비가 되었는지 조사할 수 있다.
<!-- PASSMAP_AXIS1_RENDER_QUALITY_QA_END -->
## 2026-04-05 newgrad Axis 2 safe patch update

### 상태
- Axis 2 append-only signal contract 적용 완료
- scoring owner는 그대로 `src/lib/analysis/buildNewgradAxisPack.js > scoreDomainInterest()`
- explanation owner는 그대로 `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradDomainInterestExplanation()`
- consumer `TransitionLiteResult.jsx` 수정 없음

### 이번 라운드 반영
- producer signal에 aligned/context-aware fields 추가
- builder가 `majorAligned`, `certificationsAligned`, `projectIndustrySupportCount`, `internContextStrength`, `contextAligned`를 우선 읽도록 수정
- `"산업 관련 프로젝트"` overclaim hotfix 포함
- summary가 약함/부족 톤일 때 gaps가 완전히 비는 케이스를 줄이도록 보완

### contract 체크
- append-only: 완료
- score/band/threshold 의미 변경: 없음
- consumer/UI 구조 변경: 없음

### 다음
- Axis 2 CASE A~F QA를 한 번 더 보고 이상 없으면 Axis 3 진입 가능
- 만약 cert-only / weak-only 문구 충돌이 남으면 Axis 2 copy tuning만 국소 추가
## 2026-04-05 Axis 2 render QA / Axis 3 precheck

### Axis 2 status
- producer append-only wiring 완료 상태는 유지
- render QA verdict는 `CONTRACT STILL THIN`
- 이유
  - builder는 새 signals를 읽고 있다
  - overclaim project copy는 제거됐다
  - 그러나 actual UI-visible option 재생에서 project weak support와 strong intern context가 기대대로 surface되지 않았다

### Axis 2 practical read
- common visible test input 기준
  - direct cert branch는 보였다
  - `majorAligned`는 좁게 잡혔다
  - `projectIndustrySupportCount`는 재현되지 않았다
  - internship context는 모두 `support`로 수렴했다
- 따라서 contract text 자체보다 scorer-side enum reachability를 다시 보는 편이 우선이다

### Axis 3 status
- precheck verdict는 `SIGNAL APPEND-ONLY UPGRADE NEEDED`
- score owner는 richer semantic lift를 계산하지만 builder는 count-only signals만 받는다
- low/mid case에서 summary/detail 충돌이 실제로 재현된다

### next entry point
- 1순위: Axis 2 reachability mismatch 재확인
- 2순위: Axis 3 append-only signal design
- Axis 2가 실제 UI payload 기준으로 안정화되기 전까지는 completed 상태로 닫지 않는다
## 2026-04-05 Axis 2 reachability lock / Axis 3 readiness

### current lock summary
- Axis 2 scorer reachability is not broken on the current UI path
- project weak-support branch is reachable
- internship strong-context branch is reachable
- major aligned branch is also reachable with existing major subcategory options

### interpretation correction
- previous Axis 2 concern was mainly replay mismatch, not upstream enum loss
- therefore Axis 2 should now be read as:
  - reachability: ok
  - explanation contract quality: separate topic

### Axis 3 readiness
- status: ready for Axis 3 append-only design
- reason: Axis 2 no longer blocks with an unresolved UI->normalization->scorer path issue

### next entry point
- next round: Axis 3 append-only signal design
- target owners
  - `buildNewgradAxisPack.js`
  - `axisExplanationRegistry.js`

## 2026-04-05 Newgrad 5-Axis Owner Investigation

- true owner 요약
  - Axis 1 `전공과 직무의 연결성`의 score/explanation producer owner는 `src/lib/analysis/buildNewgradAxisPack.js`와 `src/data/transitionLite/axisExplanationRegistry.js`다. 실제 입력은 `major`, `projects[].role`, `internships|partTimeExperience[].roleFamily`, `coursework`다.
  - Axis 2 `산업 연관성`의 score/explanation producer owner는 `src/lib/analysis/buildNewgradAxisPack.js`와 `src/data/transitionLite/axisExplanationRegistry.js`다. 실제 입력은 `major`, `certifications`, `projects[].type`, `internships|contractExperiences[].type|stakeholderType`, `targetIndustryId`다.
  - Axis 3 `유사한 경험이 있는가?`의 score/explanation producer owner는 `src/lib/analysis/buildNewgradAxisPack.js`와 `src/data/transitionLite/axisExplanationRegistry.js`다. 실제 입력은 `projects`, `internships`, `extracurriculars`, `partTimeExperience`, 추가로 `projects[].outcomeLevel`, `internships|partTimeExperience[].duration`이다.
  - Axis 4 `고객 커뮤니케이션 적합성`의 score/explanation producer owner는 `src/lib/analysis/buildNewgradAxisPack.js`와 `src/data/transitionLite/axisExplanationRegistry.js`다. 실제 입력은 `internships`, `projects`, `extracurriculars`, `partTimeExperience`, `workStyleNotes`, 추가로 `internships|partTimeExperience[].stakeholderType`이다.
  - Axis 5 `강점과 재능`의 score/explanation producer owner는 `src/lib/analysis/buildNewgradAxisPack.js`와 `src/data/transitionLite/axisExplanationRegistry.js`다. 실제 입력은 `strengths`, `workStyleNotes`, `targetJobId`다.
- UI owner 요약
  - 최종 렌더 owner는 `src/components/report/TransitionLiteResult.jsx`다.
  - 축 순서 consumer는 `axisPack.axes.jobStructure -> industryContext -> responsibilityScope -> customerType -> roleCharacter`를 고정 순서로 읽는다.
  - visible label 자체는 UI 하드코드가 아니라 `buildNewgradAxisPack.js`의 `makeAxis("<label>", ...)`에서 생성된 값을 그대로 쓴다.
  - 상세보기/보완포인트는 UI synthetic 생성이 아니라 `axis.explanation.summary / positives / gaps` payload 재사용이다.
- current overlap risk
  - Axis 1과 Axis 3 overlap risk는 높다. 둘 다 `projects`와 `internships`를 읽지만, Axis 1은 직무 역할 적합도 중심이고 Axis 3은 경험량/결과/기간 중심이다.
  - Axis 2와 Axis 4 overlap risk는 중간이다. 둘 다 `internships|contractExperiences`를 읽지만, Axis 2는 산업 맥락 신호, Axis 4는 상대한 대상과 소통 경험 신호를 본다.
  - Axis 4와 Axis 5 overlap risk는 중간이다. 둘 다 `workStyleNotes`를 읽지만, Axis 4는 소통 경험 보강 신호로만 쓰고 Axis 5는 강점/업무스타일 매칭의 core input으로 쓴다.
- next recommended design decision
  - true axis SSOT는 `src/lib/analysis/buildNewgradAxisPack.js`로 잠그고, label/score/signals 변경은 이 파일 기준으로만 다룬다.
  - explanation SSOT는 `src/data/transitionLite/axisExplanationRegistry.js`로 잠그고, UI copy 수정과 producer logic 수정을 분리한다.
  - Axis 1 vs Axis 3 경계 문서를 먼저 고정해 같은 `projects/internships`를 서로 다른 규칙으로 읽는 이유를 명문화한다.

## 2026-04-05 Newgrad 5-Axis Definition Boundary Lock

- current implemented axis meaning
  - Axis 1은 학업 배경과 역할 단서를 묶어서 직무 연결성을 읽는다.
  - Axis 2는 산업 관련 준비 신호와 일부 실무 맥락 단서를 묶어 읽는다.
  - Axis 3은 경험 수, 결과 수준, 기간을 묶어 실행 깊이를 읽는다.
  - Axis 4는 실제 상호작용 경험과 일부 self-report(`workStyleNotes`)를 함께 읽는다.
  - Axis 5는 self-report 성향(`strengths`, `workStyleNotes`)을 읽는다.
- recommended axis boundary
  - Axis 1: `직무 과업 연결성`
  - Axis 2: `산업 문법 접점`
  - Axis 3: `실행 깊이와 책임 경험`
  - Axis 4: `타인 상대 경험과 상호작용 적합성`
  - Axis 5: `개인 성향과 강점 적합성`
- highest-priority conflict pair
  - Axis 1 vs Axis 3
  - Axis 1은 role relevance만 남기고, outcome/duration/depth 계열 evidence는 Axis 3으로 보낸다.
- next single safe step
  - Axis 1 include/exclude evidence contract를 필드 단위로 먼저 확정한다.
## 2026-04-06 investigation lock - newgrad practical-experience engine / explanation / detail audit

### 조사 목적
- 실전 경험 입력이 `UI -> normalized payload -> scorer -> explanation payload -> [상세보기] render`까지 실제로 이어지는지 확인했다.

### engine / explanation / detail 3단계 요약
- engine 반영
  - Axis 1, 2, 3, 4에서 반영 확인
- explanation payload 반영
  - Axis 1, 2, 3, 4에서 반영 확인
- detail render 반영
  - Axis 1, 2, 3, 4에서 `summary + positives + gaps` 경로로 반영 확인
  - exact field label fidelity는 낮음

### true owner map 요약
- UI/state/payload owner: `src/components/input/NewgradTransitionLiteInput.jsx`
- submit owner: `src/App.jsx`
- normalize/result owner: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- score owner: `src/lib/analysis/buildNewgradAxisPack.js`
- explanation owner: `src/data/transitionLite/axisExplanationRegistry.js`
- detail render owner: `src/components/report/TransitionLiteResult.jsx`

### detail view 누락 포인트 요약
- consumer는 `explanation.summary`, `positives`, `gaps`, `selfReportSupportLine`만 렌더한다.
- `reasons[]`는 렌더하지 않는다.
- practical-experience exact selected value는 대부분 generic 문장으로 축약된다.

### taxonomy / asset 유무
- practical-experience 전용 taxonomy / registry / mapping asset은 확인되지 않았다.
- scorer 연결은 hardcoded set / map / exact string match 중심이다.

### 다음 라운드 설계 쟁점
- score에 쓰인 exact field value를 signal로 보존할지 여부
- explanation producer 축약 범위
- `reasons[]` 미표시를 detail loss로 볼지 여부
- project / internship / contract type taxonomy 부재
- role / roleFamily canonical mapping 부재
- stakeholder / duration / outcome contract 부재
## 2026-04-06 investigation lock - newgrad Axis 1 job major dependency precheck
### ??
- newgrad Axis 1(Job Fit)? job major dependency? ?? ?? true owner? scorer contract? ?? ???.
- ?? ???? ??/??? ????.
- source patch, UI patch, score change, copy change? ????.
### true owner lock
- Axis 1 score owner: src/lib/analysis/buildNewgradAxisPack.js > scoreJobFit()
- Axis 1 explanation owner: src/data/transitionLite/axisExplanationRegistry.js > buildNewgradJobFitExplanation()
- Axis 1 render owner: src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()
- visible ???? ??? producer payload ????.
- UI? xis.explanation.summary, positives, gaps, 
easons, experience*? render? ?? job-major ??? UI?? ?? ???? ???.
### current scorer contract lock
- major ?? ??? 
ormalized.major?? scorer ????? 
esolveNewgradAxis1MajorPrior(targetJobId, major)? ?? ase / override / final / label? ????.
- existing major verdict? ?? ????.
  - registry owner verdict: direct | adjacent | weak | mismatch
  - Axis 1 signal pass-through: ?? majorPriorLabel? ????.
- ?? Axis 1 local signal majorLinkType? ?? direct | none? ??? richer verdict owner? ???? ?????.
- role evidence owner? project/internship ???.
  - projects -> projectRoles
  - internships + part-time -> internshipRoleFamilies
  - scorer? _scoreRoleMatch()? direct(2) / adjacent(1) / none(0)? ????.
### ? registry ????
- ?? taxonomy ??? ?? ????? input canonicalization, option mapping, registry coverage, ?? prior registry?? ? ?? ????.
- ?? job major dependency registry? scorer owner ??? target job id ????? ?? ?? layer?? ?? ??? Axis 1 ??? ???? ? ??.
- ??? Round 2? ?? ??? ? ??? ?? taxonomy ??? ??? ??? major dependency registry ???.
### UI ??? ??
- visible explanation ??? true owner? scorer + explanation producer?.
- UI?? ?? high/low major ??? ??? ??? producer verdict? render copy? ???? drift? ???.
- ??? UI copy ???? ???? scorer payload pass-through? ?? ??? ??.
### hard floor ??
- ?? scoreJobFit()? major mismatch?? direct role evidence? ??? 4 ?? 5?? ??? ? ??.
- fallback??? project / internship / coursework? ??? ?? 2?? ????.
- high-major ???? mismatch? hard floor? ??? existing recovery contract? ?? Axis 3/?? ??? ??? ????.
### next safe patch entry
- ?? file candidate: src/data/transitionLite/jobMajorDependencyRegistry.js
- ?? ?? owner:
  - src/lib/analysis/buildNewgradAxisPack.js
  - src/data/transitionLite/axisExplanationRegistry.js
- src/components/report/TransitionLiteResult.jsx? ?? ?? ??? ?? ???. ?? pass-through consumer? ????.
## 2026-04-06 patch lock - newgrad Axis 1 job major dependency round

### 이번 라운드 구현 범위
- 신규 정책 자산을 `src/data/transitionLite/jobMajorDependencyRegistry.js`로 분리했다.
- score owner는 `scoreJobFit()`만 수정했다.
- explanation owner는 scorer signal 번역만 하도록 제한했다.
- UI는 `TransitionLiteResult.jsx` pass-through consumer로 유지했다.

### 왜 taxonomy 전체보다 registry를 먼저 잠갔는가
- 전공 taxonomy 전체 수정은 input option / normalization / prior registry까지 동시에 흔든다.
- 반면 job major dependency registry는 Axis 1 scorer owner 내부에서만 읽는 얇은 layer라 blast radius가 작다.

### 이번 라운드 lock
- high
  - `JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT`
  - `JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN`
  - `JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN`
- medium
  - `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS`
  - `JOB_BUSINESS_SERVICE_PLANNING`
- low
  - `JOB_HR_ORGANIZATION_HR_OPS`
  - `JOB_HR_ORGANIZATION_RECRUITING`
  - `JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT`
  - `JOB_SALES_B2B_SALES`
  - `JOB_SALES_B2C_SALES`
  - `JOB_SALES_GENERAL_SALES`
  - `JOB_SALES_SALES_OPERATIONS`
  - `JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS`
  - `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS`
  - `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS`
- 미등록 job fallback: `medium`

### canonical id 확인 방식
- canonical id는 추정하지 않고 아래 asset에서 교차 확인했다.
  - `src/data/transitionLite/jobTransitionReadMetaRegistry.js`
  - `src/data/transitionLite/JOB_RESPONSIBILITY_PROFILE_MAP.js`
  - `src/data/transitionLite/JOB_ROLE_WEIGHT_PROFILE_MAP.js`
  - `src/data/job/jobOntology.index.js`

### 다음 라운드 QA 포인트
- software direct 케이스는 current major prior상 `전자 / 전기`가 direct로 잡히고 `소프트웨어`는 adjacent로 잡힌다.
- high mismatch + strong project/intern recovery path가 유지되는지 계속 본다.
- low dependency 직무에서 major non-direct 문구가 치명적 톤으로 과장되지 않는지 본다.
- 미등록 job fallback medium이 기존 Axis 1 동작을 과도하게 훼손하지 않는지 본다.

## 2026-04-06 QA lock - newgrad Axis 1 job major dependency calibration review

### 지금까지 잠근 계약
- registry-first 유지
- scorer-only weighting 유지
- explanation translation-only 유지
- consumer pass-through 유지
- hard floor 금지
- major mismatch hopeless tone 금지
- low-major 과장 금지
- 미등록 canonical id fallback `medium` 유지

### 이번 QA 결과 요약
- score owner `scoreJobFit()`에서 existing verdict `direct | adjacent | weak | mismatch`를 그대로 재사용하는 구조를 확인했다.
- explanation owner는 registry를 재조회하지 않고 scorer signal만 읽는다.
- UI consumer는 여전히 `explanation.summary / positives / gaps / reasons` pass-through render 구조다.
- high mismatch + strong evidence recovery path는 실제로 살아 있다.
- low dependency 직무에서는 major non-direct가 치명적으로 말해지지 않는다.
- high adjacent는 `light_bonus`는 맞지만 체감이 다소 약하게 보이는 케이스가 있어 calibration review 후보로만 보류한다.

### 다음 라운드에서 바로 볼 포인트
- high adjacent 체감이 현재 너무 약한지 여부
- medium direct bonus가 충분한지 여부
- low tier direct를 score bonus 0으로 유지할지 여부
- `recoveryCeilingWithoutMajor`를 실제 policy로 둘 필요가 있는지 여부
- software/data 계열 direct major fixture를 formalize할지 여부

### 수정 금지선 재명시
- hard floor 금지
- UI 선패치 금지
- taxonomy 대공사 금지
- scorer owner 외 weighting 금지
- registry key 체계 변경 금지
## 2026-04-06 calibration candidate review - high adjacent / medium direct / fixture formalization

### 이번 라운드 목적
- immediate retune을 바로 여는 대신, patch 직후 QA 결과를 바탕으로 calibration candidate를 좁히는 데 집중했다.
- 현재 contract는 이미 lock되었다: registry-first, scorer-only weighting, explanation translation-only, consumer pass-through.
- 따라서 이번 라운드의 핵심은 정책을 다시 흔드는 것이 아니라, high adjacent와 medium direct가 실제로 retune 대상인지 아니면 fixture/해석 문제인지 분리 판정하는 것이었다.

### 이번 라운드 판정
- high adjacent: later candidate
  - 이유: 현재 weak 체감은 실제로 overlay 숫자 uplift 부족이라기보다 base branch가 낮게 시작하는 영향이 크다.
  - mechanical design + 산업공학 케이스에서 `adjacent -> light_bonus`는 policy대로 내려갔고, score는 2점이었다.
  - direct와 adjacent의 간격은 현재 충분히 벌어져 있다. adjacent를 성급히 올리면 direct와 구분이 흐려질 위험이 있다.
  - 다만 explanation positive 문장이 score 체감보다 약간 앞서 보일 수 있어, 다음 micro patch가 열린다면 copy strength를 미세 조정하는 정도가 가장 작다.
- medium direct: later candidate
  - 이유: data analysis / business service planning direct 케이스는 모두 `light_bonus`로 안정적으로 동작했다.
  - 전공 direct가 high tier처럼 score를 지배하지는 않았고, evidence가 없으면 3점(mid) 수준에서 멈췄다.
  - 초기 체감 불확실성의 일부는 fixture 품질 문제였다. direct major label을 prior registry가 실제로 인식하는 표기로 고정해야 한다.
- low tier: keep as-is
  - low mismatch는 neutral이고, low adjacent/direct도 과도한 bonus 없이 유지된다.
  - 지금 low tier를 다시 열 이유는 없다. 우선순위는 high adjacent 해석 안정화와 fixture formalization이다.

### 현재 calibration open items
- high adjacent가 실제 scoring issue인지, explanation 톤 issue인지 추가 분리 필요
- medium direct가 현행 `light_bonus`로 충분한지 fixture 고정 후 재평가 필요
- QA fixture를 문서 자산으로 formalize해 재실행 기준을 잠가야 함

### 다음 패치가 열린다면 가장 작은 수정 범위
- 1순위: `src/data/transitionLite/axisExplanationRegistry.js`에서 high adjacent positive copy 강도를 미세 조정하는 검토
- 2순위: `src/lib/analysis/buildNewgradAxisPack.js`에서 adjacent overlay 강도를 건드릴지 재검토
- 단, 둘 다 fixture formalization 이후에만 연다. 지금 즉시 retune은 보류한다.

### fixture formalization 최소안
- 추천 경로: `05_Execution/Newgrad_Axis1_JobMajorDependency_Fixtures.md`
- 케이스당 고정 항목
  - case id
  - targetJobId (canonical)
  - target job visible label
  - major label (prior registry가 인식하는 exact text)
  - project canonical role ids
  - internship canonical role ids
  - expected `jobMajorDependency`
  - expected `majorMatchLevel`
  - expected `majorWeightApplied`
  - expected score/band 범위 또는 qualitative expectation
  - known caveat
- 최소 core cases
  - A high direct
  - B high adjacent
  - C high mismatch + strong evidence
  - D medium direct
  - E medium mismatch + evidence
  - F low mismatch
  - G low adjacent/direct
  - H unregistered fallback

### 수정 금지선 재명시
- hard floor 금지
- UI 선패치 금지
- taxonomy 대공사 금지
- scorer owner 외 weighting 금지
- explanation 독자 추론 확대 금지
- registry key 체계 변경 금지

## 2026-04-17 Session Handoff — newgrad Axis 1 read path major-only 2차 정렬

### 무엇이 바뀌었나
- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` 1파일, 3개 FromPacks read path 함수 패치
- `buildNewgradWhyThisReadFromPacks()`: axis1 whyThisRead 항목에서 project/work 라벨 제거, majorLabel-only
- `buildInputEvidenceReadFromPacks()`: jobStructure item에서 axis1ProjectLabel/WorkLabel 제거, majorLabel-only
- `buildAxisReadSummaryFromPacks()`: summaryByAxis.jobStructure에서 project/work 라벨 제거, majorLabel-only

### 왜 바뀌었나
- 이전 라운드에서 comparisonBlock/explanation은 major-only로 정렬했으나, whyThisRead/inputEvidenceRead/axisReadSummary 경로에서 project/internship 신호가 축1 근거로 여전히 노출되고 있었다.
- producer 계약을 complete하게 major-only로 닫아야 consumer 변경 없이 전체 노출 경로가 정렬된다.

### 현재 상태
- newgrad Axis 1 (jobStructure) user-facing 노출 경로 전체 major-only 정렬 완료
  - comparisonBlock ✅
  - explanation ✅
  - whyThisRead ✅
  - inputEvidenceRead ✅
  - axisReadSummary ✅
- 점수 로직 (`scoreJobFit()` 등) 미수정
- `TransitionLiteResult.jsx` 미수정
- axis2~5 미수정

### 남은 리스크
- old version helper (`buildAxisReadSummary()`, `buildInputEvidenceRead()`)는 현재 런타임 미호출이나 동일 누수 패턴 잔존
- 빌드 자동화 검증 미완료 (사용자 환경 `npm run build` 필요)

### 다음 우선순위
- old version helper 정리 시점 판단 (지금 vs 호출 경로 생길 때)
- 사용자 환경 빌드 확인 후 read path 출력 점검
- 필요 시 Axis1 JobMajorDependency fixture 문서화 재개


---

## 2026-04-17 Round 6 — dependencyTier 조사 + _buildJobMajorImpactSummary mojibake 패치

### 조사 목적
1. dependencyTier 재분류 필요 구간 조사
2. 복수전공(secondMajor) 지원 여부 UI→payload→axis1 경로 확인
3. explanation signal→consumer 연결 상태 QA

### 확인된 사실

**dependencyTier owner 및 실제 영향**
- owner: `src/data/transitionLite/jobMajorDependencyRegistry.js > JOB_MAJOR_DEPENDENCY_REGISTRY`
- consumed at: `buildNewgradAxisPack.js > scoreJobFit() > _applyJobMajorDependencyToJobFit()`
- 실제 점수 변화: HIGH 티어만 영향 (direct +1, weak/mismatch+no-role-evidence -1). medium/low는 majorWeightApplied 레이블만 변경, 점수 무영향.
- 현재 등록 현황:
  - high (3): ENGINEERING_DEVELOPMENT_SOFTWARE, MECHANICAL_DESIGN, CIRCUIT_DESIGN
  - medium (2): IT_DATA_DIGITAL_DATA_ANALYSIS, BUSINESS_SERVICE_PLANNING
  - low (9): HR 3, SALES 4, CUSTOMER_OPERATIONS 2
  - DEFAULT medium: 나머지 전체 (FINANCE_ACCOUNTING, DESIGN, 나머지 IT_DATA_DIGITAL, RESEARCH, MARKETING 등)
- FINANCE_ACCOUNTING 직군이 HIGH tier 미등록으로 accounting/finance 전공의 direct 매칭 시 +1 보너스 누락. 별도 라운드에서 job ontology ID 확인 후 재분류 권장.

**복수전공 지원 상태**
- UI: `NewgradTransitionLiteInput.jsx`에서 "복수전공"은 `value: "other"` 드롭다운 서브 텍스트만 존재. 별도 secondMajor 입력 필드 없음.
- payload: secondMajor 키는 registry 외 어떤 파일에도 없음.
- resolver: `resolveNewgradAxis1MajorPriorBest()` 존재하나 active callsite 없음 (주석에 "Active callsite not yet wired" 명시). DEAD CODE.
- 복수전공 선택 시 DOUBLE_MAJOR → ALL_WEAK_PRIOR_MAP (전 직군 1, weak) 적용. 복수전공 선택이 오히려 불이익으로 작동하는 구조.
- explanation `major_double_selected` consumer 코드는 존재하나 resolutionMode="double_major"가 라이브 경로에서 생성 불가 → 영구 도달 불가.

**explanation signal→consumer QA**
- unknown_major_fallback: producer ✅ / consumer ✅ (문구 자연스러움)
- major_override_applied: producer ✅ / consumer ✅
- major_exception_adjusted: producer ✅ / consumer ✅
- major_double_selected: consumer 코드 존재하나 UNREACHABLE ⚠️
- majorImpactSummary (_buildJobMajorImpactSummary 출력): 6개 문자열 전부 EUC-KR mojibake → 이번 라운드에서 패치 완료 ✅

### 이번 라운드 패치 내용
- 파일: `src/lib/analysis/buildNewgradAxisPack.js`
- 함수: `_buildJobMajorImpactSummary()` (line 523)
- 내용: 6개 return 문자열 리터럴을 올바른 UTF-8 한글로 교체. 로직/브랜치/반환 구조 무변경.
- 검증: BOM(efbbbf) 유지 확인, LF 유지 확인, 한글 postcheck 통과.

### 남은 리스크
- FINANCE_ACCOUNTING 계열 직무 HIGH tier 미등록 — 직접 매칭 사용자의 +1 보너스 누락. 다음 라운드에서 job ontology ID 확인 후 append.
- 복수전공 live path 전체 미연결 — UI 신규 필드, payload key 추가, resolver callsite 변경 필요. 별도 라운드.
- `_jobFitExperienceSupportLine` (buildNewgradAxisPack.js ~line 2875) 내 '?' 패턴 문자열 존재. user-facing 경로 연결 여부 미확인.

### 다음 우선순위
- 1순위: FINANCE_ACCOUNTING / DESIGN 계열 job ID 확인 후 dependencyTier HIGH 등록
- 2순위: 복수전공 live path 최소 연결 (UI secondMajor 필드 → payload → resolveNewgradAxis1MajorPriorBest 호출)
- 3순위: `_jobFitExperienceSupportLine` '?' 패턴 user-facing 연결 여부 확인

### Guardrails (재확인)
- base matrix 전체 재작성 금지
- toPriorLabel 임계값(3/2/1/0) 변경 금지
- direct 남발 금지
- adjacent 구제 중심 유지
- 축1=전공 / 축3=경험 분리 유지

## 2026-04-19 SAFE INVESTIGATION ONLY - Axis1 미확정 3건 판정 확정
- 신규 코드 패치 없음. registry / tier / override / base matrix 변경 없음.
- 기준: 축1은 전공-직무 연결성만 본다. 경험 자산은 축3 담당이며, HIGH 승격으로 축1이 경험 축처럼 오염되면 안 된다.

### 최종 판정
- PRODUCTION_MANAGEMENT: C
  - current live path 기준 major prior는 MANUFACTURING_QUALITY_PRODUCTION base를 따른다.
  - INDUSTRIAL_ENGINEERING은 이미 direct(3)이고, BUSINESS_ADMIN은 weak(1), ELECTRICAL_ELECTRONIC / OTHER_ENGINEERING은 adjacent(2)다.
  - HIGH로 올리면 IE direct +1은 생기지만 weak/mismatch는 no-role-evidence 조건에서 -1이 걸려 과벌점 위험이 커진다.
  - job ontology 기준 역할 중심은 생산계획·통제, 현장 실행, 공정개선, 부서 조정이 혼합된 운영/조정형이며 전공 직결형 HIGH 직무로 고정하기 어렵다.
- MANUFACTURING_INNOVATION: C
  - current live path 기준 major prior는 MANUFACTURING_QUALITY_PRODUCTION base를 따른다.
  - INDUSTRIAL_ENGINEERING은 이미 direct(3)이며, 전기/기타 공학은 adjacent(2), BUSINESS_ADMIN은 weak(1)다.
  - HIGH로 올리면 direct 보너스보다 weak/mismatch 과벌점 리스크가 먼저 커진다.
  - job ontology 기준 역할 중심은 Lean/Six Sigma 개선, 스마트팩토리 디지털화, 표준화, transformation 전략까지 포함하는 개선/방법론/운영혁신형이라 축1 HIGH보다는 explanation/해석 관리가 맞다.
- MEDIA override (CONTENT_MARKETING, PR_COMMUNICATIONS): 정리 후보
  - override owner는 newgradAxis1MajorPriorRegistry.js의 MEDIA override 블록이다.
  - base matrix에서 MEDIA -> MARKETING이 이미 3(direct)이므로 +1 override 적용 전후 final은 모두 3으로 동일하다.
  - current live path에서는 실효성이 없는 no-op override다.

### owner summary
- major prior / base matrix / override owner: src/data/transitionLite/newgradAxis1MajorPriorRegistry.js
- dependencyTier owner: src/data/transitionLite/jobMajorDependencyRegistry.js
- live application owner: src/lib/analysis/buildNewgradAxisPack.js
- ontology 근거 owner:
  - src/data/job/ontology/manufacturing_quality_production/production_management.js
  - src/data/job/ontology/manufacturing_quality_production/manufacturing_innovation.js

### 운영 결정
- 이번 라운드는 구조 개편 라운드가 아니라 미확정 항목 제거 라운드로 종료한다.
- 즉시 patch 가능한 항목은 없음.
- PRODUCTION_MANAGEMENT / MANUFACTURING_INNOVATION은 C로 잠그고 explanation-only 검토 대상으로 넘긴다.
- MEDIA override는 no-op 정리 후보로 기록한다.
