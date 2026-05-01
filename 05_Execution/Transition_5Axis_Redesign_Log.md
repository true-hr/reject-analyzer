# Transition 5-Axis Redesign Log

## 2026-04-03 SAFE DOCUMENTATION + SAFE INVESTIGATION

### Scope Lock
- product code 변경 없음
- scoring logic 변경 없음
- UI copy 변경 없음
- 이번 라운드는 문서화 + signal inventory 조사만 수행

### Files Read
- `src/lib/analysis/buildAxisConnectivityPack.js`
- `src/lib/transitionLite/classifyTransition.js`
- `src/data/job/jobOntology.index.js`
- `src/data/industry/industryRegistry.index.js`
- `src/data/transitionLite/JOB_ROLE_WEIGHT_PROFILE_MAP.js`
- `src/data/transitionLite/JOB_RESPONSIBILITY_PROFILE_MAP.js`
- `src/components/report/TransitionLiteResult.jsx`
- `src/App.jsx`
- `src/lib/transitionLite/buildTransitionLiteResult.js`
  - 이유: strongSignals / responsibilityHints / buyingMotion / decisionStructure / coreContext를 이미 읽는 보조 scoring helper와 비교 row owner라서 재설계 signal inventory에 직접 필요
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js`
  - 이유: mission/output/stakeholder/successMetric/horizon 메타가 4축·5축 확장 후보의 직접 source라서 필요
- `src/lib/transitionLite/classifyTransitionReadPatterns.js`
  - 이유: stakeholder/output/metric/horizon 유사도 proxy를 이미 계산하는 곳이라 4축·5축 확장 근거로 직접 필요
- `src/data/transitionLite/targetReadAdapter.js`
  - 이유: customer structure, industry traits, customerMarket display, read bullets 조합 owner라서 2축·4축 확장 근거로 직접 필요
- `src/data/job/ontology/business/service_planning.js`
  - 이유: job ontology schema에서 `strongSignals`, `mediumSignals`, `responsibilityHints`, `levelHints`, `axes`, `summaryTemplate`가 실제로 어떻게 들어있는지 확인 필요
- `src/data/industry/registry/it_software_platform/b2b_saas.js`
  - 이유: industry registry schema에서 `customerMarket`, `buyingMotion`, `decisionStructure`, `proofSignals`, `coreContext`, `jobInteractionHints`가 실제로 어떻게 들어있는지 확인 필요
- `src/data/industry/registry/public_association_nonprofit/public_institution.js`
  - 이유: B2G/공공 문맥에서 `customerMarket`, `decisionStructure`, `jobInteractionHints`가 4축 확장 signal로 충분한지 확인 필요
- `00_HQ/Session_Handoff_Latest.md`
  - 이유: 이번 판단과 우선순위를 HQ 레벨 handoff로 고정해야 해서 필요
- `02_Product/Accuracy_QA/Transition_Scoring_Execution_Input_Contract.md`
  - 이유: transition-lite 경로가 주 score owner가 아니라 classification/read owner라는 기존 기록과 충돌 없는지 확인 필요
- `05_Execution/Scoring_Calibration_Log.md`
  - 이유: scoring redesign 관련 운영 기록이 어떤 owner에 남는지 기존 execution 구조 확인 필요
- `docs/끄적.md`
  - 이유: 기존 communication/report owner 문서가 무엇을 기록하는지 확인하고 불필요한 중복 문서 생성을 피하기 위해 필요
- `docs/TRANSITION_LITE_REGRESSION.md`
  - 이유: transition-lite 변경 시 regression owner 범위와 재설계 후 검증 연결점을 확인하기 위해 필요
- `docs/직무.산업/Round 1. 판정 실행 순서 계약 — 잠금본.txt`
  - 이유: producer->classification->selection->consumer 순서를 다시 해치지 않기 위한 기존 pipeline SSOT 확인 필요

### 현재 vs 목표 축 계약 요약
- 1축 현재: job ontology distance + family adjacency
- 1축 목표: 핵심 업무 유사성
- gap: 매우 큼
- priority: 1
- 4축 현재: customerMarket flip + sameSector 보정
- 4축 목표: 상대 고객 / stakeholder / buying / decision 구조 유사성
- gap: 큼
- priority: 2
- 5축 현재: role weight profile shift
- 5축 목표: 일하는 방식 / 역할 성향 유사성
- gap: 큼
- priority: 3
- 2축 현재: industry registry distance + sector/subSector relation
- 2축 목표: 산업 배경 / 운영 맥락 유사성
- gap: 중간
- priority: 4
- 3축 현재: responsibility profile rank gap
- 3축 목표: 책임 수준 / 범위 유사성
- gap: 작음
- priority: 5

### Signal Inventory 핵심 메모
- 1축용 강한 기존 signal
  - `families[*].strongSignals`
  - `families[*].mediumSignals`
  - `roles[*].responsibilityHints`
  - `roles[*].levelHints`
  - `families[*].summaryTemplate`
  - `jobTransitionReadMetaRegistry.outputType`
- 4축용 강한 기존 signal
  - `industry.customerMarket`
  - `industry.buyingMotion`
  - `industry.decisionStructure`
  - `industry.jobInteractionHints`
  - `support_industry_traits.customerStructure`
  - `jobTransitionReadMetaRegistry.stakeholderPrimary`
  - `classifyTransitionReadPatterns().debug.stakeholderSame`
- 5축용 강한 기존 signal
  - `JOB_ROLE_WEIGHT_PROFILE_MAP`
  - `jobTransitionReadMetaRegistry.missionType`
  - `outputType`
  - `successMetricType`
  - `horizonType`
  - `classifyTransitionReadPatterns()` support pattern
- 2축 유지 후보 signal
  - `industryDistance`
  - `valueChainPosition`
  - `coreContext`
  - `decisionStructure`
  - `jobInteractionHints`
  - `support_industry_traits.operatingLanguage`, `problemTypes`
- 3축 유지 후보 signal
  - `JOB_RESPONSIBILITY_PROFILE_MAP`
  - `responsibilityShift`
  - `roles[*].responsibilityHints`

### 리스크 메모
- 4축과 5축은 현재 producer에 없는 richer signal이 이미 asset에는 있지만, 아직 `buildAxisConnectivityPack.js`에서 안 쓰고 있다.
- 1축은 strongest asset가 이미 있지만 현재 producer가 거의 쓰지 않아서 redesign 폭이 가장 크다.
- 2축은 현재 엔진을 유지하면서 설명력을 키울 여지가 있고, 3축은 재사용 가능성이 가장 높다.

### next round exact questions
1. 1축 raw score를 `strongSignals` overlap 중심으로 만들 때 `mediumSignals`, `responsibilityHints`, `outputType` 가중치를 어떻게 나눌 것인가.
2. 1축에서 ontology distance는 주점수에서 제외할지, tie-breaker 또는 floor/ceiling으로만 남길지.
3. 1축 band 기준을 overlap ratio 기준으로 자를지, weighted signal sum 기준으로 자를지.
4. 4축에서 `customerMarket`와 `stakeholderPrimary`가 충돌할 때 어떤 source를 우선 SSOT로 볼지.
5. 4축에 `buyingMotion`과 `decisionStructure`를 넣을 때 상대 고객 축과 의사결정 구조 축이 과도하게 섞이지 않게 어떤 제한을 둘지.
6. 5축에서 `roleWeightShift`는 primary feature로 유지할지, mission/output/metric/horizon 메타 중 하나로 downgrade할지.
7. 5축에서 `classifyTransitionReadPatterns()` support pattern을 직접 score source로 쓸지, band narrative evidence로만 쓸지.
8. 2축에서 `industryDistance` 기반 큰 틀을 유지하면서 `coreContext`/`jobInteractionHints`를 어떻게 보강점수로 붙일지.
9. 3축은 현재 `responsibilityShift`만으로 충분한지, `responsibilityHints` overlap을 low-impact 보정으로 넣을지.
10. 재설계 후 regression owner를 `docs/TRANSITION_LITE_REGRESSION.md` 케이스로 확장할지, 축별 QA set을 별도 만들지.

### 1축 deep investigation
- 현재 Axis 1 producer는 `src/lib/analysis/buildAxisConnectivityPack.js:215~237 scoreAxis1()`이며, 실질 입력은 `jobDistance`, `familyDistance`, `sharedFamiliesCount`뿐이다.
- 현재 producer 파일 상단 주석은 `summaryTemplate`, `hints text`, `buyingMotion`, `decisionStructure`, `coreContext`를 score 대상에서 제외하고 있다.
- 반면 `src/lib/transitionLite/buildTransitionLiteResult.js:340 scoreJobKeyOutputsFit()`는 이미 `strongSignals + responsibilityHints` overlap을 계산하고 있어 1축 재설계의 가장 직접적인 선행 helper다.
- `src/lib/transitionLite/buildTransitionLiteResult.js:511 scoreJobDecisionCriteriaFit()`는 `boundarySignals + levelHints` overlap을 본다. 이 신호는 핵심 업무 유사성보다 판단 기준 유사성에 가까워 1축 score primary보다는 evidence 쪽이 더 안전하다.
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js:626 getTransitionReadJobMeta()`와 `src/lib/transitionLite/classifyTransitionReadPatterns.js:156 classifyTransitionReadPatterns()`는 `missionType`, `outputType`를 비교할 수 있게 하지만, 이 메타는 업무 내용보다 working mode/read pattern에 더 가까운 속성을 가진다.

### signal-by-signal findings
- `strongSignals`
  - ontology family level에 광범위하게 존재한다.
  - `normalizeText()` 후 exact token string 비교가 가능하다.
  - 핵심 업무/산출물과 가장 직접 연결되는 signal이라 primary 적합성이 높다.
- `responsibilityHints`
  - role level에 존재한다.
  - strongSignals보다 역할/책임 단위 표현이 많아 업무 단위 보강에 유용하다.
  - 다만 일부 파일에서 strongSignals와 표현 중복 가능성이 있어 가중치 과대 부여는 위험하다.
- `mediumSignals`
  - ontology family level에 존재한다.
  - 수행 주변 단서나 반복 업무가 섞여 있어 tie-breaker/secondary가 적절하다.
- `missionType`
  - 역할 성격과 일의 큰 종류를 잡는 coarse meta다.
  - 1축의 direct 업무 overlap보다는 consistency check 용도로 적합하다.
- `outputType`
  - 산출물 유형을 coarse하게 고정한다.
  - 핵심 업무 유사성과 닿지만 granularity가 낮아 strongSignals를 대체하기에는 부족하다.
- `jobDistance/familyDistance/sharedFamiliesCount`
  - 현재 producer의 주점수 source다.
  - 완전 제거보다 modifier/floor/ceiling 정도로 낮추는 편이 안전하다.
- `summaryTemplate`
  - 서술형 문장이라 direct scoring source로 넣으면 generic overlap이 커진다.
  - evidence/explanation source로만 유지하는 것이 안전하다.

### recommended contract candidate
- 추천안: `C안` 변형
- 정의:
  - primary = `strongSignals + responsibilityHints`
  - secondary = `mediumSignals + missionType + outputType`
  - modifier = `jobDistance + familyDistance + sharedFamiliesCount`
  - evidence-only = `summaryTemplate + levelHints + boundarySignals`
- 이유:
  - `A안`보다 role granularity와 coarse meta guardrail을 함께 확보할 수 있다.
  - `B안`보다 업무 내용 직접성은 유지하면서 5축 침범을 줄일 수 있다.
  - 다만 mission/output은 low-weight secondary로 제한해야 과측정을 피할 수 있다.

### next patch questions
1. `strongSignals`와 `responsibilityHints` 가중치를 동일하게 둘지, `strongSignals` 우선으로 둘지.
2. `mediumSignals` overlap이 없더라도 high score가 가능한지, 아니면 upper band 제한을 걸지.
3. `missionType`과 `outputType` 둘 중 하나만 맞아도 secondary 가산을 줄지, 둘 다 맞을 때만 줄지.
4. `jobDistance`를 floor/ceiling로만 쓸 때 어떤 false high 케이스를 막는지 샘플 QA로 확인해야 한다.
5. `scoreJobKeyOutputsFit()`를 직접 재사용할지, classification dependency를 걷어낸 새 helper로 분리할지 결정해야 한다.

### 4축 deep investigation
- 현재 Axis 4 producer는 `src/lib/analysis/buildAxisConnectivityPack.js:414 scoreAxis4()`이며 실제 입력은 `customerMarketFlip`과 `sameSector`뿐이다.
- `resolveCustomerMarketSignals()`는 `src/lib/analysis/buildAxisConnectivityPack.js:278`에서 industry item의 `customerMarket`만 읽어 flip 여부를 만든다.
- 즉 현재 4축은 화면 이름과 달리 `고객 구조` 전체를 보는 축이 아니라 `customerMarket 타입 변화 + sameSector 보정` 축이다.
- 반면 `src/lib/transitionLite/buildTransitionLiteResult.js`에는 이미 `scoreIndustryCustomerStructureFit()`, `scoreIndustryBuyingMotionFit()`, `scoreIndustryDecisionStructureFit()`가 있어 재설계용 비교 근거는 충분히 존재한다.
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js`의 `stakeholderPrimary`와 `src/lib/transitionLite/classifyTransitionReadPatterns.js`의 `debug.stakeholderSame`은 유의미한 proxy지만 industry customer structure 자체보다는 job-facing counterpart meta에 가깝다.

### signal-by-signal findings
- `customerMarket`
  - 현재 producer가 실제로 쓰는 유일한 direct 4축 source다.
  - `scoreIndustryCustomerStructureFit()`는 동일 raw 값, broad group 일치, `MIXED` 여부, `customerStructure` support overlap까지 단계적으로 본다.
  - 가장 scoring-ready한 source라 primary 적합성이 가장 높다.
- `buyingMotion`
  - industry registry field이고 `scoreIndustryBuyingMotionFit()`에서 normalized overlap 비교가 가능하다.
  - 고객 구조 중에서도 도입/구매 방식 측면을 설명하므로 secondary로 적합하다.
- `decisionStructure`
  - industry registry field이고 문장형 비중이 높다.
  - `scoreIndustryDecisionStructureFit()`는 token overlap과 adjacent floor를 함께 쓰므로 설명력은 높지만 primary에는 불안정하다.
- `stakeholderPrimary`
  - job meta owner는 `jobTransitionReadMetaRegistry.js`, 비교 owner는 `classifyTransitionReadPatterns.js`.
  - `누구를 주로 상대하는가` proxy로는 유의미하지만 고객 구조 전체를 대표하는 source로 쓰기에는 coarse하다.
- `customerStructure`
  - transitionLite2 support asset에 있고 `targetReadAdapter.js`에서 bullets/summary에 사용된다.
  - scoring raw보다 explanation/evidence 성격이 강하다.

### contract option review
- A안
  - primary = `customerMarket`
  - secondary = `buyingMotion`, `decisionStructure`
  - stakeholder/customerStructure = evidence only
  - 현재 자산 품질 기준으로 가장 보수적이고 안전하다.
- B안
  - primary = `customerMarket + stakeholderPrimary`
  - secondary = `buyingMotion`, `decisionStructure`
  - customerStructure = evidence only
  - stakeholder meta를 과대평가할 위험이 커서 5축/설명 축과 경계가 흐려진다.
- C안
  - primary = `customerMarket + decisionStructure`
  - secondary = `buyingMotion + stakeholderPrimary`
  - customerStructure = evidence only
  - free-text decisionStructure를 co-primary로 올려 exact scoring 안정성이 약해진다.

### recommended candidate
- 추천안은 A안이다.
- 정의:
  - primary = `customerMarket`
  - secondary = `buyingMotion`, `decisionStructure`
  - evidence-only = `stakeholderPrimary`, `debug.stakeholderSame`, `customerStructure`, `jobInteractionHints`, `coreContext`
- 이유:
  - 현재 producer와 가장 가까운 구조라 patch risk가 낮다.
  - `customerMarket`가 가장 정규화된 SSOT이고,
  - `buyingMotion`은 구조 보강 신호로 충분히 비교 가능하며,
  - `decisionStructure`는 설명력은 높지만 heuristic 비중이 커 secondary가 안전하다.

### next patch questions
1. `customerMarket`를 exact raw match로만 볼지, `scoreIndustryCustomerStructureFit()`처럼 broad group(B2B/B2C)까지 허용할지.
2. `buyingMotion` null/short list 케이스를 중립 처리할지 약한 감점 처리할지.
3. `decisionStructure`를 direct secondary로 넣을지, `buyingMotion` tie-breaker 수준으로만 둘지.
4. `stakeholderPrimary`를 raw score에 끝내 넣지 않을지, ambiguous case 한정 modifier로 열어둘지.
5. `customerStructure` token overlap 로직을 재사용할 때 generic phrase dedupe가 필요한지.

## 2026-04-03 Axis 4 calibration memo lock

### judgment
- Axis 4는 1차 운영 가능
- 재설계 필요 없음
- calibration만 잠그고 safe patch 여부는 다음 라운드에서 결정

### locked memo
- `customerMarket broad_group_match` 재검토 필요
  - 특히 `B2B`와 `B2G` broad 허용 범위
- `MIXED exact` / `MIXED partial` 간격 확대 검토 필요
- `buyingMotion` secondary 유지
- `decisionStructure` weak secondary 유지
- `sameSector` / `industryDistance` direct scoring 재도입 금지 재확인

### next safe patch questions
1. `B2B ~ B2G` broad를 유지할지 더 보수적으로 좁힐지
2. `exact > broad` raw 간격을 얼마나 벌릴지
3. `MIXED exact`와 `MIXED partial`을 얼마나 더 분리할지
4. `buyingMotion`, `decisionStructure`는 그대로 둔 상태에서 customerMarket calibration만 우선할지

## 2026-04-03 SAFE INVESTIGATION + AXIS 5 CALIBRATION MEMO LOCK

### scope lock
- code patch 없음
- consumer/UI 수정 없음
- Axis 1/2/3/4 조정 없음
- 이번 라운드는 Axis 5 calibration policy lock 문서화만 수행

### current judgment
- Axis 5 구조 판정은 안정적이다.
- `roleWeightShift` 중심 + structured meta 보강 구조는 유지한다.
- 현재 주요 논점은 `similar` 구간이 `77~80`에서 high band에 다소 sticky하게 남는지 여부다.
- `operator_to_coordinator` / `coordinator_to_operator`는 `52~61`에서 대체로 `mid_high`로 안정적이다.
- `strategy_to_execution` / `execution_to_strategy`는 `30~36`에서 대체로 `low~mid`로 안정적이다.
- 따라서 현재 우선순위는 재설계가 아니라 calibration memo 잠금이다.

### locked memo
- Axis 5는 재설계 필요 없음
- Axis 5는 `roleWeightShift` 중심 축으로 유지
- `missionType`, `successMetricType`, `horizonType` structured meta 보강 유지
- `outputType` weak secondary 유지
- forbidden signal 재유입 금지 유지
- `similar`
  - `roleWeightShift=similar`이면 high 후보로 읽히는 구조 유지
  - meta가 대부분 달라도 무조건 high로 고정되는지는 후속 검토 포인트로 유지
- `operator <-> coordinator`
  - 현재 `52~61` 수준이면 방향 적절
  - 과도한 상향/하향 조정 검토 불필요
- `strategy <-> execution`
  - 현재 `30~36` 수준이면 의도 범위 내
  - meta 몇 개 일치만으로 과도하게 올라가지 않도록 low~mid ceiling 유지 확인

### forbidden signal lock
- 아래 신호들은 Axis 5 raw scoring source로 재유입하지 않는다.
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

### next safe patch questions
1. `similar` high stickiness가 실제 사용자 체감상 과한지.
2. 필요하다면 `similar` band floor를 조정할지, 아니면 narrative 해석으로 흡수할지.
3. meta mismatch 감점폭을 미세 조정할 필요가 있는지.
4. Axis 5는 여기서 lock now로 갈지, 아니면 one more minor patch로 갈지.

## 2026-04-03 SAFE INVESTIGATION + AXIS 2 CONTRACT LOCK

### scope lock
- code patch 없음
- consumer/UI 변경 없음
- `src/App.jsx` 변경 없음
- `src/lib/transitionLite/buildTransitionLiteResult.js` 변경 없음
- Axis 1/3/4/5 의미 변경 없음
- 이번 라운드는 Axis 2 contract 조사/설계 문서화만 수행

### files read
- `src/lib/analysis/buildAxisConnectivityPack.js`
- `src/lib/transitionLite/buildTransitionLiteResult.js`
- `src/lib/transitionLite/classifyTransition.js`
- `src/data/industry/industryRegistry.index.js`
- `src/data/industry/registry/it_software_platform/b2b_saas.js`
- `src/data/industry/registry/public_association_nonprofit/public_institution.js`
- `src/data/industry/registry/construction_real_estate_infra/plant_and_infra_epc.js`
- `src/data/transitionLite/targetReadAdapter.js`
- `src/data/transitionLite2/it_software_platform/support_industry_traits.js`
- `src/data/transitionLite2/public_association_nonprofit/support_industry_traits.js`
- `02_Product/Accuracy_QA/Transition_5Axis_Redesign_Execution_Spec.md`
- `05_Execution/Transition_5Axis_Redesign_Log.md`
- `00_HQ/Session_Handoff_Latest.md`
- `docs/끄적.md`
- `docs/COMM_PATCH_NOTES.md`

### current axis 2 owner / logic summary
- true score owner는 `src/lib/analysis/buildAxisConnectivityPack.js`의 `scoreAxis2()`다.
- exact upstream classification owner는 `src/lib/transitionLite/classifyTransition.js`의 `classifyIndustryDistance()`다.
- 현재 Axis 2 raw signal은 아래 3개뿐이다.
  - `industryDistance`
  - `sameSector`
  - `sameSubSector`
- 현재 `scoreAxis2()`는 아래 구조로 점수화한다.
  - base: `same=75`, `adjacent=50`, `cross=20`
  - modifier: `sameSubSector +15`, `sameSector && adjacent +5`, `sameSector && cross +10`
- 즉 현재 Axis 2는 taxonomy-heavy 축이다.
- 현재 `classifyIndustryDistance()`는 내부적으로 아래 신호를 써서 `same / adjacent / cross`를 만든다.
  - `subSector`
  - `sector`
  - `customerMarket`
  - `valueChainPosition`
  - `coreContext`
  - `boundaryHints`
  - `jobInteractionHints`
- 따라서 현재 구조는 score owner와 semantic owner가 분리되어 있고, adjacency 내부에는 4축/서술 신호가 일부 섞여 있다.

### signal-by-signal findings for axis 2
- `industryDistance`
  - source owner: `classifyTransition.js`
  - strengths: 가장 안정적인 existing SSOT
  - weaknesses: adjacency 이유를 score layer에서 직접 설명하지 못함
  - overlap risk: Axis 4와 중간. 내부에 `customerMarket` legacy 영향이 남음
  - fit level: `primary`

- `sameSector / sameSubSector`
  - source owner: `buildAxisConnectivityPack.js`
  - strengths: deterministic taxonomy guardrail
  - weaknesses: 단독 설명력은 약함
  - overlap risk: 낮음
  - fit level: `modifier`

- `valueChainPosition`
  - source owner: industry registry item
  - strengths: industry background / value chain 유사성을 잘 반영
  - weaknesses: free-text normalization 필요
  - overlap risk: Axis 4와 낮음~중간
  - fit level: `secondary`

- `coreContext`
  - source owner: industry registry item
  - strengths: business context / operating environment 설명력이 높음
  - weaknesses: generic phrase overlap 위험
  - overlap risk: Axis 4와 중간
  - fit level: `secondary`

- `regulationBarrier`
  - source owner: industry registry item
  - strengths: regulatory / compliance burden를 coarse하게 반영 가능
  - weaknesses: granularity 거침
  - overlap risk: 낮음
  - fit level: `secondary`

- `salesCycle`
  - source owner: industry registry item
  - strengths: market structure cadence 보강 가능
  - weaknesses: 단독 설명력 약함
  - overlap risk: Axis 4와 중간
  - fit level: `modifier`

- `offeringModel`
  - source owner: industry registry item
  - strengths: business model / operating structure 설명 가능
  - weaknesses: 일부는 직무 설명과 섞일 수 있음
  - overlap risk: Axis 1과 중간
  - fit level: `evidence-only` 우선

- `boundaryHints`
  - source owner: industry registry item
  - strengths: adjacent/cross 설명에 좋음
  - weaknesses: narrative 성격 강함
  - fit level: `evidence-only`

- `proofSignals`
  - source owner: industry registry item
  - strengths: 산업별 성과 해석 차이 설명에 유용
  - weaknesses: 1축/5축으로 번질 위험
  - fit level: `evidence-only`

- `jobInteractionHints`
  - source owner: industry registry item
  - strengths: 설명력 높음
  - weaknesses: job-facing이라 산업 자체보다 직무 적응 축에 가까움
  - overlap risk: Axis 1/5와 높음
  - fit level: `excluded` from score

- `customerMarket`
  - strengths: structured compare 가능
  - weaknesses: 고객 구조 축과 직접 연결
  - overlap risk: Axis 4와 매우 높음
  - fit level: `excluded`

- `buyingMotion`
  - strengths: helper 존재
  - weaknesses: 구매/도입 구조 자체라 4축 core와 직접 겹침
  - overlap risk: Axis 4와 매우 높음
  - fit level: `excluded`

- `decisionStructure`
  - strengths: 설명력 높음
  - weaknesses: sentence-form heuristic 의존
  - overlap risk: Axis 4와 매우 높음
  - fit level: `excluded`

- `support_industry_traits.businessStructure / operatingLanguage / problemTypes`
  - source owner: `src/data/transitionLite2/**/support_industry_traits.js`
  - strengths: industry background 설명력 높음
  - weaknesses: narrative asset
  - fit level: `evidence-only`

### contract options review
- A안: `industryDistance / sameSector / sameSubSector` 중심 보수형
  - 가장 안전하지만 target meaning 반영력이 약함
- B안: `industryDistance + valueChainPosition/coreContext/regulationBarrier` 보강형
  - 산업 배경 의미에 가장 가깝고 4축 경계 충돌도 상대적으로 낮음
- C안: taxonomy 유지 + narrative evidence-only 보수형
  - 구현 안전성은 높지만 taxonomy-heavy 상태가 많이 남음

### recommended axis 2 contract
- target meaning
  - 현재 산업과 목표 산업의 `business context / operating environment / market structure / regulatory / value chain` 배경이 얼마나 유사한가
  - 같은 직무라도 업계 배경 차이 때문에 요구되는 산업 이해 전환 부담이 얼마나 있는가
- included signals
  - `industryDistance`
  - `sameSector`, `sameSubSector`
  - `valueChainPosition`
  - `coreContext`
  - `regulationBarrier`
  - `salesCycle`
- excluded signals
  - `customerMarket`
  - `buyingMotion`
  - `decisionStructure`
  - `responsibilityHints`
  - `levelHints`
  - `roleWeightShift`
  - `jobInteractionHints`
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
- what this contract does NOT measure
  - 핵심 업무 유사성
  - 책임 수준 상하 이동
  - 고객 구조 / buying / decision 구조 자체
  - 역할 성향 / 일하는 방식

### next patch start point
- true owner file
  - `src/lib/analysis/buildAxisConnectivityPack.js`
- exact anchors
  - `function resolveIndustryAxisSignals`
  - `function scoreAxis2`
  - `const axis2Signals`
- upstream classification owner
  - `src/lib/transitionLite/classifyTransition.js`
  - `function getIndustrySimilaritySignals`
  - `function classifyIndustryDistance`
- whether local helper append가 필요한지
  - 필요 가능성이 높다
  - 가장 안전한 시작은 `buildAxisConnectivityPack.js` 내부 Axis 2 local helper append다

### risks
- `industryDistance`를 primary로 유지하면 legacy `customerMarket` 영향이 완전히 사라지지 않는다.
- `coreContext`와 `offeringModel`은 generic phrase overlap 과대평가 위험이 있다.
- `support_industry_traits`는 narrative asset이라 direct scoring source로 올리기 위험하다.
- `jobInteractionHints`를 넣으면 산업 맥락 축이 직무 적응 축으로 이동할 수 있다.

### docs/끄적.md 및 옵시디언 업데이트 제안
- `docs/끄적.md`에는 Axis 2를 `industry background / transition burden` 축으로 잠그는 memo를 남긴다.
- HQ handoff에는 recommended contract와 4축 경계 충돌 금지 원칙만 짧게 남긴다.
- 옵시디언/커뮤니케이션 SSOT는 `docs/COMM_PATCH_NOTES.md` Axis 2 섹션을 사용한다.
