# Kakao/SMS Provider, Consent, Verification Boundary

Date: 2026-06-17

This document fixes the implementation boundary after guarded phone contact save. It is not an implementation plan for live Kakao Alimtalk, SMS, OTP, consent grant, capability promotion, or message delivery.

## 1. Current Completed State

- PR #925 production apply and smoke verification: PASS.
- PR #926 Kakao Alimtalk readiness guarded UI: merged and PASS.
- PR #927 guarded phone contact save UI: merged and PASS.
- Users can save a phone number for notification preparation.
- After save, the user-facing state is `저장됨 · 인증 필요`.
- Saving a phone number alone must never cause:
  - `contact_verified = true`
  - `consent = granted`
  - `capability = ready`
  - Kakao Alimtalk `send_eligibility = ready`
  - live Kakao/SMS/Push sending

## 2. Core Principles

- Kakao account identity active is not Kakao Alimtalk send ready.
- Kakao login is not Alimtalk consent.
- Phone contact saved is not phone verified.
- Phone verified is not Alimtalk consent granted.
- Consent granted is not provider capability ready.
- `send_eligibility = ready` is forbidden before provider capability is ready.
- Capability row seed or ready promotion is forbidden without separate approval.
- Live Kakao/SMS/Push sending is forbidden without separate approval.
- SMS is not the primary operating channel. It is a fallback, verification, or emergency support channel.
- Web Push is a phone/device support channel.
- Kakao Alimtalk is a candidate primary operating notification channel.

## 3. Fixed Next Implementation Order

1. Phone verification design and implementation
   - Verification code generation and verification.
   - Verification row creation.
   - `contact_verified = true` handling.
   - Before provider selection, this requires a mock/dry-run path or an SMS provider decision.

2. Consent split UI
   - Notification receiving consent.
   - Kakao Alimtalk receiving consent.
   - SMS fallback receiving consent.
   - Marketing consent separated from service reminder consent.

3. Provider research confirmation
   - Kakao Alimtalk provider.
   - SMS provider.
   - Template approval.
   - Sender profile and sender number.
   - Cost.
   - Deno/Supabase Edge Function call feasibility.

4. Dry-run adapter
   - No real sending.
   - Request payload shape validation.
   - Mock delivery result recording.
   - Must be possible without environment variables or secrets.

5. Capability promotion checklist
   - Provider account ready.
   - Sender profile and sender number ready.
   - Kakao template approved.
   - SMS fallback ready.
   - API key/secret registered as production server or Edge secrets.
   - Dry-run PASS.
   - Live test approved.

6. Live test
   - Only one message after separate explicit approval.
   - No raw identifier or secret exposure.
   - Confirm fallback policy on failure.

## 4. Provider Candidate Comparison

This comparison is only for candidate screening and MVP criteria. It is not a final contract, final cost decision, secret registration, or live sending approval.

Official reference pages checked:

- SOLAPI: [API 간편연동](https://solapi.com/api), [가격 정책](https://solapi.com/pricing), [Developers](https://solapi.com/developers), [메시징 서비스](https://solapi.com/message-types)
- Aligo: [카카오 알림톡 API](https://smartsms.aligo.in/alimapi.html), [문자 발송 RESTful API](https://smartsms.aligo.in/smsapi.html), [카카오 알림톡](https://smartsms.aligo.in/aligoxkakao.html), [문자 API 예제](https://smartsms.aligo.in/admin/api/example.html)
- NHN Cloud: [KakaoTalk Bizmessage Overview](https://docs.nhncloud.com/en/Notification/KakaoTalk%20Bizmessage/en/Overview/), [AlimTalk Overview](https://docs.nhncloud.com/en/Notification/KakaoTalk%20Bizmessage/en/alimtalk-overview/), [AlimTalk API Guide](https://docs.nhncloud.com/en/Notification/KakaoTalk%20Bizmessage/en/alimtalk-api-guide/), [pricing entry](https://docs.gtm.toastoven.net/kr/pricing/m-content?c=Notification&s=Notification+Hub)

| Candidate | Kakao Alimtalk | SMS | Fallback possibility | Node.js SDK or HTTP API | Deno/Supabase Edge feasibility | Sender requirements | Kakao template approval | Cost check location | MVP suitability | Operational complexity | PASSMAP first-use possibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SOLAPI | Supported as Kakao Alimtalk/message product | Supported | Candidate; official pages mention SMS fallback for Alimtalk paths | Node.js SDK and REST API references are available | HTTP API likely feasible; SDK use requires runtime compatibility check | Sender number, Kakao channel/profile, template setup | Required for Alimtalk templates | SOLAPI pricing page and tiered pricing guide | Good dry-run candidate because Alimtalk/SMS/API/cost surfaces are easy to inspect | Moderate | Good first dry-run candidate |
| Aligo | Supported as Alimtalk API | Supported | Candidate; must verify fallback behavior in API docs/account settings | RESTful API; examples include Node.js/Python/PHP/JSP/.NET | HTTP API likely feasible | Sender number and Kakao channel/profile requirements must be checked in account setup | Required for Alimtalk templates | Aligo pricing/service pages and account console | Keep as cost-focused alternative | Low to moderate for basic SMS; Alimtalk details need account-side confirmation | Possible alternative after cost/API review |
| NHN Cloud Notification / KakaoTalk Bizmessage | Supported through KakaoTalk Bizmessage AlimTalk | Supported through NHN Cloud notification services | Supported for some Bizmessage paths with SMS fallback configuration | RESTful APIs documented | HTTP API likely feasible; auth and app-key model must be checked | NHN app, Kakao sender/profile, SMS app/sender setup | Required for AlimTalk templates | NHN Cloud pricing entry and console | Could be heavy for MVP | Higher | Strong integrated platform candidate, but may be heavier than needed for first dry-run |

MVP criteria draft:

- First MVP dry-run candidate: SOLAPI.
- Reason:
  - Kakao Alimtalk and SMS can both be reviewed.
  - Node.js SDK/API documentation is visible.
  - The items to verify in a small MVP are clear.
- Alternatives:
  - Aligo: keep as a cost candidate.
  - NHN Cloud: keep as an integrated Notification Hub candidate, but it may be heavy for MVP.

Actual provider confirmation, contract, secret registration, and live sending are outside this document.

## 5. PASSMAP Notification Copy Policy

Kakao Alimtalk template candidates must be informational reminders only.

Allowed candidate examples:

- "오늘 업무 기록을 남길 시간이에요."
- "오늘 진행한 일을 PASSMAP에 정리해 보세요."
- "설정한 리마인드 시간입니다. 오늘 기록을 이어서 작성해 주세요."

Restrictions:

- No advertising or promotional copy.
- No exaggerated performance or benefit claims.
- No recruiting, matching, consulting, or sales-lead copy.
- No marketing sends without marketing consent.
- No live sends before template approval.

## 6. Consent Separation Standard

Consent must be split at least as follows:

- `service_reminder_consent`
  - PASSMAP work-record reminder receiving consent.
- `kakao_alimtalk_reminder_consent`
  - Kakao Alimtalk channel receiving consent.
- `sms_fallback_consent`
  - SMS receiving consent for Alimtalk failure, verification, or emergency fallback.
- `marketing_consent`
  - Marketing receiving consent.
  - Separate from this notification work.
- `consulting_or_b2b_consent`
  - Consent related to consulting, headhunter, or company viewing workflows.
  - Separate from this notification work.

Strictly forbidden:

- Do not combine phone contact save and consent grant in one button.
- Do not combine Kakao account link and Alimtalk consent in one button.
- Do not automatically connect phone verified to consent granted.
- Do not automatically connect capability ready to consent granted.

## 7. Capability Promotion Checklist

Before any `capability = ready` promotion:

- Provider final selection.
- Provider account created.
- Business, sender number, and sender profile requirements checked.
- Kakao channel and sender profile prepared.
- Template approved.
- SMS fallback sender number prepared.
- API key/secret stored only in server or Edge secrets, never in frontend code.
- Dry-run adapter PASS.
- One-message live test explicitly approved.
- Raw identifier and secret non-exposure reporting prepared.
- Failure, retry, and fallback policy documented.

## 8. Next PR Candidates

These are only options. This document does not choose or recommend one.

1. `fix: add phone verification dry-run flow`
2. `fix: split notification consent UI`
3. `docs: compare kakao sms providers for MVP`
4. `feat: add kakao sms dry-run adapter`
5. `docs: add capability promotion checklist`
