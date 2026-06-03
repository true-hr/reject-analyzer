# PASSMAP Notification Settings UI v2 Design

## 1. Purpose

This document defines the product and UX baseline for PASSMAP notification settings UI v2.

The UI should let users understand and configure:

- notification channels;
- notification contacts and verification state;
- notification consent and withdrawal state;
- multiple reminder rules;
- account-linking status that affects `person_id`-based ownership.

The user should not need to understand tables, schemas, `person_id`, `auth_user_id`, contacts, or consent records. The UI should translate the `person_id`-based notification model into natural product concepts such as "my notification channels", "my reminder rules", "this device", and "connected accounts".

This document is a design baseline only. It is not frontend implementation, DB migration, SQL apply, Edge Function change, service worker change, provider integration, actual sending, or production change.

## 2. Current State

- Web Push test notification is implemented.
- Existing UI is centered on weekly reminder settings and current-device Web Push state.
- Web Push remains an auxiliary channel.
- Kakao Alimtalk is the primary operating channel candidate.
- SMS is the fallback candidate.
- Email is an auxiliary channel.
- `person_id`, `reminder_rules_v2`, `notification_contacts`/consents, and Web Push ownership bridge design documents are prepared.
- Scheduler v2 remains dry-run/mock.
- Real DB changes, Edge Function changes, provider integration, cron cutover, and live sending remain prohibited.

## 3. Non-goals

This document does not include:

- frontend implementation;
- DB migration authoring;
- SQL apply;
- Edge Function modification;
- service worker modification;
- provider integration;
- env or secret addition;
- real Kakao, SMS, Email, or Web Push sending;
- production changes.

## 4. Core UX Principles

- Users should understand "my notification channels" and "my reminder rules", not tables or schemas.
- Kakao Alimtalk, SMS, Web Push, and Email roles must be clearly separated.
- Do not hide that Web Push is an auxiliary channel.
- SMS fallback and possible cost/availability policy should be clear.
- Marketing consent and service notification consent must remain separate.
- Phone number verification and Kakao account linking must not be confused.
- Account linking and notification channel setup are separate.
- Channels that are risky, unavailable, or not connected should show "setup needed" states.
- Users should be able to create and manage multiple reminder rules.
- Disabled rule state and unavailable channel state must be visually and textually distinct.
- Do not expose technical identifiers such as `person_id`, `auth_user_id`, endpoint, or subscription id.

## 5. Screen Structure Draft

Top-level route/surface candidates:

- `NotificationSettingsPage`
- `Settings > Notifications`
- existing reminder/settings surface expanded into v2

Recommended section order:

1. My notification channels.
2. Reminder rules.
3. Account linking status.
4. Consent and receiving settings.
5. Test notification or dry-run preview.

Rationale:

- Channel readiness is the first user question: "Can PASSMAP reach me?"
- Rules are the main configuration object: "When should PASSMAP remind me?"
- Account linking explains why records and reminders stay under one PASSMAP account.
- Consent settings should be explicit but not mixed into every channel card.
- Test/dry-run UX should clarify readiness without implying live provider success.

## 6. My Notification Channels Section

Goal: show each delivery channel as a user-facing channel card with role, state, and next action.

### Kakao Alimtalk Card

State candidates:

- `준비 예정`
- `연결 필요`
- `사용 가능 후보`

User-facing role:

- Main reminder channel candidate that can work even when the browser is closed.

CTA candidates:

- `휴대폰 번호 인증`
- `카카오 알림톡 준비 중`

Required guidance:

- Kakao Alimtalk requires an approved template and sender/profile readiness before live use.
- Phone number verification is not Kakao account linking.
- Kakao account linking is not Alimtalk receiving consent.

### SMS Card

State candidates:

- `휴대폰 인증 필요`
- `fallback 가능`
- `SMS fallback 동의 필요`

User-facing role:

- Auxiliary text message path after Kakao Alimtalk failure.

CTA candidates:

- `SMS fallback 동의`
- `휴대폰 번호 인증`

Required guidance:

- SMS is a fallback candidate, not a default parallel send.
- Cost, quota, and sender policy must be finalized before live use.
- SMS fallback consent is separate from Kakao Alimtalk consent.

### Web Push Card

State candidates:

- `이 기기 등록됨`
- `이 기기 미등록`
- `브라우저 권한 필요`
- `재등록 필요`
- `충돌 상태`
- `오래된 기기`
- `지원 제한 가능`

User-facing role:

- Auxiliary notification for the current browser/device.

CTA candidates:

- `이 기기 알림 켜기`
- `이 기기 다시 등록`
- `이 기기 알림 끄기`

Required guidance:

- Web Push applies only to the current browser/device.
- Delivery and click behavior can vary by browser, OS, permission, and device state.
- Web Push is not the primary operating channel.

### Email Card

State candidates:

- `이메일 확인됨`
- `이메일 확인 필요`

User-facing role:

- Auxiliary channel for reports, digests, summaries, and longer content.

CTA candidates:

- `이메일 확인`

Required guidance:

- Email is lower priority for immediate reminders.
- Provider email should not be treated as permanent identity proof.

## 7. Reminder Rules Section

Goal: let users create, read, update, disable, and eventually archive/delete multiple reminder rules.

Rule card examples:

- `[ON] 매일 18:00 · 퇴근 전 업무기록 · 카카오 알림톡 -> SMS fallback`
- `[ON] 평일 22:30 · 밤 회고 · Web Push 보조`
- `[OFF] 매주 금요일 17:30 · 주간 정리 · Email`

Each rule card should show:

- enabled status;
- label;
- reminder kind;
- cadence;
- `time_local`;
- timezone;
- channels;
- fallback relationship;
- last dry-run status candidate;
- next scheduled local time candidate.

CTA candidates:

- `알림 추가`
- `수정`
- `끄기`
- `삭제`
- `보관`

UX rules:

- Disabled rules should remain visible and editable.
- Deletion or archival needs a confirmation step.
- Multiple active rules can be allowed, but the UI should make overlap visible.
- If duplicate or overlapping reminders are likely, show a warning before saving.
- Channel availability should be shown as setup guidance, not as a hidden validation failure.

## 8. Add/Edit Reminder Flow

Form fields:

- reminder label;
- reminder kind;
- cadence;
- days of week;
- time;
- timezone;
- channel selection;
- fallback selection;
- skip policy candidate.

Reminder kind candidates:

- `업무기록 리마인드`
- `주간 정리`

Cadence candidates:

- `매일`
- `평일`
- `매주`
- `직접 요일 선택`

Channel candidates:

- `Kakao 알림톡`
- `SMS fallback`
- `Web Push`
- `Email`

Skip policy candidates:

- `항상 보내기`
- `오늘 기록이 있으면 건너뛰기`
- `주간 기록이 있으면 건너뛰기`

MVP recommendation:

- Default skip policy is `항상 보내기`.
- Complex skip policy should be advanced or deferred.
- The UI should not silently suppress reminders based on a hidden record guard.
- For v1, prefer predictable sending over clever suppression.

Flow candidates:

- mobile: bottom sheet or step-by-step wizard;
- desktop: modal or inline edit panel;
- advanced fields: collapsed section after basic cadence/channel choices.

## 9. Account Linking Status Section

Goal: explain the current login and linked provider accounts without implying notification consent.

Display candidates:

- Current login: `Google`, `Kakao`, `Naver`, or `Email`.
- Connected accounts:
  - `Google 연결됨`
  - `Kakao 미연결`
  - `Naver 미연결`

User-facing guidance:

```text
계정을 연결하면 같은 PASSMAP 계정에서 기록과 알림을 함께 관리할 수 있습니다.
```

CTA candidates:

- `Kakao 계정 연결`
- `Naver 계정 연결`
- `연결 관리`

Required cautions:

- Account linking is not Alimtalk receiving consent.
- Phone number verification is not account linking.
- Provider account linking must not automatically merge accounts by email, name, or phone.
- Account linking must not automatically transfer existing Web Push subscriptions.
- Contact verification remains separate from provider account linking.

## 10. Consent and Receiving Settings Section

Goal: give users explicit control over receiving consent and withdrawal state.

Consent rows to show separately:

- `서비스 알림`
- `업무기록 리마인드`
- `Kakao 알림톡`
- `SMS fallback`
- `Email 알림`
- `Web Push 기기 알림`
- `마케팅 알림`
- `컨설팅 연결 동의`

UX principles:

- Marketing consent must be separate from service notification consent.
- Consulting connection consent must be separate from notification consent.
- A withdrawal action must be available.
- A withdrawal action should explain which notifications will stop.
- Consent copy/version can be managed internally and does not need to expose technical version ids.
- Revoked consent should immediately show affected channel/rule impact.
- Missing consent should appear as setup needed, not as an error.

Example impact copy:

```text
SMS fallback 동의를 철회하면 카카오 알림톡 실패 시 문자 fallback을 보내지 않습니다.
```

## 11. Web Push State UX

State candidates:

- `이 기기 등록됨`
- `브라우저 권한 필요`
- `재등록 필요`
- `충돌 상태`
- `오래된 기기`
- `지원 제한 가능`

Suggested copy:

```text
Web Push는 이 브라우저/기기에만 적용되는 보조 알림입니다. 휴대폰 카카오/SMS 알림과 다르게 브라우저 상태에 따라 도착이나 클릭 동작이 달라질 수 있습니다.
```

CTA candidates:

- `이 기기 알림 켜기`
- `이 기기 다시 등록`
- `이 기기 알림 끄기`

UX rules:

- A Web Push contact should be described as a device/browser registration, not as a person-level phone/email contact.
- Conflict or stale ownership should ask for re-registration.
- Browser permission denied should guide the user to browser settings.
- iPhone limitations should be shown only when relevant, preferably in help text or a collapsed note.
- Test notification should be limited to the current registered device before broader live approval.

## 12. Dry-run Preview and Test Notification UX

MVP preview candidates:

- `알림 설정 미리보기`
- `다음 실행 시 어떤 채널이 사용될지 확인`
- `테스트 알림 보내기`

Display examples:

- `Kakao: 아직 실제 발송 준비 전`
- `SMS: fallback 후보`
- `Web Push: 현재 기기 테스트 가능`
- `Email: 추후 지원`

Rules:

- Dry-run preview must not look like real delivery success.
- Kakao/SMS real test sending requires provider live approval.
- Web Push test notification can stay limited to the current registered device.
- Dry-run counters must not imply provider calls, messages sent, or ledger writes.
- Use scheduler statuses such as setup needed, consent missing, contact unverified, or provider not ready.

## 13. Mobile UI Considerations

- The settings page should be mobile-first and concise.
- Recommended order: channel cards, rule cards, consent management.
- Add/edit reminder flow can use a bottom sheet or step-by-step wizard.
- Time selection can use native time picker or simple select.
- Long explanations should move into collapsible help text.
- iPhone Web Push limitations need a separate note.
- Avoid dense tables on mobile.
- Keep channel status and rule status visible without horizontal scrolling.

## 14. Accessibility and Copy Principles

- Prefer action-oriented wording such as `설정 필요`, `재등록 필요`, or `동의 필요`.
- Avoid overusing wording such as `실패` or `오류` when the user can take a setup action.
- Clearly distinguish disabled rules from unavailable channels.
- Do not rely on color alone for status.
- Channel icons can support recognition but must not be the only signal.
- Technical ids such as `person_id`, `auth_user_id`, endpoint, or subscription id must not be shown.
- Buttons should have explicit labels and accessible names.
- Consent withdrawal should use clear, reversible-feeling language when the user can re-consent later.

## 15. Risk Areas

- Users can confuse Kakao account linking with Alimtalk receiving consent.
- Users can confuse phone verification with provider account linking.
- Users might not understand SMS fallback cost or purpose.
- Web Push can be mistaken for the primary channel.
- Marketing consent can accidentally mix with service notification consent.
- Multiple reminder rules can cause excessive notifications.
- Skip policy can become unpredictable if hidden or too clever.
- Account-linking state can be mixed with contact verification state.
- Notification settings can become too complex and cause drop-off.
- Dry-run preview can be mistaken for live provider readiness.

## 16. Live Application Preconditions

Before live application, all of the following must be complete:

- contacts/consents schema finalized;
- `reminder_rules_v2` schema finalized;
- Web Push ownership bridge finalized;
- account-linking UX finalized;
- phone verification UX finalized;
- email verification UX finalized;
- consent copy/version finalized;
- withdrawal UX finalized;
- Kakao/SMS provider policy finalized;
- staging dry-run PASS;
- mobile QA;
- PC QA;
- Protected DB approval;
- frontend implementation approval;
- provider live approval;
- cron cutover approval.

Without these approvals, UI v2 remains a design baseline and must not imply live multi-channel delivery.

## 17. Next Steps

Possible follow-up PRs:

- notification settings UI v2 component implementation planning;
- `ReminderSettingsPanel` v2 implementation PR;
- `NotificationChannelPanel` implementation PR;
- `AccountLinkingPanel` design/implementation PR;
- consent copy/UX document;
- Kakao/SMS provider candidate comparison document;
- PC/Android/iPhone QA runbook.

## 18. Guardrails

This document does not authorize:

- frontend changes;
- DB or SQL changes;
- Supabase SQL Editor execution;
- Supabase CLI db push/apply;
- Edge Function changes;
- service worker changes;
- auth or provider setting changes;
- env or secret usage;
- provider API calls;
- Kakao Alimtalk sending;
- SMS sending;
- Email sending;
- Web Push sending changes;
- Supabase deploy;
- cron changes;
- production changes.
