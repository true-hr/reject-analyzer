# PASSMAP Scoring Calibration Log

## TSQ-CAL-20260405-AXIS1-MAJOR-PRIOR-ACCEPT-05
- date: 2026-04-05
- trigger_round: DOCS ONLY / Axis 1 major prior acceptance lock
- accepted_baseline:
  - major prior implementation is accepted on the explicit mapping scope
  - no immediate bugfix or score retune is required
- locked_read:
  - `direct prior alone -> mid`
  - `direct prior + one aligned direct role -> mid_high`
  - this is tracked as a later calibration candidate, not as a correctness failure
- ceiling_floor_status:
  - no hard ceiling from `majorPriorFinal = 3`
  - no hard floor from `majorPriorFinal = 0`
  - role evidence correction remained alive in QA
- action_now:
  - hold current baseline
  - do not expand mappings or retune scoring in this lock round
- status: locked_current_baseline

## TSQ-CAL-20260405-AXIS1-MAJOR-PRIOR-QA-04
- date: 2026-04-05
- trigger_round: SAFE QA + CALIBRATION REVIEW / Newgrad Axis 1 major prior
- qa_scope:
  - base prior correctness
  - override correctness
  - final score calibration
  - explanation tone safety
- qa_result:
  - explicit base/override mapping path worked as expected
  - `majorPriorFinal = 3` lifted to `mid` without role evidence
  - aligned direct role evidence lifted direct-prior cases to `mid_high`
  - weak/mismatch major still corrected upward when role evidence was direct
- ceiling_floor_review:
  - no hard high ceiling from major alone
  - no hard low floor from mismatch major
- calibration_note:
  - direct prior + one aligned role landing in `mid_high` looks acceptable but may deserve later calibration discussion
  - this was not changed because the round was QA-first
- status: accepted_for_now

## TSQ-CAL-20260405-AXIS1-MAJOR-PRIOR-03
- date: 2026-04-05
- trigger_round: SAFE PATCH + CONTRACT IMPLEMENTATION / Newgrad Axis 1 major prior
- observed_problem:
  - Axis 1 needed to reflect interviewer-style first-pass academic prior
  - previous major handling was too thin and mostly keyword-based
- applied_adjustment:
  - replaced thin major relevance read with registry-based prior
  - added 2-step structure:
    - base prior by major subcategory x job majorCategory
    - override by major subcategory x job subcategory
  - capped final prior at `3`
  - kept role/coursework evidence as the later correction path
- score_guard:
  - direct major prior alone does not auto-produce high band
  - weak/mismatch major prior can still be corrected by strong role evidence
  - no duration/outcome/depth semantics were imported into Axis 1
- applied_scope:
  - only explicit mappings from the prompt
  - possible-but-unspecified overrides intentionally not added
- validation_snapshot:
  - CS -> backend prior strong
  - industrial engineering -> PM / SCM prior strong
  - psychology -> recruiting / career counseling prior strong
  - weak major + direct role evidence still reaches high via role path
- status: accepted

## TSQ-CAL-20260405-AXIS1-FALLBACK-02
- date: 2026-04-05
- trigger_round: SAFE PATCH + REVIEW / Newgrad Axis 1 fallback narrowing
- observed_problem:
  - Axis 1 official meaning was locked as task-role linkage
  - count-only fallback still risked reading like experience volume / execution depth
- applied_adjustment:
  - kept direct role-based score path unchanged
  - narrowed unresolved-target fallback to weak-only behavior
  - exposed `countOnlyFallbackUsed` signal for explanation alignment
  - rewrote fallback copy so project/intern presence without role linkage reads as limited linkage, not strong experience
- affected_score_component:
  - `scoreJobFit()` fallback branch
  - `buildNewgradJobFitExplanation()` fallback copy
- validation_snapshot:
  - major-only -> low / limited linkage
  - internship presence only -> low / limited linkage
  - direct role alignment -> high path preserved
- not_changed:
  - Axis 3 redesign
  - Axis 2 / 4 / 5
  - App.jsx
  - UI structure
- status: accepted

## TSQ-CAL-20260405-AXIS1-BOUNDARY-01
- date: 2026-04-05
- trigger_round: SAFE INVESTIGATION + CONTRACT LOCK / Newgrad Axis 1 include-exclude evidence boundary
- observed_problem:
  - recommended boundary says Axis 1 should read task/role linkage only
  - Axis 3 should own depth / duration / outcome / repeated execution evidence
  - current implementation is mostly aligned, but Axis 1 fallback still uses raw project/intern presence counts as weak evidence
- suspected_root_cause:
  - old newgrad fallback design treated count presence as a safe proxy when direct role linkage was absent
  - this makes Axis 1 and Axis 3 harder to separate cleanly at low-evidence edges
- adjustment_hypothesis:
  - keep Axis 1 score core on `major`, `coursework`, `projectRoles`, `internshipRoleFamilies`
  - demote or constrain count-only fallback so it does not behave like depth evidence
  - keep `outcomeLevel`, `duration`, repeated activity, responsibility/depth semantics out of Axis 1 ownership
- affected_score_component:
  - `scoreJobFit()` fallback and weak-evidence branches
  - `buildNewgradJobFitExplanation()` fallback copy may need matching cleanup after score contract patch
- expected_effect:
  - clearer Axis 1 vs Axis 3 split
  - less boundary bleed at low/mid cases
  - more defensible owner contract before broader scoring work
- validation_plan:
  - compare direct-role, adjacent-role, major-only, count-only, and no-evidence cases
  - confirm Axis 1 stays about task linkage, not execution depth
- status: proposed

## 목적
- score rule, threshold, weighting, band interpretation 조정 판단을 evidence 기반으로 기록한다.
- vague intuition이 아니라 실제 QA 관찰 결과와 연결된 보정 결정만 남긴다.

## 언제 이 문서를 쓰는가
- 반복된 false high / false low 패턴이 보일 때 쓴다.
- score band, threshold, component weighting 조정 가설을 세울 때 쓴다.
- 보정 후 검증 계획을 잠글 때 쓴다.

## 다른 문서와의 관계
- 문제 발견 근거는 `Accuracy_QA_Log.md`에서 가져온다.
- 기준 케이스 영향 범위는 `Transition_Scoring_Gold_Set.md`로 확인한다.
- 용어와 치명 오류 정의는 `Transition_Scoring_QA_Framework.md`를 따른다.

## 사용 규칙
- scoring rule 변경 제안은 반드시 관찰된 QA evidence를 근거로 한다.
- 추정 원인과 조정 가설을 분리해서 적는다.
- 실제 코드 반영 전에도 가설 단계 entry를 남길 수 있다.
- 상태는 `proposed`, `testing`, `accepted`, `rejected`, `rolled_back` 중 하나로 관리한다.

## Calibration Decision Template
```md
## TSQ-CAL-20260402-01
- date:
- trigger_round:
- observed_problem:
- suspected_root_cause:
- adjustment_hypothesis:
- affected_score_component:
- expected_effect:
- validation_plan:
- status:
```

## Append-Only Decisions

## TSQ-CAL-YYYYMMDD-01
- date:
- trigger_round:
- observed_problem:
- suspected_root_cause:
- adjustment_hypothesis:
- affected_score_component:
- expected_effect:
- validation_plan:
- status:

## TSQ-CAL-20260403-01
- date: 2026-04-03
- trigger_round: ROUND-2026-04-02-A
- observed_problem: `TSG-011`에서 expert range `10-20`, expert grade `매우 낮음`인데 measured `vm.score`가 `77`로 기록됐다. hard cross-function negative control 대비 false high 의심이 강하다.
- suspected_root_cause: display score가 generic transferable signal이나 협업 접점을 과대 반영하고, direct role evidence 부재와 큰 function jump penalty를 충분히 누르지 못했을 가능성이 있다.
- adjustment_hypothesis: 큰 직무 점프에서 direct evidence가 없을 때 final display score ceiling 또는 evidence-required floor를 더 강하게 적용하면 false high를 줄일 수 있다.
- affected_score_component: transition fit interpretation, evidence gate, final display score handoff
- expected_effect: `TSG-011` 같은 hard negative control의 과대평가를 줄이고, 인접 전환 케이스의 정상 score는 과도하게 누르지 않는다.
- validation_plan: next measured subset에서 `TSG-011`과 동일 hard bucket(`TSG-012`~`TSG-015`)을 우선 재측정하고 false high 패턴이 반복되는지 본다.
- status: proposed

## 2026-04-03 5축 테스트 baseline lock
- 과거 테스트 러너/기준은 새 axis 체계와 직접 호환되지 않을 가능성이 높다고 판단한다.
- 따라서 code-first가 아니라 documentation-first로 전환한다.
- 이번 라운드는 Axis 1 / 4 / 5부터 테스트 기준을 잠그는 라운드다.
- 점수 calibration 이전에 판정 언어와 케이스 분류 원칙부터 잠근다.
- 다음 단계는 새 runner skeleton 설계다.

## 2026-04-04 runner input/output contract lock
- 이번 라운드에서는 runner 구현이 아니라 input/output contract를 먼저 고정했다.
- 과거 runner 재사용 금지 원칙을 그대로 유지한다.
- 새 runner는 contract 없이 바로 만들지 않는다.
- 이번에 잠근 범위는 QA 운영용 최소 input shape, output shape, disagreement 기록 규칙이다.
- 다음 단계는 gold set skeleton 실케이스 적재 또는 Axis 1~5 baseline을 읽는 minimal runner 설계 중 하나다.
## 2026-04-04 gold set baseline real-case fill
- 이번 라운드에서는 `Transition_Scoring_Gold_Set.md`의 runner skeleton을 실제 QA용 baseline 케이스 묶음으로 확장했다.
- 이번 라운드 정본 범위는 Axis 1~5 전체다.
- 실제 baseline 케이스는 16건이며, 모든 케이스는 `focusAxes: [1,2,3,4,5]`를 사용한다.
- 아직 exact score calibration 단계는 아니며, 각 케이스는 `band + reasoning` 기준으로만 잠갔다.
- expected는 exact score 없이 `axis1~axis5 band + reasoningHints` 기준으로만 적재했다.
- 일부 borderline case를 의도적으로 포함해 disagreement가 어디서 발생하는지 먼저 드러나게 했다.
- 다음 단계 후보는 `minimal runner 설계` 또는 `첫 수동 QA run 흐름 정리`다.

## 2026-04-04 gold set baseline 5축 전체 확장
- Axis 2 / Axis 3 설계 완료에 따라 gold set baseline 판독 범위를 Axis 1 / 4 / 5 우선 잠금 단계에서 Axis 1~5 전체 해석 단계로 확장했다.
- 이번 적재는 exact score calibration이 아니라 axis별 `band + reasoning` baseline 축적이 목적이다.
- 케이스 라벨은 PASSMAP 실제 input taxonomy의 직무 / 산업 SSOT만 사용했다.
- 실제 baseline 케이스 수는 16건으로 통일한다.
- 모든 케이스는 `focusAxes: [1,2,3,4,5]`와 `axis1~axis5 band + reasoningHints` 형식을 따른다.
- 표면 직무명 유사도만이 아니라 업무 구조, 해결 메커니즘, 산출물, 산업 맥락, 역할 범위를 분리해서 expected를 적재했다.
- 다음 단계는 `minimal runner 설계` 또는 `첫 수동 QA run 준비`이며, 그 전까지는 band-level disagreement 패턴을 우선 수집한다.

## 2026-04-04 minimal runner design 조사 결과
- 5축 actual 결과의 true owner는 `src/lib/analysis/buildAxisConnectivityPack.js`의 `buildAxisConnectivityPack()`으로 판단한다.
- 이 함수는 production scoring formula를 바꾸지 않고 axis1~axis5의 `rawScore`, `displayScore`, `band`, `signals/breakdown`을 이미 한 번에 반환한다.
- 최소 진입점은 analyzer 전체가 아니라 `mapUiJobSubToOntologyId()` / `mapUiIndustrySubToRegistryId()`로 SSOT label을 id로 resolve한 뒤 `buildAxisConnectivityPack()`을 직접 호출하는 경로다.
- `analyze()`는 UI/리포트/해석 pack까지 함께 태워 범위가 과하고, `buildCandidateAxisPack()`은 read-only structural metadata라 actual band 생산 owner로는 부족하다.
- 따라서 1차 runner는 `문서 case 입력 -> label resolve -> connectivity pack 호출 -> actual/comparison/disagreement 기록` 구조가 가장 낮은 리스크다.
- 이번 라운드에서는 production path 오염을 피하기 위해 코드 생성보다 설계 문서 잠금이 우선이다.

## 2026-04-04 First Manual QA Run — Starter Set Execution

- 실행 방식: Human reasoning pass (engine 직접 호출 전 사람 기준 판정)
- 실행 케이스: TSG-AX12345-011, -007, -003, -009, -013 (5건)
- 결과 집계:
  - match: 5건
  - soft_mismatch: 0건
  - hard_mismatch: 0건
  - needs_review: 0건
- taxonomy guard: 5/5 통과
- 주요 교정 확인:
  - Axis 4 독립성: TSG-AX12345-007에서 동일 직무명이어도 산업 교차 시 Axis4 low 확인
  - Axis 4 독립성: TSG-AX12345-003에서 직무 구조 mid_high이어도 B2B→B2C 반전으로 Axis4 low 확인
  - Axis 5 독립성: TSG-AX12345-009에서 동일 산업/유사 직무명이어도 일의 결 차이로 Axis5 low 확인
- 현재 문제의 본체: human reasoning pass 수준에서는 scoring/taxonomy/docs 모두 안정. 다음 단계는 engine actual band와의 비교
- 다음 단계: buildAxisConnectivityPack() 직접 호출로 engine actual band 기록 후 human pass 결과와 비교

---

## 2026-04-04 Starter Set Concrete Selection

- 16건 gold set baseline 중 first manual QA run용 5건 선정 완료
- 선정 기준: near/borderline/cross 커버 + Axis 4/5 교정 효과 최대
- 선정 케이스:
  - TSG-AX12345-011 (near 앵커, 기술영업→솔루션영업)
  - TSG-AX12345-007 (Axis4 split, 백엔드개발 동일직무+산업교차)
  - TSG-AX12345-003 (borderline, PM→서비스기획, B2B→B2C)
  - TSG-AX12345-009 (Axis5 split, 기업교육→OD, 동일산업)
  - TSG-AX12345-013 (cross 앵커, 신사업/BD→브랜드마케팅)
- Axis 4 교정 효과: TSG-AX12345-007, TSG-AX12345-003 → 고객 유형 연결성은 직무명 독립적으로 판정해야 함
- Axis 5 교정 효과: TSG-AX12345-009 → 직무 성격 연결성은 직무명이 아니라 일의 결 기준으로 판정해야 함
- 이 5건으로 "표면 유사성이 원축 점수를 자동으로 높이지 않는다"는 교정 효과를 기대

---

## 2026-04-04 QA Framework Per-Axis Reasoning Fields Relock

- drift audit 결과 QA Framework `Per-Axis Reasoning Minimum Fields` 섹션이 가장 위험한 drift 지점으로 확인됐다
- 기존 Axis 4 보조 기준(`산업 맥락 / 고객 구조 / 도메인 이해관계자`)과 Axis 5 보조 기준(`역할 폭 / 책임 수준 / 오너십 범위`)은 신축 체계 기준으로 잠겨 있었다
- 이번 라운드에서 원축 5개 기준으로 재잠금했다:
  - Axis 4 (고객 유형 연결성): 고객 구조 / B2B·B2C / buying motion 중심
  - Axis 5 (직무 성격 연결성): 일의 결 / mission type / role weight 중심
- runner / manual QA template은 이 corrected contract를 따라야 한다
- 이제 starter set concrete case selection 진행 가능

---

## 2026-04-04 5-Axis Drift Audit — Calibration Doc 감사 결과

### 현재 calibration/log 문서 기준 점검
- 이 문서의 대부분 항목은 원축 기준으로 작성되어 있음 (safe)
- 단, `2026-04-04 axis 1~5 user-facing copy 정렬` 항목의 아래 기록은 오기록이다:
  - "구버전 독립축 표현이던 `고객 유형 연결성`, `직무 성격 연결성`은 각각 Axis 4 `산업 맥락 연결성`, Axis 5 `역할 범위 연결성` 안으로 흡수했다."
  - 이 항목은 복구 전 중간 상태(신축 체계 적용 시점)를 기준으로 작성된 기록이다
  - 실제 SSOT: Axis 4 = `고객 유형 연결성`, Axis 5 = `직무 성격 연결성`이 원축이며 "구버전"이 아님
  - 직전 라운드("User-Provided 5-Axis Contract Restore")에서 원축으로 복구 완료됨

### manual QA starter set drift 위험
- 현재 calibration log 자체는 scoring decision 기록 owner이므로 drift 직접 위험도는 낮음
- 그러나 QA Framework "Per-Axis Reasoning Minimum Fields" 섹션이 신축 체계 sub-criteria로 잠겨 있어, manual QA starter template이 잘못된 축 기준으로 흐를 가능성이 있음
  - Axis 4 보조 기준에 `산업 맥락`이 포함되어 있음 (원축 Axis 4는 고객 유형 연결성)
  - Axis 5 보조 기준이 `역할 폭/책임 수준`으로 잡혀 있음 (원축 Axis 5는 직무 성격 연결성)

### 다음 corrective doc patch 필요 여부
- 필요: `Transition_Scoring_QA_Framework.md` "Per-Axis Reasoning Minimum Fields" 재잠금
  - Axis 4 sub: 고객 구조 / buying motion / customer market / B2B vs B2C 중심
  - Axis 5 sub: 일의 결 / mission type / role weight / 업무 성향 중심
- 우선도: HIGH. 이 섹션이 잘못 잠긴 채로 runner 또는 starter template이 만들어지면 Axis 4/5 systematic wrong evaluation으로 직결됨

---

## 2026-04-04 axis 1~5 user-facing copy 정렬
- 실제 노출 label true owner는 `src/lib/analysis/buildAxisConnectivityPack.js`의 axis label map이다.
- 실제 1~5점 설명 true owner는 `src/components/report/TransitionLiteResult.jsx`의 `getRadarAxisShortLabel()` 및 `getAxisScoreNarrative()`다.
- 구버전 독립축 표현이던 `고객 유형 연결성`, `직무 성격 연결성`은 각각 Axis 4 `산업 맥락 연결성`, Axis 5 `역할 범위 연결성` 안으로 흡수했다.
- scoring logic, threshold, axis key는 변경하지 않고 user-facing copy만 최신 5축 기준에 맞췄다.

## 2026-04-05 Newgrad Axis 2 Calibration Operation Lock

### scope
- 이 섹션은 Newgrad Axis 2 `산업 분야 이해도` mismatch 전용 calibration 운영 기준이다.
- 의미 재설계 문서가 아니라 test mismatch 연결용 운영 메모다.

### linked case rule
- linked case는 `02_Product/Accuracy_QA/Newgrad_Axis2_Test_Cases.md`의 `NGA2-CASE-YYYYMMDD-###`만 사용한다.
- 같은 case의 재실행 mismatch는 새 case가 아니라 새 calibration entry로 append한다.
- 같은 mismatch 패턴이 2회 이상 반복될 때만 contract issue / implementation issue 분리를 논의한다.

### mismatch template
```md
## NGA2-CAL-20260405-01
- date:
- linked_case_id:
- expected_axis2_score:
- actual_axis2_score:
- suspected_cause:
- issue_class:
- next_action:
- status:
```

### field rule
- `suspected_cause`: 키워드 맵 과대반응, weak signal 과대가산, applied-context 과소반영처럼 짧게 적는다.
- `issue_class`: `contract_issue`, `implementation_issue`, `needs_more_cases`
- `status`: `open`, `watch`, `testing`, `resolved`, `deferred`
- 반복되지 않은 단건 mismatch는 바로 score contract를 바꾸지 말고 `needs_more_cases` 또는 `watch`로 둔다.

### starter mismatch queue
```md
## NGA2-CAL-20260405-01
- date: 2026-04-05
- linked_case_id: pending
- expected_axis2_score: pending
- actual_axis2_score: pending
- suspected_cause: pending
- issue_class: needs_more_cases
- next_action: starter batch mismatch가 생길 때 첫 linked case로 채움
- status: watch
```

## NGA2-CAL-20260405-02
- date: 2026-04-05
- linked_case_id: NGA2-CASE-20260405-001, NGA2-CASE-20260405-009, NGA2-CASE-20260405-010
- expected_axis2_score: very_low / 1 중심
- actual_axis2_score: low / 40 또는 mid / 60
- expected_vs_actual: low-signal guardrail bucket에서 very_low 기대였지만 unrelated major 또는 typed support 때문에 low~mid floor가 형성됨
- why_this_matters: 산업 이해 신호가 거의 없는 케이스를 low~mid로 올리면 false high 방어가 약해진다.
- suspected_cause: unrelated major non-empty 처리와 typed contract/support count가 industry relevance 없이 Axis 2 floor를 올리는 것으로 보임
- likely_type: implementation issue
- immediate_patch_recommended: later
- next_action: low-signal bucket 2차 배치에서 동일 floor 반복 여부를 먼저 재확인하고, 이후 `scoreDomainInterest()`의 weakSignalCount / supportContextCount 기여를 좁게 점검
- status: open

## NGA2-CAL-20260405-03
- date: 2026-04-05
- linked_case_id: NGA2-CASE-20260405-002, NGA2-CASE-20260405-006, NGA2-CASE-20260405-007
- expected_axis2_score: related major가 포함되면 최소 mid / 3, major + direct internship이면 mid_high / 4 후보
- actual_axis2_score: low / 40 또는 mid / 60
- expected_vs_actual: 관련 major가 있는 케이스가 unrelated-major bucket과 거의 같은 수준으로 읽히거나, direct internship 대비 추가 lift를 만들지 못함
- why_this_matters: locked SSOT에서 major는 primary usable signal인데, 실제 실행에서 relevance lift가 약하면 Axis 2 핵심 계약과 어긋난다.
- suspected_cause: major relevance 판정이 실제 score uplift로 연결되지 않거나, 4 조건이 과도하게 좁아 major + applied-context 조합을 충분히 올리지 못하는 것으로 보임
- likely_type: implementation issue
- immediate_patch_recommended: later
- next_action: major-only / major+project / major+intern 변형 케이스를 2차 배치로 추가해 major contribution이 실제로 0인지 확인
- status: open

## NGA2-CAL-20260405-04
- date: 2026-04-05
- pattern_name: Pattern A repeat check
- linked_case_ids: NGA2-CASE-20260405-011, NGA2-CASE-20260405-012, NGA2-CASE-20260405-013, NGA2-CASE-20260405-014
- expected_vs_actual_tendency: very_low 기대 케이스 4건이 low 1건, mid 3건으로 반복 상승
- why_this_matters: unrelated major, non-linked certification, role impression, duration/support 조합이 industry understanding 약한 bucket을 반복적으로 끌어올리면 Axis 2 false high 방어선이 구조적으로 약해진다.
- likely_type: possible implementation drift
- next_action_recommendation: inspect implementation next
- next_action_detail: `scoreDomainInterest()`의 `Boolean(input.major)`, `supportContextCount`, non-linked certification 처리, weakSignalCount 결합을 좁게 확인
- status: open

## NGA2-CAL-20260405-05
- date: 2026-04-05
- pattern_name: Pattern B repeat check
- linked_case_ids: NGA2-CASE-20260405-015, NGA2-CASE-20260405-016, NGA2-CASE-20260405-017, NGA2-CASE-20260405-018
- expected_vs_actual_tendency: related major 포함 케이스 4건이 expected mid~mid_high 대신 low 3건, mid 1건에 머묾
- why_this_matters: locked contract에서 related major는 primary usable signal인데, repeated under-lift가 확인되면 Axis 2의 core evidence weighting이 실제 구현에서 약하게 작동하는 가능성이 높다.
- likely_type: possible implementation drift
- next_action_recommendation: inspect implementation next
- next_action_detail: `scoreDomainInterest()`에서 `majorAligned`가 실제 점수 상승으로 이어지는지, 그리고 `alignedSourceCount >= 2 && contextAligned ...` 조건이 과도하게 좁은지 먼저 점검
- status: open
