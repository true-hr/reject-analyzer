# 산출물 E 상세 정의: 데이터 연결 기준

## E-0. 이 산출물의 목적

`HomeDashboard`의 경험 분석 결과, 경험 흐름 캘린더, 하단 커리어 인사이트가 실제 기록 기반으로 보이도록 데이터 연결 기준을 명확히 한다.

사용자가 화면을 봤을 때 아래처럼 느껴야 한다.

> 이 화면은 임의로 만든 문구가 아니라, 내가 남긴 기록을 바탕으로 경험 신호와 다음 행동을 정리하고 있구나.

이 산출물의 핵심은 `그럴듯한 하드코딩`이 아니라, 기존 데이터와 helper를 최대한 재사용해 신뢰 가능한 fallback 구조를 만드는 것이다.

---

## E-1. 데이터 연결 기본 원칙

이번 작업은 DB schema 변경 없이 구현한다.

허용:

- 기존 `work_records` 읽기
- 기존 `experience_cards` 읽기
- 기존 `resume_material_cards` 읽기
- 기존 helper 재사용
- 기존 mock/fallback 데이터 정리
- 기존 raw_payload에서 안전하게 읽을 수 있는 값 활용

금지:

- Supabase schema 변경
- RLS 변경
- migration 추가
- 새 table 추가
- 기존 table 컬럼 변경
- Vercel env 변경
- API endpoint 변경
- 저장/삭제/수정 SQL 직접 실행

---

## E-2. 사용 가능한 데이터 후보

우선 조사 결과 기준으로 아래 데이터를 우선 사용한다.

```text
work_records
experience_cards
resume_material_cards
homeDashboardMock
homeDashboardCalendarUtils
recordToResumeCandidate
buildExperienceSignalsFromRecord
recommendResumeSkills
```

파일 기준:

```text
src/components/home/HomeDashboard.jsx
src/components/home/homeDashboardCalendarUtils.js
src/components/home/homeDashboardMock.js
src/lib/workRecordRepository.js
src/lib/resume/buildExperienceSignalsFromRecord.js
src/lib/resume/recordToResumeCandidate.js
src/lib/resume/recommendResumeSkills.js
```

---

## E-3. 데이터 우선순위

모든 UX 표시값은 아래 우선순위를 따른다.

1. 실제 로그인 사용자 데이터
2. 실제 기록에서 파생된 helper 결과
3. 기존 mock/demo 데이터
4. 명시적 fallback 문구

즉, 실제 기록이 있으면 fallback을 먼저 보여주면 안 된다.

---

## E-4. 상단 카드 데이터 기준

상단 `최근 경험 분석 결과` 카드에 필요한 데이터는 아래다.

### 반복 경험 신호

우선순위:

1. 최근 work_records의 `strength_tags`
2. 최근 work_records의 `skill_tags`
3. raw_payload 내부 candidate/signal/tag 계열 값
4. `buildExperienceSignalsFromRecord` 결과
5. title/description에서 기존 코드가 추출 가능한 tag
6. fallback

fallback:

```text
문제 해결 및 후속 실행
협업 커뮤니케이션
운영 프로세스 정리
```

### 연결 가능 직무

우선순위:

1. `currentCareerRoleLabel`
2. 기존 App/HomeDashboard 상태의 target job label
3. record/candidate/helper에서 추론 가능한 target job
4. fallback

fallback:

```text
PM / 운영기획 / 서비스기획
```

### 상태 배지

기록 수 또는 신호 유무를 기준으로 아래처럼 나눈다.

| 조건 | 배지 |
|---|---|
| 실제 기록 3개 이상 또는 신호 3개 이상 | 기록 기반 분석 |
| 실제 기록 1~2개 | 초기 분석 |
| 실제 기록 없음 | 첫 기록 대기 중 |

배지에 `0건`, `없음`, `미완료`를 쓰지 않는다.

---

## E-5. 캘린더 데이터 기준

캘린더는 날짜별 기록 여부만 보는 것이 아니라, 날짜별 경험 신호를 함께 보여준다.

### 날짜별 기록 데이터

우선순위:

1. work_records의 날짜 필드
2. 기존 calendar utils가 만든 date view model
3. mock calendar data
4. fallback empty state

### 날짜별 신호 데이터

우선순위:

1. 해당 날짜 record의 strength_tags
2. 해당 날짜 record의 skill_tags
3. raw_payload 기반 signal
4. title/description 기반 inferred tag
5. fallback 없음

주의:

기록이 없는 날짜에는 가짜 신호를 보여주지 않는다. 대신 첫 기록 유도 문구를 보여준다.

---

## E-6. 하단 인사이트 데이터 기준

하단 3단 흐름은 아래처럼 데이터를 매핑한다.

| 하단 섹션 | 데이터 우선순위 |
|---|---|
| 최근 경험 흐름 | 최근 work_records → recentUpdates mock → fallback |
| 현재 강점 신호 | strength_tags/skill_tags → helper signal → fallback |
| 부족/보완 신호 | improvement hints → missing fields 감지 → fallback |
| 다음 추천 행동 | 부족 신호 기반 → recommendedActions mock → fallback |

### 부족/보완 신호 기본 fallback

```text
정량 성과
사용자 반응
비즈니스 임팩트
협업 맥락
```

### 다음 추천 행동 기본 fallback

```text
성과 정보 추가하기
협업 맥락 보완하기
이력서 후보 보기
```

---

## E-7. 데이터가 부족한 경우의 표현 규칙

데이터가 부족할수록 확정형 표현을 줄인다.

### 기록 없음

```text
아직 기록이 없어도 괜찮아요. 오늘 한 일을 한 줄만 남기면 경험 신호를 찾아드릴게요.
```

### 기록 1~2개

```text
아직 기록은 많지 않지만, 남겨둔 경험에서 보이는 초기 신호를 정리했어요.
```

### 기록 3개 이상

```text
최근 기록에서 반복적으로 나타나는 경험 신호와 직무 연결 가능성을 정리했어요.
```

---

## E-8. 하드코딩 허용/금지 기준

### 허용되는 하드코딩

- 빈 상태 안내 문구
- fallback 신호 3개
- fallback 직무 3개
- mock/demo 사용자용 문구
- CTA 설명 문구

### 금지되는 하드코딩

- 실제 기록이 있는데도 항상 같은 신호만 표시
- 특정 직무를 사용자의 실제 목표처럼 단정
- 합격/채용 가능성을 수치처럼 단정
- 존재하지 않는 AI 분석 결과를 실제 분석처럼 표시
- 실제 저장/변환이 되지 않는데 완료된 것처럼 표시

---

## E-9. 신뢰도 표현 기준

데이터 근거가 약하면 `확정` 대신 `초기`, `가능성`, `예시` 표현을 쓴다.

권장 표현:

```text
초기 신호
연결 가능성이 보입니다
기록을 더 남기면 더 정확해져요
예시로 이런 신호를 찾아볼 수 있어요
```

피해야 할 표현:

```text
분석 완료
검증된 결과
확정된 직무
합격 가능성
```

---

## E-10. 구현 위치 기준

우선 구현 위치:

```text
src/components/home/HomeDashboard.jsx
```

helper 조정 가능:

```text
src/components/home/homeDashboardCalendarUtils.js
src/components/home/homeDashboardMock.js
```

데이터 읽기 흐름 확인만 가능:

```text
src/lib/workRecordRepository.js
src/lib/resume/buildExperienceSignalsFromRecord.js
src/lib/resume/recordToResumeCandidate.js
src/lib/resume/recommendResumeSkills.js
```

주의:

repository/lib 파일은 기존 함수 재사용 목적의 read 우선이다. 대규모 로직 변경은 하지 않는다.

---

## E-11. 완료 체크리스트

```text
[ ] 상단 카드가 실제 기록 기반 신호를 우선 사용한다.
[ ] 기록이 없을 때 fallback이 예시/첫 기록 유도로 표시된다.
[ ] 캘린더 날짜별 신호가 실제 해당 날짜 기록과 연결된다.
[ ] 하단 강점/보완 신호가 실제 기록 또는 명확한 fallback에서 나온다.
[ ] 데이터 근거가 약한 경우 가능성형 표현을 사용한다.
[ ] 실제 데이터가 있는데 고정 fallback만 반복되지 않는다.
[ ] DB schema / RLS / env / API 변경 없이 구현된다.
[ ] 존재하지 않는 분석 결과를 실제 결과처럼 표시하지 않는다.
```

---

## E-12. 검증 방법

### 코드 검증

```powershell
git diff --check
npm run build
```

### 데이터 상태별 화면 검증

1. 로그인 전/mock 상태
2. 로그인 후 기록 없음
3. 기록 1~2개
4. 기록 여러 개
5. strength_tags가 있는 기록
6. description만 있는 기록
7. raw_payload가 비어 있는 기록

확인 질문:

```text
실제 기록이 있으면 그 기록 기반 신호가 보이는가?
기록이 없을 때 가짜 분석처럼 보이지 않는가?
fallback이 예시 또는 시작 안내처럼 보이는가?
데이터가 부족할수록 표현이 조심스러운가?
```

---

## E-13. 작업 중 판단 규칙

1. 실제 데이터 우선.
2. helper 재사용 우선.
3. 데이터가 없으면 명확한 fallback.
4. fallback은 실제 분석처럼 가장하지 않는다.
5. DB/API/env 변경은 하지 않는다.
6. 데이터 구조가 불명확하면 해당 항목만 보류하고 나머지를 계속한다.
7. 산출물 E 체크리스트를 만족하지 못하면 완료로 보고하지 않는다.
