# PASSMAP person_id 계정 통합 설계 원칙

## 1. 배경

- 현재 Supabase Auth의 `auth.users.id`는 provider별로 달라질 수 있다.
- Google, Kakao, Naver로 각각 로그인하면 PASSMAP 제품 관점의 같은 사람이어도 DB 기준으로는 다른 사용자처럼 보일 수 있다.
- 알림, 업무기록, AI Inbox, 캘린더, 이력서 자산, 컨설팅 연결을 장기적으로 한 사람 기준으로 묶으려면 `person_id`가 필요하다.

## 2. 핵심 원칙

- `auth.users.id`는 로그인 계정 식별자다.
- `person_id`는 PASSMAP의 실제 사람 단위 식별자다.
- 자동 병합은 금지한다.
- 사용자 명시 동의 없는 provider 연결은 금지한다.
- 이메일, 이름, 전화번호 단독 기준 병합은 금지한다.
- 기존 데이터의 임의 이전은 금지한다.
- 알림 연락처와 이력서/신청 연락처는 분리한다.

## 3. 개념 모델

이 섹션은 SQL migration이 아니라 개념 설계다.

### `persons`

- PASSMAP 사람 단위 루트.
- `display_name`: 사용자에게 표시할 이름.
- `primary_email`: 대표 이메일.
- `primary_phone`: 대표 전화번호.
- `primary_user_id`: 대표 로그인 계정의 `auth.users.id`.

### `linked_auth_users`

- `person_id`: 연결된 사람 단위 식별자.
- `auth_user_id`: Supabase Auth 사용자 ID.
- `provider`: `google`, `kakao`, `naver` 등 로그인 provider.
- `provider_email`: provider에서 확인된 이메일.
- `provider_phone`: provider에서 확인된 전화번호가 있을 경우의 값.
- `is_primary`: 대표 로그인 계정 여부.
- `linked_at`: 연결 시각.

### `notification_contacts`

- `person_id`: 알림 연락처 소유자.
- `channel`: `web_push`, `kakao_alimtalk`, `sms`, `email` 등 알림 채널.
- `destination`: 채널별 목적지. 예를 들어 전화번호, 이메일, push endpoint 참조 등.
- `is_verified`: 목적지 검증 여부.
- `is_primary`: 대표 알림 연락처 여부.
- `consent_status`: 현재 수신 가능 상태.

### `person_consents`

- `person_id`: 동의 주체.
- `consent_type`: 알림, 마케팅, 개인정보 처리 위탁 등 동의 유형.
- `status`: 동의, 철회, 만료 등 현재 상태.
- `agreed_at`: 동의 시각.
- `revoked_at`: 철회 시각.
- `source`: 동의가 수집된 화면이나 절차.

## 4. 계정 연결 UX 원칙

예시 메시지:

> 현재 Google 계정으로 로그인 중입니다. Kakao/Naver 계정을 연결하면 같은 PASSMAP 계정으로 기록과 알림을 함께 관리할 수 있습니다.

예상 버튼:

- 카카오 계정 연결
- 네이버 계정 연결
- 휴대폰 번호 인증

UX 원칙:

- 연결 전 사용자가 무엇이 합쳐지는지 확인해야 한다.
- 연결 후 어떤 기록, 알림, 연락처가 공유되는지 보여줘야 한다.
- 연결 해제 정책은 별도로 정의해야 한다.
- 연결 실패, 이미 연결된 계정, 다른 person에 연결된 계정 케이스를 분리해야 한다.

## 5. 데이터 이전/백필 원칙

- 기존 `user_id` 기반 데이터는 즉시 이동하지 않는다.
- 1차는 `person_id` 생성 후 `primary_user_id`를 기존 auth user로 연결한다.
- 기존 데이터 backfill은 별도 Protected 작업이다.
- 자동 병합 없이 로그인 중인 사용자가 직접 연결한 auth user만 묶는다.
- 충돌 가능 케이스는 수동 검토한다.

## 6. reminder_rules_v2에 미치는 영향

- 기존 `reminder_preferences`, `reminder_deliveries`, `push_subscriptions`는 `user_id` 기준이다.
- `reminder_rules_v2`는 `person_id` 기준을 우선 검토한다.
- Web Push subscription은 기기/브라우저 특성상 auth user 기준과 person 기준의 매핑 정책이 필요하다.
- Kakao/SMS/Email은 `notification_contacts.person_id` 기준으로 가야 한다.
- person_id 설계 전 `reminder_rules` remote DB apply는 금지한다.

## 7. 금지/보류 사항

- DB migration 작성 금지.
- Supabase SQL 적용 금지.
- auth provider 설정 변경 금지.
- Kakao/SMS 연동 금지.
- 기존 `user_id` 데이터를 자동 이동 금지.
- 기존 resume/contact 필드를 notification contact로 재사용 금지.

## 8. 다음 액션

- person_id 개념 설계 리뷰.
- 계정 연결 UX 세부 정책 확정.
- `notification_contacts` / `person_consents` 세부 `consent_type` 정의.
- 그 다음에야 Protected DB migration draft 작성.
- 이후 `reminder_rules_v2` 설계.
