# RES-CAND-1: recordToResumeCandidate.js UI 연결 상태 조사 결과

조사일: 2026-04-29
분류: SAFE INVESTIGATION + DOC UPDATE (런타임 코드 변경 없음)

---

## 1. 조사 목적

`src/lib/resume/recordToResumeCandidate.js` 파일 헤더에 "UI 연결 없음"이라고 기재되어 있으나, 실제 UI에서 저장 기록 기반 이력서 후보가 얼마나 연결되어 있는지 확인하고 최신 상태로 문서를 정정하기 위해 조사를 진행했다.

---

## 2. 조사 대상 파일

| 파일 | 역할 |
|------|------|
| `src/lib/resume/recordToResumeCandidate.js` | 저장 기록 → ResumeUpdateCandidate 변환 순수 함수 |
| `src/components/mvp/PmMvpView.jsx` | 후보 생성·표시·편집·저장 UI consumer |
| `src/lib/workRecordRepository.js` | `updateWorkRecordWithCandidate` DB write owner |

---

## 3. 주요 발견 사항

### 3-1. 파일 헤더 오류

`recordToResumeCandidate.js` 파일 헤더에 다음 주석이 있었다:

```
UI 연결 없음. buildDemoResult / PmMvpView 구조 변경 없음.
```

이는 **outdated**였으며, 아래에서 확인된 연결 상태와 상충했다.
**comment-only 정정 완료** (2026-04-29, SAFE COMMENT MICRO PATCH): stale 줄 제거 후 현재 연결 상태 반영.

### 3-2. 실제 연결 확인 (PmMvpView.jsx)

| 연결 지점 | 파일:라인 | 내용 |
|-----------|-----------|------|
| 후보 배열 생성 | PmMvpView.jsx:442–448 | useMemo — 모든 DB row를 `buildResumeUpdateCandidateFromRecord`로 변환 |
| 외부 입력 후보 변환 | PmMvpView.jsx:473 | `externalLastInput`을 candidate shape으로 변환 |
| 우선순위 선택 | PmMvpView.jsx:469–481 | selected > externalLastInput > first 순서로 `latestResumeCandidate` 결정 |
| 초안 guard | PmMvpView.jsx:483–491 | `isDraftSentence` — confidenceLevel "low" 또는 "기록 기반 초안:" prefix이면 직접 수정 없이 저장 차단 |
| 저장 버튼 노출 조건 | PmMvpView.jsx:586–589 | `shouldShowSaveCandidateButton` — sourceRecordId, sourceRecord 모두 필요 |
| 사용자 편집 textarea | PmMvpView.jsx:990–1025 | `isEditingResumeSentence` toggle → `editedResumeSentence` state |
| 저장 핸들러 | PmMvpView.jsx:719–763 | `handleSaveResumeCandidate` — user_edited 분기 처리 포함 |
| DB write 호출 | PmMvpView.jsx:750 | `updateWorkRecordWithCandidate(recordId, existingRawPayload, saveCandidate)` |

### 3-3. workRecordRepository 저장 계약

`updateWorkRecordWithCandidate` (workRecordRepository.js:88–124):
- `raw_payload.resumeUpdateCandidate` — canonical nested 객체 (전체 ResumeUpdateCandidate)
- `raw_payload.resumeSentence` — flat alias (빈 문자열로 덮어쓰기 방지)

두 경로 모두 같은 Supabase `work_records` row에 저장됨.

---

## 4. 현재 상태 분류

**E — 완전히 연결됨**

생성 → 표시 → 사용자 편집 → 저장 → DB write 전 경로가 모두 PmMvpView.jsx에 구현되어 있다. 기존 문서의 "미연결" 설명은 초기 설계 단계 주석이 갱신되지 않은 것이다.

분류 기준 (참고):
- A: UI consumer 없음 (파일 헤더 주장, 실제와 다름)
- B: 후보 생성 연결됨, 저장 흐름 불완전
- C: 저장까지 연결됨, 사용자 편집 UI 없음
- D: 사용자 편집 UI 있음, 저장 상태 관리 미흡
- **E: 완전히 연결됨 ← 현재 상태**

---

## 5. 전체 파이프라인 흐름

```
DB work_records rows
  └─ PmMvpView useMemo (line 442)
       └─ buildResumeUpdateCandidateFromRecord(record)  ← recordToResumeCandidate.js
            └─ resumeUpdateCandidates[]
                 └─ latestResumeCandidate (우선순위 선택)
                      ├─ isDraftSentence guard (low confidence → 저장 차단)
                      ├─ shouldShowSaveCandidateButton (저장 UI 노출 조건)
                      ├─ [선택] isEditingResumeSentence → editedResumeSentence (textarea)
                      └─ handleSaveResumeCandidate (line 719)
                           ├─ user_edited 분기: generationMethod/status/confidence 갱신
                           └─ updateWorkRecordWithCandidate (workRecordRepository.js)
                                ├─ raw_payload.resumeUpdateCandidate (canonical)
                                └─ raw_payload.resumeSentence (flat alias)
```

---

## 6. 핵심 guard 및 계약

### isDraftSentence guard

```
isDraftSentence = (confidenceLevel === "none" || confidenceLevel === "low")
               || resumeSentence.startsWith("기록 기반 초안:")
```

- 이 조건이 true이면 `canSaveResumeCandidate`가 false → 저장 버튼 비활성
- 단, 사용자가 textarea에 직접 입력한 경우(`hasUserEditedResumeSentence`)는 isDraftSentence 무관하게 저장 가능 (`user_edited` 경로)

### user_edited 저장 경로

사용자가 직접 수정한 문장은 다음 값으로 override되어 저장된다:
- `generationMethod: "user_edited"`
- `candidateStatus: "user_edited"`
- `confidenceLevel: "medium"`

### candidate 변경 시 상태 초기화

`currentResumeCandidateKey` (sourceRecordId | resumeSentence | selectedResumeRecordId) 가 바뀌면 `useEffect`가 `candidateSaveStatus`, `editedResumeSentence`, `isEditingResumeSentence`를 초기화한다 (PmMvpView.jsx:619–623). saving 중에는 초기화 스킵.

---

## 7. 수정이 필요한 파일 헤더 (런타임 변경 아님)

`src/lib/resume/recordToResumeCandidate.js` 파일 상단 주석:

```js
// UI 연결 없음. buildDemoResult / PmMvpView 구조 변경 없음.
```

이 주석은 outdated이므로 다음 편집 기회에 아래로 교체 권장:

```js
// PmMvpView.jsx useMemo(line 442)에서 모든 DB row를 후보 배열로 변환.
// consumer: PmMvpView, writer: workRecordRepository.updateWorkRecordWithCandidate
```

이 변경은 런타임 영향 없음 — 별도 태스크로 처리.

---

## 8. 후속 TODO

| 항목 | 우선순위 | 비고 |
|------|----------|------|
| `recordToResumeCandidate.js` 파일 헤더 주석 교체 | low | 런타임 무영향, 오해 방지용 |
| `isEditingResumeSentence` 편집 취소 시 placeholder 동작 확인 | low | `editableBaseResumeSentence` fallback 있음 |
| `externalLastInput` 기반 후보의 저장 버튼 미노출 이유 문서화 | medium | `shouldShowSaveCandidateButton`이 sourceRecord 필요 — in-session input은 DB row 없음 |
| `recordToResumeCandidate.js` 내 `confidenceLevel` 결정 로직 재검토 | medium | "none" 조건 발생 경로 명확히 |

---

## 참조

- `docs/PASSMAP_DATA_FLOW_MAP.md` 섹션 2 (업무 기록 → 이력서 후보)
- `docs/PASSMAP_SOURCE_MAP.md` 이력서 보기/업데이트 후보 행
- `docs/PASSMAP_HIGH_RISK_FILES.md` PmMvpView, recordToResumeCandidate 항목
- `docs/record-to-resume-contract.md` (ResumeUpdateCandidate shape 상세)

---

## RES-CAND-2 E2E 검수 결과

검수일: 2026-04-29
분류: SAFE E2E INVESTIGATION + UX GAP REPORT (런타임 코드 수정 없음)

### 현재 상태 분류

**A — 표시·수정·저장·복구 흐름 모두 코드상 연결됨**

기능적으로는 4단계 모두 동작한다. UX 품질 개선 여지가 5곳 있다.

---

### E2E 단계별 owner

| 단계 | owner 파일:함수 | state / contract |
|------|----------------|-----------------|
| 1. 기록 조회 | `workRecordRepository.listWorkRecords` | `rawDbRows` ← SELECT * work_records |
| 2. 후보 생성 | `recordToResumeCandidate.buildResumeUpdateCandidateFromRecord` | `resumeUpdateCandidates` useMemo (PmMvpView:442) |
| 3. 우선순위 선택 | `PmMvpView.latestResumeCandidate` useMemo | selected > externalLastInput > first |
| 4. 문서 본문 표시 | `buildResumeDraftViewModel` → `resumeDraftViewModel.experiences` | `safeCandidateSentence` (confidence "medium" 이상만) |
| 5. BEFORE/AFTER 카드 | `PmMvpView` "이번 업데이트 반영 보기" 블록 | BEFORE=`sourcePreview`, AFTER=**`result.resumeLine`** (buildDemoResult 기반) |
| 6. 사용자 편집 | `PmMvpView.isEditingResumeSentence` toggle → `editedResumeSentence` state | textarea value |
| 7. 저장 | `PmMvpView.handleSaveResumeCandidate` (line 719) | `updateWorkRecordWithCandidate(recordId, existingPayload, saveCandidate)` |
| 8. DB write | `workRecordRepository.updateWorkRecordWithCandidate` | `raw_payload.resumeUpdateCandidate` + `raw_payload.resumeSentence` |
| 9. 재조회 | `PmMvpView.fetchWorkRecords()` (line 752) | `setRawDbRows(rows)` → useMemo 재실행 |
| 10. 복구 | `buildResumeUpdateCandidateFromRecord` 재실행 | priority 3: `raw_payload.resumeUpdateCandidate.resumeSentence` 읽음 |

---

### 저장 guard 확인 결과

| 항목 | 결과 |
|------|------|
| 자동 저장 | 없음 — 버튼 클릭만 트리거 |
| low confidence 저장 방지 | 있음 — `isDraftSentence` true이면 `canSaveResumeCandidate` false |
| user_edited 저장 조건 | `hasUserEditedResumeSentence` (isEditingResumeSentence && trim.length > 0) 이면 isDraftSentence 무관 저장 가능 |
| isDraftSentence guard | `confidenceLevel === "low"` 또는 `resumeSentence.includes("기록 기반 초안:")` — 실제 저장 버튼에 반영됨 |
| 빈 문장 방지 | `hasUserEditedResumeSentence`가 `trim().length > 0` 조건 포함 — 빈 textarea 저장 불가 |
| stored candidate 복구 우선순위 | (1) record.resumeSentence 컬럼 (현재 없음) (2) record.reflectedSentence 컬럼 (현재 없음) (3) `raw_payload.resumeUpdateCandidate.resumeSentence` **← user_edited 저장 경로** (4) `raw_payload.resumeSentence` flat alias |
| user_edited 복구 | 저장 후 fetchWorkRecords → priority 3 경로에서 user_edited 텍스트 + confidenceLevel "medium" + generationMethod "user_edited" 모두 복구됨 |
| deterministic vs user_edited 구분 | `generationMethod: "user_edited"` vs `"deterministic"` 로 저장 — UI에는 직접 표시 없음 |

---

### UX gap

#### G-1. BEFORE/AFTER 카드의 AFTER 문장이 저장 후보와 다름

- **상황**: "이번 업데이트 반영 보기" AFTER 카드(`result.resumeLine`)는 `buildDemoResult`(in-session) 기반이다.
- **저장 패널과 문서 본문**은 `latestResumeCandidate.resumeSentence`(DB 기반)를 쓴다.
- **결과**: user_edited 저장 후 AFTER 카드는 여전히 buildDemoResult 문장을 보여준다. 두 문장이 다르면 "내가 저장한 문장이 어디에 반영됐지?" 혼란 발생.

#### G-2. "저장 완료" 버튼 상태가 fetchWorkRecords 완료 직후 초기화됨

- `handleSaveResumeCandidate`: `setCandidateSaveStatus("saved")` → `fetchWorkRecords()` 대기
- `fetchWorkRecords()` 완료 → rawDbRows 갱신 → `currentResumeCandidateKey` 변경 → `useEffect` → `"saved"` → `"idle"` 리셋
- `candidateSaveStatus` guard: `prev === "saving"` 만 보존, `"saved"` 는 보존하지 않음
- **결과**: 버튼에 "저장 완료" 표시가 매우 짧음. 단, `actionNote` 배너는 남으므로 완전 무피드백은 아님.

#### G-3. 저장 패널에 현재 후보 문장이 보이지 않음

- "이력서 초안 저장" 패널에는 저장 버튼과 "문장 직접 수정" 버튼만 있음.
- `safeCandidateResumeSentence` (non-draft 문장) 또는 현재 후보 문장이 어디에도 명시적으로 표시되지 않는다.
- 사용자는 저장 버튼 위에 있는 문서 본문(경력 섹션)을 봐야 후보 문장을 알 수 있다.

#### G-4. textarea 편집 시 기존 문장 수동 복사 필요

- "문장 직접 수정" 버튼 클릭 시 textarea value = `""` (빈 값), placeholder = `editableBaseResumeSentence` (현재 후보 문장).
- 기존 문장에서 소폭만 수정하려면 placeholder를 별도로 복사해서 다시 입력해야 한다.
- isDraftSentence가 false인 문장(이미 user_edited)에서도 같은 불편이 발생한다.

#### G-5. 기록 선택 드롭다운에 "이미 저장됨" 표시 없음

- `resumeUpdateCandidates` 중 `generationMethod === "user_edited"` 인 기록이 드롭다운에서 구분되지 않음.
- 어떤 기록에 이미 이력서 문장이 저장되어 있는지 확인하려면 일일이 선택해봐야 한다.

---

### 다음 패치 후보

#### P-1. RES-CAND-3 — BEFORE/AFTER 카드 AFTER 표시 개선

- **목적**: AFTER 카드가 `latestResumeCandidate.resumeSentence` 를 우선 표시하도록
- **예상 수정 파일**: `src/components/mvp/PmMvpView.jsx`
- **exact anchor**: `{hasResumeLine ? result.resumeLine : ...}` 블록 (line 1144) → `resumeDraftViewModel.updatePreview.afterSentence || result.resumeLine` 로 교체
- **위험도**: medium — buildDemoResult와 candidate sentence 우선순위 변경
- **사용자 체감**: 저장한 user_edited 문장이 AFTER 카드에도 반영됨
- **하지 말아야 할 것**: `result.resumeLine` 완전 제거 (candidate 없을 때 fallback 필요)

#### P-2. RES-CAND-4 — "저장 완료" 상태 보존 개선

- **목적**: `candidateSaveStatus "saved"` 를 fetchWorkRecords 후에도 보존
- **예상 수정 파일**: `src/components/mvp/PmMvpView.jsx`
- **exact anchor**: line 620 `setCandidateSaveStatus((prev) => (prev === "saving" ? prev : "idle"))` → `"saving"` 과 `"saved"` 모두 보존
- **위험도**: low — state reset 조건 1줄 변경
- **사용자 체감**: 저장 후 버튼에 "저장 완료"가 더 명확하게 표시됨
- **하지 말아야 할 것**: setTimeout 남용, 복잡한 상태 머신 도입

#### P-3. RES-CAND-5 — 저장 패널에 현재 후보 문장 표시

- **목적**: 저장 버튼 위에 현재 이력서 문장 후보를 간단히 표시
- **예상 수정 파일**: `src/components/mvp/PmMvpView.jsx`
- **exact anchor**: `shouldShowSaveCandidateButton` 블록 (line 983) 내, label과 버튼 사이 구간
- **위험도**: low — UI 추가, 기존 로직 변경 없음
- **사용자 체감**: "지금 무슨 문장이 저장될지" 확인 후 수정 여부 결정 가능
- **하지 말아야 할 것**: isDraftSentence 문장을 비공개 없이 표시 (초안을 확정본으로 오해할 위험)

#### P-4. RES-CAND-6 — textarea에 기존 문장 자동 채우기

- **목적**: "문장 직접 수정" 클릭 시 `editedResumeSentence` 초기값을 `editableBaseResumeSentence` 로 세팅
- **예상 수정 파일**: `src/components/mvp/PmMvpView.jsx`
- **exact anchor**: line 990 `onClick={() => setIsEditingResumeSentence((v) => !v)}` → toggle 시 open이면 `setEditedResumeSentence(editableBaseResumeSentence)` 추가
- **위험도**: low — toggle handler 1줄 확장
- **사용자 체감**: 기존 문장을 기반으로 수정 시작 가능 (placeholder 직접 복사 불필요)
- **하지 말아야 할 것**: isDraftSentence 때 초안 자동 채우기 (저장 바이패스 오해 위험 — 조건 분기 필요)

#### P-5. RES-CAND-7 — 기록 드롭다운에 user_edited 표시

- **목적**: 이미 이력서 문장이 저장된 기록에 레이블 표시
- **예상 수정 파일**: `src/components/mvp/PmMvpView.jsx`
- **exact anchor**: line 963 `const label = [dateStr, trackLabel, summary].filter(Boolean).join(" · ")` → `generationMethod === "user_edited"` 이면 `[★]` 또는 `[저장됨]` prefix 추가
- **위험도**: low — option label 구성만 변경
- **사용자 체감**: 어떤 기록에 이력서 문장이 이미 저장되어 있는지 드롭다운에서 바로 확인 가능
- **하지 말아야 할 것**: option value/key 구조 변경

---

## RES-CAND-8 E2E QA Checklist (2026-04-30)

RES-CAND-3~7 UX 패치 묶음 코드 기준 통합 검수 결과 및 사용자 화면 확인 체크리스트.

### 코드 기준 통합 검수 결과

#### RES-CAND-3 — AFTER 카드 표시 소스 통일

| 확인 항목 | 코드 근거 | 결과 |
| --- | --- | --- |
| AFTER 카드가 `resumeDraftViewModel.updatePreview.afterSentence` 사용 | `PmMvpView.jsx:1185` | ✅ |
| 저장 패널 현재 문장 블록도 동일 소스 | `PmMvpView.jsx:1044,1049` | ✅ |
| `latestResumeCandidate` 변경 시 `afterSentence` 자동 갱신 | `resumeDraftViewModel` useMemo deps에 `latestResumeCandidate` 포함 | ✅ |
| `afterSentence` 없을 때 fallback "아직 이력서 문장이 반영되지 않았습니다." | `PmMvpView.jsx:1196` | ✅ |
| `isDraft=true` 시 amber 경고 표시 | `PmMvpView.jsx:1188-1189` | ✅ |

#### RES-CAND-4 — 저장 완료 피드백 보존

| 확인 항목 | 코드 근거 | 결과 |
| --- | --- | --- |
| `justCompletedSaveRef` 선언 위치 | `PmMvpView.jsx:339` | ✅ |
| save 성공 후 `fetchWorkRecords()` 전에 ref=true | `PmMvpView.jsx:767` | ✅ |
| refetch 실패 시 ref=false (안전 처리) | `PmMvpView.jsx:769 catch` | ✅ |
| useEffect: ref=true → candidateSaveStatus 초기화 스킵 | `PmMvpView.jsx:627-632` | ✅ |
| `setCandidateSaveStatus("saved")` 이 useEffect보다 늦게 호출 → React 18 Automatic Batching으로 같은 렌더에 정착 | `PmMvpView.jsx:764,769` | ✅ |
| 다른 기록 선택 시 ref=false → "idle" 정상 초기화 | `currentResumeCandidateKey`에 `selectedResumeRecordId` 포함 | ✅ |

#### RES-CAND-5 — 저장 패널 현재 문장 블록

| 확인 항목 | 코드 근거 | 결과 |
| --- | --- | --- |
| 편집 미시작 + afterSentence 있을 때만 표시 | `PmMvpView.jsx:1044` `!isEditingResumeSentence && afterSentence` | ✅ |
| 편집 중 숨겨짐 (textarea와 중복 방지) | `isEditingResumeSentence && <textarea>` 분기 분리 | ✅ |
| isDraft → "초안 문장 — 수정 후 저장 가능" 라벨 | `PmMvpView.jsx:1047` | ✅ |
| 비초안 → "현재 반영된 문장" 라벨 | `PmMvpView.jsx:1047` | ✅ |
| afterSentence 없을 때 빈 블록 미렌더 | 조건부 렌더 `&&` | ✅ |

#### RES-CAND-6 — textarea 초기값 pre-fill + 저장 guard

| 확인 항목 | 코드 근거 | 결과 |
| --- | --- | --- |
| `resumeSentenceInitialFillRef` 선언 | `PmMvpView.jsx:341` | ✅ |
| 편집 진입 + `editedResumeSentence` 빈값 + base 있을 때 pre-fill | `PmMvpView.jsx:1009-1013` | ✅ |
| `editedResumeSentence` 이미 있으면 pre-fill 스킵 (prev unsaved 보존) | `!editedResumeSentence && base` 조건 | ✅ |
| `hasUserEditedResumeSentence`: `effectiveEdited !== initialFillRef.current` 요건 추가 | `PmMvpView.jsx:589` | ✅ |
| pre-fill 그대로 → `hasUserEditedResumeSentence=false` → 저장 불가 | `effectiveEdited === initialFill` | ✅ |
| 한 글자 수정 → `hasUserEditedResumeSentence=true` → 저장 가능 | `effectiveEdited !== initialFill` | ✅ |
| 원래 pre-fill 문장으로 되돌리면 저장 불가 | `!== initialFill` 비교 | ✅ |
| `saved→idle` 해제: onChange에서만 발생 | `PmMvpView.jsx:1057` | ✅ |
| 편집 종료 시 `initialFillRef = ""` | `PmMvpView.jsx:1015-1016` | ✅ |
| useEffect 양 분기에서 `initialFillRef = ""` | `PmMvpView.jsx:631,637` | ✅ |

**Edge case (정상 동작 확인):** 사용자가 편집 모드에서 타이핑 후 저장 없이 "편집 닫기" → 재진입 시 `editedResumeSentence` 에 이전 값 보존, `initialFillRef=""` → `hasUserEditedResumeSentence=true` (이전 타이핑 값 !== "") → 저장 버튼 즉시 활성. 의도된 동작.

#### RES-CAND-7 — 드롭다운 저장 상태 표시

| 확인 항목 | 코드 근거 | 결과 |
| --- | --- | --- |
| `saveStatus = generationMethod === "user_edited" ? "저장됨" : (resumeSentence ? "초안" : null)` | `PmMvpView.jsx:981` | ✅ |
| `generationMethod`는 `raw_payload.resumeUpdateCandidate.generationMethod` 복구 | `recordToResumeCandidate.js:265` | ✅ |
| `updateWorkRecordWithCandidate` 저장 시 `generationMethod: "user_edited"` 기록 | `PmMvpView.jsx:751` | ✅ |
| 저장 후 `fetchWorkRecords` → `rawDbRows` → `resumeUpdateCandidates` useMemo 갱신 → option text 자동 갱신 | useMemo deps `[mode, sortedRawDbRows]` | ✅ |
| option text 최대 길이: dateStr(10) + trackLabel(5) + summary(40) + saveStatus(5-6) ≈ 65자 이하 | — | ✅ |

### 충돌 가능성 분석

| 패치 조합 | 관계 | 결과 |
| --- | --- | --- |
| RES-CAND-3 ↔ RES-CAND-5 | 동일 소스(`afterSentence`) → 동일 텍스트 보장 | 충돌 없음 ✅ |
| RES-CAND-4 ↔ RES-CAND-6 | saved→idle 해제가 onChange로 이동 — 편집 진입 시 saved 보존 | 충돌 없음 ✅ |
| RES-CAND-5 ↔ RES-CAND-6 | 편집 비시작: 현재 문장 블록 표시 / 편집 시작: 블록 숨김 + textarea 표시 — 두 상태 상호 배타 | 충돌 없음 ✅ |
| RES-CAND-4 ↔ RES-CAND-7 | saved 피드백은 현재 세션 상태 / "저장됨" 표시는 DB generationMethod — 독립 소스 | 충돌 없음 ✅ |
| RES-CAND-6 ↔ RES-CAND-7 | pre-fill 소스와 "초안/저장됨" 표시 소스 독립 | 충돌 없음 ✅ |

### 알려진 UX 한계 (버그 아님, 패치 대상 아님)

- **reload 후 save 버튼 재활성:** user_edited 후보가 있는 기록은 reload 후에도 `canSaveResumeCandidate=true` (medium confidence, not draft). 버튼이 "이 이력서 초안 저장하기"로 재표시됨. 중복 저장이 발생할 수 있으나 데이터 무결성 깨지지 않음. RES-CAND-7 "저장됨" 표시가 맥락 보완.
- **"저장 완료" 상태는 세션 한정:** `candidateSaveStatus` 는 React state → reload 시 "idle" 초기화. 이전 세션 저장 여부는 드롭다운 "저장됨"으로만 구분 가능.

### 사용자 화면 E2E 확인 체크리스트

아래 시나리오는 실제 브라우저에서 확인해야 합니다.

#### 시나리오 A — 후보 없는 기록

| 단계 | 확인 항목 | 예상 결과 |
| --- | --- | --- |
| 1 | 드롭다운에서 `resumeSentence`가 없는 기록 선택 | option에 suffix 없음 |
| 2 | AFTER 카드 | "아직 이력서 문장이 반영되지 않았습니다." fallback 표시 |
| 3 | 저장 패널 현재 문장 블록 | 렌더되지 않음 (빈 블록 없음) |
| 4 | 저장 버튼 | 비활성 (disabled) |
| 5 | "문장 직접 수정" 클릭 → textarea | 빈값 (base 없으므로 pre-fill 없음) |
| 6 | 안내 문구 | "저장할 문장을 직접 입력해 주세요." |

#### 시나리오 B — 초안(low confidence/deterministic) 후보 기록

| 단계 | 확인 항목 | 예상 결과 |
| --- | --- | --- |
| 1 | 드롭다운 option | " · 초안" suffix 표시 |
| 2 | AFTER 카드 | 초안 문장 + amber "초안 문장입니다. 직접 수정하면 이력서에 저장할 수 있습니다." |
| 3 | 저장 패널 현재 문장 | "초안 문장 — 수정 후 저장 가능" 라벨 + 초안 문장 |
| 4 | 저장 버튼 | 비활성 (isDraftSentence guard) |
| 5 | 안내 문구 | "기록 기반 초안은 그대로 저장하지 않습니다." |
| 6 | "문장 직접 수정" 클릭 → textarea | 초안 문장으로 pre-fill 됨 |
| 7 | pre-fill 그대로 저장 시도 | 저장 버튼 여전히 비활성 |
| 8 | 한 글자 수정 | 저장 버튼 활성화 |
| 9 | 원래 문장으로 되돌림 | 저장 버튼 비활성 |

#### 시나리오 C — user_edited 저장 완료 후 흐름

| 단계 | 확인 항목 | 예상 결과 |
| --- | --- | --- |
| 1 | 초안 기록에서 편집 → 한 글자 수정 → "이 이력서 초안 저장하기" 클릭 | 버튼 "저장 중..." → "저장 완료" |
| 2 | 저장 직후 "저장 완료" 상태 유지 | fetchWorkRecords 후에도 "저장 완료" 유지 (RES-CAND-4) |
| 3 | 저장 패널 현재 문장 | 저장된 문장으로 갱신됨 |
| 4 | AFTER 카드 | 저장된 문장으로 갱신됨 |
| 5 | 드롭다운 해당 기록 option | " · 초안" → " · 저장됨" 갱신 |
| 6 | "문장 직접 수정" 재클릭 | textarea에 저장된 문장으로 pre-fill |
| 7 | pre-fill 문장 그대로 저장 시도 | 저장 버튼 비활성 |
| 8 | 문장 수정 시작 (onChange) | "저장 완료" → "이 이력서 초안 저장하기" 전환 |

#### 시나리오 D — 다른 기록 전환

| 단계 | 확인 항목 | 예상 결과 |
| --- | --- | --- |
| 1 | 기록 A 저장 완료 상태에서 드롭다운으로 기록 B 선택 | "저장 완료" → "이 이력서 초안 저장하기" 초기화 |
| 2 | 편집 모드 열려 있었으면 | 편집 닫힘, editedResumeSentence 초기화 |
| 3 | 기록 B AFTER 카드 | 기록 B 기준 문장 표시 |
| 4 | 드롭다운 기록 A | 여전히 " · 저장됨" 표시 (DB 기준) |
| 5 | 기록 A 재선택 | 상태 재초기화, 저장 버튼 활성 (medium confidence) |

#### 시나리오 E — 새로고침(reload) 후

| 단계 | 확인 항목 | 예상 결과 |
| --- | --- | --- |
| 1 | 저장된 user_edited 기록 드롭다운 | " · 저장됨" 표시 |
| 2 | AFTER 카드 | 저장된 문장 표시 |
| 3 | 저장 패널 현재 문장 | "현재 반영된 문장" 라벨 + 저장된 문장 |
| 4 | 저장 버튼 | 활성 (medium confidence, not draft — 재저장 허용) |
| 5 | 버튼 텍스트 | "이 이력서 초안 저장하기" (세션 한정 "저장 완료" 표시 없음) |

### 다음 패치 여부 판단 기준

| 조건 | 판단 |
| --- | --- |
| 위 모든 시나리오 정상 동작 | RES-CAND UX 1차 완료 |
| 시나리오 C-7 실패 (pre-fill 그대로 저장 가능) | RES-CAND-6 `initialFillRef` 로직 재검토 |
| 시나리오 C-5 실패 ("저장됨" 갱신 안 됨) | `fetchWorkRecords` → `resumeUpdateCandidates` 연결 확인 |
| 시나리오 D-1 실패 ("저장 완료" 유지됨) | `currentResumeCandidateKey`에 `selectedResumeRecordId` 포함 여부 재확인 |
| reload 후 save 버튼 재활성 사용자 혼란 가중 시 | "저장됨" 상태 UI 강화 별도 패치 검토 (현재는 버그 아님으로 분류) |
