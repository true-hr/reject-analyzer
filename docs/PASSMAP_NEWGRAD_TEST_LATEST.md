# PASSMAP Newgrad Test Latest Status

> Rolling status document. Overwrite this file each round — do not accumulate history here.
> Last updated: 2026-04-30 (Round D-FREEZE)

---

## 1. Current Checkpoint

Round D-FREEZE 완료. Round C/D 전 과정 종료 확정.

- **Round C-9B (최종 runner)**: 8 PASS / 0 ISSUE / 0 FAIL / 8 total, pattern mismatch: 0건, overfire: 없음.
- **Round D-0 (UI data-path 확인)**: lead/scoreReason 항상 노출, criteria/liftOrLimit 상세보기 후 노출, 5개 축 모두 동일 렌더 경로 확인. 브라우저 직접 확인은 미수행.
- **Round D-0 (manual smoke)**: 5개 대표 케이스 fixture input × pattern text 대조 완료. 전체 PASS 유지. 3개 D-1 후보 문구 메모 (코드 변경 없음).
- **D-FREEZE (최종 runner 재확인)**: 8 PASS / 0 ISSUE / 0 FAIL — baseline freeze 확정.

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

**Last result** (2026-04-30, D-FREEZE):
- total: 8
- PASS: 8 (전체)
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

---

## 6. Pattern Registry Detail

| Pattern ID | AppliesTo 조건 | Overlay Axes | 슬롯 |
|---|---|---|---|
| WEAK_MAJOR_STRONG_RELEVANT_PROJECT | JOB_BUSINESS_SERVICE_PLANNING + major 있음 + projectsRaw≥2 + majorPrior weak/mismatch | jobStructure, responsibilityScope | lead+scoreReason / lead+scoreReason+liftOrLimit |
| CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE | certificationsRaw≥1 + projectsRaw=0 + canonicalWorkRowsRaw=0 | industryContext | lead+scoreReason+criteria+liftOrLimit |
| CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT | JOB_BUSINESS_SERVICE_PLANNING + CS roleFamily 존재 + projectsRaw=0 | customerType, responsibilityScope | lead+scoreReason × 2 |
| NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA | JOB_IT_DATA_DIGITAL_ prefix + projectsRaw>0 + majorPrior weak/mismatch | responsibilityScope | scoreReason+liftOrLimit (lead 없음 → primaryBody=generic) |
| SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE | projectsRaw=0 + canonicalWorkRowsRaw=0 + certificationsRaw=0 + (strengths>0 OR workStyleNotes>0) | roleCharacter | lead+scoreReason (liftOrLimit 없음) |

- Registry: `src/lib/analysis/newgradCaseInsightOverlays.js`
- Integration: `buildNewgradAxisPack.js` → `buildNewgradCaseInsightOverlays({ normalized, _jobFitMajorPrior })`
- Debug meta: `axisPack.meta.caseInsightOverlays.firedPatternIds`

---

## 7. Known Notes (D-1 후보, 미수정)

| 우선순위 | 대상 | 내용 |
|---|---|---|
| P1 | NON_MAJOR: `responsibilityScope.lead` 없음 | primaryBody가 generic engine text. 첫 인상 약함. D-1에서 lead 추가 검토 |
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
