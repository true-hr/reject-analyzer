# PASSMAP Contact Verification and Consent Withdrawal UX

## 1. Background

PR #691의 scheduler v2는 알림 발송 전에 contact와 consent를 확인하도록 설계되어 있다. 알림 규칙이 존재하더라도 연락처가 인증되지 않았거나 채널/목적별 수신 동의가 없으면 발송 대상에서 제외되어야 한다.

PR #692의 reminder settings UI는 채널 상태와 동의 상태를 사용자에게 보여주도록 설계되어 있다. 사용자는 Web Push, Kakao 알림톡, SMS, Email이 각각 어떤 준비 상태인지 보고, 필요한 인증과 동의를 구분해서 이해해야 한다.

이제 실제 구현 전에 연락처 인증과 동의 철회 UX를 문서화해야 한다. 이 문서는 Kakao 알림톡, SMS, Email, Web Push를 운영하기 전에 필요한 사용자 문구, 상태 처리, 데이터 처리 원칙을 고정한다.

아직 DB apply, Edge Function, provider 연동, 실제 발송은 하지 않는다.

## 2. UX goals

- 사용자가 어떤 연락처로 알림을 받을지 직접 확인한다.
- 휴대폰 번호와 이메일은 알림용 연락처로 별도 인증한다.
- 카카오 알림톡과 SMS는 휴대폰 번호 기반이지만 동의는 분리한다.
- 서비스 알림과 마케팅 알림을 명확히 구분한다.
- 사용자가 동의를 쉽게 철회할 수 있다.
- 철회 후 어떤 알림이 중단되는지 명확히 보여준다.
- 철회해도 기존 업무기록/계정/이력서 데이터는 삭제되지 않음을 안내한다.

## 3. Contact types

### Web Push

- 대상: 브라우저/기기 subscription
- 인증 방식: 브라우저 알림 권한 허용 + subscription 등록
- 특징: 기기별 등록 필요
- 주의: 클릭 UX는 환경별로 불안정할 수 있음

### Phone number

- 대상: Kakao 알림톡 / SMS
- 인증 방식: 휴대폰 번호 인증
- 특징: Kakao 알림톡과 SMS fallback의 기반 연락처
- 주의: 전화번호 인증 완료와 수신 동의는 별개

### Email

- 대상: Email 알림
- 인증 방식: 이메일 확인
- 특징: 요약/리포트/보조 알림에 적합
- 주의: 로그인 이메일과 알림 이메일을 자동으로 동일시하지 않음

## 4. Contact verification flow

### 휴대폰 번호 인증 흐름

1. 사용자가 휴대폰 번호 입력
2. 인증번호 발송 버튼 클릭
3. 인증번호 입력
4. 인증 성공 시 notification_contacts에 verified 상태로 저장될 후보
5. 인증 완료 후 Kakao 알림톡/SMS 동의 UI 표시

주의:

- 이번 문서 작업에서는 실제 인증번호 발송 구현 금지.
- SMS 발송 금지.
- Kakao 발송 금지.
- DB apply 금지.

### 이메일 인증 흐름

1. 사용자가 이메일 입력
2. 인증 메일 발송 버튼 클릭
3. 이메일 링크 또는 코드 확인
4. 인증 성공 시 notification_contacts에 verified 상태로 저장될 후보
5. 인증 완료 후 Email 알림 동의 UI 표시

### Web Push 등록 흐름

1. 사용자가 이 기기 알림 등록 클릭
2. 브라우저 알림 권한 요청
3. 권한 허용 시 push subscription 등록
4. 해당 브라우저/기기에서만 Web Push 가능
5. 기기 해제 시 해당 subscription 비활성화

## 5. Consent types

서비스 알림 계열:

- service_notification
- experience_recall_reminder
- kakao_alimtalk
- sms_notification
- sms_fallback
- email_notification
- web_push_device

마케팅/기타 계열:

- marketing_notification
- consulting_connection
- privacy_processing_delegation_notice

중요:

- marketing_notification은 service_notification이나 experience_recall_reminder의 대체 동의가 아니다.
- 컨설팅 연결 동의는 알림 수신 동의와 별개다.
- 개인정보 처리 위탁 고지는 수신 동의와 별개로 관리한다.

## 6. Consent grant UX copy

업무기록 리마인드:

```text
PASSMAP이 설정한 시간에 업무기록 리마인드 알림을 보내는 것에 동의합니다.
```

카카오 알림톡:

```text
PASSMAP 서비스 이용과 관련된 알림을 카카오 알림톡으로 받는 것에 동의합니다.
```

SMS 알림:

```text
PASSMAP 서비스 이용과 관련된 알림을 문자로 받는 것에 동의합니다.
```

SMS fallback:

```text
카카오 알림톡 발송이 실패하거나 중요한 서비스 알림이 필요한 경우 문자로 받는 것에 동의합니다.
```

Email 알림:

```text
PASSMAP 서비스 이용과 관련된 알림을 이메일로 받는 것에 동의합니다.
```

Web Push:

```text
이 브라우저/기기에서 PASSMAP 알림을 받는 것에 동의합니다.
```

마케팅:

```text
혜택, 이벤트, 컨설팅 안내 등 마케팅 정보를 받는 것에 동의합니다.
```

## 7. Consent withdrawal UX copy

공통 철회 안내:

```text
수신 동의를 철회하면 해당 채널의 알림이 중단됩니다.
계정, 업무기록, 이력서 데이터는 삭제되지 않습니다.
```

업무기록 리마인드 철회:

```text
업무기록 리마인드 알림을 끌까요?
철회하면 설정한 시간의 업무기록 알림이 발송되지 않습니다.
```

카카오 알림톡 철회:

```text
카카오 알림톡 수신을 중단할까요?
철회하면 PASSMAP 서비스 알림을 카카오 알림톡으로 받을 수 없습니다.
```

SMS fallback 철회:

```text
문자 fallback 수신을 중단할까요?
철회하면 카카오 알림톡 실패 시 문자로 대체 알림을 받을 수 없습니다.
```

Email 알림 철회:

```text
이메일 알림 수신을 중단할까요?
철회하면 PASSMAP 알림과 요약을 이메일로 받을 수 없습니다.
```

Web Push 해제:

```text
이 기기의 알림을 해제할까요?
해제하면 이 브라우저에서는 PASSMAP 알림을 받을 수 없습니다.
```

마케팅 철회:

```text
마케팅 정보 수신을 중단할까요?
철회해도 서비스 이용에 필요한 알림은 계속 받을 수 있습니다.
```

## 8. Consent status states

| 상태 | 사용자에게 보여줄 문구 | 가능한 버튼 | 발송 가능 여부 | scheduler v2에서 처리할 결과 |
| --- | --- | --- | --- | --- |
| granted | 수신 동의 완료 | 수신 중단 | 가능 | send candidate |
| revoked | 수신 동의 철회됨 | 다시 동의하기 | 불가 | skipped_consent_revoked |
| expired | 수신 동의가 만료되었습니다 | 다시 동의하기 | 불가 | skipped_consent_expired |
| missing | 수신 동의가 필요합니다 | 수신 동의하기 | 불가 | skipped_consent_missing |
| pending_verification | 연락처 인증 후 동의할 수 있습니다 | 인증하기 | 불가 | skipped_contact_pending_verification |
| provider_not_ready | 아직 제공 준비 중입니다 | 준비 중 | 불가 | skipped_provider_not_ready |

## 9. Contact status states

| 상태 | 사용자에게 보여줄 문구 | 가능한 버튼 | 발송 가능 여부 | scheduler v2에서 처리할 결과 |
| --- | --- | --- | --- | --- |
| verified | 인증 완료 | 변경하기 | 동의가 있으면 가능 | contact_eligible |
| unverified | 인증이 필요합니다 | 인증하기 | 불가 | skipped_contact_unverified |
| pending | 인증 확인 중입니다 | 인증번호 다시 보내기, 인증 완료 확인 | 불가 | skipped_contact_pending |
| failed | 인증에 실패했습니다 | 다시 인증하기 | 불가 | skipped_contact_failed |
| disabled | 사용 중지됨 | 다시 사용 | 불가 | skipped_contact_disabled |
| removed | 삭제된 연락처입니다 | 새 연락처 등록 | 불가 | skipped_contact_removed |
| provider_not_ready | 아직 제공 준비 중입니다 | 준비 중 | 불가 | skipped_provider_not_ready |

## 10. Channel readiness matrix

| 채널 | 연락처/기기 등록 | 인증 여부 | 동의 유형 | provider 준비 여부 | 발송 가능 상태 | fallback 가능 여부 |
| --- | --- | --- | --- | --- | --- | --- |
| Web Push | 브라우저/기기 subscription 등록 필요 | 브라우저 알림 권한 허용 및 subscription 유효 | web_push_device, 필요 시 service_notification | Web Push 인프라 준비 필요 | 기기 등록, 권한 허용, 동의 완료 시 가능 | 다른 채널로 fallback 가능하나 Web Push 자체 fallback은 없음 |
| Kakao 알림톡 | 휴대폰 번호 등록 필요 | 휴대폰 번호 인증 필요 | kakao_alimtalk, service_notification 또는 experience_recall_reminder | 비즈니스 채널/발신 프로필/템플릿 승인 필요 | 현재는 준비 중으로 표시 | 실패 시 SMS fallback 후보 |
| SMS | 휴대폰 번호 등록 필요 | 휴대폰 번호 인증 필요 | sms_notification 또는 sms_fallback | 발신번호 등록/provider 준비 필요 | 현재는 준비 중 또는 인증 필요로 표시 | Kakao 실패 시 fallback 역할 가능 |
| Email | 알림용 이메일 등록 필요 | 이메일 확인 필요 | email_notification, 필요 시 service_notification | Email provider 준비 필요 | 이메일 확인 및 동의 완료 시 가능 | 보조 채널로 사용 가능 |

Kakao 알림톡은 휴대폰 번호 인증, kakao_alimtalk 동의, 비즈니스 채널/발신 프로필/템플릿 승인이 모두 필요하다. 현재는 실제 발송 가능한 채널처럼 보이지 않도록 준비 중으로 표시한다.

SMS는 휴대폰 번호 인증, sms_notification 또는 sms_fallback 동의, 발신번호 등록/provider 준비가 필요하다. 현재는 준비 중 또는 인증 필요로 표시한다.

## 11. Data handling principles

- notification_contacts는 알림 연락처 전용이다.
- resume/contact 계열 필드는 알림 연락처로 재사용하지 않는다.
- 로그인 이메일을 자동으로 email notification contact로 확정하지 않는다.
- 전화번호가 있어도 인증 전에는 알림 발송 대상이 아니다.
- 전화번호 인증과 SMS/Kakao 수신 동의는 별개다.
- 동의 철회 이력은 삭제하지 않고 상태 변경으로 관리한다.
- 연락처 삭제와 동의 철회는 별개다.
- 계정 연결과 연락처 인증은 별개다.
- person_id 연결 없이 provider user_id만 보고 연락처를 공유하지 않는다.

## 12. Error and edge cases

| 케이스 | 사용자 문구 | 가능한 버튼 | 내부 처리 원칙 |
| --- | --- | --- | --- |
| 인증번호 만료 | 인증번호가 만료되었습니다. 새 인증번호를 받아주세요. | 인증번호 다시 보내기 | 기존 pending verification은 만료 처리하고 새 challenge를 생성할 후보로 둔다. |
| 인증번호 불일치 | 인증번호가 일치하지 않습니다. 다시 확인해주세요. | 다시 입력, 인증번호 다시 보내기 | 실패 횟수를 기록할 후보로 두고 과도한 재시도는 제한한다. |
| 이미 다른 person_id에 연결된 전화번호 | 이 휴대폰 번호는 다른 PASSMAP 계정에서 사용 중입니다. | 고객지원 문의, 다른 번호 입력 | 사용자 동의 없는 자동 병합 금지, 충돌 상태로 분리한다. |
| 이미 다른 person_id에 연결된 이메일 | 이 이메일은 다른 PASSMAP 계정에서 사용 중입니다. | 고객지원 문의, 다른 이메일 입력 | 이메일만으로 계정 병합 금지, person_id 기준 검토가 필요하다. |
| 연락처는 인증됐지만 동의 없음 | 연락처 인증은 완료됐지만 수신 동의가 필요합니다. | 수신 동의하기 | contact는 verified로 유지하되 scheduler는 consent missing으로 제외한다. |
| 동의는 있지만 연락처 미인증 | 수신 동의가 있어도 연락처 인증이 필요합니다. | 인증하기 | consent는 보존하되 scheduler는 contact unverified로 제외한다. |
| provider 준비 전 | 아직 제공 준비 중입니다. 준비가 완료되면 사용할 수 있습니다. | 준비 중 | provider_not_ready 상태로 표시하고 발송 후보에서 제외한다. |
| 사용자가 마케팅만 동의하고 서비스 알림은 미동의 | 마케팅 정보 수신에는 동의했지만 서비스 알림 수신 동의가 필요합니다. | 서비스 알림 동의하기 | marketing 동의를 service consent로 대체하지 않는다. |
| 사용자가 서비스 알림은 동의하고 마케팅은 미동의 | 서비스 이용에 필요한 알림은 받을 수 있습니다. 마케팅 정보는 발송되지 않습니다. | 마케팅 수신 동의하기 | 서비스 알림 발송은 허용하고 마케팅 발송은 제외한다. |
| Web Push 권한 거부 | 브라우저 알림 권한이 거부되어 이 기기에서 알림을 받을 수 없습니다. | 브라우저 설정 안내 | subscription 생성 금지, 권한 재허용은 브라우저 설정에서 처리하도록 안내한다. |
| 브라우저 변경/기기 변경 | 새 브라우저나 기기에서는 알림을 다시 등록해야 합니다. | 이 기기 알림 등록 | subscription은 기기별로 관리하고 기존 기기 등록과 혼동하지 않는다. |
| 휴대폰 번호 변경 | 새 휴대폰 번호를 인증해야 알림을 받을 수 있습니다. | 새 번호 인증하기 | 기존 번호 contact와 새 번호 contact를 분리하고 새 번호 인증 전 발송하지 않는다. |
| 이메일 변경 | 새 이메일을 확인해야 이메일 알림을 받을 수 있습니다. | 새 이메일 확인하기 | 로그인 이메일 변경과 알림 이메일 변경을 자동 동일 처리하지 않는다. |

## 13. Guardrails

이번 작업에서 절대 금지:

- React 컴포넌트 구현 금지
- UI 코드 수정 금지
- src/App.jsx 수정 금지
- CSS 수정 금지
- Supabase SQL 작성/수정 금지
- Supabase SQL Editor 실행 금지
- Supabase CLI db push/apply 금지
- remote DB apply 금지
- 기존 데이터 backfill 금지
- Edge Function 구현 금지
- Edge Function deploy 금지
- Kakao/SMS adapter 구현 금지
- Kakao/SMS API 연동 금지
- 인증번호 발송 구현 금지
- 인증번호 실제 발송 금지
- 문자/SMS 발송 금지
- 카카오톡/알림톡 발송 금지
- 이메일 발송 구현 금지
- 이메일 실제 발송 금지
- cron 변경 금지
- Vercel/Supabase deploy 금지
- production 설정 변경 금지
- 기존 weekly reminder 구조 삭제/수정/비활성화 금지
- 현재 dirty 상태의 src/App.jsx 또는 임시/QA 산출물 정리/삭제/수정 금지

## 14. Next actions

15. PR 리뷰 후 문서 merge
16. Protected DB migration 승격 조건 리뷰
17. person_id account-linking UX 상세 문서 보강 여부 확인
18. scheduler v2 dry-run Edge Function 구현 계획 수립
19. provider 비교 및 Kakao/SMS PoC 준비
20. 실제 DB apply / 인증번호 발송 / cron / live 발송은 별도 명시 승인 후 진행
