# PASSMAP Contact Verification UX Design

## 1. Purpose

This document defines the product and UX baseline for PASSMAP contact verification across phone, email, Kakao Alimtalk, SMS fallback, and Web Push current-device registration.

The goal is to let users understand which destinations PASSMAP can use to reach them, which destinations are verified, which destinations have consent, and which destinations are still setup-needed. Contact verification must remain separate from account linking, marketing consent, consulting connection consent, and Web Push subscription ownership.

This document is a design baseline only. It is not frontend implementation, DB migration, SQL apply, provider integration, Edge Function change, service worker change, actual message sending, or production change.

## 2. Current State

- Notification contacts/consents design is prepared.
- Notification settings UI v2 separates reminder rules, channels, consent, account linking, and dry-run preview.
- Account linking UX design separates Google/Kakao/Naver login linkage from phone/email verification and notification consent.
- Web Push ownership bridge design treats subscriptions as browser/device reachability assets, not person-level contacts.
- Kakao Alimtalk is the primary operating channel candidate.
- SMS is the fallback candidate.
- Email is an auxiliary channel.
- Web Push remains an auxiliary current-device channel.
- No live provider sending or contact verification implementation is authorized by this document.

## 3. Non-goals

This document does not include:

- frontend implementation;
- DB migration authoring;
- SQL apply;
- RLS implementation;
- SMS OTP provider integration;
- Kakao Alimtalk provider integration;
- email provider integration;
- Web Push subscription code changes;
- Edge Function changes;
- service worker changes;
- env or secret setup;
- production rollout.

## 4. Core UX Principles

- Users should understand contact verification as "PASSMAP이 연락할 수 있는 곳을 확인하는 과정".
- Phone verification is not account linking.
- Kakao account linking is not Kakao Alimtalk contact verification.
- Kakao Alimtalk receiving requires phone destination readiness and channel consent, not only Kakao login.
- SMS fallback requires phone verification and SMS fallback consent.
- Email notification requires email verification and email notification consent.
- Web Push registration verifies the current browser/device only, not the person-level contact.
- Consent and verification are separate states.
- Verification should not silently enable marketing or consulting contact.
- Revoked consent should not delete the verified contact by default.
- Contact deletion/removal should be separate from consent withdrawal.

## 5. User-facing Mental Model

Recommended wording:

```text
연락처 인증은 PASSMAP이 알림을 보낼 수 있는 번호나 이메일이 실제로 본인에게 도착하는지 확인하는 과정입니다.
```

Recommended distinction copy:

```text
휴대폰 번호 인증은 로그인 계정 연결과 다릅니다. 번호를 인증해도 Kakao 계정이 연결되거나 마케팅 수신 동의가 자동으로 켜지지 않습니다.
```

Avoid wording that implies:

- phone verification links Kakao account;
- Kakao login enables Alimtalk receiving;
- email verification merges accounts;
- verified contact means all notification types are allowed;
- Web Push registration is a stable person-level contact.

## 6. Contact Types and Channel Mapping

### Phone Number

Used by:

- Kakao Alimtalk destination candidate;
- SMS fallback destination candidate;
- possible support or account recovery candidate only after separate policy review.

Required states:

- raw/masked destination candidate;
- verification status;
- consent status by channel;
- last verified timestamp candidate;
- last used timestamp candidate;
- revoked/removed status candidate.

### Email

Used by:

- email notification;
- report/digest delivery;
- account communication candidate after policy review.

Required states:

- email verification status;
- email notification consent;
- provider email vs user-added email distinction;
- last verified timestamp candidate.

### Web Push Device

Used by:

- current-browser/device test notification;
- auxiliary reminder channel only when ownership is active and permission is granted.

Required states:

- current device registered;
- browser permission state;
- endpoint key completeness;
- ownership state;
- stale/conflict/revoked state;
- last_seen timestamp candidate.

Web Push should not be described as a normal phone/email contact.

## 7. Verification Status Model

User-facing status candidates:

- `인증됨`
- `인증 필요`
- `재인증 필요`
- `만료됨`
- `사용 중지됨`
- `삭제됨`
- `검토 필요`

Internal candidate states can be more granular, but UI should remain simple.

Suggested mapping:

| User-facing state | Meaning |
| --- | --- |
| `인증됨` | Destination was verified and is eligible for channel checks. |
| `인증 필요` | Destination exists or can be added but has not been verified. |
| `재인증 필요` | Destination may be stale, changed, or conflict-prone. |
| `사용 중지됨` | Consent or channel use is disabled, but destination may remain saved. |
| `삭제됨` | Destination should no longer be used. |
| `검토 필요` | System detected a conflict or unsafe candidate. |

## 8. Consent vs Verification

Verification answers:

```text
이 번호/이메일/기기가 실제로 도달 가능한가?
```

Consent answers:

```text
이 경로로 이 종류의 알림을 보내도 되는가?
```

The UI must show both when relevant.

Example:

```text
휴대폰 번호
010-****-1234 · 인증됨
카카오 알림톡: 동의 필요
SMS fallback: 동의됨
```

Important rules:

- Verified phone number does not automatically enable SMS fallback.
- Verified phone number does not automatically enable Kakao Alimtalk.
- Verified email does not automatically enable marketing email.
- Marketing consent must remain separate from service notification consent.
- Consulting connection consent must remain separate from notification consent.

## 9. Phone Verification Flow

Recommended flow:

1. User opens notification/contact settings.
2. User selects `휴대폰 번호 인증`.
3. UI explains what the number will be used for.
4. User enters phone number.
5. System sends verification code only after user action.
6. User enters code.
7. UI shows verified state.
8. User separately chooses Kakao Alimtalk and/or SMS fallback consent.

Pre-send copy candidate:

```text
이 번호는 PASSMAP 서비스 알림, 카카오 알림톡 후보, SMS fallback 후보에 사용할 수 있습니다. 마케팅 수신 동의는 별도로 선택해야 합니다.
```

Post-verification copy candidate:

```text
휴대폰 번호가 인증되었습니다. 카카오 알림톡이나 SMS fallback을 사용하려면 각 채널의 수신 설정을 확인해주세요.
```

## 10. Kakao Alimtalk Contact UX

Kakao Alimtalk should be shown as a channel that depends on phone destination readiness and provider readiness.

State candidates:

- `준비 예정`
- `휴대폰 인증 필요`
- `수신 동의 필요`
- `템플릿/발신 프로필 준비 필요`
- `사용 가능 후보`
- `검토 필요`

Required explanation:

```text
카카오 알림톡은 Kakao 로그인과 별개입니다. PASSMAP이 인증된 휴대폰 번호로 서비스 알림을 보낼 수 있도록 준비되는 채널입니다.
```

Do not show Kakao Alimtalk as live-ready until provider template, sender/profile, consent, and live approval are complete.

## 11. SMS Fallback Contact UX

SMS fallback should be shown as a backup channel after Kakao Alimtalk failure, not a parallel default channel.

State candidates:

- `휴대폰 인증 필요`
- `SMS fallback 동의 필요`
- `fallback 가능 후보`
- `비용/정책 준비 필요`
- `사용 중지됨`

Copy candidate:

```text
SMS는 카카오 알림톡이 실패했을 때 사용할 수 있는 보조 문자 알림입니다. 비용과 발송 정책이 있어 별도 동의가 필요합니다.
```

Rules:

- Do not enable SMS fallback by default.
- Do not treat phone verification as SMS fallback consent.
- SMS fallback should be opt-in for MVP.
- Cost/quota/sender policy must be finalized before live sending.

## 12. Email Verification UX

Email should be an auxiliary channel for reports, summaries, and longer content.

State candidates:

- `이메일 확인됨`
- `이메일 확인 필요`
- `재확인 필요`
- `Email 알림 동의 필요`
- `사용 중지됨`

Provider email cautions:

- A provider email from Google/Kakao/Naver may help recognition but should not automatically become a verified notification contact without policy review.
- Same email must not trigger automatic account merge.
- Email verification must not enable marketing email by default.

Copy candidate:

```text
이메일 인증은 리포트나 요약 알림을 받을 주소를 확인하는 과정입니다. 로그인 계정 연결이나 마케팅 수신 동의와는 별도입니다.
```

## 13. Web Push Current-device UX

Web Push should stay under device/browser registration, not normal contact verification.

State candidates:

- `이 기기 등록됨`
- `브라우저 권한 필요`
- `이 기기 미등록`
- `재등록 필요`
- `충돌 상태`
- `오래된 기기`
- `지원 제한 가능`

Copy candidate:

```text
브라우저 알림은 이 기기와 이 브라우저에만 적용됩니다. 휴대폰 번호나 이메일처럼 사람 단위 연락처로 저장되는 알림 경로가 아닙니다.
```

Rules:

- Current-device registration can be tested with Web Push test notification.
- Web Push should not be promoted as the primary operating channel.
- Existing subscriptions should not be automatically moved after account linking.
- Stale/conflict subscriptions should require re-registration.

## 14. Contact Management Surface

Contact management can appear inside notification settings or account settings, but should remain conceptually distinct from account linking.

Recommended sections:

1. Verified destinations.
2. Channel readiness.
3. Consent status.
4. Device/browser registrations.
5. Removed or disabled destinations, if needed.

Example card:

```text
휴대폰 번호
010-****-1234
상태: 인증됨
카카오 알림톡: 준비 예정
SMS fallback: 동의 필요
[수신 설정]
[번호 변경]
```

Example email card:

```text
이메일
g***@example.com
상태: 이메일 확인됨
Email 알림: 사용 중
[수신 설정]
[이메일 변경]
```

## 15. Change Contact Flow

Changing a phone number or email should be treated as a new verification event.

Rules:

- New destination must be verified before use.
- Old destination should not be used after removal or replacement.
- Consent may need to be re-confirmed depending on policy.
- Recent deliveries should not reveal sensitive destination details.
- The UI should explain which rules or channels are affected.

Copy candidate:

```text
휴대폰 번호를 변경하면 카카오 알림톡과 SMS fallback 설정에 영향을 줄 수 있습니다. 새 번호 인증 후 다시 사용할 수 있습니다.
```

## 16. Delete or Disable Contact Flow

Disable and delete should be distinct.

Disable means:

- keep the destination saved;
- stop using it for selected channels;
- preserve verification history if policy allows.

Delete means:

- remove the destination from future use;
- require re-entry and re-verification to use again;
- avoid deleting audit records if policy requires retention.

Copy candidate:

```text
이 번호를 삭제하면 카카오 알림톡과 SMS fallback 후보에서 제외됩니다. 다시 사용하려면 번호를 다시 인증해야 합니다.
```

## 17. Dry-run Preview UX

Dry-run preview should explain readiness without implying real provider delivery.

Example:

```text
다음 알림 실행 시 예상 경로
카카오 알림톡: 휴대폰 인증됨, provider 준비 전
SMS fallback: 동의 필요
Web Push: 현재 기기 테스트 가능
Email: 이메일 확인됨
```

Rules:

- Do not label dry-run as sent.
- Do not show provider message id in dry-run.
- Do not imply Kakao/SMS provider was called.
- Show missing verification and missing consent separately.

## 18. Security and Privacy Considerations

- Mask phone numbers and email addresses.
- Do not expose raw destinations in normal UI.
- Do not expose endpoint, p256dh, auth keys, or endpoint hash.
- Verification codes should be rate-limited before live implementation.
- Verification attempts should be auditable before live implementation.
- Do not reveal whether another person owns a destination.
- Conflict states should fail closed.
- Contact verification should not be used for automatic account merge.

## 19. Mobile UX Considerations

- Use short card-based layouts.
- Keep phone/email verification CTAs visible.
- Use native numeric keypad for phone/code entry.
- Make consent choices separate but close to the verified destination.
- Avoid dense status tables.
- Put long channel explanations into help text.
- iPhone Web Push limitations should be shown only when relevant.

## 20. Accessibility and Copy Principles

- Status should be text-visible, not color-only.
- Buttons should say exactly what they do, such as `휴대폰 번호 인증` or `SMS fallback 동의`.
- Avoid scary wording unless there is a real failure.
- Prefer `설정 필요`, `동의 필요`, `재인증 필요`, and `검토 필요`.
- Verification errors should explain the next action.
- Consent withdrawal copy should explain the effect.
- Do not expose technical ids.

## 21. Live Application Preconditions

Before live contact verification is enabled, all of the following must be complete:

- notification_contacts schema finalized;
- person_consents or notification_consents schema finalized;
- contact verification state model finalized;
- phone verification provider policy finalized;
- SMS provider policy finalized;
- Kakao Alimtalk template/sender policy finalized;
- email verification policy finalized;
- Web Push ownership bridge finalized;
- RLS policy reviewed;
- rate-limit and abuse policy finalized;
- audit logging policy finalized;
- contact masking policy finalized;
- retention/deletion policy finalized;
- staging QA completed;
- PC/Android/iPhone QA completed;
- Protected DB approval;
- provider live approval;
- frontend implementation approval;
- production cutover approval.

## 22. Next Steps

Possible follow-up PRs:

- consent copy and versioning UX design;
- contact verification component implementation planning;
- phone verification provider candidate comparison;
- Kakao/SMS provider candidate comparison;
- contact verification schema/RLS Protected review;
- PC/Android/iPhone notification QA runbook.

## 23. Guardrails

This document does not authorize:

- frontend changes;
- DB or SQL changes;
- Supabase SQL Editor execution;
- Supabase CLI db push/apply;
- Supabase Auth provider changes;
- Edge Function changes;
- service worker changes;
- env or secret usage;
- provider API calls;
- SMS OTP sending;
- Kakao Alimtalk sending;
- SMS reminder sending;
- Email sending;
- Web Push sending changes;
- account merge or backfill;
- Web Push subscription transfer;
- cron changes;
- production changes.
