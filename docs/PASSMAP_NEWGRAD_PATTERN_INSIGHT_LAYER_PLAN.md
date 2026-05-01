# PASSMAP Newgrad Pattern Insight Layer Plan

> 조사일: 2026-04-30
> 범위: SAFE INVESTIGATION + DESIGN ONLY. runtime, scoring, UI, fixture input, expected 완화 변경 없음.

## 1. 현재 inline overlay 위치

| 항목 | 확인 내용 |
|---|---|
| 파일 | src/lib/analysis/buildNewgradAxisPack.js |
| 함수/블록 | buildNewgradAxisPack(input = {}) 반환 객체의 axes 구성 블록 |
| exact anchor 1 | line 3744 // scoped overlay: NG-JOB-SERVICE-001 pilot |
| exact anchor 2 | line 3746 inline spread condition |
| exact anchor 3 | line 3783 // scoped overlay: NG-JOB-SERVICE-001 pilot |
| exact anchor 4 | line 3785 inline spread condition |
| 덮는 axis explanation | axes.jobStructure.explanation.lead, axes.jobStructure.explanation.scoreReason, axes.responsibilityScope.explanation.lead, axes.responsibilityScope.explanation.scoreReason |
| 현재 조건식 | normalized.targetJobId === JOB_BUSINESS_SERVICE_PLANNING AND Boolean(normalized.major) AND normalized.projectsRaw.length >= 2 AND _jobFitMajorPrior.label is weak or mismatch |
| visible surface 도달 | TransitionLiteResult.jsx의 신입 axis card에서 explanation.lead는 primary body, explanation.scoreReason은 secondary body로 도달한다. hasSlots는 lead/criteria/scoreReason/liftOrLimit 중 2개 이상일 때 true이다. |

요약: 현재 방식은 case 조건과 문구가 axis 반환 객체 안에 직접 섞여 있다. NG-JOB-SERVICE-001에는 효과적이지만, P0 ISSUE 케이스를 추가할수록 buildNewgradAxisPack.js의 반환 객체가 case registry 역할까지 떠안게 된다.

## 2. Pattern overlay layer 후보 설계

신규 파일 후보: src/lib/analysis/newgradCaseInsightOverlays.js

역할 후보:

- pattern registry 보유: pattern id, priority, appliesTo matcher, axis overlay payload를 한 파일에서 관리한다.
- appliesTo matcher 실행: buildNewgradAxisPack.js에서 넘긴 context만 읽고 scoring 값은 쓰지 않는다.
- axis overlay payload 반환: axisKey별 lead, scoreReason, criteria, liftOrLimit payload를 반환한다.
- firedPatternIds 반환: test runner가 vm.axisPack.meta.caseInsightOverlays.firedPatternIds로 확인할 수 있게 한다.

안전성 판단: 신규 파일은 안전하다. 이유는 pattern 문구와 조건식을 고위험 owner인 buildNewgradAxisPack.js 밖으로 분리하면서도, 호출 지점은 axis explanation 생성 이후의 단일 merge 지점으로 제한할 수 있기 때문이다. scoring, band, gate, CTA, UI layout에는 영향이 없어야 한다.

## 3. 최소 integration point

권장 호출 위치:

- buildNewgradAxisPack.js line 3719-3725의 comparison meta 생성이 끝난 직후, line 3727 return 객체 생성 직전.
- 이 시점에는 normalized, _jobFitMajorPrior, certEvidencePack, selfReportEvidencePack, experienceEvidencePack, _targetSubVertical, axis별 score/signals/band가 모두 준비되어 있다.

권장 흐름:

1. buildNewgradCaseInsightOverlays(context)를 호출해 axisExplanationOverlays와 firedPatternIds를 받는다.
2. axisPack 반환 객체를 한 번 변수로 만든다.
3. 각 axis의 기존 explanation builder 결과를 먼저 spread한다.
4. 마지막에 해당 axis overlay를 spread해 lead/scoreReason/criteria/liftOrLimit만 선택적으로 덮는다.
5. axisPack.meta.caseInsightOverlays에 version과 firedPatternIds를 debug-only 값으로 붙인다.

merge 원칙:

- overlay는 explanation.available, positives, gaps, reasons, whyThisAxisMatters, comparisonBlock, signals, band, score를 건드리지 않는다.
- 항상 기존 builder 결과 뒤에 overlay를 merge한다. 그래야 lead 또는 scoreReason만 덮고 criteria/liftOrLimit이 기존 값을 유지한다.
- overlay payload에 없는 필드는 절대 빈 문자열로 덮지 않는다.
- hasSlots를 깨지 않도록 visible target은 우선 lead + scoreReason을 사용한다. criteria/liftOrLimit은 보조 또는 expandable 정보로만 쓴다.

기존 NG-JOB-SERVICE-001 migration 순서:

1. 신규 파일에 WEAK_MAJOR_STRONG_RELEVANT_PROJECT pattern만 등록한다.
2. 현재 inline 조건과 문구를 byte-for-byte에 가깝게 옮긴다.
3. buildNewgradAxisPack.js에서는 inline spread를 제거하고 overlay merge로 대체한다.
4. 단일 케이스 NG-JOB-SERVICE-001 runner 결과가 PASS 유지되는지 확인한다.
5. 전체 7개 runner에서 1 PASS / 6 ISSUE / 0 FAIL 유지와 shouldNotMention 0건을 확인한 뒤 다음 pattern을 추가한다.

## 4. context contract 설계

pattern matcher에 넘길 최소 context는 현재 buildNewgradAxisPack.js 안에 실제 존재하는 값만 사용한다.

| 그룹 | 사용 가능 값 | 근거 anchor | 비고 |
|---|---|---|---|
| normalized core | normalized, normalized.targetJobId, normalized.targetIndustryId, normalized.targetJobLabel, normalized.targetIndustryLabel, normalized.major, normalized.majorDisplayLabel | buildNewgradAxisPack.js line 3261-3323 | target job/category 판단의 기본값 |
| experience raw | normalized.projectsRaw, normalized.internshipsRaw, normalized.contractExperiencesRaw, normalized.canonicalWorkRowsRaw | line 3319-3323 | 프로젝트/인턴/계약 경험 존재 여부와 label 판정 |
| experience labels | normalized.projectRoles, projectRoleLabels, internshipRoleFamilies, internshipRoleLabels, projectTypeLabels, projectOutcomeLabels, experienceDurationLabels, interactionStakeholderLabels | line 3295-3310 | matcher에서 role, stakeholder, outcome 신호로 사용 가능 |
| major prior | _jobFitMajorPrior.label, base, final, override, matchedBy, resolutionMode | line 3362-3364, 3446-3452 | Axis1 전공 직접성 또는 약함 판단 |
| cert packs | certEvidencePack, normalized.certEvidencePack, normalized.certificationsRaw, certSupport | line 3239-3243, 3315-3319, 3341 | 자격증 단독 또는 보조 신호 판단 |
| self-report packs | selfReportEvidencePack, selfReportProfile, normalized.strengths, normalized.workStyleList, normalized.canonicalStrengthKeys, normalized.canonicalWorkStyleKeys | line 3244-3260, 3325-3338 | 자기보고 only pattern 판단 |
| target taxonomy | _targetSubVertical, _jobFitTargetMajor, _jobFitMajorDependencyProfile.tier | line 3340, 3359-3362 | 세부 vertical 또는 major dependency guard |
| axis state | _jobFit, _domainInterest, _execDepth, _interactionFit, _softSkill의 signals, band, score | line 3440 이후, 3499 이후, 3653 이후 | overlay는 읽기만 하고 점수 조정 금지 |

추가 필요로 표시할 값:

- runtime caseId: 현재 buildNewgradAxisPack input에는 caseId가 없다. matcher가 caseId에 의존하면 runtime 오염이 생기므로 추가하지 않는다.
- expectedPatternIds: fixture/test runner 전용 값이다. runtime context로 넘기지 않는다.
- UI 렌더 여부: hasSlots 규칙은 문서와 runner에서 검증하고 matcher에는 넘기지 않는다.
- 세분화된 job category label: targetJobId와 _targetSubVertical은 존재하지만 별도 display category 객체는 확인하지 않았다. 필요 시 추가 조사 후 사용한다.

## 5. pattern id 설계

| Pattern ID | 의도 | appliesTo에 필요한 신호 | 영향 axis | 추천 surface | 오염 위험 | 우선순위 |
|---|---|---|---|---|---|---|
| WEAK_MAJOR_STRONG_RELEVANT_PROJECT | 약한 전공과 강한 관련 프로젝트를 분리해 설명하고, 프로젝트는 Axis3 경험 근거로 재구성한다. | targetJobId가 JOB_BUSINESS_SERVICE_PLANNING, major 존재, _jobFitMajorPrior.label weak/mismatch, projectsRaw 2개 이상, 가능하면 projectRoleLabels에 기획 계열 | jobStructure, responsibilityScope | lead + scoreReason | 프로젝트 개수만으로 모든 직무에 확장하면 오염. targetJobId와 major prior guard 필수 | 1 |
| CERT_ONLY_SECONDARY_SIGNAL | 자격증만 있을 때 보조 근거와 핵심 실무 근거를 분리한다. | certificationsRaw 1개 이상, projectsRaw/internshipsRaw/canonicalWorkRowsRaw 없음, major 없음 또는 약함, certSupport alignedCount 또는 eligibleCount 존재 | industryContext | lead + criteria, 필요 시 scoreReason | 자격증을 무의미하게 보이게 할 위험. 보조 신호로 긍정하되 충분 판단 금지 | 2 |
| CERT_ONLY_DATA_ANALYSIS | ADsP/SQLD 등 데이터 자격증은 준비 신호이나 분석 프로젝트/SQL 활용 결과물 부재를 설명한다. | targetJobId가 JOB_IT_DATA_DIGITAL_DATA_ANALYSIS, certificationsRaw label ADsP 또는 SQLD, experience raw 비어 있음, major 없음 또는 weak/mismatch | industryContext, responsibilityScope | industryContext lead/scoreReason, responsibilityScope lead | CERT_ONLY_SECONDARY_SIGNAL과 중복. 더 구체적인 pattern이 먼저 fire되어야 함 | 2 |
| SELF_REPORT_ONLY_WEAK_EVIDENCE | 자기보고 강점은 Axis5 참고 신호이고 Axis1/Axis3 근거를 대체하지 못함을 설명한다. | strengths 또는 workStyleList 존재, major 없음, certificationsRaw 없음, projectsRaw/internshipsRaw/canonicalWorkRowsRaw 없음 | roleCharacter | lead + scoreReason | 유저 강점을 과소평가하는 톤 위험. 좋은 출발점과 검증 필요를 함께 말해야 함 | 2 |
| CUSTOMER_FACING_TO_PLANNING | CS/VOC 경험은 고객 이해로 연결되지만 기획 산출물과 요구사항 정의는 별도 근거가 필요함을 설명한다. | targetJobId가 JOB_BUSINESS_SERVICE_PLANNING, internshipRoleLabels 또는 normalized summary가 고객상담/CS/VOC, interactionStakeholderLabels에 customer_user 계열, projectsRaw 없음 또는 기획 산출물 부족 | customerType, responsibilityScope | lead + scoreReason | CS 경험을 곧 기획 경험으로 과대 해석하거나 반대로 무시할 위험 | 3 |
| MAJOR_EXPERIENCE_SEPARATION | 전공 적합도와 경험 적합도를 분리해, 경험은 Axis3에서 인정하고 Axis1 전공 직접성은 제한한다. | major 없음 또는 _jobFitMajorPrior.label weak/mismatch, projectsRaw 또는 canonicalWorkRowsRaw 존재, _jobFitProjectBestLinkType direct/adjacent 또는 role labels 존재 | jobStructure, responsibilityScope | lead + scoreReason | WEAK_MAJOR_STRONG_RELEVANT_PROJECT와 겹침. service planning 전용 pattern보다 낮은 priority 필요 | 3 |

## 6. firedPatternIds 추적 설계

권장 위치:

- axisPack.meta.caseInsightOverlays.firedPatternIds
- axisPack.meta.caseInsightOverlays.version
- axisPack.meta.caseInsightOverlays.axisKeysByPatternId 또는 overlaySummary는 선택 사항

이유:

- buildNewgradTransitionLiteResult.js는 axisPack을 그대로 VM에 싣는다. runner는 vm.axisPack에서 바로 읽을 수 있다.
- TransitionLiteResult.jsx의 확인된 visible surface는 axisPack.axes.*.explanation 중심이므로 meta는 UI에 노출되지 않는다.
- top-level VM debug field를 추가하면 makeEmptyVm과 producer 반환 객체를 함께 수정해야 하므로 변경 파일이 늘어난다.
- scoring/band는 axisPack.axes.*.score, band, signals에서 결정된다. meta는 읽기 전용 추적값이어야 한다.

검증 방식:

- runner는 Array.isArray(vm.axisPack?.meta?.caseInsightOverlays?.firedPatternIds)로 읽는다.
- UI에는 표시하지 않는다.
- JSON 저장 옵션에는 firedPatternIds를 포함해 회귀 분석에만 활용한다.

## 7. fixture 전환 설계

권장 위치: 각 case의 uiInsightExpected.expectedPatternIds

관계 정의:

| 기존 필드 | 유지 의미 | expectedPatternIds와의 관계 |
|---|---|---|
| expected | scoring/band invariant. 예: axis1BandForbidden | 변경하지 않는다. pattern firing은 scoring 성공을 대체하지 않는다. |
| forbidden | 결과 또는 visible text에 나오면 안 되는 표현 | 계속 강하게 유지한다. pattern이 fire되어도 forbidden 위반은 FAIL이다. |
| uiInsightExpected.visibleSurfaces | 실제 UI 도달 surface의 문구 계약 | 계속 유지한다. 다만 pattern ID 검증이 추가되면 shouldMention alias를 계속 늘리는 압박을 줄일 수 있다. |
| uiInsightExpected.expectedPatternIds | pattern registry가 의도한 케이스를 잡았는지 확인하는 runner-only 계약 | 없으면 pattern 검증을 skip한다. 있으면 firedPatternIds에 모두 포함되어야 한다. |

shouldMention 처리:

- 유지한다. 이유는 pattern이 fire되어도 문구가 visible surface까지 도달하지 않으면 사용자 설명 테스트 목적을 충족하지 못하기 때문이다.
- 다만 shouldMention은 현재처럼 ISSUE 등급을 유지한다. PASS를 억지로 만들기 위해 문구 검증을 느슨하게 바꾸지 않는다.
- expectedPatternIds는 shouldMention을 대체하지 않고, 누락 원인이 matcher인지 문구 surface인지 구분하는 보조 축이다.

기본 동작:

- expectedPatternIds가 없거나 빈 배열이면 기존 runner와 동일하게 동작한다.
- firedPatternIds가 추가로 존재해도 fixture가 기대하지 않으면 실패로 보지 않는다. 초기 도입 단계에서는 오염 탐지보다 의도 패턴 도달 확인이 목적이다.

## 8. runner 전환 설계

확장 지점:

- run-newgrad-ui-insight-surface-smoke.mjs의 verifySurfaces 또는 별도 verifyPatterns 함수 뒤에 pattern 검증을 추가한다.
- finalVerdict는 result.verify.patternIssues를 issues에 합산하거나, 별도 배열을 보되 verdict 계산에서 ISSUE로 반영한다.

검증 방식:

1. expectedPatternIds = uiInsightExpected.expectedPatternIds || []
2. firedPatternIds = vm.axisPack.meta.caseInsightOverlays.firedPatternIds || []
3. expectedPatternIds가 비어 있으면 skip
4. 누락된 pattern id가 있으면 ISSUE로 기록
5. JSON 저장 summary에 expectedPatternIds, firedPatternIds, missingPatternIds를 포함

ISSUE/FAIL 기준:

- expectedPatternIds 미충족은 초기 전환 라운드에서는 ISSUE가 맞다. scoring/band/UI 안전성 위반이 아니라 insight matcher 미도달이기 때문이다.
- shouldNotMention 위반, primary/secondary 필드 부재, hasSlots 미충족, axisPack null은 기존처럼 FAIL을 유지한다.
- visible surface 검증은 그대로 유지한다.
- shouldNotMention은 alias 없이 exact substring strict 검사 유지가 맞다.

## 9. 구현 순서 제안

| Round | 수정 파일 | 목적 | 리스크 | 검증 명령 |
|---|---|---|---|---|
| Round A | src/lib/analysis/newgradCaseInsightOverlays.js, src/lib/analysis/buildNewgradAxisPack.js | pattern layer skeleton 생성과 NG-JOB-SERVICE-001 migration only | buildNewgradAxisPack.js 반환 객체를 변수화할 때 구조 재배치처럼 커질 수 있음. inline 문구가 달라지면 PASS 깨질 수 있음 | powershell.exe -NoProfile -ExecutionPolicy Bypass -Command { Set-Location D:/패스맵/reject-analyzer; node ./scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs --case NG-JOB-SERVICE-001 } |
| Round B | scripts/regression/newgrad-core-invariant-cases.js, scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs | expectedPatternIds fixture 계약과 pattern-aware runner 추가 | pattern 미충족을 FAIL로 두면 초기 migration 중 불필요하게 깨질 수 있음. ISSUE로 시작해야 함 | powershell.exe -NoProfile -ExecutionPolicy Bypass -Command { Set-Location D:/패스맵/reject-analyzer; node ./scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs --json } |
| Round C | src/lib/analysis/newgradCaseInsightOverlays.js, scripts/regression/newgrad-core-invariant-cases.js | P0 ISSUE 중 2-3개 pattern 추가. 추천: CERT_ONLY_SECONDARY_SIGNAL, CERT_ONLY_DATA_ANALYSIS, SELF_REPORT_ONLY_WEAK_EVIDENCE | pattern overlap과 문구 오염. DATA 개별 overlay처럼 확장하지 않도록 generic pattern 우선 | powershell.exe -NoProfile -ExecutionPolicy Bypass -Command { Set-Location D:/패스맵/reject-analyzer; node ./scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs } |

Round C에서 CUSTOMER_FACING_TO_PLANNING과 MAJOR_EXPERIENCE_SEPARATION은 다음 라운드로 미루는 편이 안전하다. 둘 다 service planning, weak major, project/CS evidence와 겹치므로 우선순위 충돌을 먼저 관찰해야 한다.

## 10. 최종 판단

결론: A안. pattern overlay layer 신규 파일 생성이 안전하다.

이유:

- 현재 inline overlay는 이미 explanation slot 덮기만 수행하며 scoring/band를 건드리지 않는다. 이 동작을 pure helper로 분리하면 runtime 영향 범위를 유지하면서 조건과 문구 확장만 관리할 수 있다.
- buildNewgradAxisPack.js는 5축 score, signals, comparisonBlock, explanation을 모두 생산하는 고위험 파일이다. case별 조건을 계속 inline으로 추가하는 방식이 오히려 장기 리스크가 높다.
- 신규 파일은 registry와 matcher를 한곳에 모아 priority, firedPatternIds, 오염 guard를 테스트 가능하게 만든다.
- UI visible target은 기존 axis explanation lead/scoreReason만 사용하므로 dead/blocked field에 의존하지 않는다.

리스크:

- axisPack 반환 객체를 변수화하는 최소 구조 변경은 필요할 수 있다. 구현 시 line 3727 반환 객체 주변만 좁게 바꿔야 한다.
- pattern overlap이 생기면 마지막 merge가 문구를 덮을 수 있다. priority와 axis field별 first-wins 또는 last-wins 정책을 명시해야 한다.
- firedPatternIds를 axisPack.meta에 추가하는 것은 비표시 metadata 확장이지만, 외부 소비자가 axisPack shape를 엄격히 비교한다면 영향이 있을 수 있다. runner 목적의 debug-only 필드임을 문서화해야 한다.

금지 유지:

- NG-JOB-DATA-001 개별 overlay pilot은 보류한다.
- P0 7개 케이스를 한 번에 runtime patch하지 않는다.
- scoring, gate, band, CTA, UI layout, fixture input, expected 완화는 변경하지 않는다.
- topRepairSignals, whyThisRead, heroSummary, inputEvidenceRead, axisReadSummary는 visible target으로 쓰지 않는다.
