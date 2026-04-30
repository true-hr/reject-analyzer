# PASSMAP Newgrad Test Latest Status

> Rolling status document. Overwrite this file each round — do not accumulate history here.
> Last updated: 2026-04-30 (Round D-1 P1b)

---

## 1. Current Checkpoint

Round D-1 P1b 완료. NG-JOB-DEV-002 fixture에 responsibilityScope.lead shouldMention 계약 고정 (NON_MAJOR lead 텍스트 lock).

- **Round C-9B**: 8 PASS / 0 ISSUE / 0 FAIL / 8 total.
- **Round D-0**: UI data-path 확인 완료. lead/scoreReason 항상 노출, criteria/liftOrLimit 상세보기 노출. 브라우저 직접 확인 미수행.
- **D-FREEZE**: 8 PASS baseline freeze 확정.
- **Round E-0 (조사)**: 5개 pattern boundary 분석. 경영학+서비스기획 → major prior "direct"(3) → WEAK_MAJOR 미발화 확인. overfire 위험 케이스 없음.
- **Round E-1**: NG-BOUNDARY-MAJOR-001 fixture 추가. 9 PASS / 0 ISSUE / 0 FAIL — shouldNotMention 위반 0, WEAK_MAJOR 오발화 없음 계약 확정.
- **Round E-2**: NG-BOUNDARY-MAJOR-002 중복으로 스킵 (NG-JOB-SERVICE-001이 사회학+서비스기획+WEAK_MAJOR 발화 완전 커버). NG-BOUNDARY-MAJOR-003 fixture 추가 (경제학 adjacent). 10 PASS / 0 ISSUE / 0 FAIL — shouldNotMention 위반 0, adjacent boundary WEAK_MAJOR 오발화 없음 계약 확정.
- **Round E-3 (조사)**: 개발/데이터+비전공+무경험 coverage gap 확인. 5개 pattern 모두 미발화. NO_EVIDENCE pattern 신규 추가 권고.
- **Round E-4**: NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA pattern(6번째) + NG-COVERAGE-DEV-001 fixture 추가. 11 PASS / 0 ISSUE / 0 FAIL — shouldNotMention 위반 0, pattern mismatch 0. coverage gap 해소 확정.
- **Round E-5**: NG-COVERAGE-DEV-002 fixture 추가. NO_EVIDENCE(responsibilityScope) + SELF_REPORT(roleCharacter) co-fire 계약 고정. 12 PASS / 0 ISSUE / 0 FAIL — slot conflict 없음, pattern mismatch 0 확정.
- **Round D-1 P1**: NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA responsibilityScope.lead 보강. "구현·분석 프로젝트는 전공보다 더 직접적인 개발·데이터 직무 연결 근거가 될 수 있습니다." primaryBody 첫 문장 고정. 12 PASS 유지.
- **Round D-1 P1b**: NG-JOB-DEV-002 fixture에 responsibilityScope.lead shouldMention 계약 추가. NON_MAJOR lead 텍스트 regression lock 확정. 12 PASS / 0 ISSUE / 0 FAIL 유지.

---

## 2. Source of Truth Files

| 파일 | 역할 | 현재 상태 |
|---|---|---|
| `docs/PASSMAP_NEWGRAD_TEST_LATEST.md` | 최신 상태 SSOT (이 파일) | CURRENT |
| `docs/PASSMAP_NEWGRAD_TEST_INVENTORY.md` | 전체 케이스 인벤토리 | 최신화 완료 |
| `scripts/regression/newgrad-core-invariant-cases.js` | P0 8개 fixture | 확정 |
| `scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs` | smoke runner (alias matching 포함) | 확정 |
| `src/lib/analysis/buildNewgradAxisPack.js` | pattern overlay integration (5 axes wired) | 확정 |
| `src/lib/analysis/newgradCaseInsightOverlays.js` | 신입 case insight pattern registry (5 patterns) | 확정 |

---

## 3. Current P0 Case Status

| Case ID | Status | Pattern | Axis | Notes |
|---|---|---|---|---|
| **NG-INVARIANT-AXIS1-001** | **PASS** | (scoring invariant — no pattern) | `jobStructure` | shouldMention=[], shouldNotMention 유지 |
| **NG-INVARIANT-AXIS3-001** | **PASS** | (scoring invariant — no pattern) | `responsibilityScope` | shouldMention=[], shouldNotMention 유지 |
| **NG-INVARIANT-CERT-001** | **PASS** | `CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE` | `industryContext` | lead+scoreReason+criteria+liftOrLimit (4슬롯) |
| **NG-INVARIANT-SELF-001** | **PASS** | `SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE` | `roleCharacter` | lead+scoreReason (2슬롯) |
| **NG-JOB-SERVICE-001** | **PASS** | `WEAK_MAJOR_STRONG_RELEVANT_PROJECT` | `jobStructure`, `responsibilityScope` | liftOrLimit 상세보기 포함 |
| **NG-JOB-DATA-001** | **PASS** | `CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE` | `industryContext` | Type C 기준 재정렬 완료 |
| **NG-TRANS-CS-SERVICE-001** | **PASS** | `CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT` | `customerType`, `responsibilityScope` | lead+scoreReason × 2축 |
| **NG-JOB-DEV-002** | **PASS** | `NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA` | `responsibilityScope` | scoreReason+liftOrLimit (primaryBody=generic) |
| **NG-BOUNDARY-MAJOR-001** | **PASS** | (boundary invariant — no pattern fire expected) | `jobStructure` | 경영학 major prior "direct" → WEAK_MAJOR 미발화 계약 (Round E-1) |
| **NG-BOUNDARY-MAJOR-003** | **PASS** | (boundary invariant — no pattern fire expected) | `jobStructure` | 경제학 major prior "adjacent" → WEAK_MAJOR 미발화 계약 (Round E-2) |
| **NG-COVERAGE-DEV-001** | **PASS** | `NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA` | `responsibilityScope` | 비전공+무경험 개발/데이터 희망자 coverage gap 해소 (Round E-4) |
| **NG-COVERAGE-DEV-002** | **PASS** | `NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA` + `SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE` | `responsibilityScope`, `roleCharacter` | co-fire 계약 고정 — 두 axis 동시 발화, slot conflict 없음 (Round E-5) |

---

## 4. Current Visible Surface Contract

**Visible targets**:
- `axisPack.axes.{axisKey}.explanation.lead` → primaryBody (항상 노출, isNewgradReport && !isCareerAxisCard)
- `axisPack.axes.{axisKey}.explanation.scoreReason` → secondaryBody (항상 노출, truthy 시)
- `axisPack.axes.{axisKey}.explanation.criteria` → expandableCriteria ("상세보기" 클릭 필요, 라벨 "판단 기준")
- `axisPack.axes.{axisKey}.explanation.liftOrLimit` → expandableLiftOrLimit ("상세보기" 클릭 필요, 라벨 "다음 보완 방향")

**hasSlots gate**: `[lead, criteria, scoreReason, liftOrLimit]` 중 2개 이상 채워야 primaryBody/secondaryBody 렌더.

**isCareerAxisCard**: `!isNewgradReport` → 신입 보고서에서는 false → primaryBody/secondaryBody 항상 렌더 경로 사용.

**`explanation.available` gate**: base builder (axisExplanationRegistry.js)가 설정 — overlay spread는 텍스트 슬롯만 덮어쓰며 `available`을 변경하지 않음. 유효 input에서는 항상 `true`.

**Dead / blocked**: `vm.whyThisRead`, `vm.topRepairSignals`, `vm.heroSummary`, `vm.inputEvidenceRead`, `vm.axisReadSummary`

---

## 5. Runner Status

**Standard execution command**:
```
"/d/잡다/node.exe" "D:/패스맵/reject-analyzer/scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs"
```

Single case:
```
"/d/잡다/node.exe" "D:/패스맵/reject-analyzer/scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs" --case NG-JOB-SERVICE-001
```

**Last result** (2026-04-30, Round E-5):
- total: 12
- PASS: 12 (전체)
- ISSUE: 0
- FAIL: 0
- shouldNotMention violations: 0
- hasSlots failures: 0
- weak visible cases: 0
- pattern mismatch: 0
- overfire: 없음
  - NG-INVARIANT-CERT-001 → CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE fired ✓
  - NG-INVARIANT-SELF-001 → SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE fired ✓
  - NG-JOB-SERVICE-001 → WEAK_MAJOR_STRONG_RELEVANT_PROJECT fired ✓
  - NG-JOB-DATA-001 → CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE fired ✓
  - NG-TRANS-CS-SERVICE-001 → CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT fired ✓
  - NG-JOB-DEV-002 → NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA fired ✓
  - NG-BOUNDARY-MAJOR-001 → pattern 미발화 (경영학 direct) ✓, shouldNotMention 위반 0 ✓
  - NG-BOUNDARY-MAJOR-003 → pattern 미발화 (경제학 adjacent) ✓, shouldNotMention 위반 0 ✓
  - NG-COVERAGE-DEV-001 → NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA fired ✓, responsibilityScope.lead 정상 노출 ✓
  - NG-COVERAGE-DEV-002 → NO_EVIDENCE + SELF_REPORT co-fire ✓, responsibilityScope+roleCharacter 각각 정상 노출 ✓

---

## 6. Pattern Registry Detail

| Pattern ID | AppliesTo 조건 | Overlay Axes | 슬롯 |
|---|---|---|---|
| WEAK_MAJOR_STRONG_RELEVANT_PROJECT | JOB_BUSINESS_SERVICE_PLANNING + major 있음 + projectsRaw≥2 + majorPrior weak/mismatch | jobStructure, responsibilityScope | lead+scoreReason / lead+scoreReason+liftOrLimit |
| CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE | certificationsRaw≥1 + projectsRaw=0 + canonicalWorkRowsRaw=0 | industryContext | lead+scoreReason+criteria+liftOrLimit |
| CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT | JOB_BUSINESS_SERVICE_PLANNING + CS roleFamily 존재 + projectsRaw=0 | customerType, responsibilityScope | lead+scoreReason × 2 |
| NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA | JOB_IT_DATA_DIGITAL_ prefix + projectsRaw>0 + majorPrior weak/mismatch | responsibilityScope | scoreReason+liftOrLimit (lead 없음 → primaryBody=generic) |
| NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA | JOB_IT_DATA_DIGITAL_ prefix + projectsRaw=0 + canonicalWorkRowsRaw=0 + certificationsRaw=0 + majorPrior weak/mismatch | responsibilityScope | lead+scoreReason+criteria+liftOrLimit (4슬롯) |
| SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE | projectsRaw=0 + canonicalWorkRowsRaw=0 + certificationsRaw=0 + (strengths>0 OR workStyleNotes>0) | roleCharacter | lead+scoreReason (liftOrLimit 없음) |

- Registry: `src/lib/analysis/newgradCaseInsightOverlays.js`
- Integration: `buildNewgradAxisPack.js` → `buildNewgradCaseInsightOverlays({ normalized, _jobFitMajorPrior })`
- Debug meta: `axisPack.meta.caseInsightOverlays.firedPatternIds`

---

## 7. Known Notes (D-1 후보, 미수정)

| 우선순위 | 대상 | 내용 |
|---|---|---|
| ~~P1~~ | ~~NON_MAJOR: `responsibilityScope.lead` 없음~~ | ~~primaryBody가 generic engine text. 첫 인상 약함.~~ → **Round D-1 P1 완료**: lead "구현·분석 프로젝트는 전공보다 더 직접적인 개발·데이터 직무 연결 근거가 될 수 있습니다." 삽입 확정. |
| P2 | SELF_REPORT: `roleCharacter.liftOrLimit` 없음 | 상세보기 클릭 시 actionable 보완 방향 없음. D-1에서 추가 검토 |
| P3 | CERT_ONLY: `liftOrLimit` 마지막 문장 중복 | lead와 동일 맥락 반복. D-1에서 경미한 보완 |
| 메모 | AXIS1-001 actual jobStructure.lead | `major=""` 케이스에 "전공 기반을 드러낼 필요가 있습니다" 어색함 — 미래 pattern 후보 |

---

## 8. Do Not Touch

- `src/` 런타임 로직 (명시적 scoped overlay 외)
- scoring / gate / band 수치
- UI 레이아웃 / 컴포넌트 / CTA
- fixture `input` 필드
- `axisExplanationRegistry.js` 전역 registry
- 관계없는 케이스
- `docs/COMM_PATCH_NOTES.md` (주요 runtime 결정 변경 시에만)
