# Scheduler v2 Notification Summary UI QA

## 1. Status

PARTIAL

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
- `npm run build`: pass
  - Existing Vite warnings remained: inconsistent JSON import attributes for `cert_rules.v0.json`, mixed static/dynamic imports, and large chunk warnings.

## 7. Integration QA notes

- Branch base: latest `origin/main` at `28128c13c25fbdcc78d4f38d34bffe1679b8295e`.
- Desktop smoke: Chrome CDP loaded `http://127.0.0.1:4179/reject-analyzer/`, no Vite/React error overlay, main PASSMAP home UI rendered.
- Mobile smoke: Chrome CDP loaded `http://127.0.0.1:4179/reject-analyzer/` with `390x1000` mobile metrics, no Vite/React error overlay, main PASSMAP home UI rendered.
- Logged-out state: App effect keeps scheduler v2 summary rows empty and status `idle` when `auth?.loggedIn` is false; the preview component renders the login-required branch when the reminder panel is open.
- Loading state: App sets `schedulerV2SummaryStatus` to `loading` before `fetchSchedulerV2NotificationSummary(supabase)` resolves.
- Empty state: App sets `schedulerV2SummaryStatus` to `empty` when the RPC returns an empty array.
- Error state: App clears rows, stores the error, and sets `schedulerV2SummaryStatus` to `error`; the preview keeps existing notification controls usable.
- The summary section is additive and does not replace existing weekly reminder or Web Push controls.

## 8. What was not done

- no DB apply
- no production/staging access
- no provider/live send
- no cron change
- no account merge/backfill
- no large UI redesign

## 9. Remaining gaps

- No real logged-in browser session QA was performed in this batch.
- Automated headless interaction could verify page render, but did not reliably expand the nested settings/reminder panel because the first-entry onboarding and sidebar click extraction interfered with the scripted path.
- No live non-production scheduler v2 row fixture was available in the browser session, so populated summary rendering was verified by source/data-shape review rather than real account data.
- Future UX work can polish labels and grouping after real data is available.

## 10. Next recommended step

Review the PR and then run manual authenticated QA against a disposable or approved non-production environment with representative scheduler v2 summary rows.
