# PASSMAP Analysis Compatibility Contract

작성일: 2026-04-29
단계: Phase 0.5 — 공통화 안전 계약 문서화 + 테스트 기준 설계
상태: LOCKED (코드 수정 전 기준선)

---

## 1. 결론

다음 원칙은 이후 모든 공통화 작업에서 변경 불가 기준으로 적용한다.

- **통합 금지**: PASSMAP의 세 분석 계열(신입/경력/서류탈락)은 하나의 공통 scoring engine으로 통합하지 않는다.
- **공통화 범위 고정**: 공통화 대상은 taxonomy read, display label, alias resolver, context read adapter, evidence signal shell에 한정한다. 그 외는 계열별로 독립 유지한다.
- **데이터 공유 / 판정 분리**: 세 계열은 같은 taxonomy 자료를 읽을 수 있지만, 판정 목적과 scoring 의미는 분리 유지한다.
- **read-only/no-score 계약**: shared layer는 read-only, no-score 계약을 기본으로 한다.
- **score/gate/band/CTA 변경 금지**: shared layer output이 직접 score, riskLevel, gate, band, CTA를 바꾸면 안 된다.

---

## 2. 분석 계열별 목적 차이

### 신입 직무·산업 분석

- **목적**: 희망 직무/산업에 대한 준비도, 연결성, 보완 방향 판단
- **핵심 신호**: 전공, 프로젝트, 인턴, 자격증, 자기보고 기반의 "준비도 / 연결성"
- **판정 기준**: Axis1(직무 연결성), Axis2(산업 이해도), Axis3(경험 연결성), Axis4(성장/목표), Axis5(준비 행동)
- **독자**: 사회초년생, 취준생 — 실패 진단이 아니라 방향 점검
- **금지**: 서류탈락 리스크처럼 해석하지 않기. "결격"이나 "탈락 가능"이라는 판정 언어 사용 금지

### 경력 직무·산업 분석

- **목적**: 현재 직무/산업에서 목표 직무/산업으로 이동할 때의 전환 난이도 / 적합성 판단
- **핵심 신호**: current role → target role transition, 산업 이동 거리, 역할 유사도, 경력연속성
- **판정 기준**: classifyTransition(), roleDistance, mobilityRisk, bandLabel
- **독자**: 이직/전환을 고려하는 경력자 — 실제 JD 없이 "전환 추정"
- **금지**: 실제 JD/resume 직접 매칭 결과처럼 해석하지 않기. precise analysis 결과와 혼용 금지

### 서류탈락원인 분석

- **목적**: 실제 JD/resume 근거 기반 탈락 가능 원인 판단
- **핵심 신호**: JD 요구사항 직접 매칭, 이력서 근거 유무, must/miss gap, keyword coverage, career/evidence gap
- **판정 기준**: buildCompositeRisk(), buildMustRequirementsGapRisk(), buildExperienceLevelGapRisk()
- **독자**: 구체적인 공고를 앞두고 이력서 점검이 필요한 지원자
- **금지**: taxonomy 추정값으로 탈락 리스크를 직접 바꾸지 않기. 신입/경력 분석 맥락의 문장 혼용 금지

---

## 3. 공통화 허용 영역

| 영역 | 허용 수준 | 허용 이유 | 수정 가능 후보 파일 | 주의사항 |
|------|-----------|-----------|---------------------|----------|
| job canonical id / label / alias | read / display only | 세 계열 모두 직무명 표시 및 해석에 동일 taxonomy 필요 | `src/data/job/jobLookup.index.js`, `src/data/job/jobOntology.index.js` | scoring 연결 절대 금지 |
| industry canonical id / label / alias | read / display only | 산업 label / sector / subsector 표시 공통화 | `src/data/industry/industryRegistry.index.js`, `src/data/industry/industryCompoundResolver.js` | compound 과매칭 주의 — subsector 하나에 복수 sector가 매칭되지 않도록 |
| display label builder | read / display only | UI / PDF / report fallback 중복 감소 가능 | 신규 shared utility 후보 (예: `src/lib/shared/resolveDisplayLabel.js`) | 기존 각 계열의 fallback 로직 제거 금지. 신규 utility는 추가용, 기존 경로 유지 |
| job / industry context adapter | read-only / no-score | 직무 설명, 산업 맥락 보조 텍스트 공유 가능 | `src/lib/adapters/buildJobContext.js`, `src/lib/adapters/buildIndustryContext.js` | score input으로 승격 금지. context 텍스트는 표시용으로만 사용 |
| evidence signal shell | schema only | 경험 / 성과 / 자격 / 커뮤니케이션 신호명 공유 가능 | 신규 adapter 후보 (예: `src/lib/shared/evidenceSignalShell.js`) | analyzer별 weight / threshold는 분리 유지. 공통 schema는 signal 이름과 source 분류만 |

---

## 4. 공통화 금지 영역

| 금지 영역 | 금지 이유 | 잘못 합치면 생기는 문제 | 관련 파일 / anchor |
|-----------|-----------|--------------------------|-------------------|
| 신입 Axis1 scoring (직무 연결성) | 전공-직무 연결성은 major prior가 핵심 — JD 없는 추정형 | JD/resume mismatch처럼 과도하게 해석됨. 준비도 판단이 탈락 진단으로 변질 | `src/lib/analysis/buildNewgradAxisPack.js` |
| 신입 Axis2 scoring (산업 이해도) | 산업 이해도는 신입 준비도 맥락 — 학습/경험 기반 | 경력 산업전환 risk 또는 서류탈락 keyword risk와 혼동. 다른 독자에게 다른 의미 | `src/lib/analysis/buildNewgradAxisPack.js`, `src/data/transitionLite/axisExplanationRegistry.js` |
| 신입 Axis3 scoring (경험 연결성) | 경험 연결성은 준비도 신호 — 인턴/프로젝트 기반 | 경력 achievement gap 또는 precise evidence gap과 섞이면 결격처럼 보임 | `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` |
| 경력 transition scoring | current→target 추정형 판정 — 실제 이력서 없이 역할 거리 계산 | 실제 이력서/JD 매칭처럼 과장됨. 서류탈락 리스크와 혼용 시 과진단 | `src/lib/transitionLite/classifyTransition.js`, `src/lib/transitionLite/buildTransitionLiteResult.js` |
| 서류탈락 risk scoring | JD/resume direct evidence 기반 — 실제 텍스트 매칭 | taxonomy 추정으로 탈락 사유 왜곡. must/miss gap이 추정값 기반이 되면 신뢰도 손상 | `src/lib/decision/index.js`, `src/lib/preciseAnalysis/buildCompositeRisk.js`, `src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js` |
| report conclusion copy | 독자 / 목적이 다름 — 같은 문장이 다른 분석에서 다른 뜻 | 신입에게 경력 전환 문장 노출, 또는 서류탈락 문장이 신입 보고서에 섞임 | `src/data/transitionLite/axisExplanationRegistry.js`, `src/lib/analysis/buildReportPack.js` |
| CTA / consulting copy | 후속 행동 맥락이 계열별로 다름 | 신입 맥락에서 경력 전환 상담 CTA 노출. 서비스 신뢰도 하락 | `src/components/report/TransitionLiteResult.jsx`, `src/components/input/PreciseAnalysisFlow.jsx` |
| band label | score domain이 계열별로 다름 — 같은 label이 다른 의미 | "높음" / "낮음" 밴드가 신입 준비도 맥락과 탈락 리스크 맥락에서 혼용되면 사용자 혼란 | `src/lib/preciseAnalysis/buildCompositeRisk.js`, `src/lib/transitionLite/buildTransitionLiteResult.js` |

---

## 5. Shared Layer 계약

### 5-1. Shared Taxonomy Read Layer 계약

이 계약은 `src/data/job/`, `src/data/industry/` 기반의 read-only 조회에만 적용된다.

**허용 입력**:
- job id (canonical 또는 raw selection)
- industry id (canonical 또는 raw selection)
- ui selection string
- raw label string (alias fallback 용)

**허용 출력**:
- canonical id
- display label (한국어 표기 기준)
- aliases (배열)
- sector / subsector
- confidence (resolver 매칭 신뢰도, 0-1)
- warnings (과매칭 또는 미매칭 경고)

**금지 출력** (이 필드가 shared layer에서 나오면 계약 위반):
- score, riskLevel, gate, band, recommendation, CTA, message

---

### 5-2. Display Label Builder 계약

**허용 입력**:
- canonical item (id + label + aliases)
- raw fallback string (매칭 실패 시)

**허용 출력**:
- 안전한 display label (빈 문자열 / undefined 없음, mojibake 없음)

**금지**:
- 분석 결론 생성 (예: "적합", "부적합", "준비 부족")
- 점수 보정 또는 score 반환
- side effect (상태 변경, 로깅 이외)

---

### 5-3. Read-only Context Adapter 계약

파일 후보: `src/lib/adapters/buildJobContext.js`, `src/lib/adapters/buildIndustryContext.js`

**허용 입력**:
- resolved job item (canonical id + label)
- resolved industry item (canonical id + sector)

**허용 출력**:
- role summary (역할 개요 텍스트)
- job scope (직무 범위 설명)
- industry context (산업 특성, 구매/고객/가치사슬 맥락)
- customer context
- typical career path (참고용)

**금지**:
- scoring weight 부여
- 탈락 리스크 부여
- must/miss gap 판정
- 분석 계열 간 결론 혼용

---

### 5-4. Evidence Signal Shell 계약

신규 파일 후보: `src/lib/shared/evidenceSignalShell.js` (Phase 1 이후)

**허용 입력**:
- project entry (제목, 기간, 역할)
- internship entry
- certification entry
- self-report trait
- resume/JD evidence string

**허용 출력**:
- normalized signal name
- source type (project / internship / cert / self-report / jd-evidence / resume-evidence)
- confidence (signal 인식 신뢰도)
- raw evidence reference (원문 참조)

**금지**:
- analyzer 공통 점수 산출
- 계열 간 cross-scoring
- 각 analyzer의 weight / threshold 공유

---

## 6. 회귀 테스트 기준

Phase 1 Shared Taxonomy Read Layer 적용 전후에 아래 테스트 묶음이 모두 통과해야 한다.

| 테스트 묶음 | 목적 | 기준 | 관련 파일 |
|-------------|------|------|-----------|
| **Newgrad Axis Snapshot** | 신입 Axis1~5 score / label / copy 불변 | shared layer 추가 전후 동일 출력. 소수점 변화도 허용 안 함 | `src/lib/analysis/buildNewgradAxisPack.js`, `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` |
| **Experienced Transition Snapshot** | 경력 topRisks / classification / fit rows 불변 | shared layer 추가 전후 동일 출력 | `src/lib/transitionLite/classifyTransition.js`, `src/lib/transitionLite/buildTransitionLiteResult.js` |
| **Precise Risk Snapshot** | 서류탈락 top risk / composite band / risk detail 불변 | shared layer 추가 전후 동일 출력 | `src/lib/preciseAnalysis/buildCompositeRisk.js`, `src/lib/decision/index.js` |
| **Taxonomy Label Snapshot** | canonical / display label 불변 | 빈 label 없음 / mojibake 없음 / 과매칭 없음 | `src/data/job/jobLookup.index.js`, `src/data/industry/industryRegistry.index.js` |
| **Alias Negative Fixture** | alias 과매칭 방지 | 유사하지만 다른 직무/산업이 매칭되지 않음을 입력 fixture로 보장 | `src/data/industry/industryCompoundResolver.js` |
| **Report VM Contract** | UI / PDF / print field 유지 | 기존 fallback 유지. 필드명 변경 없음 | `src/lib/analysis/buildReportPack.js` |
| **PDF/Print Contract** | printable model 유지 | 기존 필드명 깨지지 않음 | `src/lib/analysis/buildReportPack.js`, `src/components/pdf/` |

---

## 7. Phase 1 진입 조건

다음 조건을 모두 충족해야 Phase 1 Shared Taxonomy Read Layer로 진입할 수 있다.

1. **Snapshot 기준 준비**: 신입 / 경력 / 서류탈락 각각의 최소 snapshot fixture가 작성되어 있어야 한다.
2. **read-only/no-score 준수**: shared layer는 read-only / no-score 필드만 반환해야 한다.
3. **기존 resolver export 보존**: 기존 resolver export를 제거하지 않아야 한다. 신규 shared utility는 추가 전용.
4. **기존 fallback 보존**: 기존 UI / PDF / report fallback을 제거하지 않아야 한다.
5. **scoring/gate 비접촉**: Phase 1에서는 아래 파일의 scoring / gate 로직을 수정하지 않아야 한다.
   - `src/lib/analysis/buildNewgradAxisPack.js`
   - `src/lib/transitionLite/buildTransitionLiteResult.js`
   - `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
   - `src/lib/analyzer.js`
   - `src/lib/decision/index.js`

---

## 8. Phase 1 후보 설계

Phase 1을 실제로 진행한다면 아래 방향으로만 진행한다.

### Phase 1. Shared Taxonomy Read Layer

**목적**: job / industry id, label, alias, exact-first resolver만 read-only 공통화

**수정 가능 후보 파일**:
- `src/data/job/jobLookup.index.js` — 공통 read API 추가 (기존 export 유지)
- `src/data/job/jobOntology.index.js` — 공통 canonical id 조회 추가
- `src/data/industry/industryRegistry.index.js` — 공통 sector/subsector read 추가
- `src/data/industry/industryCompoundResolver.js` — alias resolver read 보강
- 신규 파일 후보: `src/lib/shared/resolveDisplayLabel.js` (display label builder)

**수정 절대 금지 파일**:
- `src/lib/analysis/buildNewgradAxisPack.js` — scoring 변경 금지
- `src/lib/transitionLite/buildTransitionLiteResult.js` — scoring 변경 금지
- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` — scoring 변경 금지
- `src/lib/analyzer.js` — analyze scoring / gate 변경 금지
- `src/lib/decision/index.js` — risk / gate 변경 금지

**테스트 기준**:
- label snapshot 동일 (전후 완전 일치)
- alias negative overmatch 없음 (fixture 기반 검증)
- 신입 / 경력 / precise 결과 불변

---

## 9. 다음 작업용 요약 (Next Claude Prompt Summary)

Phase 1 시작 전 반드시 읽어야 할 내용:

```
1. 이 문서(PASSMAP_ANALYSIS_COMPATIBILITY_CONTRACT.md) §5 shared layer 계약 확인
2. 수정 가능 후보: jobLookup.index.js / jobOntology.index.js / industryRegistry.index.js / industryCompoundResolver.js
3. 신규 파일만 추가 가능: src/lib/shared/ 하위 (기존 파일 변경 시 snapshot 회귀 위험)
4. 금지 파일: buildNewgradAxisPack.js / buildTransitionLiteResult.js / buildNewgradTransitionLiteResult.js / analyzer.js / decision/index.js
5. shared layer 출력 필드에 score, riskLevel, gate, band, recommendation, CTA 절대 포함 금지
6. 기존 fallback/resolver export 제거 금지 — 추가만 허용
7. Phase 1 진입 조건(§7) 모두 체크 후 진입
8. snapshot fixture가 없으면 먼저 fixture 작성 후 진입
9. label 변경 시 mojibake postcheck 필수 (한글 샘플 3줄 재확인)
10. 의심스러운 alias 과매칭 발견 시 즉시 중단 보고
```

---

## Phase 2A 연결 현황 (2026-04-29)

### 연결된 파일

| 파일 | 연결 내용 | 연결 유형 |
|---|---|---|
| `src/lib/shared/taxonomy/readTaxonomyTarget.js` | `resolveDisplayLabel` → named export 승격 | shared utility 공개 |
| `src/lib/adapters/buildJobContext.js` | `buildJobContext()` 반환에 `displayLabel` 추가 | Level A read-only |
| `src/lib/adapters/buildIndustryContext.js` | `buildIndustryContext()` 반환에 `displayLabel` 추가 | Level A read-only |

### 계약 준수 확인

- score/gate/risk 변경: 없음 ✅
- 기존 `label` 필드 변경: 없음 (병렬 추가만) ✅
- 기존 resolver export 제거: 없음 ✅
- 기존 fallback 제거: 없음 ✅

---

## Phase 2B 연결 현황 (2026-04-29)

### 연결된 파일

| 파일 | 연결 내용 | 연결 유형 |
|---|---|---|
| `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` | 반환 블록에 `targetJobDisplayLabel`, `targetIndustryDisplayLabel` 추가 | Level A read-only |
| `src/lib/transitionLite/buildTransitionLiteResult.js` | 최종 return에 `targetJobDisplayLabel`, `targetIndustryDisplayLabel` 추가 | Level A read-only |

### scoring boundary 확인

| 파일 | scoring 경계 위치 | 연결 위치 | 판정 |
|---|---|---|---|
| `buildNewgradTransitionLiteResult.js` | L1839 `buildPhase1CertRoleRelevancePack(targetJobItem?.label)` — scoring input | L1921-1922 반환 블록 (scoring 이후) | Level A ✅ |
| `buildTransitionLiteResult.js` | L3118-3120 `classifyTransition` / `buildDiscriminatorPack` / `pickTransitionLiteRiskKeys` | L3153-3160 최종 return (scoring 이후) | Level A ✅ |

### 계약 준수 확인

- score/gate/risk 변경: 없음 ✅
- 기존 `label` / `targetIndustryLabel` / `meta.targetJobLabel` 변경: 없음 (병렬 추가만) ✅
- scoring boundary 이전 코드 변경: 없음 ✅
- 기존 fallback 제거: 없음 ✅
- 4개 regression runner 결과: 모두 PASS (11+11+4+17) ✅

---

## Phase 3A 연결 현황 (2026-04-29)

### 신규 파일

| 파일 | 연결 내용 | 연결 유형 |
|---|---|---|
| `src/lib/shared/taxonomy/buildTaxonomyContextPack.js` | `buildJobContext` + `buildIndustryContext` 결과를 context pack으로 래핑; `roleSummary` / `valueChain` / `customerContext` / `purchaseContext` 보조 필드 추가 | Level A helper only |
| `scripts/regression/run-taxonomy-context-pack-smoke.mjs` | Phase 3A smoke runner 27개 케이스 | 테스트 전용 |

### 계약 준수 확인

- score/gate/risk 변경: 없음 ✅
- 기존 `buildJobContext` / `buildIndustryContext` export 변경: 없음 ✅
- 기존 fallback 제거: 없음 ✅
- 기존 소비부 연결: 없음 (Level A only) ✅
- 금지 출력 필드(score, rawScore, risk, riskLevel, gate, band, pass/fail, transitionDifficulty, recommendation, CTA, suitability, rejectionReason) 미포함 ✅
- 5개 runner 결과: 모두 PASS (11+11+4+17+27) ✅
- 4개 regression runner 전후 결과 동일 ✅
