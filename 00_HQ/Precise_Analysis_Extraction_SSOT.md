# Precise Analysis 추출/정규화 SSOT

## 문서 목적

이 문서는 preciseAnalysis MVP 엔진 5개가 실제로 소비하는 입력 필드를 레이어별로 정의하고,  
현재 자산과 후속 후보 자산을 구분하는 단일 기준(SSOT)이다.

**이 문서의 성공 기준**: 다음 엔진/기능 추가 시 "입력 shape 때문에 흔들리지 않는" 계약을 미리 잡아두는 것.

---

## 레이어 구조

```
A. Raw Input Layer
   └─ jdRawText, resumeRawText, portfolioRawText, __resumeMerged

B. Parsed Layer
   ├─ parseWithAI → window.__PARSED_JD__   (AI 추출, JD)
   └─ parseWithAI → window.__PARSED_RESUME__ (AI 추출, Resume)

C. Normalized Layer
   └─ buildJdResumeFit() → window.__JD_RESUME_FIT__
       ├─ fit.jdModel          (엔진 직접 입력 SSOT)
       └─ fit.resume.structured (엔진 직접 입력 SSOT)

D. Derived Layer
   └─ buildCompositeRisk() → window.__PRECISE_ANALYSIS_DEBUG__.compositeRisk
       ├─ keywordCoverageRatio, missingKeywords[]
       ├─ totalCareerMonths/Years, maxGapMonths
       ├─ quantifiedBulletRatio
       └─ overallBand, topRisks[]
```

---

## A. Raw Input Layer

| 필드명 | 소스 | 현재 사용 여부 | 비고 |
|---|---|---|---|
| `jdRawText` | `state.jd` (App.jsx) | ✅ 사용 중 | buildJdResumeFit, semanticMatchJDResume |
| `resumeRawText` | `state.resume` (App.jsx) | ✅ 사용 중 | buildJdResumeFit |
| `portfolioRawText` | `state.portfolio` (App.jsx) | ✅ 사용 중 | __resumeMerged 합성에 포함 |
| `__resumeMerged` | `resumeBase + "\n\n" + portfolio` (App.jsx 로컬) | ✅ 사용 중 | buildJdKeywordCoverageGapRisk에 직접 전달 |
| `uploadedFileText` | `extractTextFromFile.js` | ✅ 사용 중 | resume/portfolio 텍스트 입력 경로 중 하나 |

---

## B. Parsed Layer — JD (parseWithAI, `__PARSED_JD__`)

| 필드명 | source owner | 현재 사용 여부 | 소비 엔진 | 비고 |
|---|---|---|---|---|
| `jobTitle` | parseWithAI | ❌ 미사용 | - | UI 표시 가능성 있음 |
| `mustHave[]` | parseWithAI | ✅ 사용 중 | buildMustRequirementsGapRisk (via jdModel) | jdResumeFit 내 __extractJdRequirements도 중복 추출 |
| `preferred[]` | parseWithAI | ✅ 사용 중 | buildMustRequirementsGapRisk (via jdModel) | jdModel.preferred로 래핑 |
| `coreTasks[]` | parseWithAI | ❌ 미사용 | - | jdModel.responsibilities와 다른 추출 경로 |
| `tools[]` | parseWithAI | ❌ 미사용 (직접) | - | jdModel.tools는 jdResumeFit 내부 __extractJdTools 경로 |
| `constraints[]` | parseWithAI | ❌ 미사용 | - | 후속 후보 |
| `domainKeywords[]` | parseWithAI | ✅ 사용 중 | buildJdKeywordCoverageGapRisk (via jdModel) | jdModel.domainKeywords로 래핑 |

**비고**: parseWithAI 결과(`window.__PARSED_JD__`)는 App.jsx에서 `__stateForAnalyze.__parsedJD`로 주입되나,  
preciseAnalysis 엔진들은 이 필드를 직접 읽지 않는다. 엔진의 실제 JD 입력은 `fit.jdModel.*`이다.

---

## B. Parsed Layer — Resume (parseWithAI, `__PARSED_RESUME__`)

| 필드명 | source owner | 현재 사용 여부 | 소비 엔진 | 비고 |
|---|---|---|---|---|
| `summary` | parseWithAI | ✅ 사용 중 | buildJdKeywordCoverageGapRisk | coverageText에 포함 |
| `timeline[].company` | parseWithAI | ❌ 미사용 (직접) | - | UI 표시용 후보 |
| `timeline[].role` | parseWithAI | ❌ 미사용 (직접) | - | UI 표시용 후보 |
| `timeline[].start/end` | parseWithAI | ❌ 미사용 (직접) | - | employmentPeriods는 jdResumeFit 별도 추출 |
| `timeline[].bullets[]` | parseWithAI | ✅ 사용 중 | buildAchievementEvidenceGapRisk, buildJdKeywordCoverageGapRisk | coverageText + 성과 감지 |
| `skills[]` | parseWithAI | ✅ 사용 중 | buildJdKeywordCoverageGapRisk | coverageText에 포함 |
| `achievements[]` | parseWithAI | ✅ 사용 중 | buildAchievementEvidenceGapRisk | 핵심 입력 |
| `projects[]` | parseWithAI | ❌ 미사용 | - | 추출은 되나 소비 엔진 없음 — 후속 후보 |
| `gaps[]` | parseWithAI | ✅ 사용 중 | buildGapExplanationMissingRisk | describedGapCount 계산에 사용 |
| `transitionNarrative[]` | parseWithAI | ✅ 사용 중 | buildGapExplanationMissingRisk | 설명 신호 보조 |

---

## C. Normalized Layer — fit.jdModel (buildJdResumeFit → `__buildJdModelV1`)

엔진들이 실제로 읽는 SSOT. `fit.jdModel.*`이 엔진 직접 입력 계층이다.

| 필드명 | source owner | 현재 사용 여부 | 소비 엔진 | 비고 |
|---|---|---|---|---|
| `fit.jdModel.mustHave[]` | `__buildJdModelV1` (jdResumeFit.js) | ✅ 사용 중 | buildMustRequirementsGapRisk | `__filterMustHaveFromPreferred` 후 정제 |
| `fit.jdModel.preferred[]` | `__buildJdModelV1` | ✅ 사용 중 | buildMustRequirementsGapRisk | |
| `fit.jdModel.domainKeywords[]` | `__extractJdDomainKeywords()` | ✅ 사용 중 | buildJdKeywordCoverageGapRisk | regex 기반, substring 허용 |
| `fit.jdModel.experienceYears.{min,max,confidence}` | `__extractJdYearsRequired()` | ✅ 사용 중 | buildExperienceLevelGapRisk | `fit.jd.structured.yearsRequired` → jdModel 승격 |
| `fit.jdModel.tools[]` | `__extractJdTools()` | ❌ 미사용 (엔진) | - | jdUnits 조합에만 사용 |
| `fit.jdModel.languages[]` | `__extractJdLanguages()` | ❌ 미사용 (엔진) | - | |
| `fit.jdModel.responsibilities[]` | `__extractJdResponsibilities()` | ❌ 미사용 (엔진) | - | jdUnits에 포함 |
| `fit.jdModel.sections.requiredLines[]` | `jd.mustTextSample` | ✅ 사용 중 | buildMustRequirementsGapRisk | raw 텍스트 라인 |
| `fit.jdModel.sections.preferredLines[]` | `jd.prefTextSample` | ❌ 미사용 (엔진) | - | |

---

## C. Normalized Layer — fit.resume.structured (buildJdResumeFit → `__extractResumeEmploymentPeriods`)

| 필드명 | source owner | 현재 사용 여부 | 소비 엔진 | 비고 |
|---|---|---|---|---|
| `fit.resume.structured.employmentPeriods[]` | `__extractResumeEmploymentPeriods()` | ✅ 사용 중 | buildExperienceLevelGapRisk, buildGapExplanationMissingRisk | `{from:"YYYY-MM", to:"YYYY-MM"\|"present", isCurrent:bool, raw}` |
| `fit.resume.structured.languages[]` | `__extractResumeLanguages()` | ❌ 미사용 (엔진) | - | |
| `fit.resume.structured.tools[]` | `__extractResumeTools()` | ❌ 미사용 (엔진) | - | |
| `fit.resume.structured.toolExperienceYears` | `__extractResumeToolExperienceYears()` | ❌ 미사용 (엔진) | - | |

---

## D. Derived Layer (엔진 내부 계산 결과)

| derived 필드명 | 계산 owner | 현재 소비 엔진 | 확정/후보 | future use |
|---|---|---|---|---|
| `totalCareerMonths` | buildExperienceLevelGapRisk | 내부만 | ✅ 확정 | UI 노출 후보 |
| `totalCareerYears` | buildExperienceLevelGapRisk | 내부만 | ✅ 확정 | UI 노출 후보 |
| `keywordCoverageRatio` | buildJdKeywordCoverageGapRisk | 내부만 | ✅ 확정 | UI 노출 후보 |
| `missingKeywords[]` | buildJdKeywordCoverageGapRisk | 내부 + raw 노출 | ✅ 확정 | ATS 저해 분석 후보 |
| `matchedKeywordCount` | buildJdKeywordCoverageGapRisk | 내부만 | ✅ 확정 | |
| `quantifiedBulletRatio` | buildAchievementEvidenceGapRisk | 내부만 | ✅ 확정 | |
| `maxGapMonths` | buildGapExplanationMissingRisk | 내부만 | ✅ 확정 | |
| `describedGapCount` | buildGapExplanationMissingRisk | 내부만 | ✅ 확정 | |
| `overallBand` | buildCompositeRisk | compositeRisk.summary | ✅ 확정 | |
| `topRisks[]` | buildCompositeRisk | PreciseAnalysisFlow UI | ✅ 확정 | |
| `relatedExperienceYears` | 미구현 | - | 🔲 후보 | 직무 관련 경력만 추출 필요 |
| `interviewAttackPoints[]` | 미구현 | - | 🔲 후보 | 면접 공격 포인트 파생 |
| `atsBlockerKeywords[]` | 미구현 | - | 🔲 후보 | ATS 저해 키워드 구분 |
| `mustRequirementsGapList[]` | 미구현 (현재는 raw.missingMust만) | - | 🔲 후보 | 필수요건 누락 목록 구조화 |

---

## 엔진별 입력 의존성 맵

### 엔진 1: 필수요건 미충족 (`buildMustRequirementsGapRisk`)

| 항목 | 내용 |
|---|---|
| 직접 입력 | `fit.jdModel.mustHave[]`, `fit.jdModel.sections.requiredLines[]` |
| 의존 레이어 | Normalized (jdModel) |
| 현재 입력 리스크 | mustHave 정제 품질이 jdResumeFit regex에 의존 — AI 파싱 결과(parseWithAI.mustHave)와 이원화 |
| fit.resume | `fit.summary.must_hit`, `fit.summary.must_miss` (buildJdResumeFit 내 __matchItems 결과) |
| future notes | mustRequirementsGapList 구조화 시 parsedJD.mustHave[]와 통합 검토 필요 |

### 엔진 2: 연차/레벨 불일치 (`buildExperienceLevelGapRisk`)

| 항목 | 내용 |
|---|---|
| 직접 입력 | `fit.jdModel.experienceYears.{min,max}`, `fit.resume.structured.employmentPeriods[]` |
| 의존 레이어 | Normalized (jdModel + resume.structured) |
| 현재 입력 리스크 | totalCareerYears = 전체 경력 합산 — 관련 경력 구분 불가 |
| future notes | relatedExperienceYears 파생 시 timeline[].role 또는 domain label 추가 필요 |

### 엔진 3: 성과 검증 불가 (`buildAchievementEvidenceGapRisk`)

| 항목 | 내용 |
|---|---|
| 직접 입력 | `parsedResume.achievements[]`, `parsedResume.timeline[].bullets[]` |
| 의존 레이어 | Parsed (parseWithAI 결과) |
| 현재 입력 리스크 | 정량 표현 감지가 넓어 비성과 숫자 포함 가능 (오탐) |
| future notes | accuracy 라운드에서 성과 동사/결과 표현 더 좁힐지 검토 |

### 엔진 4: JD 키워드 반영 부족 (`buildJdKeywordCoverageGapRisk`)

| 항목 | 내용 |
|---|---|
| 직접 입력 | `fit.jdModel.domainKeywords[]`, `parsedResume.skills[]`, `parsedResume.summary`, `parsedResume.timeline[].bullets[]`, `__resumeMerged` |
| 의존 레이어 | Normalized (jdModel) + Parsed (resume) + Raw (resumeMerged) |
| 현재 입력 리스크 | substring 매칭 — "SQL" → "MySQL" 오탐 가능. MVP 범위 허용 수준 |
| future notes | accuracy 라운드에서 token-boundary 매칭 검토 후보 |

### 엔진 5: 공백/이직 설명 부재 (`buildGapExplanationMissingRisk`)

| 항목 | 내용 |
|---|---|
| 직접 입력 | `fit.resume.structured.employmentPeriods[]`, `parsedResume.gaps[]`, `parsedResume.transitionNarrative[]` |
| 의존 레이어 | Normalized (resume.structured) + Parsed (resume) |
| 현재 입력 리스크 | transitionNarrative 품질이 낮으면 설명 신호 과다 인정 가능성 |
| future notes | transitionNarrative 가중치 재검토 후보 |

---

## 현재 자산 vs 후속 후보

### ✅ 확정 자산 (현재 5개 엔진 기준)

| 분류 | 필드/자산 |
|---|---|
| Raw | jdRawText, resumeRawText, portfolioRawText, __resumeMerged |
| Parsed JD | mustHave[], preferred[], domainKeywords[] |
| Parsed Resume | summary, timeline[].bullets[], skills[], achievements[], gaps[], transitionNarrative[] |
| Normalized JD | fit.jdModel.mustHave[], fit.jdModel.domainKeywords[], fit.jdModel.experienceYears, fit.jdModel.sections.requiredLines[] |
| Normalized Resume | fit.resume.structured.employmentPeriods[] |
| Derived | totalCareerYears, keywordCoverageRatio, missingKeywords[], quantifiedBulletRatio, maxGapMonths, describedGapCount |
| Composite | overallBand, topRisks[], supporting.{lowRisks, insufficientData} |

### 📄 문서화만 안 된 자산 (코드에 존재하지만 문서 미기재)

- `fit.jdModel.tools[]` — jdResumeFit에서 추출되나 엔진 미소비
- `fit.jdModel.languages[]` — 동일
- `fit.jdModel.responsibilities[]` — jdUnits 조합에만 사용
- `parsedResume.projects[]` — parseWithAI에서 추출되나 소비 엔진 없음

### 🔲 후속 후보 자산 (아직 미구현)

| 필드명 | 필요 기능 | 의존 전제 |
|---|---|---|
| `relatedExperienceYears` | 관련 직무 경력 계산 | timeline[].role + domain label 필요 |
| `interviewAttackPoints[]` | 면접 공격 포인트 파생 | 엔진 output 구조화 필요 |
| `atsBlockerKeywords[]` | ATS 저해 키워드 구분 | domainKeywords + ATS 블로커 룰 필요 |
| `mustRequirementsGapList[]` | 필수요건 누락 목록 구조화 | 현재 raw.missingMust만 존재 |

---

## 핵심 설계 원칙 (다음 단계용)

1. **엔진은 `fit.jdModel.*` 또는 `parsedResume.*`만 직접 읽는다.** raw text나 fit.jd.structured를 직접 읽는 것은 금지.
2. **jdModel이 JD 엔진 입력 SSOT다.** `fit.jd.structured.*`는 jdModel로 승격된 이후에는 직접 참조하지 않는다.
3. **parsedResume는 Resume 엔진 입력 SSOT다.** `window.__PARSED_RESUME__`를 통해 접근.
4. **파생 필드는 엔진 내 계산 결과이며, `raw.*` 필드로 노출된다.** 직접 외부에서 주입하지 않는다.
5. **후속 후보 자산은 "가까운 다음 기능"을 위한 것이며, 현재 엔진 안정성을 해치지 않는 범위에서 추가한다.**

---

## 문서 이력

| 날짜 | 라운드 | 작성 내용 |
|---|---|---|
| 2026-04-12 | 추출/정규화 SSOT 초안 | 초안 생성 — 현재 5개 엔진 기준 전체 필드 계약 |
