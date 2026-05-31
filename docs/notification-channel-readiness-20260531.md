# PASSMAP 알림 채널 전환 준비도 정리

## 1. 현재 기준선

- `origin/main`에는 `0988ebc Prepare reminder rules scheduler` 커밋이 포함되어 있다.
- 해당 커밋은 multi-reminder rules와 dry-run scheduler draft 준비 파일만 추가한다.
- 추가 파일:
  - `supabase/sql/20260531_reminder_rules.sql`
  - `supabase/functions/send-experience-recall-reminders/index.ts`
  - `supabase/sql/drafts/20260531_reminder_rules_draft.sql`
- DB apply 없음.
- Edge Function deploy 없음.
- cron 변경 없음.
- push 실제 발송 없음.

## 2. 현재 구현 상태

현재 운영 축은 기존 Web Push 리마인더 구조다.

- 기존 `reminder_preferences`
- 기존 `reminder_deliveries`
- 기존 `send-weekly-experience-recall-push`
- 기존 `push_subscriptions`

현재 구조의 기준:

- 모두 `user_id` 기준이다.
- 실제 발송 채널은 `web_push` 단일 채널이다.
- `reminder_deliveries.delivery_channel`은 현재 `web_push`만 허용한다.

## 3. 보류 상태

- `supabase/sql/20260531_reminder_rules.sql`는 Protected DB migration candidate다.
- 명시 승인 전 DB apply 금지 상태를 유지한다.
- `send-experience-recall-reminders`는 dry-run scheduler draft다.
- `person_id` 반영 전 운영 적용 금지 상태를 유지한다.
- 기존 weekly cron과 신규 scheduler cron을 동시에 live로 두면 안 된다.

## 4. Kakao/SMS 판단

- Kakao 알림톡/SMS는 즉시 연동하지 않는다.
- SOLAPI는 1차 PoC 후보로 유지한다.
- 실제 도입 전에는 아래 준비가 먼저 필요하다.
  - 사업자 인증
  - 발신번호 등록
  - 카카오 비즈니스 채널 또는 발신 프로필
  - 알림톡 템플릿 승인
  - 전화번호 인증
  - 알림 목적별 수신 동의
  - 마케팅 동의 분리
  - 광고성 SMS 시 080 수신거부 조건 검토
- 위 준비와 승인이 끝나기 전까지 Web Push를 운영 채널로 유지한다.

## 5. person_id 판단

- Google/Kakao/Naver 로그인 통합은 `auth.users.id` 기준이 아니라 `person_id` 기준으로 가야 한다.
- 현재 저장소에는 다음 운영 구조가 없다.
  - `person_id`
  - `linked_auth_users`
  - `notification_contacts`
  - `person_consents`
- 기존 `resume_*` 계열의 `email`, `contact`, `consent` 필드는 이력서 추천 신청과 이력서 자산 저장 목적이다.
- 기존 resume/contact 계열 필드는 알림톡/SMS 운영 동의 구조로 재사용하지 않는다.

## 6. 다음 개발 전 선행 조건

- provider 후보 확정.
- SOLAPI 사업자 인증 가능 여부 확인.
- SMS fallback용 발신번호 준비.
- 카카오 비즈니스 채널과 알림톡 템플릿 준비.
- 전화번호 인증 및 수신동의 정책 확정.
- `person_id` 계정 통합 설계 확정.
- 그 이후 `reminder_rules_v2` 설계.
