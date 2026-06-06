# Scheduler v2 Notification Summary Authenticated QA

## 1. Status

PARTIAL

Repository/RPC behavior and populated summary formatting were verified. Full build and browser smoke were blocked by the local dependency install state: `vite` was not available, and dependency restoration did not complete within the retry limit.

## 2. Scope

- Rechecked the scheduler v2 notification summary repository path.
- Verified the Reminder Settings panel keeps the weekly reminder and Web Push controls, with the scheduler v2 preview rendered additively below those controls.
- Added populated and malformed sample formatting coverage for the UI summary labels.
- Polished user-facing scheduler v2 summary labels without changing data access, auth, provider sending, cron, or database behavior.

## 3. Changed files

- `src/components/reminder/ReminderSettingsPanel.jsx`
- `src/components/reminder/schedulerV2NotificationSummaryFormat.js`
- `src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- `docs/scheduler-v2-notification-summary-authenticated-qa-20260606.md`

## 4. Build/test result

- repository test: PASS, `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- populated sample/render test: PASS, included in `schedulerV2NotificationSummaryRepository.test.js`
- npm run build: BLOCKED, `vite` was not recognized as an executable in the local dependency state.
- dependency restoration: PARTIAL/BLOCKED, `npm ci` failed on an existing React 19 / `@react-pdf/renderer@3.4.5` peer dependency conflict; `npm ci --legacy-peer-deps` timed out.
- Playwright version check: PASS, `npx playwright --version` returned `Version 1.60.0`.

## 5. UI state QA

### 5.1 Logged out

Code path confirmed. The preview renders a muted read-only logged-out message and does not block the existing weekly reminder or Web Push controls.

### 5.2 Loading

Code path confirmed. `App.jsx` sets `schedulerV2SummaryStatus` to `loading` before the repository call resolves, and the panel renders a compact loading box.

### 5.3 Empty

Code path confirmed. Empty rows render the existing compact empty box and do not crash.

### 5.4 Error

Code path confirmed. Error state keeps the technical error message screen-reader only and shows a user-facing fallback note.

### 5.5 Populated sample

PASS by component-level formatting test. The required sample shape formats as:

- `알림 프로필 · 활성`
- `연결 계정: Google 활성, Kakao 활성`
- `알림 채널: 이메일 활성 1개, 문자 인증 필요 1개`
- `수신 동의: 카카오 알림톡 리마인드 동의`
- `리마인드: 업무기록 리마인드 · 평일 18:00 · 카카오 알림톡/문자 · ON`
- `Web Push: 활성 1개`

Malformed/null JSON fields were also verified not to crash the formatter.

### 5.6 Mobile

PARTIAL. Browser smoke could not be completed because build/dev tooling was unavailable. Static UI review confirmed long populated summary lines now use `break-words`, and the scheduler v2 preview remains below the primary weekly reminder and Web Push controls.

## 6. Patch summary

- Replaced raw developer-style labels like `Person active`, `kakao_alimtalk`, `experience_recall`, and `weekdays` with user-facing Korean labels.
- Moved scheduler v2 formatting into a pure helper so populated and malformed sample states can be tested without browser auth/session state.
- Preserved the existing Reminder Settings layout and kept the scheduler v2 preview additive.

## 7. Data access guardrail

- repository used: yes, `fetchSchedulerV2NotificationSummary(supabase)`
- RPC used: yes, `get_current_person_notification_summary`
- raw scheduler v2 base table query: none found in `src`

## 8. What was not done

- no DB apply
- no production/staging access
- no SQL migration changes
- no env/secret changes
- no provider/live send
- no cron change
- no account merge/backfill
- no large UI redesign

## 9. Remaining gaps

- Full `npm run build` needs a local dependency state where `vite` is installed and executable.
- Desktop/mobile browser smoke still needs to be rerun after dependency restoration.
- Real logged-in authenticated populated data rendering was not performed because no DB/auth/session access was used.

## 10. Next recommended step

Restore dependencies with the repo-approved install command, rerun `npm run build`, then run desktop/mobile smoke against a local dev server or existing authenticated QA environment.
