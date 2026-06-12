# Kakao Account Linking Alimtalk State UX

## 1. Status

PASS

## 2. Scope

- Adds a frontend-only Kakao Alimtalk state model.
- Separates account connection, Alimtalk consent, contact readiness, and send-readiness copy.
- Updates reminder settings UI to explain why Kakao Alimtalk may not be ready yet.
- Keeps DB schema, OAuth, provider sends, and live notification delivery out of scope.

## 3. Product direction

- Kakao: primary operating notification channel for PASSMAP reminders.
- Device notification: immediate secondary notification channel for the current browser/device.
- SMS fallback: emergency/fallback contact path only.

## 4. State machine

- not_connected: no Kakao account signal; user sees `카카오 계정 연결 필요`.
- account_ready: Kakao provider identity exists, but Alimtalk consent/contact is not complete; user sees `카카오 계정 연결됨 · 알림톡 동의 필요`.
- consent_ready: Alimtalk consent exists, but full send readiness is not complete; user sees `알림톡 수신 동의 준비됨`.
- send_ready: account, consent, and contact signals are all present; user sees `카카오 알림톡 발송 준비됨`.
- blocked: revoked, disabled, unlinked, inactive, or conflict status exists; user sees `카카오 알림톡 사용 불가`.
- unknown: no usable summary row; user sees `상태 확인 필요`.

## 5. UI changes

- Kakao channel card: now uses the state machine label, description, and disabled next-step action.
- Account linking section: Kakao copy explains that account connection and Alimtalk consent are related but separately managed.
- Disabled actions: all Kakao actions remain disabled readiness indicators; no OAuth or provider send action was implemented.

## 6. Test/build result

- `git diff --check`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS
- `node src/components/reminder/__tests__/kakaoAlimtalkStateFormat.test.js`: PASS
- `npm run build`: PASS with existing Vite warnings for import attributes, dynamic/static imports, and large chunks.
- raw base table query grep: PASS, no forbidden `.from('...')` client calls found.

## 7. Data access guardrail

- No database access was used.
- No raw scheduler v2 base table client query was added.
- No schema or migration file was changed.

## 8. What was not done

- no DB apply
- no production/staging access
- no SQL migration changes
- no env/secret changes
- no provider/live send
- no Kakao send
- no SMS send
- no OAuth/account linking
- no account merge/backfill

## 9. Remaining gaps

- The state machine infers readiness from existing summary shape only.
- Real Kakao OAuth, Alimtalk provider setup, and send eligibility checks remain future work.
- Provider send readiness is represented as UX copy only.

## 10. Next recommended step

Define the server-side Kakao account linking and Alimtalk consent contracts before enabling any active user action.
