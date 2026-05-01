# PASSMAP SSOT Map

## PASSMAP 5축 Owner Map (2026-04-05)

### 문서 경계
- 이 문서는 코드 기준 mirror 문서다.
- runtime SSOT는 source code이며, 이 문서가 코드보다 우선하지 않는다.
- owner / contract / caveat를 빠르게 확인하기 위한 HQ 구조 문서로 사용한다.
- 조사 결과에서 확정된 내용만 기록하며, 불확실한 부분은 caveat 또는 과도기 상태로 남긴다.
- 현재 precheck에서 우선 읽어야 하는 범위는 상단 `## PASSMAP 5축 Owner Map (2026-04-05)`부터 `### 변경 유형별 갱신 범위`까지다.
- 그 아래에 남아 있는 이전 조사/설계 메모는 historical appendix로 취급하며, 현재 owner map이나 runtime SSOT보다 우선하지 않는다.
- 기본 precheck는 이 문서 중심으로 수행하며, `00_HQ/Session_Handoff_Latest.md`는 기본 precheck 문서로 사용하지 않는다.
- canonical HQ/Execution 문서 루트는 프로젝트 루트의 `00_HQ/`, `05_Execution/`다.
- preciseAnalysis HQ/Execution 문서도 2026-04-16 정리부터 각각 `00_HQ/Precise_Analysis_*`, `05_Execution/Precise_Analysis_*`로 통합 관리한다.
- `docs/00_HQ`, `docs/05_Execution`는 운영 경로에서 제거했으며, 이후 같은 이름의 docs 하위 루트를 다시 만들지 않는다.

### Experienced 5축

| axis key | 사용자 노출 이름 | score owner | upstream owner | explanation owner | UI render owner | primary inputs | secondary inputs | band 기준 | caveat |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `jobStructure` | 직무 구조 연결성 | `src/lib/analysis/buildAxisConnectivityPack.js > scoreAxis1()` | `src/lib/transitionLite/classifyTransition.js > classifyTransition()` for `jobDistance` | `src/data/transitionLite/axisExplanationRegistry.js > buildJobStructureExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | strongSignals overlap, responsibilityHints overlap, `jobDistance` | mediumSignals overlap, family distance, shared family count, mission/output match | `>=88 high`, `>=56 mid_high`, `>=40 mid`, `>=20 low`, else `very_low` | 직무 task/output 구조 축이다. Axis 3 의미와 혼용 금지 |
| `industryContext` | 산업 맥락 연결성 | `src/lib/analysis/buildAxisConnectivityPack.js > scoreAxis2()` | `src/lib/transitionLite/classifyTransition.js > classifyTransition()` for `industryDistance` | `src/data/transitionLite/axisExplanationRegistry.js > buildIndustryContextExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | `industryDistance`, same sector/subsector, valueChain fit, coreContext fit | regulation barrier fit, sales cycle fit | `>=80 high`, `>=60 mid_high`, `>=40 mid`, `>=20 low`, else `very_low` | customer/buying 구조 축과 분리해서 읽어야 한다 |
| `responsibilityScope` | 역할 범위 연결성 | `src/lib/analysis/buildAxisConnectivityPack.js > scoreAxis3()` | `src/lib/transitionLite/classifyTransition.js > classifyTransition()` for `responsibilityShift` | `src/data/transitionLite/axisExplanationRegistry.js > buildResponsibilityScopeExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | `responsibilityShift` | 없음. 현재는 upstream enum-only | `>=75 high`, `>=60 mid_high`, `>=45 mid`, `>=30 low`, else `very_low` | final score owner만 적으면 불완전하다. upstream classification owner를 같이 적어야 drift가 줄어든다 |
| `customerType` | 고객 유형 연결성 | `src/lib/analysis/buildAxisConnectivityPack.js > scoreAxis4()` | 없음 | `src/data/transitionLite/axisExplanationRegistry.js > buildCustomerTypeExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | customerMarket fit | buyingMotion fit, decisionStructure fit | `>=80 high`, `>=55 mid_high`, `>=40 mid`, else `low` | 이름은 고객 유형이지만 실제 raw는 buying motion / decision structure까지 포함한다 |
| `roleCharacter` | 직무 성격 연결성 | `src/lib/analysis/buildAxisConnectivityPack.js > scoreAxis5()` | `src/lib/transitionLite/classifyTransition.js > classifyTransition()` for `roleWeightShift` | `src/data/transitionLite/axisExplanationRegistry.js > buildRoleCharacterExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | `roleWeightShift` | mission/output/successMetric/horizon match | `>=75 high`, `>=50 mid_high`, `>=35 mid`, else `low` | soft skill 축으로 오독하면 drift가 난다. role profile + job meta match 축이다 |

### Newgrad 5축

| axis key | 사용자 노출 이름 | score owner | upstream owner | explanation owner | UI render owner | primary inputs | secondary inputs | band 기준 | 과도기 / 잠김 상태 | caveat |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `jobStructure` | 전공과 직무의 연결성 (Job Fit) | `src/lib/analysis/buildNewgradAxisPack.js > scoreJobFit()` | `src/data/transitionLite/newgradAxis1MajorPriorRegistry.js > resolveNewgradAxis1MajorPrior()` | `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradJobFitExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | `major`, `resolveNewgradAxis1MajorPrior()` final/label, `jobMajorDependencyRegistry` tier | `projects[].role`, `internships|partTimeExperience[].roleFamily`, `coursework`, fallback evidence group count | `5 high`, `4 mid_high`, `3 mid`, `2 low`, else `very_low` | major prior registry + dependency tier에 잠김 | Axis 1 base score는 전공 prior가 먼저 결정하고, role evidence는 보조 signal/설명 근거로 남는다 |
| `industryContext` | 산업 연관성 | `src/lib/analysis/buildNewgradAxisPack.js > scoreDomainInterest()` | `src/lib/transitionLite/buildNewgradTransitionLiteResult.js > buildPhase1CertRoleRelevancePack()` for cert relevance bridge | `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradDomainInterestExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | major-industry alignment, direct-relevant cert support, strong context evidence | weak project signal, support context, industry profile coverage | `5 high`, `4 mid_high`, `3 mid`, `2 low`, else `very_low` | phase1 cert bridge와 industry profile coverage에 잠김 | cert relevance bridge / industry coverage caveat를 반드시 같이 문서화해야 한다 |
| `responsibilityScope` | 유사한 경험이 있는가? | `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth()` | 없음 | `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradExecutionDepthExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | evidence group/item count | project outcome lift, duration lift, combo evidence | `5 high`, `4 mid_high`, `3 mid`, `2 low`, else `very_low` | 비교적 선명 | experienced Axis 3과 label key는 같지만 실제 의미는 execution depth 쪽이다 |
| `customerType` | 고객 커뮤니케이션 적합성 | `src/lib/analysis/buildNewgradAxisPack.js > scoreInteractionFit()` | 없음 | `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradInteractionFitExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | internships / projects / extracurriculars / part-time evidence count | stakeholder semantic lift, `workStyleNotes` presence | `5 high`, `4 mid_high`, `3 mid`, `2 low`, else `very_low` | count + stakeholder lift 조합 | experienced Axis 4와 같은 key를 쓰지만 의미는 고객 구조가 아니라 interaction evidence다 |
| `roleCharacter` | 강점과 재능 | `src/lib/analysis/buildNewgradAxisPack.js > scoreSoftSkillMatch()` | `src/lib/analysis/buildNewgradAxisPack.js > _AXIS5_TARGET_TRAITS` mapping | `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradSoftSkillMatchExplanation()` | `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()` | `strengths`, `workStyleNotes`, target trait hits | unresolved target major일 때 raw count fallback | `5 high`, `4 mid_high`, `3 mid`, `2 low`, else `very_low` | self-report 입력과 trait map coverage에 잠김 | self-report 기반 caveat를 반드시 남겨야 한다 |

### Axis key / 사용자 노출 이름 매핑

#### Experienced
- `jobStructure` -> `직무 구조 연결성`
- `industryContext` -> `산업 맥락 연결성`
- `responsibilityScope` -> `역할 범위 연결성`
- `customerType` -> `고객 유형 연결성`
- `roleCharacter` -> `직무 성격 연결성`

#### Newgrad
- `jobStructure` -> `전공과 직무의 연결성 (Job Fit)`
- `industryContext` -> `산업 연관성`
- `responsibilityScope` -> `유사한 경험이 있는가?`
- `customerType` -> `고객 커뮤니케이션 적합성`
- `roleCharacter` -> `강점과 재능`

#### 주의
- experienced와 newgrad는 같은 내부 key를 재사용해도 의미가 다를 수 있다.
- owner map, Product 설명, QA 문서에서 experienced/newgrad를 섞어 적지 않는다.

### Known Drift Risk
- experienced Axis 3/5를 final scorer만으로 기록하면 upstream classification owner가 빠져 drift가 난다.
- experienced Axis 4는 축 이름만 보면 customer-only로 오해하기 쉽지만 실제 raw는 buying motion / decision structure까지 포함한다.
- newgrad Axis 2는 cert relevance bridge와 industry profile coverage에 의존한다. coverage가 바뀌면 설명도 같이 갱신해야 한다.
- newgrad Axis 5는 self-report 입력 기반이라 과신성 문구가 들어가면 drift가 커진다.
- same key reuse 때문에 `responsibilityScope`, `customerType`, `roleCharacter`는 experienced/newgrad 의미 차이를 항상 병기해야 한다.

### 갱신 규칙
- 아래가 바뀌면 이 문서를 갱신한다.
- score formula / threshold / band
- upstream classification / registry / bridge contract
- explanation builder owner 또는 payload contract
- UI render contract 또는 label mapping
- 함께 갱신할 문서
- `01_Product/Passmap_5Axis_Guide.md`
- `05_Execution/Decision_Log.md`
- `00_HQ/Session_Handoff_Latest.md`
- `docs/COMM_PATCH_NOTES.md`
- 조사/패치 라운드 메모가 필요하면 `docs/끄적.md`

### 5축 문서 유지보수 규칙
- 기본 precheck는 `00_HQ/SSOT_Map.md` 상단 owner map, known drift / caveat, `### 변경 유형별 갱신 범위`만 읽는다.
- `00_HQ/Session_Handoff_Latest.md`는 append-only 성격 때문에 기본 precheck에서 제외하고, 직접 충돌/역사 확인이 필요할 때만 제한적으로 본다.
- score owner 변경 시: `00_HQ/SSOT_Map.md`, `01_Product/Passmap_5Axis_Guide.md`, `05_Execution/Decision_Log.md`, `00_HQ/Session_Handoff_Latest.md`, `docs/COMM_PATCH_NOTES.md`를 같이 갱신한다.
- upstream classification 변경 시: `00_HQ/SSOT_Map.md`는 필수, Product guide는 해당 축 해석이 달라질 때 같이 갱신한다.
- explanation builder 변경 시: `00_HQ/SSOT_Map.md`, `01_Product/Passmap_5Axis_Guide.md`, `05_Execution/Decision_Log.md`를 같이 갱신한다.
- 사용자 노출 축 이름/라벨 변경 시: `00_HQ/SSOT_Map.md`, `01_Product/Passmap_5Axis_Guide.md`, `00_HQ/Session_Handoff_Latest.md`, `docs/COMM_PATCH_NOTES.md`를 같이 갱신한다.
- experienced/newgrad는 같은 key를 재사용해도 의미가 다를 수 있으므로 한쪽만 바뀌었더라도 다른 쪽 설명도 같이 확인한다.
- 문서는 mirror이며 코드가 우선이다. 코드 변경 없이 문서만 선행 확정하지 않는다.

### 변경 유형별 갱신 범위

| 변경 유형 | 예시 | 반드시 갱신할 문서 | 선택 갱신 문서 | 비고 |
| --- | --- | --- | --- | --- |
| score formula change | raw 계산식, threshold, band 변경 | `00_HQ/SSOT_Map.md`, `01_Product/Passmap_5Axis_Guide.md`, `05_Execution/Decision_Log.md`, `00_HQ/Session_Handoff_Latest.md`, `docs/COMM_PATCH_NOTES.md` | `docs/끄적.md` | Product 해석이 거의 항상 같이 바뀐다 |
| upstream classification change | `classifyTransition()`, major prior, cert relevance bridge 변경 | `00_HQ/SSOT_Map.md`, `05_Execution/Decision_Log.md`, `00_HQ/Session_Handoff_Latest.md`, `docs/COMM_PATCH_NOTES.md` | `01_Product/Passmap_5Axis_Guide.md`, `docs/끄적.md` | experienced Axis 3/5, newgrad Axis 1/2는 특히 같이 본다 |
| explanation copy contract change | explanation builder owner, summary/positives/gaps 계약 변경 | `00_HQ/SSOT_Map.md`, `01_Product/Passmap_5Axis_Guide.md`, `05_Execution/Decision_Log.md`, `docs/COMM_PATCH_NOTES.md` | `00_HQ/Session_Handoff_Latest.md`, `docs/끄적.md` | score는 안 바뀌어도 Product 해석은 바뀔 수 있다 |
| UI label/name change | 축 이름, 사용자 노출 라벨 변경 | `00_HQ/SSOT_Map.md`, `01_Product/Passmap_5Axis_Guide.md`, `00_HQ/Session_Handoff_Latest.md`, `docs/COMM_PATCH_NOTES.md` | `05_Execution/Decision_Log.md`, `docs/끄적.md` | experienced/newgrad key 재사용 오해를 같이 점검한다 |
| axis add/remove/rename | 5축 구조 변경, 축 재편 | `00_HQ/SSOT_Map.md`, `01_Product/Passmap_5Axis_Guide.md`, `05_Execution/Decision_Log.md`, `00_HQ/Session_Handoff_Latest.md`, `docs/COMM_PATCH_NOTES.md` | `docs/끄적.md` | 구조 변경은 문서 세트 전체 갱신이 기본이다 |
| QA interpretation change | QA 결과로 운영 해석만 조정 | `05_Execution/Decision_Log.md`, `docs/COMM_PATCH_NOTES.md` | `01_Product/Passmap_5Axis_Guide.md`, `00_HQ/Session_Handoff_Latest.md`, `docs/끄적.md` | 코드 owner나 contract가 안 바뀌면 HQ owner map은 선택 갱신이다 |

## 사용 목적
- true owner / SSOT / producer / consumer 관계를 빠르게 확인하는 작업 지도
- 큰 작업 전에 owner 혼선을 줄이기 위한 기준 문서

## 업데이트 원칙
- 실제 read/trace 결과 기반만 기록
- 추측으로 owner를 확정하지 않음
- consumer convenience copy와 true owner를 분리해서 적음

## uncertain 표기 규칙
- read/trace 없이 확정할 수 없으면 `uncertain`
- 빈칸보다 `uncertain` 우선
- 필요 시 producer owner / consumer owner / adapter owner를 분리 기재

# PASSMAP SSOT Map

## Rule
- 추측 금지
- 실제 read/trace 결과 기반만 기록
- 확실하지 않으면 `uncertain` 표기
- consumer convenience copy와 true owner를 구분
- producer owner / consumer owner / adapter owner를 필요 시 분리 기재

## Core Tracking Fields
- Axis score owner: uncertain
- Axis narrative owner: uncertain
- Hero text owner: uncertain
- Why explanation owner: uncertain
- Supported review points owner: uncertain
- Evidence grounding owner: uncertain
- Action primary owner: uncertain
- targetJobRead owner: uncertain
- targetIndustryRead owner: uncertain
- audience selector owner: uncertain
- analysis target selection owner: uncertain
- input canonical id owner: uncertain
- newgrad axis pack owner: uncertain
- newgrad result narrative owner: uncertain

## Axis 3 Patch / Rollback Notes
- Axis 3 patch owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth(input)`
- Axis 3 postcheck result doc: `05_Execution/Accuracy_QA_Log.md`
- Axis 3 calibration reasoning doc: `05_Execution/Newgrad_Calibration_Log.md`
- Axis 3 working memo doc: `docs/끄적.md`
- rollback 시 먼저 볼 문서:
  - `05_Execution/Newgrad_Calibration_Log.md`
  - `05_Execution/Accuracy_QA_Log.md`
  - `00_HQ/Session_Handoff_Latest.md`

## 2026-04-05 Newgrad 5-Axis Owner Investigation

- newgrad axis pack owner: `src/lib/analysis/buildNewgradAxisPack.js > buildNewgradAxisPack(input)`
- newgrad result narrative owner: `src/data/transitionLite/axisExplanationRegistry.js`
- input canonical id owner: `src/components/input/NewgradTransitionLiteInput.jsx > resolvedPayload`
- final newgrad vm owner: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js > buildNewgradTransitionLiteResult(payload)`
- final UI axis owner: `src/components/report/TransitionLiteResult.jsx > TransitionLiteResult({ viewModel })`

- axis score owner
  - Axis 1: `scoreJobFit()`
  - Axis 2: `scoreDomainInterest()`
  - Axis 3: `scoreExecutionDepth()`
  - Axis 4: `scoreInteractionFit()`
  - Axis 5: `scoreSoftSkillMatch()`

- axis explanation owner
  - Axis 1: `buildNewgradJobFitExplanation()`
  - Axis 2: `buildNewgradDomainInterestExplanation()`
  - Axis 3: `buildNewgradExecutionDepthExplanation()`
  - Axis 4: `buildNewgradInteractionFitExplanation()`
  - Axis 5: `buildNewgradSoftSkillMatchExplanation()`

- label owner
  - visible labels are producer-owned in `src/lib/analysis/buildNewgradAxisPack.js > makeAxis("<label>", ...)`
  - consumer does not rename labels for newgrad axes

- detail owner
  - detail toggle payload owner: `src/data/transitionLite/axisExplanationRegistry.js`
  - detail renderer owner: `src/components/report/TransitionLiteResult.jsx`

- current overlap risk summary
  - Axis 1 vs Axis 3: high
  - Axis 2 vs Axis 4: medium
  - Axis 4 vs Axis 5: medium

- next recommended design decision
  - axis definition SSOT는 `buildNewgradAxisPack.js`
  - explanation SSOT는 `axisExplanationRegistry.js`
  - UI는 consumer-only 유지

## 2026-04-05 Newgrad 5-Axis Definition Boundary Lock

- current implemented boundary summary
  - Axis 1 currently mixes academic evidence and role evidence.
  - Axis 2 currently mixes industry preparation and some interaction-context evidence.
  - Axis 3 currently owns count/depth/outcome/duration evidence.
  - Axis 4 currently mixes interaction evidence with `workStyleNotes`.
  - Axis 5 currently owns `strengths` and `workStyleNotes`.

- recommended boundary SSOT
  - Axis 1 definition: `직무 과업 연결성`
  - Axis 1 include: `major`, `coursework`, `projects[].role`, `internships|partTimeExperience[].roleFamily`
  - Axis 1 exclude: `projects[].outcomeLevel`, `internships|partTimeExperience[].duration`, depth/responsibility style evidence
  - Axis 2 definition: `산업 문법 접점`
  - Axis 2 include: `major`, `certifications`, `projects[].type`, `internships|contractExperiences[].type`, `internships|contractExperiences[].stakeholderType`, `targetIndustryId`
  - Axis 2 exclude: `workStyleNotes`, `strengths`, duration/depth signals
  - Axis 3 definition: `실행 깊이와 책임 경험`
  - Axis 3 include: `projects`, `internships`, `extracurriculars`, `partTimeExperience`, `projects[].outcomeLevel`, `internships|partTimeExperience[].duration`
  - Axis 3 exclude: `major`, `coursework`, `certifications`, `strengths`, `workStyleNotes`
  - Axis 4 definition: `타인 상대 경험과 상호작용 적합성`
  - Axis 4 include: `internships|partTimeExperience[].stakeholderType`, `internships`, `projects`, `extracurriculars`, `partTimeExperience`
  - Axis 4 exclude: `strengths`, `workStyleNotes`, target trait matching
  - Axis 5 definition: `개인 성향과 강점 적합성`
  - Axis 5 include: `strengths`, `workStyleNotes`, `targetJobId`
  - Axis 5 exclude: all project/internship/context evidence

- highest-priority conflict pair
  - Axis 1 vs Axis 3

- next single safe step
  - Axis 1 exclude contract를 먼저 고정
## Axis Explanation SSOT (2026-04-08)
- `00_HQ/Axis_Explanation_Output_Contract.md`
- `00_HQ/Axis_Explanation_Writing_Rules.md`
- `00_HQ/Axis_Explanation_QA_Checklist.md`
- `05_Execution/Axis_Explanation_Refactor_Log.md`

## Newgrad Axis 1 Read Path Contract Lock (2026-04-17)

- comparisonBlock 계약: major-only (1차 패치 완료)
- explanation producer 계약: major-only (1차 패치 완료)
- FromPacks read path 계약: major-only (2차 패치 완료)
  - `buildNewgradWhyThisReadFromPacks()` → whyThisRead
  - `buildInputEvidenceReadFromPacks()` → inputEvidenceRead
  - `buildAxisReadSummaryFromPacks()` → axisReadSummary
- 미수정 범위
  - `scoreJobFit()` / `_buildJobFitBaseScore()` / `_applyJobMajorDependencyToJobFit()` (점수 로직)
  - `TransitionLiteResult.jsx` (consumer)
  - axis2~5
- 잔존 리스크
  - old version helper (`buildAxisReadSummary()`, `buildInputEvidenceRead()`)는 현재 런타임 미호출이나 동일 누수 패턴 잔존
  - 향후 호출 경로가 추가될 경우 재점검 필요
