# PASSMAP 분석 Snapshot Baseline

작성일: 2026-04-29
단계: Phase 0.6 — SAFE TEST BASELINE + DOC ONLY
관련 문서: `docs/PASSMAP_ANALYSIS_COMPATIBILITY_CONTRACT.md`

---

## 1. 목적

Phase 1(Shared Taxonomy Read Layer 패치)에 진입하기 전, 세 분석 계열(신입 / 경력 / 서류탈락)의 현재 출력 형태를 고정(freeze)한다.

- 공통화 패치 전후에 핵심 출력이 변하지 않음을 검증하는 기준선(baseline)으로 사용한다.
- 점수 값의 하드코딩이 아닌 **방향성(directional) 기준**으로 freezing한다.
- 신입 분석의 테스트 공백을 명시하여 Phase 1 진입 전 보강 여부를 결정한다.

---

## 2. 현재 테스트 자산 지도

| 분석 계열 | 핵심 실행 파일 | 전용 테스트 러너 | 상태 |
|---|---|---|---|
| 신입 직무·산업 분석 | `src/lib/transitionLite/buildNewgradAxisPack.js` | **없음** | ⚠ 공백 |
| 경력 직무·산업 분석 | `src/lib/transitionLite/buildTransitionLiteResult.js`<br>`src/lib/transitionLite/classifyTransition.js` | `scripts/regression/run-transition-lite-regression.mjs` (8 cases)<br>`scripts/transitionLiteGoldSetEval.mjs` (gold fixtures) | ✅ 커버됨 |
| 서류탈락원인 분석 | `src/lib/analyzer.js`<br>`src/lib/decision/index.js` | `tests/integration/domainMismatchSmoke.test.mjs` (4 cases)<br>`test_dataset.passmap.v1.json` + testEngine.js | 🔶 부분 커버 |

### 보조 자산

| 파일 | 내용 | 계열 |
|---|---|---|
| `scripts/regression/transition-lite-cases.js` | 8개 회귀 케이스 + 방향성 expectations 정의 | 경력 |
| `scripts/regression/transition-lite-evaluator.js` | 다층 평가기 | 경력 |
| `docs/ssot/axis1-gold-fixtures-v1.md` | Axis1(전환 방향 점수) gold fixtures (Group 1–4+) | 경력 |
| `src/lib/transitionLite/classifyTransition.testdata.md` | 10개 testdata 케이스 (문서) | 경력 |
| `tests/fixtures/mismatch/` | JD 5개 + resume 5개 txt 파일 | 서류탈락 |
| `docs/transitionLite/newgrad-axis4-qa-cases.md` | 신입 Axis4 QA 케이스 (문서 전용) | 신입 |
| `docs/transitionLite/newgrad-axis4-stakeholder-fit-design.md` | 신입 Axis4 설계 문서 | 신입 |

---

## 3. 최소 Snapshot 기준

### 3-1. 신입 직무·산업 분석 Snapshot

**핵심 파일**: `src/lib/transitionLite/buildNewgradAxisPack.js`

**현황**: 전용 코드 기반 테스트 러너 없음. 문서 기반 QA 케이스만 존재.

**동결 기준 (문서 기반)**:

| 출력 필드 | 동결 기준 |
|---|---|
| `axisScores` 객체 존재 여부 | 공통화 후에도 axisScores 키 보존 |
| Axis 1–4 각 점수 타입 | number 타입 유지 (값 변경 허용, 타입 변경 금지) |
| `topRisks` 배열 존재 여부 | 배열 형식 유지 |
| `certRelevance` / `certList` (있을 경우) | 키 보존, null 허용 |
| `fitSummary` 문자열 존재 여부 | 비어있지 않은 문자열 |

**공백 선언**: `buildNewgradAxisPack.js` 에 대한 자동화 회귀 테스트가 없다. Phase 1 진입 전 최소 러너(3–5 케이스) 작성이 권장되나 Phase 0.6에서는 생성하지 않음 — 입출력 shape 확인 후 별도 태스크로 진행.

---

### 3-2. 경력 직무·산업 분석 Snapshot

**핵심 파일**: `buildTransitionLiteResult.js`, `classifyTransition.js`

**동결 케이스**: `scripts/regression/transition-lite-cases.js` case-1 ~ case-8

**동결 필드**:

| 필드 | 동결 기준 |
|---|---|
| `classification.jobDistance` | 동일 값 유지 (near / moderate / far) |
| `topRisks` 키 목록 | 공통화 후 동일 키 집합 출력 |
| `topRisks` 중복 없음 | noDuplicateTopRisks = true |
| `fit` 배열 행 구조 | fit 행의 키 스키마 변경 금지 |
| 현직/목표 직무·산업 label | 공통 taxonomy 패치 후 label 값 변경 없음 |
| 인접 케이스(case-1)의 risky flag | false 유지 |
| 원거리 케이스의 RISK_INDUSTRY_CONTEXT_SHIFT 포함 | preferredTopRiskKeys 충족 |

**기존 러너 실행 방법**:
```
node scripts/regression/run-transition-lite-regression.mjs
```

---

### 3-3. 서류탈락원인 분석 Snapshot

**핵심 파일**: `src/lib/analyzer.js`, `src/lib/decision/index.js`

**동결 케이스**: `tests/integration/domainMismatchSmoke.test.mjs` 4 cases

| 케이스 | 시나리오 | 동결 방향성 기준 |
|---|---|---|
| Case 1: seniority mismatch | JD 5년+ 팀 리드 / resume 1.5년 운영 지원 | composite band ≠ PASS (mismatch 감지) |
| Case 2: must-have missing (SQL) | JD SQL 필수 / resume SQL 미언급 | top risk에 must-requirement gap 포함 |
| Case 3: role mismatch | JD 경영전략 기획 / resume 전략소싱(구매) | role mismatch 감지 |
| Case 4: domain shift | JD B2B SaaS 마케팅 / resume 오프라인 리테일 | domain shift 감지 |

**동결 필드**:

| 필드 | 동결 기준 |
|---|---|
| `compositeBand` 값 방향성 | mismatch 케이스에서 PASS 반환 금지 |
| `topRisks[0].title` | 빈 문자열 금지 |
| `mustRequirementGap` 존재 여부 | Case 2에서 gap 감지 필수 |
| `keywordCoverage` 타입 | number (0–1) 유지 |

**기존 러너 실행 방법**:
```
node tests/integration/domainMismatchSmoke.test.mjs
```

---

## 4. 공통화 전후 불변 기준

Phase 1 Shared Taxonomy Read Layer 패치 후에도 다음 항목은 변하지 않아야 한다.

| 분류 | 불변 항목 | 변경 허용 항목 |
|---|---|---|
| 신입 | axisScores 키 구조, topRisks 배열 형식 | 내부 가중치, label 문자열 |
| 경력 | jobDistance 값, topRisks 키 집합, fit 행 스키마 | industry label 문자열(taxonomy 정규화 후) |
| 서류탈락 | compositeBand 방향성, topRisks[0].title 존재 | 세부 점수값, keyword list |
| 공통 | score / riskLevel / gate / band 필드 변경 금지 | read-only 조회 경로 추가 허용 |

---

## 5. Alias Negative Fixture 기준

공통 taxonomy 패치에서 alias 정규화가 일어날 때, 존재하지 않는 alias가 유효 job/industry로 통과되면 안 된다.

**Negative 조건**:

| 테스트 입력 | 기대 결과 |
|---|---|
| `jobId: "JOB_NONEXISTENT_ALIAS_XYZ"` | 분석 결과 null 또는 명시적 오류 (PASS 반환 금지) |
| `industryId: "IND_FAKE_SECTOR_ABC"` | 동일 — 유효 industry로 통과 금지 |
| `currentJobId = targetJobId`, 두 jobId 모두 미등록 | topRisks 빈 배열 또는 오류 (허위 리스크 생성 금지) |

**현재 상태**: alias negative fixture 자동화 케이스 없음 — Phase 1 이전에 `scripts/regression/transition-lite-cases.js`에 추가 케이스로 확보 권장.

---

## 6. Fixture 파일 생성 여부

| 구분 | 생성 여부 | 사유 |
|---|---|---|
| 경력 분석 추가 fixture JSON | 미생성 | 기존 8-case regression이 충분. 구조 명확하나 Phase 0.6 범위 초과 |
| 서류탈락 분석 fixture JSON | 미생성 | mismatch txt 파일 5쌍 이미 존재. 추가 JSON fixture 필요성 낮음 |
| 신입 분석 fixture JSON | 미생성 | `buildNewgradAxisPack.js` 입출력 shape 미확인 — 확인 후 별도 태스크 |
| `tests/fixtures/analysis-compatibility/` 디렉터리 | 미생성 | 기존 fixture 디렉터리 구조로 충분. 신규 계층 불필요 |
| `scripts/regression/run-analysis-compatibility-baseline.mjs` | 미생성 | 신입 runner 없이 공통 baseline runner 구성 불완전 |

**판단**: Phase 1 진입 조건 달성에 신규 fixture 파일 생성은 필수가 아님. 기존 경력/서류탈락 러너를 Phase 1 패치 후 재실행하여 동결 기준 충족 여부를 확인하는 것으로 충분.

---

## 7. Phase 1 진입 조건 업데이트 Checklist

- [ ] `docs/PASSMAP_ANALYSIS_COMPATIBILITY_CONTRACT.md` 존재 확인 ✅
- [ ] 경력 분석 회귀 테스트 GREEN (8 cases pass): `node scripts/regression/run-transition-lite-regression.mjs`
- [ ] 서류탈락 분석 스모크 테스트 GREEN (4 cases pass): `node tests/integration/domainMismatchSmoke.test.mjs`
- [ ] 신입 분석 최소 러너 작성 OR 공백 위험 수용 결정 (공백 수용 시 Phase 1 에서 buildNewgradAxisPack.js 수정 금지 재확인)
- [ ] Phase 1 패치 대상 파일이 `docs/PASSMAP_ANALYSIS_COMPATIBILITY_CONTRACT.md` Section 7 금지 파일 목록에 없음을 확인
- [ ] alias negative fixture (job/industry 미등록 입력) 대응 케이스 경력 runner에 추가 OR 공백 수용 결정

---

## 8. Phase 1 프롬프트 금지사항

Phase 1(Shared Taxonomy Read Layer) 패치 요청 시 다음 사항을 **명시적으로 금지**한다.

1. **score 필드 변경 금지** — 신입/경력/서류탈락 어떤 계열도 score 산출 로직 수정 불가
2. **gate / band / riskLevel 변경 금지** — 공통화 패치에서 판정 로직 접근 금지
3. **recommendation / CTA 변경 금지** — 출력 텍스트 생성 로직 수정 금지
4. **buildNewgradAxisPack.js 내부 수정 금지** — 신입 분석은 전용 러너 확보 전까지 수정 금지
5. **기존 regression runner 케이스 삭제·수정 금지** — 케이스 추가만 허용
6. **taxonomy 패치가 label 문자열을 바꾸는 경우** — 경력 분석 `classification.jobDistance` 값이 함께 바뀌지 않음을 반드시 확인
7. **3파일 초과 수정 금지** — Phase 1도 DIRECT PATCH MODE 적용 (max 3 files per task)

---

## Phase 0.6R 보완 결과

업데이트: 2026-04-29 Phase 0.6R — SAFE DOC CORRECTION + NEWGRAD BASELINE INVESTIGATION

### 1. COMM_PATCH_NOTES append-only 검증

| 항목 | 결과 |
|---|---|
| 기존 내용 보존 여부 | ✅ 모든 기존 항목 보존됨 (유실 없음) |
| Phase 0.6 항목 최초 위치 | 파일 상단 (prepend 상태) |
| Phase 0.6 항목 정리 후 위치 | 파일 하단 (append-only 형태) |
| append-only 규칙 명시 | ✅ 파일 최상단에 HTML comment로 명시 |
| 유실/덮어쓰기 의심 여부 | 없음 |

향후 `COMM_PATCH_NOTES.md`에 항목을 추가할 때는 반드시 파일 **하단**에 추가해야 한다. 파일 최상단에 명시된 규칙:
```
<!-- APPEND-ONLY 원칙: 새 항목은 반드시 파일 하단에 추가. 상단 prepend 금지. -->
```

---

### 2. 신입 분석 baseline runner 조사 결과

| 항목 | 결과 |
|---|---|
| 직접 실행 가능한 builder | `buildNewgradTransitionLiteResult` (src/lib/transitionLite/buildNewgradTransitionLiteResult.js) |
| 필요한 최소 input | `{ targetJobId: string, targetIndustryId: string }` — 나머지 필드 모두 선택 |
| DOM/window 의존성 | 없음 — 모든 import가 순수 JS 데이터/로직 파일 |
| Node.js 실행 가능 여부 | 가능 (기존 경력 runner와 동일 패턴) |
| output frozen fields 접근 | 가능 — `vm.axisPack.axes.{key}.score/band`, `vm.targetIndustryLabel`, `vm.transitionReadBlock.meta.targetJobLabel`, `vm.topRepairSignals` |
| runner 생성 여부 | ✅ 생성됨 |
| runner 파일 경로 | `scripts/regression/run-newgrad-axis-baseline.mjs` |
| 실행 명령 | `node scripts/regression/run-newgrad-axis-baseline.mjs` |

---

### 3. 신입 분석 최소 frozen fields

| Field | 동결 목적 | 확인 방식 |
|---|---|---|
| targetJobLabel | taxonomy label 회귀 감지 | runner (`vm.transitionReadBlock.meta.targetJobLabel`) |
| targetIndustryLabel | taxonomy label 회귀 감지 | runner (`vm.targetIndustryLabel`) |
| Axis1 score/band (jobStructure) | 전공-직무 연결성 불변 | runner (`axisPack.axes.jobStructure`) |
| Axis2 score/band (industryContext) | 산업 이해도 불변 | runner (`axisPack.axes.industryContext`) |
| Axis3 score/band (responsibilityScope) | 경험 연결성 불변 | runner (`axisPack.axes.responsibilityScope`) |
| Axis4 score/band (customerType) | 고객 커뮤니케이션 적합성 불변 | runner (`axisPack.axes.customerType`) |
| Axis5 score/band (roleCharacter) | 강점과 재능 불변 | runner (`axisPack.axes.roleCharacter`) |
| topRepairSignals 배열 타입 | 보강 포인트 구조 불변 | runner (배열 여부 검증) |

Axis 키 매핑:
- Axis1 = `jobStructure` (전공-직무 연결성)
- Axis2 = `industryContext` (산업 이해도)
- Axis3 = `responsibilityScope` (경험 연결성)
- Axis4 = `customerType` (고객 커뮤니케이션)
- Axis5 = `roleCharacter` (강점과 재능)

---

### 4. Phase 1 진입 가능 여부 업데이트

**판정: 조건부 가능**

근거:
- 경력 분석: 기존 8-case regression runner 존재 → GREEN 확인 후 진입 가능
- 서류탈락 분석: 기존 4-case smoke runner 존재 → GREEN 확인 후 진입 가능
- 신입 분석: runner 생성됨(Phase 0.6R). Phase 1 진입 전 아래 수동 검증 필요

**Phase 1 진입 전 수행 사항**:

```
# 1. 경력 regression 확인
node scripts/regression/run-transition-lite-regression.mjs

# 2. 서류탈락 smoke 확인
node tests/integration/domainMismatchSmoke.test.mjs

# 3. 신입 baseline 확인 (Phase 0.6R 신규)
node scripts/regression/run-newgrad-axis-baseline.mjs
```

세 runner가 모두 PASS이면 Phase 1 진입 가능. FAIL이 있으면 원인 분석 후 진입.

**Phase 1에서 신입 분석 보호를 위한 추가 수동 검증**:
- Phase 1 패치 후 `node scripts/regression/run-newgrad-axis-baseline.mjs` 재실행
- targetJobLabel / targetIndustryLabel 변경 없음 확인
- 모든 axes score 타입이 number임을 확인
- buildNewgradAxisPack.js / buildNewgradTransitionLiteResult.js 내부 로직 수정 금지 재확인

---

*Phase 0.6R 업데이트: 런타임 코드 수정 없음. runner 1개 생성, 문서 정비.*

---

## Phase 2A 결과 (2026-04-29)

### 1. 패치 전 runner 결과 (pre-patch baseline)

| Runner | 결과 |
|---|---|
| run-transition-lite-regression.mjs | 11 PASS / 0 FAIL ✅ |
| domainMismatchSmoke.test.mjs | 11 PASS / 0 FAIL ✅ |
| run-newgrad-axis-baseline.mjs | 4 PASS / 0 FAIL ✅ |
| run-taxonomy-read-layer-smoke.mjs | 17 PASS / 0 FAIL ✅ |

Phase 2A 진입 조건 충족.

### 2. Display Label 중복 지점 조사 결과

| 파일 | 함수/anchor | 현재 label 생성 방식 | scoring 영향 가능성 | shared helper 연결 가능 여부 |
|---|---|---|---|---|
| `src/lib/adapters/buildJobContext.js` | `buildJobContext()` | `toStr(resolvedJob.label)` — resolved item에서 직접 추출 | 없음 (read-only 명시) | **Level A** — `displayLabel` 필드 추가 |
| `src/lib/adapters/buildIndustryContext.js` | `buildIndustryContext()` | `toStr(resolvedIndustry.label)` — resolved item에서 직접 추출 | 없음 (read-only 명시) | **Level A** — `displayLabel` 필드 추가 |
| `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` | return 블록 line 1915/1920 | `toStr(targetJobItem?.label)` / `toStr(targetIndustryItem?.label)` | 간접 (heroSummary 문자열에 사용) | Level B — scoring과 혼재, Phase 2A에서 보류 |
| `src/lib/transitionLite/buildTransitionLiteResult.js` | `pickTransitionLiteTargetContext()` line 2904/2905 | `toStr(resolved.targetJobItem.label)` / `toStr(resolved.targetIndustryItem.label)` | 간접 (transition scoring input chain에 label 진입 가능) | Level B — Phase 2A에서 보류 |
| `src/lib/transitionLite/buildTransitionReadBlock.js` | 다수 함수 | 파라미터로 받은 `targetJobLabel` / `targetIndustryLabel` 사용 | 없음 (display 전용) | Level B — label 생성 위치가 아닌 소비 위치 |
| `src/lib/analysis/buildNewgradAxisPack.js` | line 253/263 | `getJobOntologyItemById().label` / `getIndustryRegistryItemById().label` | 높음 (scoring 전용 파일) | Level C — 연결 금지 |

### 3. 연결 후보 분류

**Level A (연결 완료)**
- `src/lib/adapters/buildJobContext.js` — `buildJobContext()`: read-only context 어댑터, score/gate 무관, `displayLabel` 필드 추가 (기존 `label` 병렬 유지)
- `src/lib/adapters/buildIndustryContext.js` — `buildIndustryContext()`: 동일 패턴

**Level B (조사 후 연결 가능 — Phase 2B 후보)**
- `buildNewgradTransitionLiteResult.js` return 블록: heroSummary/targetJobLabel 문자열 구성부. display만 맞닿아 있으나 scoring 계산 직후 위치라 Phase 2A에서 보류
- `buildTransitionLiteResult.js` `pickTransitionLiteTargetContext()`: transition label 소비 시작점. label 값이 하위 scoring 입력에 흘러갈 수 있어 Phase 2A에서 보류

**Level C (연결 금지)**
- `buildNewgradAxisPack.js` scoring 계산부
- `classifyTransition.js` classification 로직
- `analyzer.js` / `decision/index.js` risk/gate 로직
- `preciseAnalysis/*.js` risk builder

### 4. 실제 연결 내용

**`readTaxonomyTarget.js`**: `resolveDisplayLabel` → named export 승격
**`buildJobContext.js`**: `displayLabel` 필드 추가 (null guard: `"미확인"`, found: `resolveDisplayLabel(item, null, id)`)
**`buildIndustryContext.js`**: 동일 패턴

기존 `label` 필드 완전 보존. 기존 fallback 미제거. scoring 입력 경로 없음.

### 5. 패치 후 runner 결과 (post-patch)

| Runner | 결과 | 변동 |
|---|---|---|
| run-transition-lite-regression.mjs | 11 PASS / 0 FAIL ✅ | 없음 |
| domainMismatchSmoke.test.mjs | 11 PASS / 0 FAIL ✅ | 없음 |
| run-newgrad-axis-baseline.mjs | 4 PASS / 0 FAIL ✅ | 없음 |
| run-taxonomy-read-layer-smoke.mjs | 17 PASS / 0 FAIL ✅ | 없음 |

Phase 2A 완료. 모든 runner PASS, score/band/label 변동 없음.

---

## Phase 2B 결과 (2026-04-29)

### 1. 패치 전 runner 결과 (pre-patch)

| Runner | 결과 |
|---|---|
| run-transition-lite-regression.mjs | 11 PASS / 0 FAIL ✅ |
| domainMismatchSmoke.test.mjs | 11 PASS / 0 FAIL ✅ |
| run-newgrad-axis-baseline.mjs | 4 PASS / 0 FAIL ✅ |
| run-taxonomy-read-layer-smoke.mjs | 17 PASS / 0 FAIL ✅ |

### 2. Return Block 경계 재검증 결과

| 파일 | 함수/anchor | 현재 label 생성 방식 | score 계산 전/후 | downstream 소비 | 연결 가능성 | 판단 근거 |
|---|---|---|---|---|---|---|
| `buildNewgradTransitionLiteResult.js` | return 블록 L1920-1921 | `toStr(targetJobItem?.label)` / `toStr(targetIndustryItem?.label)` | scoring **이후** (L1863 `buildNewgradAxisPack` 완료 후) | display only (transitionReadBlock.meta, UI label) | **Level A** | scoring 완료 후 return에만 사용 |
| `buildNewgradTransitionLiteResult.js` | L1839 `buildPhase1CertRoleRelevancePack` | `toStr(targetJobItem?.label)` | scoring **중** (axis4 keyword match 입력) | scoring input | Level C — 연결 금지 | label이 cert axis4 판정에 사용됨 |
| `buildTransitionLiteResult.js` | `buildTransitionLiteVM` return L3068 | `toStr(targetContext?.targetIndustryLabel)` | scoring **이후** (L3118-3120 완료 후) | display only (UI `targetIndustryLabel`) | **Level A** | `composeRiskTitle` 등은 display text만 생성 |
| `buildTransitionLiteResult.js` | `composeRiskTitle` L2953-2967 | `targetContext.targetJobLabel` / `targetIndustryLabel` | scoring 이후 | risk title text 생성 (display) | **Level A** | label 값이 risk 선택에 영향 없음, title 문자열만 조립 |
| `buildTransitionLiteResult.js` | final return L3153 | spread `...vm` | scoring 이후 | report VM top-level | **Level A** | `resolved.targetJob.displayLabel` 재사용 가능 |

### 3. 연결 후보 분류

**Level A (연결 완료)**
- `buildNewgradTransitionLiteResult.js` return 블록: `targetJobDisplayLabel`, `targetIndustryDisplayLabel` 병렬 필드 추가
- `buildTransitionLiteResult.js` 최종 return: 동일 패턴

**Level B (보류)**
- `buildTransitionLiteVM` 내부 `buildTransitionReadBlock`, `buildValidationReadBlock` 파라미터: label 값을 pass-through하는 위치. 기존 `targetJobLabel` 파라미터를 `displayLabel`로 교체하면 기존 field contract 변경 필요 → Phase 3에서 검토

**Level C (연결 금지)**
- `buildPhase1CertRoleRelevancePack` L1839 — `targetJobLabel`이 axis4 scoring keyword match 입력
- `buildNewgradAxisPack` L253/L263 — scoring 내부
- `classifyTransition`, `buildDiscriminatorPack`, `pickTransitionLiteRiskKeys` — scoring 전용

### 4. 실제 연결 내용

**`buildNewgradTransitionLiteResult.js`** (return 블록 L1921-1922):
- `targetJobDisplayLabel: targetJobContext.displayLabel ?? toStr(targetJobItem?.label)`
- `targetIndustryDisplayLabel: targetIndustryContext.displayLabel ?? toStr(targetIndustryItem?.label)`
- 기존 `targetJobLabel`, `targetIndustryLabel` 필드 완전 보존

**`buildTransitionLiteResult.js`** (최종 return L3157-3158):
- `targetJobDisplayLabel: resolved?.targetJob?.displayLabel ?? toStr(resolved?.targetJobItem?.label)`
- `targetIndustryDisplayLabel: resolved?.targetIndustry?.displayLabel ?? toStr(resolved?.targetIndustryItem?.label)`
- 기존 `...vm` 전개 유지, 기존 필드 불변

### 5. 패치 후 runner 결과 (post-patch)

| Runner | 결과 | 변동 |
|---|---|---|
| run-transition-lite-regression.mjs | 11 PASS / 0 FAIL ✅ | 없음 |
| domainMismatchSmoke.test.mjs | 11 PASS / 0 FAIL ✅ | 없음 |
| run-newgrad-axis-baseline.mjs | 4 PASS / 0 FAIL ✅ | 없음 |
| run-taxonomy-read-layer-smoke.mjs | 17 PASS / 0 FAIL ✅ | 없음 |

---

## Phase 3A — Shared Read-Only Taxonomy Context Pack (2026-04-29)

### 1. 신규 파일

| 파일 | 역할 | 연결 유형 |
|---|---|---|
| `src/lib/shared/taxonomy/buildTaxonomyContextPack.js` | `buildJobContext` + `buildIndustryContext` wrapper + 보조 필드 추가 | Level A helper only |
| `scripts/regression/run-taxonomy-context-pack-smoke.mjs` | Phase 3A 계약 smoke runner | 테스트 전용 |

### 2. Context Pack 출력 계약

**jobContext**: `id, canonicalId, label, displayLabel, roleSummary, majorCategory, subcategory, aliases, warnings`  
**industryContext**: `id, canonicalId, label, displayLabel, sector, subsector, valueChain, customerContext, purchaseContext, aliases, warnings`  
**meta**: `source, confidence.{job,industry}, warnings`

### 3. 금지 필드 준수

score, rawScore, risk, riskLevel, gate, band, pass/fail, transitionDifficulty, recommendation, CTA, suitability, rejectionReason — 모두 미포함 ✅

### 4. 기존 adapter 영향

- `buildJobContext`, `buildIndustryContext` export: 변경 없음 ✅
- 기존 fallback 제거: 없음 ✅
- 기존 소비부 연결: 없음 (Level A only) ✅

### 5. 패치 후 runner 결과 (post-patch)

| Runner | 결과 | 변동 |
|---|---|---|
| run-transition-lite-regression.mjs | 11 PASS / 0 FAIL ✅ | 없음 |
| domainMismatchSmoke.test.mjs | 11 PASS / 0 FAIL ✅ | 없음 |
| run-newgrad-axis-baseline.mjs | 4 PASS / 0 FAIL ✅ | 없음 |
| run-taxonomy-read-layer-smoke.mjs | 17 PASS / 0 FAIL ✅ | 없음 |
| run-taxonomy-context-pack-smoke.mjs | 27 PASS / 0 FAIL ✅ | 신규 |

Phase 2B 완료. 모든 runner PASS. score/band/label 변동 없음.
