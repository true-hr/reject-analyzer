# PASSMAP High-Risk Files / Do-Not-Touch Map

> 역할: PASSMAP에서 수정 시 높은 주의가 필요한 파일과 안전한 수정 방식을 정리한 문서.
> 이 문서에 있는 파일은 삭제하거나 대량 수정하지 말고, 명시된 안전 수정 방식을 따른다.
> 작성일: 2026-04-29 (1차)
> 참조 시점: App.jsx, analyzer.js, buildNewgradAxisPack.js, Worker index.js 등 구조적 영향이 큰 파일을 건드릴 때 확인한다. 모든 작업에서 필수로 읽는 문서가 아니다.

---

## src/App.jsx

- **담당 기능:** 앱 진입/탭/결과 화면/로그인/PM bridge — 전역 상태 owner
- **위험 이유:** `activeTab`, `step`, `resultEntryMode`, `transitionLiteResultVm`, `analysis`, `auth`, `authSyncReady`, `openLoginGate`, `pendingAction`, `pmLastInput`이 모두 이 파일에 집중됨. 10,000줄 이상. 한 군데 수정이 다른 상태에 예상치 못한 영향을 줄 수 있음.
- **안전한 수정 방식:** exact anchor 기반 국소 수정. 하위 owner 파일이 있는 경우 그 파일에서 처리. 상태 추가 시 연관 state 흐름 전체 확인 후 진행.
- **피해야 할 수정 방식:** 구조적 refactor, 상태 리네이밍, 다수 상태 동시 수정, 결과 화면 진입 로직과 무관한 코드 정리.
- **먼저 확인해야 할 anchor:** `resultEntryMode`, `activeTab`, `transitionLiteResultVm`, `openLoginGate`, `pendingAction`, `pmLastInput`, `setPmLastInput`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 2(앱 진입), `docs/PASSMAP_DATA_FLOW_MAP.md` 섹션 5(Auth)

---

## src/lib/analysis/buildNewgradAxisPack.js

- **담당 기능:** 신입 Transition Lite 5축 분석 (점수, 설명, comparisonBlock 동시 생산)
- **위험 이유:** `jobStructure`, `industryContext`, `responsibilityScope`, `customerType`, `roleCharacter` 5축 각각에 대해 점수·explanation·comparisonBlock을 한 파일에서 동시 생산. 한 축 수정이 다른 축 비교 결과와 전체 VM shape에 연쇄 영향.
- **안전한 수정 방식:** 축 단위로 격리하여 수정. 점수·explanation·comparisonBlock 세 군데를 같이 확인 후 일관성 유지.
- **피해야 할 수정 방식:** 여러 축을 동시에 수정, VM shape 변경, 기존 key 이름 변경.
- **먼저 확인해야 할 anchor:** `jobStructure`, `industryContext`, `responsibilityScope`, `customerType`, `roleCharacter`, `comparisonBlock`, `scoreClass`, `explanation`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 3(직무·산업), `docs/PASSMAP_DATA_FLOW_MAP.md` 섹션 3

---

## src/lib/transitionLite/buildTransitionLiteResult.js

- **담당 기능:** 경력자 Transition Lite 분석 결과 VM 생성 owner
- **위험 이유:** `buildJobContext`, `buildIndustryContext`, `pickTransitionLiteRiskKeys`, `buildTransitionLiteVM`, `buildAxisConnectivityPack`을 연결하는 핵심 orchestrator. 이 파일의 계약 변경이 `TransitionLiteResult.jsx` 렌더에 직접 영향.
- **안전한 수정 방식:** 데이터 흐름 확인 후 VM shape 유지 전제로 내부 로직만 수정. 새 필드 추가 시 optional로 추가.
- **피해야 할 수정 방식:** VM 최상위 key 이름 변경, 렌더러 계약과 어긋나는 필드 제거.
- **먼저 확인해야 할 anchor:** `buildTransitionLiteVM`, `pickTransitionLiteRiskKeys`, `topRisks`, `comparisonTable`, `axisPack`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 3(직무·산업 분석)

---

## src/lib/transitionLite/buildNewgradTransitionLiteResult.js

- **담당 기능:** 신입 Transition Lite 분석 결과 VM 생성 owner
- **위험 이유:** cert/self-report/experience pack → buildNewgradAxisPack → buildNewgradGoalComparisonTable 파이프라인 orchestrator. 신입 경로는 경력자 경로와 VM shape가 다르므로 공통 렌더러(`TransitionLiteResult.jsx`)가 신입 분기를 별도 처리.
- **안전한 수정 방식:** 신입 전용 필드 추가 시 기존 분기 조건 유지. buildNewgradAxisPack과 계약 일치 확인 후 수정.
- **피해야 할 수정 방식:** 경력자 VM shape와 혼용하는 구조 변경, `newgradGoalComparisonTable` key 변경.
- **먼저 확인해야 할 anchor:** `buildCertEvidencePack`, `buildPhase1CertRoleRelevancePack`, `buildNewgradAxisPack`, `newgradGoalComparisonTable`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 3, `docs/newgrad-cert-axis-investigation-2026-04-23.md`

---

## src/components/report/TransitionLiteResult.jsx

- **담당 기능:** 경력자/신입 공용 Transition Lite 결과 렌더러
- **위험 이유:** 경력자/신입 VM shape가 다름에도 하나의 렌더러에서 조건 분기로 처리. 분기가 많고 하위 섹션 수가 많아 UI 버그가 다른 분기에서 발생할 수 있음. `TransitionLiteResult.jsx`는 window.print()와 PDF download button도 보유.
- **안전한 수정 방식:** 경력자/신입 분기 구분 후 해당 분기 내에서만 수정. 새 섹션 추가 시 분기 외부에 영향 없도록 격리.
- **피해야 할 수정 방식:** 공통 렌더 함수 수정, viewModel prop shape 변경, 경력자 분기를 건드리면서 신입 결과 확인 생략.
- **먼저 확인해야 할 anchor:** `NewgradDetailedReadSection`, `NewgradGoalComparisonSection`, `RiskComparisonTable`, `strengthEvidenceRead`, `axisPack`, `topRisks`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 3

---

## src/components/input/PreciseAnalysisFlow.jsx

- **담당 기능:** 서류탈락 원인 분석 입력/실행/결과 렌더링 owner
- **위험 이유:** 이중 파이프라인을 동시에 소비합니다. 상단 composite 카드는 `window.__PRECISE_ANALYSIS_DEBUG__.compositeRisk` (파이프라인 B, 임시 bridge)를 읽고, 하단 섹션 카드는 `analysis.reportPack.decisionPack.riskResults`와 `analysis.decisionPack.riskResults` (파이프라인 A)를 읽습니다. 두 파이프라인이 동시에 살아있어 한쪽 변경이 다른 쪽을 깨뜨릴 수 있습니다. window.print()와 ConsultingLeadPage 링크도 보유.
- **안전한 수정 방식:** 입력 단계와 결과 단계를 명확히 구분 후 해당 섹션만 수정. 파이프라인 A(riskResults)와 파이프라인 B(window.__PRECISE_ANALYSIS_DEBUG__)를 분리해서 파악 후 수정.
- **피해야 할 수정 방식:** 두 riskResults 경로 중 하나만 수정, state 구조 변경, `window.__PRECISE_ANALYSIS_DEBUG__` 의존 로직 추가 (임시 bridge이므로 의존 확대 금지).
- **먼저 확인해야 할 anchor:** `handleAnalyzeClick`, `buildReportSectionData`, `ResultRiskCard`, `ReportAnalysisCard`, `compositeData`, `window.__PRECISE_ANALYSIS_DEBUG__`, `analysis.reportPack.decisionPack.riskResults`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 4(서류탈락), `docs/PASSMAP_DATA_FLOW_MAP.md` 섹션 4

---

## src/lib/analyzer.js

- **담당 기능:** 서류탈락 원인 분석 엔진 orchestrator
- **위험 이유:** `buildJdResumeFit`, `computeRoleDistance`, `buildDecisionPack`을 순서대로 연결. 이 파일의 계약 변경이 PreciseAnalysisFlow 렌더 결과에 직접 영향. analyzer.js.bak, analyzer.js.bak2 파일 존재 (legacy/compatibility 가능성).
- **안전한 수정 방식:** 함수별 입출력 계약 확인 후 내부 로직만 수정. 출력 shape 변경 시 PreciseAnalysisFlow와 SimulatorLayout 두 consumer 모두 확인.
- **피해야 할 수정 방식:** 출력 key 변경 (decisionPack, reportPack, simulationViewModel), 함수 시그니처 변경.
- **먼저 확인해야 할 anchor:** `buildJdResumeFit`, `computeRoleDistance`, `buildDecisionPack`, `decisionPack`, `reportPack`, `simulationViewModel`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 4, `docs/PASSMAP_DATA_FLOW_MAP.md` 섹션 4

---

## src/lib/decision/index.js

- **담당 기능:** generic decision/risk pack builder owner
- **위험 이유:** `riskResults` 정규화, gate 주입, roleDistance penalty 반영, decision score/pressure 계산이 한 파일에 집중. index.js.bak 파일 여러 개 존재 (legacy/compatibility 가능성).
- **안전한 수정 방식:** `buildDecisionPack` 내 특정 rule 수정 시 해당 rule 함수만 격리하여 수정. gate 추가 시 기존 gate 실행 순서 유지.
- **피해야 할 수정 방식:** `riskResults` shape 변경, `buildDecisionPack` 함수 시그니처 변경, gate 우선순위 변경.
- **먼저 확인해야 할 anchor:** `buildDecisionPack`, `riskResults`, `roleDistance`, `getRoleDistance`, `evalRiskProfiles`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 4

---

## src/components/mvp/PmMvpView.jsx

- **담당 기능:** 업무 기록 입력, preview, Supabase CRUD, 이벤트 발행, RecordCalendarCard 실제 소비, 이력서 후보 생성·표시·편집·저장 (RES-CAND-1, 2026-04-29 확인)
- **위험 이유:** 기록 입력 UI, 저장/삭제, DB row adapter, 이벤트 발행, 이력서 후보 전 파이프라인(생성→표시→사용자편집→저장)이 한 파일에 집중. adapter(`adaptWorkRecordRow`)는 HomeDashboard의 adapter와 분리되어 있어 shape 변경 시 두 군데 동시 수정 필요.
- **안전한 수정 방식:** submit/delete/event/adapter/resume-candidate anchor 기반 국소 수정. 어느 구간을 수정하는지 먼저 명시 후 진행.
- **피해야 할 수정 방식:** adapter shape 변경, RecordCalendarCard prop 계약 변경, 이벤트 이름 변경, `isDraftSentence` guard 제거.
- **먼저 확인해야 할 anchor:** `handleRecordSubmit`, `handleDeleteWorkRecord`, `adaptWorkRecordRow`, `passmap:work-records-changed`, `RecordCalendarCard`, `fetchWorkRecords`, `handleSaveResumeCandidate`, `isDraftSentence`, `shouldShowSaveCandidateButton`, `isEditingResumeSentence`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 5(업무관리), `docs/PASSMAP_DATA_FLOW_MAP.md` 섹션 1, 2, `docs/resume-candidate-ui-connection-plan.md`

---

## src/components/home/HomeDashboard.jsx

- **담당 기능:** 대시보드, Notion 연동 UI/상태, auth 구독, mock/demo 분기, 이벤트 구독, 캘린더 요약
- **위험 이유:** auth 상태, mock/db 데이터 분기, Notion panel 상태(12개 이상), `passmap:work-records-changed` 이벤트 구독, `adaptWorkRecordRowForHomeDashboard`, ICS download가 한 파일에 혼재.
- **안전한 수정 방식:** 수정 대상 구간(Notion 연동 vs 캘린더 뷰 vs auth 분기)을 먼저 명확히 분리 후 해당 구간만 수정.
- **피해야 할 수정 방식:** Notion 상태와 캘린더 상태를 같은 PR에서 동시 수정, adapter shape 임의 변경.
- **먼저 확인해야 할 anchor:** `notionPanelOpen`, `handleNotionImportClick`, `adaptWorkRecordRowForHomeDashboard`, `downloadPassmapCalendarIcs`, `passmap:work-records-changed`
- **관련 문서:** `docs/PASSMAP_BACKEND_API_DB_MAP.md` 섹션 2(Worker API), `docs/PASSMAP_DATA_FLOW_MAP.md` 섹션 6(Notion)

---

## src/components/home/RecordCalendarCard.jsx

- **담당 기능:** records prop을 받아 월/주/리스트 캘린더와 날짜 상세를 파생 렌더하는 presentational calendar
- **위험 이유:** month/week/list render 분기, range record 처리, delete affordance, demo example이 함께 있음. `buildCalendarEntriesByDate`, `selectedEntry`, `passmapRecords`, `calendarSummary`를 내부에서 파생.
- **안전한 수정 방식:** prop shape 유지 전제로 특정 render branch만 수정. WEEKLY_DEMO_EXAMPLES와 실제 records 구분 확인 후 수정.
- **피해야 할 수정 방식:** records prop shape 변경, selectedEntry 구조 변경.
- **먼저 확인해야 할 anchor:** `buildCalendarEntriesByDate`, `selectedEntry`, `passmapRecords`, `source === "passmap"`, `source === "supabase"`, `canDeleteRecords`
- **관련 문서:** `docs/PASSMAP_SOURCE_MAP.md` 섹션 5(업무관리)

---

## src/lib/resume/recordToResumeCandidate.js

- **담당 기능:** 저장된 업무 기록 1개를 ResumeUpdateCandidate로 변환하는 순수 함수 owner
- **위험 이유:** `PmMvpView.jsx` useMemo(line 442)가 모든 DB row를 이 함수로 변환해 후보 배열을 만든다 (RES-CAND-1, 2026-04-29 확인). `raw_payload`, `record.result`, `record.reflectedSentence`, `record.resumeSentence` 우선순위 읽기 계약 보유. 저장 row shape 변경 시 이 파일 먼저 영향.
- **안전한 수정 방식:** shape 변경 전 PmMvpView useMemo consumer와 `workRecordRepository.updateWorkRecordWithCandidate` 저장 키를 동시 확인.
- **피해야 할 수정 방식:** sourceRecordId/resumeSentence/confidenceLevel/generationMethod 키 임의 변경.
- **먼저 확인해야 할 anchor:** `normalizeWorkRecordDraftFromStoredRecord`, `buildResumeUpdateCandidateFromRecord`, `sourceRecordId`, `resumeSentence`, `confidenceLevel`, `generationMethod`
- **관련 문서:** `docs/record-to-resume-contract.md`, `docs/PASSMAP_SOURCE_MAP.md` 섹션 6(이력서), `docs/resume-candidate-ui-connection-plan.md`

---

## src/lib/supabaseClient.js

- **담당 기능:** Supabase 클라이언트 싱글톤 생성
- **위험 이유:** 모든 Supabase 기능(auth, work_records CRUD)의 기반. 환경변수 미설정 시 동작 방식이 다르므로 수정 시 demo 모드 분기도 함께 확인 필요.
- **안전한 수정 방식:** createClient 옵션 수정 시 현재 auth 설정(persistSession, PKCE, detectSessionInUrl)과 충돌 없는지 확인.
- **피해야 할 수정 방식:** storageKey 변경 (기존 세션 무효화), flowType 변경.
- **먼저 확인해야 할 anchor:** `createClient`, `persistSession`, `flowType`, `storageKey`, `detectSessionInUrl`
- **관련 문서:** `docs/PASSMAP_BACKEND_API_DB_MAP.md` 섹션 1

---

## worker-ai/orange-shadow-95c1/src/index.js

- **담당 기능:** Cloudflare Worker — 모든 Notion API 엔드포인트 + /api/enhance + /api/parse 라우팅 owner
- **위험 이유:** 8개 env/secret이 이 파일 하나에 집중됨. `SUPABASE_SERVICE_ROLE_KEY`(RLS 우회 admin 권한), `TOKEN_ENCRYPTION_KEY`(Notion 토큰 암호화 키), `NOTION_CLIENT_SECRET`(OAuth 시크릿), `GEMINI_API_KEY/V2`(AI 비용 키)를 모두 처리. 이 파일의 코드 오류가 secrets 노출로 이어질 수 있음. Vercel fallback 없음. wrangler.toml 미커밋 상태.
- **추가 위험 1 (수정됨):** `/api/enhance` 핸들러에 있던 `__key` 스코프 버그 — 2026-04-29 BUGFIX-1 패치로 수정됨. `__key` 선언이 parse/enhance 공통 스코프로 이동됨.
- **추가 위험 2 (신규 확인):** `/api/notion/commit` handler가 Supabase stored procedure `import_notion_work_record`를 호출해 `work_records` + `external_record_links` 양쪽에 INSERT함. 이 RPC는 Supabase DB-side에만 존재하므로 코드 기준 SQL 확인 불가. RPC 삭제/서명 변경 시 commit 전체 실패. `p_work_record_payload` 필드 추가/삭제 시 RPC 인자와 맞춰야 함.
- **추가 위험 3 (주의):** "commit 성공 = 업무 기록 저장 완료"는 RPC가 정상 동작할 때만 성립. RPC가 없거나 실패하면 commit 응답은 `{ok: false, error: "rpc_failed"}`이므로 저장 미완료. 프론트에서 committed=0이면 이벤트 미발행 → 캘린더 refetch 없음.
- **안전한 수정 방식:** 새 엔드포인트 추가 시 ALLOWED_PATHS 배열에도 동시 추가 필수. 기존 핸들러 수정 시 request method 분기(GET/POST) 확인. env 참조 추가 시 반드시 missing 체크 블록에도 동시 추가. secrets 값은 절대 코드/로그에 출력하지 않음. commit handler의 `p_work_record_payload` 필드 변경 시 RPC SQL도 반드시 동시 변경.
- **피해야 할 수정 방식:** ALLOWED_PATHS에서 경로 제거, 기존 핸들러 함수 시그니처 변경, `env.*` 값을 Response body에 직접 포함, `console.log`에 key/token 전체값 출력, `p_work_record_payload` 필드만 변경하고 RPC SQL을 변경하지 않는 것, 배포 전 사용자 확인 없이 변경.
- **먼저 확인해야 할 anchor:** `ALLOWED_PATHS`, `requireSupabaseUser`, `supabaseRest`, `importAesKey`, `handleNotionCommit`, `handleNotionCallback`, `handleNotionStatus`, `lookupExternalRecordLinks`, `import_notion_work_record` (Supabase RPC)
- **env 의존성 요약:** `GEMINI_API_KEY`/`V2` (/api/parse, /api/enhance), `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (모든 Notion), `TOKEN_ENCRYPTION_KEY` (auth-url/callback/sources/source-schema/preview/commit), `NOTION_CLIENT_ID`/`SECRET`/`REDIRECT_URI` (OAuth 흐름)
- **관련 문서:** `docs/PASSMAP_BACKEND_API_DB_MAP.md` 섹션 1-2(Supabase 테이블), 섹션 5~8(Worker env/endpoint 상세), `docs/PASSMAP_DATA_FLOW_MAP.md` 섹션 6(commit 흐름 상세), `docs/notion-import-commit-contract.md`

---

## 참고: 위험도 판단 기준

| 위험도 | 기준 |
|---|---|
| high | 전역 상태 집중 / 다수 consumer 보유 / 계약 파일 / 분기가 많은 렌더러 |
| medium | 단독 기능 owner이나 consumer가 있거나 shape 변경 영향이 있는 파일 |
| low | 독립 유틸 / 단방향 링크 / consumer가 하나인 파일 |

---

## 참고 문서

- `docs/PASSMAP_DEV_REFERENCE.md` — 전체 진입점
- `docs/PASSMAP_SOURCE_MAP.md` — 기능별 owner 파일 지도
- `docs/PASSMAP_DATA_FLOW_MAP.md` — 데이터 흐름 지도
- `docs/PASSMAP_BACKEND_API_DB_MAP.md` — Backend/API/DB 구조
