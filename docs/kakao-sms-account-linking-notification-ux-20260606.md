# Kakao/SMS Account Linking Notification UX

## 1. Status

PASS

## 2. Scope

Standard frontend/product integration batch only.

- Reframed the reminder settings UI around notification channels, account linking, and reminder rules.
- Kept existing Web Push controls and Scheduler v2 summary/save RPC paths.
- Added formatter-level channel/account/rule card builders for safer user-facing labels.
- Added node coverage for channel status inference, account provider labels, raw enum hiding, missing data fallback, and malformed/null no-crash behavior.

## 3. Changed files

- `src/components/reminder/ReminderSettingsPanel.jsx`
- `src/components/reminder/schedulerV2NotificationSummaryFormat.js`
- `src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- `docs/kakao-sms-account-linking-notification-ux-20260606.md`

## 4. UX direction

- Web Push role: current browser/device auxiliary notification.
- Kakao role: primary operational notification channel.
- SMS role: fallback channel when Kakao delivery is unavailable or fails.
- Email role: auxiliary notification channel.
- Account linking role: explain that Google, Kakao, and Naver logins should connect to the same PASSMAP person account so notification settings and records stay together.

## 5. UI changes

- notification channel section: shows Kakao Alimtalk, SMS, Email, and Web Push in that order with role copy and inferred statuses.
- account linking section: explains the shared `person_id` direction and shows Google/Kakao/Naver ready-state cards.
- reminder rule section: shows user-facing reminder rules without raw enum labels and notes the future Kakao/SMS-centered operating channel direction.
- disabled/ready-state actions: Kakao Alimtalk, phone verification, and Naver account linking actions are disabled ready-state pills, not active buttons.
- existing weekly reminder controls: preserved.
- existing Web Push controls/test action: preserved and visually separate from disabled future channel actions.
- existing Scheduler v2 save path: preserved, with button copy changed to `알림 규칙 저장`.

## 6. Test/build result

- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSettingsRepository.test.js`: PASS
- initial `npm run build`: blocked because the new worktree had no `node_modules` and `vite` was unavailable
- `npm ci`: failed on existing React 19 / `@react-pdf/renderer` peer dependency conflict
- `npm ci --legacy-peer-deps`: PASS, package files unchanged
- `npm run build`: PASS

Build warnings observed:

- existing mixed JSON import attribute warnings for cert rules JSON imports
- existing dynamic/static import chunking warnings
- existing chunk size warnings above 500 kB

`npm ci --legacy-peer-deps` reported existing audit findings; no dependency changes were made.

## 7. Desktop/mobile QA

- dev server: `http://127.0.0.1:5186/reject-analyzer/`
- HTTP smoke: PASS, returned `200 OK`
- desktop browser smoke: PASS for page load, nonblank content, and no Vite/React error overlay
- mobile viewport smoke: PASS for page load and no Vite/React error overlay at `390x844`
- logged-out landing state: the notification settings panel is not directly reachable without the app state/login path, so panel-specific visual QA was verified by build/test/static render path rather than a full authenticated browser flow
- manual authenticated E2E: not performed because this batch does not use a logged-in browser session or live backend data

## 8. Data access guardrail

- RPC/repository path: existing `fetchSchedulerV2NotificationSummary`, `get_current_person_notification_summary`, `saveSchedulerV2ReminderRule`, and `upsert_current_person_reminder_rule` references remain.
- raw scheduler v2 base table query: PASS, guarded `.from(...)` grep found no matches in `src`.

## 9. What was not done

- no DB apply
- no production/staging access
- no SQL migration changes
- no env/secret changes
- no provider/live send
- no cron change
- no account merge/backfill
- no real OAuth/account linking implementation
- no real Kakao/SMS send

## 10. Remaining gaps

- Authenticated browser QA should be performed once a disposable or test login flow is available in the browser session.
- Actual Kakao/SMS channel connection, phone verification, provider account linking, and consent writes remain future batches.
- Scheduler v2 write payload still stores the current Web Push-centered channel payload; this batch only reframes the UX direction without adding new write APIs.

## 11. Next recommended step

Implement the next product batch for Kakao/SMS channel connection and account linking UX wiring without provider live send or DB apply until those surfaces are explicitly approved.
