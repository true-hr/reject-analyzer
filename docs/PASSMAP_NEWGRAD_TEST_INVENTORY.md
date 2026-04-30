# PASSMAP 신입 직무-산업 분석 테스트 인벤토리

> **SSOT**: 이 문서는 PASSMAP 신입(Newgrad) 직무-산업 분석 엔진의 테스트 현황을 추적하는 단일 정보 출처입니다.
>
> **최초 작성**: 2026-04-29
> **담당**: PASSMAP 분석 엔진팀

---

## 1. 문서 목적

이 문서는 다음 질문에 답하기 위한 SSOT입니다.

- **"이 케이스를 테스트했는가?"** → Status 컬럼 확인
- **"어디까지 검증되었는가?"** → Status + Last Checked 확인
- **"무엇이 남았는가?"** → Next Action + ISSUE_OPEN 케이스 확인
- **"핵심 회귀 케이스가 보호되고 있는가?"** → REGRESSION_LOCKED 케이스 확인

대상 분석 경로: `신입 모드(Newgrad)` → 직무-산업 분석 축(Axis1~Axis5) → 적합도 산출 → 인사이트 출력

런타임 코드 수정 금지 원칙에 따라, 이 문서는 **문서화 전용**입니다.
실제 fixture/test runner/분석 로직 변경은 후속 라운드에서 진행합니다.

---

## 2. Status Definition

| Status | 의미 |
|--------|------|
| `CANDIDATE` | 필요성이 발견된 케이스. 입력/기대 조건 미정의. |
| `SPEC_DEFINED` | 입력 조건, 기대 결과, 실패 조건이 문서화된 케이스. |
| `FIXTURED` | 재현 가능한 테스트 입력 데이터가 준비된 케이스. |
| `RUNNABLE` | 자동 runner에서 실행 가능한 케이스. |
| `PASSING` | 현재 엔진 기준 기대 조건을 통과한 케이스. |
| `ISSUE_OPEN` | 케이스는 유효하지만 현재 결과가 기대와 다른 케이스. |
| `REGRESSION_LOCKED` | 핵심 회귀 케이스로 잠근 케이스. 변경 시 반드시 재검증 필요. |
| `DEPRECATED` | 현재 구조와 맞지 않아 폐기/보류한 케이스. |

---

## 3. Priority Definition

| Priority | 의미 |
|----------|------|
| `P0` | PASSMAP 핵심 신뢰도를 좌우하는 케이스. 반드시 PASSING 또는 REGRESSION_LOCKED 상태여야 함. |
| `P1` | 자주 나올 가능성이 큰 대표 케이스. 일반 사용자 경험에 직접 영향. |
| `P2` | 특수하지만 누적 가치가 있는 케이스. 산업/직무 조합 다양성 확보에 기여. |
| `P3` | 보류/후순위 케이스. 현재 커버리지 달성 후 진행. |

---

## 4. Case ID 규칙

| 패턴 | 용도 | 예시 |
|------|------|------|
| `NG-INVARIANT-{축/패턴}-{번호}` | 축별 불변 조건 (과상승/과하락 방지) | `NG-INVARIANT-AXIS1-001` |
| `NG-JOB-{직무군}-{번호}` | 대표 직무군별 종합 케이스 | `NG-JOB-DATA-001` |
| `NG-TRANS-{출발직무}-{도착직무}-{번호}` | 특수 전환 케이스 | `NG-TRANS-CS-SERVICE-001` |
| `NG-IND-{산업민감도}-{번호}` | 산업 민감도 케이스 | `NG-IND-PHARMA-001` |
| `NG-EVID-{입력패턴}-{번호}` | 입력 패턴 케이스 (edge input) | `NG-EVID-CERTONLY-001` |
| `NG-CONTRACT-{번호}` | 엔진 계약 케이스 (외부 의존 인터페이스) | `NG-CONTRACT-001` |

---

## 5. 테스트 인벤토리

### 5-1. Axis Invariant 케이스

| Case ID | Category | Case Name | Priority | Status | Expected Invariant / Insight | Last Checked | Current Issue | Next Action |
|---------|----------|-----------|----------|--------|-------------------------------|--------------|---------------|-------------|
| NG-INVARIANT-AXIS1-001 | Invariant | 프로젝트 경험 → Axis1 과상승 방지 | P0 | FIXTURED | 프로젝트 경험만 있을 때 전공 연결성(Axis1)이 전공자 수준으로 과상승해서는 안 됨. axis1BandForbidden=[high,very_high]. uiInsightExpected 계약 axis explanation surface 기준으로 정정됨 | 2026-04-30 | uiInsightExpected 계약이 axisPack.axes.jobStructure.explanation.lead/scoreReason surface 기준으로 정정됨. dead fields(whyThisRead/topRepairSignals)는 visible target 제외. runner(run-newgrad-ui-insight-surface-smoke.mjs) 생성 완료, 미실행(node 미가용 환경) | runner 실행: node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs |
| NG-INVARIANT-AXIS3-001 | Invariant | 비전공자 관련 경험 → Axis3 반영 | P0 | FIXTURED | 비전공자라도 직무 관련 경험이 명확하면 Axis3(경험 연결성)이 very_low 금지. axis3BandForbidden=[very_low]. uiInsightExpected 계약 axis explanation surface 기준으로 정정됨 | 2026-04-30 | uiInsightExpected 계약이 axisPack.axes.responsibilityScope.explanation.lead/scoreReason surface 기준으로 정정됨. dead fields(whyThisRead/topRepairSignals)는 visible target 제외. runner(run-newgrad-ui-insight-surface-smoke.mjs) 생성 완료, 미실행(node 미가용 환경) | runner 실행: node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs |
| NG-INVARIANT-CERT-001 | Invariant | 자격증 단독 → 전체 적합도 과상승 방지 | P0 | FIXTURED | 자격증만 있을 때 Axis1/Axis3이 high/very_high 금지. topRepairSignals에 경험 보강 포인트 필수. uiInsightExpected 계약 axis explanation surface 기준으로 정정됨 | 2026-04-30 | uiInsightExpected 계약이 axisPack.axes.industryContext.explanation.lead/criteria surface 기준으로 정정됨. dead fields(whyThisRead/topRepairSignals)는 visible target 제외. runner(run-newgrad-ui-insight-surface-smoke.mjs) 생성 완료, 미실행(node 미가용 환경) | runner 실행: node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs |
| NG-INVARIANT-SELF-001 | Invariant | 자기보고 강함 → Axis5 외 축 과상승 방지 | P0 | FIXTURED | strengths+workStyleNotes만 있을 때 Axis1/Axis3이 high/very_high 금지. roleCharacter(Axis5) 기여는 허용. uiInsightExpected 계약 axis explanation surface 기준으로 정정됨 | 2026-04-30 | uiInsightExpected 계약이 axisPack.axes.roleCharacter.explanation.lead/scoreReason surface 기준으로 정정됨. dead fields(whyThisRead/topRepairSignals)는 visible target 제외. runner(run-newgrad-ui-insight-surface-smoke.mjs) 생성 완료, 미실행(node 미가용 환경) | runner 실행: node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs |
| NG-INVARIANT-AXIS2-001 | Invariant | 관련 자격증 복수 보유 → Axis2 정상 범위 | P1 | CANDIDATE | 동일 직무 관련 자격증 3개 이상 보유 시 Axis2가 1.0 초과하지 않아야 함 | - | - | SPEC_DEFINED 승격 필요 |
| NG-BOUNDARY-MAJOR-001 | Invariant | 경영학 전공 + 서비스기획 → WEAK_MAJOR 오발화 방지 | P0 | FIXTURED | 경영학은 서비스기획 major prior="direct"(3) → WEAK_MAJOR_STRONG_RELEVANT_PROJECT 미발화. jobStructure.lead에 "전공 연결성 제한적" 계열 문구 미노출 계약. shouldNotMention 간접 검증. | 2026-04-30 | - | PASSING (runner 9 PASS, Round E-1) |

### 5-2. 대표 직무군 케이스

| Case ID | Category | Case Name | Priority | Status | Expected Invariant / Insight | Last Checked | Current Issue | Next Action |
|---------|----------|-----------|----------|--------|-------------------------------|--------------|---------------|-------------|
| NG-JOB-SERVICE-001 | Job | 비전공 + 서비스기획 + 프로젝트 강함 | P1 | FIXTURED | 프로젝트 2개+인턴 1개 조합 → Axis3 low 이하 금지. Axis1 high/very_high 금지. uiInsightExpected: jobStructure.lead(전공 제한)+responsibilityScope.lead/scoreReason(경험 재구성) surface 기준으로 정정됨 | 2026-04-30 | uiInsightExpected 계약이 jobStructure/responsibilityScope explanation lead/scoreReason surface 기준으로 정정됨. dead fields(whyThisRead/topRepairSignals)는 visible target 제외. runner(run-newgrad-ui-insight-surface-smoke.mjs) 생성 완료, 미실행(node 미가용 환경) | runner 실행: node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs |
| NG-JOB-DATA-001 | Job | 비전공 + 데이터분석 + ADsP/SQLD만 있음 | P1 | FIXTURED | ADsP/SQLD 보유+경험 없음 → Axis3 high/very_high 금지. uiInsightExpected: industryContext.lead/scoreReason+responsibilityScope.lead surface 기준으로 정정됨 | 2026-04-30 | uiInsightExpected 계약이 industryContext/responsibilityScope explanation lead/scoreReason surface 기준으로 정정됨. dead fields(whyThisRead/topRepairSignals)는 visible target 제외. runner(run-newgrad-ui-insight-surface-smoke.mjs) 생성 완료, 미실행(node 미가용 환경) | runner 실행: node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs |
| NG-JOB-ACCOUNTING-001 | Job | 회계/세무 전공 + 경험 약함 | P1 | SPEC_DEFINED | 전공 적합도는 높으나 실무 경험이 부족한 경우 종합 적합도가 전공 프리미엄만으로 상위권에 오르지 않아야 함. 경험축 낮음 명시 | 2026-04-29 | - | fixture 생성 |
| NG-JOB-MKT-001 | Job | 콘텐츠/SNS 경험 + 마케팅 지원 | P1 | SPEC_DEFINED | SNS/콘텐츠 경험이 마케팅 직무 관련성으로 인정되어 Axis3에 기여. 전공 무관. 종합 적합도 "보통~적합" 범위(0.45~0.65) | 2026-04-29 | - | fixture 생성 |
| NG-JOB-HR-001 | Job | 심리/경영 전공 + HR 지원 | P1 | SPEC_DEFINED | 심리 또는 경영학과 전공이 HR 직무 Axis1에 기여. 경험 약해도 전공 연결성 프리미엄이 적절히 반영됨 | 2026-04-29 | - | fixture 생성 |
| NG-JOB-RESEARCH-001 | Job | 이공계 전공 + 연구직 지원 | P2 | CANDIDATE | 이공계 전공 + 연구 경험 없음 시 연구직 적합도 평가 | - | - | SPEC_DEFINED 승격 필요 |

### 5-3. 특수 전환 케이스

| Case ID | Category | Case Name | Priority | Status | Expected Invariant / Insight | Last Checked | Current Issue | Next Action |
|---------|----------|-----------|----------|--------|-------------------------------|--------------|---------------|-------------|
| NG-TRANS-CS-SERVICE-001 | Transition | CS 경험 → 서비스기획 전환 | P1 | FIXTURED | CS 인턴 6개월 → Axis4 very_low 금지, Axis3 high/very_high 금지. uiInsightExpected: customerType.lead/scoreReason+responsibilityScope.lead/scoreReason surface 기준으로 정정됨 | 2026-04-30 | uiInsightExpected 계약이 customerType/responsibilityScope explanation lead/scoreReason surface 기준으로 정정됨. dead fields(whyThisRead/topRepairSignals)는 visible target 제외. runner(run-newgrad-ui-insight-surface-smoke.mjs) 생성 완료, 미실행(node 미가용 환경) | runner 실행: node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs |
| NG-TRANS-QA-RA-001 | Transition | 품질관리 → RA(인허가) 전환 | P2 | SPEC_DEFINED | 품질관리 경험이 RA 직무에 부분 전이될 수 있음. 산업 민감도(제약/의료)가 반드시 고려되어야 함 | 2026-04-29 | - | fixture 생성 |
| NG-TRANS-SALES-MKT-001 | Transition | 영업 → 마케팅 전환 | P1 | SPEC_DEFINED | 영업 인턴/파트타임 경험이 마케팅 직무 Axis3에 부분 기여. 전환 거리가 "근접" 범위에 해당해야 함 | 2026-04-29 | - | fixture 생성 |
| NG-TRANS-PROD-PROC-001 | Transition | 생산관리 → 구매/조달 전환 | P2 | SPEC_DEFINED | 생산관리 경험이 구매/조달 직무에 SCM 연계로 인정. 전환 거리 "보통" 범위 | 2026-04-29 | - | fixture 생성 |
| NG-TRANS-PUBLIC-PLANNING-001 | Transition | 공공기관 행정 → 민간 기획 전환 | P2 | SPEC_DEFINED | 공공 행정 경험이 민간 기획 직무에서 일부 인정되나 문화/방식 차이로 전환 거리 "보통~먼" 범위에 위치해야 함 | 2026-04-29 | - | fixture 생성 |

### 5-4. 산업 민감도 케이스

| Case ID | Category | Case Name | Priority | Status | Expected Invariant / Insight | Last Checked | Current Issue | Next Action |
|---------|----------|-----------|----------|--------|-------------------------------|--------------|---------------|-------------|
| NG-IND-PHARMA-001 | Industry | 제약/의료 산업 민감도 | P1 | SPEC_DEFINED | 제약/의료 지원 시 관련 전공(생명과학, 약학, 의학) 또는 자격증 없이 적합도 상위권 산출 금지. 산업 민감도 페널티 반드시 적용 | 2026-04-29 | - | fixture 생성 |
| NG-IND-FINANCE-001 | Industry | 금융/보험 산업 민감도 | P1 | SPEC_DEFINED | 금융 지원 시 금융 관련 자격증(투자자산운용사, CFA, AFPK 등) 없이 종합 적합도가 상위권에 오르지 않아야 함 | 2026-04-29 | - | fixture 생성 |
| NG-IND-IT-001 | Industry | IT/소프트웨어 산업 민감도 | P2 | CANDIDATE | IT 직무 지원 시 개발 경험/포트폴리오 없이 전공만으로 상위 적합도 도달 여부 | - | - | SPEC_DEFINED 승격 필요 |

### 5-5. 입력 패턴 케이스

| Case ID | Category | Case Name | Priority | Status | Expected Invariant / Insight | Last Checked | Current Issue | Next Action |
|---------|----------|-----------|----------|--------|-------------------------------|--------------|---------------|-------------|
| NG-EVID-LONGTEXT-001 | Input | 긴 자기소개 + 구조화 근거 약함 | P1 | SPEC_DEFINED | 자기소개 텍스트 길이가 길어도 구체적 근거(직무명, 수치, 결과)가 없으면 Axis5 이외 점수 상승이 제한되어야 함 | 2026-04-29 | - | fixture 생성 |
| NG-EVID-MAJORONLY-001 | Input | 전공만 있고 경험 없음 | P0 | SPEC_DEFINED | 전공만 있고 경험 없는 신입의 경우 전공 연결 직무 적합도가 "보통 미만" 범위(≤ 0.45)에 위치. 전공만으로 상위 적합도 금지 | 2026-04-29 | - | fixture 생성 |
| NG-EVID-CERTONLY-001 | Input | 자격증만 있고 경험/전공 없음 | P0 | SPEC_DEFINED | 자격증만 있고 전공/경험 없을 때 종합 적합도가 0.45 이하여야 함. 자격증 단독 상향 방지 | 2026-04-29 | - | fixture 생성 |
| NG-EVID-DUPLICATE-001 | Input | 같은 경험 여러 필드 중복 입력 | P1 | SPEC_DEFINED | 동일 경험이 인턴십/프로젝트/수상 등 여러 필드에 중복 기재된 경우 중복 카운팅 없이 한 번만 반영되어야 함 | 2026-04-29 | - | 중복 감지 로직 존재 여부 확인 필요 |
| NG-EVID-EMPTY-001 | Input | 모든 필드 최소 입력 | P1 | CANDIDATE | 전공/경험/자격증 모두 최소값이거나 미입력 시 엔진이 오류 없이 동작하고 최하 범위 결과를 반환해야 함 | - | - | SPEC_DEFINED 승격 필요 |

---

## 6. Case Detail Template

새 케이스를 추가할 때 아래 템플릿을 사용합니다.

```markdown
### {Case ID}: {Case Name}

| 항목 | 내용 |
|------|------|
| **Case ID** | {NG-xxx-xxx-001} |
| **Case Name** | {케이스 이름} |
| **Category** | {Invariant / Job / Transition / Industry / Input} |
| **Priority** | {P0 / P1 / P2 / P3} |
| **Status** | {CANDIDATE → ... → REGRESSION_LOCKED} |

**Purpose**
> 이 케이스가 검증해야 하는 것과 그 이유.

**Input Conditions**
- 전공: {전공명 또는 "없음/비관련"}
- 경험: {인턴/프로젝트/수상 요약}
- 자격증: {목록 또는 "없음"}
- 자기소개: {텍스트 수준 요약: 짧음/보통/긺, 구조화 여부}
- 지원 직무: {직무명}
- 지원 산업: {산업명 또는 "미지정"}

**Expected Result**
- 종합 적합도: {범위 또는 조건}
- 축별 기대값: Axis1={}, Axis2={}, Axis3={}, Axis4={}, Axis5={}
- 핵심 인사이트 문구 조건: {포함/미포함 키워드}

**Failure Conditions**
- [ ] {이 조건이 충족되면 테스트 실패}
- [ ] {추가 실패 조건}

**Current Issue**
> 현재 결과가 기대와 다른 경우 상세 기술. 없으면 "-".

**Next Action**
> 다음 단계: fixture 생성 / runner 연결 / 엔진 수정 요청 / REGRESSION_LOCKED 승격 등.
```

---

## 7. 운영 규칙

### 상태 승격 기준

1. **CANDIDATE → SPEC_DEFINED**: 입력 조건, 기대 결과, 실패 조건이 이 문서에 작성됨
2. **SPEC_DEFINED → FIXTURED**: 재현 가능한 테스트 입력 데이터 객체(JSON/JS fixture)가 생성됨
3. **FIXTURED → RUNNABLE**: 자동 runner(Vitest 등)에서 실행 가능한 상태로 연결됨
4. **RUNNABLE → PASSING**: 현재 엔진 기준 기대 조건을 모두 통과함
5. **PASSING → REGRESSION_LOCKED**: P0 케이스 또는 핵심 흐름 케이스 중 안정적으로 통과 확인 후 잠금
6. **임의 상태 → ISSUE_OPEN**: 결과가 기대와 다름이 발견된 경우 즉시 표시

### 갱신 규칙

- 새 케이스 발견 시 반드시 `CANDIDATE`로 먼저 등록 (기대 결과 없이 추가 금지)
- 상태 변경 시 **Last Checked** 날짜와 **Next Action** 반드시 갱신
- ISSUE_OPEN 케이스는 Current Issue에 증상을 구체적으로 기술
- 관련 패치 적용 후 `docs/COMM_PATCH_NOTES.md`에도 한 줄 기록

### 우선순위 규칙

- **P0 케이스**는 모든 스프린트에서 PASSING 또는 REGRESSION_LOCKED 유지 필수
- ISSUE_OPEN 상태의 P0 케이스가 있으면 다른 기능 개발보다 선순위 처리
- P3 케이스는 P0~P2가 모두 RUNNABLE 이상일 때 착수

---

## 8. 이번 라운드의 한계

이번 작업(2026-04-29)은 **테스트 현황 관리 문서 생성까지만** 합니다.

- 실제 fixture 파일 생성 → **후속 라운드**
- test runner 연결 (Vitest 등) → **후속 라운드**
- 분석 로직 수정 → **후속 라운드**
- 현재 모든 케이스는 수동 검토 기반으로 SPEC_DEFINED 또는 CANDIDATE 상태

---

## 9. 변경 이력

| 날짜 | 작업 | 담당 |
|------|------|------|
| 2026-04-29 | 초기 문서 생성. 대표 직무군 5종, 특수 전환 5종, Axis invariant 5종, 산업 민감도 3종, 입력 패턴 5종 등 총 23개 케이스 초기 등록 | Claude |
| 2026-04-29 | P0 핵심 케이스 7개 fixture 후보 생성 (scripts/regression/newgrad-core-invariant-cases.js). NG-INVARIANT-{AXIS1,AXIS3,CERT,SELF}-001, NG-JOB-{SERVICE,DATA}-001, NG-TRANS-CS-SERVICE-001 → FIXTURED 승격. runner 연결은 후속 라운드. | Claude |
| 2026-04-29 | P0 7개 fixture에 uiInsightExpected UI-visible explanation 계약 추가. headlineShouldMention/bodyShouldMention/shouldNotMention/toneRules/userFriendlySummary 정의. runner/UI/분석 로직 변경 없음. Status FIXTURED 유지. | Claude |
| 2026-04-30 | P0 7개 fixture의 uiInsightExpected를 실제 화면 도달 surface(axisPack.axes.{axisKey}.explanation.lead/scoreReason 등) 기준으로 정정. dead field(whyThisRead/topRepairSignals) visible target 제외. | Claude |
| 2026-04-30 | P0 7개 fixture의 axis explanation surface 계약을 실제 VM 출력과 대조하는 smoke runner 생성(scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs). runner 미실행(node 미가용 환경). 7개 케이스 Next Action 갱신. | Claude |
