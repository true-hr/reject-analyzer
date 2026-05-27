# 조사 결과 요약

## 1. 현재 Git 상태

- 기준 원격 최신 커밋: `d771d00 fix: 자산맵 신뢰도 우선 표시 기준 보강`
- 기존 로컬 `main`은 `origin/main`보다 behind 상태였으므로, 실제 구현은 반드시 `origin/main` 기준 새 worktree/새 브랜치에서 진행한다.
- `batch/desktop-work-20260527`는 PR #577 merge 완료 후 남은 로컬 worktree 브랜치로 보며, 이번 UX 작업의 기준 브랜치로 쓰지 않는다.
- 기존 루트 worktree `D:\패스맵\reject-analyzer`에는 다른 변경이 섞여 있을 수 있으므로 checkout/수정 금지 상태로 본다.

## 2. 실제 화면 진입 경로

- 데스크톱 JOB 좌측 메뉴의 `업무 관리` → `jobSidebarView === "work"` → `HomeDashboard`
- 데스크톱 JOB 좌측 메뉴의 `경험 정리하기` → `jobSidebarView === "resume-update"` → `WebWorkTraceRecordPage`

## 3. 이번 UX 작업의 중심 화면

이번 작업의 중심은 `HomeDashboard`다.

`HomeDashboard`에는 아래 요소가 있다.

- 상단 4개 summary box
- 업무관리 캘린더
- 날짜 상세 / 이번 달 자산 요약
- 최근 기록 / 최근 리포트
- 추천 액션

## 4. 현재 UX 구조

### 상단

- `HomeDashboard.jsx`에서 `actionStatus.map()`으로 4개 박스 렌더링
- 데이터는 `deriveHomeActionStatus()`가 생성
- 현재 문구는 `이번 주 기록 상태 / 이번 주 해낸 일 / 이번 주 만든 이력서 문장 / 쌓이고 있는 커리어 방향`

### 캘린더

- `HomeDashboard.jsx` 내부에 자체 캘린더 UI가 있음
- 별도 `RecordCalendarCard.jsx`도 존재하지만, 현재 `업무 관리` 화면은 `HomeDashboard`의 내장 캘린더를 사용
- `RecordCalendarCard`는 `PmMvpView` 입력 화면 우측에서 사용

### 하단

- `HomeDashboard.jsx` 하단에 `최근 기록`, `최근 리포트`, `추천 액션`
- mock 데이터는 `homeDashboardMock.js`의 `recentUpdates`, `recentReports`, `recommendedActions`

### CTA

- 상단: `경험 정리하기`, `이력서 보기`
- 캘린더 날짜 상세: `이 날짜에 기록 추가`
- 월간 요약: `이력서 보기`
- 하단 최근 기록: `이번 주 기록하기`, disabled `전체 업데이트 보기`
- 추천 액션은 현재 텍스트 카드이며 행동 연결이 약함

### 빈 상태

- `아직 이번 주에 쌓인 업무 기록이 없어요`
- `아직 만든 문장이 없어요`
- `선택한 날짜에 기록된 업무가 아직 없습니다`
- `아직 표시할 강점이 없는 날짜입니다`
- 반복 빈 상태가 여러 곳에 분산됨

## 5. 문서 요구사항과 현재 코드 매핑

| 문서 요구사항 | 현재 코드 위치 | 구현 가능성 | 비고 |
|---|---|---:|---|
| `[업무 관리]` 표현을 경험 정리 중심으로 정리 | `src/App.jsx`, `HomeDashboard.jsx` | 높음 | 메뉴 label과 화면 title/description 조정 필요 |
| 상단 4개 요약 박스를 `최근 경험 분석 결과` 단일 카드로 통합 | `HomeDashboard.jsx`, `homeDashboardCalendarUtils.js` | 높음 | `actionStatus.map()` 영역을 단일 summary card로 교체 |
| 반복 빈 상태 표현 축소 | `HomeDashboard.jsx`, `homeDashboardCalendarUtils.js`, 일부 `RecordCalendarCard.jsx` | 높음 | 빈 문구를 한 곳의 안내/CTA로 합치는 방식 가능 |
| 캘린더를 경험 흐름/분석 신호/추천 행동 중심으로 개선 | `HomeDashboard.jsx`, 필요 시 `homeDashboardCalendarUtils.js` | 중간 | 구조 변경 폭이 가장 큼. DB 변경 없이 가능 |
| 하단을 `최근 경험 흐름 / 현재 강점 및 부족 신호 / 다음 추천 행동` 3개 흐름으로 단순화 | `HomeDashboard.jsx`, `homeDashboardMock.js` | 높음 | 기존 최근 기록/리포트/추천 액션 영역을 재배치 |
| 최근 리포트 → 최근 커리어 인사이트 | `HomeDashboard.jsx`, `homeDashboardMock.js` | 높음 | 단순 카피 변경 가능 |
| CTA를 맥락 기반 CTA로 변경 | `HomeDashboard.jsx` | 높음 | 기존 handler 재사용 가능 |
| AI 기반 경험 해석 → 직무 연결 → 이력서 후보 → 채용 가능성 강화 톤 | `HomeDashboard.jsx`, `homeDashboardCalendarUtils.js` | 높음 | 데이터는 기존 records 기반 추론으로 충분 |

## 6. 수정 파일 후보

| 파일 | 수정 목적 | 위험도 |
|---|---|---:|
| `src/components/home/HomeDashboard.jsx` | 핵심 UX 재구성: 상단 카드, 캘린더 주변, 하단 3흐름, CTA | 중 |
| `src/components/home/homeDashboardCalendarUtils.js` | 요약/신호/추천 문구 계산 helper 조정 | 중 |
| `src/components/home/homeDashboardMock.js` | 비로그인/demo 문구와 mock insight 정리 | 낮음 |
| `src/App.jsx` | 좌측 메뉴 `업무 관리` label 변경 가능 | 중, high-risk 파일 |
| `src/components/home/RecordCalendarCard.jsx` | `PmMvpView` 쪽 캘린더 톤까지 맞출 경우 | 중 |
| `src/components/workTrace/WebWorkTraceRecordPage.jsx` | #574와 연결되는 `저장 기록 검토` 카피 정리 시 | 중 |
| `src/components/experience/AiExperienceInboxPanel.jsx` | #574와 강한 충돌. 이번 패치에서는 되도록 제외 추천 | 중 |

## 7. 충돌 주의

PR #574가 open 상태이며 아래 파일과 충돌 가능성이 높다.

- `src/App.jsx`
- `src/components/workTrace/WebWorkTraceRecordPage.jsx`
- `src/components/experience/AiExperienceInboxPanel.jsx`

따라서 이번 작업은 가능하면 `HomeDashboard.jsx` 중심으로 제한한다.

## 8. 추천 작업 브랜치/워크트리

- 구현 브랜치 추천: `ux/user-experience-dashboard-reframe-20260528`
- 구현 worktree 추천: `D:\패스맵\worktrees\ux-user-experience-dashboard-reframe-20260528`
- 기준: 반드시 `origin/main`
