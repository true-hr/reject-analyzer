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

### 1차 검증 결과

```text
git diff --check: PASS
npm run build: FAIL
```

`npm run build` 1차 실패 로그:

```text
'vite' is not recognized as an internal or external command
```

1차 판단:

- 새 worktree에 의존성 실행 환경이 준비되지 않아 `vite`를 찾지 못한 환경 문제로 보였다.
- 코드 변경으로 인한 컴파일 오류까지는 도달하지 못했다.

## 산출물 A 재검증 결과

### Git 상태

```text
M src/components/home/HomeDashboard.jsx
```

추가 관찰:

- `node_modules` / `dist`는 git status에 잡히지 않음.
- git ignore 경고: `C:\Users\LG/.config/git/ignore` permission denied.
- `HomeDashboard.jsx` 외 산출물 A 관련 코드 변경 없음.

### diff 요약

- `deriveHomeActionStatus` import와 `actionStatus` useMemo 제거
- 상단 `actionStatus.map()` 4개 요약 박스 제거
- 단일 `최근 경험 분석 결과` 카드 추가
- `반복 경험 신호`, `연결 가능성이 보이는 직무`, `기록 이어가기/첫 경험 기록하기`, `이력서 후보 보기` 확인
- 캘린더/하단 영역 diff 없음

### 의존성 설치/빌드

- `node_modules`가 없어 설치 필요 상태였음.
- `package-lock.json` 존재 확인 후 `npm ci` 실행.
- `npm ci`는 기존 peer dependency 충돌로 실패: `@react-pdf/renderer@3.4.5` vs React 19.
- package 수정 없이 `npm ci --legacy-peer-deps` 실행했고 성공.
- npm audit 경고: 14 vulnerabilities 표시, 수정하지 않음.

### build 결과

```text
npm run build: PASS
Vite build 완료: ✓ built in 1m 7s
```

세부:

- 1차 build는 120초 timeout.
- 제한 시간을 늘려 재실행 후 성공.
- 남은 경고는 기존 성격으로 보임: JSON import attributes 일관성, dynamic/static import 중복, 큰 chunk 경고.

### 화면 확인

- 실제 브라우저 화면 확인은 수행하지 않음.
- 새 브라우저 자동화 도구 설치나 GUI 실행 없이 진행 가능한 범위에서는 코드/빌드/문자열 기준으로 확인.

### 산출물 A 체크리스트 결과

```text
상단 4개 요약 박스 제거: PASS
단일 `최근 경험 분석 결과` 카드 존재: PASS
반복 경험 신호 chip 존재: PASS
연결 가능성이 보이는 직무 존재: PASS
CTA `기록 이어가기/첫 경험 기록하기`, `이력서 후보 보기` 존재: PASS
기록 없음 상태 유도 문구 존재: PASS
금지 표현 검색: `actionStatus.map`, `이번 주 만든 이력서 문장`, `쌓이고 있는 커리어 방향`, `이력서로 변환하기` 미검출
build: PASS
```

## 산출물 A 시각 QA 결과

### Git 상태

```text
M src/components/home/HomeDashboard.jsx
```

추가 관찰:

- QA 중 생성된 `test-results/`는 정리 완료.
- 기존 git ignore permission 경고는 계속 표시됨.

### dev server

```text
npm run dev: PASS
확인 URL: http://127.0.0.1:5175/reject-analyzer/ 및 후속 시도 포트들
HTTP 200 확인
```

### 화면 확인 결과

- 기본 URL 캡처는 성공했지만 `HomeDashboard`가 아니라 랜딩/홈 화면이 표시됨.
- `업무 관리` 진입 후 `HomeDashboard` 캡처 자동화를 시도했으나 최종 시각 확인은 완료하지 못함.

### 실패/제약 사유

- Chrome/Edge headless 직접 캡처는 GPU/프로세스 오류 또는 기존 세션 오염으로 불안정.
- Playwright CLI screenshot은 단순 URL 캡처는 가능했지만 클릭 진입이 필요함.
- Playwright test/Node 스크립트 방식은 로컬 패키지 require 문제로 실패.
- CDP 방식은 실행됐지만 앱 body가 빈 화면으로 캡처되어 실제 QA에 쓸 수 없었음.

### 확인 항목 판정

```text
기존 4개 요약 박스 미노출: 시각 확인 미완료
`최근 경험 분석 결과` 첫인상: 시각 확인 미완료
chip 과밀 여부: 시각 확인 미완료
연결 직무 영역 자연스러움: 시각 확인 미완료
CTA 자연스러움: 시각 확인 미완료
모바일 넘침 여부: 시각 확인 미완료
```

### 산출물 A 현재 판정

- 코드 기준 PASS.
- build 기준 PASS.
- dev server HTTP 200 확인.
- 시각 QA는 `PARTIAL`.
- 추가 코드 수정은 하지 않음.
- 캘린더/하단/WebWorkTraceRecordPage/AiExperienceInboxPanel 수정 없음.
- 실제 브라우저로 `업무 관리` 화면에 직접 진입해 상단 카드만 확인하면 산출물 A 확정 가능.

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

## 산출물 A 남은 확인

산출물 B로 넘어가기 전에 가능하면 아래를 확인한다.

1. 사용자가 직접 로컬 브라우저에서 `HomeDashboard` / `업무 관리` 화면 상단 카드 실제 시각 확인.
2. 모바일 폭에서 카드/CTA/chip 줄바꿈 확인.
3. 기록 없음/기록 있음 상태에서 문구가 자연스러운지 확인.
4. 이상 없으면 산출물 A를 커밋한다.

## 검증 기본값

```powershell
git diff --check
npm run build
```

## 다음 구현 순서

1. 산출물 A 사용자 직접 브라우저/모바일 시각 QA
2. 산출물 A 커밋
3. 산출물 B 캘린더 패치
4. 산출물 C 하단 3단 흐름 패치
5. 산출물 D~H 기준 전체 QA
