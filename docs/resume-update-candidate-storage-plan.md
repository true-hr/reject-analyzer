# Resume Update Candidate Storage Plan

**Status**: P-6-0 설계 조사 (2026-04-29)
**Runtime changes**: 없음 (설계 문서 전용)
**Scope**: ResumeUpdateCandidate 저장·복구·수정·검수 구조 설계

---

## 1. 목적

기록이 이력서 문장 후보로 전환된 뒤 저장·복구·수정·검수될 수 있는 구조를 정의한다.

현재 MVP는 `buildResumeUpdateCandidateFromRecord`가 runtime에서 후보를 생성하고,
사용자가 새로고침하면 in-session 값만 유실되는 상태다.
이를 안정적으로 복구하고, 향후 AI 생성·사용자 수정·컨설턴트 검수까지 확장할 수 있는
최소 저장 전략을 결정한다.

---

## 2. Current State

### 현재까지 구현된 흐름

```
WorkRecordDraft (PmRecordInput 입력)
  └─ _persistWorkRecord → Supabase work_records (raw_payload + top-level columns)
  └─ App.jsx pmLastInput (in-session state bridge)
       └─ externalLastInput prop → PmMvpView

StoredWorkRecord (Supabase row)
  └─ buildResumeUpdateCandidateFromRecord → ResumeUpdateCandidate (in-memory)
       └─ buildResumeDraftViewModel → ResumeDraftViewModel
            └─ PmMvpView preview JSX
```

### 아직 저장되지 않는 값

| 값 | 현재 위치 | 저장 여부 |
|---|---|---|
| `resumeSentence` (deterministic) | in-memory만 | **미저장** |
| `achievementBullets` | in-memory만 | **미저장** |
| `competencyTags` / `collaborationTags` | Supabase `skill_tags`/`strength_tags`에 부분 저장 | 부분 |
| `confidenceLevel` | in-memory만 | **미저장** |
| `generationMethod` | in-memory만 (항상 "deterministic") | **미저장** |
| `candidateStatus` | 개념 없음 | **미저장** |

---

## 3. Current Storage Surface

### work_records top-level 컬럼 (현재)

| 컬럼 | 타입 | 현재 저장 내용 | resumeSentence 관련성 |
|---|---|---|---|
| `id` | UUID | auto | — |
| `created_at` | timestamp | auto | — |
| `updated_at` | timestamp | updateWorkRecord 시 | — |
| `user_id` | UUID | Supabase auth user.id | — |
| `record_date` | string | input.startDate \|\| today | — |
| `title` | string | projectName \|\| text 첫 줄 | — |
| `description` | string\|null | input.text 전체 | sourceText 소스 |
| `task` | string\|null | input.projectActions | resumeSentence 핵심 재료 |
| `result` | string\|null | input.projectResult | resumeSentence 핵심 재료 |
| `project_name` | string\|null | input.projectName | — |
| `strength_tags` | string[] | input.roleTags | competencyTags 소스 |
| `skill_tags` | string[] | input.collaborationTags | collaborationTags 소스 |
| `work_type` | enum | "weekly"\|"project" | — |
| `source` | string | "manual" | — |
| `raw_payload` | jsonb | WorkRecordDraft 전체 | 현재 resumeSentence 없음 |

### raw_payload 현재 구조

```
raw_payload = WorkRecordDraft {
  track, text, roleTags, collaborationTags, resultTags,
  recordType, startDate, endDate, projectName, projectPeriod,
  projectGoal, projectContext, projectActions, projectResult, projectInsight
}
```

`raw_payload`에 `resumeSentence` 계열 필드 없음. 순수 input 원본.

### 현재 `workRecordRepository.js` CRUD

- `createWorkRecord(record)` — INSERT
- `updateWorkRecord(id, patch)` — PATCH (existing `updateWorkRecord` 이미 존재)
- `listWorkRecords({ limit, offset })` — SELECT *
- `deleteWorkRecord(id)` — DELETE

`updateWorkRecord`는 이미 구현됨. `patch` 인자를 넘기면 어떤 필드도 수정 가능.

---

## 4. Storage Options

### A안 — raw_payload 안에 후보 필드 추가

저장 위치: `work_records.raw_payload.resumeUpdateCandidate` (nested object)

```json
{
  "raw_payload": {
    "track": "project",
    "text": "...",
    "projectActions": "...",
    "projectResult": "...",
    "resumeUpdateCandidate": {
      "resumeSentence": "...",
      "achievementBullets": [],
      "competencyTags": [],
      "collaborationTags": [],
      "evidenceTags": [],
      "confidenceLevel": "medium",
      "generationMethod": "deterministic",
      "candidateStatus": "draft",
      "updatedAt": "2026-04-29T..."
    }
  }
}
```

| 기준 | 평가 |
|---|---|
| MVP 적용 난이도 | **낮음** — `updateWorkRecord(id, { raw_payload: merged })` 패턴 |
| DB migration 필요 | **없음** — raw_payload는 JSONB, 기존 컬럼 |
| work_records 호환성 | **높음** — 기존 로우 영향 없음 |
| AI/수정/검수 확장성 | **중간** — raw_payload 내 nested 구조로 관리 가능하나 쿼리 복잡 |
| 데이터 중복 위험 | **낮음** — resumeSentence만 추가, input 필드 중복 없음 |
| 이력서 보기 복구 안정성 | **높음** — 기존 raw_payload 복구 로직 확장만 필요 |
| B2B 후보자 데이터화 | **약함** — JSONB 내부 필드는 풀텍스트 검색/정렬 어려움 |
| 지금 당장 추천 | **MVP는 YES** |

**위험**: raw_payload 전체를 읽고 병합 후 업데이트해야 함 (`{ ...existingPayload, resumeUpdateCandidate: ... }`). partial update 불가.

---

### B안 — work_records top-level 컬럼 추가

저장 위치: `work_records.resume_sentence`, `work_records.generation_method`, `work_records.candidate_status`

| 기준 | 평가 |
|---|---|
| MVP 적용 난이도 | **중간** — DB migration 필요 |
| DB migration 필요 | **있음** — ALTER TABLE 또는 Supabase 대시보드에서 컬럼 추가 |
| work_records 호환성 | **높음** — top-level 컬럼, 쿼리 깔끔 |
| AI/수정/검수 확장성 | **높음** — 컬럼 기반이라 인덱스·정렬·필터 가능 |
| 데이터 중복 위험 | **낮음** |
| 이력서 보기 복구 안정성 | **높음** |
| B2B 후보자 데이터화 | **중간** — 단일 이력서 문장만 저장, 버전 관리 불가 |
| 지금 당장 추천 | **migration 부담으로 MVP에선 NOT NOW** |

**위험**: Supabase 스키마 변경 필요. 기존 RLS 정책 검토 필요. NULL 허용 설계 필요.

---

### C안 — resume_update_candidates 별도 테이블

저장 위치: 신규 `resume_update_candidates` 테이블

```sql
resume_update_candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users,
  work_record_id  UUID REFERENCES work_records(id),
  resume_sentence TEXT,
  achievement_bullets JSONB,
  competency_tags TEXT[],
  collaboration_tags TEXT[],
  evidence_tags TEXT[],
  confidence_level TEXT,   -- low | medium | high
  generation_method TEXT,  -- deterministic | ai_generated | user_edited | consultant_reviewed
  candidate_status TEXT,   -- draft | user_edited | consultant_reviewed | archived
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

| 기준 | 평가 |
|---|---|
| MVP 적용 난이도 | **높음** — 신규 테이블, repository, RLS 설계 필요 |
| DB migration 필요 | **있음** — CREATE TABLE, RLS 정책, 인덱스 |
| work_records 호환성 | **중간** — work_record_id FK로 연결, 기존 flow 변경 없음 |
| AI/수정/검수 확장성 | **매우 높음** — 1개 기록에 복수 후보 버전 저장 가능 |
| 데이터 중복 위험 | **없음** — 명확히 분리 |
| 이력서 보기 복구 안정성 | **높음** — 독립 조회 가능 |
| B2B 후보자 데이터화 | **최고** — 후보별 상태·버전·검수 이력 관리 최적 |
| 지금 당장 추천 | **장기 YES, MVP는 NOT NOW** |

**위험**: MVP에서 테이블 설계를 서두르면 나중에 schema 변경이 오히려 부담.
AI 도입 전에 필드 설계를 확정하기 어렵다.

---

### D안 — MVP 단계 저장 없음, runtime candidate만 유지

저장 없음. 현재 상태 유지.

| 기준 | 평가 |
|---|---|
| MVP 적용 난이도 | **없음** |
| DB migration 필요 | **없음** |
| work_records 호환성 | **완전** |
| AI/수정/검수 확장성 | **없음** |
| 데이터 중복 위험 | **없음** |
| 이력서 보기 복구 안정성 | **낮음** — 새로고침 시 유실 (현재 B-5 버그와 동일) |
| B2B 후보자 데이터화 | **불가** |
| 지금 당장 추천 | 임시 유지는 가능하나 다음 단계 진입 어려움 |

**한계**:
- 사용자가 이력서 보기에서 문장을 확인했더라도 새로고침하면 리셋
- `resumeSentence`의 `generationMethod`/`candidateStatus` 이력 불가
- A안 또는 B안으로의 진입을 의도적으로 지연하는 것뿐이며, 언젠가는 저장 필요

---

## 5. Recommendation

### 현시점 추천: A안 (raw_payload 내 후보 필드)

**MVP 저장 전략** (P-6-1 즉시 구현 가능):
- `updateWorkRecord(id, { raw_payload: { ...existingPayload, resumeUpdateCandidate: candidateObject } })`
- migration 없음
- 기존 `workRecordRepository.updateWorkRecord` 그대로 활용
- `buildResumeUpdateCandidateFromRecord`가 이미 `raw_payload.resumeSentence`를 읽는 fallback chain 보유

**장기 구조** (P-8 이후 검토):
- C안 (`resume_update_candidates` 별도 테이블)
- AI 도입 및 컨설턴트 검수 workflow 설계 후 테이블 확정
- A안 데이터를 C안으로 마이그레이션하는 one-shot script는 단순함 (raw_payload.resumeUpdateCandidate → 신규 테이블 row)

### 선택 근거

1. `raw_payload`는 이미 JSONB이고 `updateWorkRecord`가 존재 — 추가 인프라 없음
2. `buildResumeUpdateCandidateFromRecord`의 fallback chain이 `raw_payload.resumeSentence`를 이미 읽음 — 복구 로직 재사용 가능
3. B2B 후보자 데이터 필요성은 실제 AI 도입 이후 확인 가능 — 지금 과설계 불필요
4. `candidateStatus: "draft"` → `"user_edited"` 추적은 raw_payload 내에서도 충분히 가능

---

## 6. Proposed Minimal Contract

### raw_payload 내 추가 구조

```js
// raw_payload.resumeUpdateCandidate — A안 MVP 저장 계약
{
  resumeSentence:      string,           // 이력서 핵심 문장
  achievementBullets:  string[],         // 경력/성과 불릿 (최대 4개)
  competencyTags:      string[],         // 역량 태그
  collaborationTags:   string[],         // 협업 맥락 태그
  evidenceTags:        string[],         // 근거 태그 (resultTags 기반)
  confidenceLevel:     "low" | "medium" | "high",
  generationMethod:    "deterministic" | "ai_generated" | "user_edited" | "consultant_reviewed",
  candidateStatus:     "draft" | "user_edited" | "consultant_reviewed" | "archived",
  sourceRecordId:      string | null,    // work_records.id
  updatedAt:           string,           // ISO timestamp
}
```

### candidateStatus 의미

| 값 | 의미 | 진입 조건 |
|---|---|---|
| `draft` | deterministic 초안 | 첫 저장 시 기본값 |
| `user_edited` | 사용자가 직접 수정 | 편집 UI 저장 시 |
| `consultant_reviewed` | 컨설턴트 검수 완료 | 컨설턴트 workflow 완료 시 (미구현) |
| `archived` | 비활성 (이전 버전) | 신규 후보 생성 시 이전 버전 보관 |

### generationMethod 의미

| 값 | 의미 |
|---|---|
| `deterministic` | template 기반 생성 (현재 상태) |
| `ai_generated` | AI 생성 문장 (미구현) |
| `user_edited` | 사용자가 직접 수정한 문장 |
| `consultant_reviewed` | 컨설턴트가 확정한 문장 |

---

## 7. Migration Risk

### DB migration 없이 A안으로 갈 경우 한계

| 한계 | 영향 | 우회 가능 여부 |
|---|---|---|
| raw_payload 전체 조회 필요 | 수정 시 기존 payload를 읽고 병합해야 함 | YES — updateWorkRecord + spread |
| JSONB 내부 필드 인덱싱 불가 | `resumeSentence` 기준 검색·정렬 불가 | MVP에서는 미필요 |
| 복수 후보 버전 저장 불가 | 1개 기록에 1개 후보만 유지 (overwrite) | MVP에서는 허용 |
| raw_payload 구조 변경 시 하위호환 | resumeUpdateCandidate 키 추가는 additive — 기존 코드 영향 없음 | YES — optional key |

### B안/C안 migration 진행 시 리스크

| 리스크 | 수준 | 설명 |
|---|---|---|
| Supabase schema lock | 중간 | 운영 중 ALTER TABLE은 Row 수 증가 시 lock 가능 |
| RLS 정책 오염 | 중간 | 신규 컬럼/테이블에 user_id 기반 RLS 누락 시 데이터 노출 |
| 기존 listWorkRecords SELECT * | 낮음 | 컬럼 추가 시 SELECT *는 신규 컬럼도 반환 — resume_sentence null 처리 필요 |
| 테이블 설계 조기 확정 | 높음 | AI 도입 전 C안 테이블 설계는 나중에 schema 변경 재발생 위험 |

**결론**: migration은 AI 도입 직전 또는 컨설턴트 workflow 직전에 진행하는 것이 최적.
현재 A안으로 MVP를 안정화하고, 저장 패턴이 확정된 뒤 마이그레이션한다.

---

## 8. Recommended Next Patch (P-6-1)

### 옵션 1 (추천) — `updateWorkRecordWithCandidate` helper 추가

**파일**: `src/lib/workRecordRepository.js` (append-only, 기존 CRUD 변경 없음)

```js
// 추가할 helper — 기존 raw_payload를 병합하여 후보만 업데이트
export async function updateWorkRecordWithCandidate(id, existingRawPayload, candidate) {
  const merged = { ...(existingRawPayload ?? {}), resumeUpdateCandidate: candidate };
  return updateWorkRecord(id, { raw_payload: merged });
}
```

**PmMvpView.jsx 연결 위치**: `_persistWorkRecord` 이후, 또는 이력서 보기 진입 시 별도 저장 trigger

**장점**: 기존 CRUD 변경 없음, 순수 append, 테스트 가능

---

### 옵션 2 — createWorkRecord 저장 시 raw_payload에 후보 포함

**파일**: `PmMvpView._persistWorkRecord`

변경: `raw_payload: input` → `raw_payload: { ...input, resumeUpdateCandidate: buildInitialCandidate(input) }`

**장점**: 저장과 동시에 초안 생성
**단점**: `_persistWorkRecord`에 비즈니스 로직 추가 — 책임 분리 약화

---

### 옵션 3 — 이력서 보기에서 사용자 "저장" 버튼

**파일**: `PmMvpView.jsx` preview 섹션 + `workRecordRepository.js`

**장점**: 사용자가 명시적으로 확정한 문장만 저장
**단점**: UI 추가 필요, 사용자 액션 없이는 저장 안 됨

---

### P-6-1 추천: 옵션 1 (helper 추가)

- `workRecordRepository.js`에 `updateWorkRecordWithCandidate` helper 1개 추가 (1 파일, append-only)
- 기존 CRUD 변경 없음
- PmMvpView에서 호출 위치는 P-6-2에서 결정

---

## 9. Do Not Do Yet

아직 하지 말아야 할 것:

- AI 생성 결과 저장 (`generationMethod: "ai_generated"` 경로 구현 금지)
- `resume_update_candidates` 별도 테이블 생성 (P-8 이후 검토)
- `work_records`에 컬럼 추가 (ALTER TABLE) — MVP A안에서 불필요
- 이력서 전체 문서 저장 (PDF, DOCX export 등)
- B2B 후보자 검색용 테이블/인덱스 생성
- 컨설턴트 검수 workflow 구현 (`consultant_reviewed` 상태 진입 경로)
- 삭제/수정 이력 audit table 생성
- localStorage / IndexedDB 도입

---

## 10. File Ownership

| 파일 | 역할 | P-6-1 변경 여부 |
|---|---|---|
| `src/lib/workRecordRepository.js` | CRUD | **helper 추가 (옵션 1)** |
| `src/components/mvp/PmMvpView.jsx` | 저장 호출 | P-6-2에서 결정 |
| `src/lib/resume/recordToResumeCandidate.js` | candidate 생성 | 변경 없음 |
| `src/lib/resume/buildResumeDraftViewModel.js` | ViewModel 생성 | 변경 없음 |
| `docs/record-to-resume-contract.md` | 데이터 계약 | 변경 없음 |
| `docs/resume-update-candidate-storage-plan.md` | 이 문서 | 신규 |
