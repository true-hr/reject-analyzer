# Scheduler v2 Summary Build/Browser QA

## 1. Status

PASS

## 2. Baseline

- PR #835 merged: yes, `f041443d29a92a9e2393dbe63e0bea8d525572c4` is present in `origin/main`
- Branch: `qa/scheduler-v2-summary-build-browser-qa-20260606`
- Commit: this PR commit

## 3. Dependency recovery

- command: `npm install --legacy-peer-deps`
- result: PASS, 558 packages installed and `node_modules/.bin/vite.cmd` restored
- package.json changed: no
- package-lock.json changed: no
- npm audit note: install reported 14 vulnerabilities; no dependency/package files were changed in this QA PR
- versions: Node `v25.6.1`, npm `11.9.0`

## 4. Build/test result

- repository/formatter test: PASS, `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`
- npm run build: PASS
- warnings: existing Vite warnings remained:
  - inconsistent JSON import attributes for `cert_rules.v0.json`
  - dynamic/static import overlap warnings for existing modules
  - chunk size warnings over 500 kB
- Playwright/automation availability: PASS, `npx playwright --version` returned `Version 1.60.0`; browser smoke used `agent-browser`

## 5. Browser QA

### 5.1 Desktop

- URL: `http://127.0.0.1:4174/reject-analyzer/`
- viewport: `1440x900`
- app loading: PASS
- Vite/React error overlay: none
- PASSMAP main UI: rendered
- settings access: PASS
- reminder panel access: PASS
- after patch, `document.documentElement.scrollWidth === window.innerWidth` at `1440`
- v2 summary section visible: yes
- page errors/console errors after patched smoke: none observed

### 5.2 Mobile

- URL: `http://127.0.0.1:4174/reject-analyzer/`
- viewport: `390x844`
- app loading: PASS
- Vite/React error overlay: none
- settings access: PASS after scrolling the offscreen settings nav button into view
- reminder panel access: PASS after scrolling the alert card into view
- v2 summary section visible: yes
- overflow: PASS, `document.documentElement.scrollWidth === window.innerWidth` at `390`
- page errors/console errors after patched smoke: none observed

### 5.3 Reminder settings panel

- weekly reminder controls remained visible and accessible
- Web Push status/control block remained visible and accessible
- scheduler v2 preview remained additive below the existing weekly reminder and Web Push sections
- logged-out state rendered the read-only v2 preview message

## 6. Patch summary

- Fixed a render crash found during real browser QA.
- Root cause: `SchedulerV2SummaryPreview` still called `asArray(rows)` after #835 moved formatter helpers out of `ReminderSettingsPanel.jsx`.
- Patch: replaced the missing helper call with `Array.isArray(rows) ? rows : []`.

## 7. Data access guardrail

- raw scheduler v2 base table query: none found in `src`
- RPC wrapper used: `fetchSchedulerV2NotificationSummary(supabase)` calls `get_current_person_notification_summary`

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

- Real authenticated populated database data was not used because DB/auth/production access remained out of scope.
- Existing Vite warnings were not addressed because they are unrelated to scheduler v2 summary browser stability.

## 10. Next recommended step

Review and merge this one-line stability patch, then rerun the same browser smoke in any authenticated QA session that can supply real scheduler v2 summary rows.
