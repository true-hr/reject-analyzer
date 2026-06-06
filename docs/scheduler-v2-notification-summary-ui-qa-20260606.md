# Scheduler v2 Notification Summary UI QA

## 1. Status

PASS

## 2. Scope

- Connected scheduler v2 notification summary loading to the existing reminder/notification settings panel.
- Added a read-only "알림 설정 v2 미리보기" section inside the existing reminder settings UI.
- Kept existing reminder preference controls and Web Push test controls intact.

## 3. Changed files

- `src/App.jsx`
- `src/components/reminder/ReminderSettingsPanel.jsx`
- `docs/scheduler-v2-notification-summary-ui-qa-20260606.md`

## 4. UI behavior

- loading: shows `알림 설정을 불러오는 중입니다...`
- empty: shows `아직 연결된 알림 설정이 없습니다.`
- error: shows `알림 설정 정보를 불러오지 못했습니다. 기존 알림 기능은 그대로 사용할 수 있습니다.`
- summary display: shows provider, contact channel, consent, reminder rule/channel, and Web Push ownership summaries for each returned person row.

## 5. Data access guardrail

- repository used: `fetchSchedulerV2NotificationSummary(supabase)`
- raw scheduler v2 base table query: none added
- RPC used: `get_current_person_notification_summary`

## 6. Test result

- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: pass
- `npm run build`: not completed because local dependencies are unavailable (`vite` command not found)

## 7. Manual QA notes

- The summary section is additive and does not replace existing weekly reminder or Web Push controls.
- When the user is logged out, the UI does not call the scheduler v2 summary RPC and shows a login-required message.
- If the RPC fails, the preview section enters error state without breaking the existing notification settings panel.

## 8. What was not done

- no DB apply
- no production/staging access
- no provider/live send
- no cron change
- no account merge/backfill
- no large UI redesign

## 9. Remaining gaps

- No real logged-in browser session QA was performed in this batch.
- Build should be rerun in an environment with project dependencies installed.
- Future UX work can polish labels and grouping after real data is available.

## 10. Next recommended step

Review the PR and then run manual authenticated QA against a disposable or approved non-production environment with representative scheduler v2 summary rows.
