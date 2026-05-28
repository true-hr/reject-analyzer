# 구현 계획

## 현재 기본 방향

1. `origin/main` 기준 새 worktree/새 브랜치에서 구현한다.
2. 우선 `HomeDashboard.jsx` 중심으로 산출물 A를 구현한다.
3. PR #574와 충돌 가능성이 큰 파일은 피한다.
4. 산출물 A 완료 후 산출물 B, C를 순차 구현한다.
5. 각 산출물은 해당 md 파일의 체크리스트를 만족해야 완료로 본다.

## 추천 구현 브랜치

```text
ux/user-experience-dashboard-reframe-20260528
```

## 추천 worktree

```text
D:\패스맵\worktrees\ux-user-experience-dashboard-reframe-20260528
```

## 산출물 A 실제 패치 기록

### 작업 위치

```text
worktree: D:\패스맵\worktrees\ux-artifact-a-top-summary-card-20260528
branch: ux/artifact-a-top-summary-card-20260528
```

### 변경 파일

```text
src/components/home/HomeDashboard.jsx
```

### 교체한 블록

- 기존: `CardContent` 바로 아래 `actionStatus.map()` 기반 4개 요약 박스 grid
- 신규: 단일 `최근 경험 분석 결과` 카드

### 구현된 내용

- `최근 경험 분석 결과` 제목, 상태 배지, 기록 유무별 설명 문구 추가
- `safeRecords`의 `strengthTags`, `workTags`, `title`, `summary`, `reflectedSentence`를 활용한 경험 신호 chip 구성
- `jobTags`, `targetRoles` 우선 사용, fallback으로 `PM`, `운영기획`, `서비스기획` 제공
- `기록 이어가기/첫 경험 기록하기` CTA는 기존 `onOpenRecordInput({ date: selectedDate })` 재사용
- `이력서 후보 보기` CTA는 기존 `onOpenResumeResult` 재사용
- 기록 없음 상태는 부정 표현 없이 첫 기록 유도 문구 표시
- `actionStatus` useMemo와 `deriveHomeActionStatus` import 제거

### 검증 결과

```text
git diff --check: PASS
npm run build: FAIL
```

`npm run build` 실패 로그:

```text
'vite' is not recognized as an internal or external command
```

현재 판단:

- 새 worktree에 의존성 실행 환경이 준비되지 않아 `vite`를 찾지 못한 환경 문제로 보인다.
- 코드 변경으로 인한 컴파일 오류까지는 도달하지 못했다.
- 산출물 A는 구현 완료 후보지만, build 재검증과 diff/화면 확인 전에는 최종 완료로 확정하지 않는다.

### 건드리지 않은 영역

- 캘린더 변경 없음
- 하단 최근 기록/최근 리포트/추천 액션 변경 없음
- `WebWorkTraceRecordPage.jsx` 변경 없음
- `AiExperienceInboxPanel.jsx` 변경 없음

### 산출물 B로 넘길 사항

- 캘린더 제목/설명 개선
- 날짜 셀 `{recordCount}건` 표시 개선
- 선택 날짜 상세를 `경험 흐름 / 분석 신호 / 다음 행동` 구조로 변경

### 산출물 C로 넘길 사항

- 하단 `최근 기록`, `최근 리포트`, `추천 액션` 영역 재구성
- `최근 리포트` 표현을 `최근 커리어 인사이트`로 변경
- 추천 행동에 이유와 기대 효과 추가

## 산출물 A 후속 검증 계획

산출물 B로 넘어가기 전에 아래 검증을 먼저 수행한다.

1. `git diff -- src/components/home/HomeDashboard.jsx`로 실제 변경 범위를 확인한다.
2. `npm install` 또는 `npm ci`로 새 worktree 의존성을 준비한다.
3. `npm run build`를 다시 실행한다.
4. 가능하면 로컬 화면에서 상단 카드가 의도대로 보이는지 확인한다.
5. 상단 카드가 깨지거나 카피가 과하면 산출물 A만 재수정한다.

## 검증 기본값

```powershell
git diff --check
npm run build
```

## 다음 구현 순서

1. 산출물 A build/화면 재검증
2. 산출물 A 커밋
3. 산출물 B 캘린더 패치
4. 산출물 C 하단 3단 흐름 패치
5. 산출물 D~H 기준 전체 QA
