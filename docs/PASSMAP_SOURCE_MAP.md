# PASSMAP Source Map

> 목적: PASSMAP 코드베이스의 기능별 owner 파일, 보조 파일, 주요 contract, 현재 연결 상태, 수정 위험도를 정리한 문서.
> 주의: 이 문서는 빌드용 JS sourcemap이 아니라 기능/파일 owner map이다.
> 작성 기준: 확인된 코드 경로만 기록하고, 미확인 항목은 TODO로 남긴다.
> 최종 업데이트: 2026-04-29

---

## 1. 문서 목적

이 문서는 PASSMAP 코드베이스의 기능별 owner 파일을 지도 형식으로 정리한다.

**이 문서의 역할 범위:**
- 기능별 primary owner 파일 지도를 담당한다.
- 상세 데이터 흐름은 `docs/PASSMAP_DATA_FLOW_MAP.md`에서 관리한다.
- Backend/API/DB 구조는 `docs/PASSMAP_BACKEND_API_DB_MAP.md`에서 관리한다.
- 위험 파일/수정 금지 영역은 `docs/PASSMAP_HIGH_RISK_FILES.md`에서 관리한다.
- 모든 세부 정보를 이 파일에 누적하지 않는다.

**이 문서를 읽는 시점:**
- 기능 owner가 불명확하거나 수정 범위를 정해야 할 때 확인한다.
- 모든 작업에서 필수로 읽는 문서가 아니다. owner 파일이 이미 명확한 경우 생략 가능.
- 세부 데이터 흐름, API/DB 구조, 위험 파일 정보는 각 전용 문서를 참조한다.

표기 기준:
- 코드에서 실제 import/usage가 확인된 경우: **확인됨**
- 파일명상 관련 있어 보이나 실제 소비 여부가 불명확한 경우: **추정**
- 과거 compatibility/legacy로 보이는 파일: 비고에 "legacy/compatibility 가능성"으로만 기록
- 확실하지 않은 내용: **확인 필요**

---

## 2. 기능별 Owner Map

| 기능명 | primary owner 파일 | secondary/helper 파일 | 주요 state/ref/contract | 현재 연결 상태 | 수정 위험도 | 비고 |
|---|---|---|---|---|---|---|
| 직무·산업 분석 | `src/lib/transitionLite/buildTransitionLiteResult.js` (경력자) / `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` (신입) | `src/lib/analysis/buildNewgradAxisPack.js`, `src/lib/adapters/buildJobContext.js`, `src/lib/adapters/buildIndustryContext.js`, `src/data/transitionLite/axisExplanationRegistry.js`, `src/components/report/TransitionLiteResult.jsx` | `transitionLiteResultVm`, `resultEntryMode === "transition-lite"` | 확인됨 | high | 경력자/신입 producer 분리, 렌더러 공용. 경력자 axis pack 상세 owner 추가 확인 필요 |
| 서류탈락 원인 분석 | `src/components/input/PreciseAnalysisFlow.jsx`, `src/lib/analyzer.js` | `src/lib/decision/index.js`, `src/lib/preciseAnalysis/buildCompositeRisk.js`, `src/lib/preciseAnalysis/*.js` (risk builder 5종) | `analysis.reportPack.decisionPack.riskResults`, `analysis.decisionPack.riskResults`, `activeAnalysis` | 확인됨 | high | precise risk builder들의 실제 import 진입점 확인 필요. riskResults 두 경로 모두 존재 |
| 업무 기록/캘린더 | `src/components/mvp/PmMvpView.jsx` | `src/lib/workRecordRepository.js`, `src/components/home/RecordCalendarCard.jsx`, `src/components/home/HomeDashboard.jsx`, `src/components/home/homeDashboardCalendarUtils.js` | `work_records`, `passmap:work-records-changed`, `calendarRecords`, `PASSMAP_DEMO_RANGE_RECORDS` | 확인됨 | high | adapter shape가 PmMvpView/HomeDashboard에 분리됨. shape 변경 시 두 파일 동시 점검 필요 |
| 이력서 보기/업데이트 후보 | `src/lib/resume/recordToResumeCandidate.js` | `src/components/mvp/PmMvpView.jsx`, `src/lib/workRecordRepository.js`, `src/lib/resume/buildResumeDraftViewModel.js`, `src/App.jsx` | `pmLastInput`, `resumeSentence`, `sourceRecordId`, `ResumeUpdateCandidate`, `candidateSaveStatus`, `editedResumeSentence` | 완전 연결됨 (RES-CAND-1, 2026-04-29) | medium | PmMvpView.jsx가 후보 생성·표시·저장·편집 UI 전부 담당. `isDraftSentence` guard로 low-confidence 직접 저장 차단 |
| 로그인/Auth | `src/lib/auth.js` | `src/lib/supabaseClient.js`, `src/App.jsx`, `src/lib/passmapAuthPolicy.js` | `auth`, `authSyncReady`, `openLoginGate`, `pendingAction`, Google OAuth PKCE flow | 확인됨 | high | `auth.js.bak_before_supabase_oauth` 존재 (legacy/compatibility 가능성). Auth 상태 App.jsx 집중 |
| Supabase 저장/조회 | `src/lib/supabaseClient.js` | `src/lib/workRecordRepository.js`, `src/lib/auth.js` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `work_records` table, PKCE session | 확인됨 | medium | 환경변수 미설정 시 graceful degradation (demo 모드). supabase 인스턴스 싱글톤 export |
| Notion 연동 | `src/components/home/HomeDashboard.jsx` (UI/상태 owner) | `worker-ai/orange-shadow-95c1/src/index.js` (OAuth/API owner), `src/components/home/homeDashboardCalendarUtils.js` (normalizeNotionRecord) | `notionPanelOpen`, `notionStatus`, `notionSources`, `notionPreviewResult`, `VITE_AI_PROXY_URL` | 확인됨 (HomeDashboard → Worker API) | medium | Notion 엔드포인트는 Worker 전용. Vercel fallback 없음. Worker URL 미설정 시 명시적 오류 |
| Calendar 다운로드/ICS | `src/lib/calendarExport.js` | `src/components/home/HomeDashboard.jsx` (downloadPassmapCalendarIcs 소비) | `reflectedSentence`, `strengthTags`, ICS blob download | 확인됨 | low | HomeDashboard에서 직접 import/호출. ICS 생성 로직은 calendarExport.js 단독 owner |
| 상담 신청/컨설턴트 연계 | `src/pages/ConsultingLeadPage.jsx` | `src/main.jsx` (URL routing), `src/App.jsx` (링크), `src/components/report/TransitionLiteResult.jsx` (링크) | `?page=consulting-lead&type=mini\|onepoint\|care`, Kakao 채널 URL | 확인됨 | low | 별도 페이지 (URL 파라미터 기반 라우팅). 상담은 외부 Kakao 채널로 연결됨. 자체 DB 없음 |
| B2B 업무관리/포트폴리오 방향 | 확인 필요 | `src/lib/passmapAuthPolicy.js` (auth 정책), `src/data/industry/registry/professional_b2b_services/` (데이터) | 확인 필요 | 확인 필요 (전용 UI 컴포넌트 미식별) | low | 독립 B2B 전용 뷰 파일 미확인. 기존 분석 기능에 통합된 것으로 추정. 확인 필요 |
| 공통 UI/라우팅/상태 관리 | `src/App.jsx`, `src/main.jsx` | `src/components/input/InputFlow.jsx`, `src/components/input/ModeSelector.jsx`, `src/components/ui/*.jsx` | `activeTab`, `step`, `resultEntryMode`, URL `?page=` 파라미터 | 확인됨 | high | React Router 없음. URL query param 기반 단순 라우팅. App.jsx에 전역 상태 집중 |
| PDF/print/export | `src/lib/pdf/downloadTransitionLitePdf.js`, `src/components/pdf/TransitionLitePdfDocument.jsx` | `src/lib/pdf/buildTransitionLitePdfModel.js`, `src/components/report/TransitionLiteResult.jsx` (window.print), `src/components/input/PreciseAnalysisFlow.jsx` (window.print) | `@react-pdf/renderer`, `window.print()`, `downloadPassmapCalendarIcs` | 확인됨 | low | PDF는 @react-pdf/renderer. print는 window.print() 직접 호출. ICS는 calendarExport.js 경유 |

---

## 0. 사용법

- 기능을 수정하기 전에 먼저 이 문서에서 owner 파일을 확인한다.
- owner 파일을 찾은 뒤 Select-String으로 exact anchor를 확인한다.
- 런타임 코드 수정 전에는 반드시 수정 파일 수와 영향 범위를 제한한다.
- App.jsx 대량 수정은 피하고, 가능한 하위 owner 파일에서 처리한다.

---

## 1. 핵심 진입점 지도

| 영역 | 1차 owner 파일 | 보조 파일 | 확인된 역할 | 위험도 | 비고 |
|---|---|---|---|---|---|
| 앱 진입/탭/결과 화면 | `src/App.jsx` | `src/components/input/PreciseAnalysisFlow.jsx`, `src/components/report/TransitionLiteResult.jsx` | `activeTab`, `resultEntryMode`, `transitionLiteResultVm`, `activeAnalysis` 기준으로 결과 화면 진입을 결정 | 높음 | 상태가 많고 진입 경로가 복수 |
| 직무·산업 분석 리포트 | `src/lib/transitionLite/buildTransitionLiteResult.js` | `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`, `src/lib/analysis/buildNewgradAxisPack.js`, `src/components/report/TransitionLiteResult.jsx` | 경력자/신입용 Transition Lite 결과 VM 생성과 렌더 | 높음 | 생성기와 렌더러가 분리됨 |
| 서류탈락 원인 분석 | `src/components/input/PreciseAnalysisFlow.jsx` | `src/lib/analyzer.js`, `src/lib/decision/index.js`, `src/components/SimulatorLayout.jsx` | JD/Resume 입력, 결과 카드 렌더, `analysis.reportPack.decisionPack.riskResults` 소비 | 높음 | 입력/엔진/렌더가 3단 분리 |
| 업무관리/캘린더 | `src/components/mvp/PmMvpView.jsx` | `src/components/home/HomeDashboard.jsx`, `src/lib/workRecordRepository.js`, `src/components/home/homeDashboardCalendarUtils.js` | 기록 입력, Supabase CRUD, 대시보드/캘린더 반영 | 높음 | 이벤트 기반 refetch 존재 |
| 기록→이력서 연결 | `src/lib/resume/recordToResumeCandidate.js` | `src/components/mvp/PmMvpView.jsx`, `docs/record-to-resume-contract.md` | 저장 기록을 ResumeUpdateCandidate로 복원/변환 | 중간 | 현재 App `pmLastInput` in-session bridge와 병행 |
| 데이터/온톨로지 | `src/data/job/jobOntology.index.js` | `src/data/industry/industryRegistry.index.js`, `src/data/transitionLite/*`, `src/lib/transitionLite/newgradCertRegistry.js` | 직무/산업/축 설명/자격증/강점 레지스트리 제공 | 중간 | scoring용과 display용이 섞여 있음 |

---

## 2. 앱 진입 / 라우팅 / 결과 화면

### 확인된 owner 파일
- `src/App.jsx`
- `src/components/input/PreciseAnalysisFlow.jsx`
- `src/components/report/TransitionLiteResult.jsx`
- `src/components/home/HomeDashboard.jsx`
- `src/components/mvp/PmMvpView.jsx`

### 핵심 상태/분기
- `App.jsx`가 `activeTab`, `step`, `resultEntryMode`, `transitionLiteResultVm`, `analysis`, `auth`, `pmLastInput`를 직접 들고 있습니다.
- `activeAnalysis`는 `sampleMode ? sampleAnalysis : analysis`로 계산됩니다. 즉 precise-analysis 결과 owner는 기본적으로 `analysis`/`activeAnalysis`입니다.
- `resultEntryMode === "transition-lite"` 이고 `transitionLiteResultVm`이 있으면 `TransitionLiteResult`를 렌더합니다.
- `resultEntryMode === "precise-analysis"` 이면 `PreciseAnalysisFlow mode="result"`를 렌더합니다.
- 로그인 분기는 `auth`, `authSyncReady`, `openLoginGate`, `pendingAction` 기준으로 `App.jsx`에서 처리합니다.
- `HomeDashboard`와 `PmMvpView`는 `App.jsx` 내부 JOB 탭 사이드바 영역에서 전환됩니다.
- `pmLastInput`은 `PmMvpView mode="update"`의 `onRecordSubmit={setPmLastInput}` 와 `PmMvpView mode="preview"`의 `externalLastInput={pmLastInput}`로 연결됩니다. 현재 기록→이력서 연결의 in-session bridge owner입니다.

### 수정 시 주의
- `App.jsx`는 상태 owner이지만 하위 owner가 명확하면 하위 파일부터 수정하는 편이 안전합니다.
- 결과 화면 버그라도 `resultEntryMode`와 실제 데이터 존재 여부를 같이 확인해야 합니다.
- 로그인/결과/사이드바 상태가 한 파일에 섞여 있으므로 unrelated 수정과 혼합하지 않는 것이 좋습니다.

### TODO
- share mode 복원 경로 전체 owner는 추가 조사 필요.
- `ReportSection__LEGACY` 주변 정리 여부는 미확인.

---

## 3. 직무·산업 분석 리포트

### 확인된 owner 파일
- `src/lib/transitionLite/buildTransitionLiteResult.js`
- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- `src/lib/analysis/buildNewgradAxisPack.js`
- `src/components/report/TransitionLiteResult.jsx`
- `src/lib/adapters/buildJobContext.js`
- `src/lib/adapters/buildIndustryContext.js`
- `src/data/transitionLite/axisExplanationRegistry.js`

### Owner — Special Transition Diagnostic Layer (implemented read-only diagnostic layer)

| 항목 | 내용 |
|---|---|
| 구현 파일 | `src/lib/transitionLite/specialTransitionDiagnostics.js` |
| 성격 | read-only pure rule layer. score/gate 변경 없음 |
| 역할 | source→target 특수 전환 조합에서 generic rule이 놓치는 비대칭 리스크를 user-facing diagnostic card로 제공 |
| 호출 위치 | `buildTransitionLiteResult.js` 내 `buildTransitionLiteVM` 호출 직후 (3134번 라인 근처) |
| 렌더 연결 | 기존 `topRisks` 배열 뒤에 diagnostic card 최대 1개 append. RiskList 재사용. JSX 수정 없음 |
| 적용 범위 | 경력 전환-lite 전용 (신입은 source item 없어 pair rule 적용 불가) |
| 구현된 rule | B2C CS→B2B CSM / 제조 QA→IT QA/SQA / 일반 제조 QA→의료기기·제약 QA/RA |
| 금지선 | score/gate·classifyTransition·pickTransitionLiteRiskKeys·buildAxisConnectivityPack 수정 금지 |
| 상세 설계 | `docs/PASSMAP_SPECIAL_TRANSITION_DIAGNOSTICS.md` 참조 |

### 데이터 생성 흐름
1. `App.jsx`에서 submit 시 경력자면 `buildTransitionLiteResult`, 신입이면 `buildNewgradTransitionLiteResult`를 호출합니다.
2. 경력자 생성기는 `buildJobContext`, `buildIndustryContext`, `pickTransitionLiteRiskKeys`, `buildTransitionLiteVM`, `buildAxisConnectivityPack`으로 결과 VM을 만듭니다.
3. 신입 생성기는 cert/self-report/experience pack을 만든 뒤 `buildNewgradAxisPack`과 `buildNewgradGoalComparisonTable`을 조합해 결과 VM을 만듭니다.

### 렌더 흐름
1. `App.jsx` RESULT 탭에서 `TransitionLiteResult viewModel={...transitionLiteResultVm}`를 렌더합니다.
2. `TransitionLiteResult.jsx`가 `topRisks`, `comparisonTable`, `newgradGoalComparisonTable`, `strengthEvidenceRead`, `axisPack` 등을 조건부로 렌더합니다.
3. 신입 세부 판독은 `NewgradDetailedReadSection`, 신입 goal 비교는 `NewgradGoalComparisonSection`, 경력자 리스크 비교는 `RiskComparisonTable` 경로로 나뉩니다.

### 주요 하위 영역별 owner
| 하위 영역 | owner 파일 | 확인된 anchor/키워드 | 비고 |
|---|---|---|---|
| 신입 5축 | `src/lib/analysis/buildNewgradAxisPack.js` | `jobStructure`, `industryContext`, `responsibilityScope`, `customerType`, `roleCharacter` | 점수/설명/comparison block을 모두 생산 |
| 세부 판독 | `src/components/report/TransitionLiteResult.jsx` | `NewgradDetailedReadSection`, `resolveNewgradDetailedReadHelp`, `newgrad-detailed-read` | 렌더 전용 owner |
| 직무 구조 비교 | `src/lib/analysis/buildNewgradAxisPack.js`, `src/lib/transitionLite/buildTransitionLiteResult.js` | `comparisonBlock`, `buildJobExpectationComparisonTable` | 신입/경력자 경로가 다름 |
| 산업 구조 비교 | `src/lib/analysis/buildNewgradAxisPack.js`, `src/lib/transitionLite/buildTransitionLiteResult.js` | `industryContext`, `buildIndustryContextComparisonTable` | `buildIndustryContext` 기반 |
| 강점/재능 | `src/lib/analysis/buildNewgradAxisPack.js`, `src/components/report/TransitionLiteResult.jsx` | `strengthEvidenceRead`, `strengths`, `matchedStrengthLabels`, `matchedWorkStyleLabels` | 신입은 direct match 렌더 섹션이 별도 |
| 자격증 반영 | `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`, `src/lib/transitionLite/newgradCertRegistry.js` | `buildCertEvidencePack`, `buildPhase1CertRoleRelevancePack`, `allowedAxes` | 현재 신입 경로 중심 |

### 수정 시 주의
- 경력자와 신입 리포트는 같은 `TransitionLiteResult.jsx`를 쓰지만 producer shape가 다릅니다.
- 세부 판독 문구는 `axisExplanationRegistry.js` producer 계약을 따르므로 UI에서 score 해석을 새로 만들면 안 됩니다.
- 신입 축 해석은 `buildNewgradAxisPack.js`가 점수, explanation, comparisonBlock을 함께 생산하므로 한 축 수정 시 세 군데를 같이 봐야 합니다.

### TODO
- `buildAxisConnectivityPack`의 정확한 표시 소비 위치는 이번 조사에서 상세 확인하지 못했습니다.
- 경력자 axis pack 내부 상세 owner는 추가 조사 필요.

---

## 4. 서류탈락 원인 분석기

### 확인된 owner 파일
- 파일 경로: `src/components/input/PreciseAnalysisFlow.jsx`
- 역할: JD/Resume 입력, 분석 실행 버튼, risk 카드형 결과 렌더 consumer
- 확인 anchor/검색어: `handleAnalyzeClick`, `buildReportSectionData`, `ReportAnalysisCard`, `ResultRiskCard`, `analysis.reportPack.decisionPack.riskResults`, `analysis.decisionPack.riskResults`
- 파일 경로: `src/lib/analyzer.js`
- 역할: precise-analysis 분석 오케스트레이션 owner. `buildJdResumeFit`, `computeRoleDistance`, `buildDecisionPack`, `buildSimulationViewModel`, `reportPack`, `decisionPack`를 연결
- 확인 anchor/검색어: `buildJdResumeFit`, `computeRoleDistance`, `objective.roleDistance`, `buildDecisionPack`, `decisionPack`, `reportPack`, `simulationViewModel`
- 파일 경로: `src/lib/decision/index.js`
- 역할: generic decision/risk pack builder owner. `riskResults` 정규화, gate 주입, roleDistance penalty 반영, decision score/pressure 계산
- 확인 anchor/검색어: `buildDecisionPack`, `riskResults`, `roleDistance`, `getRoleDistance`
- 파일 경로: `src/lib/preciseAnalysis/createRiskResult.js`
- 역할: precise-analysis 전용 risk builder 공통 결과 계약 owner
- 확인 anchor/검색어: `createRiskResult`
- 파일 경로: `src/lib/preciseAnalysis/buildCompositeRisk.js`
- 역할: precise-analysis 전용 risk 5종을 `summary`, `topRisks`, `supporting`, `meta`, `raw`로 합성하는 aggregator owner
- 확인 anchor/검색어: `buildCompositeRisk`, `must_requirements_gap`, `experience_level_gap`, `achievement_evidence_gap`, `gap_explanation_missing`, `jd_keyword_coverage_gap`
- 파일 경로: `src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js`
- 역할: JD 필수요건 미충족 risk owner
- 확인 anchor/검색어: `buildMustRequirementsGapRisk`, `must_requirements_gap`, `mustPolicyMode`
- 파일 경로: `src/lib/preciseAnalysis/buildExperienceLevelGapRisk.js`
- 역할: 연차/경험수준 미스매치 risk owner
- 확인 anchor/검색어: `buildExperienceLevelGapRisk`, `experience_level_gap`, `range-check`
- 파일 경로: `src/lib/preciseAnalysis/buildAchievementEvidenceGapRisk.js`
- 역할: 성과 정량 근거 부족 risk owner
- 확인 anchor/검색어: `buildAchievementEvidenceGapRisk`, `achievement_evidence_gap`, `achievementPolicyMode`
- 파일 경로: `src/lib/preciseAnalysis/buildGapExplanationMissingRisk.js`
- 역할: 공백/이직 설명 부재 risk owner
- 확인 anchor/검색어: `buildGapExplanationMissingRisk`, `gap_explanation_missing`, `gapPolicyMode`
- 파일 경로: `src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js`
- 역할: JD 핵심 키워드 반영 부족 risk owner
- 확인 anchor/검색어: `buildJdKeywordCoverageGapRisk`, `jd_keyword_coverage_gap`, `keywordPolicyMode`
- 파일 경로: `src/components/SimulatorLayout.jsx`
- 역할: 기존 PASSMAP 본문 리포트 consumer
- 확인 anchor/검색어: `simulationViewModel`, `reportPack`

### 데이터/판정 흐름
1. `PreciseAnalysisFlow.jsx`가 `state.jd`, `state.resume`를 모으고 `handleAnalyzeClick`에서 분석 실행을 시작합니다.
2. `analyzer.js`가 `buildJdResumeFit`과 `computeRoleDistance`를 계산하고, 그 결과를 `buildDecisionPack`에 전달해 `decisionPack`과 `reportPack`을 구성합니다.
3. `PreciseAnalysisFlow.jsx`는 `analysis.reportPack.decisionPack.riskResults`와 `analysis.decisionPack.riskResults`를 둘 다 읽어 카드형 결과를 그립니다.

### 렌더/소비 흐름
1. 입력/실행 UI owner는 `PreciseAnalysisFlow.jsx`입니다.
2. risk/decision producer owner는 `analyzer.js`와 `decision/index.js`입니다.
3. 결과 consumer는 두 갈래입니다. 카드형 요약은 `PreciseAnalysisFlow.jsx`, 기존 본문형 report consumer는 `SimulatorLayout.jsx`입니다.

### 주요 하위 영역별 owner
| 하위 영역 | owner 파일 | 확인된 anchor/키워드 | 비고 |
|---|---|---|---|
| JD/Resume 입력 | `src/components/input/PreciseAnalysisFlow.jsx` | `state.jd`, `state.resume`, `handleAnalyzeClick` | 입력/검증 UI owner |
| role distance | `src/lib/analyzer.js`, `src/lib/decision/index.js` | `computeRoleDistance`, `objective.roleDistance`, `roleDistancePenalty` | 계산은 analyzer, score 반영은 decision |
| rejection reason | `src/lib/decision/index.js` | `riskResults`, `evalRiskProfiles`, `buildDecisionPack` | generic risk pack owner |
| 결과 렌더 | `src/components/input/PreciseAnalysisFlow.jsx` | `buildReportSectionData`, `ResultRiskCard`, `ReportAnalysisCard` | 카드형 요약 렌더 |
| precise risk contract | `src/lib/preciseAnalysis/createRiskResult.js` | `createRiskResult` | 전용 builder 공통 shape |
| must requirements gap | `src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js` | `must_requirements_gap` | JD 필수요건 불일치 owner |
| experience level gap | `src/lib/preciseAnalysis/buildExperienceLevelGapRisk.js` | `experience_level_gap` | 연차/경험수준 risk owner |
| achievement evidence gap | `src/lib/preciseAnalysis/buildAchievementEvidenceGapRisk.js` | `achievement_evidence_gap` | 성과 정량 근거 owner |
| gap explanation missing | `src/lib/preciseAnalysis/buildGapExplanationMissingRisk.js` | `gap_explanation_missing` | 공백/이직 설명 owner |
| JD keyword coverage gap | `src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js` | `jd_keyword_coverage_gap` | JD 키워드 반영 부족 owner |
| composite/top risk 합성 | `src/lib/preciseAnalysis/buildCompositeRisk.js` | `buildCompositeRisk`, `topRisks`, `supporting` | 전용 risk 5종 aggregator |
| 로그인 필요 분기 | `src/App.jsx` | `reject_analysis_run`, `openLoginGate`, `auth.loggedIn` | 실행 gate는 App owner |

### precise builder import 확인 현황 (2026-04-29 조사 완료)

| 파일 | import 위치 | 호출 위치 | 결과 저장 위치 |
|---|---|---|---|
| `buildMustRequirementsGapRisk.js` | `src/App.jsx` (line 66) | `App.jsx` runAnalysis() debug 블록 | `window.__PRECISE_ANALYSIS_DEBUG__.mustRequirementsGap` |
| `buildExperienceLevelGapRisk.js` | `src/App.jsx` (line 67) | `App.jsx` runAnalysis() debug 블록 | `window.__PRECISE_ANALYSIS_DEBUG__.experienceLevelGap` |
| `buildAchievementEvidenceGapRisk.js` | `src/App.jsx` (line 68) | `App.jsx` runAnalysis() debug 블록 | `window.__PRECISE_ANALYSIS_DEBUG__.achievementEvidenceGap` |
| `buildJdKeywordCoverageGapRisk.js` | `src/App.jsx` (line 69) | `App.jsx` runAnalysis() debug 블록 | `window.__PRECISE_ANALYSIS_DEBUG__.jdKeywordCoverageGap` |
| `buildGapExplanationMissingRisk.js` | `src/App.jsx` (line 70) | `App.jsx` runAnalysis() debug 블록 | `window.__PRECISE_ANALYSIS_DEBUG__.gapExplanationMissing` |
| `buildCompositeRisk.js` | `src/App.jsx` (line 71) | `App.jsx` runAnalysis() debug 블록 | `window.__PRECISE_ANALYSIS_DEBUG__.compositeRisk` |
| `createRiskResult.js` | 개별 builder 파일 내부 | builder 함수 내부 | builder 반환값에 포함 |

- **bridge 패턴 (현재 임시 상태):** `App.jsx`의 `runAnalysis()` 내부 debug 블록이 6개 builder를 호출하고 결과를 `window.__PRECISE_ANALYSIS_DEBUG__`에 저장합니다. 이 블록은 주석으로 "임시(PRECISE-ANALYSIS-DEBUG)" 및 "삭제 대상: 최종 UI 연결 후 제거"로 표기되어 있습니다.
- **consumer 연결:** `PreciseAnalysisFlow.jsx`의 `compositeData` useMemo가 `window.__PRECISE_ANALYSIS_DEBUG__.compositeRisk`를 읽어 상단 composite 카드를 렌더합니다. 하단 섹션 카드는 파이프라인 A(`analysis.reportPack.decisionPack.riskResults`, `analysis.decisionPack.riskResults`)에서 읽습니다.

### 수정 시 주의
- `PreciseAnalysisFlow.jsx`는 producer보다 consumer 성격이 강합니다. risk 규칙 변경은 먼저 `analyzer.js`와 `decision/index.js`에서 확인해야 합니다.
- `analysis.reportPack.decisionPack.riskResults`와 `analysis.decisionPack.riskResults` 두 경로를 모두 읽는 consumer가 있으므로 한쪽만 바꾸면 깨질 수 있습니다.
- precise builder 6종은 `App.jsx`에서만 import됩니다. `analyzer.js`나 `decision/index.js`에서는 import되지 않습니다.
- `window.__PRECISE_ANALYSIS_DEBUG__` 전역 bridge는 임시 구조입니다. 최종 UI 연결 패치 후 삭제 예정이므로, 이 bridge에 의존하는 로직을 추가하지 마세요.

### TODO
- share payload 복원과 result share 진입 경로는 이번 라운드 범위에서 제외했습니다.
- precise builder → React state 직접 연결 (window bridge 제거) 작업은 별도 라운드에서 진행 예정입니다.

---

## 5. 업무관리 / 캘린더 MVP

### 확인된 owner 파일
- 파일 경로: `src/components/mvp/PmMvpView.jsx`
- 역할: 기록 입력, 저장/삭제, DB row adapter, `RecordCalendarCard` 실제 UI 소비 owner
- 확인 anchor/검색어: `RecordCalendarCard`, `adaptWorkRecordRow`, `fetchWorkRecords`, `handleDeleteWorkRecord`, `PASSMAP_DEMO_RANGE_RECORDS`, `passmap:work-records-changed`
- 파일 경로: `src/components/home/RecordCalendarCard.jsx`
- 역할: `records` prop만 받아 월/주/리스트 캘린더와 날짜 상세를 파생 렌더하는 presentational calendar owner
- 확인 anchor/검색어: `export default function RecordCalendarCard`, `buildCalendarEntriesByDate`, `selectedEntry`, `passmapRecords`, `calendarSummary`, `WEEKLY_DEMO_EXAMPLES`
- 파일 경로: `src/components/home/HomeDashboard.jsx`
- 역할: 대시보드용 별도 캘린더 consumer. `RecordCalendarCard`는 쓰지 않고 같은 util 계층과 유사한 record shape를 자체 소비
- 확인 anchor/검색어: `adaptWorkRecordRowForHomeDashboard`, `entriesByDate`, `deriveCalendarSummary`, `PASSMAP_DEMO_RANGE_RECORDS`, `sortedAllRecords`
- 파일 경로: `src/components/home/homeDashboardCalendarUtils.js`
- 역할: `entriesByDate`, month view, summary 파생 공통 util owner
- 확인 anchor/검색어: `buildCalendarEntriesByDate`, `buildCalendarMonthViewModel`, `deriveCalendarSummary`, `deriveMonthlyAssetSummary`
- 파일 경로: `src/lib/workRecordRepository.js`
- 역할: `work_records` CRUD repository owner
- 확인 anchor/검색어: `createWorkRecord`, `listWorkRecords`, `deleteWorkRecord`, `updateWorkRecord`
- 파일 경로: `src/lib/calendarExport.js`
- 역할: calendar record에서 `reflectedSentence`와 tag를 꺼내 ICS export를 만드는 export owner
- 확인 anchor/검색어: `buildPassmapDailyCalendarEvents`, `reflectedSentence`, `strengthTags`

### 저장/조회/삭제 흐름
1. `PmMvpView.jsx`가 submit 후 `createWorkRecord`로 `work_records`에 저장하고, `fetchWorkRecords()`로 재조회합니다.
2. 저장/삭제 직후 `window.dispatchEvent(new CustomEvent("passmap:work-records-changed"))`를 발행합니다.
3. `HomeDashboard.jsx`는 auth 상태와 `passmap:work-records-changed` 이벤트를 구독해 `listWorkRecords`를 다시 호출합니다.

### 화면 반영 흐름
1. `PmMvpView.jsx`는 `adaptWorkRecordRow`로 Supabase row를 `RecordCalendarCard`가 읽는 calendar record shape로 변환합니다.
2. `RecordCalendarCard.jsx`는 `records` prop만 받아 `entriesByDate`, `selectedEntry`, `passmapRecords`, `calendarSummary`를 내부에서 파생합니다.
3. `HomeDashboard.jsx`는 `RecordCalendarCard`를 재사용하지 않고, `adaptWorkRecordRowForHomeDashboard`와 `homeDashboardCalendarUtils.js`를 이용해 대시보드용 월/주/리스트 UI를 따로 만듭니다.

### 주요 하위 영역별 owner
| 하위 영역 | owner 파일 | 확인된 anchor/키워드 | 비고 |
|---|---|---|---|
| 기록 생성 | `src/components/mvp/PmMvpView.jsx` | `handleRecordSubmit`, `buildCalendarRecordFromPmInput` | preview 입력과 calendar용 임시 record 생성 |
| Supabase 저장 | `src/components/mvp/PmMvpView.jsx`, `src/lib/workRecordRepository.js` | `createWorkRecord`, `raw_payload`, `user_id` | 저장 계약 owner |
| 기록 삭제 | `src/components/mvp/PmMvpView.jsx`, `src/lib/workRecordRepository.js` | `handleDeleteWorkRecord`, `deleteWorkRecord` | 삭제 후 refetch/event 발행 |
| RecordCalendarCard 소비 | `src/components/mvp/PmMvpView.jsx` | `records={calendarRecords}` | 실제 UI 진입 owner |
| RecordCalendarCard 데이터 shape | `src/components/home/RecordCalendarCard.jsx` | `records`, `selectedEntry`, `passmapRecords`, `calendarSummary` | 상위에서 fetch한 record를 받아 파생 렌더만 수행 |
| 우측 캘린더 요약 | `src/components/home/RecordCalendarCard.jsx`, `src/components/home/homeDashboardCalendarUtils.js` | `buildCalendarEntriesByDate`, `deriveCalendarSummary` | 카드 내부 파생 계산 |
| HomeDashboard 캘린더 | `src/components/home/HomeDashboard.jsx` | `entriesByDate`, `sortedAllRecords`, `deriveMonthlyAssetSummary` | `RecordCalendarCard` 비사용 |
| demo/example records | `src/components/home/RecordCalendarCard.jsx`, `src/components/mvp/PmMvpView.jsx`, `src/components/home/HomeDashboard.jsx` | `WEEKLY_DEMO_EXAMPLES`, `PASSMAP_DEMO_RANGE_RECORDS`, `homeDashboardMock.records` | weekly demo는 카드 내부, range/demo merge는 상위 owner |
| refetch 이벤트 | `src/components/mvp/PmMvpView.jsx`, `src/components/home/HomeDashboard.jsx` | `PASSMAP_WORK_RECORDS_CHANGED_EVENT`, `window.dispatchEvent`, `window.addEventListener` | 저장 후 반영 핵심 경로 |

### RecordCalendarCard shape 메모
- 확인된 소비 필드: `id`, `source`, `title`, `summary`, `date`, `startDate`, `endDate`, `projectPeriod`, `reflectedSentence`, `strengthTags`, `workTags`, `categoryTags`, `recordType`
- `RecordCalendarCard.jsx`는 `work_records`를 직접 조회하지 않습니다. 상위에서 가공된 `records`만 받습니다.
- `selectedEntry?.records`에서 `source === "passmap" || source === "supabase"`인 항목만 `passmapRecords`로 다시 필터링합니다.
- `canDeleteRecords`, `onDeleteRecord`가 주어져도 `record.id`와 `record.source === "supabase"`가 같이 있어야 삭제 버튼이 열립니다.

### 수정 시 주의
- `RecordCalendarCard.jsx`와 `HomeDashboard.jsx`는 완전한 단일 owner가 아니라, 공통 util은 공유하지만 adapter와 렌더는 분리되어 있습니다.
- `PmMvpView.jsx`의 `adaptWorkRecordRow`와 `HomeDashboard.jsx`의 `adaptWorkRecordRowForHomeDashboard`가 중복 adapter 역할을 하므로 shape 변경 시 두 군데를 같이 봐야 합니다.
- mock/demo 데이터 합류 지점이 화면마다 다릅니다. `PmMvpView.jsx`는 `[recentCalendarRecord, ...PASSMAP_DEMO_RANGE_RECORDS, ...homeDashboardMock.records]`, `HomeDashboard.jsx`는 login/mock 분기와 `sortedAllRecords`를 따로 가집니다.

### TODO
- `RecordCalendarCard.jsx`와 `HomeDashboard.jsx` 사이의 adapter shape를 단일 공통 계약으로 완전히 통합했는지는 확인되지 않았습니다.
- `updateWorkRecord`의 실제 UI 호출 owner는 이번 라운드에서도 미확인입니다.

---

## 6. 기록 → 이력서 연결

### 확인된 owner 파일
- 파일 경로: `src/lib/resume/recordToResumeCandidate.js`
- 역할: 저장된 업무 기록 1개를 `ResumeUpdateCandidate`로 바꾸는 순수 함수 owner. 파일 주석에 `UI 연결 없음`이 명시됨
- 확인 anchor/검색어: `normalizeWorkRecordDraftFromStoredRecord`, `buildResumeUpdateCandidateFromRecord`, `sourceRecordId`, `resumeSentence`, `confidenceLevel`, `generationMethod`
- 파일 경로: `src/components/mvp/PmMvpView.jsx`
- 역할: 현재 BEFORE/AFTER preview와 기록 입력의 in-session bridge owner
- 확인 anchor/검색어: `lastInput`, `onRecordSubmit`, `buildDemoResult`, `sourcePreview`, `result.resumeLine`
- 파일 경로: `src/App.jsx`
- 역할: `pmLastInput`를 통한 상위 session bridge owner
- 확인 anchor/검색어: `pmLastInput`, `setPmLastInput`, `onRecordSubmit`
- 파일 경로: `docs/record-to-resume-contract.md`
- 역할: `ResumeUpdateCandidate` 계약 문서 owner
- 확인 anchor/검색어: `ResumeUpdateCandidate`
- 파일 경로: `src/lib/calendarExport.js`
- 역할: calendar/export 계층에서 `reflectedSentence`를 별도로 소비하는 현재 확인된 유일한 consumer
- 확인 anchor/검색어: `reflectedSentence`

### 현재 연결 상태
- `recordToResumeCandidate.js`의 실제 import 소비 파일은 이번 라운드 `src/**` 검색에서 확인되지 않았습니다.
- 따라서 현재 UI 기준 owner 상태는 `미연결`입니다.
- 현재 사용자에게 보이는 BEFORE/AFTER 흐름은 `PmMvpView.jsx`와 `App.jsx pmLastInput` 기반의 in-session bridge입니다.
- Supabase 저장 기록 복구용 deterministic candidate builder는 라이브러리로 준비되어 있으나, 최종 UI 연결 owner는 아직 없습니다.

### 데이터 흐름
1. `PmMvpView.jsx`가 기록 입력을 `lastInput`에 유지하고 `onRecordSubmit(normalizedInput)`로 `App.jsx`의 `pmLastInput`를 갱신합니다.
2. 현재 BEFORE/AFTER preview는 `buildDemoResult`, `sourcePreview`, `result.resumeLine` 경로를 통해 그려집니다.
3. 저장 기록 복구 경로가 필요할 경우 `recordToResumeCandidate.js`가 `normalizeWorkRecordDraftFromStoredRecord(record)`로 draft를 복원하고 `buildResumeUpdateCandidateFromRecord(record)`로 deterministic candidate를 만들도록 준비돼 있습니다.

### 렌더/소비 흐름
1. 현재 visible resume preview consumer는 `PmMvpView.jsx`입니다.
2. `recordToResumeCandidate.js`는 아직 UI import consumer가 없어 직접 렌더로 이어지지 않습니다.
3. `calendarExport.js`는 preview가 아니라 export용으로 `reflectedSentence`만 소비합니다.

### 남은 본작업
- Supabase 저장 기록 복구: `recordToResumeCandidate.js`가 준비돼 있으나 실제 UI 연결 owner 필요
- resume update candidate 계약: `docs/record-to-resume-contract.md` 유지
- reflectedSentence 매핑: preview/UI/export 간 우선순위 통일 필요 여부 확인
- AI 문장 생성/검수 구조: 현재 없음. `generationMethod`는 deterministic 전제

### 수정 시 주의
- resume 관련 변경은 `in-session bridge`와 `Supabase 저장 기록 복구`를 분리해서 봐야 합니다.
- `recordToResumeCandidate.js`는 `raw_payload`, `record.result`, `record.reflectedSentence`, `record.resumeSentence`를 우선순위로 읽습니다. 저장 row shape를 바꾸면 이 파일을 먼저 점검해야 합니다.
- `sourceRecordId`, `before/after`, `reflectedSentence` 같은 키를 UI에 붙일 때는 현재 import consumer가 없다는 점을 전제로 새 연결 anchor를 먼저 잡아야 합니다.

### TODO
- `recordToResumeCandidate.js` 실제 UI 소비 owner는 미연결 상태입니다.
- 저장된 `work_records`를 선택해 BEFORE/AFTER resume view로 복원하는 화면 owner는 추가 구현 또는 추가 조사 필요입니다.
- share payload 복원과 result share 진입 경로는 이번 라운드 범위에서 제외했습니다.

---

## 7. 데이터 / 온톨로지 / 레지스트리

### 확인된 owner 파일
- `src/data/job/jobOntology.index.js`
- `src/data/job/jobLookup.index.js`
- `src/data/industry/industryRegistry.index.js`
- `src/data/transitionLite/axisExplanationRegistry.js`
- `src/data/transitionLite/newgradStrengthRegistry.js`
- `src/data/transitionLite/newgradWorkStyleRegistry.js`
- `src/lib/transitionLite/newgradCertRegistry.js`

### 레지스트리별 성격
| 레지스트리 | 파일 | scoring 영향 | explanation/display 영향 | 비고 |
|---|---|---:|---:|---|
| job registry | `src/data/job/jobOntology.index.js`, `src/data/job/jobLookup.index.js` | 높음 | 중간 | `buildTransitionLiteResult`, `buildNewgradTransitionLiteResult`에서 직접 참조 |
| industry registry | `src/data/industry/industryRegistry.index.js` | 높음 | 높음 | context/read/comparison table 입력값 제공 |
| cert registry | `src/lib/transitionLite/newgradCertRegistry.js` | 높음 | 높음 | `allowedAxes`, `scoreClass`, `explanationVisibility` 명시 |
| strength registry | `src/data/transitionLite/newgradStrengthRegistry.js` | 중간 | 높음 | `scoringEligibleAxes`, `explanationEligibleAxes`, `evidenceOnlyAxes` 보유 |
| workstyle registry | `src/data/transitionLite/newgradWorkStyleRegistry.js` | 중간 | 높음 | `interactionEligible`, `customerType`/`roleCharacter` 반영 |

### 수정 시 주의
- `axisExplanationRegistry.js`는 producer 계약 파일입니다. UI에서 새 해석을 만들기보다 producer를 수정해야 일관성이 맞습니다.
- `newgradStrengthRegistry.js`와 `newgradWorkStyleRegistry.js`는 display용 label 목록이 아니라 축별 scoring/explanation 허용 범위를 같이 가집니다.
- `newgradCertRegistry.js`는 explanation only 항목과 실제 점수 반영 항목을 함께 관리합니다.

### TODO
- 경력자 축 설명에 직접 쓰이는 일부 registry(`riskTextRegistry`, `whyFragmentRegistry`, `heroTemplateRegistry`)는 이번 표에서 전부 분류하지 않았습니다.
- `jobMigrationMap.js`, `industryCompoundResolver.js`의 최종 scoring 소비처는 추가 조사 필요입니다.

---

## 8. 고위험 파일 / 수정 원칙

| 파일 | 위험 이유 | 권장 수정 방식 |
|---|---|---|
| `src/App.jsx` | 탭/로그인/결과/PM bridge 상태가 집중됨 | exact anchor 기반 국소 수정 |
| `src/lib/analysis/buildNewgradAxisPack.js` | 5축 점수, explanation, comparisonBlock을 함께 생산 | 한 축씩 제한 수정 |
| `src/components/report/TransitionLiteResult.jsx` | 경력자/신입 공용 렌더러, 분기와 하위 섹션이 많음 | render branch 단위 수정 |
| `src/components/mvp/PmMvpView.jsx` | 기록 입력, preview, CRUD, 이벤트 발행, `RecordCalendarCard` 실제 소비가 한 파일에 모임 | submit/delete/event/adapter anchor 국소 수정 |
| `src/components/home/HomeDashboard.jsx` | auth/mock/db/event/calendar 요약이 함께 있고 `RecordCalendarCard`와 별도 렌더 경로를 가짐 | adapter 또는 effect 단위 수정 |
| `src/components/home/RecordCalendarCard.jsx` | month/week/list render와 range record 처리, delete affordance, demo example이 함께 있음 | prop shape 유지 전제로 branch 단위 수정 |
| `src/lib/resume/recordToResumeCandidate.js` | 아직 UI 미연결 상태지만 저장 row 복구 계약과 deterministic resume candidate 계약을 함께 가짐 | 계약 키 변경 금지, consumer 연결 전에 shape 먼저 확인 |

---

## 9. 다음 작업자가 먼저 볼 검색 키워드

| 목적 | 추천 검색어 |
|---|---|
| 결과 화면 진입 | `resultEntryMode`, `activeAnalysis`, `transitionLiteResultVm` |
| 신입 5축 | `buildNewgradAxisPack`, `jobStructure`, `industryContext`, `roleCharacter` |
| 세부 판독 | `NewgradDetailedReadSection`, `comparisonBlock`, `whyThisDetailedReadMatters` |
| 산업 비교 | `industryContext`, `buildIndustryContextComparisonTable`, `operatingContextPanel` |
| 직무 비교 | `buildJobExpectationComparisonTable`, `jobRoleSummaryPanel`, `jobScopePanel` |
| 업무 기록 | `work_records`, `createWorkRecord`, `listWorkRecords`, `handleRecordSubmit` |
| 캘린더 반영 | `PASSMAP_WORK_RECORDS_CHANGED_EVENT`, `entriesByDate`, `fetchRecords` |
| 이력서 후보 | `recordToResumeCandidate`, `buildResumeUpdateCandidateFromRecord`, `reflectedSentence` |
| 서류탈락 | `PreciseAnalysisFlow`, `decisionPack.riskResults`, `computeRoleDistance`, `jd_keyword_coverage_gap` |

---

## 10. 미확인 / 다음 조사 필요 항목

- share payload 복원과 result share 진입 전체 경로
- `buildAxisConnectivityPack` 실제 렌더 소비 지점
- `buildCompositeRisk.js`와 개별 precise builder의 실제 import/호출 진입점
- `updateWorkRecord` 실제 UI 소비 owner
- 저장된 `work_records` 선택 후 BEFORE/AFTER resume view로 복원하는 최종 화면 owner