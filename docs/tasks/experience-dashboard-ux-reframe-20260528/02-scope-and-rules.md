# 작업 범위와 운영 규칙

## 작업 분류

이번 작업은 Standard Batch 작업이다.

## 허용 범위

- `HomeDashboard` 중심 UX 재구성
- 기존 helper 재사용
- mock/fallback copy 정리
- 기존 CTA handler 재사용
- 기존 기록 데이터 기반 신호 표시
- 문구 변경
- 반응형 UI 정리
- build 검증
- PR 생성

## 금지 범위

아래 작업은 하지 않는다.

- main 직접 수정
- main merge
- production deploy
- Vercel env 추가/수정/삭제
- Supabase schema 변경
- RLS 변경
- migration 적용
- 새 API 추가
- DB insert/update/delete/drop/alter/truncate 직접 실행
- force push
- git reset --hard
- git clean -fd
- rm -rf
- npm publish
- 인증/결제/배포/DB 구조 변경
- PR #574와 충돌 가능성이 큰 파일 대규모 수정

## 충돌 회피 규칙

PR #574와 충돌 가능성이 높은 아래 파일은 되도록 수정하지 않는다.

- `src/components/workTrace/WebWorkTraceRecordPage.jsx`
- `src/components/experience/AiExperienceInboxPanel.jsx`

`src/App.jsx`는 필요 시 메뉴 label 등 최소 수정만 허용한다.

## 질문 금지 규칙

작업 중 애매한 점이 생겨도 사용자에게 질문하지 않는다.

대신 아래 우선순위로 결정한다.

1. 이 폴더의 md 문서 기준을 따른다.
2. 실제 코드 구조를 따른다.
3. 기존 handler와 데이터 흐름을 재사용한다.
4. DB/env/deploy/main merge가 필요하면 해당 항목만 보류한다.
5. 나머지 작업은 계속 진행한다.

## 기본값

- 화면 타깃: 취준생/이직 준비자
- 내부 용어: 경험 정리
- 상단 카드 제목: 최근 경험 분석 결과
- 최근 리포트 대체어: 최근 커리어 인사이트
- 주요 CTA: 기록 이어가기 / 이력서 후보 보기
- 직무 fallback: PM / 운영기획 / 서비스기획
- 경험 신호 fallback: 문제 해결 및 후속 실행 / 협업 커뮤니케이션 / 운영 프로세스 정리
- AI 호출: 화면 진입 자동 호출 금지, 버튼 클릭 시만
- DB 변경: 금지

## 작업 중 판단 규칙

1. 유저용 화면을 우선한다.
2. 경험 정리 톤을 우선한다.
3. 실제 데이터 기반 표시를 우선한다.
4. 데이터가 없으면 부담 낮은 fallback을 쓴다.
5. 확정형 표현보다 가능성형 표현을 쓴다.
6. DB/env/deploy/main merge가 필요하면 하지 않고 보류한다.
7. PR #574와 충돌 가능성이 큰 파일은 피한다.
8. 목표 산출물 완성에 직접 필요한 수정만 한다.
9. 작은 문제 하나 때문에 전체 작업을 멈추지 않는다.
10. 최종 보고에 남기고 계속 진행한다.
