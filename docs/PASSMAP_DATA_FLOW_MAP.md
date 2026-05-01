# PASSMAP Data Flow Map

> 역할: PASSMAP 기능별 데이터 흐름(입력 → 처리 → 저장 → 표시)을 정리한 문서.
> 이 문서는 기능별 owner 파일은 다루지 않는다. owner 파일은 docs/PASSMAP_SOURCE_MAP.md 참조.
> 작성 기준: 코드에서 확인된 흐름만 기록하고, 미확인 항목은 "확인 필요"로 남긴다.
> 작성일: 2026-04-29 (1차 뼈대)
> 참조 시점: state/ref/저장/rehydration/결과 소비 경로가 관련될 때 확인한다. 단순 UI 문구 수정이나 작은 copy patch에는 필수 문서가 아니다.

---

## 1. 업무 기록 입력 → Supabase 저장 → fetch → 캘린더 표시

- **입력 owner:** `src/components/mvp/PmMvpView.jsx`
  - 사용자가 업무 내용·날짜·태그를 입력 후 submit
  - `handleRecordSubmit` → `buildCalendarRecordFromPmInput`으로 임시 preview record 생성
- **처리 owner:** `src/components/mvp/PmMvpView.jsx`
  - `adaptWorkRecordRow`로 Supabase row → `RecordCalendarCard` 소비 shape 변환
  - `HomeDashboard.jsx`는 `adaptWorkRecordRowForHomeDashboard`로 별도 변환 (두 adapter가 독립 존재)
- **저장/조회 owner:** `src/lib/workRecordRepository.js`
  - `createWorkRecord(payload)` → Supabase `work_records` table INSERT
  - `listWorkRecords(userId)` → SELECT
  - `deleteWorkRecord(id)` → DELETE
  - 저장/삭제 직후 `window.dispatchEvent("passmap:work-records-changed")` 발행
- **표시 owner:**
  - `PmMvpView.jsx` → `RecordCalendarCard` (records prop 주입)
  - `HomeDashboard.jsx` → 자체 adapter + `homeDashboardCalendarUtils.js` 기반 월/주/리스트 뷰
  - `RecordCalendarCard.jsx`는 records를 받아 `buildCalendarEntriesByDate`, `deriveCalendarSummary`로 파생 렌더
- **주요 state/ref/contract:** `work_records`, `calendarRecords`, `passmap:work-records-changed`, `PASSMAP_DEMO_RANGE_RECORDS`, `adaptWorkRecordRow`
- **현재 확인 상태:** 확인됨
- **확인 필요:** `updateWorkRecord`의 실제 UI 호출 owner. HomeDashboard/PmMvpView adapter shape 공통화 여부.
- **위험도:** high (adapter shape 분리 상태)

---

## 2. 업무 기록 → 이력서 BEFORE/AFTER 후보

- **입력 owner:** `src/components/mvp/PmMvpView.jsx`
  - 기록 입력 후 `lastInput` state 유지
  - `onRecordSubmit(normalizedInput)` → `src/App.jsx`의 `pmLastInput` 갱신
- **처리 owner (in-session bridge):** `PmMvpView.jsx`
  - `buildDemoResult`, `sourcePreview`, `result.resumeLine`으로 BEFORE/AFTER preview 생성
- **처리 owner (저장 기록 복구 — 연결됨, RES-CAND-1):** `src/lib/resume/recordToResumeCandidate.js`
  - `normalizeWorkRecordDraftFromStoredRecord(record)` → draft 복원
  - `buildResumeUpdateCandidateFromRecord(record)` → deterministic candidate 생성
  - `PmMvpView.jsx` useMemo(line 442)에서 모든 DB row를 후보 배열로 변환 후 선택/우선순위 처리
- **저장 owner:** `src/lib/workRecordRepository.js` `updateWorkRecordWithCandidate`
  - `raw_payload.resumeUpdateCandidate` (canonical nested) + `raw_payload.resumeSentence` (flat alias)로 이중 저장
  - `PmMvpView.jsx` `handleSaveResumeCandidate(line 719)`에서 호출
- **표시 owner:** `PmMvpView.jsx` mode="preview" (유일한 visible consumer)
  - 저장 버튼: `shouldShowSaveCandidateButton` (sourceRecordId, sourceRecord 필요)
  - 직접 수정 textarea: `isEditingResumeSentence` toggle → `user_edited` 경로로 저장
  - 초안 프로모션 guard: `isDraftSentence` (confidenceLevel "low" / "기록 기반 초안:" prefix) — 직접 수정 없으면 저장 불가
  - **주의(G-1):** "이번 업데이트 반영 보기" BEFORE/AFTER 카드의 AFTER는 `result.resumeLine`(buildDemoResult)을 쓴다. `latestResumeCandidate.resumeSentence`와 다를 수 있음. 개선 후보: `resumeDraftViewModel.updatePreview.afterSentence` 우선 사용 (RES-CAND-3)
- **주요 state/ref/contract:** `pmLastInput`, `resumeSentence`, `sourceRecordId`, `ResumeUpdateCandidate`, `candidateSaveStatus`, `editedResumeSentence`, `isEditingResumeSentence`
- **현재 확인 상태:** 완전 연결됨 (분류 E). 생성 → 표시 → 사용자 편집 → 저장 → DB write 전 경로 확인됨. (RES-CAND-1, 2026-04-29)
- **확인 필요:** 없음
- **위험도:** medium

---

## 3. 직무·산업 분석 입력 → builder/VM → 결과 화면

- **입력 owner:** `src/components/input/InputFlow.jsx`
  - FLOW: INTRO → ROLE → INDUSTRY_CURRENT → INDUSTRY_CURRENT_SUB → INDUSTRY_TARGET → INDUSTRY_TARGET_SUB → CAREER → COMPENSATION → JD → RESUME → ANALYZE
  - `categoryOptions.js`에서 INDUSTRY/JOB 선택지 제공
  - `findJobOntologyByUiSelection`, `findIndustryRegistryByUiSelection`로 선택값 resolve
- **처리 owner (경력자):** `src/lib/transitionLite/buildTransitionLiteResult.js`
  - `buildJobContext`, `buildIndustryContext`, `pickTransitionLiteRiskKeys`, `buildTransitionLiteVM`, `buildAxisConnectivityPack` 순으로 결과 VM 생성
- **처리 owner (신입):** `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
  - cert/self-report/experience pack 생성 후 `buildNewgradAxisPack`, `buildNewgradGoalComparisonTable` 조합
  - `buildNewgradAxisPack.js`가 5축(jobStructure, industryContext, responsibilityScope, customerType, roleCharacter) 점수·설명·comparisonBlock 동시 생산
- **VM 저장:** `App.jsx`의 `transitionLiteResultVm` state
- **표시 owner:** `src/components/report/TransitionLiteResult.jsx`
  - `resultEntryMode === "transition-lite"` && `transitionLiteResultVm` 존재 시 렌더
  - 경력자: `topRisks`, `comparisonTable`, `axisPack`
  - 신입: `newgradGoalComparisonTable`, `NewgradDetailedReadSection`, `strengthEvidenceRead`
- **주요 state/ref/contract:** `transitionLiteResultVm`, `resultEntryMode`, `activeTab === "result"`
- **현재 확인 상태:** 확인됨
- **확인 필요:** `buildAxisConnectivityPack`의 렌더 소비 위치. 경력자 axis pack 상세 내부 구조.
- **위험도:** high

---

## 4. 서류탈락 원인 분석 입력 → analyzer → risk builder → 결과 화면

### 현재 구조: 두 파이프라인 병존

```
PreciseAnalysisFlow.jsx (handleAnalyzeClick → onAnalyze prop 호출)
  → App.jsx requestAnalyzeOnce() → runAnalysis()
      ├── [파이프라인 A: 기존 decision 경로]
      │     analyze(state, ai) → setAnalysis({decisionPack, reportPack, simulationViewModel})
      │
      └── [파이프라인 B: precise builder 경로 — 현재 "임시" debug 상태]
            buildJdResumeFit() → window.__JD_RESUME_FIT__
            buildMustRequirementsGapRisk + buildExperienceLevelGapRisk +
            buildAchievementEvidenceGapRisk + buildJdKeywordCoverageGapRisk +
            buildGapExplanationMissingRisk → [riskResults 배열]
            buildCompositeRisk([riskResults]) → window.__PRECISE_ANALYSIS_DEBUG__

PreciseAnalysisFlow.jsx mode="result"
  ├── [상단 composite 카드] compositeData = useMemo(() => window.__PRECISE_ANALYSIS_DEBUG__.compositeRisk, [analysis])
  │     → summary.overallBand (BAND_UI 스타일), topRisks, lowRisks, insufficientData
  │
  └── [하단 섹션 카드] buildReportSectionData({ analysis, ... })
        → analysis.reportPack.decisionPack.riskResults (파이프라인 A 결과 소비)
        → analysis.decisionPack.riskResults (파이프라인 A 결과 소비)
```

### 상세

- **입력 owner:** `src/components/input/PreciseAnalysisFlow.jsx`
  - `state.jd`, `state.resume` 수집
  - `handleAnalyzeClick` → `onAnalyze()` prop 호출 (App.jsx에서 주입)
  - 로그인 게이트: `App.jsx`의 `reject_analysis_run` auth 체크 후 `pendingAction`으로 지연 실행
- **분석 orchestration owner:** `src/App.jsx` (`runAnalysis` 함수, line ~5685)
  - `requestAnalyzeOnce()` → `runAnalysis()` 호출
  - `analyze(__stateForAnalyze, __aiForAnalyze)` → `base` → `setAnalysis()` (파이프라인 A)
  - debug side-effect 블록에서 precise builder 6종 순차 호출 → `window.__PRECISE_ANALYSIS_DEBUG__` (파이프라인 B)
  - 코드 주석: `✅ PRECISE-ANALYSIS-DEBUG (임시) — 삭제 대상: 최종 UI 연결 후 제거`
- **파이프라인 A (기존 decision 경로) owner:** `src/lib/analyzer.js`
  - `analyze()` 진입점 (App.jsx에서 `import { analyze }` 또는 유사 형태로 호출)
  - 내부: `buildJdResumeFit`, `computeRoleDistance`, `buildDecisionPack` (decision/index.js)
  - 출력: `decisionPack`, `reportPack`, `simulationViewModel` → `analysis` React state
- **파이프라인 B (precise builder 경로) owner:** `src/App.jsx` (import) + `src/lib/preciseAnalysis/*.js` (실행)
  - import 위치: App.jsx lines 66-71
  - 호출 위치: `runAnalysis()` 내 debug 블록 (App.jsx line ~5985-6017)
  - 출력: `window.__PRECISE_ANALYSIS_DEBUG__` 글로벌 (`compositeRisk`, `riskResults`, `fitSummary`, `mustPolicyMode`, `fitUnderstandingPack`)
- **composite risk owner:** `src/lib/preciseAnalysis/buildCompositeRisk.js`
  - 입력: `riskResults` 배열 (5종 builder 결과)
  - 출력: `{ summary, topRisks, supporting, meta }` (`summary.overallBand`: high_risk / warning / caution / pass)
- **개별 builder owner:** `src/lib/preciseAnalysis/*.js` 5종
  - `buildMustRequirementsGapRisk(__precFit, __resumeMerged)` → `must_requirements_gap`
  - `buildExperienceLevelGapRisk(__precFit)` → `experience_level_gap`
  - `buildAchievementEvidenceGapRisk(__precParsed)` → `achievement_evidence_gap`
  - `buildJdKeywordCoverageGapRisk(__precFit, __precParsed, __resumeMerged)` → `jd_keyword_coverage_gap`
  - `buildGapExplanationMissingRisk(__precFit, __precParsed)` → `gap_explanation_missing`
- **결과 저장:** `App.jsx`의 `analysis` React state (파이프라인 A) + `window.__PRECISE_ANALYSIS_DEBUG__` 글로벌 (파이프라인 B)
- **표시 owner — 상단 composite 카드:** `PreciseAnalysisFlow.jsx` mode="result"
  - `compositeData = useMemo(() => window.__PRECISE_ANALYSIS_DEBUG__.compositeRisk, [analysis])`
  - `summary.overallBand` → BAND_UI 스타일 결정
  - `topRisks`, `lowRisks`, `insufficientData` → 리스크 카드 렌더
- **표시 owner — 하단 섹션 카드:** `PreciseAnalysisFlow.jsx` mode="result"
  - `buildReportSectionData({ analysis, ... })` → 파이프라인 A riskResults 소비
  - `pickPreciseRisk({ analysis, debugRisk, key })` → A 경로 우선, B 경로 fallback
- **표시 owner — 본문형 리포트:** `src/components/SimulatorLayout.jsx`
  - `simulationViewModel`, `reportPack` 소비 (파이프라인 A)
- **주요 state/ref/contract:** `activeAnalysis`, `analysis.reportPack.decisionPack.riskResults`, `analysis.decisionPack.riskResults`, `window.__PRECISE_ANALYSIS_DEBUG__`, `compositeData`
- **현재 확인 상태:** 확인됨. 파이프라인 B(precise builder)는 현재 `window` 글로벌을 통한 임시 연결 상태.
- **확인 필요:** 임시 debug 블록의 최종 React state 연결 시점. `createRiskResult.js`의 개별 builder 내부 사용 구조.
- **위험도:** high

---

## 5. 로그인/Auth → 저장 기능 접근

- **Auth provider:** Supabase Google OAuth (PKCE flow)
- **처리 owner:** `src/lib/auth.js`
  - `signInWithGoogle()` → `supabase.auth.signInWithOAuth({ provider: "google" })`
  - redirectTo는 현재 origin + pathname 기준 계산
- **세션 동기화:** `src/lib/supabaseClient.js`
  - `detectSessionInUrl: true`, `flowType: "pkce"` 설정
  - `persistSession: true`, `autoRefreshToken: true`
- **App.jsx 상태 흐름:**
  - `auth`, `authSyncReady`, `openLoginGate`, `pendingAction` state
  - 로그인 필요 기능 실행 시 `pendingAction`에 콜백 저장 → 로그인 완료 후 자동 실행
- **접근 제어 기준:** `src/lib/passmapAuthPolicy.js`
  - `loginRequiredActions`: work_record_save, resume_sentence_save, reject_analysis_run 등
  - `publicFeatures`: landing, sample_report, job_industry_analysis_run 등
- **주요 state/ref/contract:** `auth.loggedIn`, `auth.userId`, `authSyncReady`, `openLoginGate`, `pendingAction`
- **현재 확인 상태:** 확인됨
- **확인 필요:** auth.js.bak_before_supabase_oauth 내용과 현재 차이 (legacy/compatibility 가능성).
- **위험도:** high

---

## 6. Notion preview/import → PASSMAP 업무 기록 저장 흐름

> 2026-04-29 commit → work_records 저장 경로 확인 완료.

- **입력 owner:** `src/components/home/HomeDashboard.jsx`
  - `handleNotionImportClick` → `notionPanelOpen: true`
  - 패널 상태: `notionSources`, `notionSelectedSourceId`, `notionSchema`, `notionPropertyMap`, `notionPreviewResult`

- **인증 흐름:** Worker `/api/notion/auth-url` (POST) → Notion OAuth → Worker `/api/notion/callback` (GET redirect)
  - `notionStatus` state로 연결 상태 확인 (Worker `/api/notion/status` GET)
  - **중요:** Notion 엔드포인트는 Worker 전용. `VITE_AI_PROXY_URL` 미설정 시 명시적 오류 발생.

- **소스 조회:** Worker `/api/notion/sources` (GET) → `notionSources` 목록
- **스키마:** Worker `/api/notion/source-schema` (GET) → `notionSchema`

- **처리 owner (preview):** Worker `/api/notion/preview` (POST) → `notionPreviewResult`
  - Notion pages 조회 → `extractMappedFieldsFromPage`로 정규화 → `lookupExternalRecordLinks`로 중복 체크
  - 응답 shape: `{ok, items: [{previewId, mapped, status, errors, warnings}], summary}`
  - `mapped` shape: `{title, recordDate, description, task, result, projectName, skillTags, strengthTags, startDate, endDate, recordType, workType}`

- **처리 owner (commit):** Worker `/api/notion/commit` (POST)
  - **Step 1:** Notion pages 재조회 (preview와 동일 소스)
  - **Step 2:** `extractMappedFieldsFromPage`로 정규화 + SHA-256 content hash 계산
  - **Step 3:** `lookupExternalRecordLinks` → `external_record_links` 테이블 조회로 중복/신규 판별
  - **Step 4:** 신규 항목만 eligible (selectedPreviewIds 필터 적용)
  - **Step 5:** 각 eligible 항목에 대해 Supabase RPC `import_notion_work_record` 호출 (Promise.allSettled 병렬)
    - RPC body: `{p_user_id, p_external_record_id, p_content_hash, p_work_record_payload, p_external_link_payload}`
    - `p_work_record_payload`: `{record_date, title, description, task, result, project_name, skill_tags, strength_tags, work_type, visibility: "private", raw_payload}`
    - `p_external_link_payload`: `{external_source_id, external_updated_at, raw_meta}`
    - RPC 반환: `{ok, status: "committed"|"skipped_duplicate", work_record_id, link_id}`
  - **Step 6:** summary 집계 후 응답 반환
  - commit 응답 shape: `{ok, summary: {total, requested, committed, skipped_*, failed}, results: [{previewId, status, work_record_id, link_id}]}`

- **Supabase 저장 대상:**
  - `work_records` — Supabase RPC `import_notion_work_record` 내부에서 INSERT (코드 기준 추정, RPC SQL은 미확인)
  - `external_record_links` — 동일 RPC 내부에서 INSERT (provider=notion, deduplication 용도)
  - **확인됨:** 실제 저장은 Supabase 저장 프로시저 내부에서 일어남. **RPC SQL 로컬 확인됨** (`supabase/sql/20260429_notion_import_commit_rpc.sql`). 상세는 `docs/PASSMAP_BACKEND_API_DB_MAP.md` 섹션 9 참조.

- **work_records 저장 여부:** **확인됨 (A등급)** — commit handler가 RPC를 통해 `work_records` INSERT까지 완료함.

- **commit 후 rehydration:**
  - `HomeDashboard.jsx:678`: `summary.committed > 0`이면 `window.dispatchEvent(new CustomEvent("passmap:work-records-changed"))` 발행
  - `HomeDashboard.jsx:382-383`: `PASSMAP_WORK_RECORDS_CHANGED_EVENT` 이벤트 수신 → `fetchRecords()` → `listWorkRecords({ limit: 50 })` → `setDbRecords()`
  - `PmMvpView.jsx:364`: 동일 이벤트 수신 → `fetchWorkRecords()` → `listWorkRecords({ limit: 50 })`
  - **완전 rehydration 확인됨.** 단, committed=0이면 이벤트가 발행되지 않아 refetch 미발생.

- **commit request body:**
  ```json
  { "dataSourceId": "...", "propertyMap": {"title": "...", "recordDate": "..."}, "defaults": {"recordType": "weekly", "workType": "이번 주 기록"}, "selectedPreviewIds": [...] }
  ```

- **주요 state/ref/contract:** `notionPanelOpen`, `notionStatus`, `notionSources`, `notionPreviewResult`, `notionCommitResult`, `VITE_AI_PROXY_URL`, `passmap:work-records-changed`

- **현재 확인 상태:** 확인됨 — commit → RPC → work_records 저장 → 이벤트 → refetch 전체 경로 확인

- **확인됨 (DOC-INV-4):**
  - `import_notion_work_record` RPC SQL: `supabase/sql/20260429_notion_import_commit_rpc.sql` 확인. `BACKEND_API_DB_MAP.md` 섹션 9 참조.
  - `external_record_links` 스키마: `supabase/sql/20260428_notion_import_foundation.sql` 확인. `BACKEND_API_DB_MAP.md` 섹션 10 참조.

- **확인 필요:**
  - committed=0 케이스에서 UI 피드백이 충분한지 (refetch 미발생 시 캘린더 갱신 없음)

- **위험도:** high — RPC SQL 로컬 확인됨이나 Worker와 별도 배포 단위. RPC 서명 변경 시 Worker 호출 코드도 동시 변경 필요. propertyMap 필드 추가/삭제 시 RPC `p_work_record_payload` 구조와 맞춰야 함.

---

## 7. Calendar 다운로드/ICS 흐름

- **소스 owner:** `src/components/home/HomeDashboard.jsx`
  - 로그인 상태 시 Supabase `work_records`, 비로그인 시 mock/demo records 사용
- **처리 owner:** `src/lib/calendarExport.js`
  - `buildPassmapDailyCalendarEvents(records)` → 기록 배열에서 `reflectedSentence`, `strengthTags` 추출
  - ICS 형식으로 변환 후 blob download
- **표시/출력:** `downloadPassmapCalendarIcs(records)` → 브라우저 file download
- **주요 state/ref/contract:** `reflectedSentence`, `strengthTags`, ICS blob
- **현재 확인 상태:** 확인됨 (HomeDashboard에서 직접 import/호출)
- **확인 필요:** 없음 (구조 단순)
- **위험도:** low

---

## 8. PDF export 흐름

- **소스:** `TransitionLiteResult.jsx` 또는 `PreciseAnalysisFlow.jsx`에서 download 버튼 클릭
- **처리 owner:** `src/lib/pdf/downloadTransitionLitePdf.js`
  - `renderToStaticMarkup`으로 `TransitionLitePdfHtmlDocument` 렌더 후 PDF blob 생성
  - `buildTransitionLitePdfModel.js`로 report VM → PDF용 model 변환
- **PDF 렌더러:** `src/components/pdf/TransitionLitePdfDocument.jsx` (@react-pdf/renderer 사용)
- **print 흐름:** `TransitionLiteResult.jsx`와 `PreciseAnalysisFlow.jsx` 각각에서 `window.print()` 직접 호출
- **주요 state/ref/contract:** `@react-pdf/renderer`, `window.print()`
- **현재 확인 상태:** 확인됨
- **확인 필요:** PDF download 버튼이 TransitionLiteResult에서 직접 import하는지, InputFlow.jsx를 통하는지.
- **위험도:** low

---

## TODO (다음 라운드 확인 필요)

- `buildAxisConnectivityPack` 실제 렌더 소비 위치
- `buildCompositeRisk.js` → 개별 precise builder 호출 구조 전체 경로
- Notion commit 후 work_records 저장 여부와 refetch 트리거 → **2026-04-29 확인 완료** (섹션 6 상세 참조)
- `updateWorkRecord` 실제 UI 호출 owner → **2026-04-29 확인 완료** (`PmMvpView.jsx` `handleSaveResumeCandidate` line 750, RES-CAND-1)
- 저장 기록 선택 후 resume view로 복원하는 최종 화면 owner → **2026-04-29 확인 완료** (`PmMvpView.jsx` mode="preview", RES-CAND-1)
