# PASSMAP Notification QA Matrix Design

## 1. Purpose

This document defines a QA matrix baseline for PASSMAP notification behavior across account linking, contact verification, consent, reminder rules, channel readiness, provider readiness, Web Push ownership, and scheduler dry-run output.

The goal is to prevent implementation ambiguity before any Protected DB migration, frontend implementation, provider live integration, or scheduler live cutover. Each combination should have an expected UI state, dry-run state, and send-candidate decision.

This document is a design baseline only. It is not frontend implementation, DB migration, SQL apply, Edge Function change, provider integration, Web Push send change, cron change, or production change.

## 2. Current State

Prepared design baselines include:

- `person_id` account-linking design;
- `reminder_rules_v2` person_id design;
- notification contacts/consents design;
- Web Push subscription ownership bridge design;
- notification settings UI v2 design;
- account-linking UX design;
- contact verification UX design;
- consent copy and versioning UX design;
- scheduler v2 provider dry-run adapter and response contract.

The system is still in design/dry-run stage for multi-channel notification behavior. Kakao/SMS/Email provider live sending remains prohibited. DB migrations and Supabase deploys remain prohibited unless separately approved as Protected work.

## 3. Non-goals

This document does not include:

- automated test implementation;
- frontend component implementation;
- DB schema implementation;
- SQL apply;
- Edge Function modification;
- service worker modification;
- provider integration;
- cron cutover;
- production sending.

## 4. Core Decision Dimensions

Notification behavior should be evaluated across these dimensions:

1. Person/account state.
2. Reminder rule state.
3. Contact verification state.
4. Consent state.
5. Channel readiness state.
6. Provider readiness state.
7. Web Push device ownership state.
8. Record guard / skip policy state.
9. Scheduler dry-run mode vs live mode.
10. Fallback eligibility.

Each dimension must fail closed when ambiguous.

## 5. Expected Decision Layers

Recommended decision order:

1. Resolve current PASSMAP person candidate.
2. Check reminder rule enabled and due state.
3. Check service/reminder consent.
4. Check channel-specific consent.
5. Check destination/contact verification.
6. Check channel/provider readiness.
7. Check Web Push ownership and permission when channel is Web Push.
8. Check record guard or skip policy.
9. Build dry-run result or send candidate.
10. Record decision without side effects in dry-run.

If any required layer fails, the result should be a setup/blocked status, not a hidden failure.

## 6. Status Vocabulary

User-facing statuses should be consistent:

- `사용 가능 후보`
- `설정 필요`
- `동의 필요`
- `인증 필요`
- `재인증 필요`
- `provider 준비 전`
- `브라우저 권한 필요`
- `재등록 필요`
- `검토 필요`
- `보조 채널`
- `fallback 후보`
- `실행 제외`
- `건너뜀`

Dry-run/internal status candidates:

- `eligible_candidate`
- `not_due`
- `rule_disabled`
- `service_consent_missing`
- `reminder_consent_missing`
- `channel_consent_missing`
- `contact_unverified`
- `contact_missing`
- `provider_not_ready`
- `web_push_permission_missing`
- `web_push_ownership_conflict`
- `web_push_stale`
- `skip_policy_matched`
- `fallback_candidate`
- `fallback_blocked`
- `live_not_authorized`

## 7. Global Rules

- Consent without contact verification is not enough to send.
- Contact verification without consent is not enough to send.
- Account linking is not consent.
- Phone verification is not account linking.
- Kakao account linking is not Kakao Alimtalk consent.
- Web Push browser permission is not global notification consent.
- Web Push ownership conflict excludes the endpoint from live send candidates.
- Provider readiness must be shown separately from consent and verification.
- Dry-run must not imply provider calls, message ids, ledger writes, or live delivery.
- Reminder rules should not be silently deleted when consent is withdrawn.
- Missing setup should be visible near the affected rule or channel.

## 8. Account and Person Matrix

| Scenario | UI expectation | Dry-run expectation | Send candidate |
| --- | --- | --- | --- |
| Current user has resolved `person_id` | Normal settings available | Continue checks | Possible |
| Current user has no resolved person candidate | Show account setup needed | `person_unresolved` candidate | No |
| Google/Kakao/Naver account linked | Show connected login method | Does not grant consent | No direct effect |
| Provider account unlinked | Show unlinked provider | Does not block existing verified contacts | No direct effect |
| Provider identity matches email but not explicitly linked | Show review only if surfaced | No auto-merge | No direct effect |
| Provider already linked elsewhere | Show `연결 검토 필요` | `account_conflict` candidate | No account-linked expansion |
| Account just linked | Show linked status | Do not auto-transfer Web Push | Existing endpoint may require re-registration |

## 9. Reminder Rule Matrix

| Scenario | UI expectation | Dry-run expectation | Send candidate |
| --- | --- | --- | --- |
| Rule ON and due | Show next/due status | Continue checks | Possible |
| Rule OFF | Keep visible/editable | `rule_disabled` | No |
| Rule deleted/archived | Hide or show archived area | Not evaluated | No |
| Rule ON but duplicated time/channel | Show overlap warning | Continue only if saved | Possible but warning |
| Rule ON but service notification consent withdrawn | Show affected rule disabled/setup needed | `service_consent_missing` | No |
| Rule ON but reminder consent withdrawn | Show reminder consent needed | `reminder_consent_missing` | No |
| Rule ON with future time | Show next scheduled local time | `not_due` | No now |
| Rule ON with timezone missing | Show setup needed | `timezone_missing` | No |

## 10. Contact Verification and Consent Matrix

| Scenario | UI expectation | Dry-run expectation | Send candidate |
| --- | --- | --- | --- |
| Phone verified + Kakao consent granted + provider ready | Kakao usable candidate | `eligible_candidate` | Possible |
| Phone verified + Kakao consent missing | Show Kakao 동의 필요 | `channel_consent_missing` | No |
| Phone unverified + Kakao consent granted | Show 휴대폰 인증 필요 | `contact_unverified` | No |
| Phone missing + SMS consent granted | Show 휴대폰 번호 추가 필요 | `contact_missing` | No |
| Phone verified + SMS fallback consent granted | Show fallback candidate | `fallback_candidate` if primary fails | Fallback only |
| Phone verified + SMS fallback consent missing | Show SMS fallback 동의 필요 | `fallback_blocked` | No fallback |
| Email verified + Email consent granted | Show Email usable candidate | `eligible_candidate` | Possible |
| Email verified + Email consent withdrawn | Show Email 알림 꺼짐 | `channel_consent_missing` | No |
| Email unverified + Email consent granted | Show 이메일 확인 필요 | `contact_unverified` | No |
| Verified contact deleted | Show contact missing/setup needed | `contact_missing` | No |
| Consent withdrawn but contact remains verified | Show verified contact and off consent separately | `channel_consent_missing` | No for withdrawn channel |

## 11. Provider Readiness Matrix

| Scenario | UI expectation | Dry-run expectation | Send candidate |
| --- | --- | --- | --- |
| Kakao consent/contact ready but provider not live | Show provider 준비 전 | `provider_not_ready` | No live send |
| Kakao template not approved | Show template 준비 필요 | `provider_not_ready` | No |
| Kakao sender/profile missing | Show provider 준비 전 | `provider_not_ready` | No |
| SMS consent/contact ready but provider not live | Show SMS 정책/제공자 준비 전 | `provider_not_ready` | No |
| Email consent/contact ready but provider not live | Show Email provider 준비 전 | `provider_not_ready` | No |
| Provider ready but consent missing | Show consent needed, not provider issue | `channel_consent_missing` | No |
| Provider ready but contact unverified | Show verification needed | `contact_unverified` | No |

## 12. Web Push Matrix

| Scenario | UI expectation | Dry-run expectation | Send candidate |
| --- | --- | --- | --- |
| Current device registered + permission granted + active ownership | Show 이 기기 등록됨 | `eligible_candidate` | Possible auxiliary |
| Browser permission denied | Show 브라우저 권한 필요 | `web_push_permission_missing` | No |
| Endpoint keys incomplete | Show 재등록 필요 | `web_push_registration_incomplete` | No |
| Ownership stale | Show 재등록 필요/오래된 기기 | `web_push_stale` | No |
| Ownership conflict | Show 검토 필요/재등록 필요 | `web_push_ownership_conflict` | No |
| Account linked after old subscription | Show re-registration guidance | `web_push_reregistration_needed` | No until re-registered |
| Current device unregistered | Show 이 기기 알림 켜기 | `contact_missing` or `device_unregistered` | No |
| Web Push consent withdrawn | Show Web Push 기기 알림 꺼짐 | `channel_consent_missing` | No |
| Web Push registered but service/reminder consent missing | Show affected rule consent needed | `service_consent_missing` or `reminder_consent_missing` | No |

## 13. Fallback Matrix

Fallback should only occur when all fallback requirements pass.

| Primary state | Fallback state | UI expectation | Dry-run expectation | Send candidate |
| --- | --- | --- | --- | --- |
| Kakao provider not ready | SMS consent/contact ready | Show SMS fallback 후보 but provider primary not live | `primary_provider_not_ready`, `fallback_candidate` | Dry-run only |
| Kakao live send failure candidate | SMS consent/contact ready | Show SMS fallback available | `fallback_candidate` | Possible only after live approval |
| Kakao consent missing | SMS consent/contact ready | Show Kakao consent needed; fallback policy required | `primary_consent_missing` | No automatic fallback unless policy allows |
| Kakao contact unverified | SMS contact same verified phone | Show Kakao setup needed | Depends on policy | Conservative no |
| SMS consent missing | Any primary failure | Show SMS fallback 동의 필요 | `fallback_blocked` | No fallback |
| SMS phone unverified | Any primary failure | Show 휴대폰 인증 필요 | `fallback_blocked` | No fallback |
| SMS provider not ready | Any primary failure | Show SMS provider 준비 전 | `fallback_blocked` | No fallback |

Conservative MVP recommendation:

- Do not use fallback as a way to bypass missing consent or missing verification on the primary channel.
- Fallback should be limited to provider/channel delivery failure after all required consent/contact checks are satisfied.

## 14. Record Guard and Skip Policy Matrix

| Scenario | UI expectation | Dry-run expectation | Send candidate |
| --- | --- | --- | --- |
| Skip policy = always send | No skip warning | Continue checks | Possible |
| Today record exists + skip if today record exists | Show would skip | `skip_policy_matched` | No |
| Weekly record exists + weekly skip policy | Show would skip | `skip_policy_matched` | No |
| Record guard unknown | Show preview unavailable or conservative status | `record_guard_unknown` | No in live until resolved |
| Multiple rules same day | Show overlap/excess warning | Continue if user saved | Possible |

MVP recommendation:

- Default skip policy should remain predictable, preferably `항상 보내기`.
- Advanced skip behavior should not be hidden from users.

## 15. Dry-run Response Expectations

Dry-run response should:

- include zero side effects;
- not call providers;
- not write ledger rows;
- not return provider message ids;
- show `wouldCallProvider` only as metadata, not as a real call;
- show consent/contact/provider readiness separately;
- show fallback candidate vs fallback blocked separately;
- preserve existing top-level counters if already defined by scheduler v2 contract.

Example dry-run summary:

```json
{
  "decision": {
    "status": "blocked",
    "reason": "channel_consent_missing"
  },
  "channels": [
    {
      "channel": "kakao_alimtalk",
      "contact": "verified",
      "consent": "missing",
      "provider": "not_ready",
      "candidate": false
    }
  ]
}
```

## 16. UI QA Cases

Minimum UI QA cases:

1. Rule ON + all Kakao requirements missing.
2. Rule ON + phone verified + Kakao consent missing.
3. Rule ON + Kakao consent granted + phone unverified.
4. Rule ON + Kakao ready candidate + SMS fallback missing consent.
5. Rule ON + SMS fallback consent granted + phone missing.
6. Rule ON + Email verified + Email consent withdrawn.
7. Rule ON + Web Push registered + ownership conflict.
8. Rule ON + Web Push registered + browser permission denied.
9. Rule OFF + all channel requirements ready.
10. Service notification consent withdrawn + multiple rules ON.
11. Marketing consent ON + service notification OFF.
12. Consulting connection consent ON + notification consents OFF.
13. Account linked + Web Push old subscription present.
14. Provider account conflict + verified phone present.
15. Skip policy matched + channels ready.

## 17. Scheduler QA Cases

Minimum scheduler/dry-run QA cases:

1. No resolved person.
2. Resolved person, no due rules.
3. Due rule, missing service consent.
4. Due rule, missing reminder consent.
5. Due rule, Kakao consent/contact ready, provider not ready.
6. Due rule, Kakao blocked, SMS fallback eligible.
7. Due rule, Kakao blocked, SMS fallback consent missing.
8. Due rule, Web Push active ownership.
9. Due rule, Web Push stale ownership.
10. Due rule, Web Push conflict ownership.
11. Due rule, skip policy matched.
12. Live mode requested before approval.

Live mode must remain rejected until separate provider live, DB, cron, and production approvals exist.

## 18. Risk Areas

- Treating contact verification as consent.
- Treating consent as provider readiness.
- Treating account linking as consent.
- Treating Kakao login as Kakao Alimtalk readiness.
- Treating Web Push browser permission as global notification consent.
- Sending SMS fallback without explicit fallback consent.
- Silently skipping reminders due to hidden record guard.
- Auto-transferring Web Push subscriptions after account linking.
- Mixing marketing and service notification consent.
- Showing dry-run as if delivery succeeded.

## 19. Live Application Preconditions

Before this matrix is used for live sending, all of the following must be complete:

- contacts/consents schema finalized;
- consent versioning schema finalized;
- `reminder_rules_v2` schema finalized;
- Web Push ownership bridge finalized;
- account-linking conflict policy finalized;
- provider readiness policy finalized;
- fallback policy finalized;
- record guard/skip policy finalized;
- scheduler v2 dry-run QA passing;
- UI QA passing;
- PC/Android/iPhone QA passing;
- Protected DB approval;
- frontend implementation approval;
- provider live approval;
- cron cutover approval;
- production cutover approval.

## 20. Next Steps

Possible follow-up PRs:

- notification QA runbook implementation planning;
- scheduler v2 dry-run QA fixture design;
- notification settings UI implementation planning;
- consent/contact schema RLS Protected review document;
- Kakao/SMS provider comparison and policy document;
- PC/Android/iPhone notification QA runbook.

## 21. Guardrails

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
- Kakao Alimtalk sending;
- SMS sending;
- Email sending;
- Web Push sending changes;
- consent ledger writes;
- account merge or backfill;
- Web Push subscription transfer;
- cron changes;
- production changes.
