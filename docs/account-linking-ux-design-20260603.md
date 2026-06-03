# PASSMAP Account Linking UX Design

## 1. Purpose

This document defines the product and UX baseline for PASSMAP account linking during the transition from provider-specific `auth.users.id` ownership to PASSMAP `person_id` ownership.

The goal is to let users safely connect Google, Kakao, Naver, and email login identities to one PASSMAP person without confusing account linking with notification consent, phone verification, Kakao Alimtalk receiving, or Web Push device ownership.

This document is a design baseline only. It is not a frontend implementation, DB migration, SQL apply, Supabase Auth provider change, Edge Function change, service worker change, production change, or account merge execution.

## 2. Current State

- PASSMAP currently has provider login and notification-related design work in progress.
- The `person_id` account-linking design baseline already defines `persons` and `linked_auth_users` as candidates.
- Notification settings UI v2 now separates reminder rules, notification channels, consent, and account-linking status.
- Notification contacts/consents and Web Push ownership bridge designs are prepared.
- Existing `auth.users.id`-based records and subscriptions must not be automatically moved to `person_id` ownership before Protected migration review.
- No live DB migration, provider settings change, automatic account merge, or production account-linking flow is authorized by this document.

## 3. Non-goals

This document does not include:

- frontend implementation;
- Supabase Auth provider configuration;
- DB migration authoring;
- SQL apply;
- RLS implementation;
- account merge execution;
- existing user data backfill;
- Web Push subscription transfer;
- Kakao Alimtalk setup;
- phone or email verification implementation;
- production deployment.

## 4. Core UX Principles

- Users should understand this as "계정 연결" or "로그인 수단 연결", not database identity merging.
- Technical identifiers such as `person_id`, `auth_user_id`, provider subject, or linked_auth_users row id must not be shown.
- Account linking is separate from notification channel setup.
- Kakao account linking is not Kakao Alimtalk receiving consent.
- Phone number verification is not account linking.
- Email verification is not sufficient to auto-merge accounts.
- Provider account linking must require explicit user action and confirmation.
- Do not automatically merge accounts based on matching email, name, or phone.
- Do not automatically transfer existing Web Push subscriptions when accounts are linked.
- Account linking should be reversible or at least reviewable before destructive changes.
- The UI must clearly warn when a provider is already linked to another PASSMAP person or has conflicting ownership.

## 5. User-facing Mental Model

Recommended wording:

```text
계정을 연결하면 Google, Kakao, Naver 등 다른 로그인 방식으로 접속해도 같은 PASSMAP 기록과 알림 설정을 이어서 사용할 수 있습니다.
```

Avoid wording that implies:

- all data will be merged immediately;
- all notifications will start automatically;
- Kakao login enables Kakao Alimtalk;
- a verified phone number proves provider account ownership;
- matching email is enough for automatic linking.

Recommended concept labels:

- `연결된 로그인 수단`
- `현재 로그인`
- `연결 가능 계정`
- `연결 검토 필요`
- `연결 해제`
- `다른 계정에 연결됨`

## 6. Screen Placement

Account linking should appear in two places:

1. `Settings > Account` or account profile settings as the main management surface.
2. `Settings > Notifications` as a compact status section that explains whether login identity affects notification ownership.

The notification settings surface should not become the main account-linking wizard. It should show status and link to the dedicated account management flow.

Recommended compact section in notification settings:

```text
연결된 계정
현재 로그인: Google
Google 연결됨 · Kakao 미연결 · Naver 미연결
계정을 연결하면 같은 PASSMAP 계정에서 기록과 알림을 함께 관리할 수 있습니다.
[연결 관리]
```

## 7. Main Account Linking Management Surface

The main account-linking surface should include:

- current login method;
- connected login methods;
- unconnected provider options;
- connection status;
- last linked timestamp candidate;
- unlink or manage action candidate;
- conflict/review-required state;
- explanation of what linking does and does not do.

Provider row examples:

```text
Google
상태: 연결됨
설명: Google로 로그인해도 같은 PASSMAP 계정을 사용합니다.
CTA: 관리
```

```text
Kakao
상태: 미연결
설명: Kakao 로그인 수단을 연결할 수 있습니다. 알림톡 수신 동의와는 별도입니다.
CTA: Kakao 연결
```

```text
Naver
상태: 연결 검토 필요
설명: 이 Naver 계정은 다른 PASSMAP 계정과 연결되어 있을 수 있습니다.
CTA: 연결 검토
```

## 8. Account Linking Flow

Recommended flow:

1. User clicks provider linking CTA.
2. UI explains what will happen before redirect.
3. User authenticates with the provider.
4. PASSMAP receives provider identity.
5. System evaluates whether the provider identity can be linked safely.
6. User sees a confirmation screen before final linking.
7. Linked status is updated only after explicit confirmation.

Pre-redirect confirmation copy candidate:

```text
Kakao 계정을 PASSMAP 로그인 수단으로 연결합니다.
연결해도 카카오 알림톡 수신 동의가 자동으로 켜지지는 않습니다.
```

Post-auth confirmation copy candidate:

```text
이 Kakao 계정을 현재 PASSMAP 계정에 연결하시겠습니까?
연결하면 앞으로 Kakao로 로그인해도 같은 기록과 알림 설정을 사용할 수 있습니다.
```

## 9. Safe Linking Conditions

A provider identity can be treated as safe-to-link only when:

- the user is currently authenticated in PASSMAP;
- the provider authentication flow completed successfully;
- the provider identity is not actively linked to another PASSMAP person;
- the current session person is eligible to add another login method;
- the user explicitly confirms the link after seeing the target provider;
- no Protected conflict policy blocks the operation.

The following must not trigger automatic linking:

- same email;
- same display name;
- same phone number;
- same browser device;
- same Web Push endpoint;
- same marketing or notification contact;
- same prior imported resume or document metadata.

## 10. Conflict and Review States

Account linking needs clear non-destructive states.

State candidates:

- `linked`
- `unlinked`
- `pending_confirmation`
- `review_required`
- `already_linked_elsewhere`
- `blocked`
- `unlink_pending`

Conflict examples:

### Provider already linked elsewhere

```text
이 Kakao 계정은 다른 PASSMAP 계정에 연결되어 있을 수 있습니다.
자동으로 연결하지 않았습니다. 본인 계정인지 확인이 필요합니다.
```

### Matching email but no explicit link

```text
같은 이메일을 사용하는 계정이 있을 수 있지만, 보안을 위해 자동 연결하지 않습니다.
계정 연결은 본인 확인 후 직접 진행해야 합니다.
```

### Web Push device conflict

```text
현재 브라우저 알림 등록 상태가 이전 로그인과 다를 수 있습니다.
계정 연결 후 이 기기 알림은 다시 등록해야 할 수 있습니다.
```

## 11. Unlinking UX

Unlinking should be supported cautiously.

Unlink UX should explain:

- which login method will be removed;
- whether the user can still log in with another method;
- that records are not deleted by unlinking a provider;
- that notification consents are not automatically withdrawn;
- that Web Push device registrations may need review or re-registration.

Unlink should be blocked or require stronger confirmation when:

- it is the only login method;
- there is no verified email or fallback login;
- the user is trying to unlink the current session provider without another available method;
- Protected policy requires support review.

Copy candidate:

```text
Google 연결을 해제해도 PASSMAP 기록은 삭제되지 않습니다. 다만 Google로는 더 이상 이 PASSMAP 계정에 로그인할 수 없습니다.
```

## 12. Relationship to Notification UX

Account linking affects identity continuity, not delivery permission.

Must remain separate:

- Kakao account linking vs Kakao Alimtalk receiving consent;
- phone verification vs provider account linking;
- email verification vs provider account linking;
- Web Push current-device registration vs account linking;
- service notification consent vs marketing consent;
- consulting connection consent vs notification consent.

Notification settings should show account-linking status only as contextual information. Actual channel readiness should come from contacts, consents, verification, provider readiness, and device ownership.

## 13. Web Push Ownership Implications

When a user links another provider account:

- existing Web Push subscriptions must not be automatically transferred to the resulting person;
- current browser/device may be prompted for re-registration;
- stale or conflicting endpoints should be excluded from live send candidates;
- `web_push_subscription_owners` candidates should be evaluated by current login, permission, endpoint key completeness, last_seen freshness, and conflict state;
- raw endpoint/p256dh/auth should not be copied into person-level contacts.

User-facing copy candidate:

```text
브라우저 알림은 이 기기 기준으로 작동합니다. 계정을 연결한 뒤에도 이 기기 알림은 다시 켜야 할 수 있습니다.
```

## 14. Data Migration and Backfill UX

If future migration/backfill detects possible account relationships, the UI should treat them as review candidates, not automatic merges.

Candidate states:

- `연결 추천`
- `본인 확인 필요`
- `검토 필요`
- `지원팀 확인 필요`

Do not show scary database terms. Explain in user language:

```text
같은 이메일을 사용한 로그인 기록이 있을 수 있습니다. 보안을 위해 자동으로 합치지 않고, 본인 확인 후 연결할 수 있습니다.
```

Backfill should not:

- silently merge records;
- silently move reminders;
- silently move Web Push subscriptions;
- silently enable Kakao/SMS/Email sending;
- silently change marketing or consulting consent.

## 15. Security and Privacy Considerations

- Provider identity details should be minimized in UI.
- Mask emails and phone numbers where appropriate.
- Do not expose provider subject identifiers.
- Account-linking confirmation should show enough information for recognition without leaking sensitive data.
- Support/review flows should avoid revealing whether another user's account exists.
- Audit logging should be considered before live linking.
- Unlink actions should be logged.
- High-risk conflicts should fail closed, not auto-link.

## 16. Mobile UX Considerations

- Provider rows should be card-based and easy to scan.
- The main CTA should be one provider at a time.
- Confirmation screens should be short and explicit.
- Long explanations should be in collapsed help text.
- Current login and connected accounts should remain visible.
- Avoid dense account tables.
- Use provider icons only as supplemental information; never rely on icon color alone.

## 17. Accessibility and Copy Principles

- Buttons should include provider names, such as `Kakao 계정 연결`.
- Status should be text-visible, not color-only.
- Conflict states should explain the next safe action.
- Avoid accusatory wording like `잘못된 계정`.
- Prefer action-oriented wording like `본인 확인 필요`, `연결 검토 필요`, or `다시 로그인 필요`.
- Do not expose `person_id`, `auth_user_id`, provider subject, endpoint, or subscription id.

## 18. Live Application Preconditions

Before live account linking is enabled, all of the following must be complete:

- `persons` schema finalized;
- `linked_auth_users` schema finalized;
- RLS policy reviewed;
- account-linking conflict policy finalized;
- unlinking policy finalized;
- audit logging policy finalized;
- notification contacts/consents relationship finalized;
- Web Push ownership bridge relationship finalized;
- account-linking UI copy finalized;
- staging QA completed;
- provider callback QA completed;
- rollback policy finalized;
- Protected DB approval;
- Supabase Auth/provider approval;
- frontend implementation approval;
- production cutover approval.

## 19. Next Steps

Possible follow-up PRs:

- account-linking component implementation planning;
- phone verification and contact verification UX design;
- consent copy/versioning UX design;
- linked_auth_users schema/RLS Protected review document;
- provider conflict resolution runbook;
- Web Push re-registration UX copy document.

## 20. Guardrails

This document does not authorize:

- frontend changes;
- DB or SQL changes;
- Supabase SQL Editor execution;
- Supabase CLI db push/apply;
- Supabase Auth provider setting changes;
- Edge Function changes;
- service worker changes;
- env or secret usage;
- provider API calls;
- actual account linking;
- account merge or backfill;
- Web Push subscription transfer;
- Kakao Alimtalk sending;
- SMS sending;
- Email sending;
- cron changes;
- production changes.
