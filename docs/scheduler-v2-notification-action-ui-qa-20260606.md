# Scheduler v2 Notification Action UI QA

## 1. Status

PASS

## 2. Scope

- Changed the scheduler v2 read-only preview into an action-oriented notification connection status section.
- Added channel-level status cards for Kakao Alimtalk, SMS, email, and Web Push.
- Added disabled/ready-state copy for next actions without wiring any write API.
- Preserved the existing weekly reminder controls and existing Web Push controls.
- Added formatter tests for channel status, fallback states, malformed data, next action copy, and raw developer label suppression.

## 3. Changed files

- `src/components/reminder/ReminderSettingsPanel.jsx`
- `src/components/reminder/schedulerV2NotificationSummaryFormat.js`
- `src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- `docs/scheduler-v2-notification-action-ui-qa-20260606.md`

## 4. UI changes

- section title: `알림 설정 v2 미리보기` -> `알림 연결 상태`
- channel cards: Kakao Alimtalk, SMS, email, and Web Push cards show user-facing status, description, and disabled next action.
- reminder summary: scheduler v2 reminder rules are shown in a separate `리마인드 규칙` block.
- CTA/disabled actions: all new action buttons are disabled and labeled as ready-state actions such as `카카오 알림톡 연결 준비중`, `휴대폰 인증 준비중`, and `알림 규칙 추가 준비중`.

## 5. Test/build result

- formatter/repository test: PASS, `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- npm run build: PASS
- warnings: existing Vite warnings remained:
  - inconsistent JSON import attributes for `cert_rules.v0.json`
  - dynamic/static import overlap warnings for existing modules
  - chunk size warnings over 500 kB
- Playwright version: PASS after `NODE_OPTIONS=--max-old-space-size=4096`, `Version 1.60.0`

## 6. Desktop QA

- preview server: `http://127.0.0.1:4175/reject-analyzer/`
- viewport: `1440x900`
- app loading: PASS
- Vite/React error overlay: none
- settings access: PASS
- reminder settings panel access: PASS
- v2 section visible: PASS, `알림 연결 상태`
- old preview title removed: PASS
- weekly reminder controls retained: PASS
- Web Push controls retained: PASS
- overflow: PASS, document scroll width matched viewport width

## 7. Mobile QA

- preview server: `http://127.0.0.1:4175/reject-analyzer/`
- viewport: `390x844`
- app loading: PASS
- Vite/React error overlay: none
- settings access: PASS after scrolling the offscreen settings button into view
- reminder settings panel access: PASS after scrolling the alert card into view
- v2 section visible: PASS, `알림 연결 상태`
- old preview title removed: PASS
- weekly reminder controls retained: PASS
- Web Push controls retained: PASS
- overflow: PASS, document scroll width matched viewport width

## 8. Data access guardrail

- repository/RPC used: `fetchSchedulerV2NotificationSummary(supabase)` and `get_current_person_notification_summary`
- raw scheduler v2 base table query: none found in `src`

## 9. What was not done

- no DB apply
- no production/staging access
- no SQL migration changes
- no env/secret changes
- no provider/live send
- no cron change
- no account merge/backfill
- no real settings write API

## 10. Remaining gaps

- Browser QA ran in a logged-out local session; populated channel/action card rendering is covered by formatter tests rather than authenticated live data.
- New CTA buttons are intentionally disabled and do not write settings.

## 11. Next recommended step

Wire the disabled ready-state actions to real settings flows only after the corresponding auth, contact verification, consent, and provider APIs are approved.
