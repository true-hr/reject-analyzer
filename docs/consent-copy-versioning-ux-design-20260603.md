# PASSMAP Consent Copy and Versioning UX Design

## 1. Purpose

This document defines the product and UX baseline for PASSMAP consent copy, consent grouping, consent versioning, and withdrawal behavior across service notifications, reminder notifications, Kakao Alimtalk, SMS fallback, Email, Web Push current-device notifications, marketing, and consulting connection consent.

The goal is to prevent PASSMAP from mixing different consent purposes while giving users a clear, understandable way to grant, review, and withdraw each consent. Consent must remain separate from contact verification, account linking, provider readiness, Web Push ownership, and actual delivery success.

This document is a design baseline only. It is not frontend implementation, DB migration, SQL apply, legal approval, provider integration, Edge Function change, actual message sending, or production change.

## 2. Current State

- Notification contacts/consents design is prepared.
- Notification settings UI v2 defines separate areas for reminder rules, notification channels, consent, account linking, and dry-run preview.
- Account linking UX design separates provider login linkage from notification consent.
- Contact verification UX design separates verification from consent.
- Kakao Alimtalk is the primary operating channel candidate.
- SMS is the fallback candidate.
- Email is an auxiliary channel.
- Web Push remains an auxiliary current-device channel.
- No live consent schema, provider sending, or production consent capture is authorized by this document.

## 3. Non-goals

This document does not include:

- final legal review;
- privacy policy changes;
- terms of service changes;
- frontend implementation;
- DB migration authoring;
- SQL apply;
- RLS implementation;
- consent ledger implementation;
- Kakao/SMS/Email provider integration;
- Web Push sending changes;
- production rollout.

## 4. Core UX Principles

- Consent must be purpose-specific.
- Service notification consent and marketing consent must be separate.
- Consulting connection consent must be separate from notification consent.
- Channel consent and contact verification must be separate.
- Account linking must not imply consent.
- Contact verification must not imply consent.
- Consent withdrawal must be easy to find.
- The UI must explain what stops when consent is withdrawn.
- Missing consent should appear as `동의 필요` or `설정 필요`, not as a system error.
- Do not expose internal consent ids, version ids, row ids, `person_id`, or `auth_user_id`.
- Consent copy should be short in the main UI and expandable for detail.

## 5. Consent Categories

PASSMAP should keep the following consent categories conceptually separate.

### Service Notification Consent

Purpose:

- Required or strongly recommended service-level notifications related to PASSMAP usage, reminders, account/security status, and important service operation.

User-facing label candidate:

- `서비스 알림`

Copy candidate:

```text
PASSMAP 이용에 필요한 주요 알림을 받을 수 있습니다.
```

### Work-record Reminder Consent

Purpose:

- Reminders for recording work, daily/weekly reflection, experience recall, and similar career asset-building prompts.

User-facing label candidate:

- `업무기록 리마인드`

Copy candidate:

```text
업무기록과 회고를 놓치지 않도록 정해진 시간에 리마인드를 받을 수 있습니다.
```

### Kakao Alimtalk Consent

Purpose:

- Permission to receive service/reminder notifications through Kakao Alimtalk once provider readiness is approved.

User-facing label candidate:

- `Kakao 알림톡`

Copy candidate:

```text
인증된 휴대폰 번호로 PASSMAP 서비스 알림을 카카오 알림톡으로 받을 수 있습니다.
```

Caution copy:

```text
Kakao 계정 연결과 알림톡 수신 동의는 별도입니다.
```

### SMS Fallback Consent

Purpose:

- Permission to receive SMS only as a fallback candidate when the primary channel such as Kakao Alimtalk fails or is unavailable.

User-facing label candidate:

- `SMS fallback`

Copy candidate:

```text
카카오 알림톡이 실패하거나 사용할 수 없을 때 보조 문자 알림을 받을 수 있습니다.
```

Caution copy:

```text
SMS는 비용과 발송 정책이 있는 보조 채널이므로 별도 동의가 필요합니다.
```

### Email Notification Consent

Purpose:

- Permission to receive report, digest, summary, or longer content through email.

User-facing label candidate:

- `Email 알림`

Copy candidate:

```text
리포트, 요약, 긴 안내를 이메일로 받을 수 있습니다.
```

### Web Push Device Notification Consent

Purpose:

- Permission/registration for current browser/device notifications.

User-facing label candidate:

- `Web Push 기기 알림`

Copy candidate:

```text
현재 브라우저와 기기에서 PASSMAP 보조 알림을 받을 수 있습니다.
```

Caution copy:

```text
Web Push는 이 브라우저/기기에만 적용되는 보조 알림입니다.
```

### Marketing Consent

Purpose:

- Promotional, event, product update, or non-essential marketing messages.

User-facing label candidate:

- `마케팅 알림`

Copy candidate:

```text
PASSMAP의 이벤트, 혜택, 새로운 기능 소식을 받을 수 있습니다.
```

Important rule:

- Marketing consent must never be bundled with service notifications or reminder notifications.

### Consulting Connection Consent

Purpose:

- Permission for PASSMAP to connect the user to consulting or partner career services.

User-facing label candidate:

- `컨설팅 연결 동의`

Copy candidate:

```text
원할 경우 커리어 컨설팅 연결을 위해 필요한 정보를 전달받거나 상담 연결 안내를 받을 수 있습니다.
```

Important rule:

- Consulting connection consent must be separate from marketing and notification consent.

## 6. Recommended UI Structure

Consent settings can appear inside `Settings > Notifications` and optionally inside a broader privacy/settings surface.

Recommended section order:

1. Service and reminder consents.
2. Channel-specific notification consents.
3. Marketing consent.
4. Consulting connection consent.
5. Consent history or version details candidate.

Example layout:

```text
수신 및 동의 설정

서비스 알림          ON
업무기록 리마인드    ON
Kakao 알림톡        동의 필요
SMS fallback        OFF
Email 알림          ON
Web Push 기기 알림   이 기기 등록됨

마케팅 알림          OFF
컨설팅 연결 동의      OFF
```

## 7. Consent Versioning Model

The UI should not expose technical version ids by default, but the product should be designed so each consent decision can be tied to a versioned copy.

Versioning candidates:

- `consent_type`
- `copy_version`
- `copy_text_snapshot`
- `granted_at`
- `revoked_at`
- `source_surface`
- `locale`
- `actor`
- `ip/user_agent` candidate only after privacy review

UX rule:

- Users should see the current effective copy.
- If copy changes materially, re-consent may be required depending on policy.
- The UI can show `동의일` and `철회일` without exposing row ids or internal version ids.

User-facing example:

```text
동의일: 2026.06.03
현재 적용 중인 동의 문구를 확인할 수 있습니다.
```

## 8. Grant Consent Flow

Recommended flow:

1. User sees a consent row with current state.
2. User clicks enable or consent CTA.
3. UI shows short purpose copy and optional detail expansion.
4. User confirms.
5. State changes to enabled/granted.
6. UI explains any remaining requirements, such as contact verification or provider readiness.

Example for SMS fallback:

```text
SMS fallback을 켜시겠습니까?
카카오 알림톡이 실패하거나 사용할 수 없을 때 보조 문자 알림을 받을 수 있습니다.
```

Post-grant copy:

```text
SMS fallback 동의가 완료되었습니다. 실제 발송은 휴대폰 인증과 provider live 준비가 완료된 후 가능합니다.
```

## 9. Withdraw Consent Flow

Withdrawal must be clear and reversible where policy allows.

Recommended flow:

1. User clicks off/withdraw.
2. UI explains what will stop.
3. User confirms.
4. State changes to withdrawn.
5. Affected channels/rules show setup needed or disabled impact.

Example for work-record reminders:

```text
업무기록 리마인드 동의를 철회하면 정해진 시간의 업무기록 알림을 더 이상 보내지 않습니다.
기존 기록은 삭제되지 않습니다.
```

Example for SMS fallback:

```text
SMS fallback 동의를 철회하면 카카오 알림톡 실패 시 문자 fallback을 보내지 않습니다.
```

Example for consulting connection:

```text
컨설팅 연결 동의를 철회하면 커리어 컨설팅 연결 안내나 관련 정보 전달을 중단합니다.
PASSMAP 기본 기능과 업무기록은 삭제되지 않습니다.
```

## 10. Consent Impact Display

When a consent is missing or withdrawn, show the impact near affected rules/channels.

Examples:

```text
카카오 알림톡: 동의 필요
이 채널을 사용하려면 Kakao 알림톡 수신 동의가 필요합니다.
```

```text
SMS fallback: 꺼짐
카카오 알림톡 실패 시 문자 fallback은 전송되지 않습니다.
```

```text
업무기록 리마인드: 동의 철회됨
알림 규칙은 보관되지만 실행 후보에서 제외됩니다.
```

UX rule:

- Do not silently delete reminder rules when consent is withdrawn.
- Prefer disabling/excluding from send candidates while keeping the user-visible rule editable.

## 11. Consent vs Contact Verification

The UI must clearly separate consent and verification.

Examples:

```text
휴대폰 번호
010-****-1234 · 인증됨
Kakao 알림톡: 동의 필요
SMS fallback: 동의됨
```

```text
이메일
g***@example.com · 확인됨
Email 알림: 꺼짐
```

Rules:

- Verified contact without consent must not be used for that channel.
- Consent without verified contact should show setup needed.
- Contact deletion/removal should not be the same as consent withdrawal.
- Revoked consent should not automatically delete contact verification history unless retention policy requires it.

## 12. Consent vs Account Linking

Account linking should not grant or withdraw notification consent.

Examples:

```text
Kakao 계정 연결됨
Kakao 알림톡: 동의 필요
```

```text
Google 계정 연결 해제됨
Email 알림 동의는 별도로 관리됩니다.
```

Rules:

- Provider login connection must not automatically enable channel consent.
- Unlinking a provider must not automatically withdraw unrelated notification consent unless policy explicitly requires it.
- Same email/name/phone matching must not create consent.

## 13. Consent vs Provider Readiness

Consent does not mean the provider is live-ready.

Example:

```text
Kakao 알림톡: 동의됨
상태: provider live 준비 전
```

Rules:

- Kakao/SMS consent can exist before provider live readiness, but UI must not imply real sending is active.
- Dry-run preview should show consent, contact verification, and provider readiness separately.
- Provider message ids must not appear in dry-run.

## 14. Dry-run Preview UX

Dry-run preview should explain which consent checks would pass or block delivery.

Example:

```text
다음 알림 실행 시 예상 상태
업무기록 리마인드: 동의됨
Kakao 알림톡: 동의됨, provider 준비 전
SMS fallback: 동의 필요
Web Push: 이 기기 등록됨
```

Rules:

- Do not label dry-run as sent.
- Do not imply provider calls happened.
- Show missing consent separately from missing contact verification.
- Show missing provider readiness separately from missing consent.

## 15. Default and Bundling Policy

Recommended MVP defaults:

- Service notification: required or enabled only after clear onboarding copy, depending on final policy.
- Work-record reminder: opt-in or explicit onboarding choice.
- Kakao Alimtalk: opt-in.
- SMS fallback: opt-in.
- Email notification: opt-in or explicit onboarding choice.
- Web Push: browser permission-driven opt-in.
- Marketing: opt-in only.
- Consulting connection: opt-in only.

Bundling rules:

- Marketing cannot be bundled with service notifications.
- Consulting connection cannot be bundled with marketing or reminder notifications.
- SMS fallback cannot be bundled silently with phone verification.
- Kakao Alimtalk cannot be bundled silently with Kakao account linking.
- Web Push browser permission cannot be treated as global notification consent.

## 16. Copy Change and Re-consent Policy

Material copy changes may require re-consent.

Material change candidates:

- new sending purpose;
- new channel;
- new recipient or partner transfer;
- marketing added to service consent;
- consulting connection added;
- SMS fallback cost/usage scope changed;
- data sharing scope changed.

Non-material change candidates:

- typo fixes;
- copy simplification without scope change;
- layout change;
- help text clarification.

UX recommendation:

- When re-consent is required, show why in plain language.
- Do not block unrelated service usage unless required by final policy.
- Keep prior consent history available internally.

## 17. Consent History UX Candidate

For MVP, a full history table may be too heavy. A simple detail view can show:

- current state;
- consent date;
- withdrawal date if revoked;
- current copy;
- affected channels or features.

Example:

```text
SMS fallback
상태: 꺼짐
최근 철회일: 2026.06.03
효과: 카카오 알림톡 실패 시 문자 fallback을 보내지 않습니다.
```

## 18. Security and Privacy Considerations

- Do not expose internal consent row ids or version ids.
- Do not expose raw phone/email destinations in consent rows; use masked display if needed.
- Keep marketing and consulting consents separate for privacy and trust.
- Consent logs should be auditable before live sending.
- Withdrawal should take effect for future send candidates immediately.
- In-flight messages and provider-level opt-out behavior need provider policy review.
- Consent state should fail closed when ambiguous.

## 19. Mobile UX Considerations

- Use short rows and clear ON/OFF states.
- Group consent categories to avoid overwhelming users.
- Use bottom sheets for grant/withdraw confirmation.
- Show impact text before withdrawal confirmation.
- Avoid dense legal text in the first view; provide expandable details.
- Keep marketing and consulting consents visibly separate.

## 20. Accessibility and Copy Principles

- Do not rely on toggle color alone.
- ON/OFF state should be text-visible.
- Buttons should have explicit accessible labels.
- Withdrawal copy should be understandable without legal jargon.
- Use `동의 필요`, `수신 중`, `수신 안 함`, `철회됨`, and `설정 필요` consistently.
- Avoid using `실패` where the issue is missing setup or consent.
- Do not expose technical ids.

## 21. Live Application Preconditions

Before live consent capture or live sending depends on these consents, all of the following must be complete:

- final legal/privacy review;
- consent type taxonomy finalized;
- consent copy finalized;
- consent versioning model finalized;
- consent storage schema finalized;
- RLS policy reviewed;
- withdrawal behavior finalized;
- re-consent policy finalized;
- contact verification relationship finalized;
- account linking relationship finalized;
- Web Push device notification policy finalized;
- Kakao/SMS provider policy finalized;
- audit logging policy finalized;
- staging QA completed;
- mobile/PC QA completed;
- Protected DB approval;
- frontend implementation approval;
- provider live approval;
- production cutover approval.

## 22. Next Steps

Possible follow-up PRs:

- consent schema/RLS Protected review document;
- consent copy legal review checklist;
- consent settings component implementation planning;
- Kakao/SMS provider policy comparison;
- notification QA runbook for consent/contact/provider combinations;
- account and contact data retention/deletion policy document.

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
- consent ledger writes;
- Kakao Alimtalk sending;
- SMS sending;
- Email sending;
- Web Push sending changes;
- account merge or backfill;
- Web Push subscription transfer;
- cron changes;
- production changes.
