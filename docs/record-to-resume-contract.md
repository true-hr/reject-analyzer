# PASSMAP 기록 → 이력서 데이터 계약

> 작성일: 2026-04-28
> 작성 근거: PmRecordInput.jsx, PmMvpView.jsx, HomeDashboard.jsx, workRecordRepository.js, homeDashboardMock.js 코드 조사
> 현재 MVP: App.jsx pmLastInput in-session state bridge (SAFE STATE-BRIDGE PATCH)
> 이 문서의 목적: AI 생성 도입 전, 계층 간 데이터 계약을 고정

---

## 1. 목적

- 업무 기록이 이력서 문장, 주요 성과, 보유 역량, 분석 입력으로 이어지기 위한 데이터 계약을 정의한다.
- 현재 MVP state bridge를 최종 구조로 보지 않는다.
- AI 문장 생성은 이 계약 위에 나중에 붙인다. 계약 고정 전 AI 도입 금지.

---

## 2. Current Sources

각 파일의 현재 책임과 실제 필드:

| 파일 | 역할 | 생산하는 shape | 소비처 | 비고 |
|---|---|---|---|---|
| `PmRecordInput.jsx` | 사용자 입력 폼 | WorkRecordDraft (weekly / project) | PmMvpView.handleRecordSubmit | 실제 입력값 |
| `PmMvpView.jsx` (handleRecordSubmit) | 기록 submit handler | normalizedInput → App.pmLastInput + Supabase | preview 화면, Supabase | onRecordSubmit prop으로 App에 올림 |
| `PmMvpView.jsx` (_persistWorkRecord) | Supabase 저장 | StoredWorkRecord (work_records 테이블) | DB | 로그인 시만 저장 |
| `PmMvpView.jsx` (adaptWorkRecordRow) | DB row → CalendarCard shape | CalendarRecord | RecordCalendarCard | **BUG: reflectedSentence 항상 ""** |
| `PmMvpView.jsx` (buildDemoResult) | WorkRecordDraft → ResumeUpdateCandidate 유사체 | DemoResult (resumeLine, strengths 등) | resume 화면 렌더링 | strengths 하드코딩 |
| `HomeDashboard.jsx` (adaptWorkRecordRowForHomeDashboard) | DB row → HomeDashboard CalendarRecord | CalendarRecord | HomeDashboard 캘린더 | reflectedSentence 올바르게 매핑 |
| `workRecordRepository.js` | Supabase CRUD | StoredWorkRecord | PmMvpView | 65줄, 안정 |
| `homeDashboardMock.js` | 데모/mock 기록 | MockRecord (CalendarRecord 호환) | HomeDashboard, RecordCalendarCard | reflectedSentence 필드 있음 |

---

## 3. WorkRecordDraft Contract

사용자가 입력하고 submit 시 `onSubmit(input)`으로 전달되는 원본 기록 계약.
**현재 코드 기준 (PmRecordInput.jsx L398-422).**

### 3.1 Weekly Track

```
WorkRecordDraft (track = "weekly") {
  track:              "weekly"          // required
  text:               string            // required — 이번 주에 한 일 자유 서술
  roleTags:           string[]          // optional — 업무 역할 태그
  collaborationTags:  string[]          // optional — 협업 맥락 태그
  resultTags:         string[]          // optional — 변화/결과 유형 태그
}
```

### 3.2 Project Track

```
WorkRecordDraft (track = "project") {
  track:              "project"         // required
  recordType:         "personal" | "teamProject"  // required
  text:               string            // required — 구조화된 요약 (handleSubmit에서 조합)
  startDate:          string            // optional — "YYYY-MM-DD"
  endDate:            string            // optional — "YYYY-MM-DD"
  projectName:        string            // optional
  projectPeriod:      string            // optional — 자유 텍스트 기간
  projectGoal:        string            // optional — 팀 목표 / 개인 목표
  projectContext:     string            // optional — 내 역할 / 배경
  projectActions:     string            // optional — 이번에 처리한 일 (resumeSentence 핵심 재료)
  projectResult:      string            // optional — 결과/성과 (resumeSentence 핵심 재료)
  projectInsight:     string            // optional — 다음 액션/학습
  roleTags:           string[]          // optional
  collaborationTags:  string[]          // optional
  resultTags:         string[]          // optional
}
```

### 3.3 이력서 반영 가능성 요약

| 필드 | 이력서 반영 가능성 | 현재 반영 여부 |
|---|---|---|
| `text` | 높음 — sourceText → BEFORE 표시 | O (sourcePreview) |
| `projectActions` | 높음 — resumeLine 핵심 재료 | O (buildDemoResult) |
| `projectResult` | 높음 — resumeLine 핵심 재료 | O (buildDemoResult) |
| `projectGoal` | 중간 — 맥락 문장에 사용 | O (buildDemoResult) |
| `projectName` | 중간 — 이력서 경력 항목명 | 부분 (buildDemoResult) |
| `roleTags` | 중간 — strength_tags로 저장 | 부분 (Supabase만, 이력서 미반영) |
| `collaborationTags` | 중간 — skill_tags로 저장 | 부분 (Supabase만, 이력서 미반영) |
| `resultTags` | 낮음 — 현재 이력서 화면 미사용 | X |
| `projectContext` | 낮음 — 현재 buildDemoResult 미사용 | X |
| `projectInsight` | 낮음 — 현재 buildDemoResult 미사용 | X |

---

## 4. StoredWorkRecord Contract

Supabase `work_records` 테이블 row 기준 계약.
**현재 코드 기준 (PmMvpView._persistWorkRecord + workRecordRepository.js).**

```
StoredWorkRecord {
  // DB 생성 필드
  id:             UUID                // auto-generated
  created_at:     timestamp           // auto-generated
  updated_at:     timestamp           // auto-generated (updateWorkRecord 시)

  // 저장 필드 (createWorkRecord 기준)
  user_id:        UUID                // required — Supabase auth user id
  record_date:    string              // "YYYY-MM-DD" — input.startDate || today
  title:          string              // projectName || text 첫 줄 || chipSummary
  description:    string | null       // rawText (input.text 전체)
  task:           string | null       // input.projectActions
  result:         string | null       // input.projectResult  ← resumeSentence 후보 원본
  project_name:   string | null       // input.projectName
  strength_tags:  string[]            // input.roleTags
  skill_tags:     string[]            // input.collaborationTags
  work_type:      "weekly" | "project"
  source:         "manual"
  raw_payload:    object              // input 전체 (WorkRecordDraft)
}
```

### 4.1 raw_payload 관계

`raw_payload`는 `WorkRecordDraft` 전체를 JSON으로 저장한다.
이후 복구 시 `raw_payload`에서 top-level 필드로 복원 가능하다.

| DB top-level | raw_payload 대응 필드 | 비고 |
|---|---|---|
| `description` | `raw_payload.text` | 동일 내용 |
| `task` | `raw_payload.projectActions` | project track만 |
| `result` | `raw_payload.projectResult` | project track만 |
| `strength_tags` | `raw_payload.roleTags` | 배열 |
| `skill_tags` | `raw_payload.collaborationTags` | 배열 |
| — | `raw_payload.resultTags` | top-level 저장 없음 |
| — | `raw_payload.projectGoal` | top-level 저장 없음 |
| — | `raw_payload.projectContext` | top-level 저장 없음 |
| — | `raw_payload.projectInsight` | top-level 저장 없음 |

---

## 5. ResumeUpdateCandidate Contract

기록 1개가 이력서 업데이트 후보로 변환된 형태.
AI 없이 deterministic 변환으로도 만들 수 있어야 하며,
나중에 AI가 `resumeSentence`, `achievementBullets` 등 일부 필드만 교체할 수 있어야 한다.

```
ResumeUpdateCandidate {
  // 출처 정보
  sourceRecordId:     string | null    // StoredWorkRecord.id (in-session은 null 가능)
  sourceTrack:        "weekly" | "project"
  sourceText:         string           // WorkRecordDraft.text (원문)
  sourceSummary:      string           // 짧은 요약 (title 또는 첫 줄)

  // 이력서 반영 후보 (deterministic 또는 AI 생성)
  resumeSentence:     string           // 핵심 이력서 문장 — AI 교체 대상 1순위
  achievementBullets: string[]         // 경력/성과 불릿 리스트
  competencyTags:     string[]         // 역량 태그 (보유 역량 섹션용)
  collaborationTags:  string[]         // 협업 맥락 태그

  // 신뢰도 및 메타
  evidenceTags:       string[]         // 근거 태그 (resultTags 기반)
  confidenceLevel:    "low" | "medium" | "high"
  generationMethod:   "deterministic" | "ai_generated" | "consultant_reviewed" | "user_edited"
  createdFrom:        "input" | "supabase_row" | "mock"
}
```

### 5.1 현재 buildDemoResult 출력과의 대응

`buildDemoResult`는 `ResumeUpdateCandidate`의 부분 구현체다.

| ResumeUpdateCandidate | buildDemoResult 출력 | 차이 |
|---|---|---|
| `sourceText` | `result.sourceText` | 동일 |
| `resumeSentence` | `result.resumeLine` | 이름 다름 (통일 필요) |
| `achievementBullets` | `buildResumeExperienceBullets(result)` | hardcoded strengthSentenceMap 사용 |
| `competencyTags` | `buildResumeSkillItems(result)` | strengths 하드코딩 |
| `collaborationTags` | (없음) | 미반영 |
| `evidenceTags` | (없음) | 미반영 |
| `confidenceLevel` | (없음) | 미반영 |
| `generationMethod` | (없음) | 항상 deterministic이지만 명시 없음 |

---

## 6. ResumeDraftViewModel Contract

이력서 보기 화면이 소비하는 최종 ViewModel.
**현재 PmMvpView.jsx 렌더링 기준 (L427-408).**

```
ResumeDraftViewModel {
  // 프로필
  profile: {
    name:     string    // 현재 하드코딩 "백강산" — 교체 대상
    contact:  string    // 현재 하드코딩 "010-0000-0000 | email@example.com | 서울"
    portfolio: string   // 현재 하드코딩 "portfolio.example.com"
  }

  // 소개 섹션
  headline:           string    // currentCareerRoleLabel || "고객운영 / 품질운영"
  introParagraphs:    string[]  // [result.summary || strengthDescription, result.resumeLine || fallback]

  // 경력 섹션
  experiences: [{
    companyName:      string    // 현재 하드코딩 "OO회사"
    roleTitle:        string    // headline
    period:           string    // 현재 하드코딩 "2023.03 ~ 현재"
    description:      string    // 현재 하드코딩
    bullets:          string[]  // buildResumeExperienceBullets 결과
  }]

  // 성과 섹션
  achievementHighlights: {
    primarySentence:  string    // result.resumeLine || 하드코딩 fallback
    improvementNotes: string[]  // buildImprovementNotes 결과
  }

  // 역량 섹션
  skillTags:          string[]  // buildResumeSkillItems 결과

  // 업데이트 프리뷰 (이번 업데이트 반영 보기)
  updatePreview: {
    beforeText:       string    // sourcePreview (최대 180자)
    afterSentence:    string    // result.resumeLine
    hasBeforeText:    boolean
    hasAfterSentence: boolean
    sourceRecord:     WorkRecordDraft | null  // 현재 lastInput
    updatedAt:        string | null           // 현재 없음 — 추후 추가
  }
}
```

---

## 7. Field Mapping Table

| From | Field | To | Field | Mapping Rule | Current Status | Risk |
|---|---|---|---|---|---|---|
| WorkRecordDraft | `text` | ResumeUpdateCandidate | `sourceText` | 직접 복사 | O (buildDemoResult L160) | 없음 |
| WorkRecordDraft | `text` | ResumeDraftViewModel | `updatePreview.beforeText` | 최대 180자 truncate | O (sourcePreview) | 없음 |
| WorkRecordDraft | `projectActions` | ResumeUpdateCandidate | `resumeSentence` | template 조합 | 부분 O (buildDemoResult L175) | projectResult 없으면 fallback 상수 |
| WorkRecordDraft | `projectResult` | ResumeUpdateCandidate | `resumeSentence` | template 조합 | 부분 O (buildDemoResult L175) | 위 동일 |
| WorkRecordDraft | `roleTags` | StoredWorkRecord | `strength_tags` | 직접 저장 | O (_persistWorkRecord) | 이력서 화면에는 미반영 |
| WorkRecordDraft | `collaborationTags` | StoredWorkRecord | `skill_tags` | 직접 저장 | O (_persistWorkRecord) | 이력서 화면에는 미반영 |
| WorkRecordDraft | `projectActions` | StoredWorkRecord | `task` | 직접 저장 | O (_persistWorkRecord) | — |
| WorkRecordDraft | `projectResult` | StoredWorkRecord | `result` | 직접 저장 | O (_persistWorkRecord) | HomeDashboard에서 reflectedSentence fallback으로 사용 |
| StoredWorkRecord | `raw_payload` | WorkRecordDraft | (전체) | JSON parse | 가능 (구조 확인) | 복구 함수 없음 — 작성 필요 |
| StoredWorkRecord | `result` | ResumeUpdateCandidate | `resumeSentence` | fallback chain | HomeDashboard만 O | PmMvpView adaptWorkRecordRow에서 누락 |
| StoredWorkRecord | `description` | ResumeUpdateCandidate | `sourceText` | 직접 매핑 | HomeDashboard만 O | PmMvpView adaptWorkRecordRow에서 `summary`로만 부분 매핑 |
| ResumeUpdateCandidate | `resumeSentence` | ResumeDraftViewModel | `updatePreview.afterSentence` | 직접 | O (result.resumeLine) | 이름 불일치 (resumeLine vs resumeSentence) |
| ResumeUpdateCandidate | `resumeSentence` | ResumeDraftViewModel | `introParagraphs[1]` | 직접 | O (introDetail) | — |
| ResumeUpdateCandidate | `achievementBullets` | ResumeDraftViewModel | `experiences[0].bullets` | 직접 | O (resumeExperienceBullets) | strengthSentenceMap 하드코딩 |
| ResumeUpdateCandidate | `competencyTags` | ResumeDraftViewModel | `skillTags` | 직접 | O (resumeSkillItems) | strengths 하드코딩 |
| MockRecord | `reflectedSentence` | ResumeDraftViewModel | (미연결) | — | X | mock data와 이력서 화면 미연결 |

---

## 8. Naming Decision

### 현황 조사 결과

코드에서 발견된 이름들:

| 이름 | 위치 | 역할 |
|---|---|---|
| `reflectedSentence` | homeDashboardMock.js, adaptWorkRecordRowForHomeDashboard, PASSMAP_DEMO_RANGE_RECORDS | CalendarRecord shape의 "이력서 반영 문장" 필드 |
| `resumeSentence` | HomeDashboard adaptWorkRecordRowForHomeDashboard L256 fallback chain (`raw.resumeSentence`) | raw_payload 안에 있을 경우의 alias |
| `resumeLine` | buildDemoResult 출력, buildResumeExperienceBullets, PmMvpView 렌더링 | DemoResult shape의 "이력서 문장" 필드 |
| `result` | StoredWorkRecord DB column | projectResult 원문 (raw input) |

### 결정

1. **`resumeSentence` = 표준 필드명** (CalendarRecord / ResumeUpdateCandidate에서 사용)
   - 의미가 명확하고 사용자-facing 이력서 문장임을 표현
   - `raw_payload.resumeSentence`에도 이미 존재하는 alias

2. **`reflectedSentence` = legacy alias** (homeDashboardMock.js 및 기존 mock 호환용)
   - mock 데이터와 HomeDashboard 기존 렌더링에서 사용 중
   - 교체 시 HomeDashboard adapter의 fallback chain(`raw.reflectedSentence || raw.resumeSentence || row.result`)을 유지하면 하위 호환 보장

3. **`resumeLine` = DemoResult / ResumeUpdateCandidate 내부 출력 필드명 유지**
   - `buildDemoResult` 반환값 및 PmMvpView 렌더링에서 광범위하게 사용
   - 이 계층의 이름을 지금 바꾸면 회귀 위험이 큼
   - 향후 `ResumeUpdateCandidate.resumeSentence`와 `buildDemoResult.resumeLine`을 alias로 취급

4. **`StoredWorkRecord.result` = raw input 원문** (변경 불가)
   - DB 컬럼명. migration 없이 변경 불가
   - `HomeDashboard.adaptWorkRecordRowForHomeDashboard`에서 `|| row.result` fallback으로 `resumeSentence` 복구에 활용 중

### Adapter 통일 방향

`PmMvpView.adaptWorkRecordRow`의 `reflectedSentence: ""`는 버그다.
다음 패치에서 HomeDashboard adapter 기준(`raw.reflectedSentence || raw.resumeSentence || row.result`)으로 통일해야 한다.
두 adapter를 별도 유지하거나, 공통 유틸 함수로 분리하는 방향 모두 가능하다.

---

## 9. Non-goals

이번 계약 문서에서 설계하지 않는 것:

- AI 프롬프트 설계
- Supabase DB migration (컬럼 추가/변경)
- Supabase RLS 변경
- App.jsx 대규모 구조 변경
- 이력서 UI 리디자인
- 저장 정책 변경
- localStorage / IndexedDB 도입
- 복수 기록 누적 UI 상세 설계

---

## 10. Recommended Next Patch Order

계약 고정 후 권장 코드 패치 순서:

### P-1. Adapter field normalization (우선순위 최상)

**대상**: `PmMvpView.adaptWorkRecordRow` (L285-299)

변경 내용:
- `reflectedSentence: ""` → `String(raw.reflectedSentence || raw.resumeSentence || row.result || "").trim()`
- `workTags` 필드 추가 (HomeDashboard adapter와 통일)

리스크: 낮음. CalendarCard 표시 개선, 이력서 화면에 직접 영향 없음.

### P-2. WorkRecordDraft 복구 함수 작성

**대상**: 신규 유틸 함수 (별도 파일 또는 PmMvpView 내부)

변경 내용:
- `StoredWorkRecord row → WorkRecordDraft` 복구 함수
- `raw_payload`에서 원본 필드 복원 + top-level fallback

리스크: 낮음 (신규 순수 함수).

### P-3. Supabase 최신 기록 → ResumeUpdateCandidate 복구

**대상**: PmMvpView (mode="preview") mount 시

변경 내용:
- 로그인 사용자 + `pmLastInput === null`이면 최신 StoredWorkRecord를 WorkRecordDraft로 복구
- 복구된 값을 `lastInput` state에 반영

리스크: 중간 (P-2 선행 필요).

### P-4. 이력서 섹션 실제 데이터 반영

**대상**: `buildResumeExperienceBullets`, `buildResumeSkillItems`

변경 내용:
- hardcoded `strengthSentenceMap` → input 기반 동적 생성
- `competencyTags` (collaborationTags + roleTags 기반)으로 역량 섹션 채우기

리스크: 중간 (이력서 화면 표시 변경).

### P-5. AI generation hook (최후)

**대상**: `buildDemoResult` 또는 신규 `generateResumeUpdateCandidate` 함수

변경 내용:
- `generationMethod: "deterministic"` → `"ai_generated"` 교체 지점
- `resumeSentence` 필드 하나만 AI로 교체 가능하도록 interface 유지

리스크: P-1~P-4 완료 후에만 진행. 계약 없이 도입 금지.

---

## 11. Known Bugs (수정 전 추적)

| # | 위치 | 버그 | 영향 |
|---|---|---|---|
| B-1 | PmMvpView.adaptWorkRecordRow L292 | `reflectedSentence: ""` 하드코딩 | CalendarCard에서 로그인 사용자의 저장 기록 이력서 문장 미표시 |
| B-2 | PmMvpView.buildDemoResult L207 | `strengths` 하드코딩 | 이력서 경력 불릿/역량 섹션이 입력 내용과 무관하게 고정 |
| B-3 | PmMvpView (resume 화면 profile) | 이름/연락처/포트폴리오 하드코딩 | "백강산", "portfolio.example.com" 항상 노출 |
| B-4 | PmMvpView.buildDemoResult L217-224 | `readiness` 수치 하드코딩 | "PM 준비도 48%" 항상 동일 |
| B-5 | App.jsx pmLastInput | in-session 전용 — 새로고침 유실 | 로그인 사용자도 새로고침 시 이력서 내용 리셋 |
