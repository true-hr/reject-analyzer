# Resume AI Generation Hook Plan

**Status**: P-7-0 설계 조사 (2026-04-29)
**Runtime changes**: 없음 (설계 문서 전용)
**Scope**: 기록 기반 이력서 문장 AI 생성 hook 위치, 조건, 저장 계약 설계

---

## 1. 목적

P-6 시리즈에서 완성된 deterministic → user_edited 저장 흐름 위에,
AI가 생성한 이력서 문장 후보를 preview하고 사용자가 확인 후 저장할 수 있는 최소 경로를 설계한다.

원칙:
- AI 결과 자동 저장 금지
- AI는 원문에 없는 수치/성과/직무명 생성 금지
- AI 결과는 preview 상태로만 표시, 저장은 사용자 명시 버튼
- 사용자가 AI 결과를 수정 후 저장하면 generationMethod = "user_edited"
- consultant_reviewed는 별도 workflow 전까지 사용 금지

---

## 2. Current Closed Loop

P-6 완료 시점 기준 닫힌 데이터 흐름:

```
WorkRecordDraft (PmRecordInput 입력)
  └─ _persistWorkRecord → StoredWorkRecord (Supabase work_records)
       └─ buildResumeUpdateCandidateFromRecord
            → ResumeUpdateCandidate {
                resumeSentence,
                confidenceLevel,        // "low" | "medium" | "none"
                generationMethod,       // "deterministic" | "user_edited"
                candidateStatus,        // "draft" | "user_edited"
                sourceRecordId,
                sourceRecord,
                ...
              }
            └─ buildResumeDraftViewModel → ResumeDraftViewModel
                 └─ PmMvpView preview JSX

저장 경로:
  A. safe 경로: confidenceLevel="medium" + !isDraftSentence
     → updateWorkRecordWithCandidate(id, rawPayload, { generationMethod:"deterministic", candidateStatus:"draft" })

  B. user_edited 경로: 사용자가 textarea에 직접 수정
     → updateWorkRecordWithCandidate(id, rawPayload, { generationMethod:"user_edited", candidateStatus:"user_edited" })

복구 경로:
  raw_payload.resumeUpdateCandidate (nested canonical)
    + raw_payload.resumeSentence (flat alias)
  → buildResumeUpdateCandidateFromRecord fallback chain
  → generationMethod/candidateStatus 복구 ✓ (P-6-3B 보정 완료)
```

---

## 3. Current Candidate Sources

| Source | sourceRecordId | AI 생성 대상 여부 | 저장 가능 여부 | 비고 |
|--------|---------------|-----------------|--------------|------|
| `externalLastInput` (in-session 미저장) | null | **금지** | 금지 | DB row 없음, 저장 anchor 없음 |
| `selectedStoredResumeCandidate` (selector 선택) | 존재 | **가능** | 가능 | 이 경우가 주 대상 |
| `resumeUpdateCandidates[0]` (최신 저장 기록) | 존재 | **가능** | 가능 | 기본 fallback |
| `user_edited` candidate (이미 저장됨) | 존재 | 낮은 필요성 | 가능 | 이미 사용자 작성 완료 |
| `deterministic fallback` candidate | 존재 | **가능** (주요 타겟) | 수정 전 금지 | low confidence → AI가 개선 대상 |

**핵심**: `externalLastInput` 전용 후보는 sourceRecordId가 없으므로 AI 생성도 저장도 금지.
DB에 저장된 기록(`sourceRecordId` 존재)만 AI 생성 대상.

---

## 4. AI Generation Options

### A안 — PmMvpView 내부에서 직접 AI API 호출

```
PmMvpView.handleGenerateResumeSentence()
  └─ fetch("/api/resume-generate", { body: promptPayload })
```

| 항목 | 평가 |
|------|------|
| MVP 난이도 | 낮음 |
| API key 보안 | **위험** — 클라이언트가 직접 API 호출하면 endpoint 노출, key는 서버에 있어도 CORS 취약 |
| 프론트엔드 복잡도 | 높음 — PmMvpView에 async 생성 상태 추가 |
| 저장 구조 호환성 | 호환 |
| user_edited 충돌 위험 | 낮음 |
| 확장성 | 낮음 — 컴포넌트 비대화 |
| **지금 추천 여부** | **부분 추천** — endpoint 호출 위치로는 OK, 하지만 상태 관리는 분리 권장 |

### B안 — 별도 lib helper 생성

```
src/lib/resume/generateResumeSentence.js
  export async function generateResumeSentence(promptPayload)
  └─ fetch("/api/resume-generate", ...)
  └─ return { resumeSentence, warnings }
```

| 항목 | 평가 |
|------|------|
| MVP 난이도 | 낮음~중간 |
| API key 보안 | OK — 서버 사이드 endpoint 경유 |
| 프론트엔드 복잡도 | 중간 — helper 분리로 PmMvpView 경량화 |
| 저장 구조 호환성 | 호환 |
| user_edited 충돌 위험 | 없음 |
| 테스트 가능성 | **우수** — pure async function, mock 가능 |
| **지금 추천 여부** | **P-7-2에서 추천** |

### C안 — Vercel API Endpoint 경유

```
api/resume-generate.js   (신규, GEMINI_API_KEY 사용)
  POST /api/resume-generate
  body: { promptPayload }
  response: { ok, resumeSentence, warnings }
```

현재 `api/enhance.js`가 동일 패턴:
- `GEMINI_API_KEY` 서버 사이드 env var 사용
- CORS 화이트리스트 적용
- Vercel serverless function

| 항목 | 평가 |
|------|------|
| MVP 난이도 | 중간 — `api/enhance.js` 패턴 복사 수준 |
| API key 보안 | **우수** — key가 클라이언트에 절대 노출 안 됨 |
| 프론트엔드 복잡도 | 낮음 — 단순 fetch |
| 저장 구조 호환성 | 호환 |
| 확장성 | **우수** — rate limit, logging, input sanitize 서버에서 처리 가능 |
| B2B 데이터 품질 | 우수 — 서버에서 prompt 고정, 클라이언트 prompt 조작 불가 |
| **지금 추천 여부** | **P-7-2에서 채택 권장** |

### D안 — Prompt Payload Builder만 먼저 생성 (호출 없음)

```
src/lib/resume/buildResumeSentencePromptPayload.js
  export function buildResumeSentencePromptPayload(candidate, options)
  └─ return { systemPrompt, userPrompt, constraints }
  // 실제 AI 호출 없음, 순수 데이터 변환
```

| 항목 | 평가 |
|------|------|
| MVP 난이도 | **가장 낮음** |
| API key 보안 | 무관 |
| 프론트엔드 복잡도 | 없음 |
| 저장 구조 호환성 | 호환 |
| 테스트 가능성 | **우수** — 순수 함수, 단위 테스트 가능 |
| 리스크 | 없음 |
| **지금 추천 여부** | **P-7-1에서 즉시 채택** — API 호출 없이 prompt 설계 검증 가능 |

---

## 5. Recommended MVP Direction

**단계적 구현 권장안:**

| 단계 | 작업 | 내용 |
|------|------|------|
| **P-7-1** | Prompt Payload Builder | `src/lib/resume/buildResumeSentencePromptPayload.js` 순수 함수 생성. AI 호출 없음. |
| **P-7-2** | Vercel API Endpoint | `api/resume-generate.js` 생성. `GEMINI_API_KEY` 사용. `api/enhance.js` 패턴 참조. |
| **P-7-3** | PmMvpView 연결 | "AI 문장 생성" 버튼 + aiGeneratedSentence state. 결과는 preview만, 저장은 버튼 클릭 시. |
| **P-7-4** | 저장 연결 | AI 결과 저장 시 `generationMethod: "ai_generated"`. 수정 후 저장 시 "user_edited". |

**지금 채택 금지:**
- D안을 넘어서는 AI 호출 구현 (API key 관리, rate limit 미설계)
- 자동 저장
- DB migration
- 컨설턴트 검수 workflow

---

## 6. Proposed AI Candidate Contract

AI 생성 결과 ResumeUpdateCandidate 확장 shape:

```js
{
  // 기존 필드
  resumeSentence:     "고객 문의 유형을 분류하고 반복 문의 대응 기준을 정리했습니다.",
  achievementBullets: [],
  competencyTags:     [],
  collaborationTags:  [],
  evidenceTags:       [],
  sourceRecordId:     "uuid",
  sourceTrack:        "weekly",

  // AI 생성 전용 필드
  confidenceLevel:    "medium",         // AI 생성이므로 medium (검수 전 high 금지)
  generationMethod:   "ai_generated",   // 저장 시 이 값으로 기록
  candidateStatus:    "draft",          // 저장 전 preview 상태

  // 메타데이터
  generatedAt:        "2026-04-29T...", // ISO 타임스탬프
  warnings:           [],               // 품질 경고 목록 (아래 참조)
}
```

**warnings 후보:**

| 코드 | 의미 |
|------|------|
| `"insufficient_result_evidence"` | 결과 근거 부족 (result 필드 비어 있음) |
| `"missing_metric"` | 수치 없이 성과 주장 |
| `"too_generic"` | 너무 일반적인 표현 |
| `"needs_user_review"` | AI가 불확실 판단, 사용자 검토 필요 |

---

## 7. Prompt Input Contract

AI에 넘겨야 할 입력 필드 (buildResumeSentencePromptPayload 출력):

### 필수 입력

```js
{
  sourceText:             "업무 기록 원문 (text 또는 projectActions + projectResult 결합)",
  projectActions:         "수행 내용 (project track)",
  projectResult:          "결과 (project track)",
  roleTags:               ["운영관리", "문서화"],
  collaborationTags:      ["QA팀", "개발팀"],
  resultTags:             ["이슈감소", "흐름개선"],
  sourceTrack:            "weekly | project",
  existingResumeSentence: "기존 deterministic 문장 (개선 힌트용)",
  userCareerRole:         "고객운영 / 품질운영",
}
```

### 선택 입력

```js
{
  targetResumeSection: "experience | achievement | summary",
  maxLength:           80,   // 글자 수 제한
}
```

### AI 출력 금지 사항

- 원문에 없는 수치 ("30% 개선", "월 100건 처리" 등)
- 원문에 없는 성과 ("매출 증가", "비용 절감")
- 과장된 리더십 표현 ("주도적으로 이끌어", "혁신적으로")
- 근거 없는 결과 연결 ("결과적으로 효율이 향상되었습니다")
- 자기소개서 어투 ("저는 ~한 사람입니다")
- 80자 초과 단일 문장

---

## 8. Save Policy

| 상황 | generationMethod | candidateStatus | 저장 가능 여부 |
|------|-----------------|----------------|--------------|
| AI 결과 그대로 저장 | `"ai_generated"` | `"draft"` | 가능 (사용자 버튼) |
| AI 결과 수정 후 저장 | `"user_edited"` | `"user_edited"` | 가능 (사용자 버튼) |
| AI 결과 자동 저장 | — | — | **금지** |
| deterministic fallback 그대로 저장 | — | — | **금지** (low confidence) |
| `externalLastInput` 기반 AI 생성 | — | — | **금지** (sourceRecordId 없음) |

**복구 경로**: `updateWorkRecordWithCandidate`를 그대로 사용.
신규 helper 불필요. generationMethod = "ai_generated"만 추가.

**candidateStatus 흐름:**

```
저장 전:  preview (화면에만 표시, DB 미저장)
저장 후:  "draft"          ← AI 결과 그대로
수정 후:  "user_edited"    ← 사용자 수정
검수 후:  "consultant_reviewed" ← 미래 workflow (현재 금지)
```

---

## 9. Recommended P-7-1 Patch

**목표**: `buildResumeSentencePromptPayload(candidate, options)` 순수 함수 생성.
AI 호출 없음. PmMvpView 연결 없음.

**파일**: `src/lib/resume/buildResumeSentencePromptPayload.js` (신규)

**입력**: `ResumeUpdateCandidate` + `options`
**출력**: `{ systemPrompt, userPrompt, constraints, inputSummary }`

**검증 방법**:
- 단위 테스트 또는 수동 console 확인
- weekly track / project track 각각 다른 prompt 생성 확인
- low confidence candidate 입력 시 `existingResumeSentence`가 "기록 기반 초안:"이면 clear하고 전달
- 빈 sourceText 입력 시 에러 throw

---

## 10. Do Not Do Yet

| 항목 | 이유 |
|------|------|
| AI API 호출 구현 | P-7-2 이후 |
| `api/resume-generate.js` 생성 | P-7-2 이후 |
| PmMvpView "AI 문장 생성" 버튼 | P-7-3 이후 |
| 자동 저장 | 영구 금지 |
| DB migration | 불필요 (raw_payload.resumeUpdateCandidate 확장으로 충분) |
| `consultant_reviewed` status 사용 | 검수 workflow 설계 전까지 금지 |
| B2B 후보자 검색 반영 | 별도 SPEC |
| 이력서 전체 문서 AI 생성 | 별도 SPEC |
| 미로그인 사용자 AI 생성 | API 비용/남용 우려, 로그인 필수 |

---

## Appendix: 기존 API 인프라

현재 `api/enhance.js`가 Vercel serverless function 패턴의 선례:
- `GEMINI_API_KEY` env var (서버 사이드 only)
- `Gemini 2.5 Flash` 모델
- CORS 화이트리스트: `localhost:5173`, `true-hr.github.io`
- POST only, body: JSON

`api/resume-generate.js`는 이 패턴을 그대로 복사해 prompt만 교체하면 됨.
별도 AI SDK 도입 불필요.

---

## Deferred Note (2026-04-29)

**P-7-1 이후 구현은 현재 보류.**

보류 이유:
- MVP 핵심은 AI보다 "기록 → 이력서 저장/복구" 루프 안정화
- user_edited 저장/복구 루프가 먼저 검증되어야 함
- AI를 먼저 붙이면 low confidence / ai_generated / user_edited 경로가 섞여 데이터 품질 리스크가 커짐

재개 기준:
- P-7-1: `buildResumeSentencePromptPayload.js` prompt payload builder부터 시작
- P-7-2: 서버사이드 Vercel endpoint 방향 확정 후 구현
- P-7-3: "AI 문장 생성" 버튼 UI 연결
- AI 결과 자동 저장 금지 원칙 재개 시에도 유지
- AI 결과는 preview로만 표시, 저장은 사용자가 명시적으로 수행
- 사용자가 AI 결과를 수정하면 `generationMethod: "user_edited"` 로 저장
