# Resume Candidate Save Trigger Plan

**Status**: P-6-2-0 설계 조사 (2026-04-29)
**Runtime changes**: 없음 (설계 문서 전용)
**Scope**: PmMvpView에서 updateWorkRecordWithCandidate 저장 trigger 결정

---

## 1. 목적

`updateWorkRecordWithCandidate(id, existingRawPayload, candidate)` helper가 P-6-1에서 추가됐지만
아직 어떤 곳에서도 호출되지 않는다.
이 helper를 PmMvpView에서 언제, 어떤 조건에서 호출할지 결정한다.

---

## 2. Current Flow

```
latestResumeCandidate (useMemo, priority: selectedStoredResumeCandidate > externalLastInput 래퍼 > resumeUpdateCandidates[0])
  ↓
  [sourceRecordId]: DB row UUID — stored 기반일 때 non-null
  [sourceRecord]:   full DB row (raw_payload 포함)
  [confidenceLevel]: low | medium | high | none
  [generationMethod]: deterministic | ...
  ↓
buildResumeDraftViewModel → resumeDraftViewModel → viewModel* JSX 렌더링

updateWorkRecordWithCandidate(id, existingRawPayload, candidate)  ← 현재 미연결
```

---

## 3. Save Source Investigation

저장에 필요한 값들의 현재 존재 여부:

| 필요한 값 | 후보 source | 현재 존재 여부 | 안정성 | 비고 |
|---|---|---|---|---|
| `workRecordId` | `latestResumeCandidate.sourceRecordId` | stored 기반이면 non-null | 높음 | externalLastInput 기반이면 null |
| `existingRawPayload` | `latestResumeCandidate.sourceRecord?.raw_payload` | stored 기반이면 존재 | 높음 | `buildResumeUpdateCandidateFromRecord`가 `sourceRecord: record` 반환 |
| `candidate` 전체 | `latestResumeCandidate` | 항상 존재 (preview mode) | 높음 | confidenceLevel/generationMethod 포함 |
| `candidate.resumeSentence` | `latestResumeCandidate.resumeSentence` | 존재 (draft이면 "기록 기반 초안:" prefix) | 중간 | low confidence면 draft prefix 포함 |
| `candidate.confidenceLevel` | `latestResumeCandidate.confidenceLevel` | 존재 | 높음 | 저장 허용 조건 판단용 |
| `candidate.generationMethod` | `latestResumeCandidate.generationMethod` | 존재 (항상 "deterministic") | 높음 | |
| `candidateStatus` | `latestResumeCandidate.candidateStatus` | 미정의 — helper에서 "draft" 기본값 | 낮음 | helper가 기본값 처리 |
| logged-in user | `currentUser` state | 존재 (null이면 미로그인) | 높음 | `useState(null)`, `onAuthStateChange`로 설정 |
| 저장 성공/실패 피드백 | `setActionNote(msg)` | 존재 | 높음 | JSX에 `actionNote` div 렌더링됨 |

### externalLastInput 기반 candidate의 sourceRecordId 문제

`_persistWorkRecord(input).catch(() => {})` — fire-and-forget, 반환 id를 state에 저장하지 않음.

따라서 `externalLastInput` 기반 candidate는:
- `sourceRecordId = null` (fake DB row에 `.id` 없음)
- 저장 직후 `fetchWorkRecords()`로 `rawDbRows` 업데이트되나, `externalLastInput` candidate의 id linkage 없음
- `sortedRawDbRows[0]` = 방금 저장된 기록일 가능성 있으나 content matching 없이 가정 불가

**결론**: `externalLastInput` 기반 candidate는 현재 신뢰할 수 있는 `workRecordId` 없음 → 저장 불가.

---

## 4. Trigger Options

### A안 — 자동 저장 (latestResumeCandidate 변경 시 즉시)

| 기준 | 평가 |
|---|---|
| MVP 구현 난이도 | 낮음 — useEffect로 latestResumeCandidate 변경 감지 |
| 사용자 오해 가능성 | **높음** — 사용자 동의 없이 저장됨 |
| low confidence 저장 위험 | **매우 높음** — "기록 기반 초안: ..." 문자열이 raw_payload.resumeSentence에 저장됨 |
| 이후 read-path 오염 | **있음** — 다음 preview에서 draft 문자열을 resumeSentence로 읽어옴 |
| 확장성 | 낮음 — user_edited/consultant_reviewed 상태 구분 불가 |
| 저장 복구 안정성 | 낮음 — 잘못된 값이 저장되면 복구 어려움 |
| 추천 | **금지** |

**추가 위험**: `selectedResumeRecordId` 변경 시마다 자동 저장되면 선택만 해도 저장됨 — 의도치 않은 덮어쓰기.

---

### B안 — 명시 버튼 저장 (사용자가 버튼을 눌렀을 때만)

| 기준 | 평가 |
|---|---|
| MVP 구현 난이도 | 낮음 — 버튼 1개 + handler 1개 |
| 사용자 오해 가능성 | 낮음 — 명시적 동의 액션 |
| low confidence 저장 위험 | 중간 — 버튼 노출 조건으로 제어 가능 |
| read-path 오염 | 낮음 — 사용자가 확인 후 저장 |
| 확장성 | 높음 — 버튼 클릭 시 candidateStatus를 "user_edited"로 바꾸는 경로도 연결 가능 |
| 저장 복구 안정성 | 높음 — 사용자가 확인한 문장만 저장 |
| 추천 | **MVP YES** |

**버튼 노출 조건** (상세는 Section 5):
- `isPreviewMode && currentUser && sourceRecordId && !isDraftSentence`

---

### C안 — 사용자 수정 후 저장 (textarea 편집)

| 기준 | 평가 |
|---|---|
| MVP 구현 난이도 | 높음 — 편집 state, 편집 UI, 취소/저장 분기 필요 |
| 사용자 오해 가능성 | 낮음 |
| low confidence 저장 위험 | 없음 — 직접 편집 후 저장 |
| 확장성 | 매우 높음 |
| B2B 후보자 데이터 품질 | 최고 — user_edited 상태로 확정 가능 |
| 추천 | P-6-3 이후 확장. MVP NOT NOW |

---

### D안 — 컨설턴트 검수 후 저장

장기 구조. MVP에서 하지 않는 이유:
- 컨설턴트 workflow 미구현
- `consultant_reviewed` 상태 진입 경로 없음
- 별도 테이블/UI 필요

**추천**: P-8 이후 검토.

---

## 5. Recommendation

### MVP 추천: B안 명시 버튼 저장

#### 버튼 위치

`shouldShowResumeRecordSelector` 블록 아래, `ResumeDocSection title="소개"` 위.
또는 "이번 업데이트 반영 보기" `<details>` 블록 내 AFTER 패널 하단.

두 위치 비교:
- **selector 바로 아래**: 기록 선택 → 저장 흐름이 자연스러움. 추천.
- AFTER 패널 하단: BEFORE-AFTER 확인 후 저장 흐름이 자연스럽지만 details 접힌 경우 노출 안 됨.

**권장 위치**: selector 아래 or 이력서 섹션 헤더와 소개 섹션 사이 (항상 보임).

#### 버튼 문구

`"이 이력서 초안 저장하기"` (MVP)
향후: `"이 문장을 이력서에 반영"` or `"이력서 문장으로 저장"`

#### 노출 조건

```
isPreviewMode
&& currentUser !== null       // 로그인 확인
&& latestResumeCandidate !== null
&& latestResumeCandidate.sourceRecordId !== null  // stored 기반 candidate
```

#### 비활성(disabled) 조건

```
isDraftSentence === true  // low confidence 또는 "기록 기반 초안:" prefix
```
→ 비활성 시 tooltip/안내: "이 초안은 신뢰도가 낮아 바로 저장하기 어렵습니다."

#### 미로그인 상태

버튼 숨김 또는 비활성 + "저장하려면 로그인이 필요합니다." 안내.
`actionNote`로 처리 가능.

#### externalLastInput만 있고 sourceRecordId가 null인 경우

버튼 숨김 또는 비활성.
이유: DB id 없어 저장 대상 불명확.
향후 개선: `_persistWorkRecord` 성공 후 saved id를 state에 기록하는 P-6-2B 패치.

#### 저장 대상 candidate 조건 요약

| latestResumeCandidate 상태 | sourceRecordId | confidenceLevel | 버튼 |
|---|---|---|---|
| selectedStoredResumeCandidate | non-null | medium/high | **활성** |
| selectedStoredResumeCandidate | non-null | low | 비활성 (draft 안내) |
| externalLastInput 기반 | null | any | 숨김 |
| resumeUpdateCandidates[0] | non-null | medium/high | **활성** |
| resumeUpdateCandidates[0] | non-null | low | 비활성 |
| null (preview 없음) | — | — | 숨김 |

#### 저장 후 사용자 피드백

성공: `setActionNote("이력서 초안이 기록에 저장되었습니다.")` — 기존 `actionNote` 재사용.
실패: `setActionNote("저장 중 오류가 발생했습니다. 다시 시도해주세요.")`.

#### 저장 로직 (handler 의사 코드)

```js
async function handleSaveResumeCandidate() {
  const id = latestResumeCandidate?.sourceRecordId;
  const existingRawPayload = latestResumeCandidate?.sourceRecord?.raw_payload ?? {};
  if (!id || !currentUser) return;
  try {
    await updateWorkRecordWithCandidate(id, existingRawPayload, latestResumeCandidate);
    setActionNote("이력서 초안이 기록에 저장되었습니다.");
    fetchWorkRecords(); // rawDbRows 새로고침
  } catch (_) {
    setActionNote("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
}
```

#### P-4A.5/P-4A.6 display guard와의 충돌 없음

- `isDraftSentence` guard는 JSX 렌더링과 버튼 비활성 양쪽에서 동일하게 사용
- `displayAchievementText`는 fallback 안내 역할이므로 저장 대상이 아님 (ViewModel에서 처리)
- 충돌 없음

---

## 6. Recommended P-6-2A Patch

### 수정 파일

`src/components/mvp/PmMvpView.jsx` 단일 파일

### 추가 내용

1. `updateWorkRecordWithCandidate` import 추가 (`workRecordRepository.js`에서)
2. `handleSaveResumeCandidate` async 함수 추가
3. `shouldShowSaveCandidateButton` 파생 변수 추가
4. JSX에 저장 버튼 추가 (selector 아래, 소개 섹션 위)

### `shouldShowSaveCandidateButton` 조건

```js
const shouldShowSaveCandidateButton =
  isPreviewMode &&
  !!currentUser &&
  !!latestResumeCandidate?.sourceRecordId;
```

### 버튼 비활성 조건

```js
const isSaveCandidateDisabled = isDraftSentence;
```

### 의존 변수 (이미 존재)

| 변수 | 존재 여부 | 비고 |
|---|---|---|
| `isPreviewMode` | ✓ | L377 |
| `currentUser` | ✓ | L330 |
| `latestResumeCandidate` | ✓ | useMemo |
| `isDraftSentence` | ✓ | derived from candidateConfidence |
| `setActionNote` | ✓ | L329 |
| `fetchWorkRecords` | ✓ | function |
| `updateWorkRecordWithCandidate` | ✓ | workRecordRepository.js — import만 추가 필요 |

### 파일 수 = 1 (PmMvpView.jsx)

import 1줄 추가 + 함수 1개 + 파생 변수 2개 + JSX 1 블록.
append-only, 기존 함수 변경 없음.

---

## 7. Do Not Do Yet

- 자동 저장 (useEffect trigger)
- AI 생성 저장 (`generationMethod: "ai_generated"` 경로)
- 사용자 수정 textarea (P-6-3 이후)
- 컨설턴트 검수 workflow
- `_persistWorkRecord` 반환값으로 savedRecordId state 관리 (P-6-2B 후보)
- externalLastInput → DB id 링크 (P-6-2B 후보)
- 별도 테이블 생성
- 이력서 전체 문서 저장

---

## 8. File Ownership

| 파일 | P-6-2-0 | P-6-2A |
|---|---|---|
| `docs/resume-candidate-save-trigger-plan.md` | 신규 (이 문서) | — |
| `src/components/mvp/PmMvpView.jsx` | read-only | **수정 대상** |
| `src/lib/workRecordRepository.js` | read-only | import 추가만 |
| `src/lib/resume/recordToResumeCandidate.js` | read-only | — |
| `src/lib/resume/buildResumeDraftViewModel.js` | read-only | — |
