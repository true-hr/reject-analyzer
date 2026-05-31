# PASSMAP 알림 연락처 및 동의 유형 정의

## 1. 배경

- PASSMAP은 Web Push에서 Kakao 알림톡, SMS, Email까지 확장할 수 있다.
- 실제 운영 채널 확장 전, 연락처와 동의 구조를 먼저 정의해야 한다.
- `person_id` 기준 계정 통합 원칙에 따라 알림 연락처도 `person_id` 기준으로 관리해야 한다.
- 기존 resume/contact 계열 필드는 알림용 연락처/동의로 재사용하지 않는다.

## 2. notification_contacts 개념

이 섹션은 SQL migration이 아니라 개념 설계다.

- `person_id`: 알림 연락처 소유자.
- `channel`: 알림 채널.
  - `web_push`
  - `kakao_alimtalk`
  - `sms`
  - `email`
- `destination`: 채널별 목적지.
  - push endpoint 참조
  - 전화번호
  - 이메일
  - kakao recipient key 등 추후 provider 식별자
- `is_verified`: 연락처 또는 목적지 검증 여부.
- `verified_at`: 검증 완료 시각.
- `is_primary`: 해당 채널 또는 사람 단위의 대표 연락처 여부.
- `consent_status`: 현재 수신 가능 상태.
- `created_at`: 생성 시각.
- `updated_at`: 수정 시각.
- `disabled_at`: 비활성화 시각.

## 3. 채널별 연락처 정책

### Web Push

- 브라우저/기기 단위다.
- 기존은 `push_subscriptions.user_id` 기준이다.
- person_id 전환 시 auth user와 person의 매핑 정책이 필요하다.
- 사용자가 브라우저 권한을 거부하거나 철회할 수 있다.
- 운영 채널로 유지하되 장기적으로 보조 채널로 둔다.

### Kakao 알림톡

- 전화번호 또는 provider 수신 식별자가 필요하다.
- 정보성 메시지 중심이다.
- 템플릿 승인이 필요하다.
- 카카오 비즈니스 채널 또는 발신 프로필이 필요하다.
- 즉시 연동하지 않는다.
- SOLAPI PoC 후보는 유지한다.

### SMS

- 전화번호가 필요하다.
- 발신번호 등록이 필요하다.
- Kakao 실패 fallback 후보로 둔다.
- 광고성 메시지 가능성이 있으면 080 수신거부가 필요하다.
- 발송 비용이 발생한다.

### Email

- 이메일 주소가 필요하다.
- 긴 요약이나 리포트 전달에 적합하다.
- 즉시 리마인드 채널로는 약하다.
- 별도 수신 동의와 철회 관리가 필요하다.

## 4. person_consents 개념

이 섹션은 SQL migration이 아니라 개념 설계다.

- `person_id`: 동의 주체.
- `consent_type`: 동의 유형.
- `status`: 현재 동의 상태.
  - `granted`
  - `revoked`
  - `expired`
- `agreed_at`: 동의 시각.
- `revoked_at`: 철회 시각.
- `source`: 동의가 수집된 화면이나 절차.
- `metadata`: 동의 문구 버전, provider, 채널 등 보조 정보.

## 5. consent_type 후보

| consent_type | 목적 | 필수 여부 | 철회 가능 여부 | 관련 채널 | 마케팅 동의와 분리 필요 여부 |
|---|---|---|---|---|---|
| `service_notification` | 서비스 이용에 필요한 알림 수신 동의 | 조건부 필수 | 가능 | Web Push, Email, Kakao 알림톡, SMS | 필요 |
| `experience_recall_reminder` | 업무기록/경험 회수 리마인드 수신 동의 | 선택 | 가능 | Web Push, Kakao 알림톡, SMS, Email | 필요 |
| `kakao_alimtalk` | 카카오 알림톡 수신 동의 | 선택 | 가능 | Kakao 알림톡 | 필요 |
| `sms_notification` | SMS 알림 수신 동의 | 선택 | 가능 | SMS | 필요 |
| `sms_fallback` | 카카오 실패 시 SMS fallback 동의 | 선택 | 가능 | Kakao 알림톡, SMS | 필요 |
| `email_notification` | 이메일 알림 수신 동의 | 선택 | 가능 | Email | 필요 |
| `web_push_device` | 현재 브라우저/기기의 Web Push 등록 동의 또는 권한 상태 | 선택 | 가능 | Web Push | 필요 |
| `marketing_notification` | 마케팅성 알림 수신 동의 | 선택 | 가능 | Web Push, Kakao, SMS, Email | 해당 없음 |
| `consulting_connection` | 컨설팅 연결/상담 연계 동의 | 선택 | 가능 | Email, SMS, Kakao, 운영 연락 | 필요 |
| `privacy_processing_delegation_notice` | 외부 provider 사용 시 개인정보 처리 위탁 고지 확인 | provider 사용 전 필요 | 고지 이력 보존 필요 | Kakao, SMS, Email provider | 필요 |

## 6. 동의 철회 UX 원칙

- 사용자는 언제든 수신 동의를 철회할 수 있어야 한다.
- 철회 후에도 법적/운영 로그는 남길 수 있다.
- 마케팅 철회가 서비스성 알림 전체 철회를 의미하지 않도록 분리한다.
- SMS fallback 철회 시 Kakao 실패 후 문자 발송을 금지한다.
- 특정 기기의 Web Push 해제와 전체 알림 해제를 구분한다.

## 7. 개인정보/운영 주의사항

- 전화번호는 알림톡/SMS 운영에 필요한 민감한 운영 정보이므로 인증/동의와 함께 관리한다.
- provider 사용 시 개인정보 처리 위탁 고지 필요 여부를 검토한다.
- 광고성 메시지와 정보성 메시지를 분리한다.
- 광고성 SMS 가능성이 있으면 080 수신거부 조건을 검토한다.
- 실제 발송 전 dry-run/mock 단계가 필요하다.

## 8. reminder_rules_v2에 미치는 영향

- reminder rule은 "언제/무엇을 알릴지"를 담당한다.
- notification contact는 "어디로 보낼지"를 담당한다.
- person consent는 "보내도 되는지"를 담당한다.
- 이 세 가지를 분리해야 한다.
- `reminder_rules_v2`는 `person_id` 기준이다.
- `reminder_rule_channels`는 채널 우선순위와 fallback 정책을 관리한다.
- 실제 발송 전 consent와 contact 검증이 필요하다.

## 9. 금지/보류 사항

- DB migration 작성 금지.
- Supabase SQL apply 금지.
- Kakao/SMS API 연동 금지.
- 문자/카카오톡 실제 발송 금지.
- 기존 resume/contact 필드 재사용 금지.
- 개인정보처리방침 수정 없이 provider 연동 금지.
- 마케팅 동의 없이 광고성 메시지 발송 금지.

## 10. 다음 액션

- 동의 유형 리뷰.
- 알림 설정 UI copy 초안 작성.
- `notification_contacts` / `person_consents` Protected DB migration draft 작성.
- `reminder_rules_v2` 설계.
- Kakao/SMS provider 준비 상태 확인.
