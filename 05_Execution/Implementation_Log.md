# Implementation Log

## 2026-04-02 DECISIVE LAYOUT CONTRACT AUDIT + ROOT-LEVEL WIDTH SYSTEM FIX

### Before
- 업무 관리 대비 이력서 계열 화면은 동일 서비스 안에서 공간 활용이 뒤처져 보였다.
- 문제 발생 순서는 `업무 관리 대비 이력서 화면의 공간 활용 열세` -> `result 화면 우측 대형 공백` -> `input(today/weekly) 화면에서도 유사 공백 반복` 이었다.

### Incomplete Diagnosis
- 초기에는 캘린더 자체 width 문제로 과도하게 해석한 지점이 있었다.
- 현재 보고 있는 screen branch와 다른 branch owner를 원인으로 잡은 불완전한 진단이 있었다.
- 즉 입력 화면 문제와 결과 화면 문제를 혼동한 것이 초반 판단 오류였다.

### Final Redefinition
- root cause는 `App.jsx` 상위 `max-w-6xl` cap + `PmMvpView` branch별 제각각인 width owner였다.
- result는 내부 문서폭 cap 중첩이 있었고, input은 branch 내부 2열 자체보다 상위 shell cap 영향이 더 직접적이었다.
- `PmMvpView`의 주요 screen branch는 `today`, `weekly`, `result`, `readiness`로 정리했다.
- root contract failure는 다음 3가지로 요약했다.
  - branch별 inner max-width 불일치
  - wrapper 중첩으로 usable width 손실
  - 공통 layout helper/contract 부재

### Actual Fix Direction
- App wrapper는 `w-full min-w-0` 쪽으로 책임을 축소했다.
- width owner를 `PmMvpView` screen contract 쪽으로 이동했다.
- branch별 역할을 분리했다.
  - today/weekly = full-width 작업형
  - result = document-width 읽기형
  - readiness = wide section
- 코드 라운드에서 업데이트된 파일은 `src/App.jsx`, `src/components/mvp/PmMvpView.jsx`, `docs/끄적.md`였다.

### Remaining Risk
- 실제 체감상 여전히 공백이 보일 수 있으므로 visual QA 재확인이 필요하다.
- headless 측정값과 실제 스크린샷 체감이 어긋날 수 있다.
- 수치상 fill과 사용자 체감상 허전함은 구분해서 봐야 한다.

## 2026-04-02 Resume View Top Simplification Follow-up

### Actual Applied Change
- `이력서 보기` 상단 군더더기 제거가 실제 코드 반영까지 완료되었다.
- 제거/비노출된 상단 요소
  - `이력서 보기`
  - `문서형 프리뷰`
  - 긴 설명문
  - `이력서 결과`
  - `최근 기록 기반 이력서 초안`
  - `오늘 기록 기준`
- 현재 상단은 `이력서 초안` 제목 + 짧은 1줄 설명 + 액션 버튼 3개 + 바로 이어지는 본문 구조다.

### Action Button Label Update
- `복사/저장 준비` -> `이력서 가져오기`
- `이력서 업데이트` -> `이력서 내보내기`
- 신규 액션 추가 -> `이력서 다운로드`
- 버튼 배치는 `flex-wrap` 유지로 작은 폭에서도 자연스럽게 줄바꿈되도록 정리되었다.

### Meaning of This Round
- `이력서 보기`는 상단 설명/배지/탭이 먼저 힘을 잡는 화면이 아니라, 본문 first paint가 먼저 와야 하는 문서형 화면이라는 방향이 실제 구현 상태로 고정되었다.
- 현재 남은 과제는 UI 정보구조가 아니라 본문 문장 디테일 개선 쪽으로 이동했다.
- 다음 우선순위
  - 소개 문단 다듬기
  - 경력 bullet 실무형 보강
  - 성과 문장 표현 개선

### Action Placeholder Note
- 버튼 라벨은 정리됐지만 `가져오기 / 내보내기 / 다운로드` 실제 동작은 아직 일부 placeholder 성격이 남아 있다.
- 기능 정의와 내보내기/다운로드 차이는 후속 라운드에서 구체화가 필요하다.

### Build
- 최신 코드 반영 이후 `npm run -s build` 통과 기준을 유지한다.

### Recurrence Prevention
- 상단 설명/배지/탭이 실제 본문보다 먼저 힘을 잡지 않게 할 것.
- 문서형 화면은 본문 first paint가 중요하다는 기준을 유지할 것.

## 2026-04-02 JOB Shell-Level Left Rail Round
- 클로드가 `src/App.jsx`에서 공용 hero 제거와 JOB 2열 루트 재작성을 시도하는 과정에서 fragment / 닫힘 구조를 반복적으로 꼬이게 만들었다.
- JSX 구조 불안정이 누적되어 안전한 부분 패치가 아니라 구조 복구 이슈로 번졌고, 해당 시점에서 Ctrl+Z로 복귀했다.
- 이후 작업 주체를 Codex로 전환해, 문제를 JOB 내부 UI가 아니라 Shell-level layout anchor 관점에서 다시 진단했다.
- 최종 판단은 Shell의 centered wrapper (`mx-auto + max-w-6xl`)가 JOB 우측 content 폭을 먼저 제한하고 있었다는 점이다.
- 따라서 centered content 내부 카드형 사이드바 접근은 폐기하고, Shell-level left rail + right content 구조를 채택했다.
- 이 변경으로 left rail 자체 문제는 해결됐고, right content는 view별 성격 차이가 더 명확하게 드러났다.
- `analysis`는 landing / entry 성격이라 wide가 과하게 느껴졌고, `work`(`HomeDashboard`)는 dashboard 성격이라 wide가 자연스러웠다.
- 현재 round의 핵심 결론은 Shell-level left rail 해결 완료, 다음 핵심 작업은 view별 width policy 분리다.

## 이번 라운드 로그
- 근본 원인 발견: Shell의 centered wrapper가 JOB 우측 content 폭을 먼저 제한하고 있었다.
- 해결 단계는 아래 순서로 정리된다.
  1. Shell-level left rail 도입
  2. right content width bottleneck 제거
  3. `analysis` / `work` width policy 구분
  4. `work` 월간 캘린더 전환
  5. normalized records / derived summary 도입
  6. 선택 날짜 자산화 카드와 이번 달 자산 요약 반영
- `work` 화면은 이제 시스템 단계가 아니라 실제 업무 유형 기준 월간 캘린더를 중심으로, 날짜 클릭 시 자산화 결과를 읽는 구조까지 올라왔다.
- 아직 실제 Notion / Google Calendar fetch/auth 연동은 없고, adapter-ready contract만 잠가 둔 상태다.

## 실패/복구 기록
- Claude가 `App.jsx`에서 공용 hero 제거와 JOB 2열 루트 재작성까지 한 번에 건드리면서 fragment / 닫힘 구조를 반복적으로 꼬이게 만들었다.
- 해당 접근은 large orchestration 파일에서 구조 안정성을 잃는 방향이었고, 안전한 국소 패치가 불가능해져 Ctrl+Z로 복귀했다.
- 복귀 후 Codex 전환으로 작업 방식을 바꿨고, JOB 내부 카드 배치보다 Shell/anchor를 먼저 보는 진단으로 전환했다.

## 원인과 해결
- JOB 레이아웃 문제는 JOB 내부 카드 배치가 아니라 Shell-level centered wrapper 문제였다.
- centered wrapper 내부 사이드바 접근은 폐기했다.
- Shell-level left rail + right content 구조를 채택했다.
- 이후 `work`는 월간 캘린더 + records 기반 구조로 전환했고, 선택 날짜 자산화 카드까지 연결했다.
- 현재 한계는 실제 데이터 연동이 아니라 mock/normalized contract 단계라는 점과, `App.jsx`가 여전히 큰 orchestration 파일이라는 점이다.

## 재발 방지 규칙
- 레이아웃/앵커 문제는 국소 패치로 오래 끌지 말 것.
- root cause가 Shell/anchor 수준이면 초기에 구조 한계를 먼저 말할 것.
- `App.jsx` 같은 큰 orchestration 파일은 대형 구조 수정 대신 exact-anchor 기준 국소 패치를 우선할 것.
- UI 문제를 컴포넌트 내부에서만 반복 보정하지 말고, centered wrapper 같은 상위 anchor를 먼저 의심할 것.

## 2026-04-02 PASSMAP UI/UX Correction and IA Follow-up
- `src/App.jsx` 기준으로 사이드바 IA를 보강했다. 현재 기준 직무를 persistent context로 노출하고, settings 및 알림 설정 shell을 추가했다.
- `src/components/mvp/PmRecordInput.jsx`는 큰 블록 숨기기 방향을 폐기하고 chip editor 방식으로 수정했다.
- `src/components/mvp/PmMvpView.jsx`는 별도 캘린더 패널 대신 공용 `src/components/home/RecordCalendarCard.jsx`를 쓰도록 연결했다.
- `src/components/home/HomeDashboard.jsx`는 홈 요약 카드와 기록 흐름의 owner 기준으로 유지한다.
- 구현 완료와 최종 UX 검증은 분리해서 본다.
  - 구현/빌드 완료: chip 삭제/추가, textarea 하단 이동, 공용 캘린더 카드 연동, 사이드바/설정 shell 보강, build 통과
  - 확인 대기: 브라우저 실제 클릭 UX, resume/work 캘린더 체감 일관성, 홈 CTA 축소 반영 최종 확인

## 2026-04-02 PASSMAP Product Decision Logging Update
- 실제 구현된 구조 변화
  - 업무 관리 홈 핵심 카드는 `오늘 기록 상태 / 이번 주 해낸 일 / 이번 주 만든 이력서 문장 / 쌓이고 있는 커리어 방향` 기준으로 확정했다.
  - 상단 CTA 3카드는 main hero가 아니라 secondary quick actions로 축소/재배치하는 방향을 설계 판단으로 잠갔다.
  - settings shell과 settings 내부 알림 설정 shell을 1차 구조 수준으로 반영했다.
  - 현재 기준 직무는 설정 내부 값이 아니라 sidebar persistent context로 두는 구조 판단을 확정했다.
- 잘못된 방향에서 수정된 내용
  - `PmRecordInput`의 section hide/show 접근은 오판으로 기록한다.
  - 최종 수정 기준은 큰 섹션 유지 + 섹션 내부 chip 삭제/추가 방식이다.
  - 자유서술 textarea는 상단보다 하단이 더 자연스럽다는 판단으로 이동 방향을 확정했다.
- 공용 캘린더 관련 기록
  - resume 화면의 기록 캘린더는 work와 분리된 mock처럼 보이면 안 된다는 판단을 남긴다.
  - 공용 `RecordCalendarCard`를 기준으로 범례 / 월간 캘린더 / 표시 규칙을 통일하는 방향을 채택했다.
  - resume 화면에서 density tuning이 빠져 UI가 깨져 보인 것은 공용화 실패가 아니라 compact 변형 부족 문제로 기록한다.
- taxonomy 관련 기록
  - 현재 기준 직무의 기존 혼합 라벨(`프로덕트(기획/전략)` 등)은 PASSMAP taxonomy와 불일치하므로 장기 기준으로 유지하지 않는다.
  - 목표 방향은 대분류 / 중분류 2단 선택과 `대분류 > 중분류` 표시값 정렬이다.
  - 이 항목은 구현됨 / 확인 대기이며, fully wired final state로 기록하지 않는다.
- build
  - `npm run build` 통과
- 브라우저 확인 대기 항목
  - 브라우저 실제 클릭 UX 최종 확인
  - resume/work 화면 캘린더 체감 일관성 확인
  - 업무 관리 상단 CTA 축소/재배치 최종 반영 여부
  - resume 화면 compact layout 실제 반영 검토
  - 현재 기준 직무 taxonomy 2단 선택 fully wired 여부

## 이번 라운드 핵심 판단
- `이력서 보기`는 이력서 생성 결과 대시보드가 아니라, 실제 이력서 문서처럼 읽히는 화면이어야 한다.
- `이력서 업데이트`는 기록 입력 / 수정 / 추가 / 반영 준비를 담당하는 별도 화면이어야 한다.
- `before / after`, 강점 카드, 최종 결과 카드 중심 구조는 `이력서 보기`의 주인공이 아니며 축소 대상이다.

## 잘못 잡았던 방향과 교정
- 번복된 판단
  - `이력서 보기 = 결과 대시보드 방향` 폐기
  - `이력서 보기 = 실제 이력서 문서 방향` 채택
- 잘못된 기준
  - 비교 블록이 첫 화면 주인공이 되는 구조
  - 강점 카드와 결론 카드가 본문보다 먼저 힘을 잡는 구조
- 현재 교정 기준
  - 문서 제목
  - 액션 버튼
  - 바로 이어지는 실제 이력서 본문

## 현재 우선순위
1. `이력서 보기` 상단 군더더기 제거
2. 버튼 라벨을 사용자 액션 기준으로 교체
3. 본문 구조는 유지하되 소개 / 경력 bullet / 성과 문장을 더 실무형으로 다듬기

## 아직 미완료인 것
- 상단 배지 / 설명 / 탭성 요소의 완전 제거 상태 최종 확인
- 버튼명 교체의 실제 UI 반영 상태 확인
- 본문 문장 디테일 보강

## 재발 방지 규칙
- 이름이 `이력서 보기`라면 먼저 실제 이력서 형식에 맞는지 검증한다.
- 결과 대시보드와 문서형 제출물 UI를 혼동하지 않는다.
- 상단 안내 / 배지 / 탭이 본문보다 앞에서 힘을 잡지 않게 한다.
