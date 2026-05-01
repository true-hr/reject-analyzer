# Newgrad Axis Explanation Assembly Contract

작성일: 2026-04-08
버전: v1.1 (criteria 2층 구조 / scoreReason pair rule / liftOrLimit 2-mode / Axis5 limiting taxonomy / UI 노출 계약 / fallback QA 조건 강화)

---

## 1. 문서 목적

이 문서는 신입 5축 explanationCard를 4슬롯(lead / criteria / scoreReason / liftOrLimit)으로 조립하기 위한 슬롯별 계약을 정의한다.

"전체 재설계" 문서가 아니다. 기존 자산(signals / reasons / summary / gaps / selfReportSupportLine 등)을 최대한 재사용하면서, 어떤 슬롯이 어떤 자산을 받고, 어떤 슬롯에 새 조립 규칙이 필요한지를 구체적으로 닫는다.

"조립만 하면 끝"이 아니다. criteria / liftOrLimit 슬롯은 기존 자산을 그대로 붙이면 약하다. 이 두 슬롯에 대해 축별 조립 규칙을 이 문서에서 정의한다.

구현 전에 이 문서를 기준으로 builder를 수정하고, UI의 consumer도 새 슬롯을 읽도록 최소 변경한다.

---

## 2. 최종 판단

**OVERALL VERDICT: REUSE + TEMPLATE DESIGN**

- scorer / signal pack / reasons helper / band summary 자산은 충분하다. 신규 엔진 설계 불필요.
- lead / scoreReason은 기존 summary / reasons 재사용 가능하다.
- criteria는 2층 구조(축 고정문장 + 케이스별 우선 evidence 명시)로 조립해야 한다. 기존 자산 없음.
- liftOrLimit는 lift mode / limit mode 2모드로 구분해야 한다. gaps[] 단순 reframe 불충분.
- Axis5 limiting은 taxonomy 3개로 분리해야 한다. reason 1개 추가로는 안정화 불충분.
- UI는 본문에 lead + scoreReason, 상세보기에 criteria + liftOrLimit로 분리해서 노출한다.

---

## 3. 전역 원칙

1. **producer / UI 분리 원칙**: explanation은 `axisExplanationRegistry.js` builder가 생성한다. UI(`TransitionLiteResult.jsx`)는 렌더만 한다. UI에서 score를 재해석해 문장 조립하는 행위 금지.

2. **4슬롯 구조**:
   - `lead`: 핵심 입력 근거를 축 관점에서 1문장으로 판정
   - `criteria`: 이 축이 무엇을 보는 기준인지 (Layer A: 축 고정 기준문장 + Layer B: 현재 케이스 우선 evidence 종류)
   - `scoreReason`: 왜 현재 점수인가 — positive 1개 + limiting 1개를 pair로 포함
   - `liftOrLimit`: lift mode 또는 limit mode로 1문장 — 행동 가능성 있어야 하나 과도한 낙관 금지

3. **슬롯 역할 차이**: lead는 "현재 상태 판정", criteria는 "이 축의 기준 + 현재 케이스에서 우선 본 evidence", scoreReason은 "왜 이 점수인지 (positive + limiting 쌍)", liftOrLimit는 "다음 행동 방향 또는 구조적 한계". 서로 중복하지 않는다.

4. **축 간 중복 금지**: 같은 project evidence를 써도 Axis1은 role 연결성, Axis2는 industry 맥락, Axis3은 execution 깊이, Axis4는 stakeholder 접점, Axis5는 강점 적합성으로 읽는다. 같은 문장이 두 축에 나오면 안 된다.

5. **fallback은 예외 경로**: `available: false` + `fallbackReason`으로만 표시. 기본 경로에서 fallback narrative를 쓰는 구조 금지.

---

## 4. 슬롯별 전역 계약표

| 슬롯명 | 역할 | 기존 자산 재사용 가능성 | 우선 재사용 소스 | 부족한 점 | 신규 규칙 필요 여부 |
|---|---|---|---|---|---|
| lead | 입력 근거 기반 1문장 판정 | 높음 | `buildNewgrad*ToneSummary()`, `primaryEvidenceSource`, band summary 상수 | evidence명이 드러나지 않는 케이스 존재 | 조립 규칙만 (신규 템플릿 불필요) |
| criteria | 축 기준 + 현재 케이스 우선 evidence 명시 | 없음 | `axis.description` (axis 레벨), `whyThisAxisMatters` (교육 프레임, 다름) | 기존 자산 없음. 2층 구조 (Layer A 고정 + Layer B 케이스별) | 필요 — 축별 Layer A 템플릿 + Layer B 조립 규칙 |
| scoreReason | 왜 현재 점수인지 (positive + limiting 쌍 필수) | 보통 | `reasons[]` positive/negative 항목, band-aware summary, `gaps[]` 첫 항목 | positive 1개만 쓰면 칭찬문, limiting 1개만 쓰면 부족문. pair 규칙 없음 | 필요 — pairSelectionRule + bandAwareRule |
| liftOrLimit | lift mode 또는 limit mode — 1문장 | 낮음 | `gaps[]` 항목 소재 | gaps는 "부족하다" 프레임. lift/limit 2모드 구분 없음 | 필요 — modeSelectionRule + 축별 defaultMode |

**criteria 2층 구조 설명**:
- Layer A: "이 축은 X를 기준으로 본다"는 축 고정 기준문장. 모든 사용자에 동일
- Layer B: "이번 케이스에서는 Y(major/project/internship/cert/strengths/workstyle 중 1개)가 우선 반영됐다"는 케이스별 evidence 명시
- 고정문장만 쓰면 모든 사용자 criteria가 동일해져 explanationCard 품질이 떨어진다

**scoreReason pair 규칙**:
- 반드시 "이 점수를 지지하는 근거" + "상위 점수로 올라가지 못하게 한 제한 근거"를 함께 포함한다
- positive 하나만 쓰면 칭찬문, limiting 하나만 쓰면 부족문. 둘을 묶어야 "왜 이 점수인지" 답이 된다

**liftOrLimit 2모드 설명**:
- lift mode: 특정 evidence가 추가되면 실제로 한 단계 상승 가능성이 큰 경우
- limit mode: 단순 추가만으로는 상위 점수를 약속하기 어려운 경우. "X와 Y의 정합성이 함께 필요" 형태
- Axis5는 기본 limit mode 우선. self-report 추가만으로 점수 상승 약속 금지

---

## 5. UI 노출 계약 (본문 / 상세보기 분리)

**1차 노출 (본문 — 항상 노출)**:
- `lead`: 현재 상태 판정 1문장
- `scoreReason`: 왜 이 점수인지 (positive + limiting 쌍)

**2차 노출 (상세보기 — 클릭 시 전개)**:
- `criteria`: 이 축의 기준 + 현재 케이스 우선 evidence
- `liftOrLimit`: 다음 행동 방향 또는 구조적 한계

**이유**: 사용자가 먼저 궁금한 건 "무슨 판정인지"와 "왜 이 점수인지"다. criteria와 liftOrLimit를 본문에 모두 넣으면 길고 반복적인 설명이 된다.

**UI 구현 시 필드명**:
- `explanation.lead` → 본문 main body (`explanation.summary`를 대체하거나 `explanation.lead || explanation.summary` backward compatible)
- `explanation.scoreReason` → 본문 lead 아래 sub-text
- `explanation.criteria` → 상세보기 첫 번째 블록 (라벨: "이 축의 기준")
- `explanation.liftOrLimit` → 상세보기 두 번째 블록 (라벨: "다음 행동 방향")

**기존 상세보기 블록 유지**: `whyThisAxisMatters`, `experienceSupportLine`, `selfReportSupportLine`, `reasons[]`, `positives[]`, `gaps[]`는 현재 상세보기 구조 안에 유지한다. 4슬롯은 그 위에 추가된다.

---

## 6. 축별 × 슬롯별 조립 계약표

---

### Axis 1. 전공과 직무의 연결성 (jobStructure)

**사용 가능한 signals**:
- `majorPriorLabel`: direct / adjacent / weak / mismatch
- `projectBestLinkType`: direct / adjacent / none
- `internshipLinkType`: direct / industry_only / none
- `primaryEvidenceSource`: mixed / project / internship / major / fallback / none
- `_jobFitMajorImpactSummary`, `countOnlyFallbackUsed`
- `projectRoleExperienceLabels[]`, `internshipRoleExperienceLabels[]`
- `majorWeightApplied`: strong_bonus / light_bonus / strong_penalty / light_penalty / neutral

---

#### lead

- **해야 하는 말**: 전공 또는 프로젝트/인턴 역할 경험이 목표 직무와 어느 방향으로 읽히는지 1문장
- **우선 재사용 자산**: `buildNewgradJobFitSummary(signals, band)` — primaryEvidenceSource, majorPriorLabel, internshipLinkType 분기 반환. 재사용 가능
- **보조 자산**: `_jobFitMajorImpactSummary` — 전공 의존도 임팩트 문장
- **그대로 쓰면 생기는 위험**: countOnlyFallbackUsed 케이스에서 generic해짐. evidence명이 드러나지 않는 케이스 있음
- **최종 조립 규칙**: `buildNewgradJobFitSummary(signals, band)` 기본. `projectRoleExperienceLabels[]` 또는 `internshipRoleExperienceLabels[]`가 있으면 해당 역할명을 앞에 붙여 evidence 명시

---

#### criteria

- **Layer A (축 고정 기준문장)**:
  `"이 축은 전공이나 프로젝트·인턴 역할 경험이 지원 직무의 핵심 과업과 얼마나 직접 이어지는지를 봅니다."`
- **Layer B (케이스별 우선 evidence 명시)**:
  - `primaryCriteriaInputType` 선택 규칙:
    - `projectBestLinkType === "direct"` 또는 `internshipLinkType === "direct"` → `"project"` 또는 `"internship"`
    - 위 모두 none이고 `majorPriorLabel === "direct"` → `"major"`
    - `countOnlyFallbackUsed === true` → 명시 생략 (Layer A만)
  - Layer B 문장 예: `"이번 케이스에서는 프로젝트 역할 경험이 가장 직접적인 판단 근거로 작동했습니다."`
- **criteriaAssemblyRule**: Layer A를 먼저 쓰고, primaryCriteriaInputType이 특정되면 Layer B를 이어 붙인다
- **genericCriteriaOnly 금지**: primaryCriteriaInputType이 식별 가능함에도 Layer A 고정문장만 쓰는 것 금지

---

#### scoreReason

- **해야 하는 말**: 왜 현재 band인지 — positive 1개 + limiting 1개 pair
- **primaryPositiveReason 소스**: `reasons[]`의 `proj_direct` / `intern_direct` / `major_direct` / `major_adjacent` 중 첫 번째 해당 항목
- **primaryLimitingReason 소스**: `reasons[]`의 `proj_adjacent_gap` / `intern_industry` / `major_weak` / `major_present` / `no_project_intern` 중 첫 번째 해당 항목. 없으면 `gaps[]` 첫 항목
- **pairSelectionRule**: positive reason label + " 하지만 " + limiting reason label로 1문장 조립 (또는 각 문장으로 분리)
- **bandAwareRule**:
  - 1~2점: limiting 중심 + positive는 "일부 단서가 있으나" 수준으로 약하게
  - 3점: positive 1개 + limiting 1개 필수 (가장 중요한 band)
  - 4점: strong positive 1개 + "왜 5가 아닌지" limiting 1개 필수
  - 5점: positive 중심. limiting 없으면 "추가 evidence가 붙으면 더 안정적" 수준의 coverage 문장 허용
- **금지**: single reason만 쓰는 scoreReason 금지. "전반적으로 연결은 되는 편" 같은 회피 문장 금지

---

#### liftOrLimit

- **defaultMode**: lift (direct role evidence가 부족한 케이스가 대부분이므로)
- **modeSelectionRule**:
  - `projectBestLinkType !== "direct"` AND `internshipLinkType !== "direct"` → lift mode
  - `primaryEvidenceSource === "major"` only, band mid 이하 → lift mode
  - countOnlyFallbackUsed → limit mode ("직무 직접 연결 evidence 없이는 점수 상승에 한계가 있습니다")
- **nextLiftEvidenceType**:
  - lift: "직무 핵심 과업과 직접 이어지는 프로젝트 역할 또는 인턴 경험이 보강되면 이 축이 올라갈 수 있습니다."
  - limit: "현재 구조에서 점수를 올리려면 역할 직접성과 전공 적합성이 함께 맞아야 합니다."
- **falsePromise 방지**: "조금만 더 하면 됩니다" 같은 구체성 없는 낙관 문장 금지

---

### Axis 2. 산업 연관성 (industryContext)

**사용 가능한 signals**:
- `majorAligned`, `certificationsAligned`, `contextAligned`, `weakProjectSignal`
- `internContextStrength`: "strong" / "support" / "none"
- `projectTypeExperienceLabels[]`, `internshipTypeExperienceLabels[]`, `stakeholderExperienceLabels[]`
- `certDirectCount`, `projectIndustrySupportCount`

---

#### lead

- **해야 하는 말**: 어떤 경로에서 산업 이해 신호가 확인되는지(또는 없는지) 1문장
- **우선 재사용 자산**: `buildNewgradDomainInterestToneSummary(signals, band)` — hasTypes, hasStakeholders, contextStrong 분기. 재사용 가능
- **최종 조립 규칙**: tone summary 기본. `certificationsAligned=true`면 "자격증", `majorAligned=true`면 "전공", `contextAligned=true`면 "실무 경험"을 lead에 명시

---

#### criteria

- **Layer A (축 고정 기준문장)**:
  `"이 축은 전공·자격증·실무 경험의 유형이 목표 산업의 업무 문맥과 얼마나 맞닿는지를 봅니다. 어떤 환경에서 어떤 이해관계자를 상대했는지도 함께 읽습니다."`
- **Layer B (케이스별 우선 evidence 명시)**:
  - `primaryCriteriaInputType` 선택 규칙:
    - `contextAligned=true` (strongContextCount > 0) → `"internship/contract"`
    - `certificationsAligned=true` → `"certification"`
    - `majorAligned=true` → `"major"`
    - 모두 false → 명시 생략
  - Layer B 문장 예: `"이번 케이스에서는 인턴·계약 실무 경험의 업종 맥락이 주된 판단 근거로 쓰였습니다."`
- **criteriaAssemblyRule**: Layer A 먼저, primaryCriteriaInputType 특정되면 Layer B 이어 붙임
- **금지**: "산업 이해가 중요합니다" 당위 문장 금지. 직무 연결성 언급 금지 (Axis1 영역)

---

#### scoreReason

- **primaryPositiveReason 소스**: `reasons[]`의 `major_aligned` / `cert_direct` / `context_strong` / `project_industry_support` 중 첫 해당 항목
- **primaryLimitingReason 소스**: `reasons[]`의 `major_unaligned` / `cert_present` / `context_none` / `project_present_only` 중 첫 해당 항목
- **pairSelectionRule**: alignedSourceCount 값으로 tone 결정. 2개 이상 → positive 중심. 1개 → positive + limiting 균형. 0개 → limiting 중심
- **bandAwareRule**: 3점 케이스에서 "어떤 경로에서 신호가 있고, 어떤 경로가 비어 있는지"를 반드시 명시
- **금지**: 산업명/자격증명 없이 "관련 경험이 있습니다"로 끝나는 scoreReason 금지

---

#### liftOrLimit

- **defaultMode**: lift (단일 경로 신호만 있는 케이스가 많으므로)
- **modeSelectionRule**:
  - 단일 경로 신호(alignedSourceCount=1) → lift mode ("두 번째 경로가 추가되면 이 축이 올라갑니다")
  - 범용 경험만 많고 산업 특화 근거 없음 (`contextAligned=false` AND `certificationsAligned=false`) → limit mode
- **nextLiftEvidenceType**:
  - lift: "목표 산업과 직접 맞닿은 인턴 또는 자격증이 추가되면 이 축이 한 단계 올라갈 수 있습니다."
  - limit: "현재 경험 유형이 범용적이어서 산업 특화 맥락을 직접 보여주는 근거가 없으면 점수 상승에 한계가 있습니다."
- **falsePromise 방지**: "산업 관련 경험을 쌓으세요" 같은 추상 문장 금지

---

### Axis 3. 실행 깊이와 책임 경험 (responsibilityScope)

**사용 가능한 signals**:
- `evidenceGroupCount`, `evidenceItemCount`
- `projectOutcomeLevel`: "strong" / "support" / "none"
- `experienceDurationLevel`: "long" / "none"
- `comboEvidence`: boolean
- `evidenceStrength`: "strong" / "mixed" / "weak" / "none"
- `outcomeExperienceLabels[]`, `durationExperienceLabels[]`

---

#### lead

- **해야 하는 말**: 경험 범위와 깊이(outcome/duration 조합)가 어느 수준인지 1문장
- **우선 재사용 자산**: `buildNewgradExecutionDepthToneSummary(signals, band)` — strongOutcome / longDuration / comboEvidence 분기. 재사용 가능
- **최종 조립 규칙**: tone summary 기본. `outcomeExperienceLabels[]` 또는 `durationExperienceLabels[]` 있으면 해당 레이블명 명시

---

#### criteria

- **Layer A (축 고정 기준문장)**:
  `"이 축은 경험 종류의 수보다 결과물 수준과 지속 기간을 통해 실제 책임을 맡아본 깊이를 봅니다."`
- **Layer B (케이스별 우선 attribute 명시)**:
  - `primaryCriteriaInputType` 선택 규칙:
    - `projectOutcomeLevel === "strong"` → `"outcome"` ("이번 케이스에서는 프로젝트 결과 수준이 가장 크게 작동했습니다.")
    - `experienceDurationLevel === "long"` → `"duration"` ("이번 케이스에서는 경험 지속 기간이 주요 판단 기준이었습니다.")
    - `comboEvidence=true` → `"combo"` ("이번 케이스에서는 프로젝트와 실무 경험의 조합이 핵심 신호로 쓰였습니다.")
    - 모두 해당 없음 → 명시 생략
- **금지**: "어디까지 맡아봤는지"가 아닌 "몇 가지 경험을 했는지" 기준 문장 금지 (Axis4 겹침)

---

#### scoreReason

- **primaryPositiveReason 소스**: `reasons[]`의 `project_outcome_strong` / `duration_long` / `combo_evidence` / `multi_group_mixed` 중 첫 해당 항목
- **primaryLimitingReason 소스**: `reasons[]`의 `project_outcome_support` / `project_outcome_missing` / `duration_short` / `weak_depth` 중 첫 해당 항목
- **pairSelectionRule**: evidenceStrength 기준. "strong" → positive 중심 + ceiling hint. "mixed/weak" → positive + limiting 균형. "none" → limiting 중심
- **bandAwareRule**:
  - 3점: "경험은 있으나 결과 수준 또는 지속 기간이 제한적"을 반드시 명시
  - 4점: "깊이 있는 경험이 확인되나 X(outcome/duration/combo 중 비어 있는 것)가 아직 약함"
- **금지**: 경험 개수만 언급하고 결과 수준/지속 기간 언급 없는 scoreReason 금지

---

#### liftOrLimit

- **defaultMode**: lift (outcome 또는 duration 중 비어 있는 축이 명확한 케이스가 많으므로)
- **modeSelectionRule**:
  - `projectOutcomeLevel !== "strong"` → lift mode (outcome 보강이 명확한 경로)
  - `experienceDurationLevel !== "long"` → lift mode (duration 보강이 명확한 경로)
  - evidenceStrength="none" → limit mode ("경험 자체가 없는 구조에서는 단순 추가 이상의 전환이 필요합니다")
- **nextLiftEvidenceType**:
  - lift(outcome): "프로젝트 결과물을 더 구체적으로 보여주거나(발표·배포·실사용 등), 결과 수준이 분명한 경험을 추가하면 이 축이 올라갈 수 있습니다."
  - lift(duration): "단기 체험 위주라면, 더 오래 지속된 역할 경험이 추가될수록 실행 깊이가 더 명확하게 읽힙니다."
  - limit: "결과 수준과 지속 기간 모두가 개선되어야 이 축 점수가 의미 있게 올라갑니다."
- **falsePromise 방지**: "더 많은 경험을 하세요" 추상 문장 금지

---

### Axis 4. 고객 커뮤니케이션 적합성 (customerType)

**사용 가능한 signals**:
- `stakeholderExperienceLabels[]`
- `interactionSupportTone`: "strong" / "support"
- `interactionEligibleWorkStyleLabels[]`
- `axis4SupportStrengthLabels[]`
- `selfReportDirectApplied`: boolean
- `internshipCount`, `partTimeCount`, `extracurricularCount`, `projectCount`

주의: `selfReportSupportLine`이 이미 별도로 조립됨. liftOrLimit와 혼동 금지.

---

#### lead

- **해야 하는 말**: 누구와 직접 일했는지의 강도가 어느 수준인지 1문장
- **우선 재사용 자산**: `buildNewgradInteractionFitToneSummary(signals, band)` — stakeholderCount / strongExternalTone 분기. 재사용 가능
- **최종 조립 규칙**: tone summary 기본. `stakeholderExperienceLabels[]` 있으면 이해관계자 레이블명 명시

---

#### criteria

- **Layer A (축 고정 기준문장)**:
  `"이 축은 경험의 종류보다 누구를 상대하고 어떤 방식으로 소통했는지, 즉 이해관계자 접점의 강도를 봅니다."`
- **Layer B (케이스별 우선 stakeholder 명시)**:
  - `primaryCriteriaInputType` 선택 규칙:
    - `interactionSupportTone === "strong"` → `"external_stakeholder"` ("이번 케이스에서는 고객·사용자 등 외부 이해관계자 접점이 핵심 근거였습니다.")
    - stakeholderExperienceLabels.length >= 1 but tone="support" → `"internal_stakeholder"` ("이번 케이스에서는 내부 팀·현업 실무자 협업 경험이 주된 신호로 쓰였습니다.")
    - totalCount > 0 but stakeholders 없음 → 명시 생략
- **금지**: "강점이나 성향"으로 criteria 설명 금지 (Axis5 영역). "누구와 어떻게 일했는지"만 설명

---

#### scoreReason

- **primaryPositiveReason 소스**: `reasons[]`의 `experience_interaction_strong` / `experience_interaction_stakeholder` / `intern_interact` / `parttime_interact` 중 첫 해당 항목
- **primaryLimitingReason 소스**: `reasons[]`의 `no_interaction` / `experience_interaction_support` (external tone 약함) 중 첫 해당 항목
- **pairSelectionRule**: interactionSupportTone으로 tone 결정. "strong" → positive 중심 + "다양성" ceiling hint. "support" → positive + "외부 접점 제한" limiting 균형
- **bandAwareRule**: 3점 케이스에서 "이해관계자 접점은 있으나 외부/직접 접점 강도는 제한적"을 반드시 명시
- **금지**: workStyle / strengths 기반 scoreReason 금지 (Axis5 영역)

---

#### liftOrLimit

- **defaultMode**: lift (외부 접점이 제한적인 케이스가 많으므로)
- **modeSelectionRule**:
  - `interactionSupportTone !== "strong"` → lift mode
  - stakeholderExperienceLabels.length <= 1 → lift mode
  - 경험 자체가 팀플 위주이고 외부 접점 구조적으로 없는 케이스 → limit mode
- **nextLiftEvidenceType**:
  - lift: "고객·사용자·외부 파트너를 직접 상대한 경험이 추가되면 이 축이 더 강하게 읽힐 수 있습니다."
  - limit: "팀 내부 협업 위주 구조에서는 이해관계자 접점을 직접 만드는 경험이 없으면 점수 상승에 한계가 있습니다."
- **falsePromise 방지**: "소통 능력을 키우세요" 추상 문장 금지. `selfReportSupportLine`을 liftOrLimit로 재사용 금지

---

### Axis 5. 강점과 재능 (roleCharacter)

**사용 가능한 signals**:
- `matchedStrengthLabels[]`, `matchedWorkStyleLabels[]`
- `selfReportAlignedDirectly`: boolean
- `strengthsCount`, `workStyleNotesPresent`
- `selfReportSupportLine` (이미 조립됨)

주의: Axis5는 self-report 기반이므로 과신성 문구 위험이 높다. positive 편향 구조.

---

#### lead

- **해야 하는 말**: 입력된 강점/workStyle이 목표 직무 성향과 얼마나 맞는지 1문장
- **우선 재사용 자산**: `NEWGRAD_SOFT_SKILL_SUMMARY[band]` 상수 — generic하므로 evidence명 보강 필요
- **그대로 쓰면 생기는 위험**: "강점이 있습니다" 수준으로 generic해짐
- **최종 조립 규칙**: `matchedStrengthLabels[]`가 있으면 해당 강점명을 lead에 명시. 없으면 band summary fallback

---

#### criteria

- **Layer A (축 고정 기준문장)**:
  `"이 축은 입력한 강점과 일하는 방식이 목표 직무에서 요구하는 행동 성향과 얼마나 일치하는지를 봅니다. 자기보고 기반이므로 실제 경험과의 정합성도 함께 봅니다."`
- **Layer B (케이스별 우선 자산 명시)**:
  - `primaryCriteriaInputType` 선택 규칙:
    - `matchedStrengthLabels.length > 0` AND `matchedWorkStyleLabels.length > 0` → `"strengths+workstyle"` ("이번 케이스에서는 강점과 일하는 방식 모두 직무 성향과 맞닿는 신호가 확인됐습니다.")
    - `matchedStrengthLabels.length > 0` only → `"strengths"` ("이번 케이스에서는 입력한 강점 신호가 주된 판단 근거로 쓰였습니다.")
    - `matchedWorkStyleLabels.length > 0` only → `"workstyle"` ("이번 케이스에서는 일하는 방식 신호가 주된 판단 근거로 쓰였습니다.")
    - 모두 없음 → 명시 생략 (Layer A만)
- **금지**: "좋은 강점을 갖고 있습니다" 당위 문장 금지. 자기보고 한계를 반드시 Layer A에 포함

---

#### scoreReason

- **해야 하는 말**: 어떤 강점/workStyle이 매칭됐고, 무엇이 제한 이유인지 — pair 필수
- **primaryPositiveReason 소스**: `reasons[]`의 `strengths_aligned` / `workstyle_aligned` 중 첫 해당 항목
- **primaryLimitingReason 소스 (taxonomy 3종)**:
  - **type A (self-report only)**: `selfReportAlignedDirectly=false` OR `matchedStrengthLabels` 있으나 experience 연결 없음 → `"강점 신호는 있으나 실제 경험과의 정합성이 드러나지 않아 자기보고 수준에서 읽힙니다."`
  - **type B (weak workstyle evidence)**: `matchedWorkStyleLabels.length === 0` but `matchedStrengthLabels.length > 0` → `"강점 매칭은 확인되나 일하는 방식 신호가 약해 직무 성향 적합성이 제한적으로 읽힙니다."`
  - **type C (weak alignment consistency)**: aligned signals 있으나 band가 mid 이하 → `"강점과 일하는 방식 신호는 있으나 전체 aligned signal 수가 아직 적어 일관성이 약합니다."`
  - 현재 `no_strengths` reason도 유지 (입력 없는 케이스용)
- **band별 limiting type 우선순위**:
  - 5점: type 없음 (ceiling hint만 허용)
  - 4점: type A 또는 B 우선
  - 3점: type A 또는 C 우선
  - 1~2점: type A + `no_strengths` 조합 가능
- **pairSelectionRule**: positive reason + limiting type 1개를 pair로. `selfReportAlignedDirectly=true`면 positive 중심 + type A/B/C 중 가장 약한 한계 명시
- **self-report only high-score 금지**: matched signals 있어도 `selfReportAlignedDirectly=false`인 경우 4~5점 scoreReason에서 과신성 표현 금지
- **금지**: 매칭됐다는 사실만 반복하고 왜 5점이 아닌지 안 말하는 scoreReason 금지

---

#### liftOrLimit

- **defaultMode**: limit (self-report 구조이므로 단순 추가로 점수 상승 약속 위험)
- **modeSelectionRule**:
  - `matchedStrengthLabels.length === 0` → lift mode (구체적 강점 입력이 없어 올릴 경로 명확)
  - `selfReportAlignedDirectly=false` → limit mode (입력은 있으나 경험 연결 없어 구조적 한계)
  - `matchedStrengthLabels.length > 0` AND `selfReportAlignedDirectly=true` → limit mode (현재 수준 한계 명시)
- **nextLiftEvidenceType**:
  - lift: "목표 직무의 핵심 성향과 매칭되는 강점 입력이 보강되면 이 축 점수가 올라갈 수 있습니다."
  - limit: "현재 강점-직무 매칭이 자기보고 수준에 머물러 있어, 구체적인 경험 사례와 연결되어야 이 축이 안정적으로 읽힙니다."
- **Axis4와의 경계**: liftOrLimit에서 "이해관계자와 소통한 경험을 쌓으세요" 금지 (Axis4 영역)
- **falsePromise 방지**: "강점을 더 개발하세요" 추상 문장 금지. "완벽하게 맞습니다" 확신 금지

---

## 7. 축별 중복 방지 규칙

### Axis 1 vs Axis 2

- **겹치기 쉬운 이유**: 전공, 자격증, 인턴 경험이 두 축 모두에서 input으로 쓰임
- **현재 자산에서의 위험**: `majorAligned`(Axis2)와 `majorPriorLabel`(Axis1)이 같은 전공을 다른 관점으로 읽음. 두 축이 같은 전공을 긍정 이유로 쓰면 겹침
- **조립 시 분리 규칙**: Axis1은 "직무 과업 fit(역할 직접성)", Axis2는 "산업 문맥 fit(업종 맥락)"으로 읽는 속성을 명시 분리. criteria Layer B가 다른 inputType을 지목해야 함
- **금지**: Axis1에서 "이 전공은 목표 산업에 대한 이해를 보여줍니다" 금지. Axis2에서 "이 전공은 직무 핵심 과업과 직접 연결됩니다" 금지

### Axis 1 vs Axis 3

- **겹치기 쉬운 이유**: 프로젝트 경험이 두 축 모두에서 쓰임. SSOT_Map에서 overlap risk "high" 기록됨
- **현재 자산에서의 위험**: signals 레벨에서는 분리됨(Axis1: projectBestLinkType, Axis3: projectOutcomeLevel). 그러나 builder가 두 축 모두 "프로젝트 경험이 있습니다"로 positive 만들면 겹침
- **조립 시 분리 규칙**: criteria Layer A에서 차이 명시 필수. Axis1은 "역할 연결성", Axis3은 "결과 깊이"가 다른 기준임을 criteria에서 드러냄
- **금지**: Axis1에서 "프로젝트를 끝까지 완수한 경험이 있습니다" 금지(Axis3). Axis3에서 "프로젝트 역할이 직무와 연결됩니다" 금지(Axis1)

### Axis 4 vs Axis 5

- **겹치기 쉬운 이유**: `workStyleNotes` / `interactionEligibleWorkStyleKeys`가 두 축에서 공유됨. `selfReportSupportLine`이 두 축 모두에서 생성됨
- **현재 자산에서의 위험**: Axis4 builder에서 `workStyleNotesPresent` reasons를 positive에 추가. Axis5도 workStyle 기반. 두 축이 같은 workStyle 자산을 긍정 이유로 쓰면 겹침
- **조립 시 분리 규칙**: Axis4는 "누구를 상대했는가(이해관계자 접점)", Axis5는 "어떻게 일하는가(강점/성향 매칭)". criteria Layer A/B가 각각 다른 inputType을 지목
- **금지**: Axis4에서 "입력한 강점이 이 직무와 맞습니다" 금지(Axis5). Axis5에서 "고객을 직접 상대한 경험이 있습니다" 금지(Axis4). 두 축에서 selfReportSupportLine이 거의 같은 내용으로 나오는 것 금지

---

## 8. 구현 전 체크포인트

| 체크포인트 | 왜 필요한지 | 확인 대상 파일 | 구현 리스크 |
|---|---|---|---|
| `makeExplanation()` shape 확장 방식 결정 | 기존 `makeExplanation()`이 `summary/positives/gaps/reasons` 반환. 4슬롯 추가 시 이 함수 또는 각 builder에서 슬롯 조립해야 함 | `axisExplanationRegistry.js:makeExplanation()` (line 22~32) | `makeExplanation()` 변경 시 experienced 5축 builder도 영향. 선택지: ① optional 4슬롯 파라미터 추가, ② 각 builder에서 4슬롯 조립 후 spread. experienced path 격리 필수 |
| Axis5 limiting reason taxonomy 코드 반영 | type A/B/C 3종이 builder 레벨에서 실제로 생성되는지 확인 필요 | `axisExplanationRegistry.js:buildNewgradSoftSkillMatchExplanation()` (line 1198~1250) | 현재 `no_strengths` 외 negative reason 없음. type A/B/C reasoning 신규 추가 필요 |
| criteria Layer B primaryCriteriaInputType 선택 로직 구현 | signals에서 primaryCriteriaInputType을 올바르게 선택하는 로직 | 각 newgrad explanation builder | 축별 선택 규칙이 다름. builder마다 다른 signals 조건 사용 |
| available: true 보장 guard 확인 | fallback 제거 전제조건. `positives.length === 0 AND gaps.length === 0` 케이스에서 available: false 반환 | 각 builder의 `if (positives.length === 0 && gaps.length === 0) return { available: false }` | 최소 1개 positive 또는 negative reason을 보장하는 guard 추가 또는 확인 필요 |
| UI consumer 변경 범위 | 본문에 lead + scoreReason, 상세보기에 criteria + liftOrLimit 구조로 변경 | `TransitionLiteResult.jsx:1191` (main body), `1201~1282` (expanded detail 블록) | `isNewgradReport` gate로 기존 experienced 렌더 영향 없음. backward compatible 가능 |
| `getAxisScoreNarrative()` 제거 전 QA 조건 3개 충족 확인 | 아래 QA 조건 3개 모두 통과 시에만 제거 가능 | `TransitionLiteResult.jsx:859~957` | QA 미통과 상태에서 제거하면 설명 품질 저하 |

**getAxisScoreNarrative fallback 제거 QA 조건 (3개 모두 만족해야 제거 가능)**:
1. 5축 모두 4슬롯(lead/criteria/scoreReason/liftOrLimit)이 비어 있지 않음
2. Axis 3점/4점 케이스에서 scoreReason이 실제 limiting evidence를 포함함 (positive만 있는 scoreReason 없음)
3. Axis4/5 중복 문장 패턴이 허용치 이하 (동일 selfReportSupportLine 내용이 두 축에 반복되지 않음)

---

## 9. 구현 우선순위 제안

**1순위: 4슬롯 조립 로직 추가 — `axisExplanationRegistry.js` 5개 newgrad builder**

- 이유: 모든 후속 작업의 전제 조건. signals와 reasons 소재는 이미 있음
- 영향 파일: `src/data/transitionLite/axisExplanationRegistry.js`
- 위험도: 보통. experienced 5축 격리 필수

**2순위: UI consumer 변경 — 본문에 lead+scoreReason, 상세보기에 criteria+liftOrLimit**

- 이유: 1순위 완료 후 사용자가 새 슬롯을 볼 수 있어야 함
- 영향 파일: `src/components/report/TransitionLiteResult.jsx`
- 위험도: 낮음. isNewgradReport gate로 기존 렌더 격리

**3순위: fallback QA 조건 3개 통과 확인 후 `getAxisScoreNarrative` newgrad 케이스 제거**

- 이유: 1+2순위 완료 + QA 통과 후에만 안전하게 제거 가능
- 영향 파일: `src/components/report/TransitionLiteResult.jsx:859~957`
- 위험도: 낮음 (QA 통과 후 제거)

---

## 10. 슬롯별 실패 패턴

| 슬롯 | 흔한 실패 패턴 | 왜 실패인지 | 금지 예시 | 통과 방향 |
|---|---|---|---|---|
| lead | band 설명만 하고 evidence 없음 | "무슨 판정인지"가 없어 사용자가 이해 못함 | "직무 연결성이 보통 수준입니다." | "프로젝트 역할(기획) 경험이 목표 직무와 부분적으로 이어집니다." |
| criteria | Layer A 고정문장만, Layer B 없음 | 모든 사용자 criteria가 동일해져 explanationCard 의미 없어짐 | "이 축은 전공이나 역할 경험이 직무와 얼마나 이어지는지를 봅니다." (Layer B 없음) | Layer A + "이번 케이스에서는 프로젝트 역할 경험이 주된 판단 근거였습니다." |
| scoreReason | positive만 있거나 limiting만 있음 | "왜 이 점수인지" 한 축만 설명. 사용자가 왜 더 높거나 낮은지 모름 | "직무와 이어지는 경험이 확인됩니다." (positive only) | "프로젝트 역할 연결은 확인됩니다. 하지만 인턴 경험의 직무 직접 근거가 약해 현재 3점으로 읽혔습니다." |
| liftOrLimit | "더 많은 경험을 쌓으세요" 추상 문장 | 사용자가 무엇을 해야 하는지 알 수 없음 | "관련 경험을 더 쌓으세요." | "직무 핵심 과업과 직접 이어지는 프로젝트 역할이 1개 더 추가되면 이 축이 올라갈 수 있습니다." |
| Axis5 scoreReason | matched signal만 나열하고 제한 없음 | self-report 기반 과신성 문장이 됨 | "입력한 강점이 직무와 잘 맞습니다." | "강점 신호는 확인됩니다. 다만 실제 경험과의 정합성이 드러나지 않아 자기보고 수준에서 읽히고 있습니다." |

---

## 11. band-aware wording rules

scoreReason / liftOrLimit에 적용:

| band | scoreReason wording | liftOrLimit wording |
|---|---|---|
| 1~2점 (very_low/low) | limiting 중심. positive는 "일부 단서가 있으나" 수준으로 약하게. "근거가 아직 부족합니다"를 직접적으로 | limit mode 우선. "구조적으로 부족하여 점수 상승에 한계가 있습니다" 허용. 과도한 lift 약속 금지 |
| 3점 (mid) | positive 1개 + limiting 1개 필수 균형. "기본 연결은 있으나 X가 제한적"이 핵심 | lift mode 가능. "X가 보강되면 한 단계 올라갈 수 있습니다" 형태. 구체적 evidence 명시 필수 |
| 4점 (mid_high) | strong positive 1개 + "왜 5가 아닌지" limiting 1개 필수. positive가 strong해야 함 | lift 또는 limit. "Y가 추가되면 더 안정적"(lift) 또는 "Z가 없으면 5점 수준을 약속하기 어렵습니다"(limit) |
| 5점 (high) | positive 중심. limiting은 없어도 되나, 있으면 coverage/consistency 관점의 약한 ceiling 문장만 허용 | limit mode 우선 또는 생략 가능. "현재 근거가 충분하나 X 경로까지 보완되면 더 안정적입니다" 수준 |

---

## 12. slot source priority

각 슬롯이 여러 자산을 사용할 수 있을 때 우선순위:

| 슬롯 | 1순위 | 2순위 | 3순위 |
|---|---|---|---|
| lead | `buildNewgrad*ToneSummary()` 반환값 | strongest positive reason label + evidence label 명시 | band summary 상수 fallback |
| criteria | Layer A 축 고정 템플릿 | + Layer B primaryCriteriaInputType (signals 기반 선택) | Layer A만 (primaryCriteriaInputType 식별 불가 시) |
| scoreReason | primaryPositiveReason + primaryLimitingReason pair | band-aware summary (단독 사용 시 gap 명시 조건) | single reason (pair 불가 시 — 금지 원칙이나 예외 허용 시 명시) |
| liftOrLimit | mode 선택(lift/limit) → 해당 mode 문장 | gaps[] 소재 reframe | next-lift hint (evidence 명시 불가 시) |

---

## 13. 최종 실행 판단

**READY FOR IMPLEMENTATION: YES WITH PRECONDITIONS**

- 슬롯별 조립 계약이 v1.1에서 완전히 닫혔다. criteria 2층 구조, scoreReason pair rule, liftOrLimit 2모드, Axis5 limiting taxonomy가 모두 정의됨.
- 구현 전 precondition 2개:
  1. Axis5 builder에서 type A/B/C limiting reason 3종 신규 추가 (`buildNewgradSoftSkillMatchExplanation` 내부)
  2. `makeExplanation()` 확장 방식(signature vs 별도 함수)으로 experienced 5축 격리 확인
- 구현 추가로 필요한 설계: 없음. 이 문서로 충분.

---

**DESIGN VERDICT: READY WITH CONSTRAINTS**

이유:
- 슬롯별 조립 계약이 축별 + 슬롯별로 파일/로직 단위까지 닫혔다.
- criteria/liftOrLimit 약점이 2층 구조 및 2모드로 보완됐고, Axis5 limiting이 taxonomy로 분리됐다.
- Axis5 type A/B/C 신규 추가와 makeExplanation() 확장 방식 결정이 구현 첫 단계에서 선행되어야 한다.
