# PASSMAP Rejection Analysis Recruiter Read Context Policy

> 버전: 1.0.0  
> 상태: 확정(Locked)  
> 위치: docs/ — SSOT 정책 문서  
> 상위 문서:
> - `PASSMAP_GATE_AI_DECISION_POLICY.md` (판정 철학)
> - `PASSMAP_REQUIRED_CONDITION_RESOLUTION_POLICY.md` (rule/AI 결합 정책)

---

## 1. 문서 목적

이 문서는 PASSMAP 서류탈락 분석(rejection analysis) AI가 **채용담당자 관점의 직무·산업 맥락**을 어떻게 전달받고 활용하는지를 고정한다.

서류탈락 분석 AI는 이미 `compositeRiskContext`(규칙 기반 리스크 요약)와 `structuredSummaryContext`(경력·JD 구조화 요약)를 입력으로 받는다. 이 문서가 정의하는 `recruiterReadContext`는 그것과 **다른 출처와 목적**을 가지는 세 번째 컨텍스트 객체다.

목적은 규칙이 만들기 어려운 **직무 특성·산업 맥락·전공 의존도** 정보를 레지스트리에서 결정론적으로 조달해, AI 프롬프트에 안정적으로 공급하는 것이다.

---

## 2. 세 컨텍스트 객체의 역할 구분

| 객체 | 출처 성격 | 주요 내용 | 목적 |
|---|---|---|---|
| `compositeRiskContext` | 규칙 추출 + 집계 | 리스크 밴드, 상위 리스크 목록, 심각도 | 탈락 위험 수준 전달 |
| `structuredSummaryContext` | JD/이력서 추출 | 경력 요약, JD 시니어리티, 핵심 키워드 | 후보자·JD 구조 전달 |
| `recruiterReadContext` | 레지스트리 조회 (결정론적) | 직무 미션·성과 유형, 전공 의존도, 이해관계자, 산업 맥락 | 채용담당자 관점 고정값 전달 |

**각 객체의 역할 경계:**
- `structuredSummaryContext` = JD/이력서에서 추출된 후보자·직무 사실 (extraction-based)
- `recruiterReadContext` = 레지스트리·온톨로지 기반 직무-산업 recruiter-read 지식 (deterministic registry)
- required-condition resolver = JD 명시 필수조건에 대한 hard-cut 충족 여부 판정 (rule + AI resolution pipeline)
- `recruiterReadContext`가 커버하는 것: 이 직무·산업에서 **후보자가 어떻게 읽힐 것인지**에 대한 고정 맥락

**핵심 원칙:**
- `recruiterReadContext`는 `structuredSummaryContext`를 확장하지 않는다. 별도 객체다.
- `recruiterReadContext`는 AI가 추출·해석한 결과가 아니라 레지스트리에서 고정 조달한다.
- `structuredSummaryContext`의 `roleFit`, `careerSummary`와 섞이지 않는다.

---

## 3. recruiterReadContext v1 스키마

```js
recruiterReadContext: {
  version: "1.0.0",

  job: {
    id: string | null,            // 직무 온톨로지 ID (예: "JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT")
    label: string | null,         // 한글 직무명 (예: "소프트웨어 개발")
    missionType: string | null,   // TRANSITION_READ_MISSION_TYPES 중 하나
    outputType: string | null,    // TRANSITION_READ_OUTPUT_TYPES 중 하나
    successMetricType: string | null,  // TRANSITION_READ_SUCCESS_METRIC_TYPES 중 하나
    majorDependency: {
      tier: "high" | "medium" | "low" | null,
      reason: string | null,      // JOB_MAJOR_DEPENDENCY_REGISTRY의 reason 필드 (한국어)
    },
    primaryStakeholders: string[],        // TRANSITION_READ_STAKEHOLDER_PRIMARY_TYPES 서브셋
    stakeholderRationale: string | null,  // primaryStakeholders를 1문장으로 설명 (한국어, AI 생성 금지, 레지스트리 기반)
  },

  industry: {
    id: string | null,               // 산업 레지스트리 ID
    label: string | null,            // 한글 산업명
    coreContext: string[],           // buildIndustryContext(resolvedIndustry).coreContext (최대 6개)
    workContextEvidenceExamples: string[],  // industryArchetypeRegistry.workContextEvidenceExamples (최대 5개)
    interviewPrepSuggestions: string[],     // industryArchetypeRegistry.interviewPrepSuggestions (최대 3개)
  },

  provenance: {
    jobContextAvailable: boolean,        // job 데이터 조회 성공 여부
    industryContextAvailable: boolean,   // industry 데이터 조회 성공 여부
    source: "deterministic_registry",    // 항상 이 값
  },
}
```

---

## 4. 필드별 출처 테이블

| 필드 | 출처 레지스트리 / 함수 | 비고 |
|---|---|---|
| `job.id` | 호출자가 전달하는 온톨로지 ID | JD 파싱 결과 |
| `job.label` | `getJobOntologyItemById(id).label` | jobOntology.index.js |
| `job.missionType` | `getTransitionReadJobMeta(id).missionType` | jobTransitionReadMetaRegistry.js |
| `job.outputType` | `getTransitionReadJobMeta(id).outputType` | jobTransitionReadMetaRegistry.js |
| `job.successMetricType` | `getTransitionReadJobMeta(id).successMetricType` | jobTransitionReadMetaRegistry.js |
| `job.majorDependency` | `JOB_MAJOR_DEPENDENCY_REGISTRY[id]` | jobMajorDependencyRegistry.js |
| `job.primaryStakeholders` | `getTransitionReadJobMeta(id).stakeholderPrimary` (배열 정규화) | jobTransitionReadMetaRegistry.js |
| `job.stakeholderRationale` | `NEWGRAD_AXIS4_JOB_STAKEHOLDER_RELEVANCE[id].rationale` 또는 유사 필드 | 미보유 시 null |
| `industry.id` | 호출자가 전달하는 산업 레지스트리 ID | JD 파싱 결과 |
| `industry.label` | `buildIndustryContext(resolvedIndustry).label` | buildIndustryContext.js |
| `industry.coreContext` | `buildIndustryContext(resolvedIndustry).coreContext` (상위 6개) | buildIndustryContext.js — industryRegistry 기반 |
| `industry.workContextEvidenceExamples` | `INDUSTRY_ARCHETYPES[id].workContextEvidenceExamples` (상위 5개) | industryArchetypeRegistry.js |
| `industry.interviewPrepSuggestions` | `INDUSTRY_ARCHETYPES[id].interviewPrepSuggestions` | industryArchetypeRegistry.js |
| `provenance.*` | 조회 성공/실패 결과로 결정론적 생성 | |

---

## 5. v1 제외 범위

v1에서 의도적으로 제외한 항목:

| 항목 | 제외 이유 |
|---|---|
| `industryArchetypeRegistry`의 narrative 텍스트 (weakEvidenceText, moderateEvidenceText 등) | 신입 Axis2 카드 전용 — 서류탈락 분석과 목적이 다름 |
| `horizonType` | 현재 rejection analysis 프롬프트에서 사용 계획 없음 |
| `industryRelevanceTier` | `structuredSummaryContext.jdProfile`과 중복 가능성 있음 |
| `repeatabilityEvidenceExamples` | 신입 반복성 판단 전용 — rejection analysis 범위 아님 |
| `backgroundEvidenceExamples` 계열 | 신입 배경 평가 전용 — 제외 |
| axis 점수 / 밴드 일체 | 신입 분석 Axis 전용 — rejection analysis 범위 아님 |
| 전체 transition pack | 이직 전환 분석 전용 — v1 범위 아님 |
| 전체 newgrad pack | 신입 분석 전용 — v1 범위 아님 |
| newgrad major bridge narrative 텍스트 | 신입 전공 연결 서술 전용 — rejection analysis AI에 주입 금지 |
| v1 단계의 boundary hints | 직무 가족 경계 신호 — 서류탈락 분석 맥락에서 용도 미확정 |
| 자동 리스크 심각도 계산 | `recruiterReadContext`는 리스크 판정 기관이 아님 — 판정은 `requiredConditionResolutions` 파이프라인 |
| REQUIRED_MAJOR resolver 설계 결정 사항 일체 | resolver 고도화는 별도 정책 결정 이후 — 이 문서에서 확정하지 않음 |
| AI 생성 필드 일체 | provenance.source = "deterministic_registry" 원칙 |

---

## 6. 빌드 함수 계약

`recruiterReadContext`는 신규 빌드 함수 `buildRecruiterReadContext({ jobId, industryId })`로 생성한다.

**계약 규칙:**
- 입력: `jobId` (string | null), `industryId` (string | null)
- 출력: 항상 `recruiterReadContext` 형태의 객체를 반환한다. 실패하더라도 null을 반환하지 않는다.
- `jobId`가 없거나 레지스트리에 없으면: `job` 블록은 모든 필드를 null로 채우고 `provenance.jobContextAvailable = false`
- `industryId`가 없거나 레지스트리에 없으면: `industry` 블록은 모든 필드를 null로 채우고 `provenance.industryContextAvailable = false`
- 기존 `buildJobContext()`, `buildIndustryContext()` 어댑터(`src/lib/adapters/`)를 직접 대체하지 않는다. 독립 빌드 함수로 신규 작성한다.
- `version` 필드는 항상 `"1.0.0"`을 하드코딩한다 (동적 감지 금지).

---

## 7. rejection analysis AI 주입 방식

`recruiterReadContext`는 `api/rejection-analysis-ai.js`의 `buildRejectionAnalysisPrompt()` 내부에서 `_buildGroundingSection()`을 통해 프롬프트 텍스트로 렌더링된다.

**렌더링 원칙:**
- `recruiterReadContext`는 `structuredSummaryContext` 바로 다음, 별도 섹션으로 삽입한다.
- `provenance.jobContextAvailable = false`이면 job 섹션 전체를 프롬프트에서 생략한다.
- `provenance.industryContextAvailable = false`이면 industry 섹션 전체를 프롬프트에서 생략한다.
- AI에게 "이 데이터는 레지스트리에서 결정론적으로 조달된 고정값입니다"라는 맥락을 명시한다.

---

## 8. rejection analysis AI 출력 필드별 사용 허용 규칙

| AI 출력 필드 | 사용 가능한 recruiterReadContext 필드 |
|---|---|
| `targetCandidateProfile` | `job.missionType`, `job.outputType`, `job.successMetricType` |
| `recruiterInterpretation` | `job.*` 전체, `industry.coreContext` |
| `mustRequirementGaps[]` | `job.majorDependency`, `industry.coreContext` |
| `transferableSignals[]` | `job.missionType`, `job.primaryStakeholders` |
| `missingInfoQuestions[]` | `job.majorDependency`, `industry.workContextEvidenceExamples` |
| `rewriteDirections[]` | `industry.interviewPrepSuggestions`, `job.outputType` |
| `antiOverclaimWarnings[]` | `job.majorDependency.tier` |
| `resumeReadProfile` | recruiterReadContext 사용 금지 (이력서 자체 파악 목적 — 이력서 근거만으로 판단) |
| `identityGapSummary` | `job.missionType`, `job.outputType`, `job.successMetricType`, `job.majorDependency`, `job.primaryStakeholders` (선택) — 이 직무에서 후보자가 어떻게 읽힐지 역할 정체성 격차를 서술할 때 활용. 이력서 근거를 날조해서는 안 됨. |

---

## 9. structuredSummaryContext와의 경계

| 규칙 | 근거 |
|---|---|
| `recruiterReadContext.job.*`와 `structuredSummaryContext.jdProfile.seniority`를 AI가 직접 비교하는 것은 허용 | 둘 다 JD 파싱 기반이며 상호보완적 |
| `recruiterReadContext`의 필드를 `structuredSummaryContext` 내부에 넣는 것은 금지 | 출처(레지스트리 vs. 추출)가 다름 |
| `structuredSummaryContext.roleFit.riskHints`와 `recruiterReadContext.job.majorDependency`를 혼합 집계하는 것은 금지 | rule 사실과 레지스트리 고정값을 합산하면 이중계산 위험 |
| AI가 `recruiterReadContext` 내용을 재해석해 새로운 gate를 도출하는 것은 금지 | gate 판정은 `requiredConditionResolutions` 파이프라인을 따른다 |

---

## 10. REQUIRED_MAJOR gate와의 관계

`job.majorDependency.tier`는 `GATE__REQUIRED_MAJOR_MISSING`의 **판정 입력이 아니다.**

`GATE__REQUIRED_MAJOR_MISSING`은 `requiredGateSignals.major` → (미래: `requiredConditionResolutions`)를 읽으며, 이 gate의 점수와 발동 조건은 `requiredConditionResolutions` 파이프라인이 관장한다.

`job.majorDependency.tier`는 다음 용도로만 사용한다:
- rejection analysis AI가 `mustRequirementGaps[]` 또는 `antiOverclaimWarnings[]`를 서술할 때 맥락으로 활용
- 전공 관련 표현의 강도 조절 참고값

**경계:** `recruiterReadContext.job.majorDependency`를 근거로 gate 발동 여부를 변경하거나, `requiredConditionResolutions`의 `finalAssessment.status`를 override하는 것은 금지한다.

---

## 11. provenance 원칙

`recruiterReadContext.provenance.source`는 항상 `"deterministic_registry"`다.

이 값이 의미하는 것:
- 모든 필드는 레지스트리 조회 결과이거나 null이다.
- AI 추론·생성 값이 포함되지 않는다.
- 동일 입력(jobId, industryId)에 대해 항상 동일한 출력을 보장한다.

**QA 원칙:**
- `provenance.jobContextAvailable = true`인데 `job.missionType`이 null이면 빌드 함수 버그다.
- `provenance.source`가 `"deterministic_registry"`가 아닌 값을 가지면 계약 위반이다.

---

## 12. 구현 순서

이 문서를 기준으로 아래 순서로 구현한다:

1. **계약 문서 작성** (이 문서 — 완료)

2. **`buildRecruiterReadContext({ jobId, industryId })` 결정론적 빌더 신규 작성**  
   `src/lib/adapters/buildRecruiterReadContext.js` — 레지스트리 조회, null-safe, provenance 포함  
   기존 `buildJobContext()`, `buildIndustryContext()` 어댑터를 직접 대체하지 않는 독립 빌드 함수

3. **rejection-analysis 요청 흐름에 신규 선택적 객체로 추가**  
   `api/rejection-analysis-ai.js` 호출부에 `recruiterReadContext` 파라미터 추가 (없으면 생략)

4. **AI 프롬프트에 전용 grounding 섹션 추가**  
   `buildRejectionAnalysisPrompt()` → `_buildGroundingSection()`에 별도 섹션 삽입  
   `provenance.jobContextAvailable = false`이면 job 섹션 생략, `industryContextAvailable = false`이면 industry 섹션 생략

5. **대표 recruiter-read QA 케이스 실행** (필수 — 이 단계 생략 금지)  
   - `provenance.jobContextAvailable`·`provenance.industryContextAvailable` true/false 4조합 검증  
   - 주요 직무·산업 조합 최소 3케이스: 출력 필드 null 없음, 배열 비어있지 않음, 모하이케이크 없음 확인

6. **아키텍처 정합 확인 후, 나머지 required-condition 마이그레이션 재개**  
   5단계 QA 완료 이후에만 REQUIRED_MAJOR 등 required-condition resolver 고도화 작업 재개  
   `job.majorDependency.tier`를 resolver context에 포함할지는 별도 정책 결정

---

> 이 문서는 `recruiterReadContext` v1의 계약을 고정한다.  
> 필드 추가·스키마 변경 시 이 문서를 먼저 개정하고, 구현 파일이 뒤따른다.
