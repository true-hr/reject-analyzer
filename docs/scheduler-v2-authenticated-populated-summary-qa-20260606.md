# Scheduler v2 Authenticated Populated Summary QA

## 1. Status

PARTIAL

## 2. Baseline

- PR #837 merged: yes, `9cd5c83499c730278eb9f7f085ce38d4d7d32e20` is present on `origin/main`
- Branch: `qa/scheduler-v2-authenticated-populated-summary-20260606`
- Commit: pending

## 3. QA path used

- Path A / B / C: Path C
- Reason: no existing authenticated non-production browser session or approved populated disposable fixture was available in the local QA browser profile; production/staging DB access and DB writes were not used.
- Authenticated session: not verified
- Populated data: verified only through the existing populated formatter/repository fixture equivalent

## 4. Build/test result

- repository/formatter test: PASS, `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- npm run build: PASS on retry with a longer timeout
- warnings: existing Vite warnings for mixed JSON import attributes, dynamic/static imports sharing chunks, and chunks larger than 500 kB

## 5. Desktop QA

- Local dev server: `http://127.0.0.1:4199/`
- Viewport: 1365px desktop
- Result: PASS for logged-out panel render
- App rendered without React/Vite overlay.
- Settings page opened.
- Notification section opened.
- Weekly reminder controls remained visible.
- Web Push controls remained visible.
- Scheduler v2 summary preview rendered in the real notification panel.
- Logged-out state rendered the safe login-required copy.
- Horizontal overflow: not observed in the opened desktop panel.
- Console/page errors: only the existing manifest parse error was observed for `/reject-analyzer/reject-analyzer/site.webmanifest`; no scheduler v2 render crash was observed.

## 6. Mobile QA

- Viewport: 390px mobile CDP emulation
- Result: PARTIAL
- The app rendered at 390px and the settings route was reachable through the stacked rail.
- Automated mobile notification-panel opening was not completed reliably: a coordinate click first selected a neighboring rail item, and a later CDP interaction timed out.
- A separate successful mobile opened-panel screenshot/result was not produced.
- A pre-panel 390px responsive state showed horizontal overflow on the landing/stacked layout, but this was not confirmed inside the notification panel.

## 7. Summary render result

- logged out: PASS on desktop real panel
- loading: not observed in browser because no authenticated session was available
- empty: not observed in browser because no authenticated session was available
- error: not observed in browser because no authenticated session was available
- populated: PASS at fixture/component formatter level through `schedulerV2NotificationSummaryRepository.test.js`; not verified in an authenticated browser session

## 8. Patch summary

- No runtime patch was applied.
- QA documentation was added to record the completed and blocked evidence.

## 9. Data access guardrail

- repository/RPC used: yes, source uses `fetchSchedulerV2NotificationSummary(supabase)` and `get_current_person_notification_summary`
- raw scheduler v2 base table query: no matches in `src` for the guarded base-table `.from(...)` patterns

## 10. What was not done

- no DB apply
- no production/staging access
- no SQL migration changes
- no env/secret changes
- no provider/live send
- no cron change
- no account merge/backfill
- no real settings write API
- no large UI redesign

## 11. Remaining gaps

- Actual authenticated browser session QA remains incomplete.
- Actual populated summary row from a non-production authenticated session remains incomplete.
- Mobile notification panel opened-state QA remains incomplete due CDP automation timeout.

## 12. Next recommended step

Use an already-approved disposable/non-production authenticated session with existing scheduler v2 populated summary rows, then repeat the desktop and mobile notification-panel flow without adding production debug hooks or writing database data.
