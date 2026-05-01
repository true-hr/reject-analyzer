# PASSMAP Newgrad Calibration Log

## 문서 목적
- newgrad transition-lite calibration 기록을 experienced calibration log와 분리해 남긴다.
- pure newgrad / bridge-newgrad 판단 drift를 append-only로 추적한다.

## 운영 원칙
- 이 문서는 newgrad-only log다.
- experienced calibration log와 교차 기록하지 않는다.
- append-only로 유지한다.
- exact score보다 expected / actual / disagreement와 축별 drift를 먼저 기록한다.

## row/template format
### NG-CAL-YYYYMMDD-01
- execution date:
- caseId:
- family:
  - pure
  - bridge
- expected:
- actual:
- disagreementStatus:
  - match
  - soft_mismatch
  - hard_mismatch
  - needs_review
- primary drift axis:
- short finding:
- next action:

## append-only decisions
### 2026-04-04 newgrad calibration log split
- experienced calibration log와 newgrad calibration log를 분리한다.
- pure newgrad / bridge-newgrad는 이 문서 안에서만 비교한다.
- `bridgeCandidate`는 subtype signal only이며 auto boost 기준으로 쓰지 않는다.
- 다음 단계는 starter gold-set skeleton을 actual case로 채우고 첫 calibration row를 적재하는 것이다.

## 2026-04-05 Drift Logging Contract Lock

### drift 분리 기준
- score drift
  - 점수 band 또는 기대 점수 방향이 틀린 경우
  - narrative가 무난해 보여도 score 자체가 다르면 score drift로 기록한다.
- narrative drift
  - 점수 band는 기대와 맞지만, 설명 문구가 실제 근거와 다른 축을 강조하거나 사용자 체감상 오해를 만드는 경우
  - consumer-side narrative owner 의심이 우선이다.
- both
  - 점수도 틀리고 설명도 그 틀린 판정을 그대로 강화할 때
  - score owner와 narrative owner를 같이 점검해야 한다.

### 공통 drift log template
```md
### NG-DRIFT-YYYYMMDD-01
- caseId:
- axis:
- scoreActual:
- scoreExpected:
- narrativeActual:
- narrativeExpectedIntent:
- driftType:
  - score
  - narrative
  - both
- severity:
  - low
  - medium
  - high
- suspectedOwner:
- notes:
```

### 운영 메모
- `suspectedOwner`는 `buildNewgradAxisPack`, `scoreDomainInterest`, `TransitionLiteResult narrative`, `unknown` 중 실제 관찰에 맞게 적는다.
- exact numeric mismatch가 없어도 expected reasoning과 다른 방향이면 narrative drift로 남긴다.
- Axis 2처럼 implementation audit 중인 축은 driftType을 더 보수적으로 기록한다.

### severity rule
- `low`
  - same 3-band 안에서 wording만 어색하거나, raw 5-band 차이가 경계 수준일 때
- `medium`
  - 3-band가 한 단계 벗어나고 같은 방향 drift가 2건 이상 반복될 때
- `high`
  - guardrail을 정반대로 깨거나 false high / false low가 반복돼 calibration 우선순위를 바꿔야 할 때

## 2026-04-05 Axis 1 / Axis 3 First Run Drift Entries

### NG-DRIFT-20260405-01
- caseId: `NG5A1-CASE-20260405-013`
- axis: `jobStructure`
- scoreActual: `mid_high / 80`
- scoreExpected: `mid`
- narrativeActual: `직무와 유사한 프로젝트나 인턴 경험이 있어 실무 투입 시 적응이 빠를 것으로 보입니다.`
- narrativeExpectedIntent: single direct project role 1건은 mid baseline에 두고 싶었다.
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack`
- notes: single direct role 1건이 3-band 기준 high로 올라갔다. 구현 drift인지 기대 보수성인지 다음 라운드에서 추가 분리 필요.

### NG-DRIFT-20260405-02
- caseId: `NG5A3-CASE-20260405-013`
- axis: `responsibilityScope`
- scoreActual: `mid_high / 80`
- scoreExpected: `mid`
- narrativeActual: `특정 프로젝트에서 리더 혹은 핵심 역할을 맡아 실질적인 결과물을 만들어낸 적이 있습니다.`
- narrativeExpectedIntent: project 1 + activity 1 조합은 수행 흔적은 있으되 아직 high는 아니라고 봤다.
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack`
- notes: evidence group 2개와 item 2개가 현재 rule에서 빠르게 high 측으로 붙는다.

### NG-DRIFT-20260405-03
- caseId: `NG5A3-CASE-20260405-014`
- axis: `responsibilityScope`
- scoreActual: `mid_high / 80`
- scoreExpected: `mid`
- narrativeActual: `특정 프로젝트에서 리더 혹은 핵심 역할을 맡아 실질적인 결과물을 만들어낸 적이 있습니다.`
- narrativeExpectedIntent: 짧은 인턴 + 발표형 프로젝트 조합은 경계 mid로 보려 했다.
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack`
- notes: 인턴 1 + 프로젝트 1 조합이 mid에서 high 쪽으로 붙는 패턴이 반복됐다.

## 2026-04-05 Axis 2 Targeted Expansion Memo

### short finding
- targeted case 6건은 모두 current expectation과 일치했다.
- 다만 `NGA2-CASE-20260405-021` related-major-only retest가 `mid`로 나와 prior under-lift 기록과 직접 충돌했다.
- 이 항목은 score drift로 승격하지 않고 old payload / raw result 재대조 필요 메모로 남긴다.

## 2026-04-05 Boundary Stress Drift Entries

### NG-DRIFT-20260405-04
- caseId: `NG5A3-CASE-20260405-025`
- axis: `responsibilityScope`
- scoreActual: `mid_high / 80`
- scoreExpected: `mid`
- narrativeActual: `특정 프로젝트에서 리더 혹은 핵심 역할을 맡아 실질적인 결과물을 만들어낸 적이 있습니다.`
- narrativeExpectedIntent: project 1 + short internship 1 + medium outcome은 upper-mid 경계로 보고 싶었다.
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack`
- notes: upper-mid boundary 1건이 다시 high-side로 올라갔다.

### NG-DRIFT-20260405-05
- caseId: `NG5A3-CASE-20260405-026`
- axis: `responsibilityScope`
- scoreActual: `mid_high / 80`
- scoreExpected: `mid`
- narrativeActual: `특정 프로젝트에서 리더 혹은 핵심 역할을 맡아 실질적인 결과물을 만들어낸 적이 있습니다.`
- narrativeExpectedIntent: project 1 + short internship 1 + 결과물 완성도 upper-mid 경계로 봤다.
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack`
- notes: Axis 3 upper-mid inflation이 반복되는지 확인하는 데 추가 근거가 됐다.

### NG-DRIFT-20260405-06
- caseId: `NG5A1-CASE-20260405-023`
- axis: `jobStructure`
- scoreActual: `mid_high / 80`
- scoreExpected: `mid`
- narrativeActual: `직무와 유사한 프로젝트나 인턴 경험이 있어 실무 투입 시 적응이 빠를 것으로 보입니다.`
- narrativeExpectedIntent: single direct role 1건은 upper-mid 경계로 두고 싶었다.
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack`
- notes: single direct role only가 again high-side로 읽혔다.

### NG-DRIFT-20260405-07
- caseId: `NG5A1-CASE-20260405-025`
- axis: `jobStructure`
- scoreActual: `low / 40`
- scoreExpected: `mid`
- narrativeActual: `직무와 관련된 간접적인 경험은 있으나, 핵심 과업과는 거리가 있습니다.`
- narrativeExpectedIntent: repeated adjacent signals는 low를 넘겨 mid 경계로 올라갈 여지가 있다고 봤다.
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack`
- notes: current rule은 adjacent repetition count를 사실상 가산하지 않는다.

## 2026-04-05 Readiness Judgment

### Axis 3
- repeated_direction: `지속적 upper inflation`, but `upper-mid boundary`에 국한됨
- judgment: `boundary_ready`
- reason: lower-mid와 true mid는 안정적이었고, upper-mid 4건이 같은 방향으로 high-side 상승했다. patch 논의 전 boundary calibration 검토는 가능하다.

### Axis 1
- repeated_direction: `single direct role high-side`, `adjacent repetition under-lift`
- judgment: `boundary_ready`
- reason: 패턴 방향은 반복됐지만 일부는 기대치 보수성과 규칙 의도가 섞여 있어 바로 patch-ready로 보긴 이르다.

### Axis 2
- repeated_direction: `mixed / repro conflict`
- judgment: `not_ready`
- reason: prior mismatch 3건 중 2건이 same harness에서 재현되지 않아 old payload/raw result 재대조가 먼저다.
## 2026-04-05 Micro-Boundary / Expectation / Raw Repro Entries

### `NG-DRIFT-20260405-08`
- caseId: `NG5A3-CASE-20260405-033`
- axis: `responsibilityScope`
- scoreActual: `80 / high`
- scoreExpected: `mid`
- narrativeActual: `핵심 역할과 결과물 경험 강조`
- narrativeExpectedIntent: `상단 mid 경계`
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack.scoreExecutionDepth`
- notes: `project + short internship` 조합이 prior run과 같은 방향으로 high-side 점프했다.

### `NG-DRIFT-20260405-09`
- caseId: `NG5A3-CASE-20260405-034`
- axis: `responsibilityScope`
- scoreActual: `80 / high`
- scoreExpected: `mid`
- narrativeActual: `핵심 역할과 결과물 경험 강조`
- narrativeExpectedIntent: `상단 mid 경계`
- driftType: `score`
- severity: `medium`
- suspectedOwner: `buildNewgradAxisPack.scoreExecutionDepth`
- notes: 발표/제출 단서를 약하게 바꿔도 high-side jump 방향은 유지됐다.

## 2026-04-05 Patch Readiness Gate Update

### axis 3
- repeated_direction: `upper-mid inflation`
- gate: `patch_ready`
- why:
  - prior upper-mid 2건 + micro 2건이 같은 방향으로 반복됐다.
  - lower-mid / true-mid / high control은 안정적이다.
  - `project + internship` 기반 그룹 조합이 jump를 설명한다.

### axis 1
- repeated_direction: `single direct role high-side`, `adjacent repetition low-side`
- gate: `guideline_first`
- why:
  - `scoreJobFit()` contract reread와 추가 4건이 모두 current behavior를 지지했다.
  - single direct role은 구현상 강신호이고 adjacent repetition은 누적 가산이 없다.
  - 구현 drift보다 reviewer expectation 보정이 더 그럴듯하다.

### axis 2
- repeated_direction: `raw payload shape conflict`
- gate: `repro_first`
- why:
  - `002R2`, `006R2`에서 old `low / 40`이 raw-object major shape로 재현됐다.
  - same harness conflict가 logic inconsistency보다 payload shape 차이에 더 가깝다.
  - old raw payload 보존 여부를 먼저 확인해야 한다.
## 2026-04-05 Certification Signal Audit Memo

### confirmed scoring usage
- newgrad 5축에서 certification direct scoring read는 `industryContext` 중심이다.
- `scoreDomainInterest()`는 `certificationsRaw`를 읽지만, target job별 role-specific cert matrix는 읽지 않는다.
- cert-only는 conservative cap으로 low 위주이며, context 또는 related major support가 있어야 mid/high 쪽으로 붙는다.

### coverage gap memo
- high_gap_families:
  - `cloud / infra / devops`
  - `security / privacy / compliance`
  - `procurement / SCM / logistics`
  - `HR`
- medium_gap_families:
  - `finance`
  - `data`
  - `marketing`
- low_gap_family:
  - `design / content` 계열은 cert importance 자체가 상대적으로 낮다.

### gap type reading
- `ui_option_gap`
  - role matrix에 있는 `AWS SAA`, `AZ-104`, `GCP ACE`, `ISMS-P`, `CPPG`, `CPSM`, `CPIM`, `CSMP`, `PHR`, `SHRM-CP`, `GA4`, `Meta Ads` 다수가 newgrad UI에서 직접 선택 불가
- `canonical_mapping_gap`
  - UI hardcoded label은 catalog alias 체계와 직접 연결되지 않는다.
- `scoring_usage_gap`
  - cert catalog / rules / role matrix가 newgrad scoring 경로에 연결되지 않는다.
- `job_specific_weight_gap`
  - 같은 cert라도 target job별 priority 차등을 쓰지 않는다.

### next calibration note
- certification calibration은 Axis 2 실행과 분리해서 보지 말아야 한다.
- 다만 coverage gap와 scoring 약반영은 서로 다른 문제이므로 로그에서도 분리 유지한다.
## 2026-04-05 Axis 3 Calibration Patch Review

### exact owner block reconfirm
- file: `src/lib/analysis/buildNewgradAxisPack.js`
- function: `scoreExecutionDepth(input)`
- exact anchors:
  - `function scoreExecutionDepth(input) {`
  - `else if (evidenceGroupCount >= 2 && evidenceItemCount >= 3) base = 4;`
  - `const semanticLift = Math.min(2, projectOutcomeLift + durationLift);`
  - `return Math.min(5, base + semanticLift);`
- helpers:
  - `countEvidenceGroups`
  - `countEvidenceItems`
  - `_getProjectOutcomeLift`
  - `_getDurationLift`
- input signals:
  - `projects`
  - `internships`
  - `extracurriculars`
  - `partTimeExperience`
  - `projectOutcomeLevels`
  - `experienceDurations`
- threshold / lift points:
  - `evidenceGroupCount >= 2 && evidenceItemCount >= 3 => base 4`
  - `projectOutcomeLift` max 2
  - `durationLift` max 1
  - `semanticLift = min(2, outcome + duration)`
  - final cap only at `5`
- most likely jump point:
  - `project + internship` 조합이 `base 4`를 먼저 열고, medium outcome 또는 duration이 붙으면 바로 `5`로 진입하는 구간

### cause split
- judgment: `mixed`
- why:
  - lower-mid / true-mid는 안정적이라 전체 threshold가 과도하게 낮다고 보긴 어렵다.
  - 반복 drift 케이스는 공통적으로 `project + internship`으로 `base 4`에 도달한다.
  - 그 위에서 medium outcome 또는 duration이 `semanticLift`를 더해 `5`로 밀어 올린다.
  - 즉 `base 4` 진입 조건과 `semanticLift`의 결합이 upper-mid inflation을 만든다.

### patch options

#### option A
- type: `threshold 미세 조정`
- modified file: `src/lib/analysis/buildNewgradAxisPack.js`
- modified function: `scoreExecutionDepth`
- range: `작음`
- before:
  - `evidenceGroupCount >= 2 && evidenceItemCount >= 3`이면 base 4
- after:
  - base 4 진입 조건을 `evidenceGroupCount >= 2 && evidenceItemCount >= 4`로 미세 상향
- expected effect:
  - `project + short internship` upper-mid를 mid 쪽에 더 오래 머물게 할 수 있다.
- possible side effect:
  - true high 직전의 합리적 base 4 케이스까지 눌릴 수 있다.
- safe 이유:
  - 단일 if 조건만 만지는 가장 좁은 수정이다.
- risk 이유:
  - lower-mid / true-mid 안정 구간보다, 현재 정상인 일부 high 후보까지 같이 내릴 위험이 있다.
- risk grade: `medium`

#### option B
- type: `semantic lift 미세 조정`
- modified file: `src/lib/analysis/buildNewgradAxisPack.js`
- modified function: `scoreExecutionDepth`
- range: `작음`
- before:
  - `semanticLift = Math.min(2, projectOutcomeLift + durationLift)`
- after:
  - base 4 상태에서는 medium outcome / duration만으로 5에 바로 진입하지 않도록 semantic lift를 조건부로 1로 제한
  - 예: base 4 + high outcome은 유지, base 4 + medium-only 또는 duration-only는 4 유지
- expected effect:
  - upper-mid inflation 반복 패턴만 직접 겨냥한다.
- possible side effect:
  - medium outcome을 꽤 의미 있게 보던 원래 설계를 과소보정할 수 있다.
- safe 이유:
  - `scoreExecutionDepth` 내부 lift 결합만 로컬 수정하는 방식이라 범위가 좁다.
- risk 이유:
  - high control 중 일부가 medium outcome 기반이면 같이 눌릴 수 있다.
- risk grade: `low`

#### option C
- type: `guard / cap 추가`
- modified file: `src/lib/analysis/buildNewgradAxisPack.js`
- modified function: `scoreExecutionDepth`
- range: `중간`
- before:
  - `return Math.min(5, base + semanticLift);`
- after:
  - `project + internship` upper-mid 조합에서 high 진입 시 strong evidence 재확인 guard 추가
  - 예: direct high outcome 또는 item count 4+가 없으면 4 cap 유지
- expected effect:
  - 문제 케이스를 가장 직접적으로 막는다.
- possible side effect:
  - 조건문이 늘어나며 함수 contract가 덜 단순해진다.
- safe 이유:
  - Axis 3 외 다른 축에는 직접 영향이 없다.
- risk 이유:
  - ad hoc guard로 읽히면 나중에 reviewer가 contract를 해석하기 어려워질 수 있다.
- risk grade: `medium`

### recommended option
- recommended: `option B`
- choice reason:
  - 반복 패턴이 `base 4 + weak/medium semantic lift` 결합에서 주로 발생했다.
  - lower-mid / true-mid는 안정적이므로 threshold 전체를 올리는 것보다 lift 결합만 미세하게 누르는 편이 더 국소적이다.
  - high control을 보존하면서 upper-mid inflation만 겨냥하기 쉽다.
- rejected options:
  - option A:
    - threshold 전체를 건드려 정상적인 base 4 후보까지 같이 누를 가능성이 있다.
  - option C:
    - 가장 직접적이지만 contract를 덜 단순하게 만들고 guard가 ad hoc처럼 보일 수 있다.
- apply readiness:
  - 다음 라운드에서 patch apply review로 넘어가도 된다.
- before apply additional check:
  - `base 4 + high outcome` true high control 2건을 regression fixture로 같이 붙여야 한다.

### execution prep
- patch classification:
  - safe calibration patch
  - Axis 3 only
  - no UI patch
- files modified:
  - `src/lib/analysis/buildNewgradAxisPack.js`
- exact anchors:
  - `function scoreExecutionDepth(input) {`
  - `const projectOutcomeLift = _getProjectOutcomeLift(input.projectOutcomeLevels || []);`
  - `const durationLift = _getDurationLift(input.experienceDurations || []);`
  - `return Math.min(5, base + semanticLift);`
- before contract:
  - base 4 케이스는 medium outcome / duration이 붙으면 쉽게 5로 진입할 수 있다.
- after contract:
  - base 4 케이스는 strong outcome 또는 더 강한 evidence가 있을 때만 5로 진입하고, weak/medium semantic lift만으로는 4에 머문다.
- validation criteria:
  - `NG5A3-CASE-20260405-033`, `034`, `025`, `026`은 high-side에서 내려와야 한다.
  - `NG5A3-CASE-20260405-035`, `036` high control은 유지되어야 한다.
  - lower-mid / true-mid stable 케이스는 band가 흔들리면 안 된다.
- rollback check:
  - true high control이 100 -> 80으로 떨어지는지
  - mid stable 케이스가 low로 내려가는지
  - narrative owner는 건드리지 않았는지

## 2026-04-05 Axis 3 Semantic Lift Micro-Calibration Apply

### classification
- safe patch
- newgrad Axis 3 semantic lift micro-calibration
- option B apply
- Axis 3 only

### exact owner / anchor
- owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth(input)`
- base anchor:
  - `if ((input.projects.length + input.internships.length) >= 3 && evidenceGroupCount >= 2) base = 5;`
  - `else if (evidenceGroupCount >= 2 && evidenceItemCount >= 3) base = 4;`
- lift anchor:
  - `const projectOutcomeLift = _getProjectOutcomeLift(input.projectOutcomeLevels || []);`
  - `const durationLift = _getDurationLift(input.experienceDurations || []);`
  - `const semanticLift = Math.min(2, projectOutcomeLift + durationLift);`

### precheck judgment
- upper-mid inflation의 가장 유력한 구문은 `base = 4` 진입 뒤 `projectOutcomeLift + durationLift`를 바로 더하는 경로였다.
- 특히 `project + internship` 조합에서 `projectOutcomeLift < 2`여도 `base 4 -> 5`가 쉬웠다.
- threshold 전체 조정보다 semantic lift 경로만 좁히는 option B가 가장 보수적이었다.

### applied micro-adjustment
- style: `base-4 상태에서 combo lift strength reduce`
- 추가 guard:
  - `base === 4`
  - `input.projects.length > 0 && input.internships.length > 0`
  - `projectOutcomeLift < 2`
- effect:
  - 위 조건에서는 semantic lift를 1단계 감산한다.
  - high outcome lift(`2`) 케이스는 guard 대상에서 제외했다.

### why this is option B
- threshold 조건식은 유지했다.
- band conversion / cap 구조도 유지했다.
- semantic lift가 붙는 강도만 좁혔다.
- Axis 3 owner block 내부에서만 끝났다.

### postcheck priority
- 먼저 볼 케이스:
  - `NG5A3-CASE-20260405-025`
  - `NG5A3-CASE-20260405-026`
  - `NG5A3-CASE-20260405-035`
  - `NG5A3-CASE-20260405-036`
  - `NG5A3-CASE-20260405-022`
  - `NG5A3-CASE-20260405-023`
- 목표:
  - upper-mid combo 일부만 하향
  - true high control 유지
  - lower-mid / true-mid 유지
## 2026-04-05 Axis 3 Post-Patch Engine Replay

### classification
- safe QA execution
- Axis 3 post-patch engine replay
- regression fixture lock

### replay method
- harness: `buildNewgradTransitionLiteResult(payload)`
- before baseline: 같은 normalized input에 pre-patch `scoreExecutionDepth()` 공식을 재적용
- after baseline: current patched engine result
- consumer check: `band -> score5 -> newgrad_execution_depth narrative` 기준 병행 확인

### replay result
- total replayed: `12`
- patched target changed: `4 / 4`
- true high preserved: `3 / 3`
- stable mid preserved: `3 / 3`
- low preserved: `2 / 2`
- undesired regression: `0`

### target cases
- `NG5A3-CASE-20260405-025`
  - before: `100 / high`
  - after: `80 / mid_high`
  - desired: `yes`
  - note: `project + short internship + activity + 발표/제출`
- `NG5A3-CASE-20260405-026`
  - before: `100 / high`
  - after: `80 / mid_high`
  - desired: `yes`
  - note: `project + short internship + activity + 결과물 완성`
- `NG5A3-CASE-20260405-033`
  - before: `100 / high`
  - after: `80 / mid_high`
  - desired: `yes`
  - note: `project + long internship + activity`
- `NG5A3-CASE-20260405-034`
  - before: `100 / high`
  - after: `80 / mid_high`
  - desired: `yes`
  - note: `project + short internship + part-time + 발표/제출`

### preserve controls
- true high
  - `NG5A3-CASE-20260405-011`: `100/high -> 100/high`
  - `NG5A3-CASE-20260405-035`: `100/high -> 100/high`
  - `NG5A3-CASE-20260405-036`: `100/high -> 100/high`
- stable mid
  - `NG5A3-CASE-20260405-022`: `60/mid -> 60/mid`
  - `NG5A3-CASE-20260405-023`: `60/mid -> 60/mid`
  - `NG5A3-CASE-20260405-024`: `60/mid -> 60/mid`
- low
  - `NG5A3-CASE-20260405-015`: `40/low -> 40/low`
  - `NG5A3-CASE-20260405-016`: `20/very_low -> 20/very_low`

### user-facing reading
- patched target 4건은 coarse 3-band로는 여전히 `high` 쪽이지만, `displayScore 100 -> 80`과 narrative가 `실제 인턴/산학협력 책임`에서 `특정 프로젝트 핵심 역할`로 완화됐다.
- 새 narrative drift는 관찰되지 않았다.
- 다만 consumer 3-band 체감은 완전한 `mid`로 내려오지 않으므로 watch 필요가 남는다.

### verdict
- `keep_with_watch`
- reason:
  - target inflation은 줄었다.
  - true high / stable mid / low control 회귀는 없었다.
  - 다만 coarse 3-band 체감은 여전히 high 쪽이라 후속 Axis 3 수정 때 같은 fixture를 반드시 같이 돌려야 한다.
## 2026-04-05 Axis 2 Raw Payload Snapshot Comparison

### classification
- safe investigation
- Axis 2 raw payload snapshot comparison
- normalization / payload contract audit only

### what was compared
- old mismatch source:
  - `NGA2-CASE-20260405-002`
  - `NGA2-CASE-20260405-006`
  - `NGA2-CASE-20260405-007`
- comparison layers:
  - raw payload snapshot
  - normalized input snapshot
  - Axis 2 scorer consumption summary
- same harness:
  - `buildNewgradTransitionLiteResult(payload)`

### key finding
- 가장 유력한 충돌 지점은 `major object` 자체가 아니라 normalization 후 `major`가 어떤 문자열로 남는지다.
- `label/subcategory`가 비고 `category code`만 남으면 related-major keyword match가 사라진다.
- 그 상태에서 `002`, `006` old `low / 40`이 same harness에서 재현됐다.
- 반대로 label이 보존되면 object shape여도 `mid / 60`이 나온다.

### cause buckets
- `NGA2-CASE-20260405-002`
  - bucket: `normalization_contract_conflict`
  - why:
    - `"컴퓨터공학"` -> `mid / 60`
    - `{ category: "engineering_it", label: "" }` -> normalized `"engineering_it"` -> `low / 40`
    - 같은 harness에서 shape difference만으로 결과가 갈린다.
- `NGA2-CASE-20260405-006`
  - bucket: `normalization_contract_conflict`
  - why:
    - `"경영학" + weak project` -> `mid / 60`
    - `{ category: "business_economics", label: "" } + weak project` -> `low / 40`
    - project typing alone보다 major normalization 문자열이 더 큰 차이를 만든다.
- `NGA2-CASE-20260405-007`
  - bucket: `expectation_conflict`
  - why:
    - direct internship context control은 string/object-category variant 모두 `mid / 60`으로 유지됐다.
    - 이번 snapshot set에서는 shape conflict보다 context signal dominance가 더 커 보인다.

### readiness memo
- current judgment: `contract_fix_candidate`
- reason:
  - same normalized input의 흔들림은 보이지 않았다.
  - raw -> normalized contract에서 `major` 문자열 보존 여부가 결과를 가르는 evidence가 충분하다.
  - scorer bug patch review로 넘기기보다 normalization/payload contract 정리가 먼저다.
## 2026-04-05 Newgrad Job-Specific Cert Weighting Contract Design

### design intent
- current newgrad path는 cert weighting이 없고 Axis 2 heuristic만 있다.
- 이번 라운드는 apply가 아니라 conservative weighting contract를 잠그는 단계다.
- coverage gap와 weighting gap를 섞지 않기 위해 cloud/security 한정 샘플만 설계했다.

### locked principles
- cert는 direct role / internship / project보다 약한 보조 신호다.
- cert only는 high를 만들지 않는다.
- related cert는 unrelated cert보다 분명히 유리하되, direct evidence 부재를 뒤집어 쓰면 안 된다.
- same-family multi-cert stacking에는 cap을 둔다.

### readiness memo
- judgment: `design_locked_waiting_for_linkage`
- why:
  - schema와 cloud/security 샘플 contract는 충분히 설계됐다.
  - 하지만 current newgrad path는 UI option / canonical mapping bridge가 아직 없다.
  - Axis 2 `major` normalization contract 정리가 먼저다.

## 2026-04-05 SAFE INVESTIGATION / Newgrad Cert Mapping Bridge Readiness

- classification: `SAFE INVESTIGATION`
- purpose:
  - job-specific cert weighting apply 전 단계에서 UI -> catalog -> role matrix 연결 가능성만 조사했다.
  - cloud / security 샘플 기준 phase 1 apply readiness를 판정했다.
- confirmed:
  - UI cert option은 `NewgradTransitionLiteInput.jsx` 하드코딩 option이다.
  - current payload에는 canonical cert key가 없고 `{ category, subcategory, label }`만 내려간다.
  - cert catalog asset과 role cert matrix asset은 cloud/security 기준 usable하다.
  - 하지만 UI label bridge와 `JOB_* -> role:*` adapter가 아직 없다.
- readiness:
  - cloud: `mostly_ready_with_small_bridge`
  - security: `mostly_ready_with_small_bridge`
  - final: `design_locked_waiting_for_linkage`
- calibration note:
  - 지금 필요한 것은 weighting 확대가 아니라 linkage closure다.
  - apply 순서는 `normalization contract -> cert mapping bridge -> role bridge -> limited phase 1 read path`가 안전하다.

## 2026-04-05 SAFE DESIGN / Bridge Contract Closure

- classification: `SAFE DESIGN`
- purpose:
  - cloud/security 한정으로 `UI cert label -> canonical cert id`
  - `targetJobId -> role:*`
  - 두 bridge contract를 실제 도입 가능한 수준으로 잠갔다.
- locked contracts:
  - cert mapping input: `{ category, subcategory, label }`
  - cert mapping output: `rawLabel`, `rawCategory`, `rawSubcategory`, `mappingStatus`, `canonicalCertIds`, `mappingConfidence`, `notes`
  - role adapter input: `targetJobId`
  - role adapter output: `targetJobId`, `roleFamilyId`, `adapterStatus`, `source`, `notes`
- readiness note:
  - bridge contract는 닫혔지만 apply 전 gate로 `normalization contract fix`가 아직 선행이다.
- final:
  - `bridge_contract_locked_but_waiting_for_normalization_fix`
